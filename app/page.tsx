import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import PortfolioSummary from '@/components/PortfolioSummary';
import SignOutButton from '@/components/SignOutButton';
import { authOptions } from '@/lib/auth';

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');
  const userName = session.user?.name ?? session.user?.email ?? 'there';

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-col gap-5 border-b border-slate-800 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Portfolio overview
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white">Wealth Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Your combined portfolio and account balances, normalized to Canadian dollars.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="text-sm text-slate-400">
              Hi <span className="font-semibold text-slate-200">{userName}</span>!
            </span>
            <SignOutButton />
          </div>
        </header>
        <PortfolioSummary />
      </div>
    </main>
  );
}
