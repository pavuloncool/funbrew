import { canAccessSurface, getDeniedAccessReason, resolveAccountRole } from '@funcup/shared';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { getSupabase } from '../services/supabaseClient';
import { useAuth } from './authProvider';

export function MobileAccountRoleGate() {
  const router = useRouter();
  const { status, user, logout } = useAuth();
  const userId = user?.id ?? null;

  useEffect(() => {
    let active = true;

    if (status !== 'authenticated' || !userId) {
      return () => {
        active = false;
      };
    }
    const currentUserId = userId;

    async function enforceRoleGate() {
      try {
        const {
          data: { user: currentUser },
        } = await getSupabase().auth.getUser();

        if (!active || !currentUser?.id) {
          return;
        }

        const role = await resolveAccountRole(
          getSupabase(),
          currentUserId,
          currentUser.user_metadata
        );
        if (!active || canAccessSurface(role, 'consumer_mobile')) {
          return;
        }

        await logout();
        if (!active) {
          return;
        }

        router.replace(`/(auth)/login-form?reason=${getDeniedAccessReason('consumer_mobile')}`);
      } catch {
        // Best effort gate: leave the current session untouched if role lookup fails.
      }
    }

    void enforceRoleGate();

    return () => {
      active = false;
    };
  }, [logout, router, status, userId]);

  return null;
}
