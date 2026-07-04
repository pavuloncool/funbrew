'use client';

import type { AnalyticsTrendPoint } from '@/src/hooks/useRoasterAnalyticsDashboard';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useState, type ReactNode } from 'react';

import { cn } from '@/src/lib/utils';

import { analyticsStyles } from './analytics.styles';

export type AnalyticsTrendView = 'tastings' | 'rating';

type Props = {
  title: string;
  caption: string;
  points: AnalyticsTrendPoint[];
  viewMode?: 'split' | 'tabs';
  activeView?: AnalyticsTrendView;
  onViewChange?: (view: AnalyticsTrendView) => void;
};

const TREND_VIEWS: Array<{ id: AnalyticsTrendView; label: string }> = [
  { id: 'tastings', label: 'Tastings over time' },
  { id: 'rating', label: 'Average rating over time' },
];

function ChartShell(props: {
  title: string;
  children: ReactNode;
  heightClassName?: string;
}) {
  return (
    <div className="rounded-vs-md border border-vs-border-subtle/40 bg-vs-surface p-4">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-vs-text-muted">
        {props.title}
      </p>
      <div className={props.heightClassName ?? 'h-72'}>{props.children}</div>
    </div>
  );
}

function TastingsTrendChart(props: { points: AnalyticsTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={props.points}>
        <defs>
          <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="rgb(var(--vs-hero-primary))"
              stopOpacity={0.45}
            />
            <stop
              offset="95%"
              stopColor="rgb(var(--vs-hero-primary))"
              stopOpacity={0.03}
            />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(31,31,38,0.12)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: 'rgb(var(--vs-text-muted))', fontSize: 12 }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: 'rgb(var(--vs-text-muted))', fontSize: 12 }}
        />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="totalTastings"
          stroke="rgb(var(--vs-hero-primary))"
          fill="url(#trendArea)"
          strokeWidth={2.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function RatingTrendChart(props: { points: AnalyticsTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={props.points}>
        <CartesianGrid stroke="rgba(31,31,38,0.12)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: 'rgb(var(--vs-text-muted))', fontSize: 12 }}
        />
        <YAxis
          domain={[0, 5]}
          tick={{ fill: 'rgb(var(--vs-text-muted))', fontSize: 12 }}
        />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="avgRating"
          stroke="rgb(var(--vs-accent-primary))"
          dot={{ r: 4, fill: 'rgb(var(--vs-accent-primary))' }}
          strokeWidth={2.5}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function AnalyticsTrendChart(props: Props) {
  const viewMode = props.viewMode ?? 'split';
  const [internalView, setInternalView] =
    useState<AnalyticsTrendView>('tastings');
  const activeView = props.activeView ?? internalView;
  const setActiveView = props.onViewChange ?? setInternalView;

  if (props.points.length === 0) {
    return (
      <section className={analyticsStyles.card}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className={analyticsStyles.cardTitle}>{props.title}</h2>
            <p className={analyticsStyles.cardCaption}>{props.caption}</p>
          </div>
        </div>
        <p className={analyticsStyles.emptyState}>
          No tasting trend is available for this filter set.
        </p>
      </section>
    );
  }

  if (viewMode === 'tabs') {
    const activeViewLabel =
      TREND_VIEWS.find(view => view.id === activeView)?.label ??
      TREND_VIEWS[0].label;

    return (
      <section className={analyticsStyles.card}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className={analyticsStyles.cardTitle}>{props.title}</h2>
            <p className={analyticsStyles.cardCaption}>{props.caption}</p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Tasting momentum views"
          className={analyticsStyles.subTabsList}
        >
          {TREND_VIEWS.map(view => {
            const isActive = activeView === view.id;
            return (
              <button
                key={view.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`tasting-momentum-panel-${view.id}`}
                id={`tasting-momentum-tab-${view.id}`}
                className={cn(
                  analyticsStyles.subTabButton,
                  isActive
                    ? analyticsStyles.subTabButtonActive
                    : analyticsStyles.subTabButtonInactive
                )}
                onClick={() => setActiveView(view.id)}
              >
                {view.label}
              </button>
            );
          })}
        </div>

        <div className={analyticsStyles.subTabPanel}>
          <div
            id={`tasting-momentum-panel-${activeView}`}
            role="tabpanel"
            aria-labelledby={`tasting-momentum-tab-${activeView}`}
          >
            <ChartShell title={activeViewLabel} heightClassName="h-[26rem]">
              {activeView === 'tastings' ? (
                <TastingsTrendChart points={props.points} />
              ) : (
                <RatingTrendChart points={props.points} />
              )}
            </ChartShell>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={analyticsStyles.card}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={analyticsStyles.cardTitle}>{props.title}</h2>
          <p className={analyticsStyles.cardCaption}>{props.caption}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <ChartShell title="Tastings over time">
          <TastingsTrendChart points={props.points} />
        </ChartShell>
        <ChartShell title="Average rating over time">
          <RatingTrendChart points={props.points} />
        </ChartShell>
      </div>
    </section>
  );
}
