import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { TypedSupabaseClient } from '../services/supabaseClientFactory';

type FavoriteRatedCoffeeLogRow = {
  coffee_log_id: string;
  created_at: string;
};

type CoffeeLogRoasterRow =
  | {
      name: string;
      country: string | null;
    }
  | {
      name: string;
      country: string | null;
    }[]
  | null;

type CoffeeLogCoffeeRow =
  | {
      name: string;
      processing_method: string | null;
      origin: { country: string | null } | null;
      roasters: CoffeeLogRoasterRow;
    }
  | {
      name: string;
      processing_method: string | null;
      origin: { country: string | null } | null;
      roasters: CoffeeLogRoasterRow;
    }[]
  | null;

type CoffeeLogBatchRow =
  | {
      id: string;
      lot_number: string | null;
      coffees: CoffeeLogCoffeeRow;
    }
  | {
      id: string;
      lot_number: string | null;
      coffees: CoffeeLogCoffeeRow;
    }[]
  | null;

type CoffeeLogRow = {
  id: string;
  rating: number | null;
  free_text_notes: string | null;
  logged_at: string;
  roast_batches: CoffeeLogBatchRow;
};

export type RatedCoffeeLogSummary = {
  coffeeLogId: string;
  coffeeName: string;
  roasterName: string | null;
  roasterCountry: string | null;
  originCountry: string | null;
  processingMethod: string | null;
  lotNumber: string | null;
  rating: number | null;
  loggedAt: string;
  freeTextNotes: string | null;
};

export type FavoriteRatedCoffeeLog = RatedCoffeeLogSummary & {
  favoritedAt: string;
};

function resolveSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function resolveRoaster(roasters: CoffeeLogRoasterRow): {
  name: string | null;
  country: string | null;
} {
  const roaster = resolveSingle(roasters);
  if (!roaster) return { name: null, country: null };
  return {
    name: roaster.name ?? null,
    country: roaster.country ?? null,
  };
}

function toRatedCoffeeLogSummary(
  favoriteRow: FavoriteRatedCoffeeLogRow,
  logRow: CoffeeLogRow | undefined
): FavoriteRatedCoffeeLog | null {
  if (!logRow) return null;
  const batch = resolveSingle(logRow.roast_batches);
  const coffee = resolveSingle(batch?.coffees ?? null);
  const roaster = resolveRoaster(coffee?.roasters ?? null);

  return {
    coffeeLogId: logRow.id,
    coffeeName: coffee?.name ?? 'Coffee',
    roasterName: roaster.name,
    roasterCountry: roaster.country,
    originCountry: coffee?.origin?.country ?? null,
    processingMethod: coffee?.processing_method ?? null,
    lotNumber: batch?.lot_number ?? null,
    rating: logRow.rating ?? null,
    loggedAt: logRow.logged_at,
    freeTextNotes: logRow.free_text_notes,
    favoritedAt: favoriteRow.created_at,
  };
}

export async function fetchFavoriteRatedCoffeeLogs(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<FavoriteRatedCoffeeLog[]> {
  const favoritesResult = await supabase
    .from('user_favorite_coffee_logs')
    .select('coffee_log_id,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<FavoriteRatedCoffeeLogRow[]>();

  if (favoritesResult.error) throw favoritesResult.error;

  const favoriteRows = favoritesResult.data ?? [];
  if (favoriteRows.length === 0) return [];

  const logIds = Array.from(new Set(favoriteRows.map((row) => row.coffee_log_id)));
  const logsResult = await supabase
    .from('coffee_logs')
    .select(
      `
      id,
      rating,
      free_text_notes,
      logged_at,
      roast_batches (
        id,
        lot_number,
        coffees (
          name,
          processing_method,
          origin:origins (
            country
          ),
          roasters (
            name,
            country
          )
        )
      )
    `
    )
    .in('id', logIds)
    .returns<CoffeeLogRow[]>();

  if (logsResult.error) throw logsResult.error;

  const logMap = new Map((logsResult.data ?? []).map((row) => [row.id, row] as const));
  return favoriteRows
    .map((row) => toRatedCoffeeLogSummary(row, logMap.get(row.coffee_log_id)))
    .filter((row): row is FavoriteRatedCoffeeLog => Boolean(row));
}

export async function toggleFavoriteRatedCoffeeLog(params: {
  supabase: TypedSupabaseClient;
  userId: string;
  coffeeLogId: string;
  shouldFavorite: boolean;
}): Promise<void> {
  const favoritesTable = params.supabase.from('user_favorite_coffee_logs') as unknown as {
    upsert: (
      value: {
        user_id: string;
        coffee_log_id: string;
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
        coffee_log_id: params.coffeeLogId,
      },
      { onConflict: 'user_id,coffee_log_id' }
    );
    if (error) throw error;
    return;
  }

  const { error } = await favoritesTable
    .delete()
    .eq('user_id', params.userId)
    .eq('coffee_log_id', params.coffeeLogId);
  if (error) throw error;
}

export function useFavoriteRatedCoffeeLogs(params: {
  supabase: TypedSupabaseClient;
  userId: string | null;
}) {
  return useQuery({
    queryKey: ['favoriteRatedCoffeeLogs', params.userId],
    enabled: Boolean(params.userId),
    queryFn: async () => {
      if (!params.userId) throw new Error('userId is required');
      return fetchFavoriteRatedCoffeeLogs(params.supabase, params.userId);
    },
  });
}

export function useToggleFavoriteRatedCoffeeLog(params: {
  supabase: TypedSupabaseClient;
  userId: string | null;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      coffeeLogId: string;
      shouldFavorite: boolean;
      optimisticEntry?: RatedCoffeeLogSummary;
    }) => {
      if (!params.userId) throw new Error('userId is required');
      await toggleFavoriteRatedCoffeeLog({
        supabase: params.supabase,
        userId: params.userId,
        coffeeLogId: input.coffeeLogId,
        shouldFavorite: input.shouldFavorite,
      });
    },
    onMutate: async (input) => {
      if (!params.userId) return { previous: undefined as FavoriteRatedCoffeeLog[] | undefined };
      const queryKey = ['favoriteRatedCoffeeLogs', params.userId] as const;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FavoriteRatedCoffeeLog[]>(queryKey);

      queryClient.setQueryData<FavoriteRatedCoffeeLog[]>(queryKey, (current) => {
        const existing = current ?? [];
        if (input.shouldFavorite) {
          if (!input.optimisticEntry) {
            return existing.filter((entry) => entry.coffeeLogId !== input.coffeeLogId);
          }
          const optimisticEntry: FavoriteRatedCoffeeLog = {
            ...input.optimisticEntry,
            favoritedAt: new Date().toISOString(),
          };
          return [
            optimisticEntry,
            ...existing.filter((entry) => entry.coffeeLogId !== input.coffeeLogId),
          ];
        }

        return existing.filter((entry) => entry.coffeeLogId !== input.coffeeLogId);
      });

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (!params.userId) return;
      queryClient.setQueryData(['favoriteRatedCoffeeLogs', params.userId], context?.previous);
    },
    onSettled: () => {
      if (!params.userId) return;
      void queryClient.invalidateQueries({ queryKey: ['favoriteRatedCoffeeLogs', params.userId] });
      void queryClient.invalidateQueries({ queryKey: ['coffeePage'] });
    },
  });
}
