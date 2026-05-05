'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

export default function WebHeader() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await supabaseBrowser.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="w-full border-b border-neutral-200 bg-neutral-50">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <p className="text-sm font-semibold text-neutral-900">funcup</p>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="rounded border border-neutral-400 bg-white px-3 py-1.5 text-sm text-neutral-900 transition hover:bg-neutral-100 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Wylogowywanie…' : 'Wyloguj'}
        </button>
      </div>
    </header>
  );
}
