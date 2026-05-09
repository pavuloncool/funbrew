'use client';

import { resolveAccountRole } from '@funcup/shared';

import { getBrowserSessionSafely } from '@/src/lib/supabase/browserAuth';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

/**
 * Decides where "My Roaster Hub" should route from public entry.
 * Contract:
 * - roaster session => /roaster-hub
 * - no session => /login
 * - consumer session => local sign-out + /login?reason=consumer_mobile_only
 */
export async function resolvePublicHubCtaTarget(): Promise<string> {
  const session = await getBrowserSessionSafely();

  if (!session?.access_token) {
    return '/login';
  }

  if (!session.user.id) {
    return '/roaster-hub';
  }

  try {
    const role = await resolveAccountRole(
      supabaseBrowser,
      session.user.id,
      session.user.user_metadata
    );

    if (role === 'roaster') {
      return '/roaster-hub';
    }

    await supabaseBrowser.auth.signOut({ scope: 'local' });
    return '/login?reason=consumer_mobile_only';
  } catch {
    return '/login';
  }
}
