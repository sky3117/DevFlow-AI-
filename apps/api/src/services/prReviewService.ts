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
import { assertAiUsageAllowed } from './planLimits.js';

/**
 * Handles a GitHub pull_request webhook event:
 * 1. Fetches the PR diff from GitHub API
 * 2. Sends it to the Claude AI service for review
 * 3. Posts the review as a GitHub PR comment
 * 4. Stores the review in the database
 */
export async function handlePullRequestEvent(event: GitHubPREvent): Promise<void> {
  const { pull_request: pr, repository } = event;
  const owner = repository.owner.login;
  const repo = repository.name;
  const prNumber = pr.number;

  logger.info('Processing PR review', { owner, repo, prNumber });

  try {
    // ── 1. Fetch PR diff ──────────────────────────────────────────────────
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      logger.warn('GITHUB_TOKEN not set; skipping PR diff fetch');
      return;
    }

    // Validate diff_url is a GitHub URL before fetching
    const diffUrl = new URL(pr.diff_url);
    if (diffUrl.hostname !== 'github.com' && diffUrl.hostname !== 'api.github.com') {
      logger.error('Invalid diff_url hostname in PR event', { hostname: diffUrl.hostname });
      return;
    }

    const diffResponse = await axios.get(diffUrl.toString(), {
      headers: getDiffHeaders(githubToken),
      responseType: 'text',
    });

    const diff = diffResponse.data as string;

    // Truncate very large diffs to avoid token limit issues
    const maxDiffChars = 32000; // ~8000 tokens
    const truncatedDiff =
      diff.length > maxDiffChars
        ? diff.slice(0, maxDiffChars) + '\n\n[... diff truncated for review ...]'
        : diff;

    const tokensEstimate = estimateTokens(truncatedDiff);
    logger.info('Diff fetched', { prNumber, chars: diff.length, tokensEstimate });

    // ── 2. Enforce plan limits before AI review ──────────────────────────
    const org = await prisma.organization.findUnique({
      where: { githubOrg: owner },
    });

    if (!org) {
      logger.warn('Organization not found in DB, skipping AI review', { githubOrg: owner });
      return;
    }

    try {
      await assertAiUsageAllowed(org.id, 'code_review');
    } catch (err) {
      logger.warn('Plan limits blocked AI review', {
        orgId: org.id,
        reason: (err as Error).message,
      });
      return;
    }

    // ── 3. Call AI service for review ─────────────────────────────────────
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    const reviewResponse = await axios.post(`${aiServiceUrl}/review`, {
      diff: truncatedDiff,
      pr_title: pr.title,
      pr_description: pr.body ?? '',
      repo_name: repository.full_name,
    });

    const review = reviewResponse.data as ClaudeReviewResponse;
    logger.info('Review generated', { prNumber, score: review.score, approved: review.approved });

    // ── 4. Post review comment to GitHub ─────────────────────────────────
    // Validate owner/repo contain only safe characters to prevent path injection
    if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) {
      logger.error('Invalid owner or repo name in PR event', { owner, repo });
      return;
    }
    const commentBody = formatReviewAsMarkdown(review);
    await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`,
      { body: commentBody },
      { headers: getGitHubHeaders(githubToken) }
    );

    logger.info('Review comment posted to GitHub', { prNumber });

    // ── 5. Store review in database ──────────────────────────────────────
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

    // Track API usage
    await prisma.apiUsage.create({
      data: { orgId: org.id, tokensUsed: tokensEstimate, feature: 'review' },
    });
  } catch (err) {
    logger.error('Error processing PR review', {
      owner,
      repo,
      prNumber,
      error: (err as Error).message,
      stack: (err as Error).stack,
    });
    throw err; // Re-throw so webhook handler can log to webhook_logs
  }
}
