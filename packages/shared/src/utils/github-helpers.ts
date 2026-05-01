/**
 * GitHub API base URL and utility functions
 */
export const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Creates standard GitHub API headers with authentication
 */
export function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/**
 * Creates headers to fetch PR diff
 */
export function githubDiffHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3.diff',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/**
 * Extracts owner and repo from a GitHub repository URL
 */
export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  // Uses bounded character classes to avoid ReDoS
  const match = url.match(/github\.com[/:]([a-zA-Z0-9_.-]{1,100})\/([a-zA-Z0-9_.-]{1,100})/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace('.git', '') };
}

/**
 * Builds a GitHub PR URL
 */
export function buildPrUrl(owner: string, repo: string, prNumber: number): string {
  return `https://github.com/${owner}/${repo}/pull/${prNumber}`;
}

/**
 * Builds GitHub API URL for PR details
 */
export function buildPrApiUrl(owner: string, repo: string, prNumber: number): string {
  return `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}`;
}

/**
 * Builds GitHub API URL for PR comments
 */
export function buildPrCommentsApiUrl(owner: string, repo: string, prNumber: number): string {
  return `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${prNumber}/comments`;
}
