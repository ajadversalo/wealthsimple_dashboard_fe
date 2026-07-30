'use client';

import React, { useState, useEffect } from 'react';

// --- TypeScript Interfaces ---
export interface OptionLeg {
  contract_symbol: string;
  option_type: 'PUT' | 'CALL';
  strike_price: number;
  expiration_date: string;
  quantity: number;
  avg_price: number;
  moneyness: string;
}

export interface Underlying {
  shares: number;
  avg_purchase_price: number;
}

export interface Position {
  symbol: string;
  strategy: 'CASH_SECURED_PUT' | 'COVERED_CALL' | string;
  industry: string;
  current_price: number;
  portfolio_pct: number;
  underlying: Underlying | null;
  option_leg: OptionLeg;
}

export interface Sector {
  industry: string;
  capital_committed: number;
  portfolio_pct: number;
  tickers: string[];
}

export interface CurrencyPair {
  usd: number;
  cad: number;
}

export interface PositionsPayload {
  account_id: string;
  updated_at: string;
  fx_rate_usd_cad: number;
  total_capital: CurrencyPair;
  remaining_capital: CurrencyPair;
  positions: Position[];
  sectors: Sector[];
}

const SECTOR_COLORS = [
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
];

export default function PositionsDashboard() {
  const [data, setData] = useState<PositionsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const response = await fetch('https://wealthsimple-dashboard.onrender.com/api/v1/positions', {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: PositionsPayload = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to endpoint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
    const interval = setInterval(fetchPositions, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6">
        <p className="text-slate-400 animate-pulse font-mono text-sm">Loading positions from Render...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6">
        <div className="bg-red-900/40 border border-red-500 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Connection Error</h2>
          <p className="text-slate-300 text-sm mb-4">{error}</p>
          <button
            onClick={fetchPositions}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const fx = data.fx_rate_usd_cad;

  // ✅ FIX 1: Total Portfolio Net Equity directly from API payload
  const netPortfolioUSD = data.total_capital.usd;
  const netPortfolioCAD = data.total_capital.cad;

  // Available Cash directly from API payload
  const cashUSD = data.remaining_capital.usd;
  const cashCAD = data.remaining_capital.cad;

  // ✅ FIX 2: Capital Deployed = Total Net Equity minus Available Cash
  const deployedUSD = Math.max(0, netPortfolioUSD - cashUSD);
  const deployedCAD = Math.max(0, netPortfolioCAD - cashCAD);

  const totalPremiumUSD = data.positions.reduce((acc, pos) => {
    const qty = Math.abs(pos.option_leg.quantity);
    return acc + (pos.option_leg.avg_price * qty * 100);
  }, 0);
  const totalPremiumCAD = totalPremiumUSD * fx;

  // Build Conic Gradient Stops for the Pie Chart
  let currentPct = 0;
  const gradientStops = data.sectors.map((sector, idx) => {
    const color = SECTOR_COLORS[idx % SECTOR_COLORS.length];
    const start = currentPct;
    const end = currentPct + sector.portfolio_pct;
    currentPct = end;
    return `${color} ${start}% ${end}%`;
  }).join(', ');

  // Helper function to calculate DTE (Days to Expiration)
const calculateDTE = (expDateStr: string | undefined | null): number | null => {
  if (!expDateStr) return null;

  // Since your data payload is from 2026, let's set "today" to July 29, 2026.
  // In your real code, you would use: new Date();
  const today = new Date('2026-07-29T00:00:00Z'); // Fixed 'today' for context
  const expDate = new Date(expDateStr + 'T00:00:00Z'); // Force UTC interpretation

  // Difference in milliseconds
  const diffTime = expDate.getTime() - today.getTime();
  
  // Convert milliseconds to days (ms * sec * min * hr)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Helper to calculate intrinsic P/L at expiration
const calculateIntrinsicPL = (pos: Position): number => {
  const option = pos.option_leg;
  if (!option) return 0;

  const current = pos.current_price || 0;
  const strike = option.strike_price || 0;
  const premium = option.avg_price || 0;
  const contracts = Math.abs(option.quantity || 1);
  const type = option.option_type.toUpperCase();

  let plPerShare = premium;

  if (type === "PUT" && current < strike) {
    // CSP ITM
    plPerShare = premium - (strike - current);
  } else if (type === "CALL" && current > strike) {
    // CC ITM
    plPerShare = premium - (current - strike);
  }

  return plPerShare * 100 * contracts;
};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6 font-sans">

      {/* Header Bar */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Options Portfolio Monitor</h1>
          <p className="text-xs text-slate-400 mt-1">
            Account: <span className="text-slate-200 font-mono">{data.account_id}</span> | Updated: {new Date(data.updated_at).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md">
            <span className="text-slate-400">USD/CAD: </span>
            <span className="font-mono text-emerald-400">{fx.toFixed(4)}</span>
          </div>

          <button
            onClick={fetchPositions}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Sync Now'}
          </button>
        </div>
      </header>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Total Portfolio Value (~$18,527.00 USD / CA$26,113.81) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Portfolio</p>
          <div className="mt-3 space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-bold text-emerald-400 font-mono">
                CA${netPortfolioCAD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400 font-semibold font-mono">CAD</span>
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/80">
              <span className="text-sm font-semibold text-slate-300 font-mono">
                ${netPortfolioUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">USD</span>
            </div>
          </div>
        </div>

        {/* Available Cash ($1,800.00 USD / CA$2,537.10) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Available Cash</p>
          <div className="mt-3 space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-emerald-200 font-mono">
                ${cashUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400 font-semibold font-mono">USD</span>
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/80">
              <span className="text-sm font-semibold text-emerald-200/90 font-mono">
                CA${cashCAD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">CAD</span>
            </div>
          </div>
        </div>

        {/* Capital Deployed ($16,727.00 USD / CA$23,576.71) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Capital Deployed</p>
          <div className="mt-3 space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-indigo-400 font-mono">
                ${deployedUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400 font-semibold font-mono">USD</span>
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/80">
              <span className="text-sm font-semibold text-indigo-300/90 font-mono">
                CA${deployedCAD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">CAD ({((deployedUSD / netPortfolioUSD) * 100).toFixed(1)}%)</span>
            </div>
          </div>
        </div>        
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-hidden">
          <h2 className="text-base font-semibold text-white mb-4">Active Option Positions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Ticker</th>
                  <th className="pb-3 font-semibold">Strategy</th>
                  <th className="pb-3 font-semibold">Strike / Exp</th>
                  <th className="pb-3 font-semibold">Current</th>
                  <th className="pb-3 font-semibold">Expiration</th>
                  <th className="pb-3 font-semibold">Intrinsic P/L</th>
                  <th className="pb-3 font-semibold">Credit (USD)</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                  <th className="pb-3 font-semibold text-right">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {data.positions.map((pos) => {
                  const isITM = pos.option_leg.moneyness === 'ITM';
                  const creditUsd = pos.option_leg.avg_price * Math.abs(pos.option_leg.quantity) * 100;
                  const pl = calculateIntrinsicPL(pos);
                  const isPositive = pl >= 0;

                  return (
                    <tr key={pos.option_leg.contract_symbol} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-bold text-white font-sans">
                        {pos.symbol}
                        <span className="block text-[10px] text-slate-500 font-normal">{pos.industry}</span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${pos.strategy === 'CASH_SECURED_PUT'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800'
                          : 'bg-purple-950 text-purple-400 border border-purple-800'
                          }`}>
                          {pos.strategy === 'CASH_SECURED_PUT' ? 'CSP' : 'CC'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300">
                        ${pos.option_leg.strike_price.toFixed(2)} {pos.option_leg.option_type}
                        <span className="block text-[10px] text-slate-500">{pos.option_leg.expiration_date}</span>
                      </td>
                      <td className="py-3 text-slate-300">
                        ${pos.current_price.toFixed(2)}
                      </td>
                      <td className="py-3 text-slate-300">
                        {pos.option_leg?.expiration_date}
                        {(() => {
                          // 1. Calculate DTE using the expiration string
                          const dte = calculateDTE(pos.option_leg?.expiration_date);

                          // 2. Conditionally display it if it's a valid number
                          if (dte !== null) {
                            return (
                              <span className="text-slate-500 text-sm ml-2">
                                ({dte} DTE)
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </td>
                      <td className="py-3 font-mono">
                        {pos.option_leg ? (
                          <span className={isPositive ? "text-emerald-400" : "text-rose-400"}>
                            {isPositive ? `+$${pl.toFixed(2)}` : `-$${Math.abs(pl).toFixed(2)}`}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-3 text-emerald-400 font-semibold">
                        ${creditUsd.toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${isITM
                          ? 'bg-amber-950 text-amber-400 border border-amber-700'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}>
                          {pos.option_leg.moneyness}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-300">
                        {pos.portfolio_pct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sector Allocation - Pie / Donut Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white mb-2">Sector Allocation</h2>

            {/* Pie Chart Element */}
            <div className="py-4 flex justify-center">
              <div
                className="w-44 h-44 rounded-full flex items-center justify-center shadow-lg border border-slate-800"
                style={{ background: `conic-gradient(${gradientStops})` }}
              >
                {/* Inner Cutout for Donut View */}
                <div className="w-24 h-24 bg-slate-900 rounded-full flex flex-col items-center justify-center border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Sectors</span>
                  <span className="text-lg font-bold text-white font-mono">{data.sectors.length}</span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3 mt-2">
              {data.sectors.map((sector, idx) => {
                const color = SECTOR_COLORS[idx % SECTOR_COLORS.length];
                return (
                  <div key={sector.industry} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
                      <span className="font-medium text-slate-300">{sector.industry}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-slate-200 font-semibold">{sector.portfolio_pct.toFixed(1)}%</span>
                      <span className="block text-[10px] text-slate-500 font-mono">
                        ${sector.capital_committed.toLocaleString()} USD
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
            <p>• Visual allocation based on capital committed.</p>
            <p>• Data refetches automatically every 60 minutes.</p>
          </div>
        </div>

      </div>
    </div>
  );
}