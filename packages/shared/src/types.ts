// ─── Claude AI Response Types ────────────────────────────────────────────────

export interface ReviewIssue {
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  suggestion: string;
}

export interface ClaudeReviewResponse {
  score: number; // 0-100
  issues: ReviewIssue[];
  summary: string;
  approved: boolean;
}

export interface ClaudeDocsResponse {
  docs: string;
  coverage: number; // 0-100 percentage
  functions: string[];
}

// ─── PR Data Types ────────────────────────────────────────────────────────────

export interface PullRequestData {
  number: number;
  title: string;
  body: string | null;
  url: string;
  diff: string;
  repoName: string;
  repoOwner: string;
  author: string;
  baseBranch: string;
  headBranch: string;
}

// ─── Webhook Payload Types ────────────────────────────────────────────────────

export interface GitHubPREvent {
  action: 'opened' | 'reopened' | 'synchronize' | 'closed';
  number: number;
  pull_request: {
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    diff_url: string;
    base: { ref: string; repo: { full_name: string; owner: { login: string } } };
    head: { ref: string; sha: string };
    user: { login: string };
  };
  repository: {
    full_name: string;
    name: string;
    owner: { login: string };
  };
  installation?: { id: number };
}

// ─── API Request/Response Types ───────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DocsGenerateRequest {
  code: string;
  language: string;
  style: 'jsdoc' | 'docstring' | 'markdown';
}

export interface ReviewHistoryItem {
  id: string;
  prUrl: string;
  prNumber: number;
  repoName: string;
  score: number;
  summary: string;
  approved: boolean;
  issueCount: number;
  createdAt: string;
}

// ─── Plan Limits ──────────────────────────────────────────────────────────────

export interface PlanLimits {
  maxSeats: number;
  maxReviewsPerMonth: number | null; // null = unlimited
  features: string[];
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  STARTER: {
    maxSeats: 5,
    maxReviewsPerMonth: 100,
    features: ['code_review', 'docs'],
  },
  PRO: {
    maxSeats: 25,
    maxReviewsPerMonth: null,
    features: ['code_review', 'docs', 'bug_scan', 'priority_support'],
  },
  ENTERPRISE: {
    maxSeats: Infinity,
    maxReviewsPerMonth: null,
    features: ['code_review', 'docs', 'bug_scan', 'priority_support', 'sso', 'audit_logs'],
  },
};
