import type { BrewMethodOption } from '../coffeeTaxonomy';

/**
 * Pure analytics helpers for roaster batch tastings.
 * Rating aggregation matches `supabase/functions/update_coffee_stats` (same rounding and buckets).
 */

export const EMPTY_RATING_DISTRIBUTION: Record<string, number> = {
  '1': 0,
  '2': 0,
  '3': 0,
  '4': 0,
  '5': 0,
};

export type RoasterTastingLog = {
  id: string;
  loggedAt: string;
  rating: number;
  brewMethodId: string | null;
  brewMethodName: string | null;
  freeTextNotes: string | null;
  review: {
    body: string;
    createdAt: string;
  } | null;
  telemetry: {
    sensoryAcidity: number;
    sensorySweetness: number;
    sensoryBody: number;
    sensoryBitter: number;
    sensoryAftertaste: number;
    repurchaseIntent: 'yes' | 'no' | 'unsure';
    experienceLevel: 'beginner' | 'advanced' | 'expert';
  } | null;
  flavorNotes: Array<{
    id: string;
    name: string;
    label: string;
    category: string;
  }>;
};

export type RatingSummary = {
  totalTastings: number;
  avgRating: number;
  ratingDistribution: Record<string, number>;
};

export type FlavorNoteRank = {
  id: string;
  name: string;
  label: string;
  category: string;
  count: number;
};

export type BrewMethodRank = {
  id: string;
  name: string;
  count: number;
};

export type SelectionComparison<TItem> = {
  matched: TItem[];
  suggestedOnly: TItem[];
  observedOnly: TItem[];
};

export type AnonymizedReview = {
  coffeeLogId: string;
  body: string;
  createdAt: string;
  rating: number;
  brewMethodName: string | null;
};

export function aggregateRatingSummary(
  logs: Array<{ rating: number }>
): RatingSummary {
  const totalTastings = logs.length;
  const ratingDistribution: Record<string, number> = { ...EMPTY_RATING_DISTRIBUTION };

  for (const log of logs) {
    const key = String(log.rating);
    if (ratingDistribution[key] !== undefined) {
      ratingDistribution[key]++;
    }
  }

  const avgRating =
    totalTastings > 0
      ? Number(
          (
            logs.reduce((sum, l) => sum + l.rating, 0) / totalTastings
          ).toFixed(2)
        )
      : 0;

  return { totalTastings, avgRating, ratingDistribution };
}

export function topFlavorNotesFromLogs(
  logs: RoasterTastingLog[],
  limit = 10
): FlavorNoteRank[] {
  const counts = new Map<
    string,
    { id: string; name: string; label: string; category: string; count: number }
  >();

  for (const log of logs) {
    for (const fn of log.flavorNotes) {
      const cur = counts.get(fn.id);
      if (cur) {
        cur.count++;
      } else {
        counts.set(fn.id, {
          id: fn.id,
          name: fn.name,
          label: fn.label,
          category: fn.category,
          count: 1,
        });
      }
    }
  }

  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export function brewMethodCountsFromLogs(
  logs: RoasterTastingLog[],
  limit = 10
): BrewMethodRank[] {
  const counts = new Map<string, BrewMethodRank>();

  for (const log of logs) {
    if (!log.brewMethodId || !log.brewMethodName) continue;
    const current = counts.get(log.brewMethodId);
    if (current) {
      current.count++;
    } else {
      counts.set(log.brewMethodId, {
        id: log.brewMethodId,
        name: log.brewMethodName,
        count: 1,
      });
    }
  }

  return [...counts.values()]
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, limit);
}

export function brewMethodsPresentInLogs(logs: RoasterTastingLog[]): BrewMethodOption[] {
  const byId = new Map<string, string>();
  for (const log of logs) {
    if (log.brewMethodId && log.brewMethodName) {
      byId.set(log.brewMethodId, log.brewMethodName);
    }
  }
  return [...byId.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function filterLogsByBrewMethod(
  logs: RoasterTastingLog[],
  brewMethodId: string | null
): RoasterTastingLog[] {
  if (brewMethodId === null) return logs;
  return logs.filter(l => l.brewMethodId === brewMethodId);
}

export function compareSuggestedIdsToObserved<TItem extends { id: string }>(
  suggested: TItem[],
  observed: TItem[]
): SelectionComparison<TItem> {
  const suggestedIds = new Set(suggested.map((item) => item.id));
  const observedIds = new Set(observed.map((item) => item.id));

  return {
    matched: suggested.filter((item) => observedIds.has(item.id)),
    suggestedOnly: suggested.filter((item) => !observedIds.has(item.id)),
    observedOnly: observed.filter((item) => !suggestedIds.has(item.id)),
  };
}
