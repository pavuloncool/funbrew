import { describe, expect, it } from 'vitest';

import { fetchDiscoverCoffees } from './useDiscoverCoffees';
import { fetchDiscoverRoasters } from './useDiscoverRoasters';

type RoasterSelectRow = {
  id: string;
  name: string;
  country: string | null;
  city: string | null;
  description: string | null;
  website: string | null;
};

type QrCodeRow = {
  hash: string;
  roast_batches: {
    status: string;
    coffees: {
      id: string;
      name: string;
      processing_method: string | null;
      status: string;
      origin: { country: string | null } | null;
      roasters: { id: string; name: string; country: string | null; city: string | null } | null;
    };
  };
};

function createMockSupabase(input: {
  qrCodes?: QrCodeRow[];
  roasters?: RoasterSelectRow[];
  follows?: string[];
  error?: Error | null;
}): unknown {
  return {
    from: (table: string) => {
      if (table === 'users') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { following_roaster_ids: input.follows ?? [] },
                error: input.error ?? null,
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({
                data: table === 'roasters' ? (input.roasters ?? []) : [],
                error: input.error ?? null,
              }),
            }),
          }),
          order: () => ({
            limit: async () => ({
              data: table === 'qr_codes' ? (input.qrCodes ?? []) : [],
              error: input.error ?? null,
            }),
          }),
        }),
      };
    },
  };
}

describe('discovery hooks fetchers', () => {
  it('maps coffees payload from qr_codes', async () => {
    const supabase = createMockSupabase({
      qrCodes: [
        {
          hash: 'qr-hash-1',
          roast_batches: {
            status: 'active',
            coffees: {
              id: 'coffee-1',
              name: 'Kenya AA',
              processing_method: 'washed',
              status: 'active',
              origin: { country: 'Kenya' },
              roasters: { id: 'roaster-1', name: 'A', country: 'PL', city: 'WAW' },
            },
          },
        },
      ],
    });

    const result = await fetchDiscoverCoffees(supabase as never);
    expect(result[0]?.name).toBe('Kenya AA');
    expect(result[0]?.qrHash).toBe('qr-hash-1');
    expect(result[0]?.roaster?.name).toBe('A');
    expect(result[0]?.originCountry).toBe('Kenya');
  });

  it('returns roaster follow state', async () => {
    const supabase = createMockSupabase({
      roasters: [
        {
          id: 'roaster-1',
          name: 'Roaster One',
          country: 'PL',
          city: 'Krakow',
          description: null,
          website: null,
        },
      ],
      follows: ['roaster-1'],
    });

    const result = await fetchDiscoverRoasters(supabase as never, { userId: 'user-1' });
    expect(result[0]?.isFollowed).toBe(true);
  });

  it('throws when supabase returns error', async () => {
    const supabase = createMockSupabase({ error: new Error('boom') });
    await expect(fetchDiscoverCoffees(supabase as never)).rejects.toThrow('boom');
  });
});
