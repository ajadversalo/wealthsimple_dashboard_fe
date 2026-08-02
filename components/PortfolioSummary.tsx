'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  AJ_RRSP_VALUE_CAD,
  AJ_TFSA_VALUE_CAD,
  CAD_TO_PHP_RATE,
  CENTRA_NUMBER_OF_SHARES,
  CENTRA_SHARE_PRICE_CAD,
  CHECKING_VALUE_CAD,
  POSITIONS_API_URL,
  REAL_ESTATE_LIABILITY_CAD,
  REAL_ESTATE_MARKET_VALUE_CAD,
  RESP_VALUE_CAD,
  SAVINGS_VALUE_CAD,
  SHEILA_RRSP_VALUE_CAD,
  SHEILA_TFSA_VALUE_CAD,
} from '@/lib/constants';

interface PositionsSummaryPayload {
  fx_rate_usd_cad: number;
  broker_totals: Record<
    string,
    {
      net_value: {
        cad: number;
      };
    }
  >;
}

const formatCad = (value: number) =>
  new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatUsd = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatPhp = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const ALLOCATION_COLORS = [
  '#34d399',
  '#22d3ee',
  '#818cf8',
  '#c084fc',
  '#fb7185',
  '#fbbf24',
  '#60a5fa',
  '#a3e635',
];

export default function PortfolioSummary() {
  const [liveValues, setLiveValues] = useState({ options: 0, crypto: 0, usdCadRate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchValues = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(POSITIONS_API_URL, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Unable to load portfolio values (${response.status})`);
      }

      const data: PositionsSummaryPayload = await response.json();
      setLiveValues({
        options: data.broker_totals.WEALTHSIMPLE?.net_value.cad ?? 0,
        crypto: data.broker_totals.KRAKEN?.net_value.cad ?? 0,
        usdCadRate: data.fx_rate_usd_cad,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load portfolio values');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchValues();
  }, [fetchValues]);

  const accounts: Array<{
    href: string;
    name: string;
    value: number;
    live: boolean;
    breakdown?: Array<{ name: string; value: number }>;
  }> = [
    { href: '/options', name: 'Options', value: liveValues.options, live: true },
    { href: '/crypto', name: 'Crypto', value: liveValues.crypto, live: true },
    {
      href: '/tfsa',
      name: 'TFSA',
      value: AJ_TFSA_VALUE_CAD + SHEILA_TFSA_VALUE_CAD,
      live: false,
      breakdown: [
        { name: 'AJ', value: AJ_TFSA_VALUE_CAD },
        { name: 'Sheila', value: SHEILA_TFSA_VALUE_CAD },
      ],
    },
    {
      href: '/rrsp',
      name: 'RRSP',
      value: AJ_RRSP_VALUE_CAD + SHEILA_RRSP_VALUE_CAD,
      live: false,
      breakdown: [
        { name: 'AJ', value: AJ_RRSP_VALUE_CAD },
        { name: 'Sheila', value: SHEILA_RRSP_VALUE_CAD },
      ],
    },
    { href: '/resp', name: 'RESP', value: RESP_VALUE_CAD, live: false },
    {
      href: '/checking-savings',
      name: 'Checking / Savings',
      value: CHECKING_VALUE_CAD + SAVINGS_VALUE_CAD,
      live: false,
      breakdown: [
        { name: 'Checking', value: CHECKING_VALUE_CAD },
        { name: 'Savings', value: SAVINGS_VALUE_CAD },
      ],
    },
    {
      href: '/real-estate',
      name: 'Real Estate',
      value: REAL_ESTATE_MARKET_VALUE_CAD - REAL_ESTATE_LIABILITY_CAD,
      live: false,
      breakdown: [
        { name: 'Market value', value: REAL_ESTATE_MARKET_VALUE_CAD },
        { name: 'Liability', value: -REAL_ESTATE_LIABILITY_CAD },
      ],
    },
    {
      href: '/centra',
      name: 'Centra',
      value: CENTRA_NUMBER_OF_SHARES * CENTRA_SHARE_PRICE_CAD,
      live: false,
      breakdown: [
        { name: 'Shares', value: CENTRA_NUMBER_OF_SHARES },
        { name: 'Share price', value: CENTRA_SHARE_PRICE_CAD },
      ],
    },
  ];
  const total = accounts.reduce((sum, account) => sum + account.value, 0);
  let allocationStart = 0;
  const allocationGradient = accounts
    .map((account, index) => {
      const allocation = total > 0 ? (account.value / total) * 100 : 0;
      const allocationEnd = allocationStart + allocation;
      const stop = `${ALLOCATION_COLORS[index]} ${allocationStart}% ${allocationEnd}%`;
      allocationStart = allocationEnd;
      return stop;
    })
    .join(', ');
  const liquidAssets =
    liveValues.options +
    liveValues.crypto +
    AJ_TFSA_VALUE_CAD +
    SHEILA_TFSA_VALUE_CAD +
    CHECKING_VALUE_CAD +
    SAVINGS_VALUE_CAD;
  const totalUsd = liveValues.usdCadRate > 0 ? total / liveValues.usdCadRate : 0;
  const liquidAssetsUsd =
    liveValues.usdCadRate > 0 ? liquidAssets / liveValues.usdCadRate : 0;

  return (
    <section aria-labelledby="portfolio-heading">
      <h2 id="portfolio-heading" className="sr-only">
        Portfolio values
      </h2>

      <div className="mb-6 grid gap-8 rounded-2xl border border-emerald-900/70 bg-gradient-to-br from-slate-900 to-emerald-950/40 p-7 sm:grid-cols-2 sm:p-9">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Total portfolio
          </p>
          <p className="mt-3 font-mono text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {loading ? 'Loading…' : formatCad(total)}
          </p>
          <div className="mt-3 space-y-1 font-mono text-xs text-slate-400">
            <p>
              <span className="mr-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">USD</span>
              {loading ? 'Loading…' : formatUsd(totalUsd)}
            </p>
            <p>
              <span className="mr-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">PHP</span>
              {loading ? 'Loading…' : formatPhp(total * CAD_TO_PHP_RATE)}
            </p>
          </div>
          <p className="mt-3 text-sm text-slate-400">Combined value across all accounts in CAD</p>
        </div>

        <div className="border-t border-slate-700/70 pt-8 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Liquid assets
          </p>
          <p className="mt-3 font-mono text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {loading ? 'Loading…' : formatCad(liquidAssets)}
          </p>
          <div className="mt-3 space-y-1 font-mono text-xs text-slate-400">
            <p>
              <span className="mr-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">USD</span>
              {loading ? 'Loading…' : formatUsd(liquidAssetsUsd)}
            </p>
            <p>
              <span className="mr-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">PHP</span>
              {loading ? 'Loading…' : formatPhp(liquidAssets * CAD_TO_PHP_RATE)}
            </p>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            TFSA + Options + Checking / Savings + Crypto
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-rose-900 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
          <span>{error}</span>
          <button type="button" onClick={() => void fetchValues()} className="font-semibold hover:text-white">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:col-span-2">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="shrink-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Investment mix
              </p>
              <div
                className="mt-3 flex size-32 items-center justify-center rounded-full"
                style={{
                  background: loading
                    ? '#1e293b'
                    : `conic-gradient(${allocationGradient})`,
                }}
                role="img"
                aria-label="Portfolio allocation by investment type"
              >
                <div className="flex size-20 flex-col items-center justify-center rounded-full border border-slate-800 bg-slate-900">
                  <span className="font-mono text-lg font-bold text-white">
                    {loading ? '—' : accounts.length}
                  </span>
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                    Types
                  </span>
                </div>
              </div>
            </div>

            <dl className="grid min-w-0 flex-1 grid-cols-1 gap-x-5 gap-y-2 min-[420px]:grid-cols-2">
              {accounts.map((account, index) => (
                <div key={account.href} className="flex items-center justify-between gap-3 text-xs">
                  <dt className="flex min-w-0 items-center gap-2 text-slate-400">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: ALLOCATION_COLORS[index] }}
                    />
                    <span className="truncate">{account.name}</span>
                  </dt>
                  <dd className="shrink-0 font-mono font-semibold text-slate-200">
                    {loading && account.live
                      ? '—'
                      : `${(total > 0 ? (account.value / total) * 100 : 0).toFixed(1)}%`}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </article>

        {accounts.map((account) => (
          <Link
            key={account.href}
            href={account.href}
            className="group rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700 hover:bg-slate-800/80"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-300 group-hover:text-white">{account.name}</h3>
              <span className="text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-emerald-400">
                &rarr;
              </span>
            </div>
            <p className="mt-5 font-mono text-2xl font-bold text-white">
              {loading && account.live ? 'Loading…' : formatCad(account.value)}
            </p>
            {account.breakdown && (
              <dl className="mt-4 space-y-2 border-t border-slate-800 pt-3 text-xs">
                {account.breakdown.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">{item.name}</dt>
                    <dd className="font-mono font-semibold text-slate-300">
                      {account.href === '/centra' && item.name === 'Shares'
                        ? item.value.toLocaleString('en-CA')
                        : formatCad(item.value)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {account.live ? 'Live value' : 'Temporary value'}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
