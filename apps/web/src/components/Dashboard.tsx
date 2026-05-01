import { useEffect, useState } from 'react';
import { API_BASE, fetchReviewHistory } from '../lib/api';
import { clearToken, getToken } from '../lib/auth';
import { DocsGenerator } from './DocsGenerator';
import { ReviewHistory } from './ReviewHistory';
import { BillingPanel } from './BillingPanel';

type TabKey = 'reviews' | 'docs' | 'billing';

export function Dashboard() {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [activeTab, setActiveTab] = useState<TabKey>('reviews');
  const [reviews, setReviews] = useState<Awaited<ReturnType<typeof fetchReviewHistory>>['reviews']>(
    []
  );
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState<string | undefined>();

  useEffect(() => {
    if (token) {
      void refreshReviews();
    }
  }, [token]);

  async function refreshReviews() {
    if (!token) return;
    setLoadingReviews(true);
    setReviewError(undefined);
    try {
      const data = await fetchReviewHistory(token);
      setReviews(data.reviews);
    } catch (err) {
      setReviewError((err as Error).message);
    } finally {
      setLoadingReviews(false);
    }
  }

  function handleLogout() {
    clearToken();
    setTokenState(null);
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center">
          <h1 className="text-4xl font-semibold">DevFlow AI</h1>
          <p className="text-slate-300">
            Connect your GitHub account to start AI code reviews, auto documentation, and billing
            management.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.href = `${API_BASE}/api/v1/auth/github`;
            }}
            className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Sign in with GitHub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">DevFlow AI</h1>
            <p className="text-sm text-slate-400">AI-powered developer productivity</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <nav className="flex flex-wrap gap-2">
          {([
            { key: 'reviews', label: 'Review History' },
            { key: 'docs', label: 'Auto Docs' },
            { key: 'billing', label: 'Billing' },
          ] as Array<{ key: TabKey; label: string }>).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                activeTab === tab.key
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'reviews' && (
          <ReviewHistory
            reviews={reviews}
            loading={loadingReviews}
            error={reviewError}
            onRefresh={refreshReviews}
          />
        )}

        {activeTab === 'docs' && <DocsGenerator token={token} />}
        {activeTab === 'billing' && <BillingPanel token={token} />}
      </main>
    </div>
  );
}
