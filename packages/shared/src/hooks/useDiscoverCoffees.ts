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
      status: string;
      origin: {
        country: string | null;
      } | null;
      roasters: RoasterRel;
    };
  } | null;
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

export async function fetchDiscoverCoffees(
  supabase: TypedSupabaseClient,
  limit = 12
): Promise<DiscoverCoffeeItem[]> {
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
          origin:origins (
            country
          ),
          status,
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
    .limit(Math.max(limit * 3, limit));

  if (error) throw error;

  const rows = (data ?? []) as QrDiscoverRow[];
  const out: DiscoverCoffeeItem[] = [];
  const seenCoffeeIds = new Set<string>();

  for (const row of rows) {
    const coffee = row.roast_batches?.coffees;
    if (!coffee || coffee.status !== 'active') continue;
    if (seenCoffeeIds.has(coffee.id)) continue;
    seenCoffeeIds.add(coffee.id);
    out.push({
      id: coffee.id,
      qrHash: row.hash,
      name: coffee.name,
      processingMethod: coffee.processing_method,
      originCountry: coffee.origin?.country ?? null,
      roaster: normalizeRoaster(coffee.roasters),
    });
    if (out.length >= limit) break;
  }

  return out;
}

export function useDiscoverCoffees(params: { supabase: TypedSupabaseClient; limit?: number }) {
  return useQuery({
    queryKey: ['discoverCoffees', params.limit ?? 12],
    queryFn: () => fetchDiscoverCoffees(params.supabase, params.limit ?? 12),
  });
}
