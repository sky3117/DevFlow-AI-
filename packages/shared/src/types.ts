// Core domain types for DevFlow AI

export interface Organization {
  id: string;
  name: string;
  github_org: string;
  plan: 'starter' | 'pro' | 'enterprise';
  seats: number;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  org_id: string;
  github_id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: 'admin' | 'member';
  created_at: Date;
  updated_at: Date;
}

export interface Review {
  id: string;
  org_id: string;
  pr_url: string;
  pr_number: number;
  score: number;
  issues_json: ReviewIssue[];
  summary: string;
  approved: boolean;
  created_at: Date;
}

export interface ReviewIssue {
  type: 'bug' | 'security' | 'performance' | 'style' | 'maintainability';
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
}

export interface ClaudeReviewResponse {
  score: number;
  approved: boolean;
  summary: string;
  issues: ReviewIssue[];
  suggestions: string[];
}

export interface DocsGenerated {
  id: string;
  user_id: string;
  language: string;
  style: 'jsdoc' | 'docstring' | 'markdown';
  tokens_used: number;
  created_at: Date;
}

export interface BugScan {
  id: string;
  org_id: string;
  files_scanned: number;
  bugs_found: number;
  risk_score: number;
  created_at: Date;
}

export interface WebhookLog {
  id: string;
  org_id: string;
  event_type: string;
  payload_json: Record<string, unknown>;
  status: 'success' | 'failed';
  error_message?: string;
  created_at: Date;
}

export interface ApiUsage {
  id: string;
  org_id: string;
  tokens_used: number;
  endpoint: string;
  created_at: Date;
}

export interface PRData {
  number: number;
  title: string;
  url: string;
  diff: string;
  base_branch: string;
  head_branch: string;
  author: string;
  repo_owner: string;
  repo_name: string;
}

export interface DocumentationRequest {
  code: string;
  language: string;
  style: 'jsdoc' | 'docstring' | 'markdown';
  context?: string;
}

export interface DocumentationResponse {
  documentation: string;
  tokens_used: number;
  language: string;
  style: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}
