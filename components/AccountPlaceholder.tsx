import Link from 'next/link';

export default function AccountPlaceholder({ accountName }: { accountName: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Account dashboard
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">{accountName}</h1>
        <p className="mt-3 text-sm text-slate-400">
          This dashboard is ready to be built. Its account summary and positions will appear here.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
        >
          &larr; Back to all accounts
        </Link>
      </div>
    </main>
  );
}
