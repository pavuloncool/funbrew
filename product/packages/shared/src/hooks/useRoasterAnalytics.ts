import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import {
  aggregateRatingSummary,
  type AnonymizedReview,
  brewMethodsPresentInLogs,
  filterLogsByBrewMethod,
  topFlavorNotesFromLogs,
  type FlavorNoteRank,
  type RatingSummary,
  type RoasterTastingLog,
} from '../analytics/roasterBatchAnalytics';
import type { BrewMethodOption } from '../coffeeTaxonomy';
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
  logged_at: string;
  rating: number;
  brew_method_id: string | null;
  free_text_notes: string | null;
  brew_methods: { id: string; name: string } | null;
  reviews:
    | { body: string; created_at: string }
    | { body: string; created_at: string }[]
    | null;
  coffee_log_tasting_notes: Array<{
    tasting_note_id: string;
    tasting_notes: { id: string; name: string; label: string; category: string } | null;
  }> | null;
};

export type TelemetryAggregateRow = {
  row_scope: 'global' | 'brew_method';
  brew_method_id: string | null;
  total_logs: number;
  logs_with_telemetry: number;
  avg_sensory_acidity: number | null;
  avg_sensory_sweetness: number | null;
  avg_sensory_body: number | null;
  avg_sensory_bitter: number | null;
  avg_sensory_aftertaste: number | null;
  repurchase_yes_count: number;
  repurchase_no_count: number;
  repurchase_unsure_count: number;
  experience_beginner_count: number;
  experience_advanced_count: number;
  experience_expert_count: number;
};

type RepurchaseIntentDistribution = {
  yes: number;
  no: number;
  unsure: number;
};

type ExperienceLevelDistribution = {
  beginner: number;
  advanced: number;
  expert: number;
};

export type TelemetrySummary = {
  totalLogs: number;
  logsWithTelemetry: number;
  coveragePercent: number;
  avgSensoryAcidity: number | null;
  avgSensorySweetness: number | null;
  avgSensoryBody: number | null;
  avgSensoryBitter: number | null;
  avgSensoryAftertaste: number | null;
  repurchaseIntentDistribution: RepurchaseIntentDistribution;
  experienceLevelDistribution: ExperienceLevelDistribution;
};

export type AnonymizedTextEntry = {
  coffeeLogId: string;
  body: string;
  createdAt: string;
  rating: number;
  brewMethodName: string | null;
};

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function coerceCount(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function coerceAverage(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return round2(value);
}

function emptyTelemetrySummary(totalLogs: number): TelemetrySummary {
  return {
    totalLogs,
    logsWithTelemetry: 0,
    coveragePercent: 0,
    avgSensoryAcidity: null,
    avgSensorySweetness: null,
    avgSensoryBody: null,
    avgSensoryBitter: null,
    avgSensoryAftertaste: null,
    repurchaseIntentDistribution: {
      yes: 0,
      no: 0,
      unsure: 0,
    },
    experienceLevelDistribution: {
      beginner: 0,
      advanced: 0,
      expert: 0,
    },
  };
}

function mapAggregateRowToTelemetrySummary(
  row: TelemetryAggregateRow,
  fallbackTotalLogs: number
): TelemetrySummary {
  const totalLogs = coerceCount(row.total_logs) || fallbackTotalLogs;
  const logsWithTelemetry = Math.min(
    totalLogs,
    coerceCount(row.logs_with_telemetry)
  );
  const coveragePercent =
    totalLogs > 0 ? round2((logsWithTelemetry / totalLogs) * 100) : 0;

  return {
    totalLogs,
    logsWithTelemetry,
    coveragePercent,
    avgSensoryAcidity: coerceAverage(row.avg_sensory_acidity),
    avgSensorySweetness: coerceAverage(row.avg_sensory_sweetness),
    avgSensoryBody: coerceAverage(row.avg_sensory_body),
    avgSensoryBitter: coerceAverage(row.avg_sensory_bitter),
    avgSensoryAftertaste: coerceAverage(row.avg_sensory_aftertaste),
    repurchaseIntentDistribution: {
      yes: coerceCount(row.repurchase_yes_count),
      no: coerceCount(row.repurchase_no_count),
      unsure: coerceCount(row.repurchase_unsure_count),
    },
    experienceLevelDistribution: {
      beginner: coerceCount(row.experience_beginner_count),
      advanced: coerceCount(row.experience_advanced_count),
      expert: coerceCount(row.experience_expert_count),
    },
  };
}

export function deriveTelemetrySummariesFromRpc(
  rows: TelemetryAggregateRow[],
  fallbackTotalLogs: number
): {
  global: TelemetrySummary;
  byBrewMethodId: Record<string, TelemetrySummary>;
} {
  const byBrewMethodId: Record<string, TelemetrySummary> = {};
  const globalRow =
    rows.find((row) => row.row_scope === 'global' && row.brew_method_id == null) ??
    null;

  for (const row of rows) {
    if (row.row_scope !== 'brew_method' || !row.brew_method_id) continue;
    byBrewMethodId[row.brew_method_id] = mapAggregateRowToTelemetrySummary(
      row,
      fallbackTotalLogs
    );
  }

  return {
    global: globalRow
      ? mapAggregateRowToTelemetrySummary(globalRow, fallbackTotalLogs)
      : emptyTelemetrySummary(fallbackTotalLogs),
    byBrewMethodId,
  };
}

type EmbeddedReview =
  | { body?: string | null; created_at?: string | null }
  | Array<{ body?: string | null; created_at?: string | null }>
  | null
  | undefined;

export function extractEmbeddedReview(
  review: EmbeddedReview
): { body: string; createdAt: string } | null {
  if (Array.isArray(review)) {
    const first = review[0];
    if (
      first &&
      typeof first.body === 'string' &&
      typeof first.created_at === 'string'
    ) {
      return {
        body: first.body,
        createdAt: first.created_at,
      };
    }
    return null;
  }

  if (
    review &&
    typeof review === 'object' &&
    typeof review.body === 'string' &&
    typeof review.created_at === 'string'
  ) {
    return {
      body: review.body,
      createdAt: review.created_at,
    };
  }

  return null;
}

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
    loggedAt: row.logged_at,
    rating: row.rating,
    brewMethodId: row.brew_method_id,
    brewMethodName: row.brew_methods?.name ?? null,
    freeTextNotes: row.free_text_notes,
    review: extractEmbeddedReview(row.reviews),
    telemetry: null,
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
  anonymizedFreeTextNotes: AnonymizedTextEntry[];
  globalTelemetrySummary: TelemetrySummary;
  telemetryByBrewMethodId: Record<string, TelemetrySummary>;
};

export type RoasterAnalyticsData = RoasterAnalyticsFetched & {
  selectedBrewMethodId: string | null;
  setSelectedBrewMethodId: (id: string | null) => void;
  /** Subset matching the brew-method filter; separate from globalFromStats. */
  filteredSummary: RatingSummary;
  filteredTopFlavorNotes: FlavorNoteRank[];
  filteredTelemetrySummary: TelemetrySummary;
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
              logged_at,
              rating,
              brew_method_id,
              free_text_notes,
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
        const baseLogs = rawLogs.map(mapLogRow);

        const telemetryRpc = await (params.supabase.rpc as unknown as (
          fn: 'get_roaster_batch_telemetry_summary',
          args: { p_batch_id: string }
        ) => Promise<{ data: TelemetryAggregateRow[] | null; error: Error | null }>)(
          'get_roaster_batch_telemetry_summary',
          {
            p_batch_id: params.batchId,
          }
        );
        if (telemetryRpc.error) {
          throw normalizeFlowError({
            error: telemetryRpc.error,
            domain: 'analytics',
          });
        }

        // Telemetry is exposed to roasters only via aggregate RPC, not per-log rows.
        const logs = baseLogs;
        const telemetrySummaries = deriveTelemetrySummariesFromRpc(
          (telemetryRpc.data ?? []) as TelemetryAggregateRow[],
          logs.length
        );
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
          anonymizedFreeTextNotes: logs
            .filter(
              (log) =>
                typeof log.freeTextNotes === 'string' &&
                log.freeTextNotes.trim().length > 0
            )
            .map((log) => ({
              coffeeLogId: log.id,
              body: log.freeTextNotes!.trim(),
              createdAt: log.loggedAt,
              rating: log.rating,
              brewMethodName: log.brewMethodName,
            }))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
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
          globalTelemetrySummary: telemetrySummaries.global,
          telemetryByBrewMethodId: telemetrySummaries.byBrewMethodId,
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
      anonymizedFreeTextNotes,
      anonymizedReviews,
      globalTelemetrySummary,
      telemetryByBrewMethodId,
    } =
      query.data;
    const filteredLogs = filterLogsByBrewMethod(logs, selectedBrewMethodId);
    const selectedTelemetrySummary =
      selectedBrewMethodId && telemetryByBrewMethodId[selectedBrewMethodId]
        ? telemetryByBrewMethodId[selectedBrewMethodId]
        : emptyTelemetrySummary(filteredLogs.length);
    return {
      globalFromStats,
      statsUpdatedAt,
      statsAreFresh,
      logs,
      brewMethodOptions,
      globalTopFlavorNotes,
      anonymizedFreeTextNotes,
      anonymizedReviews,
      globalTelemetrySummary,
      telemetryByBrewMethodId,
      selectedBrewMethodId,
      setSelectedBrewMethodId,
      filteredSummary: aggregateRatingSummary(filteredLogs),
      filteredTopFlavorNotes: topFlavorNotesFromLogs(filteredLogs, 10),
      filteredTelemetrySummary: selectedTelemetrySummary,
    };
  }, [query.data, selectedBrewMethodId]);

  return {
    ...query,
    data,
    selectedBrewMethodId,
    setSelectedBrewMethodId,
  };
}
