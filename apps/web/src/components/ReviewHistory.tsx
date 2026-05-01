interface ReviewHistoryItem {
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

interface ReviewHistoryProps {
  reviews: ReviewHistoryItem[];
  loading: boolean;
  error?: string;
  onRefresh: () => void;
}

export function ReviewHistory({ reviews, loading, error, onRefresh }: ReviewHistoryProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Review History</h2>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-slate-400">Loading reviews...</p>}
      {error && <p className="text-rose-400">{error}</p>}

      {!loading && !error && reviews.length === 0 && (
        <p className="text-slate-400">No reviews yet. Open a PR to get started.</p>
      )}

      <div className="space-y-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-left"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <a
                href={review.prUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-emerald-300 hover:text-emerald-200"
              >
                {review.repoName} #{review.prNumber}
              </a>
              <span className="text-sm text-slate-400">
                {new Date(review.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span>Score: {review.score}</span>
              <span>Issues: {review.issueCount}</span>
              <span className={review.approved ? 'text-emerald-300' : 'text-rose-300'}>
                {review.approved ? 'Approved' : 'Changes Requested'}
              </span>
            </div>
            <p className="mt-3 text-slate-200">{review.summary}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
