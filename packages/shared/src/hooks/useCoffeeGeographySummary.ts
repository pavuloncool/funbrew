import { useQuery } from '@tanstack/react-query';

import type { TypedSupabaseClient } from '../services/supabaseClientFactory';

type GeographyLogRow = {
  id: string;
  logged_at: string;
  roast_batches: {
    coffees: {
      processing_method: string | null;
      origin: {
        country: string | null;
        region: string | null;
      } | null;
    } | null;
  } | null;
};

export type CoffeeGeographyCountry = {
  country: string;
  count: number;
  topRegion: string | null;
};

export type CoffeeGeographySummary = {
  totalLogs: number;
  uniqueCountries: number;
  topCountries: CoffeeGeographyCountry[];
  processingCounts: Array<{ processingMethod: string; count: number }>;
};

export function buildCoffeeGeographySummary(rows: GeographyLogRow[]): CoffeeGeographySummary {
  const countryCounts = new Map<string, { count: number; regions: Map<string, number> }>();
  const processingCounts = new Map<string, number>();

  for (const row of rows) {
    const coffee = row.roast_batches?.coffees;
    const origin = coffee?.origin;
    const country = origin?.country?.trim();
    const region = origin?.region?.trim();

    if (country) {
      const entry = countryCounts.get(country) ?? { count: 0, regions: new Map<string, number>() };
      entry.count += 1;
      if (region) {
        entry.regions.set(region, (entry.regions.get(region) ?? 0) + 1);
      }
      countryCounts.set(country, entry);
    }

    const processingMethod = coffee?.processing_method?.trim();
    if (processingMethod) {
      processingCounts.set(processingMethod, (processingCounts.get(processingMethod) ?? 0) + 1);
    }
  }

  const topCountries = Array.from(countryCounts.entries())
    .map(([country, data]) => {
      const topRegion = Array.from(data.regions.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return { country, count: data.count, topRegion };
    })
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));

  const normalizedProcessingCounts = Array.from(processingCounts.entries())
    .map(([processingMethod, count]) => ({ processingMethod, count }))
    .sort((a, b) => b.count - a.count || a.processingMethod.localeCompare(b.processingMethod));

  return {
    totalLogs: rows.length,
    uniqueCountries: topCountries.length,
    topCountries,
    processingCounts: normalizedProcessingCounts,
  };
}

export function useCoffeeGeographySummary(params: {
  supabase: TypedSupabaseClient;
  userId: string | null;
}) {
  return useQuery({
    queryKey: ['coffeeGeographySummary', params.userId],
    enabled: Boolean(params.userId),
    queryFn: async () => {
      if (!params.userId) throw new Error('userId is required');

      const { data, error } = await params.supabase
        .from('coffee_logs')
        .select(
          `
          id,
          logged_at,
          roast_batches (
            coffees (
              processing_method,
              origin:origins (
                country,
                region
              )
            )
          )
        `
        )
        .eq('user_id', params.userId)
        .order('logged_at', { ascending: false })
        .returns<GeographyLogRow[]>();

      if (error) throw error;
      return buildCoffeeGeographySummary(data ?? []);
    },
  });
}
