'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

/**
 * Po zakończeniu AnimatedSplash (AppOpenGate):
 * sprawdzenie sesji i przejście do roaster hub lub logowania.
 */
export default function RootEntryPage() {
  const router = useRouter();

  useEffect(() => {
    async function routeBySession() {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (session?.access_token) {
        router.replace('/roaster-hub');
        return;
      }

      router.replace('/login');
    }

    void routeBySession();
  }, [router]);

  return (
    <div
      className="min-h-screen bg-neutral-50"
      aria-hidden
    />
  );
}
