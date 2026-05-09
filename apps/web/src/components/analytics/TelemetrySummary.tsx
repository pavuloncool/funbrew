'use client';

import type { TelemetrySummary as TelemetrySummaryData } from '@funcup/shared';

import { analyticsStyles } from './analytics.styles';

type Props = {
  title: string;
  caption?: string;
  summary: TelemetrySummaryData;
};

const INTENT_LABELS: Array<{ key: 'yes' | 'no' | 'unsure'; label: string }> = [
  { key: 'yes', label: 'Would buy again' },
  { key: 'no', label: 'Would not buy again' },
  { key: 'unsure', label: 'Not sure' },
];

const EXPERIENCE_LABELS: Array<{
  key: 'beginner' | 'advanced' | 'expert';
  label: string;
}> = [
  { key: 'beginner', label: 'Beginner' },
  { key: 'advanced', label: 'Advanced' },
  { key: 'expert', label: 'Expert' },
];

function DistributionList(props: {
  title: string;
  rows: Array<{ label: string; count: number }>;
}) {
  return (
    <div className={analyticsStyles.distSectionCompact}>
      <h3 className={analyticsStyles.sectionTitle}>{props.title}</h3>
      <ul className={analyticsStyles.distList}>
        {props.rows.map((row) => {
          const width =
            props.rows.length > 0
              ? `${Math.round((row.count / Math.max(1, ...props.rows.map((r) => r.count))) * 100)}%`
              : '0%';
          return (
            <li key={row.label} className={analyticsStyles.distRow}>
              <span className={analyticsStyles.distLabel}>{row.label}</span>
              <div className={analyticsStyles.distTrack}>
                <div className={analyticsStyles.distBar} style={{ width }} />
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
  }));
  const experienceRows = EXPERIENCE_LABELS.map((item) => ({
    label: item.label,
    count: summary.experienceLevelDistribution[item.key],
  }));

  return (
    <section className={analyticsStyles.card}>
      <h2 className={analyticsStyles.cardTitle}>{title}</h2>
      {caption ? <p className={analyticsStyles.cardCaption}>{caption}</p> : null}

      <dl className={analyticsStyles.statGridTelemetry}>
        <div>
          <dt className={analyticsStyles.statLabel}>Telemetry coverage</dt>
          <dd className={analyticsStyles.statValue}>
            {summary.logsWithTelemetry}
            <span className={analyticsStyles.statSuffix}>/ {summary.totalLogs}</span>
          </dd>
          <p className={analyticsStyles.cardCaption}>{summary.coveragePercent.toFixed(2)}% of tastings</p>
        </div>
        <div>
          <dt className={analyticsStyles.statLabel}>Avg acidity</dt>
          <dd className={analyticsStyles.statValue}>{summary.avgSensoryAcidity?.toFixed(2) ?? '—'}</dd>
        </div>
        <div>
          <dt className={analyticsStyles.statLabel}>Avg sweetness</dt>
          <dd className={analyticsStyles.statValue}>{summary.avgSensorySweetness?.toFixed(2) ?? '—'}</dd>
        </div>
        <div>
          <dt className={analyticsStyles.statLabel}>Avg body</dt>
          <dd className={analyticsStyles.statValue}>{summary.avgSensoryBody?.toFixed(2) ?? '—'}</dd>
        </div>
      </dl>

      <DistributionList title="Repurchase intent" rows={intentRows} />
      <DistributionList title="Experience level" rows={experienceRows} />
    </section>
  );
}
