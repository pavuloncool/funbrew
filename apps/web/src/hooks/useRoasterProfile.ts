'use client';

import { useCallback, useEffect, useState } from 'react';

import { getBrowserUserSafely } from '@/src/lib/supabase/browserAuth';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';
import { isProfileComplete, normalizeRoasterProfileRow, type RoasterProfile } from '@/src/lib/roasterProfile';

type UseRoasterProfileState = {
  loading: boolean;
  userId: string | null;
  profile: RoasterProfile | null;
  exists: boolean;
  complete: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const PROFILE_SELECT =
  'id,user_id,company_name,roaster_short_name,country,city,description,website,logo_url,subscription_status,verification_status';

export function useRoasterProfile(): UseRoasterProfileState {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<RoasterProfile | null>(null);
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
      setProfile(null);
      setLoading(false);
      return;
    }

    if (!user) {
      setUserId(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setUserId(user.id);

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

  return { loading, userId, profile, exists, complete, error, refresh };
}
