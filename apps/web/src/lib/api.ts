export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function exchangeGithubCode(code: string) {
  return apiRequest<{ token: string; user: { id: string; email?: string | null } }>(
    '/api/v1/auth/github/callback',
    {
      method: 'POST',
      body: JSON.stringify({ code }),
    }
  );
}

export async function fetchReviewHistory(token: string) {
  return apiRequest<{
    reviews: Array<{
      id: string;
      prUrl: string;
      prNumber: number;
      repoName: string;
      score: number;
      summary: string;
      approved: boolean;
      issueCount: number;
      createdAt: string;
    }>;
    total: number;
  }>('/api/v1/reviews', { method: 'GET' }, token);
}

export async function generateDocs(
  token: string,
  payload: { code: string; language: string; style: 'jsdoc' | 'docstring' | 'markdown' }
) {
  return apiRequest<{ docs: string; coverage: number; functions: string[] }>(
    '/api/v1/docs/generate',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );
}

export async function createCheckoutSession(
  token: string,
  payload: { plan: 'starter' | 'pro' | 'enterprise'; seats: number }
) {
  return apiRequest<{ url: string | null }>('/api/v1/billing/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token);
}

async function apiRequest<T>(path: string, options: RequestInit, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Request failed');
  }

  return data.data as T;
}
