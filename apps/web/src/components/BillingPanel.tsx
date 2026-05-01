import { useState } from 'react';
import { createCheckoutSession } from '../lib/api';

interface BillingPanelProps {
  token: string;
}

export function BillingPanel({ token }: BillingPanelProps) {
  const [plan, setPlan] = useState<'starter' | 'pro' | 'enterprise'>('starter');
  const [seats, setSeats] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleCheckout(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(undefined);

    try {
      if (!Number.isFinite(seats) || seats < 1) {
        throw new Error('Seats must be at least 1');
      }
      const result = await createCheckoutSession(token, { plan, seats });
      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error('Stripe checkout URL not available');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Billing</h2>
      <form onSubmit={handleCheckout} className="space-y-4 rounded-xl bg-slate-900 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Plan</label>
            <select
              value={plan}
              onChange={(event) => setPlan(event.target.value as typeof plan)}
              className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm"
            >
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Seats</label>
            <input
              type="number"
              min={1}
              value={seats}
              onChange={(event) => setSeats(Number(event.target.value))}
              className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-indigo-400 disabled:opacity-60"
        >
          {loading ? 'Redirecting…' : 'Open Stripe Checkout'}
        </button>
        {error && <p className="text-rose-400">{error}</p>}
      </form>
    </section>
  );
}
