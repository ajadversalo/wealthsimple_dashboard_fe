import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { CENTRA_NUMBER_OF_SHARES, CENTRA_SHARE_PRICE_CAD } from '@/lib/constants';

const formatCad = (value: number) =>
  new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatShares = (value: number) =>
  new Intl.NumberFormat('en-CA', { maximumFractionDigits: 4 }).format(value);

export default async function CentraPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  const totalValue = CENTRA_NUMBER_OF_SHARES * CENTRA_SHARE_PRICE_CAD;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-slate-400 transition hover:text-white">
          &larr; All accounts
        </Link>

        <header className="mt-8 border-b border-slate-800 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Private holding
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Centra</h1>
          <p className="mt-2 text-sm text-slate-400">
            Share ownership and estimated holding value in CAD
          </p>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2" aria-label="Centra holding details">
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm font-semibold text-slate-400">Number of Shares</p>
            <p className="mt-3 font-mono text-3xl font-bold text-white">
              {formatShares(CENTRA_NUMBER_OF_SHARES)}
            </p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Temporary value
            </p>
          </article>

          <article className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm font-semibold text-slate-400">Share Price</p>
            <p className="mt-3 font-mono text-3xl font-bold text-white">
              {formatCad(CENTRA_SHARE_PRICE_CAD)}
            </p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Temporary value
            </p>
          </article>
        </section>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-900/70 bg-emerald-950/30 p-6">
          <span className="font-semibold text-slate-300">Total Value</span>
          <span className="font-mono text-2xl font-bold text-emerald-400">
            {formatCad(totalValue)}
          </span>
        </div>
      </div>
    </main>
  );
}
