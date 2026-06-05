import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RoasterFollowSource } from '@funcup/types';

import type { TypedSupabaseClient } from '../services/supabaseClientFactory';
import type { DiscoverRoasterItem } from './useDiscoverRoasters';

type FollowRollbackSnapshot = Array<[readonly unknown[], DiscoverRoasterItem[] | undefined]>;
type FollowRow = { roaster_id: string };

function isDuplicateFollowError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? (error as { code?: string }).code : undefined;
  const message = 'message' in error ? (error as { message?: string }).message : undefined;
  return code === '23505' || typeof message === 'string' && message.toLowerCase().includes('duplicate');
}

async function listFollowedRoasterIds(params: {
  supabase: TypedSupabaseClient;
  userId: string;
}): Promise<string[]> {
  const { data, error } = await params.supabase
    .from('user_roaster_follows')
    .select('roaster_id')
    .eq('user_id', params.userId);
  if (error) throw error;
  return ((data ?? []) as FollowRow[]).map((row) => row.roaster_id);
}

export async function setRoasterFollowState(params: {
  supabase: TypedSupabaseClient;
  userId: string;
  roasterId: string;
  follow: boolean;
  source: RoasterFollowSource;
}): Promise<string[]> {
  const currentIds = await listFollowedRoasterIds({
    supabase: params.supabase,
    userId: params.userId,
  });

  if (params.follow) {
    if (currentIds.includes(params.roasterId)) {
      return currentIds;
    }

    const followsInsert = params.supabase.from('user_roaster_follows') as unknown as {
      insert: (value: {
        user_id: string;
        roaster_id: string;
        source: RoasterFollowSource;
      }) => Promise<{ error: Error | null }>;
    };

    const { error: insertError } = await followsInsert.insert({
      user_id: params.userId,
      roaster_id: params.roasterId,
      source: params.source,
    });
    if (insertError && !isDuplicateFollowError(insertError)) throw insertError;
    return Array.from(new Set([...currentIds, params.roasterId]));
  }

  const followsDelete = params.supabase.from('user_roaster_follows') as unknown as {
    delete: () => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => Promise<{ error: Error | null }>;
      };
    };
  };

  const { error: deleteError } = await followsDelete
    .delete()
    .eq('user_id', params.userId)
    .eq('roaster_id', params.roasterId);
  if (deleteError) throw deleteError;

  return currentIds.filter((id) => id !== params.roasterId);
}

export function useFollowRoaster(params: { supabase: TypedSupabaseClient; userId: string | null }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { roasterId: string; follow: boolean; source: RoasterFollowSource }) => {
      if (!params.userId) throw new Error('userId is required for follow action');
      return setRoasterFollowState({
        supabase: params.supabase,
        userId: params.userId,
        roasterId: input.roasterId,
        follow: input.follow,
        source: input.source,
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
