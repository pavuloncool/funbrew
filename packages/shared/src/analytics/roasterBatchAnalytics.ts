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
  rating: number;
  brewMethodId: string | null;
  brewMethodName: string | null;
  review: {
    body: string;
    createdAt: string;
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

export type BrewMethodOption = { id: string; name: string };

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
