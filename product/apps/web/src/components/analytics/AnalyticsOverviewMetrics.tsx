'use client';

import { formatFavoriteUsersCopy } from '@funcup/shared';

import type { AnalyticsOverviewMetrics as AnalyticsOverviewMetricsData } from '@/src/hooks/useRoasterAnalyticsDashboard';

type Props = {
  metrics: AnalyticsOverviewMetricsData;
};

const ITEMS = [
  { key: 'totalTastings', label: 'Total tastings', format: (value: number) => String(value) },
  { key: 'avgRating', label: 'Average rating', format: (value: number) => (value > 0 ? value.toFixed(2) : '—') },
  { key: 'telemetryCoverage', label: 'Sensory Core coverage', format: (value: number) => `${value.toFixed(0)}%` },
  { key: 'reviewCount', label: 'Reviews', format: (value: number) => String(value) },
  { key: 'favoriteUsersCount', label: "Users' favorite", format: (value: number) => String(value) },
] as const;

export default function AnalyticsOverviewMetrics(props: Props) {
  const favoriteUsersCopy = formatFavoriteUsersCopy(props.metrics.favoriteUsersCount);

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {ITEMS.map((item) => (
        <article
          key={item.key}
          className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-vs-text-muted">
            {item.label}
          </p>
          <p className="mt-3 font-display text-5xl uppercase tracking-[-0.03em] text-vs-text-primary">
            {item.format(props.metrics[item.key])}
          </p>
          {item.key === 'favoriteUsersCount' ? (
            <p className="mt-2 text-sm leading-snug text-vs-text-secondary">
              {favoriteUsersCopy ?? 'No favourites yet.'}
            </p>
          ) : null}
        </article>
      ))}
    </section>
  );
}
