import Link from 'next/link';

const formatCad = (value: number) =>
  new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

interface RegisteredAccountSummaryProps {
  accountName: string;
  balances: Array<{ owner: string; value: number }>;
}

export default function RegisteredAccountSummary({
  accountName,
  balances,
}: RegisteredAccountSummaryProps) {
  const total = balances.reduce((sum, balance) => sum + balance.value, 0);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-slate-400 transition hover:text-white">
          &larr; All accounts
        </Link>

        <header className="mt-8 border-b border-slate-800 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Registered account
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">{accountName}</h1>
          <p className="mt-2 text-sm text-slate-400">AJ and Sheila&apos;s account balances in CAD</p>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2" aria-label={`${accountName} balances`}>
          {balances.map((balance) => (
            <article key={balance.owner} className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm font-semibold text-slate-400">{balance.owner}</p>
              <p className="mt-3 font-mono text-3xl font-bold text-white">
                {formatCad(balance.value)}
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Temporary value
              </p>
            </article>
          ))}
        </section>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-900/70 bg-emerald-950/30 p-6">
          <span className="font-semibold text-slate-300">Combined {accountName}</span>
          <span className="font-mono text-2xl font-bold text-emerald-400">{formatCad(total)}</span>
        </div>
      </div>
    </main>
  );
}
