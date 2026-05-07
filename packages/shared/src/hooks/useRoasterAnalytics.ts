import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import {
  aggregateRatingSummary,
  type AnonymizedReview,
  brewMethodsPresentInLogs,
  filterLogsByBrewMethod,
  topFlavorNotesFromLogs,
  type BrewMethodOption,
  type FlavorNoteRank,
  type RatingSummary,
  type RoasterTastingLog,
} from '../analytics/roasterBatchAnalytics';
import { logFlowError, normalizeFlowError } from '../errors/flowError';
import type { TypedSupabaseClient } from '../services/supabaseClientFactory';

type CoffeeStatsRow = {
  batch_id: string;
  total_count: number;
  avg_rating: number;
  rating_distribution: Record<string, number>;
  top_flavor_notes: string[];
  updated_at: string;
};

type LogRow = {
  id: string;
  rating: number;
  brew_method_id: string | null;
  brew_methods: { id: string; name: string } | null;
  reviews: { body: string; created_at: string }[] | null;
  coffee_log_tasting_notes: Array<{
    tasting_note_id: string;
    tasting_notes: { id: string; name: string; label: string; category: string } | null;
  }> | null;
};

function mapLogRow(row: LogRow): RoasterTastingLog {
  const flavorNotes: RoasterTastingLog['flavorNotes'] = [];
  for (const tn of row.coffee_log_tasting_notes ?? []) {
    const fn = tn.tasting_notes;
    if (fn?.id) {
      flavorNotes.push({
        id: fn.id,
        name: fn.name,
        label: fn.label,
        category: fn.category,
      });
    }
  }
  return {
    id: row.id,
    rating: row.rating,
    brewMethodId: row.brew_method_id,
    brewMethodName: row.brew_methods?.name ?? null,
    review:
      Array.isArray(row.reviews) && row.reviews[0]?.body
        ? {
            body: row.reviews[0].body,
            createdAt: row.reviews[0].created_at,
          }
        : null,
    flavorNotes,
  };
}

export type UseRoasterAnalyticsParams = {
  supabase: TypedSupabaseClient;
  batchId: string | null;
};

export type RoasterAnalyticsFetched = {
  globalFromStats: RatingSummary | null;
  statsUpdatedAt: string | null;
  statsAreFresh: boolean;
  logs: RoasterTastingLog[];
  brewMethodOptions: BrewMethodOption[];
  globalTopFlavorNotes: FlavorNoteRank[];
  anonymizedReviews: AnonymizedReview[];
};

export type RoasterAnalyticsData = RoasterAnalyticsFetched & {
  selectedBrewMethodId: string | null;
  setSelectedBrewMethodId: (id: string | null) => void;
  /** Subset matching the brew-method filter; separate from globalFromStats. */
  filteredSummary: RatingSummary;
  filteredTopFlavorNotes: FlavorNoteRank[];
};

export function useRoasterAnalytics(params: UseRoasterAnalyticsParams) {
  const [selectedBrewMethodId, setSelectedBrewMethodId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedBrewMethodId(null);
  }, [params.batchId]);

  const query = useQuery({
    queryKey: ['roasterAnalytics', params.batchId],
    enabled: Boolean(params.batchId),
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    queryFn: async (): Promise<RoasterAnalyticsFetched> => {
      try {
        if (!params.batchId) {
          throw normalizeFlowError({
            error: new Error('batchId is required'),
            domain: 'analytics',
            fallbackMessage: 'Missing batch id for analytics.',
          });
        }

        const [statsRes, logsRes] = await Promise.all([
          params.supabase
            .from('coffee_stats')
            .select(
              'batch_id, total_count, avg_rating, rating_distribution, top_flavor_notes, updated_at'
            )
            .eq('batch_id', params.batchId)
            .maybeSingle(),
          params.supabase
            .from('coffee_logs')
            .select(
              `
              id,
              rating,
              brew_method_id,
              brew_methods ( id, name ),
              reviews ( body, created_at ),
              coffee_log_tasting_notes (
                tasting_note_id,
                tasting_notes ( id, name, label, category )
              )
            `
            )
            .eq('batch_id', params.batchId),
        ]);

        if (statsRes.error) {
          throw normalizeFlowError({
            error: statsRes.error,
            domain: 'analytics',
          });
        }
        if (logsRes.error) {
          throw normalizeFlowError({
            error: logsRes.error,
            domain: 'analytics',
          });
        }

        const stats = statsRes.data as CoffeeStatsRow | null;
        const rawLogs = (logsRes.data ?? []) as LogRow[];
        const logs = rawLogs.map(mapLogRow);
        const derivedSummary = aggregateRatingSummary(logs);
        const statsAreFresh =
          stats == null
            ? logs.length === 0
            : stats.total_count === derivedSummary.totalTastings &&
              Number(stats.avg_rating) === derivedSummary.avgRating &&
              JSON.stringify(stats.rating_distribution) ===
                JSON.stringify(derivedSummary.ratingDistribution);

        const globalFromStats: RatingSummary | null = stats
          ? {
              totalTastings: stats.total_count,
              avgRating: Number(stats.avg_rating),
              ratingDistribution: {
                ...stats.rating_distribution,
              },
            }
          : null;

        return {
          globalFromStats,
          statsUpdatedAt: stats?.updated_at ?? null,
          statsAreFresh,
          logs,
          brewMethodOptions: brewMethodsPresentInLogs(logs),
          globalTopFlavorNotes: topFlavorNotesFromLogs(logs, 10),
          anonymizedReviews: logs
            .filter((log) => log.review?.body)
            .map((log) => ({
              coffeeLogId: log.id,
              body: log.review!.body,
              createdAt: log.review!.createdAt,
              rating: log.rating,
              brewMethodName: log.brewMethodName,
            }))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        };
      } catch (error) {
        const normalized = normalizeFlowError({
          error,
          domain: 'analytics',
        });
        logFlowError(normalized, 'useRoasterAnalytics.queryFn');
        throw normalized;
      }
    },
  });

  const data: RoasterAnalyticsData | undefined = useMemo(() => {
    if (!query.data) return undefined;
    const {
      logs,
      globalFromStats,
      statsUpdatedAt,
      statsAreFresh,
      brewMethodOptions,
      globalTopFlavorNotes,
      anonymizedReviews,
    } =
      query.data;
    const filteredLogs = filterLogsByBrewMethod(logs, selectedBrewMethodId);
    return {
      globalFromStats,
      statsUpdatedAt,
      statsAreFresh,
      logs,
      brewMethodOptions,
      globalTopFlavorNotes,
      anonymizedReviews,
      selectedBrewMethodId,
      setSelectedBrewMethodId,
      filteredSummary: aggregateRatingSummary(filteredLogs),
      filteredTopFlavorNotes: topFlavorNotesFromLogs(filteredLogs, 10),
    };
  }, [query.data, selectedBrewMethodId]);

  return {
    ...query,
    data,
    selectedBrewMethodId,
    setSelectedBrewMethodId,
  };
}
