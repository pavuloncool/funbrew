'use client';

import { resolveAccountRole } from '@funcup/shared';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getBrowserSessionSafely } from '@/src/lib/supabase/browserAuth';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

/**
 * Po zakończeniu AnimatedSplash (AppOpenGate):
 * sprawdzenie sesji i przejście do roaster hub lub logowania.
 */
export default function RootEntryPage() {
  const router = useRouter();

  useEffect(() => {
    async function routeBySession() {
      const session = await getBrowserSessionSafely();

      if (session?.access_token && session.user.id) {
        try {
          const role = await resolveAccountRole(
            supabaseBrowser,
            session.user.id,
            session.user.user_metadata
          );
          if (role === 'roaster') {
            router.replace('/roaster-hub');
            return;
          }

          await supabaseBrowser.auth.signOut({ scope: 'local' });
          router.replace('/login?reason=consumer_mobile_only');
          return;
        } catch {
          router.replace('/login');
          return;
        }
      }

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
      className="min-h-screen bg-vs-surface"
      aria-hidden
    />
  );
}
