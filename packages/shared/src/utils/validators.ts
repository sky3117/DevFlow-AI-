/**
 * Validates an email address (basic format check)
 */
export function isValidEmail(email: string): boolean {
  // Uses bounded quantifiers to avoid ReDoS
  const emailRegex = /^[a-zA-Z0-9._%+\-]{1,64}@[a-zA-Z0-9.\-]{1,253}\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validates a GitHub repository name (owner/repo format)
 */
export function isValidGithubRepo(repo: string): boolean {
  const repoRegex = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
  return repoRegex.test(repo);
}

/**
 * Validates a PR number
 */
export function isValidPrNumber(prNumber: number): boolean {
  return Number.isInteger(prNumber) && prNumber > 0;
}

/**
 * Validates a score (0-100)
 */
export function isValidScore(score: number): boolean {
  return Number.isFinite(score) && score >= 0 && score <= 100;
}

/**
 * Sanitizes a string for safe output (strips HTML)
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validates that an object has all required keys
 */
export function hasRequiredKeys<T extends object>(
  obj: Partial<T>,
  keys: (keyof T)[]
): obj is T {
  return keys.every(key => key in obj && obj[key] !== undefined && obj[key] !== null);
}
