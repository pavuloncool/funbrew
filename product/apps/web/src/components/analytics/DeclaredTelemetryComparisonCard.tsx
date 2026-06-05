'use client';

import {
  SENSORY_CORE_METRICS,
  type TelemetrySummary,
} from '@funcup/shared';
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { analyticsStyles } from './analytics.styles';

type Props = {
  title: string;
  caption: string;
  declaredSensoryAcidity: number | null;
  declaredSensorySweetness: number | null;
  declaredSensoryBody: number | null;
  declaredSensoryBitter: number | null;
  declaredSensoryAftertaste: number | null;
  perceivedSummary: TelemetrySummary;
  scopeNote?: string;
};

export default function DeclaredTelemetryComparisonCard(props: Props) {
  const declaredScores = {
    declaredSensoryAcidity: props.declaredSensoryAcidity,
    declaredSensorySweetness: props.declaredSensorySweetness,
    declaredSensoryBody: props.declaredSensoryBody,
    declaredSensoryBitter: props.declaredSensoryBitter,
    declaredSensoryAftertaste: props.declaredSensoryAftertaste,
  };

  const detailRows = SENSORY_CORE_METRICS.map((metric) => ({
    label: metric.label,
    averageLabel: `Avg ${metric.label.toLowerCase()}`,
    declared: declaredScores[metric.declaredKey] ?? 0,
    perceived: props.perceivedSummary[metric.averageKey] ?? 0,
  }));

  const showEmptyState =
    SENSORY_CORE_METRICS.every((metric) => declaredScores[metric.declaredKey] == null) &&
    props.perceivedSummary.logsWithTelemetry === 0;

  const radarRows = detailRows.map((row) => ({
    subject: row.label,
    declared: row.declared,
    perceived: row.perceived,
  }));

  return (
    <section className={analyticsStyles.card}>
      <h2 className={analyticsStyles.cardTitle}>{props.title}</h2>
      <p className={analyticsStyles.cardCaption}>{props.caption}</p>
      {props.scopeNote ? <p className="mt-2 text-sm text-vs-text-muted">{props.scopeNote}</p> : null}
      <div className={analyticsStyles.distSectionCompact}>
        <h3 className={analyticsStyles.sectionTitle}>Sensory Core overview</h3>
        <dl className={analyticsStyles.statGridTelemetry}>
          <div>
            <dt className={analyticsStyles.statLabel}>Sensory Core coverage</dt>
            <dd className={analyticsStyles.statValue}>
              {props.perceivedSummary.logsWithTelemetry}
              <span className={analyticsStyles.statSuffix}>/ {props.perceivedSummary.totalLogs}</span>
            </dd>
          </div>
          {detailRows.map((row) => (
            <div key={row.label}>
              <dt className={analyticsStyles.statLabel}>{row.averageLabel}</dt>
              <dd className={analyticsStyles.statValue}>
                {row.perceived > 0 ? row.perceived.toFixed(2) : '—'}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      {showEmptyState ? (
        <p className={analyticsStyles.emptyState}>
          No declared Sensory Core targets and no consumer Sensory Core yet.
        </p>
      ) : (
        <div className="mt-6 rounded-vs-md border border-vs-border-subtle/40 bg-vs-surface p-5">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-vs-text-muted">
            Sensory Radar
          </p>
          <div className="h-96 lg:h-[32rem]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarRows}>
                <PolarGrid stroke="rgba(31,31,38,0.18)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgb(var(--vs-text-secondary))', fontSize: 13 }} />
                <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={{ fill: 'rgb(var(--vs-text-muted))', fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Radar
                  name="Roaster declared"
                  dataKey="declared"
                  stroke="rgb(var(--vs-accent-primary))"
                  fill="rgb(var(--vs-accent-primary))"
                  fillOpacity={0.15}
                  strokeWidth={2.5}
                />
                <Radar
                  name="Consumer reported avg"
                  dataKey="perceived"
                  stroke="rgb(var(--vs-hero-primary))"
                  fill="rgb(var(--vs-hero-primary))"
                  fillOpacity={0.25}
                  strokeWidth={2.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}
