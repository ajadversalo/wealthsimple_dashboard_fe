import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

const accounts = [
  {
    href: '/options',
    name: 'Options',
    description: 'Positions, allocation, and options screening',
    status: 'Available',
  },
  {
    href: '/crypto',
    name: 'Crypto',
    description: 'Digital asset holdings and performance',
    status: 'Coming soon',
  },
  {
    href: '/tfsa',
    name: 'TFSA',
    description: 'Tax-free savings account overview',
    status: 'Coming soon',
  },
  {
    href: '/rrsp',
    name: 'RRSP',
    description: 'Retirement savings account overview',
    status: 'Coming soon',
  },
];

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 border-b border-slate-800 pb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Portfolio overview
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white">Wealth Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Choose an account to view its dashboard. A combined portfolio summary will live here
            later.
          </p>
        </header>

        <section aria-labelledby="accounts-heading">
          <h2 id="accounts-heading" className="mb-4 text-sm font-semibold text-slate-300">
            Accounts
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {accounts.map((account) => (
              <Link
                key={account.href}
                href={account.href}
                className="group rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700 hover:bg-slate-800/80"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-emerald-300">
                      {account.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-400">{account.description}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                      account.status === 'Available'
                        ? 'bg-emerald-950 text-emerald-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {account.status}
                  </span>
                </div>
                <span className="mt-6 inline-block text-sm font-medium text-slate-300 group-hover:text-white">
                  Open dashboard &rarr;
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
