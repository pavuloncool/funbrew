import { useQuery } from '@tanstack/react-query';

import type { TypedSupabaseClient } from '../services/supabaseClientFactory';

export type CommunityReputationSummary = {
  reviewCount: number;
  helpfulReceived: number;
};

export function useCommunityReputationSummary(params: {
  supabase: TypedSupabaseClient;
  userId: string | null;
}) {
  return useQuery({
    queryKey: ['communityReputationSummary', params.userId],
    enabled: Boolean(params.userId),
    queryFn: async () => {
      if (!params.userId) throw new Error('userId is required');

      const { data, error } = await (params.supabase.rpc as unknown as (
        fn: 'get_user_community_summary',
        args: { p_user_id: string }
      ) => Promise<{ data: Array<{ review_count: number; helpful_received: number }> | null; error: Error | null }>)('get_user_community_summary', {
        p_user_id: params.userId,
      });
      if (error) throw error;

      const row = data?.[0];
      return {
        reviewCount: Number(row?.review_count ?? 0),
        helpfulReceived: Number(row?.helpful_received ?? 0),
      };
    },
  });
}
