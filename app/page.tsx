import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import PortfolioSummary from '@/components/PortfolioSummary';
import { authOptions } from '@/lib/auth';

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
            Your combined portfolio and account balances, normalized to Canadian dollars.
          </p>
        </header>
        <PortfolioSummary />
      </div>
    </main>
  );
}
