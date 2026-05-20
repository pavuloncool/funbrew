import { describe, expect, it } from 'vitest';

import { setRoasterFollowState } from './useFollowRoaster';

function createMockSupabase(params?: {
  followingIds?: string[];
  selectError?: Error | null;
  updateError?: Error | null;
}) {
  let storedFollowing = params?.followingIds ?? [];

  return {
    getFollowing: () => storedFollowing,
    client: {
      from: (table: string) => {
        if (table !== 'users') throw new Error('Unexpected table');
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { following_roaster_ids: storedFollowing },
                error: params?.selectError ?? null,
              }),
            }),
          }),
          update: (value: { following_roaster_ids: string[] }) => ({
            eq: async () => {
              if (params?.updateError) {
                return { error: params.updateError };
              }
              storedFollowing = value.following_roaster_ids;
              return { error: null };
            },
          }),
        };
      },
    },
  };
}

describe('setRoasterFollowState', () => {
  it('adds roaster id when follow=true', async () => {
    const mock = createMockSupabase({ followingIds: ['r-1'] });
    const result = await setRoasterFollowState({
      supabase: mock.client as never,
      userId: 'u-1',
      roasterId: 'r-2',
      follow: true,
    });
    expect(result).toEqual(['r-1', 'r-2']);
    expect(mock.getFollowing()).toEqual(['r-1', 'r-2']);
  });

  it('removes roaster id when follow=false', async () => {
    const mock = createMockSupabase({ followingIds: ['r-1', 'r-2'] });
    const result = await setRoasterFollowState({
      supabase: mock.client as never,
      userId: 'u-1',
      roasterId: 'r-1',
      follow: false,
    });
    expect(result).toEqual(['r-2']);
    expect(mock.getFollowing()).toEqual(['r-2']);
  });

  it('throws update errors', async () => {
    const mock = createMockSupabase({ updateError: new Error('update failed') });
    await expect(
      setRoasterFollowState({
        supabase: mock.client as never,
        userId: 'u-1',
        roasterId: 'r-9',
        follow: true,
      })
    ).rejects.toThrow('update failed');
  });
});
