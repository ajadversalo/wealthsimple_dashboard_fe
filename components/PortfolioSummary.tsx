'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  AJ_RRSP_VALUE_CAD,
  AJ_TFSA_VALUE_CAD,
  CENTRA_NUMBER_OF_SHARES,
  CENTRA_SHARE_PRICE_CAD,
  CHECKING_SAVINGS_VALUE_CAD,
  POSITIONS_API_URL,
  REAL_ESTATE_LIABILITY_CAD,
  REAL_ESTATE_MARKET_VALUE_CAD,
  RESP_VALUE_CAD,
  SHEILA_RRSP_VALUE_CAD,
  SHEILA_TFSA_VALUE_CAD,
} from '@/lib/constants';

interface PositionsSummaryPayload {
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

export default function PortfolioSummary() {
  const [liveValues, setLiveValues] = useState({ options: 0, crypto: 0 });
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
      value: CHECKING_SAVINGS_VALUE_CAD,
      live: false,
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

  return (
    <section aria-labelledby="portfolio-heading">
      <h2 id="portfolio-heading" className="sr-only">
        Portfolio values
      </h2>

      <div className="mb-6 rounded-2xl border border-emerald-900/70 bg-gradient-to-br from-slate-900 to-emerald-950/40 p-7 sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Total portfolio
        </p>
        <p className="mt-3 font-mono text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {loading ? 'Loading…' : formatCad(total)}
        </p>
        <p className="mt-3 text-sm text-slate-400">Combined value across all accounts in CAD</p>
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
