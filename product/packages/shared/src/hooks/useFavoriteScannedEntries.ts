import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { TypedSupabaseClient } from '../services/supabaseClientFactory';

export type FavoriteScannedEntry = {
  id: string;
  qrHash: string;
  batchId: string;
  coffeeId: string;
  createdAt: string;
  coffeeName: string;
  processingMethod: string | null;
  roastDate: string | null;
  lotNumber: string | null;
  roasterName: string | null;
  roasterCountry: string | null;
  originCountry: string | null;
};

type FavoriteRow = {
  id: string;
  qr_hash: string;
  batch_id: string;
  coffee_id: string;
  created_at: string;
};

type CoffeeLookupRow = {
  id: string;
  name: string;
  processing_method: string | null;
  origin: { country: string | null } | null;
  roasters:
    | { name: string; country: string | null }
    | { name: string; country: string | null }[]
    | null;
};

type BatchLookupRow = {
  id: string;
  roast_date: string;
  lot_number: string;
};

function resolveRoaster(roasters: CoffeeLookupRow['roasters']): {
  name: string | null;
  country: string | null;
} {
  if (!roasters) return { name: null, country: null };
  const roaster = Array.isArray(roasters) ? (roasters[0] ?? null) : roasters;
  if (!roaster) return { name: null, country: null };
  return {
    name: roaster.name ?? null,
    country: roaster.country ?? null,
  };
}

export async function fetchFavoriteScannedEntries(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<FavoriteScannedEntry[]> {
  const favoritesResult = await supabase
    .from('user_favorite_qr_entries')
    .select('id,qr_hash,batch_id,coffee_id,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<FavoriteRow[]>();

  if (favoritesResult.error) throw favoritesResult.error;

  const favoriteRows = favoritesResult.data ?? [];
  if (favoriteRows.length === 0) return [];

  const coffeeIds = Array.from(new Set(favoriteRows.map((row) => row.coffee_id)));
  const batchIds = Array.from(new Set(favoriteRows.map((row) => row.batch_id)));

  const [coffeeResult, batchResult] = await Promise.all([
    supabase
      .from('coffees')
      .select('id,name,processing_method,origin:origins(country),roasters(name,country)')
      .in('id', coffeeIds)
      .returns<CoffeeLookupRow[]>(),
    supabase
      .from('roast_batches')
      .select('id,roast_date,lot_number')
      .in('id', batchIds)
      .returns<BatchLookupRow[]>(),
  ]);

  if (coffeeResult.error) throw coffeeResult.error;
  if (batchResult.error) throw batchResult.error;

  const coffeeMap = new Map((coffeeResult.data ?? []).map((row) => [row.id, row] as const));
  const batchMap = new Map((batchResult.data ?? []).map((row) => [row.id, row] as const));

  return favoriteRows.map((row) => {
    const coffee = coffeeMap.get(row.coffee_id);
    const batch = batchMap.get(row.batch_id);
    const roaster = resolveRoaster(coffee?.roasters ?? null);

    return {
      id: row.id,
      qrHash: row.qr_hash,
      batchId: row.batch_id,
      coffeeId: row.coffee_id,
      createdAt: row.created_at,
      coffeeName: coffee?.name ?? 'Coffee',
      processingMethod: coffee?.processing_method ?? null,
      roastDate: batch?.roast_date ?? null,
      lotNumber: batch?.lot_number ?? null,
      roasterName: roaster.name,
      roasterCountry: roaster.country,
      originCountry: coffee?.origin?.country ?? null,
    };
  });
}

export async function toggleFavoriteScannedEntry(params: {
  supabase: TypedSupabaseClient;
  userId: string;
  qrHash: string;
  batchId: string;
  coffeeId: string;
  shouldFavorite: boolean;
}): Promise<void> {
  const favoritesTable = params.supabase.from('user_favorite_qr_entries') as unknown as {
    upsert: (
      value: {
        user_id: string;
        qr_hash: string;
        batch_id: string;
        coffee_id: string;
      },
      options: { onConflict: string }
    ) => Promise<{ error: Error | null }>;
    delete: () => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => Promise<{ error: Error | null }>;
      };
    };
  };

  if (params.shouldFavorite) {
    const { error } = await favoritesTable.upsert(
        {
          user_id: params.userId,
          qr_hash: params.qrHash,
          batch_id: params.batchId,
          coffee_id: params.coffeeId,
        },
        { onConflict: 'user_id,qr_hash' }
      );
    if (error) throw error;
    return;
  }

  const { error } = await favoritesTable
    .delete()
    .eq('user_id', params.userId)
    .eq('qr_hash', params.qrHash);
  if (error) throw error;
}

export function useFavoriteScannedEntries(params: {
  supabase: TypedSupabaseClient;
  userId: string | null;
}) {
  return useQuery({
    queryKey: ['favoriteScannedEntries', params.userId],
    enabled: Boolean(params.userId),
    queryFn: async () => {
      if (!params.userId) throw new Error('userId is required');
      return fetchFavoriteScannedEntries(params.supabase, params.userId);
    },
  });
}

export function useToggleFavoriteScannedEntry(params: {
  supabase: TypedSupabaseClient;
  userId: string | null;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      qrHash: string;
      batchId: string;
      coffeeId: string;
      shouldFavorite: boolean;
      optimisticEntry?: FavoriteScannedEntry;
    }) => {
      if (!params.userId) throw new Error('userId is required');
      await toggleFavoriteScannedEntry({
        supabase: params.supabase,
        userId: params.userId,
        qrHash: input.qrHash,
        batchId: input.batchId,
        coffeeId: input.coffeeId,
        shouldFavorite: input.shouldFavorite,
      });
    },
    onMutate: async (input) => {
      if (!params.userId) return { previous: undefined as FavoriteScannedEntry[] | undefined };
      const queryKey = ['favoriteScannedEntries', params.userId] as const;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FavoriteScannedEntry[]>(queryKey);

      queryClient.setQueryData<FavoriteScannedEntry[]>(queryKey, (current) => {
        const existing = current ?? [];
        if (input.shouldFavorite) {
          const withoutDuplicate = existing.filter((entry) => entry.qrHash !== input.qrHash);
          if (!input.optimisticEntry) return withoutDuplicate;
          return [input.optimisticEntry, ...withoutDuplicate];
        }
        return existing.filter((entry) => entry.qrHash !== input.qrHash);
      });

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (!params.userId) return;
      queryClient.setQueryData(['favoriteScannedEntries', params.userId], context?.previous);
    },
    onSettled: () => {
      if (!params.userId) return;
      void queryClient.invalidateQueries({ queryKey: ['favoriteScannedEntries', params.userId] });
    },
  });
}
