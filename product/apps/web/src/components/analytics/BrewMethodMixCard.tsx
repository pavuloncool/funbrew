'use client';

import type { BrewMethodRank } from '@funcup/shared';

import { analyticsStyles } from './analytics.styles';

type Props = {
  title: string;
  caption: string;
  rows: BrewMethodRank[];
};

export default function BrewMethodMixCard(props: Props) {
  const maxCount = Math.max(1, ...props.rows.map((row) => row.count));

  return (
    <section className={analyticsStyles.card}>
      <h2 className={analyticsStyles.cardTitle}>{props.title}</h2>
      <p className={analyticsStyles.cardCaption}>{props.caption}</p>
      {props.rows.length === 0 ? (
        <p className={analyticsStyles.emptyState}>No brew methods were logged in this selection.</p>
      ) : (
        <ol className="mt-5 space-y-3">
          {props.rows.map((row) => (
            <li key={row.id} className="grid gap-2">
              <div className="flex items-center justify-between gap-3 text-sm text-vs-text-primary">
                <span className="font-medium">{row.name}</span>
                <span className="font-mono tabular-nums text-vs-text-secondary">{row.count}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full border border-vs-border-strong bg-vs-surface">
                <div
                  className="h-full rounded-full bg-vs-accent-secondary"
                  style={{ width: `${Math.round((row.count / maxCount) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
