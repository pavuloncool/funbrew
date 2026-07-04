'use client';

import {
  compareSuggestedIdsToObserved,
  flowErrorUiCopy,
  getRoasterBatchPublicationDetail,
  loadBrewMethodOptions,
  loadTastingNoteOptions,
  normalizeFlowError,
  sanitizeSelectedIds,
  type BatchPublicationDetail,
  type BrewMethodOption,
  type TastingNoteOption,
  useRoasterAnalytics,
} from '@funcup/shared';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import AnalyticsFilterBar from '@/src/components/analytics/AnalyticsFilterBar';
import AnalyticsOverviewMetrics from '@/src/components/analytics/AnalyticsOverviewMetrics';
import AnalyticsSummary from '@/src/components/analytics/AnalyticsSummary';
import AnalyticsTrendChart, {
  type AnalyticsTrendView,
} from '@/src/components/analytics/AnalyticsTrendChart';
import AnonymizedFreeTextNotes from '@/src/components/analytics/AnonymizedFreeTextNotes';
import AnonymizedReviews from '@/src/components/analytics/AnonymizedReviews';
import BrewMethodMixCard from '@/src/components/analytics/BrewMethodMixCard';
import DeclaredTelemetryComparisonCard from '@/src/components/analytics/DeclaredTelemetryComparisonCard';
import { analyticsStyles } from '@/src/components/analytics/analytics.styles';
import RoasterSuggestionComparison from '@/src/components/analytics/RoasterSuggestionComparison';
import TelemetrySummaryCard from '@/src/components/analytics/TelemetrySummary';
import TopFlavorNotes from '@/src/components/analytics/TopFlavorNotes';
import { Button } from '@/src/components/ui/button';
import { useRoasterProfile } from '@/src/hooks/useRoasterProfile';
import {
  useRoasterAnalyticsDashboard,
  type AnalyticsDashboardFilters,
} from '@/src/hooks/useRoasterAnalyticsDashboard';
import { downloadCsv } from '@/src/lib/csv';
import { cn } from '@/src/lib/utils';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

import { hubCrudStyles } from '@/app/roaster-hub/hub-crud.styles';

type BatchAnalyticsDetailProps = {
  batchId: string;
  reportMode?: boolean;
  initialFilters?: Partial<AnalyticsDashboardFilters>;
};

type ComparisonItem = {
  id: string;
  label: string;
  meta?: string | null;
};

type AnalyticsSectionId =
  | 'momentum'
  | 'rating'
  | 'suggestions'
  | 'sensory-core'
  | 'brew-method-mix'
  | 'other';

type AnalyticsSectionTab = {
  id: AnalyticsSectionId;
  label: string;
  meta: string;
  description: string;
};

const ANALYTICS_SECTION_TABS: AnalyticsSectionTab[] = [
  {
    id: 'momentum',
    label: 'Tasting momentum',
    meta: 'Trend charts',
    description: 'Tastings over time and average rating over time.',
  },
  {
    id: 'rating',
    label: 'Rating snapshot',
    meta: 'Distribution',
    description: 'Rating summary and rating distribution.',
  },
  {
    id: 'suggestions',
    label: 'Roaster suggestions',
    meta: 'Published vs observed',
    description: 'Brew guidance compared against consumer behavior.',
  },
  {
    id: 'sensory-core',
    label: 'Declared vs perceived sensory core',
    meta: 'Radar + averages',
    description: 'Declared sensory targets compared with consumer telemetry.',
  },
  {
    id: 'brew-method-mix',
    label: 'Brew method mix',
    meta: 'Usage mix',
    description:
      'Observed brew method distribution for the current filter set.',
  },
  {
    id: 'other',
    label: 'Other data',
    meta: 'Telemetry, notes, reviews',
    description: 'Telemetry summary, flavor notes and anonymous feedback.',
  },
];

function SectionTabButton(props: {
  active: boolean;
  label: string;
  meta: string;
  description: string;
  tabId: string;
  panelId: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={props.active}
      aria-controls={props.panelId}
      id={props.tabId}
      title={props.description}
      className={cn(
        analyticsStyles.sectionTabButton,
        props.active
          ? analyticsStyles.sectionTabButtonActive
          : analyticsStyles.sectionTabButtonInactive
      )}
      onClick={props.onClick}
    >
      <span className={analyticsStyles.sectionTabLabel}>{props.label}</span>
      <span aria-hidden="true" className={analyticsStyles.sectionTabMeta}>
        {props.meta}
      </span>
    </button>
  );
}

function formatUpdatedAt(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function mapSelectedBrewMethods(
  options: BrewMethodOption[],
  selectedIds: string[]
): ComparisonItem[] {
  return options
    .filter(option => selectedIds.includes(option.id))
    .map(option => ({
      id: option.id,
      label: option.name,
    }));
}

function mapSelectedTastingNotes(
  options: TastingNoteOption[],
  selectedIds: string[]
): ComparisonItem[] {
  return options
    .filter(option => selectedIds.includes(option.id))
    .map(option => ({
      id: option.id,
      label: option.label,
      meta: option.category,
    }));
}

function batchMeta(detail: BatchPublicationDetail | null): string {
  if (!detail) return 'Loading batch metadata…';
  return `Lot ${detail.batch.lotNumber} · Roast ${detail.batch.roastDate}`;
}

export function BatchAnalyticsDetail(props: BatchAnalyticsDetailProps) {
  const { batchId } = props;
  const {
    loading: profileLoading,
    userId,
    exists: roasterExists,
    complete: roasterComplete,
    error: profileError,
  } = useRoasterProfile();
  const analytics = useRoasterAnalytics({
    supabase: supabaseBrowser,
    batchId,
  });
  const [detail, setDetail] = useState<BatchPublicationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [brewMethodOptions, setBrewMethodOptions] = useState<
    BrewMethodOption[]
  >([]);
  const [tastingNoteOptions, setTastingNoteOptions] = useState<
    TastingNoteOption[]
  >([]);
  const [taxonomyLoading, setTaxonomyLoading] = useState(true);
  const [taxonomyError, setTaxonomyError] = useState<string | null>(null);
  const [activeSection, setActiveSection] =
    useState<AnalyticsSectionId>('momentum');
  const [momentumView, setMomentumView] =
    useState<AnalyticsTrendView>('tastings');

  useEffect(() => {
    setActiveSection('momentum');
    setMomentumView('tastings');
  }, [batchId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const nextDetail = await getRoasterBatchPublicationDetail(
          supabaseBrowser,
          batchId
        );
        if (!cancelled) {
          setDetail(nextDetail);
        }
      } catch (error) {
        if (cancelled) return;
        const normalized = normalizeFlowError({
          error,
          domain: 'batch_publication',
        });
        setDetailError(flowErrorUiCopy(normalized).message);
        setDetail(null);
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [batchId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setTaxonomyLoading(true);
      setTaxonomyError(null);
      try {
        const [nextBrewMethods, nextTastingNotes] = await Promise.all([
          loadBrewMethodOptions(supabaseBrowser),
          loadTastingNoteOptions(supabaseBrowser),
        ]);
        if (cancelled) return;
        setBrewMethodOptions(nextBrewMethods);
        setTastingNoteOptions(nextTastingNotes);
      } catch (error) {
        if (cancelled) return;
        const normalized = normalizeFlowError({
          error,
          domain: 'batch_publication',
        });
        setTaxonomyError(flowErrorUiCopy(normalized).message);
        setBrewMethodOptions([]);
        setTastingNoteOptions([]);
      } finally {
        if (!cancelled) {
          setTaxonomyLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const sanitizedSuggestedBrewMethodIds = useMemo(
    () =>
      sanitizeSelectedIds(
        detail?.batch.suggestedBrewMethodIds ?? [],
        brewMethodOptions
      ),
    [detail, brewMethodOptions]
  );
  const sanitizedSuggestedTastingNoteIds = useMemo(
    () =>
      sanitizeSelectedIds(
        detail?.batch.suggestedTastingNoteIds ?? [],
        tastingNoteOptions
      ),
    [detail, tastingNoteOptions]
  );
  const suggestedBrewMethodItems = useMemo(
    () =>
      mapSelectedBrewMethods(
        brewMethodOptions,
        sanitizedSuggestedBrewMethodIds
      ),
    [brewMethodOptions, sanitizedSuggestedBrewMethodIds]
  );
  const suggestedTastingNoteItems = useMemo(
    () =>
      mapSelectedTastingNotes(
        tastingNoteOptions,
        sanitizedSuggestedTastingNoteIds
      ),
    [tastingNoteOptions, sanitizedSuggestedTastingNoteIds]
  );
  const dashboardState = useRoasterAnalyticsDashboard({
    analytics: analytics.data,
    detail,
    initialFilters: props.initialFilters,
  });
  const dashboard = dashboardState.dashboard;
  const reportHref = useMemo(() => {
    const params = new URLSearchParams();
    if (dashboardState.filters.brewMethodId)
      params.set('brewMethodId', dashboardState.filters.brewMethodId);
    if (dashboardState.filters.startDate)
      params.set('startDate', dashboardState.filters.startDate);
    if (dashboardState.filters.endDate)
      params.set('endDate', dashboardState.filters.endDate);
    if (dashboardState.filters.minRating != null)
      params.set('minRating', String(dashboardState.filters.minRating));
    if (dashboardState.filters.maxRating != null)
      params.set('maxRating', String(dashboardState.filters.maxRating));
    if (dashboardState.filters.feedbackQuery)
      params.set('feedbackQuery', dashboardState.filters.feedbackQuery);
    const query = params.toString();
    return `/roaster-hub/analytics/${batchId}/report${query ? `?${query}` : ''}`;
  }, [batchId, dashboardState.filters]);

  const observedFilteredBrewMethodItems = useMemo(
    () =>
      dashboard?.filteredBrewMethods.map(item => ({
        id: item.id,
        label: item.name,
        meta: `${item.count} tastings`,
      })) ?? [],
    [dashboard]
  );
  const observedFilteredTastingNoteItems = useMemo(
    () =>
      dashboard?.filteredFlavorNotes.map(item => ({
        id: item.id,
        label: item.label,
        meta: `${item.count} tastings · ${item.category}`,
      })) ?? [],
    [dashboard]
  );
  const filteredBrewMethodComparison = useMemo(
    () =>
      compareSuggestedIdsToObserved(
        suggestedBrewMethodItems,
        observedFilteredBrewMethodItems
      ),
    [suggestedBrewMethodItems, observedFilteredBrewMethodItems]
  );
  const filteredTastingNoteComparison = useMemo(
    () =>
      compareSuggestedIdsToObserved(
        suggestedTastingNoteItems,
        observedFilteredTastingNoteItems
      ),
    [suggestedTastingNoteItems, observedFilteredTastingNoteItems]
  );

  const renderActiveSectionPanel = () => {
    if (!dashboard) return null;

    const panelId = `analytics-section-panel-${activeSection}`;
    const tabId = `analytics-section-tab-${activeSection}`;

    switch (activeSection) {
      case 'momentum':
        return (
          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            className={analyticsStyles.sectionTabPanel}
          >
            <AnalyticsTrendChart
              title="Tasting momentum"
              caption={dashboard.caption}
              points={dashboard.trends}
              viewMode="tabs"
              activeView={momentumView}
              onViewChange={setMomentumView}
            />
          </div>
        );
      case 'rating':
        return (
          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            className={analyticsStyles.sectionTabPanel}
          >
            <AnalyticsSummary
              title="Rating snapshot"
              caption={dashboard.caption}
              summary={dashboard.filteredSummary}
            />
          </div>
        );
      case 'suggestions':
        return (
          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            className={cn(
              analyticsStyles.sectionTabPanel,
              analyticsStyles.sectionStack
            )}
          >
            {taxonomyError ? (
              <div className={analyticsStyles.dashedHint}>
                Taxonomy data could not be loaded, so roaster suggestion
                comparisons are unavailable for this batch.
              </div>
            ) : (
              <>
                <RoasterSuggestionComparison
                  title="Roaster suggestions vs consumer reality"
                  caption="Published brew guidance compared against the current selection."
                  suggested={suggestedBrewMethodItems}
                  observed={observedFilteredBrewMethodItems}
                  matched={filteredBrewMethodComparison.matched}
                  suggestedOnly={filteredBrewMethodComparison.suggestedOnly}
                  observedOnly={filteredBrewMethodComparison.observedOnly}
                  emptySuggestedLabel="No brew methods suggested for this batch."
                  emptyObservedLabel="Consumers have not logged any brew methods yet."
                />

                <RoasterSuggestionComparison
                  title="Suggested flavor notes vs discovered notes"
                  caption="Published note suggestions compared against the current selection."
                  suggested={suggestedTastingNoteItems}
                  observed={observedFilteredTastingNoteItems}
                  matched={filteredTastingNoteComparison.matched}
                  suggestedOnly={filteredTastingNoteComparison.suggestedOnly}
                  observedOnly={filteredTastingNoteComparison.observedOnly}
                  emptySuggestedLabel="No flavor notes suggested for this batch."
                  emptyObservedLabel="Consumers have not logged any flavor notes yet."
                />
              </>
            )}
          </div>
        );
      case 'sensory-core':
        return (
          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            className={analyticsStyles.sectionTabPanel}
          >
            <DeclaredTelemetryComparisonCard
              title="Declared vs Perceived Sensory Core"
              caption="Compares roaster-declared vs consumer-reported Sensory Core averages."
              declaredSensoryAcidity={
                detail?.batch.declaredSensoryAcidity ?? null
              }
              declaredSensorySweetness={
                detail?.batch.declaredSensorySweetness ?? null
              }
              declaredSensoryBody={detail?.batch.declaredSensoryBody ?? null}
              declaredSensoryBitter={
                detail?.batch.declaredSensoryBitter ?? null
              }
              declaredSensoryAftertaste={
                detail?.batch.declaredSensoryAftertaste ?? null
              }
              perceivedSummary={dashboard.telemetrySummary}
              scopeNote={dashboard.telemetryScopeNote}
            />
          </div>
        );
      case 'brew-method-mix':
        return (
          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            className={analyticsStyles.sectionTabPanel}
          >
            <BrewMethodMixCard
              title="Brew method mix"
              caption={dashboard.caption}
              rows={dashboard.filteredBrewMethods}
            />
          </div>
        );
      case 'other':
        return (
          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            className={cn(
              analyticsStyles.sectionTabPanel,
              analyticsStyles.sectionStack
            )}
          >
            <div className="grid gap-6 xl:grid-cols-2">
              <TelemetrySummaryCard
                title="Other data"
                caption="Repurchase intent and experience level reported by consumers for this batch."
                summary={dashboard.telemetrySummary}
              />

              <TopFlavorNotes
                title="Top perceived flavor notes"
                caption={dashboard.caption}
                notes={dashboard.filteredFlavorNotes}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <AnonymizedFreeTextNotes notes={dashboard.filteredNotes} />
              <AnonymizedReviews reviews={dashboard.filteredReviews} />
            </div>
          </div>
        );
    }

    return null;
  };

  if (profileLoading || detailLoading || taxonomyLoading) {
    return (
      <main className={hubCrudStyles.mainAnalyticsTabs}>
        <p className={hubCrudStyles.muted}>Loading batch analytics…</p>
      </main>
    );
  }

  return (
    <main className={hubCrudStyles.mainAnalyticsTabs}>
      <p className="mb-4">
        <Link href="/roaster-hub/analytics" className={hubCrudStyles.navBack}>
          ← Batch Analytics
        </Link>
      </p>

      <h1 className={hubCrudStyles.pageHeading}>Batch Analytics</h1>
      <p className="mb-2 text-xl text-vs-text-primary">
        {detail?.coffee.name ?? 'Batch performance and tasting signals'}
      </p>
      <p className={`${hubCrudStyles.muted} mb-5 max-w-[820px]`}>
        Review consumer feedback, compare declared Sensory Core targets against
        actual tastings, and monitor batch performance without entering the
        batch editing workflow.
      </p>

      <section className="mb-6 overflow-hidden rounded-vs-lg border-2 border-vs-border-strong bg-vs-elevated shadow-vs-md">
        <div className="bg-vs-hero px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-vs-hero-contrast/80">
                Dashboard
              </p>
              <p className="mt-2 font-display text-4xl uppercase tracking-[-0.03em] text-vs-hero-contrast">
                {detail?.coffee.name ?? 'Batch analytics'}
              </p>
              <p className="mt-2 text-sm text-vs-hero-contrast/80">
                {batchMeta(detail)}
              </p>
              <p className="mt-2 font-mono text-xs text-vs-hero-contrast/80">
                Stats updated:{' '}
                {formatUpdatedAt(analytics.data?.statsUpdatedAt ?? null)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {!props.reportMode ? (
                <>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/roaster-hub/batches/${batchId}`}>
                      Manage batch
                    </Link>
                  </Button>
                  {detail?.qr?.hash ? (
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/q/${detail.qr.hash}`} target="_blank">
                        Open mobile handoff
                      </Link>
                    </Button>
                  ) : null}
                  {dashboard?.exportDatasets.map(dataset => (
                    <Button
                      key={dataset.key}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        downloadCsv({
                          fileName: dataset.fileName,
                          rows: dataset.rows,
                        })
                      }
                    >
                      {dataset.label}
                    </Button>
                  ))}
                  <Button asChild size="sm">
                    <Link href={reportHref} target="_blank">
                      Open PDF report
                    </Link>
                  </Button>
                </>
              ) : (
                <Button type="button" size="sm" onClick={() => window.print()}>
                  Print / Save as PDF
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 space-y-8">
        {profileError ? (
          <p className={hubCrudStyles.error}>{profileError}</p>
        ) : null}
        {!userId ? (
          <div className="rounded border border-vs-warning/40 bg-vs-warning/10 p-3 text-sm text-vs-text-primary">
            Sign in as a roaster to access private batch analytics.
          </div>
        ) : null}
        {userId && (!roasterExists || !roasterComplete) ? (
          <div className="rounded border border-vs-warning/40 bg-vs-warning/10 p-3 text-sm text-vs-text-primary">
            Complete your{' '}
            <Link href="/roaster-profile" className={hubCrudStyles.linkStrong}>
              Roaster Profile
            </Link>{' '}
            before reviewing roaster analytics.
          </div>
        ) : null}
        {detailError ? (
          <p className={hubCrudStyles.error}>{detailError}</p>
        ) : null}
        {taxonomyError ? (
          <p className={hubCrudStyles.error}>{taxonomyError}</p>
        ) : null}
        {analytics.error ? (
          <p className={hubCrudStyles.error}>
            {
              flowErrorUiCopy(
                normalizeFlowError({
                  error: analytics.error,
                  domain: 'analytics',
                })
              ).message
            }
          </p>
        ) : null}

        {analytics.isLoading ? (
          <p className={hubCrudStyles.muted}>Loading analytics…</p>
        ) : analytics.data && dashboard ? (
          <>
            <AnalyticsOverviewMetrics metrics={dashboard.overview} />

            <AnalyticsFilterBar
              filters={dashboardState.filters}
              brewMethods={analytics.data.brewMethodOptions}
              onChange={updater =>
                dashboardState.setFilters(current => updater(current))
              }
              reportMode={props.reportMode}
            />

            {props.reportMode ? (
              <>
                <AnalyticsTrendChart
                  title="Tasting momentum"
                  caption={dashboard.caption}
                  points={dashboard.trends}
                  viewMode="split"
                />

                <div className="grid gap-6 xl:grid-cols-2">
                  <AnalyticsSummary
                    title="Rating snapshot"
                    caption={dashboard.caption}
                    summary={dashboard.filteredSummary}
                  />

                  <TelemetrySummaryCard
                    title="Other data"
                    caption="Repurchase intent and experience level reported by consumers for this batch."
                    summary={dashboard.telemetrySummary}
                  />

                  <BrewMethodMixCard
                    title="Brew method mix"
                    caption={dashboard.caption}
                    rows={dashboard.filteredBrewMethods}
                  />

                  <DeclaredTelemetryComparisonCard
                    title="Declared vs Perceived Sensory Core"
                    caption="Compares roaster-declared vs consumer-reported Sensory Core averages."
                    declaredSensoryAcidity={
                      detail?.batch.declaredSensoryAcidity ?? null
                    }
                    declaredSensorySweetness={
                      detail?.batch.declaredSensorySweetness ?? null
                    }
                    declaredSensoryBody={
                      detail?.batch.declaredSensoryBody ?? null
                    }
                    declaredSensoryBitter={
                      detail?.batch.declaredSensoryBitter ?? null
                    }
                    declaredSensoryAftertaste={
                      detail?.batch.declaredSensoryAftertaste ?? null
                    }
                    perceivedSummary={dashboard.telemetrySummary}
                    scopeNote={dashboard.telemetryScopeNote}
                  />

                  <TopFlavorNotes
                    title="Top perceived flavor notes"
                    caption={dashboard.caption}
                    notes={dashboard.filteredFlavorNotes}
                  />

                  {!taxonomyError ? (
                    <RoasterSuggestionComparison
                      title="Roaster suggestions vs consumer reality"
                      caption="Published brew guidance compared against the current selection."
                      suggested={suggestedBrewMethodItems}
                      observed={observedFilteredBrewMethodItems}
                      matched={filteredBrewMethodComparison.matched}
                      suggestedOnly={filteredBrewMethodComparison.suggestedOnly}
                      observedOnly={filteredBrewMethodComparison.observedOnly}
                      emptySuggestedLabel="No brew methods suggested for this batch."
                      emptyObservedLabel="Consumers have not logged any brew methods yet."
                    />
                  ) : null}

                  {!taxonomyError ? (
                    <RoasterSuggestionComparison
                      title="Suggested flavor notes vs discovered notes"
                      caption="Published note suggestions compared against the current selection."
                      suggested={suggestedTastingNoteItems}
                      observed={observedFilteredTastingNoteItems}
                      matched={filteredTastingNoteComparison.matched}
                      suggestedOnly={
                        filteredTastingNoteComparison.suggestedOnly
                      }
                      observedOnly={filteredTastingNoteComparison.observedOnly}
                      emptySuggestedLabel="No flavor notes suggested for this batch."
                      emptyObservedLabel="Consumers have not logged any flavor notes yet."
                    />
                  ) : null}
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <AnonymizedFreeTextNotes notes={dashboard.filteredNotes} />
                  <AnonymizedReviews reviews={dashboard.filteredReviews} />
                </div>
              </>
            ) : (
              <section className={analyticsStyles.sectionTabsLayout}>
                <aside className={analyticsStyles.sectionTabsRail}>
                  <div className={analyticsStyles.sectionTabsRailHeader}>
                    <p className={analyticsStyles.sectionTabsRailEyebrow}>
                      Panels
                    </p>
                    <h2 className={analyticsStyles.sectionTabsRailTitle}>
                      Analytics sections
                    </h2>
                    <p className={analyticsStyles.sectionTabsRailDescription}>
                      Focus on one block at a time to avoid oversized cards and
                      empty holes.
                    </p>
                  </div>

                  <div
                    role="tablist"
                    aria-orientation="vertical"
                    aria-label="Analytics sections"
                    className={analyticsStyles.sectionTabsList}
                  >
                    {ANALYTICS_SECTION_TABS.map(tab => (
                      <SectionTabButton
                        key={tab.id}
                        active={activeSection === tab.id}
                        label={tab.label}
                        meta={tab.meta}
                        description={tab.description}
                        tabId={`analytics-section-tab-${tab.id}`}
                        panelId={`analytics-section-panel-${tab.id}`}
                        onClick={() => setActiveSection(tab.id)}
                      />
                    ))}
                  </div>
                </aside>

                {renderActiveSectionPanel()}
              </section>
            )}
          </>
        ) : null}
      </div>
    </main>
  );
}
