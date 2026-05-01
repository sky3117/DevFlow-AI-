/**
 * Parses a GitHub repository full name into owner and repo parts.
 * Example: "octocat/hello-world" → { owner: "octocat", repo: "hello-world" }
 */
export function parseRepoFullName(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid repository full name: ${fullName}`);
  }
  return { owner, repo };
}

/**
 * Builds the GitHub API base URL for a repository
 */
export function buildRepoApiUrl(owner: string, repo: string): string {
  return `https://api.github.com/repos/${owner}/${repo}`;
}

/**
 * Builds the GitHub PR API URL
 */
export function buildPrApiUrl(owner: string, repo: string, prNumber: number): string {
  return `${buildRepoApiUrl(owner, repo)}/pulls/${prNumber}`;
}

/**
 * Extracts PR number from a GitHub PR URL
 * Example: "https://github.com/owner/repo/pull/123" → 123
 */
export function extractPrNumber(prUrl: string): number {
  const match = prUrl.match(/\/pull\/(\d+)/);
  if (!match) throw new Error(`Cannot extract PR number from URL: ${prUrl}`);
  return parseInt(match[1], 10);
}

/**
 * Returns GitHub API authorization headers
 */
export function getGitHubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/**
 * Gets the diff Accept header for fetching PR diffs
 */
export function getDiffHeaders(token: string): Record<string, string> {
  return {
    ...getGitHubHeaders(token),
    Accept: 'application/vnd.github.diff',
  };
}
