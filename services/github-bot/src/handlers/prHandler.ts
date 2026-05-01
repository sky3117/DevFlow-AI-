import axios from 'axios';
import { prisma } from '@devflow/db';
import {
  formatReviewAsMarkdown,
  getDiffHeaders,
  getGitHubHeaders,
  estimateTokens,
  truncate,
  type GitHubPREvent,
  type ClaudeReviewResponse,
} from '@devflow/shared';
import { logger } from '../config/logger.js';

/**
 * Handles GitHub pull_request webhook events:
 * 1. Fetches the PR diff
 * 2. Sends to AI service for Claude review
 * 3. Posts formatted review as PR comment
 * 4. Persists review in database
 */
export async function handlePRWebhook(event: GitHubPREvent): Promise<void> {
  const { pull_request: pr, repository } = event;
  const owner = repository.owner.login;
  const repo = repository.name;
  const prNumber = pr.number;

  logger.info('Handling PR event', { owner, repo, prNumber, action: event.action });

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    logger.warn('GITHUB_TOKEN not set — skipping diff fetch');
    return;
  }

  try {
    // Step 1: Fetch PR diff
    const diffResponse = await axios.get(pr.diff_url, {
      headers: getDiffHeaders(githubToken),
      responseType: 'text',
    });

    const diff = diffResponse.data as string;
    const maxChars = 32000;
    const truncatedDiff =
      diff.length > maxChars
        ? diff.slice(0, maxChars) + '\n\n[... diff truncated ...]'
        : diff;

    logger.info('Diff fetched', { chars: diff.length, tokens: estimateTokens(truncatedDiff) });

    // Step 2: Call AI service
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const reviewResponse = await axios.post(`${aiUrl}/review`, {
      diff: truncatedDiff,
      pr_title: pr.title,
      pr_description: pr.body ?? '',
      repo_name: repository.full_name,
    });

    const review = reviewResponse.data as ClaudeReviewResponse;
    logger.info('Review received', { score: review.score, issues: review.issues.length });

    // Step 3: Post comment to GitHub
    const comment = formatReviewAsMarkdown(review);
    await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`,
      { body: comment },
      { headers: getGitHubHeaders(githubToken) }
    );
    logger.info('Review comment posted', { prNumber });

    // Step 4: Persist to database
    const org = await prisma.organization.findUnique({ where: { githubOrg: owner } });
    if (org) {
      await prisma.review.create({
        data: {
          orgId: org.id,
          prUrl: pr.html_url,
          prNumber,
          repoName: repository.full_name,
          score: review.score,
          issuesJson: review.issues as any,
          summary: truncate(review.summary, 1000),
          approved: review.approved,
        },
      });
      await prisma.apiUsage.create({
        data: { orgId: org.id, tokensUsed: estimateTokens(truncatedDiff), feature: 'review' },
      });
    }
  } catch (err) {
    logger.error('PR handler failed', {
      owner,
      repo,
      prNumber,
      error: (err as Error).message,
    });
    throw err;
  }
}
