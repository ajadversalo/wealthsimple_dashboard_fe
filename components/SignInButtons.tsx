'use client';

import { signIn } from 'next-auth/react';

interface SignInButtonsProps {
  googleAvailable: boolean;
  microsoftAvailable: boolean;
}

export default function SignInButtons({ googleAvailable, microsoftAvailable }: SignInButtonsProps) {
  const buttonClass = 'w-full flex items-center justify-center rounded-md px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div className="space-y-3">
      <button
        type="button"
        className={`${buttonClass} bg-white text-slate-900 hover:bg-slate-200`}
        disabled={!googleAvailable}
        onClick={() => signIn('google', { callbackUrl: '/' })}
      >
        Continue with Google
      </button>
      <button
        type="button"
        className={`${buttonClass} bg-[#0078d4] text-white hover:bg-[#106ebe]`}
        disabled={!microsoftAvailable}
        onClick={() => signIn('azure-ad', { callbackUrl: '/' })}
      >
        Continue with Microsoft
      </button>
      {!googleAvailable && !microsoftAvailable && (
        <p className="text-center text-xs text-amber-400">
          Sign-in providers have not been configured yet.
        </p>
      )}
    </div>
  );
}
