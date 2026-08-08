import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400 text-3xl font-extrabold text-slate-950">
          W
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Wealth Dashboard
        </p>
        <h1 className="mt-2 text-2xl font-bold text-white">You’re offline</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Reconnect to securely load your latest portfolio data.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          Try again
        </Link>
      </section>
    </main>
  );
}
