'use client';

import { useEffect, useState } from 'react';

interface ScreenerCandidate {
  symbol: string;
  price: number;
  quality: number;
  score: number;
}

interface ScreenerPayload {
  candidates: ScreenerCandidate[];
}

const SCREENER_URL = process.env.NEXT_PUBLIC_CASH_SECURED_PUTS_SCREENER_API_URL;

export default function MiniCashSecuredPutsScreener() {
  const [candidates, setCandidates] = useState<ScreenerCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        if (!SCREENER_URL) throw new Error('Screener API is not configured');

        const response = await fetch(SCREENER_URL, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const result = await response.json() as ScreenerPayload;
        setCandidates(result.candidates);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Unable to load screener');
      }
    };

    loadCandidates();
  }, []);

  return (
    <div className="sm:col-span-2 h-[146px] bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">CSP Screener</p>
        <span className="text-[10px] text-slate-500 font-mono">Top picks</span>
      </div>

      {error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : candidates.length === 0 ? (
        <p className="text-xs text-slate-500 animate-pulse">Loading candidates...</p>
      ) : (
        <div className="min-h-0 overflow-y-auto pr-1">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-900 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="pb-1 text-left font-medium">Ticker</th>
                <th className="pb-1 text-right font-medium">Price</th>
                <th className="pb-1 text-right font-medium">Quality</th>
                <th className="pb-1 text-right font-medium">Score</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {candidates.map((candidate) => (
                <tr key={candidate.symbol} className="border-t border-slate-800/60">
                  <td className="py-1.5 font-sans font-semibold text-white">{candidate.symbol}</td>
                  <td className="py-1.5 text-right text-slate-300">${candidate.price.toFixed(2)}</td>
                  <td className="py-1.5 text-right text-cyan-400">{candidate.quality}</td>
                  <td className="py-1.5 text-right text-amber-400">{candidate.score.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
