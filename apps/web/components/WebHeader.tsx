'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

const NAV_ITEMS = ['Individuals', 'Business', 'Support', 'About', 'News'];

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
    <header className="w-full border-b-2 border-vs-border-strong bg-vs-elevated">
      <div className="mx-auto flex h-[74px] w-full max-w-[1600px] items-center border-x-2 border-vs-border-strong px-8">
        <button
          type="button"
          className="font-display text-[52px] leading-none tracking-[-0.04em] text-vs-text-primary"
          onClick={() => router.push('/roaster-hub')}
        >
          funcup
        </button>

        <nav className="ml-16 hidden items-center gap-10 md:flex">
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              type="button"
              className="text-[24px] font-medium text-vs-text-primary hover:underline"
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <div className="hidden h-[74px] items-center border-l-2 border-vs-border-strong px-6 md:flex">
            <span className="text-[22px] font-semibold">EN</span>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="vs-button-secondary text-[16px] font-semibold"
            disabled={loading}
          >
            {loading ? 'Wylogowywanie…' : 'Wyloguj'}
          </button>
        </div>
      </div>
    </header>
  );
}
