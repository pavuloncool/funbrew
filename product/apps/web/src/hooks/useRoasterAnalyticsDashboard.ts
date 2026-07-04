'use client';

import {
  aggregateRatingSummary,
  brewMethodCountsFromLogs,
  compareDeclaredToPerceived,
  SENSORY_CORE_METRICS,
  topFlavorNotesFromLogs,
  type BatchPublicationDetail,
  type BrewMethodRank,
  type FlavorNoteRank,
  type RatingSummary,
  type RoasterAnalyticsData,
} from '@funcup/shared';
import { differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

export type AnalyticsDashboardFilters = {
  brewMethodId: string | null;
  minRating: number | null;
  maxRating: number | null;
  startDate: string;
  endDate: string;
  feedbackQuery: string;
};

export type AnalyticsOverviewMetrics = {
  totalTastings: number;
  avgRating: number;
  reviewCount: number;
  noteCount: number;
  favoriteUsersCount: number;
  telemetryCoverage: number;
};

export type AnalyticsTrendPoint = {
  label: string;
  totalTastings: number;
  avgRating: number;
};

export type AnalyticsExportDataset = {
  key: string;
  label: string;
  fileName: string;
  rows: Array<Record<string, string | number | null>>;
};

export type RadarMetricRow = {
  metric: 'Acidity' | 'Sweet' | 'Body' | 'Bitter' | 'Finish';
  declared: number | null;
  perceived: number | null;
  delta: number | null;
  status: 'aligned' | 'higher' | 'lower' | 'missing';
  isMissingDeclared: boolean;
  isMissingPerceived: boolean;
};

function emptyFilters(): AnalyticsDashboardFilters {
  return {
    brewMethodId: null,
    minRating: null,
    maxRating: null,
    startDate: '',
    endDate: '',
    feedbackQuery: '',
  };
}

function matchesDateRange(value: string, startDate: string, endDate: string): boolean {
  if (!startDate && !endDate) return true;
  const day = value.slice(0, 10);
  if (startDate && day < startDate) return false;
  if (endDate && day > endDate) return false;
  return true;
}

function matchesRatingRange(rating: number, minRating: number | null, maxRating: number | null): boolean {
  if (minRating != null && rating < minRating) return false;
  if (maxRating != null && rating > maxRating) return false;
  return true;
}

function filterLogs(
  logs: RoasterAnalyticsData['logs'],
  filters: AnalyticsDashboardFilters
) {
  return logs.filter((log) => {
    if (filters.brewMethodId && log.brewMethodId !== filters.brewMethodId) return false;
    if (!matchesDateRange(log.loggedAt, filters.startDate, filters.endDate)) return false;
    if (!matchesRatingRange(log.rating, filters.minRating, filters.maxRating)) return false;
    return true;
  });
}

function toTrendPoints(logs: RoasterAnalyticsData['logs']): AnalyticsTrendPoint[] {
  if (logs.length === 0) return [];
  const sortedLogs = [...logs].sort((left, right) => left.loggedAt.localeCompare(right.loggedAt));
  const first = parseISO(sortedLogs[0].loggedAt);
  const last = parseISO(sortedLogs[sortedLogs.length - 1].loggedAt);
  const useWeeklyBuckets = differenceInCalendarDays(last, first) > 45;
  const buckets = new Map<string, { label: string; ratings: number[]; totalTastings: number }>();

  for (const log of sortedLogs) {
    const date = parseISO(log.loggedAt);
    const bucketDate = useWeeklyBuckets ? startOfWeek(date, { weekStartsOn: 1 }) : date;
    const key = format(bucketDate, 'yyyy-MM-dd');
    const label = useWeeklyBuckets ? `Week of ${format(bucketDate, 'MMM d')}` : format(date, 'MMM d');
    const current = buckets.get(key) ?? { label, ratings: [], totalTastings: 0 };
    current.totalTastings += 1;
    current.ratings.push(log.rating);
    buckets.set(key, current);
  }

  return [...buckets.entries()].map(([, bucket]) => ({
    label: bucket.label,
    totalTastings: bucket.totalTastings,
    avgRating: Number(
      (bucket.ratings.reduce((sum, rating) => sum + rating, 0) / bucket.ratings.length).toFixed(2)
    ),
  }));
}

function filterFeedback<T extends { body: string }>(rows: T[], query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return rows;
  return rows.filter((row) => row.body.toLocaleLowerCase().includes(normalized));
}

function compareRadarMetrics(params: {
  detail: BatchPublicationDetail | null;
  telemetrySummary: RoasterAnalyticsData['globalTelemetrySummary'];
}): RadarMetricRow[] {
  return SENSORY_CORE_METRICS.map((metric) => {
    const comparison = compareDeclaredToPerceived(
      params.detail?.batch[metric.declaredKey] ?? null,
      params.telemetrySummary[metric.averageKey]
    );

    return {
      metric: metric.label,
      declared: comparison.declared,
      perceived: comparison.perceived,
      delta: comparison.delta,
      status: comparison.status,
      isMissingDeclared: comparison.isMissingDeclared,
      isMissingPerceived: comparison.isMissingPerceived,
    };
  });
}

function summaryCaption(filters: AnalyticsDashboardFilters): string {
  const parts: string[] = [];
  if (filters.brewMethodId) parts.push('brew method');
  if (filters.startDate || filters.endDate) parts.push('date range');
  if (filters.minRating != null || filters.maxRating != null) parts.push('rating range');
  return parts.length > 0 ? `Filtered by ${parts.join(', ')}.` : 'All tastings in this batch.';
}

export function buildDashboardExportDatasets(params: {
  batchId: string;
  coffeeName: string;
  lotNumber: string;
  filters: AnalyticsDashboardFilters;
  summary: RatingSummary;
  overview: AnalyticsOverviewMetrics;
  trends: AnalyticsTrendPoint[];
  brewMethods: BrewMethodRank[];
  flavorNotes: FlavorNoteRank[];
  reviews: RoasterAnalyticsData['anonymizedReviews'];
  notes: RoasterAnalyticsData['anonymizedFreeTextNotes'];
}) {
  const stamp = `${params.coffeeName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'batch'}-${params.batchId.slice(0, 8)}`;

  const filterLabel = summaryCaption(params.filters);

  return [
    {
      key: 'overview',
      label: 'Export overview CSV',
      fileName: `${stamp}-overview.csv`,
      rows: [
        {
          coffee_name: params.coffeeName,
          lot_number: params.lotNumber,
          scope: filterLabel,
          total_tastings: params.overview.totalTastings,
          average_rating: params.overview.avgRating,
          telemetry_coverage_percent: params.overview.telemetryCoverage,
          review_count: params.overview.reviewCount,
          note_count: params.overview.noteCount,
        },
      ],
    },
    {
      key: 'trends',
      label: 'Export trends CSV',
      fileName: `${stamp}-trends.csv`,
      rows: params.trends.map((point) => ({
        period: point.label,
        total_tastings: point.totalTastings,
        average_rating: point.avgRating,
      })),
    },
    {
      key: 'taxonomy',
      label: 'Export taxonomy CSV',
      fileName: `${stamp}-taxonomy.csv`,
      rows: [
        ...params.brewMethods.map((item) => ({
          dataset: 'brew_methods',
          label: item.name,
          count: item.count,
        })),
        ...params.flavorNotes.map((item) => ({
          dataset: 'flavor_notes',
          label: item.label,
          category: item.category,
          count: item.count,
        })),
      ],
    },
    {
      key: 'feedback',
      label: 'Export feedback CSV',
      fileName: `${stamp}-feedback.csv`,
      rows: [
        ...params.reviews.map((review) => ({
          dataset: 'reviews',
          created_at: review.createdAt,
          rating: review.rating,
          brew_method: review.brewMethodName,
          body: review.body,
        })),
        ...params.notes.map((note) => ({
          dataset: 'free_text_notes',
          created_at: note.createdAt,
          rating: note.rating,
          brew_method: note.brewMethodName,
          body: note.body,
        })),
      ],
    },
  ] satisfies AnalyticsExportDataset[];
}

export function useRoasterAnalyticsDashboard(params: {
  analytics: RoasterAnalyticsData | undefined;
  detail: BatchPublicationDetail | null;
  initialFilters?: Partial<AnalyticsDashboardFilters>;
}) {
  const [filters, setFilters] = useState<AnalyticsDashboardFilters>(() => ({
    ...emptyFilters(),
    ...params.initialFilters,
  }));

  useEffect(() => {
    setFilters({ ...emptyFilters(), ...params.initialFilters });
  }, [params.detail?.batch.id, params.initialFilters]);

  const dashboard = useMemo(() => {
    if (!params.analytics) return null;

    const filteredLogs = filterLogs(params.analytics.logs, filters);
    const filteredSummary = aggregateRatingSummary(filteredLogs);
    const filteredBrewMethods = brewMethodCountsFromLogs(filteredLogs);
    const filteredFlavorNotes = topFlavorNotesFromLogs(filteredLogs, 10);
    const filteredLogIds = new Set(filteredLogs.map((log) => log.id));

    const filteredReviews = filterFeedback(
      params.analytics.anonymizedReviews.filter((review) => filteredLogIds.has(review.coffeeLogId)),
      filters.feedbackQuery
    );
    const filteredNotes = filterFeedback(
      params.analytics.anonymizedFreeTextNotes.filter((note) => filteredLogIds.has(note.coffeeLogId)),
      filters.feedbackQuery
    );

    const telemetrySummary =
      filters.brewMethodId && params.analytics.telemetryByBrewMethodId[filters.brewMethodId]
        ? params.analytics.telemetryByBrewMethodId[filters.brewMethodId]
        : params.analytics.globalTelemetrySummary;

    const telemetryScopeNote =
      filters.startDate || filters.endDate || filters.minRating != null || filters.maxRating != null
        ? 'Sensory Core aggregates follow brew method only; date and rating filters do not narrow Sensory Core yet.'
        : 'Sensory Core matches the current brew-method scope.';

    const overview: AnalyticsOverviewMetrics = {
      totalTastings: filteredSummary.totalTastings,
      avgRating: filteredSummary.totalTastings > 0 ? filteredSummary.avgRating : 0,
      reviewCount: filteredReviews.length,
      noteCount: filteredNotes.length,
      favoriteUsersCount: params.detail?.stats.favoriteUsersCount ?? 0,
      telemetryCoverage: telemetrySummary.coveragePercent,
    };

    const radarMetrics = compareRadarMetrics({
      detail: params.detail,
      telemetrySummary,
    });

    const exportDatasets = buildDashboardExportDatasets({
      batchId: params.detail?.batch.id ?? 'batch',
      coffeeName: params.detail?.coffee.name ?? 'batch',
      lotNumber: params.detail?.batch.lotNumber ?? '—',
      filters,
      summary: filteredSummary,
      overview,
      trends: toTrendPoints(filteredLogs),
      brewMethods: filteredBrewMethods,
      flavorNotes: filteredFlavorNotes,
      reviews: filteredReviews,
      notes: filteredNotes,
    });

    return {
      filters,
      filteredLogs,
      filteredSummary,
      filteredBrewMethods,
      filteredFlavorNotes,
      filteredReviews,
      filteredNotes,
      telemetrySummary,
      telemetryScopeNote,
      overview,
      trends: toTrendPoints(filteredLogs),
      radarMetrics,
      exportDatasets,
      caption: summaryCaption(filters),
    };
  }, [filters, params.analytics, params.detail]);

  return {
    filters,
    setFilters,
    dashboard,
  };
}
