// ─── Token Limits ─────────────────────────────────────────────────────────────
export const MAX_DIFF_TOKENS = 8000;
export const MAX_CODE_TOKENS = 4000;
export const MAX_TOTAL_TOKENS = 100000;

// ─── Claude Model ─────────────────────────────────────────────────────────────
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
export const CLAUDE_MAX_TOKENS = 4096;

// ─── Plan Limits ──────────────────────────────────────────────────────────────
export const STARTER_MAX_REVIEWS_PER_MONTH = 100;
export const PRO_MAX_REVIEWS_PER_MONTH = null; // unlimited
export const ENTERPRISE_MAX_REVIEWS_PER_MONTH = null; // unlimited

// ─── Rate Limiting ────────────────────────────────────────────────────────────
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 100;

// ─── API Paths ────────────────────────────────────────────────────────────────
export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

// ─── Severity Order ───────────────────────────────────────────────────────────
export const SEVERITY_ORDER = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
} as const;
