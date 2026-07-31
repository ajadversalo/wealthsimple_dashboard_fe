'use client';

import React, { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import MiniCashSecuredPutsScreener from './MiniCashSecuredPutsScreener';

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

export interface CurrencyValue {
  usd: number;
  cad: number;
}

export type BrokerTotals = Record<string, BrokerSummary>;

export interface BrokerSummary {
  broker: string;
  net_value: CurrencyValue;
  option_liabilities: CurrencyValue;
  remaining_capital: CurrencyValue;
  deployed_capital: CurrencyValue;
  total_capital: CurrencyValue;
}

export interface Position {
  symbol: string;
  broker: string;
  asset_class: string;
  strategy: 'CASH_SECURED_PUT' | 'COVERED_CALL' | 'LONG_EQUITY' | string;
  industry: string;
  current_price: number;
  portfolio_pct: number;
  underlying: Underlying | null;
  option_leg: OptionLeg | null;
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
  broker_totals: BrokerTotals;
}

const SECTOR_COLORS = [
  '#06b6d4', // Cyan (Healthcare)
  '#6366f1', // Indigo (Financials)
  '#f59e0b', // Amber (Consumer Staples)
  '#8b5cf6', // Purple (Crypto)
  '#10b981', // Emerald
  '#ec4899', // Pink
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
      //const response = await fetch('http://127.0.0.1:8000/api/v1/positions', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
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
        <p className="text-slate-400 animate-pulse font-mono text-sm">
          Loading positions from Render...
        </p>
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

  // This dashboard represents the Wealthsimple options account only. Other
  // brokers remain in the API payload but must not affect its summary values.
  const wealthsimpleTotals = data.broker_totals.WEALTHSIMPLE;
  const netPortfolioUSD = wealthsimpleTotals.net_value.usd;
  const netPortfolioCAD = wealthsimpleTotals.net_value.cad;

  const wsNetCAD = wealthsimpleTotals.net_value.cad;
  const wsNetUSD = wealthsimpleTotals.net_value.usd;

  const krNetCAD = data.broker_totals.KRAKEN.net_value.cad;
  const krNetUSD = data.broker_totals.KRAKEN.net_value.usd;

  const cashUSD = wealthsimpleTotals.remaining_capital.usd;
  const cashCAD = wealthsimpleTotals.remaining_capital.cad;

  // Conic Gradient for Sector Donut
  let currentPct = 0;
  const gradientStops = data.sectors
    .map((sector, idx) => {
      const color = SECTOR_COLORS[idx % SECTOR_COLORS.length];
      const start = currentPct;
      const end = currentPct + sector.portfolio_pct;
      currentPct = end;
      return `${color} ${start}% ${end}%`;
    })
    .join(', ');

  const calculateDTE = (expDateStr: string | undefined | null): number | null => {
    if (!expDateStr) return null;
    const today = new Date();
    const expDate = new Date(expDateStr + 'T23:59:59Z');
    const diffTime = expDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const calculateIntrinsicPL = (pos: Position): number => {
    const option = pos.option_leg;
    if (!option || !option.option_type) return 0;

    const current = pos.current_price || 0;
    const strike = option.strike_price || 0;
    const premium = option.avg_price || 0;
    const contracts = Math.abs(option.quantity || 0);
    const type = option.option_type.toUpperCase();

    let plPerShare = premium;

    if (type === 'PUT' && current < strike) {
      plPerShare = premium - (strike - current);
    } else if (type === 'CALL' && current > strike) {
      plPerShare = premium - (current - strike);
    }

    return plPerShare * 100 * contracts;
  };

  console.log("data ", data);
  console.log("wsNetCAD ", wsNetCAD);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6 font-sans">
      {/* Header Bar */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Options Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Updated:{' '}
            {new Date(data.updated_at).toLocaleString()}
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
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/signin' })}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total
          </p>
          <div className="mt-3 space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-emerald-400 font-mono">
                CA$
                {netPortfolioCAD.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs text-slate-400 font-semibold font-mono">CAD</span>
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/80">
              <span className="text-sm font-semibold text-slate-300 font-mono">
                $
                {netPortfolioUSD.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">USD</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Options Portfolio
          </p>
          <div className="mt-3 space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-emerald-400 font-mono">
                CA$
                {wsNetCAD.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs text-slate-400 font-semibold font-mono">CAD</span>
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/80">
              <span className="text-sm font-semibold text-slate-300 font-mono">
                $
                {wsNetUSD.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">USD</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Crypto Portfolio
          </p>
          <div className="mt-3 space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-emerald-400 font-mono">
                CA$
                {krNetCAD.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs text-slate-400 font-semibold font-mono">CAD</span>
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/80">
              <span className="text-sm font-semibold text-slate-300 font-mono">
                $
                {krNetUSD.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">USD</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Available Cash
          </p>
          <div className="mt-3 space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-200 font-mono">
                $
                {cashUSD.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs text-slate-400 font-semibold font-mono">USD</span>
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/80">
              <span className="text-sm font-semibold text-emerald-200/90 font-mono">
                CA$
                {cashCAD.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">CAD</span>
            </div>
          </div>
        </div>

        <MiniCashSecuredPutsScreener />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Positions Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-hidden">
          <h2 className="text-base font-semibold text-white mb-4">Active Positions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Ticker</th>
                  <th className="pb-3 font-semibold">Strategy</th>
                  <th className="pb-3 font-semibold">Strike / Details</th>
                  <th className="pb-3 font-semibold">Current</th>
                  <th className="pb-3 font-semibold">DTE</th>
                  <th className="pb-3 font-semibold">Intrinsic P/L</th>
                  <th className="pb-3 font-semibold">Credit</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                  <th className="pb-3 font-semibold text-right">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {data.positions.map((pos, idx) => {
                  const option = pos.option_leg;
                  const isCrypto = pos.asset_class === 'CRYPTO';
                  const isITM = option?.moneyness === 'ITM';
                  const qty = Math.abs(option?.quantity || 0);
                  const creditUsd = (option?.avg_price || 0) * qty * 100;
                  const pl = calculateIntrinsicPL(pos);
                  const isPositive = pl >= 0;
                  const dte = calculateDTE(option?.expiration_date);

                  return (
                    <tr
                      key={option?.contract_symbol || `${pos.symbol}-${idx}`}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Ticker & Industry */}
                      <td className="py-3 font-bold text-white font-sans">
                        {pos.symbol}
                        <span className="block text-[10px] text-slate-500 font-normal">
                          {pos.industry}
                        </span>
                      </td>

                      {/* Strategy Badge */}
                      <td className="py-3">
                        {isCrypto ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide bg-violet-950 text-violet-400 border border-violet-800">
                            CRYPTO
                          </span>
                        ) : option ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                              pos.strategy === 'CASH_SECURED_PUT'
                                ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                : 'bg-purple-950 text-purple-400 border border-purple-800'
                            }`}
                          >
                            {pos.strategy === 'CASH_SECURED_PUT' ? 'CSP' : 'CC'}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px] font-sans">SPOT</span>
                        )}
                      </td>

                      {/* Strike / Contract Details */}
                      <td className="py-3 text-slate-300">
                        {option ? (
                          <>
                            ${option.strike_price.toFixed(2)} {option.option_type}
                            <span className="block text-[10px] text-slate-500">
                              {option.expiration_date}
                            </span>
                          </>
                        ) : isCrypto ? (
                          <>
                            SPOT
                            <span className="block text-[10px] text-slate-500">
                              {pos.underlying?.shares
                                ? `${pos.underlying.shares.toFixed(
                                    pos.underlying.shares < 1 ? 4 : 2
                                  )} tokens`
                                : '-'}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* Current Market Price */}
                      <td className="py-3 text-slate-300">
                        $
                        {pos.current_price < 2
                          ? pos.current_price.toFixed(4)
                          : pos.current_price.toFixed(2)}
                      </td>

                      {/* DTE */}
                      <td className="py-3 text-slate-300">
                        {dte !== null ? (
                          <span className="text-slate-300 font-semibold">{dte}d</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* Intrinsic P/L */}
                      <td className="py-3 font-mono">
                        {option ? (
                          <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                            {isPositive
                              ? `+$${pl.toFixed(2)}`
                              : `-$${Math.abs(pl).toFixed(2)}`}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* Credit */}
                      <td className="py-3 text-emerald-400 font-semibold">
                        {option ? `$${creditUsd.toFixed(2)}` : <span className="text-slate-500">-</span>}
                      </td>

                      {/* Status */}
                      <td className="py-3 text-center">
                        {option?.moneyness ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isITM
                                ? 'bg-amber-950 text-amber-400 border border-amber-700'
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            }`}
                          >
                            {option.moneyness}
                          </span>
                        ) : isCrypto ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            HOLDING
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* Weight */}
                      <td className="py-3 text-right text-slate-300">
                        {(pos.portfolio_pct || 0).toFixed(1)}%
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

            {/* Pie / Donut Element */}
            <div className="py-4 flex justify-center">
              <div
                className="w-44 h-44 rounded-full flex items-center justify-center shadow-lg border border-slate-800"
                style={{ background: `conic-gradient(${gradientStops})` }}
              >
                <div className="w-24 h-24 bg-slate-900 rounded-full flex flex-col items-center justify-center border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Sectors</span>
                  <span className="text-lg font-bold text-white font-mono">
                    {data.sectors.length}
                  </span>
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
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium text-slate-300">{sector.industry}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-slate-200 font-semibold">
                        {sector.portfolio_pct.toFixed(1)}%
                      </span>
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
