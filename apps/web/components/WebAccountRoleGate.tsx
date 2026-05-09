'use client';

import { resolveAccountRole } from '@funcup/shared';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { getBrowserSessionSafely } from '@/src/lib/supabase/browserAuth';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';
import { isPublicRoute } from '@/src/lib/publicRoutes';

function shouldEnforceRoasterOnly(pathname: string): boolean {
  return !isPublicRoute(pathname);
}

export default function WebAccountRoleGate() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    if (!shouldEnforceRoasterOnly(pathname)) {
      return () => {
        active = false;
      };
    }

    async function enforceRoleGate() {
      const session = await getBrowserSessionSafely();

      if (!active || !session?.user.id) {
        return;
      }

      try {
        const role = await resolveAccountRole(
          supabaseBrowser,
          session.user.id,
          session.user.user_metadata
        );
        if (!active || role === 'roaster') {
          return;
        }

        await supabaseBrowser.auth.signOut({ scope: 'local' });
        if (!active) {
          return;
        }

        router.replace('/login?reason=consumer_mobile_only');
      } catch {
        // Best effort gate: do not trap the user on transient lookup failures.
      }
    }

    void enforceRoleGate();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  return null;
}
