import { useQuery } from '@tanstack/react-query';

import type { TypedSupabaseClient } from '../services/supabaseClientFactory';

export type DiscoverCoffeeItem = {
  /** `coffees.id` — stable product id for keys and analytics. */
  id: string;
  /** `qr_codes.hash` — pass to `useCoffeePage` / `scan_qr` (not the same as `id`). */
  qrHash: string;
  name: string;
  processingMethod: string | null;
  originCountry: string | null;
  storeUrl: string | null;
  roaster: {
    id: string;
    name: string;
    country: string | null;
    city: string | null;
  } | null;
};

type RoasterRel =
  | {
      id: string;
      name: string;
      country: string | null;
      city: string | null;
    }
  | {
      id: string;
      name: string;
      country: string | null;
      city: string | null;
    }[]
  | null;

type QrDiscoverRow = {
  hash: string;
  roast_batches: {
    coffees: {
      id: string;
      name: string;
      processing_method: string | null;
      store_url: string | null;
      origin: {
        country: string | null;
      } | null;
      roasters: RoasterRel;
    };
  } | null;
};

type CoffeeLogBatchRel =
  | {
      coffee_id: string;
    }
  | {
      coffee_id: string;
    }[]
  | null;

type CoffeeLogRow = {
  roast_batches: CoffeeLogBatchRel;
};

function normalizeRoaster(roasters: RoasterRel) {
  const roaster = Array.isArray(roasters) ? roasters[0] ?? null : roasters;
  return roaster
    ? {
        id: roaster.id,
        name: roaster.name,
        country: roaster.country,
        city: roaster.city,
      }
    : null;
}

function normalizeExcludeCoffeeIds(coffeeIds?: string[]): string[] {
  return Array.from(
    new Set(
      (coffeeIds ?? [])
        .map((coffeeId) => coffeeId.trim())
        .filter((coffeeId) => coffeeId.length > 0)
    )
  ).sort();
}

function resolveCoffeeId(batchRel: CoffeeLogBatchRel): string | null {
  const batch = Array.isArray(batchRel) ? batchRel[0] ?? null : batchRel;
  return batch?.coffee_id ?? null;
}

async function fetchKnownCoffeeIds(
  supabase: TypedSupabaseClient,
  userId: string | null
): Promise<Set<string>> {
  if (!userId) return new Set<string>();

  const { data, error } = await supabase
    .from('coffee_logs')
    .select(
      `
      roast_batches (
        coffee_id
      )
    `
    )
    .eq('user_id', userId);

  if (error) throw error;

  return new Set(
    ((data ?? []) as CoffeeLogRow[])
      .map((row) => resolveCoffeeId(row.roast_batches))
      .filter((coffeeId): coffeeId is string => Boolean(coffeeId))
  );
}

export type DiscoverCoffeesOptions = {
  userId?: string | null;
  limit?: number;
  excludeCoffeeIds?: string[];
};

export async function fetchDiscoverCoffees(
  supabase: TypedSupabaseClient,
  options: DiscoverCoffeesOptions = {}
): Promise<DiscoverCoffeeItem[]> {
  const limit = options.limit ?? 12;
  const excludedCoffeeIds = new Set(normalizeExcludeCoffeeIds(options.excludeCoffeeIds));
  const knownCoffeeIds = await fetchKnownCoffeeIds(supabase, options.userId ?? null);
  for (const coffeeId of knownCoffeeIds) {
    excludedCoffeeIds.add(coffeeId);
  }

  const candidateLimit = Math.max(limit * 6, limit + excludedCoffeeIds.size * 4, 24);
  const { data, error } = await supabase
    .from('qr_codes')
    .select(
      `
      hash,
      roast_batches!inner (
        coffees!inner (
          id,
          name,
          processing_method,
          store_url,
          origin:origins (
            country
          ),
          roasters (
            id,
            name,
            country,
            city
          )
        )
      )
    `
    )
    .order('generated_at', { ascending: false })
    .limit(candidateLimit);

  if (error) throw error;

  const rows = (data ?? []) as QrDiscoverRow[];
  const out: DiscoverCoffeeItem[] = [];
  const seenCoffeeIds = new Set<string>();

  for (const row of rows) {
    const coffee = row.roast_batches?.coffees;
    const batch = row.roast_batches;
    if (!coffee || !batch) continue;
    if (excludedCoffeeIds.has(coffee.id)) continue;
    if (seenCoffeeIds.has(coffee.id)) continue;
    seenCoffeeIds.add(coffee.id);
    out.push({
      id: coffee.id,
      qrHash: row.hash,
      name: coffee.name,
      processingMethod: coffee.processing_method,
      originCountry: coffee.origin?.country ?? null,
      storeUrl: coffee.store_url,
      roaster: normalizeRoaster(coffee.roasters),
    });
    if (out.length >= limit) break;
  }

  return out;
}

export function useDiscoverCoffees(params: {
  supabase: TypedSupabaseClient;
  userId?: string | null;
  limit?: number;
  excludeCoffeeIds?: string[];
}) {
  const normalizedExcludeCoffeeIds = normalizeExcludeCoffeeIds(params.excludeCoffeeIds);
  const excludeCoffeeIdsKey = normalizedExcludeCoffeeIds.join(',');

  return useQuery({
    queryKey: ['discoverCoffees', params.userId ?? null, params.limit ?? 12, excludeCoffeeIdsKey],
    queryFn: () =>
      fetchDiscoverCoffees(params.supabase, {
        userId: params.userId,
        limit: params.limit ?? 12,
        excludeCoffeeIds: normalizedExcludeCoffeeIds,
      }),
  });
}
