import { useQuery } from '@tanstack/react-query';

import type { TypedSupabaseClient } from '../services/supabaseClientFactory';

export type DiscoverRoasterItem = {
  id: string;
  name: string;
  country: string | null;
  city: string | null;
  description: string | null;
  website: string | null;
  isFollowed: boolean;
};

type RoasterRow = {
  id: string;
  name: string;
  country: string | null;
  city: string | null;
  description: string | null;
  website: string | null;
};

export async function fetchDiscoverRoasters(
  supabase: TypedSupabaseClient,
  options?: { userId?: string | null; limit?: number }
): Promise<DiscoverRoasterItem[]> {
  const limit = options?.limit ?? 12;
  const userId = options?.userId ?? null;

  const { data, error } = await supabase
    .from('roasters')
    .select('id,name,country,city,description,website')
    .eq('verification_status', 'verified')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  let followingIds = new Set<string>();
  if (userId) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('following_roaster_ids')
      .eq('id', userId)
      .maybeSingle();
    if (userError) throw userError;
    const userRow = userData as { following_roaster_ids?: string[] } | null;
    followingIds = new Set(userRow?.following_roaster_ids ?? []);
  }

  return ((data ?? []) as RoasterRow[]).map((roaster) => ({
    id: roaster.id,
    name: roaster.name,
    country: roaster.country,
    city: roaster.city,
    description: roaster.description,
    website: roaster.website,
    isFollowed: followingIds.has(roaster.id),
  }));
}

export function useDiscoverRoasters(params: {
  supabase: TypedSupabaseClient;
  userId?: string | null;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['discoverRoasters', params.userId ?? null, params.limit ?? 12],
    queryFn: () =>
      fetchDiscoverRoasters(params.supabase, {
        userId: params.userId,
        limit: params.limit ?? 12,
      }),
  });
}
