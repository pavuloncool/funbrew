import { useQuery } from '@tanstack/react-query';
import type { TypedSupabaseClient } from '@funcup/shared';

type RoasterRel =
  | {
      id: string;
    }
  | {
      id: string;
    }[]
  | null;

type RoasterCoffeeQrRow = {
  hash: string;
  generated_at: string;
  roast_batches: {
    coffee_id: string;
    coffees: {
      id: string;
      name: string;
      roasters: RoasterRel;
    } | null;
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
  id: string;
  logged_at: string;
  roast_batches: CoffeeLogBatchRel;
};

export type PublishedRoasterCoffeeItem = {
  coffeeId: string;
  coffeeName: string;
  qrHash: string;
  latestCoffeeLogId: string | null;
  routeKind: 'discover' | 'rated';
};

function resolveRoasterId(roasters: RoasterRel): string | null {
  const roaster = Array.isArray(roasters) ? (roasters[0] ?? null) : roasters;
  return roaster?.id ?? null;
}

function resolveCoffeeId(batchRel: CoffeeLogBatchRel): string | null {
  const batch = Array.isArray(batchRel) ? (batchRel[0] ?? null) : batchRel;
  return batch?.coffee_id ?? null;
}

async function fetchLatestCoffeeLogIdsByCoffee(
  supabase: TypedSupabaseClient,
  userId: string | null
): Promise<Map<string, string>> {
  if (!userId) return new Map<string, string>();

  const { data, error } = await supabase
    .from('coffee_logs')
    .select(
      `
      id,
      logged_at,
      roast_batches (
        coffee_id
      )
    `
    )
    .eq('user_id', userId)
    .order('logged_at', { ascending: false });

  if (error) throw error;

  const latestByCoffeeId = new Map<string, string>();
  for (const row of (data ?? []) as CoffeeLogRow[]) {
    const coffeeId = resolveCoffeeId(row.roast_batches);
    if (!coffeeId || latestByCoffeeId.has(coffeeId)) continue;
    latestByCoffeeId.set(coffeeId, row.id);
  }

  return latestByCoffeeId;
}

export async function fetchRoasterPublishedCoffees(params: {
  supabase: TypedSupabaseClient;
  roasterId: string;
  userId: string | null;
}): Promise<PublishedRoasterCoffeeItem[]> {
  const [latestCoffeeLogIdsByCoffee, qrResult] = await Promise.all([
    fetchLatestCoffeeLogIdsByCoffee(params.supabase, params.userId),
    params.supabase
      .from('qr_codes')
      .select(
        `
        hash,
        generated_at,
        roast_batches!inner (
          coffee_id,
          coffees!inner (
            id,
            name,
            roasters!inner (
              id
            )
          )
        )
      `
      )
      .eq('roast_batches.coffees.roasters.id', params.roasterId)
      .order('generated_at', { ascending: false }),
  ]);

  if (qrResult.error) throw qrResult.error;

  const items: PublishedRoasterCoffeeItem[] = [];
  const seenCoffeeIds = new Set<string>();

  for (const row of (qrResult.data ?? []) as RoasterCoffeeQrRow[]) {
    const batch = row.roast_batches;
    const coffee = batch?.coffees;
    if (!batch || !coffee) continue;
    if (resolveRoasterId(coffee.roasters) !== params.roasterId) continue;
    if (seenCoffeeIds.has(coffee.id)) continue;

    seenCoffeeIds.add(coffee.id);
    const latestCoffeeLogId = latestCoffeeLogIdsByCoffee.get(coffee.id) ?? null;
    items.push({
      coffeeId: coffee.id,
      coffeeName: coffee.name,
      qrHash: row.hash,
      latestCoffeeLogId,
      routeKind: latestCoffeeLogId ? 'rated' : 'discover',
    });
  }

  return items;
}

export function useRoasterPublishedCoffees(params: {
  supabase: TypedSupabaseClient;
  roasterId: string;
  userId: string | null;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['roasterPublishedCoffees', params.roasterId, params.userId ?? null],
    enabled: (params.enabled ?? true) && params.roasterId.length > 0,
    queryFn: () =>
      fetchRoasterPublishedCoffees({
        supabase: params.supabase,
        roasterId: params.roasterId,
        userId: params.userId,
      }),
  });
}
