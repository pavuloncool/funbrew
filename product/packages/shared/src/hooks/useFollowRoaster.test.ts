import { describe, expect, it } from 'vitest';

import { setRoasterFollowState } from './useFollowRoaster';

function createMockSupabase(params?: {
  followingIds?: string[];
  selectError?: Error | null;
  insertError?: Error | null;
  deleteError?: Error | null;
}) {
  let storedFollowing = params?.followingIds ?? [];

  return {
    getFollowing: () => storedFollowing,
    client: {
      from: (table: string) => {
        if (table !== 'user_roaster_follows') throw new Error('Unexpected table');
        return {
          select: () => ({
            eq: async () => ({
              data: storedFollowing.map((roaster_id) => ({ roaster_id })),
              error: params?.selectError ?? null,
            }),
          }),
          insert: async (value: { roaster_id: string }) => {
            if (params?.insertError) {
              return { error: params.insertError };
            }
            if (!storedFollowing.includes(value.roaster_id)) {
              storedFollowing = [...storedFollowing, value.roaster_id];
            }
            return { error: null };
          },
          delete: () => ({
            eq: (_column: string, _value: string) => ({
              eq: async (_columnInner: string, roasterId: string) => {
                if (params?.deleteError) {
                  return { error: params.deleteError };
                }
                storedFollowing = storedFollowing.filter((id) => id !== roasterId);
                return { error: null };
              },
            }),
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
      source: 'roasters-screen',
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
      source: 'roasters-screen',
    });
    expect(result).toEqual(['r-2']);
    expect(mock.getFollowing()).toEqual(['r-2']);
  });

  it('throws insert errors', async () => {
    const mock = createMockSupabase({ insertError: new Error('insert failed') });
    await expect(
      setRoasterFollowState({
        supabase: mock.client as never,
        userId: 'u-1',
        roasterId: 'r-9',
        follow: true,
        source: 'roasters-screen',
      })
    ).rejects.toThrow('insert failed');
  });
});
