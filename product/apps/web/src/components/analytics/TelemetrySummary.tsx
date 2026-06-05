'use client';

import type { TelemetrySummary as TelemetrySummaryData } from '@funcup/shared';

import { analyticsStyles } from './analytics.styles';

type Props = {
  title: string;
  caption?: string;
  summary: TelemetrySummaryData;
};

type DistributionRow = {
  label: string;
  count: number;
  colorClassName: string;
};

const INTENT_LABELS: Array<{ key: 'yes' | 'no' | 'unsure'; label: string; colorClassName: string }> = [
  { key: 'yes', label: 'Would buy again', colorClassName: 'bg-vs-accent-secondary' },
  { key: 'no', label: 'Would not buy again', colorClassName: 'bg-vs-hero-primary' },
  { key: 'unsure', label: 'Not sure', colorClassName: 'bg-vs-warning' },
];

const EXPERIENCE_LABELS: Array<{
  key: 'beginner' | 'advanced' | 'expert';
  label: string;
  colorClassName: string;
}> = [
  { key: 'beginner', label: 'Beginner', colorClassName: 'bg-vs-accent-secondary' },
  { key: 'advanced', label: 'Advanced', colorClassName: 'bg-vs-hero-primary' },
  { key: 'expert', label: 'Expert', colorClassName: 'bg-vs-warning' },
];

function DistributionList(props: {
  title: string;
  rows: DistributionRow[];
}) {
  const total = props.rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className={analyticsStyles.distSectionCompact}>
      <h3 className={analyticsStyles.sectionTitle}>{props.title}</h3>
      <div className="mt-3 overflow-hidden rounded-full border border-vs-border-strong bg-vs-surface">
        <div className="flex h-4 w-full">
          {props.rows.map((row) => (
            <div
              key={row.label}
              className={row.colorClassName}
              style={{
                width: total > 0 ? `${(row.count / total) * 100}%` : '0%',
              }}
            />
          ))}
        </div>
      </div>
      <ul className={analyticsStyles.distList}>
        {props.rows.map((row) => {
          const width = total > 0 ? `${Math.round((row.count / total) * 100)}%` : '0%';
          return (
            <li key={row.label} className={analyticsStyles.distRow}>
              <span className={analyticsStyles.distLabel}>{row.label}</span>
              <div className={analyticsStyles.distTrack}>
                <div className={`${analyticsStyles.distBar} ${row.colorClassName}`} style={{ width }} />
              </div>
              <span className={analyticsStyles.distCount}>{row.count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function TelemetrySummary({ title, caption, summary }: Props) {
  const intentRows = INTENT_LABELS.map((item) => ({
    label: item.label,
    count: summary.repurchaseIntentDistribution[item.key],
    colorClassName: item.colorClassName,
  }));
  const experienceRows = EXPERIENCE_LABELS.map((item) => ({
    label: item.label,
    count: summary.experienceLevelDistribution[item.key],
    colorClassName: item.colorClassName,
  }));

  return (
    <section className={analyticsStyles.card}>
      <h2 className={analyticsStyles.cardTitle}>{title}</h2>
      {caption ? <p className={analyticsStyles.cardCaption}>{caption}</p> : null}

      <DistributionList title="Repurchase intent" rows={intentRows} />
      <DistributionList title="Experience level" rows={experienceRows} />
    </section>
  );
}
