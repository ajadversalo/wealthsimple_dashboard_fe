'use client';

import { useEffect, useState } from 'react';

interface CashSecuredPutCandidate {
  symbol: string;
  price: number;
  expiry: string;
  dte: number;
  strike: number;
  premium: number;
  yield_pct: number;
  otm_pct: number;
  quality: number;
  option: number;
  score: number;
  rank: number;
}

interface CashSecuredPutsPayload {
  updated_at: string;
  candidate_count: number;
  candidates: CashSecuredPutCandidate[];
}

const SCREENER_URL = process.env.NEXT_PUBLIC_CASH_SECURED_PUTS_SCREENER_API_URL;

const currency = (value: number) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function CashSecuredPutsScreener() {
  const [data, setData] = useState<CashSecuredPutsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCandidates = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!SCREENER_URL) {
        throw new Error('NEXT_PUBLIC_CASH_SECURED_PUTS_SCREENER_API_URL is not configured');
      }

      const response = await fetch(SCREENER_URL, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      setData(await response.json() as CashSecuredPutsPayload);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-white">Cash-Secured Put Screener</h2>
          <p className="text-xs text-slate-400 mt-1">
            {data
              ? `${data.candidate_count} ranked candidates · Updated ${new Date(data.updated_at).toLocaleString()}`
              : 'Ranked cash-secured put opportunities'}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchCandidates}
          disabled={loading}
          className="self-start px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors text-xs disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && !data ? (
        <div className="border border-red-800 bg-red-950/40 rounded-lg p-4 text-sm text-red-300">
          Could not load screener candidates: {error}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[840px]">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="pb-3 font-semibold w-12">Rank</th>
                <th className="pb-3 font-semibold">Ticker</th>
                <th className="pb-3 font-semibold text-right">Price</th>
                <th className="pb-3 font-semibold text-right">Strike</th>
                <th className="pb-3 font-semibold text-right">Premium</th>
                <th className="pb-3 font-semibold text-right">Yield</th>
                <th className="pb-3 font-semibold text-right">OTM</th>
                <th className="pb-3 font-semibold text-right">Quality</th>
                <th className="pb-3 font-semibold text-right">Option</th>
                <th className="pb-3 font-semibold text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {data?.candidates.map((candidate) => (
                <tr key={`${candidate.symbol}-${candidate.expiry}-${candidate.strike}`} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 text-slate-500">#{candidate.rank}</td>
                  <td className="py-3 font-bold text-white font-sans">{candidate.symbol}</td>
                  <td className="py-3 text-right text-slate-300">{currency(candidate.price)}</td>
                  <td className="py-3 text-right text-slate-300">{currency(candidate.strike)}</td>
                  <td className="py-3 text-right text-emerald-400 font-semibold">{currency(candidate.premium)}</td>
                  <td className="py-3 text-right text-emerald-400">{candidate.yield_pct.toFixed(2)}%</td>
                  <td className="py-3 text-right text-slate-300">{candidate.otm_pct.toFixed(2)}%</td>
                  <td className="py-3 text-right text-cyan-400">{candidate.quality.toFixed(0)}</td>
                  <td className="py-3 text-right text-indigo-400">{candidate.option.toFixed(2)}</td>
                  <td className="py-3 text-right">
                    <span className="inline-flex min-w-10 justify-center rounded-md border border-amber-800 bg-amber-950 px-1.5 py-0.5 text-amber-400 font-semibold">
                      {candidate.score.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
              {loading && !data && (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 font-sans">Loading candidates...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
