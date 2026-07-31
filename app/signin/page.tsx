import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import SignInButtons from '@/components/SignInButtons';
import { authOptions } from '@/lib/auth';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <section className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
        <p className="text-xs font-medium text-cyan-400 uppercase tracking-wider">Portfolio Dashboard</p>
        <h1 className="text-2xl font-bold text-white mt-2">Sign in to continue</h1>
        <p className="text-sm text-slate-400 mt-2 mb-6">Use your Google or Microsoft account to access your portfolio monitor.</p>
        <SignInButtons
          googleAvailable={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}
          microsoftAvailable={Boolean(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET)}
        />
      </section>
    </main>
  );
}
