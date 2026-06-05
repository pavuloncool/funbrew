'use client';

import { requiresPasswordChange } from '@funcup/shared';
import { useCallback, useEffect, useState } from 'react';

import { getBrowserUserSafely } from '@/src/lib/supabase/browserAuth';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';
import { isProfileComplete, normalizeRoasterProfileRow, type RoasterProfile } from '@/src/lib/roasterProfile';

type UseRoasterProfileState = {
  loading: boolean;
  userId: string | null;
  userMetadata: unknown;
  profile: RoasterProfile | null;
  exists: boolean;
  complete: boolean;
  requiresPasswordChange: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const PROFILE_SELECT =
  'id,user_id,customer_number,company_name,roaster_short_name,country,city,description,website,logo_url,subscription_status,verification_status';

export function useRoasterProfile(): UseRoasterProfileState {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userMetadata, setUserMetadata] = useState<unknown>(null);
  const [profile, setProfile] = useState<RoasterProfile | null>(null);
  const [requiresPasswordReset, setRequiresPasswordReset] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    let user = null;
    try {
      user = await getBrowserUserSafely();
    } catch (userError) {
      setError(userError instanceof Error ? userError.message : 'Auth error');
      setUserId(null);
      setUserMetadata(null);
      setProfile(null);
      setRequiresPasswordReset(false);
      setLoading(false);
      return;
    }

    if (!user) {
      setUserId(null);
      setUserMetadata(null);
      setProfile(null);
      setRequiresPasswordReset(false);
      setLoading(false);
      return;
    }

    setUserId(user.id);
    setUserMetadata(user.user_metadata);
    setRequiresPasswordReset(requiresPasswordChange(user.user_metadata));

    const { data, error: profileError } = await supabaseBrowser
      .from('roasters')
      .select(PROFILE_SELECT)
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      setProfile(null);
      setLoading(false);
      return;
    }

    const normalized = normalizeRoasterProfileRow(data);
    setProfile(normalized);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const exists = Boolean(profile);
  const complete = isProfileComplete(profile);

  return {
    loading,
    userId,
    userMetadata,
    profile,
    exists,
    complete,
    requiresPasswordChange: requiresPasswordReset,
    error,
    refresh,
  };
}
