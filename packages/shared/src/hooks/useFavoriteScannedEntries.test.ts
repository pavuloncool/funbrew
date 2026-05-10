import { describe, expect, it } from 'vitest';

import { fetchFavoriteScannedEntries } from './useFavoriteScannedEntries';

type FavoriteRow = {
  id: string;
  qr_hash: string;
  batch_id: string;
  coffee_id: string;
  created_at: string;
};

type CoffeeRow = {
  id: string;
  name: string;
  processing_method: string | null;
  origin: { country: string | null } | null;
  roasters: { name: string; country: string | null } | null;
};

type BatchRow = {
  id: string;
  roast_date: string;
  lot_number: string;
};

function createMockSupabase(input: {
  favorites?: FavoriteRow[];
  coffees?: CoffeeRow[];
  batches?: BatchRow[];
  error?: Error | null;
}): unknown {
  return {
    from: (table: string) => {
      if (table === 'user_favorite_qr_entries') {
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
        };
      }

      if (table === 'coffees') {
        return {
          select: () => ({
            in: () => ({
              returns: async () => ({
                data: input.coffees ?? [],
                error: input.error ?? null,
              }),
            }),
          }),
        };
      }

      return {
        select: () => ({
          in: () => ({
            returns: async () => ({
              data: input.batches ?? [],
              error: input.error ?? null,
            }),
          }),
        }),
      };
    },
  };
}

describe('fetchFavoriteScannedEntries', () => {
  it('maps roaster and origin country fields for search', async () => {
    const supabase = createMockSupabase({
      favorites: [
        {
          id: 'fav-1',
          qr_hash: 'qr-1',
          batch_id: 'batch-1',
          coffee_id: 'coffee-1',
          created_at: '2026-05-10T00:00:00Z',
        },
      ],
      coffees: [
        {
          id: 'coffee-1',
          name: 'Paper Crane',
          processing_method: 'washed',
          origin: { country: 'Ethiopia' },
          roasters: { name: 'Luma Peak', country: 'Poland' },
        },
      ],
      batches: [
        {
          id: 'batch-1',
          roast_date: '2026-05-01',
          lot_number: 'LUMA-01',
        },
      ],
    });

    const result = await fetchFavoriteScannedEntries(supabase as never, 'user-1');
    expect(result).toHaveLength(1);
    expect(result[0]?.roasterName).toBe('Luma Peak');
    expect(result[0]?.roasterCountry).toBe('Poland');
    expect(result[0]?.originCountry).toBe('Ethiopia');
  });

  it('throws when favorites query fails', async () => {
    const supabase = createMockSupabase({
      error: new Error('favorites-failed'),
    });

    await expect(
      fetchFavoriteScannedEntries(supabase as never, 'user-1')
    ).rejects.toThrow('favorites-failed');
  });
});
