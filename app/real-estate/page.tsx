import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import {
  REAL_ESTATE_LIABILITY_CAD,
  REAL_ESTATE_MARKET_VALUE_CAD,
} from '@/lib/constants';

const formatCad = (value: number) =>
  new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export default async function RealEstatePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  const equity = REAL_ESTATE_MARKET_VALUE_CAD - REAL_ESTATE_LIABILITY_CAD;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-slate-400 transition hover:text-white">
          &larr; All accounts
        </Link>

        <header className="mt-8 border-b border-slate-800 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Property overview
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Real Estate</h1>
          <p className="mt-2 text-sm text-slate-400">
            Property market value, outstanding liability, and net equity in CAD
          </p>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2" aria-label="Real estate values">
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm font-semibold text-slate-400">Market Value</p>
            <p className="mt-3 font-mono text-3xl font-bold text-white">
              {formatCad(REAL_ESTATE_MARKET_VALUE_CAD)}
            </p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Temporary value
            </p>
          </article>

          <article className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm font-semibold text-slate-400">Liability</p>
            <p className="mt-3 font-mono text-3xl font-bold text-rose-400">
              {formatCad(REAL_ESTATE_LIABILITY_CAD)}
            </p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Temporary value
            </p>
          </article>
        </section>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-900/70 bg-emerald-950/30 p-6">
          <span className="font-semibold text-slate-300">Net Equity</span>
          <span className="font-mono text-2xl font-bold text-emerald-400">{formatCad(equity)}</span>
        </div>
      </div>
    </main>
  );
}
