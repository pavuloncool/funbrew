'use client';

import { resolveAccountRole } from '@funcup/shared';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { getBrowserSessionSafely } from '@/src/lib/supabase/browserAuth';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';
import { isPublicRoute } from '@/src/lib/publicRoutes';

function shouldEnforceRoasterOnly(pathname: string): boolean {
  return !isPublicRoute(pathname);
}

type GateStatus = 'checking' | 'allowed' | 'redirecting';

function buildLoginRedirectTarget(pathname: string, searchParams: URLSearchParams | null): string {
  const nextPath = searchParams?.size ? `${pathname}?${searchParams.toString()}` : pathname;
  return `/login?reason=roaster_auth_required&next=${encodeURIComponent(nextPath)}`;
}

export default function WebAccountRoleGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<GateStatus>(() =>
    shouldEnforceRoasterOnly(pathname) ? 'checking' : 'allowed'
  );

  useEffect(() => {
    let active = true;

    if (!shouldEnforceRoasterOnly(pathname)) {
      setStatus('allowed');
      return () => {
        active = false;
      };
    }

    setStatus('checking');

    async function enforceRoleGate() {
      const session = await getBrowserSessionSafely();

      if (!active) {
        return;
      }

      if (!session?.user.id) {
        setStatus('redirecting');
        router.replace(buildLoginRedirectTarget(pathname, searchParams));
        return;
      }

      try {
        const role = await resolveAccountRole(
          supabaseBrowser,
          session.user.id,
          session.user.user_metadata
        );
        if (!active || role === 'roaster') {
          if (active) {
            setStatus('allowed');
          }
          return;
        }

        await supabaseBrowser.auth.signOut({ scope: 'local' });
        if (!active) {
          return;
        }

        setStatus('redirecting');
        router.replace('/login?reason=consumer_mobile_only');
      } catch {
        if (!active) {
          return;
        }

        setStatus('redirecting');
        router.replace(buildLoginRedirectTarget(pathname, searchParams));
      }
    }

    void enforceRoleGate();

    return () => {
      active = false;
    };
  }, [pathname, router, searchParams]);

  if (status !== 'allowed') {
    return null;
  }

  return <>{children}</>;
}
