'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { supabaseBrowser } from '@/src/lib/supabase/browserClient';
import { resolvePublicHubCtaTarget } from '@/src/lib/publicEntryRouting';
import { isPublicRoute } from '@/src/lib/publicRoutes';

const NAV_ITEMS = ['Support', 'About', 'News', 'Contact', 'Individuals', 'Business'];

export default function WebHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hubCtaLoading, setHubCtaLoading] = useState(false);

  const isPublicEntry = isPublicRoute(pathname);

  useEffect(() => {
    setLoading(false);
    setHubCtaLoading(false);
  }, [pathname]);

  async function handleLogout() {
    setLoading(true);
    router.push('/home');
    try {
      await supabaseBrowser.auth.signOut();
      router.refresh();
    } catch {
      // Keep the user on current screen when sign-out fails, but always unlock the button.
    } finally {
      setLoading(false);
    }
  }

  async function handlePublicHubCta() {
    setHubCtaLoading(true);
    try {
      const target = await resolvePublicHubCtaTarget();
      router.push(target);
    } finally {
      setHubCtaLoading(false);
    }
  }

  if (isPublicEntry) {
    return (
      <header className="w-full border-b-2 border-vs-border-strong bg-vs-elevated">
        <div className="mx-auto flex h-[74px] w-full max-w-[1600px] items-center border-x-2 border-vs-border-strong px-5 sm:px-8">
          <button
            type="button"
            className="font-display text-[42px] leading-none tracking-[-0.04em] text-vs-text-primary sm:text-[52px]"
            onClick={() => router.push('/home')}
          >
            fun•brew
          </button>
          <div className="ml-auto">
            <button
              type="button"
              onClick={() => void handlePublicHubCta()}
              className="vs-button-primary text-[15px] font-semibold sm:text-[16px]"
              disabled={hubCtaLoading}
            >
              {hubCtaLoading ? 'Opening…' : 'My Roaster Hub'}
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full border-b-2 border-vs-border-strong bg-vs-elevated">
      <div className="mx-auto flex h-[74px] w-full max-w-[1600px] items-center border-x-2 border-vs-border-strong px-8">
        <button
          type="button"
          className="font-display text-[52px] leading-none tracking-[-0.04em] text-vs-text-primary"
          onClick={() => router.push('/home')}
        >
          fun•brew
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
            {loading ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </div>
    </header>
  );
}
