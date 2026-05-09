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
  logged_at: string;
  rating: number;
  brew_method_id: string | null;
  free_text_notes: string | null;
  brew_methods: { id: string; name: string } | null;
  reviews: { body: string; created_at: string }[] | null;
  coffee_log_tasting_notes: Array<{
    tasting_note_id: string;
    tasting_notes: { id: string; name: string; label: string; category: string } | null;
  }> | null;
};

type TelemetryRow = {
  coffee_log_id: string;
  sensory_acidity: number;
  sensory_sweetness: number;
  sensory_body: number;
  repurchase_intent: 'yes' | 'no' | 'unsure';
  experience_level: 'beginner' | 'advanced' | 'expert';
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

function summarizeTelemetry(logs: RoasterTastingLog[]): TelemetrySummary {
  const telemetryLogs = logs.filter((log) => log.telemetry !== null);
  const repurchaseIntentDistribution: RepurchaseIntentDistribution = {
    yes: 0,
    no: 0,
    unsure: 0,
  };
  const experienceLevelDistribution: ExperienceLevelDistribution = {
    beginner: 0,
    advanced: 0,
    expert: 0,
  };

  let aciditySum = 0;
  let sweetnessSum = 0;
  let bodySum = 0;
  for (const log of telemetryLogs) {
    const telemetry = log.telemetry;
    if (!telemetry) continue;
    aciditySum += telemetry.sensoryAcidity;
    sweetnessSum += telemetry.sensorySweetness;
    bodySum += telemetry.sensoryBody;
    repurchaseIntentDistribution[telemetry.repurchaseIntent] += 1;
    experienceLevelDistribution[telemetry.experienceLevel] += 1;
  }

  const logsWithTelemetry = telemetryLogs.length;
  const coveragePercent =
    logs.length > 0 ? round2((logsWithTelemetry / logs.length) * 100) : 0;

  return {
    totalLogs: logs.length,
    logsWithTelemetry,
    coveragePercent,
    avgSensoryAcidity:
      logsWithTelemetry > 0 ? round2(aciditySum / logsWithTelemetry) : null,
    avgSensorySweetness:
      logsWithTelemetry > 0 ? round2(sweetnessSum / logsWithTelemetry) : null,
    avgSensoryBody: logsWithTelemetry > 0 ? round2(bodySum / logsWithTelemetry) : null,
    repurchaseIntentDistribution,
    experienceLevelDistribution,
  };
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
    review:
      Array.isArray(row.reviews) && row.reviews[0]?.body
        ? {
            body: row.reviews[0].body,
            createdAt: row.reviews[0].created_at,
          }
        : null,
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

        const logIds = baseLogs.map((log) => log.id);
        const telemetryByLogId = new Map<string, RoasterTastingLog['telemetry']>();

        if (logIds.length > 0) {
          const telemetryRes = await params.supabase
            .from('coffee_log_telemetry_core')
            .select(
              'coffee_log_id,sensory_acidity,sensory_sweetness,sensory_body,repurchase_intent,experience_level'
            )
            .in('coffee_log_id', logIds);

          if (telemetryRes.error) {
            throw normalizeFlowError({
              error: telemetryRes.error,
              domain: 'analytics',
            });
          }

          for (const row of (telemetryRes.data ?? []) as TelemetryRow[]) {
            telemetryByLogId.set(row.coffee_log_id, {
              sensoryAcidity: row.sensory_acidity,
              sensorySweetness: row.sensory_sweetness,
              sensoryBody: row.sensory_body,
              repurchaseIntent: row.repurchase_intent,
              experienceLevel: row.experience_level,
            });
          }
        }

        const logs = baseLogs.map((log) => ({
          ...log,
          telemetry: telemetryByLogId.get(log.id) ?? null,
        }));
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
          globalTelemetrySummary: summarizeTelemetry(logs),
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
      anonymizedFreeTextNotes,
      anonymizedReviews,
      globalTelemetrySummary,
      selectedBrewMethodId,
      setSelectedBrewMethodId,
      filteredSummary: aggregateRatingSummary(filteredLogs),
      filteredTopFlavorNotes: topFlavorNotesFromLogs(filteredLogs, 10),
      filteredTelemetrySummary: summarizeTelemetry(filteredLogs),
    };
  }, [query.data, selectedBrewMethodId]);

  return {
    ...query,
    data,
    selectedBrewMethodId,
    setSelectedBrewMethodId,
  };
}
