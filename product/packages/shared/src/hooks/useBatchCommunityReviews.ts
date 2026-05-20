import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { TypedSupabaseClient } from '../services/supabaseClientFactory';

export type BatchCommunityReview = {
  reviewId: string;
  body: string;
  coffeeLogId: string;
  loggedAt: string;
  helpfulCount: number;
  viewerMarkedHelpful: boolean;
  authorName: string | null;
  authorSensoryLevel: 'beginner' | 'advanced' | 'expert' | null;
};

type BatchCommunityReviewRow = {
  review_id: string;
  body: string;
  coffee_log_id: string;
  logged_at: string;
  helpful_count: number;
  viewer_marked_helpful: boolean;
  author_name: string | null;
  author_sensory_level: 'beginner' | 'advanced' | 'expert' | null;
};

type ReviewVotesTable = {
  upsert: (value: { review_id: string; user_id: string; vote: boolean }, options: { onConflict: string }) => Promise<{ error: Error | null }>;
  delete: () => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => Promise<{ error: Error | null }>;
    };
  };
};

export async function fetchBatchCommunityReviews(
  supabase: TypedSupabaseClient,
  batchId: string
): Promise<BatchCommunityReview[]> {
  const rpc = (supabase.rpc as unknown as (
    fn: 'get_batch_community_reviews',
    args: { p_batch_id: string }
  ) => Promise<{ data: BatchCommunityReviewRow[] | null; error: Error | null }>)('get_batch_community_reviews', {
    p_batch_id: batchId,
  });
  const { data, error } = await rpc;
  if (error) throw error;

  return ((data ?? []) as BatchCommunityReviewRow[]).map((row) => ({
    reviewId: row.review_id,
    body: row.body,
    coffeeLogId: row.coffee_log_id,
    loggedAt: row.logged_at,
    helpfulCount: Number(row.helpful_count ?? 0),
    viewerMarkedHelpful: Boolean(row.viewer_marked_helpful),
    authorName: row.author_name,
    authorSensoryLevel: row.author_sensory_level,
  }));
}

export async function toggleReviewHelpful(params: {
  supabase: TypedSupabaseClient;
  userId: string;
  reviewId: string;
  shouldMarkHelpful: boolean;
}): Promise<void> {
  const reviewVotesTable = params.supabase.from('review_votes') as unknown as ReviewVotesTable;

  if (params.shouldMarkHelpful) {
    const { error } = await reviewVotesTable.upsert(
      {
        review_id: params.reviewId,
        user_id: params.userId,
        vote: true,
      },
      { onConflict: 'review_id,user_id' }
    );
    if (error) throw error;
    return;
  }

  const { error } = await reviewVotesTable
    .delete()
    .eq('review_id', params.reviewId)
    .eq('user_id', params.userId);
  if (error) throw error;
}

export function useBatchCommunityReviews(params: {
  supabase: TypedSupabaseClient;
  batchId: string | null;
}) {
  return useQuery({
    queryKey: ['batchCommunityReviews', params.batchId],
    enabled: Boolean(params.batchId),
    queryFn: async () => {
      if (!params.batchId) throw new Error('batchId is required');
      return fetchBatchCommunityReviews(params.supabase, params.batchId);
    },
  });
}

export function useToggleReviewHelpful(params: {
  supabase: TypedSupabaseClient;
  userId: string | null;
  batchId: string | null;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { reviewId: string; shouldMarkHelpful: boolean }) => {
      if (!params.userId) throw new Error('userId is required');
      await toggleReviewHelpful({
        supabase: params.supabase,
        userId: params.userId,
        reviewId: input.reviewId,
        shouldMarkHelpful: input.shouldMarkHelpful,
      });
    },
    onMutate: async (input) => {
      if (!params.batchId) return { previous: undefined as BatchCommunityReview[] | undefined };
      const queryKey = ['batchCommunityReviews', params.batchId] as const;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BatchCommunityReview[]>(queryKey);

      queryClient.setQueryData<BatchCommunityReview[]>(queryKey, (current) =>
        (current ?? []).map((review) => {
          if (review.reviewId !== input.reviewId) return review;
          const delta = input.shouldMarkHelpful ? 1 : -1;
          return {
            ...review,
            viewerMarkedHelpful: input.shouldMarkHelpful,
            helpfulCount: Math.max(0, review.helpfulCount + delta),
          };
        })
      );

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (!params.batchId) return;
      queryClient.setQueryData(['batchCommunityReviews', params.batchId], context?.previous);
    },
    onSettled: () => {
      if (!params.batchId) return;
      void queryClient.invalidateQueries({ queryKey: ['batchCommunityReviews', params.batchId] });
      if (params.userId) {
        void queryClient.invalidateQueries({ queryKey: ['communityReputationSummary', params.userId] });
      }
    },
  });
}
