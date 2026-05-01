export const PLANS = {
  STARTER: 'starter',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export const ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

export const REVIEW_STATUS = {
  APPROVED: 'approved',
  CHANGES_REQUESTED: 'changes_requested',
  PENDING: 'pending',
} as const;

export const ISSUE_TYPES = {
  BUG: 'bug',
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  STYLE: 'style',
  MAINTAINABILITY: 'maintainability',
} as const;

export const SEVERITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export const DOC_STYLES = {
  JSDOC: 'jsdoc',
  DOCSTRING: 'docstring',
  MARKDOWN: 'markdown',
} as const;

export const PLAN_LIMITS = {
  starter: {
    seats: 5,
    reviews_per_month: 100,
    tokens_per_month: 500_000,
  },
  pro: {
    seats: 25,
    reviews_per_month: 1000,
    tokens_per_month: 5_000_000,
  },
  enterprise: {
    seats: -1, // unlimited
    reviews_per_month: -1,
    tokens_per_month: -1,
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;
