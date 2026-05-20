import { describe, expect, it } from 'vitest';

import { fetchDiscoverRoasters } from './useDiscoverRoasters';
import { setRoasterFollowState } from './useFollowRoaster';

function createUs3FlowMock(params?: {
  initialFollowing?: string[];
  roasters?: Array<{
    id: string;
    name: string;
    country: string | null;
    city: string | null;
    description: string | null;
    website: string | null;
  }>;
  shouldFailUpdate?: boolean;
}) {
  const state = {
    following: params?.initialFollowing ?? [],
    roasters: params?.roasters ?? [
      {
        id: 'roaster-1',
        name: 'Roaster One',
        country: 'PL',
        city: 'Warsaw',
        description: 'Specialty coffee roaster.',
        website: 'https://example.com',
      },
    ],
  };

  return {
    state,
    client: {
      from: (table: string) => {
        if (table === 'roasters') {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: async () => ({
                    data: state.roasters,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { following_roaster_ids: state.following },
                  error: null,
                }),
              }),
            }),
            update: (value: { following_roaster_ids: string[] }) => ({
              eq: async () => {
                if (params?.shouldFailUpdate) {
                  return { error: new Error('update failed') };
                }
                state.following = value.following_roaster_ids;
                return { error: null };
              },
            }),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      },
    },
  };
}

describe('US3 integration smoke: Hub -> RoasterProfile -> Follow', () => {
  it('discovers roaster and follows from profile flow', async () => {
    const mock = createUs3FlowMock();
    const userId = 'user-1';

    // Hub discover list
    const discovered = await fetchDiscoverRoasters(mock.client as never, { userId, limit: 8 });
    expect(discovered).toHaveLength(1);
    expect(discovered[0]?.id).toBe('roaster-1');
    expect(discovered[0]?.isFollowed).toBe(false);

    // Profile follow action
    await setRoasterFollowState({
      supabase: mock.client as never,
      userId,
      roasterId: 'roaster-1',
      follow: true,
    });

    // Re-fetch reflects follow state (as after profile return/navigation)
    const refreshed = await fetchDiscoverRoasters(mock.client as never, { userId, limit: 8 });
    expect(refreshed[0]?.isFollowed).toBe(true);
    expect(mock.state.following).toEqual(['roaster-1']);
  });

  it('keeps previous state when follow update fails', async () => {
    const mock = createUs3FlowMock({ initialFollowing: [], shouldFailUpdate: true });
    const userId = 'user-1';

    await expect(
      setRoasterFollowState({
        supabase: mock.client as never,
        userId,
        roasterId: 'roaster-1',
        follow: true,
      })
    ).rejects.toThrow('update failed');

    const refreshed = await fetchDiscoverRoasters(mock.client as never, { userId, limit: 8 });
    expect(refreshed[0]?.isFollowed).toBe(false);
    expect(mock.state.following).toEqual([]);
  });
});
