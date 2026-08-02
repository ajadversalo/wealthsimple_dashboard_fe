'use client';

import { signOut } from 'next-auth/react';

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => void signOut({ callbackUrl: '/signin' })}
      className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
    >
      Sign out
    </button>
  );
}
