import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { TypedSupabaseClient } from '../services/supabaseClientFactory';
import type { DiscoverRoasterItem } from './useDiscoverRoasters';

type FollowRollbackSnapshot = Array<[readonly unknown[], DiscoverRoasterItem[] | undefined]>;

export async function setRoasterFollowState(params: {
  supabase: TypedSupabaseClient;
  userId: string;
  roasterId: string;
  follow: boolean;
}): Promise<string[]> {
  const { data: userData, error: userError } = await params.supabase
    .from('users')
    .select('following_roaster_ids')
    .eq('id', params.userId)
    .maybeSingle();
  if (userError) throw userError;

  const currentIds = (userData as { following_roaster_ids?: string[] } | null)?.following_roaster_ids ?? [];
  const nextIds = params.follow
    ? Array.from(new Set([...currentIds, params.roasterId]))
    : currentIds.filter((id) => id !== params.roasterId);

  const usersTable = params.supabase.from('users') as unknown as {
    update: (value: { following_roaster_ids: string[] }) => { eq: (column: string, value: string) => Promise<{ error: Error | null }> };
  };

  const { error: updateError } = await usersTable
    .update({ following_roaster_ids: nextIds })
    .eq('id', params.userId);
  if (updateError) throw updateError;

  return nextIds;
}

export function useFollowRoaster(params: { supabase: TypedSupabaseClient; userId: string | null }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { roasterId: string; follow: boolean }) => {
      if (!params.userId) throw new Error('userId is required for follow action');
      return setRoasterFollowState({
        supabase: params.supabase,
        userId: params.userId,
        roasterId: input.roasterId,
        follow: input.follow,
      });
    },
    onMutate: async (input) => {
      if (!params.userId) return { previous: [] as FollowRollbackSnapshot };
      const queryKey = ['discoverRoasters', params.userId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueriesData<DiscoverRoasterItem[]>({ queryKey }) as FollowRollbackSnapshot;

      queryClient.setQueriesData<DiscoverRoasterItem[]>({ queryKey }, (current) =>
        (current ?? []).map((roaster) =>
          roaster.id === input.roasterId ? { ...roaster, isFollowed: input.follow } : roaster
        )
      );

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (!params.userId) return;
      for (const [queryKey, value] of context?.previous ?? []) {
        queryClient.setQueryData(queryKey, value);
      }
    },
    onSettled: (_data, _error, input) => {
      if (!params.userId) return;
      void queryClient.invalidateQueries({ queryKey: ['discoverRoasters', params.userId] });
      void queryClient.invalidateQueries({ queryKey: ['roasterProfile', input.roasterId, params.userId] });
    },
  });
}
