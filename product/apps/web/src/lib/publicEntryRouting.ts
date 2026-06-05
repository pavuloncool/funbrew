'use client';

import {
  canAccessSurface,
  getDeniedAccessReason,
  resolveAccountRole,
  resolveWebAuthenticatedPath,
} from '@funcup/shared';

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

    if (canAccessSurface(role, 'web_roaster')) {
      return resolveWebAuthenticatedPath(null, session.user.user_metadata);
    }

    await supabaseBrowser.auth.signOut({ scope: 'local' });
    return `/login?reason=${getDeniedAccessReason('web_roaster')}`;
  } catch {
    return '/login';
  }
}
