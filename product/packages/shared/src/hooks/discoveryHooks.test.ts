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
      store_url: string | null;
      status: string;
      origin: { country: string | null } | null;
      roasters: { id: string; name: string; country: string | null; city: string | null } | null;
    };
  };
};

type CoffeeLogRow = {
  roast_batches: {
    coffee_id: string;
  } | null;
};

function createMockSupabase(input: {
  qrCodes?: QrCodeRow[];
  coffeeLogs?: CoffeeLogRow[];
  roasters?: RoasterSelectRow[];
  follows?: string[];
  error?: Error | null;
}): unknown {
  return {
    from: (table: string) => {
      if (table === 'coffee_logs') {
        return {
          select: () => ({
            eq: async () => ({
              data: input.coffeeLogs ?? [],
              error: input.error ?? null,
            }),
          }),
        };
      }
      if (table === 'user_roaster_follows') {
        return {
          select: () => ({
            eq: async () => ({
              data: (input.follows ?? []).map((roaster_id) => ({ roaster_id })),
              error: input.error ?? null,
            }),
          }),
        };
      }
      if (table === 'qr_codes') {
        return {
          select: () => ({
            order: () => ({
              limit: async (limit: number) => ({
                data: (input.qrCodes ?? []).slice(0, limit),
                error: input.error ?? null,
              }),
            }),
          }),
        };
      }
      if (table === 'roasters') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: async (limit: number) => ({
                  data: (input.roasters ?? []).slice(0, limit),
                  error: input.error ?? null,
                }),
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: async () => ({
            data: [],
            error: input.error ?? null,
          }),
        }),
      };
    },
  };
}

describe('discovery hooks fetchers', () => {
  const qrCodes: QrCodeRow[] = [
    {
      hash: 'qr-hash-1-newest',
      roast_batches: {
        status: 'active',
        coffees: {
          id: 'coffee-1',
          name: 'Kenya AA',
          processing_method: 'washed',
          store_url: 'https://shop.example.com/kenya-aa',
          status: 'active',
          origin: { country: 'Kenya' },
          roasters: { id: 'roaster-1', name: 'A', country: 'PL', city: 'WAW' },
        },
      },
    },
    {
      hash: 'qr-hash-1-older',
      roast_batches: {
        status: 'active',
        coffees: {
          id: 'coffee-1',
          name: 'Kenya AA',
          processing_method: 'washed',
          store_url: 'https://shop.example.com/kenya-aa',
          status: 'active',
          origin: { country: 'Kenya' },
          roasters: { id: 'roaster-1', name: 'A', country: 'PL', city: 'WAW' },
        },
      },
    },
    {
      hash: 'qr-hash-2',
      roast_batches: {
        status: 'active',
        coffees: {
          id: 'coffee-2',
          name: 'Colombia Pink Bourbon',
          processing_method: 'honey',
          store_url: null,
          status: 'active',
          origin: { country: 'Colombia' },
          roasters: { id: 'roaster-2', name: 'B', country: 'DE', city: 'BER' },
        },
      },
    },
    {
      hash: 'qr-hash-3',
      roast_batches: {
        status: 'active',
        coffees: {
          id: 'coffee-3',
          name: 'Ethiopia Guji',
          processing_method: 'natural',
          store_url: 'https://shop.example.com/ethiopia-guji',
          status: 'active',
          origin: { country: 'Ethiopia' },
          roasters: { id: 'roaster-3', name: 'C', country: 'FR', city: 'PAR' },
        },
      },
    },
  ];

  it('maps coffees payload from qr_codes for anonymous discovery', async () => {
    const supabase = createMockSupabase({
      qrCodes,
    });

    const result = await fetchDiscoverCoffees(supabase as never, { limit: 3 });
    expect(result[0]?.name).toBe('Kenya AA');
    expect(result[0]?.qrHash).toBe('qr-hash-1-newest');
    expect(result[0]?.roaster?.name).toBe('A');
    expect(result[0]?.originCountry).toBe('Kenya');
    expect(result[0]?.storeUrl).toBe('https://shop.example.com/kenya-aa');
    expect(result.map((coffee) => coffee.id)).toEqual(['coffee-1', 'coffee-2', 'coffee-3']);
  });

  it('filters known coffees by coffee_id for signed-in users', async () => {
    const supabase = createMockSupabase({
      qrCodes,
      coffeeLogs: [
        {
          roast_batches: {
            coffee_id: 'coffee-1',
          },
        },
      ],
    });

    const result = await fetchDiscoverCoffees(supabase as never, { userId: 'user-1', limit: 3 });
    expect(result.map((coffee) => coffee.id)).toEqual(['coffee-2', 'coffee-3']);
    expect(result.map((coffee) => coffee.qrHash)).toEqual(['qr-hash-2', 'qr-hash-3']);
  });

  it('merges explicit exclusions with known coffees', async () => {
    const supabase = createMockSupabase({
      qrCodes,
      coffeeLogs: [
        {
          roast_batches: {
            coffee_id: 'coffee-1',
          },
        },
      ],
    });

    const result = await fetchDiscoverCoffees(supabase as never, {
      userId: 'user-1',
      limit: 3,
      excludeCoffeeIds: ['coffee-3', 'coffee-3', ''],
    });

    expect(result.map((coffee) => coffee.id)).toEqual(['coffee-2']);
  });

  it('keeps newest QR ordering after filtering excluded coffees', async () => {
    const supabase = createMockSupabase({
      qrCodes,
    });

    const result = await fetchDiscoverCoffees(supabase as never, {
      limit: 2,
      excludeCoffeeIds: ['coffee-1'],
    });

    expect(result.map((coffee) => coffee.id)).toEqual(['coffee-2', 'coffee-3']);
    expect(result.map((coffee) => coffee.qrHash)).toEqual(['qr-hash-2', 'qr-hash-3']);
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
