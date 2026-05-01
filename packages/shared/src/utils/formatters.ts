import type { ApiResponse, ClaudeReviewResponse, ReviewIssue } from '../types.js';

/**
 * Creates a standardized API success response
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

/**
 * Creates a standardized API error response
 */
export function errorResponse(error: string, message?: string): ApiResponse {
  return { success: false, error, message };
}

/**
 * Formats a code review as a GitHub PR comment markdown string
 */
export function formatReviewAsMarkdown(review: ClaudeReviewResponse): string {
  const scoreEmoji = review.score >= 80 ? '🟢' : review.score >= 60 ? '🟡' : '🔴';
  const approvedBadge = review.approved
    ? '✅ **Approved**'
    : '❌ **Changes Requested**';

  const issuesByPriority = [...review.issues].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    return order[a.severity] - order[b.severity];
  });

  const issuesMarkdown = issuesByPriority.length === 0
    ? '*No issues found! Clean code* 🎉'
    : issuesByPriority
        .map((issue) => formatIssueMarkdown(issue))
        .join('\n\n');

  return `## 🤖 DevFlow AI Code Review

${approvedBadge} | ${scoreEmoji} **Score: ${review.score}/100**

### Summary
${review.summary}

### Issues Found (${review.issues.length})

${issuesMarkdown}

---
*Powered by [DevFlow AI](https://devflow.ai) using Claude AI*`;
}

/**
 * Formats a single review issue as markdown
 */
function formatIssueMarkdown(issue: ReviewIssue): string {
  const severityEmoji: Record<ReviewIssue['severity'], string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🔵',
    info: 'ℹ️',
  };

  return `#### ${severityEmoji[issue.severity]} ${issue.severity.toUpperCase()} — \`${issue.file}\` (line ${issue.line})
**Issue:** ${issue.message}
**Suggestion:** ${issue.suggestion}`;
}

/**
 * Truncates a string to the given max length, appending ellipsis if needed
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}
