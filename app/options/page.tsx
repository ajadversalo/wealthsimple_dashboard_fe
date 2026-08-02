import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import PositionsDashboard from '@/components/PositionsDashboard';
import CashSecuredPutsScreener from '@/app/components/CashSecuredPutsScreener';
import { authOptions } from '@/lib/auth';

export default async function OptionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  return (
    <main className="bg-slate-950">
      <div className="px-6 pt-5">
        <Link href="/" className="text-sm text-slate-400 transition hover:text-white">
          &larr; All accounts
        </Link>
      </div>
      <PositionsDashboard />
      <div className="px-6 pb-6">
        <CashSecuredPutsScreener />
      </div>
    </main>
  );
}
