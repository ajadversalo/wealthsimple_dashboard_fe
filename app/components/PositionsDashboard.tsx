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

// Color palette for sector pie slices
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
        <p className="text-slate-400 animate-pulse">Waking up Render instance and fetching positions...</p>
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

  // Capital Deployed math
  const deployedUSD = data.total_capital.usd - data.remaining_capital.usd;
  const deployedCAD = data.total_capital.cad - data.remaining_capital.cad;

  // Premium math
  const totalPremiumUSD = data.positions.reduce((acc, pos) => {
    const qty = Math.abs(pos.option_leg.quantity);
    return acc + (pos.option_leg.avg_price * qty * 100);
  }, 0);
  const totalPremiumCAD = totalPremiumUSD * fx;

  // --- SVG Pie Chart Arc Calculation ---
  let cumulativeAngle = 0;
  const pieSlices = data.sectors.map((sector, idx) => {
    const angle = (sector.portfolio_pct / 100) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;

    const x1 = 50 + 40 * Math.cos((Math.PI * (startAngle - 90)) / 180);
    const y1 = 50 + 40 * Math.sin((Math.PI * (startAngle - 90)) / 180);
    const x2 = 50 + 40 * Math.cos((Math.PI * (endAngle - 90)) / 180);
    const y2 = 50 + 40 * Math.sin((Math.PI * (endAngle - 90)) / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;
    const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return {
      ...sector,
      color: SECTOR_COLORS[idx % SECTOR_COLORS.length],
      pathData,
    };
  });

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

      {/* Dual Currency Capital Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Total Capital */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Capital</p>
          <div className="mt-3 space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-white font-mono">
                ${data.total_capital.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400 font-semibold font-mono">USD</span>
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/80">
              <span className="text-sm font-semibold text-slate-300 font-mono">
                CA${data.total_capital.cad.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">CAD</span>
            </div>
          </div>
        </div>

        {/* Available Cash */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Available Cash</p>
          <div className="mt-3 space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-emerald-400 font-mono">
                ${data.remaining_capital.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400 font-semibold font-mono">USD</span>
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/80">
              <span className="text-sm font-semibold text-emerald-500/90 font-mono">
                CA${data.remaining_capital.cad.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">CAD</span>
            </div>
          </div>
        </div>

        {/* Capital Deployed */}
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
              <span className="text-[10px] text-slate-500 font-mono">CAD ({((deployedUSD / data.total_capital.usd) * 100).toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        {/* Open Premium Collected */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Open Premium Collected</p>
          <div className="mt-3 space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-amber-400 font-mono">
                ${totalPremiumUSD.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-semibold font-mono">USD</span>
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/80">
              <span className="text-sm font-semibold text-amber-500/90 font-mono">
                CA${totalPremiumCAD.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">CAD</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Grid: Positions Table & Sector Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Positions Table (2/3 width) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 overflow-hidden">
          <h2 className="text-base font-semibold text-white mb-4">Active Option Positions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Ticker</th>
                  <th className="pb-3 font-semibold">Strategy</th>
                  <th className="pb-3 font-semibold">Strike / Exp</th>
                  <th className="pb-3 font-semibold text-right">Credit (USD)</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                  <th className="pb-3 font-semibold text-right">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {data.positions.map((pos) => {
                  const isITM = pos.option_leg.moneyness === 'ITM';
                  const creditUsd = pos.option_leg.avg_price * Math.abs(pos.option_leg.quantity) * 100;

                  return (
                    <tr key={pos.option_leg.contract_symbol} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-bold text-white font-sans">
                        {pos.symbol}
                        <span className="block text-[10px] text-slate-500 font-normal">{pos.industry}</span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                          pos.strategy === 'CASH_SECURED_PUT' 
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
                      <td className="py-3 text-right text-emerald-400 font-semibold">
                        ${creditUsd.toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isITM 
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

        {/* Sector Allocation - Pie Chart View */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white mb-2">Sector Allocation</h2>
            
            {/* SVG Donut / Pie Chart */}
            <div className="relative w-48 h-48 mx-auto my-2">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-md">
                {pieSlices.map((slice) => (
                  <path
                    key={slice.industry}
                    d={slice.pathData}
                    fill={slice.color}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
                {/* Inner Circle for Donut Effect */}
                <circle cx="50" cy="50" r="22" fill="#0f172a" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Sectors</span>
                <span className="text-sm font-bold text-white font-mono">{data.sectors.length}</span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="space-y-3 mt-4">
              {pieSlices.map((sector) => (
                <div key={sector.industry} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full inline-block" 
                      style={{ backgroundColor: sector.color }} 
                    />
                    <span className="font-medium text-slate-300">{sector.industry}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-slate-200 font-semibold">{sector.portfolio_pct.toFixed(1)}%</span>
                    <span className="block text-[10px] text-slate-500 font-mono">
                      ${sector.capital_committed.toLocaleString()} USD
                    </span>
                  </div>
                </div>
              ))}
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