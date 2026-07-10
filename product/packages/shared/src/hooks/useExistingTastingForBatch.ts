import { useQuery } from '@tanstack/react-query';

import type { TypedSupabaseClient } from '../services/supabaseClientFactory';
import { fetchExistingTastingForBatch } from '../services/tastingService';

export function useExistingTastingForBatch(params: {
  supabase: TypedSupabaseClient;
  userId: string | null;
  batchId: string | null;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['existingTastingForBatch', params.userId, params.batchId],
    enabled: (params.enabled ?? true) && Boolean(params.userId && params.batchId),
    queryFn: async () => {
      if (!params.userId || !params.batchId) throw new Error('userId and batchId are required');
      return fetchExistingTastingForBatch(params.supabase, {
        userId: params.userId,
        batchId: params.batchId,
      });
    },
  });
}
