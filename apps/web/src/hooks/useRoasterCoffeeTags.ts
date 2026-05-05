'use client';

import { useQuery } from '@tanstack/react-query';

import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

import type { Database } from '../../../../supabase/types/database';

export type RoasterCoffeeTagRow = Database['public']['Tables']['roaster_coffee_tags']['Row'];

const SELECT_TAGS =
  'id, public_hash, roaster_id, roaster_short_name, img_coffee_label, bean_origin_country, bean_origin_farm, bean_origin_tradename, bean_origin_region, bean_type, bean_varietal_main, bean_varietal_extra, bean_origin_height, bean_processing, bean_roast_date, bean_roast_level, brew_method, tasting_note_ids, created_at, updated_at';

async function fetchRoasterCoffeeTags(roasterId: string): Promise<RoasterCoffeeTagRow[]> {
  const { data, error } = await supabaseBrowser
    .from('roaster_coffee_tags')
    .select(SELECT_TAGS)
    .eq('roaster_id', roasterId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RoasterCoffeeTagRow[];
}

export function useRoasterCoffeeTags(roasterId: string | null) {
  return useQuery({
    queryKey: ['roaster-coffee-tags', roasterId],
    queryFn: () => fetchRoasterCoffeeTags(roasterId as string),
    enabled: Boolean(roasterId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: 'always',
  });
}
