import PositionsDashboard from '@/components/PositionsDashboard';
import CashSecuredPutsScreener from '@/app/components/CashSecuredPutsScreener';

export default function Home() {
  return (
    <main className="bg-slate-950">
      <PositionsDashboard />
      <div className="px-6 pb-6">
        <CashSecuredPutsScreener />
      </div>
    </main>
  );
}
