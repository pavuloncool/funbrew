'use client';

import type { RatingSummary } from '@funcup/shared';

import { analyticsStyles } from './analytics.styles';

type Props = {
  title: string;
  caption?: string;
  summary: RatingSummary;
};

const STARS = ['1', '2', '3', '4', '5'] as const;

export default function AnalyticsSummary({ title, caption, summary }: Props) {
  const maxBar = Math.max(
    1,
    ...STARS.map(s => summary.ratingDistribution[s] ?? 0)
  );

  return (
    <section className={analyticsStyles.card}>
      <h2 className={analyticsStyles.cardTitle}>{title}</h2>
      {caption ? <p className={analyticsStyles.cardCaption}>{caption}</p> : null}
      <dl className={analyticsStyles.statGrid}>
        <div>
          <dt className={analyticsStyles.statLabel}>Total tastings</dt>
          <dd className={analyticsStyles.statValue}>{summary.totalTastings}</dd>
        </div>
        <div>
          <dt className={analyticsStyles.statLabel}>Average rating</dt>
          <dd className={analyticsStyles.statValue}>
            {summary.totalTastings > 0 ? summary.avgRating.toFixed(2) : '—'}
            <span className={analyticsStyles.statSuffix}>/ 5</span>
          </dd>
        </div>
      </dl>
      <div className={analyticsStyles.distSection}>
        <h3 className={analyticsStyles.sectionTitle}>Rating distribution</h3>
        <ul className={analyticsStyles.distList}>
          {STARS.map(star => {
            const count = summary.ratingDistribution[star] ?? 0;
            const width = `${Math.round((count / maxBar) * 100)}%`;
            return (
              <li key={star} className={analyticsStyles.distRow}>
                <span className={analyticsStyles.distStar}>{star}★</span>
                <div className={analyticsStyles.distTrack}>
                  <div className={analyticsStyles.distBar} style={{ width }} />
                </div>
                <span className={analyticsStyles.distCount}>{count}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
