import { useQuery } from '@tanstack/react-query';

import type { TypedSupabaseClient } from '../services/supabaseClientFactory';

export function useJournal(params: { supabase: TypedSupabaseClient; userId: string | null }) {
  return useQuery({
    queryKey: ['journal', params.userId],
    enabled: Boolean(params.userId),
    queryFn: async () => {
      if (!params.userId) throw new Error('userId is required');

      const { data, error } = await params.supabase
        .from('coffee_logs')
        .select(
          `
          id,
          rating,
          free_text_notes,
          logged_at,
          roast_batches (
            id,
            lot_number,
            roast_date,
            coffees (
              id,
              name,
              store_url,
              origin:origins ( country ),
              roasters ( id, name, country, city )
            )
          )
        `
        )
        .eq('user_id', params.userId)
        .order('logged_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });
}
