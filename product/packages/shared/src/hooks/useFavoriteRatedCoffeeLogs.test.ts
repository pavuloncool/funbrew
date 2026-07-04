import { describe, expect, it, vi } from 'vitest';

import {
  fetchFavoriteRatedCoffeeLogs,
  toggleFavoriteRatedCoffeeLog,
} from './useFavoriteRatedCoffeeLogs';

type FavoriteRow = {
  coffee_log_id: string;
  created_at: string;
};

type CoffeeLogRow = {
  id: string;
  rating: number | null;
  free_text_notes: string | null;
  logged_at: string;
  roast_batches: {
    id: string;
    lot_number: string | null;
    coffees: {
      name: string;
      processing_method: string | null;
      origin: { country: string | null } | null;
      roasters: { name: string; country: string | null } | null;
    } | null;
  } | null;
};

function createMockSupabase(input: {
  favorites?: FavoriteRow[];
  logs?: CoffeeLogRow[];
  error?: Error | null;
}) {
  const upsert = vi.fn(async () => ({ error: input.error ?? null }));
  const deleteSecondEq = vi.fn(async () => ({ error: input.error ?? null }));
  const deleteFirstEq = vi.fn(() => ({ eq: deleteSecondEq }));
  const deleteFavorite = vi.fn(() => ({ eq: deleteFirstEq }));

  return {
    from: (table: string) => {
      if (table === 'user_favorite_coffee_logs') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                returns: async () => ({
                  data: input.favorites ?? [],
                  error: input.error ?? null,
                }),
              }),
            }),
          }),
          upsert,
          delete: deleteFavorite,
        };
      }

      return {
        select: () => ({
          in: () => ({
            returns: async () => ({
              data: input.logs ?? [],
              error: input.error ?? null,
            }),
          }),
        }),
      };
    },
    calls: {
      upsert,
      delete: deleteFavorite,
      deleteFirstEq,
      deleteSecondEq,
    },
  };
}

describe('favorites rated coffee logs', () => {
  it('maps favorite rows to rated log summaries', async () => {
    const supabase = createMockSupabase({
      favorites: [
        {
          coffee_log_id: 'log-1',
          created_at: '2026-05-10T12:00:00Z',
        },
      ],
      logs: [
        {
          id: 'log-1',
          rating: 4,
          free_text_notes: 'Bright and juicy.',
          logged_at: '2026-05-09T12:00:00Z',
          roast_batches: {
            id: 'batch-1',
            lot_number: 'LOT-77',
            coffees: {
              name: 'Paper Crane',
              processing_method: 'washed',
              origin: { country: 'Ethiopia' },
              roasters: { name: 'Luma Peak', country: 'Poland' },
            },
          },
        },
      ],
    });

    const result = await fetchFavoriteRatedCoffeeLogs(supabase as never, 'user-1');

    expect(result).toEqual([
      {
        coffeeLogId: 'log-1',
        coffeeName: 'Paper Crane',
        roasterName: 'Luma Peak',
        roasterCountry: 'Poland',
        originCountry: 'Ethiopia',
        processingMethod: 'washed',
        lotNumber: 'LOT-77',
        rating: 4,
        loggedAt: '2026-05-09T12:00:00Z',
        freeTextNotes: 'Bright and juicy.',
        favoritedAt: '2026-05-10T12:00:00Z',
      },
    ]);
  });

  it('upserts when marking a log as favorite and deletes when un-favoriting', async () => {
    const supabase = createMockSupabase({});

    await toggleFavoriteRatedCoffeeLog({
      supabase: supabase as never,
      userId: 'user-1',
      coffeeLogId: 'log-9',
      shouldFavorite: true,
    });

    expect(supabase.calls.upsert).toHaveBeenCalledWith(
      {
        user_id: 'user-1',
        coffee_log_id: 'log-9',
      },
      { onConflict: 'user_id,coffee_log_id' }
    );

    await toggleFavoriteRatedCoffeeLog({
      supabase: supabase as never,
      userId: 'user-1',
      coffeeLogId: 'log-9',
      shouldFavorite: false,
    });

    expect(supabase.calls.delete).toHaveBeenCalledTimes(1);
    expect(supabase.calls.deleteFirstEq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(supabase.calls.deleteSecondEq).toHaveBeenCalledWith('coffee_log_id', 'log-9');
  });

  it('throws when the favorites query fails', async () => {
    const supabase = createMockSupabase({
      error: new Error('favorites-failed'),
    });

    await expect(
      fetchFavoriteRatedCoffeeLogs(supabase as never, 'user-1')
    ).rejects.toThrow('favorites-failed');
  });
});
