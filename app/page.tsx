import PositionsDashboard from '@/components/PositionsDashboard';
import CashSecuredPutsScreener from '@/app/components/CashSecuredPutsScreener';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/signin');

  return (
    <main className="bg-slate-950">
      <PositionsDashboard />
      <div className="px-6 pb-6">
        <CashSecuredPutsScreener />
      </div>
    </main>
  );
}
