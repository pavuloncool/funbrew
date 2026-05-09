'use client';

import {
  aggregateRatingSummary,
  flowErrorUiCopy,
  normalizeFlowError,
  useRoasterAnalytics,
} from '@funcup/shared';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import AnalyticsSummary from '@/src/components/analytics/AnalyticsSummary';
import AnonymizedFreeTextNotes from '@/src/components/analytics/AnonymizedFreeTextNotes';
import AnonymizedReviews from '@/src/components/analytics/AnonymizedReviews';
import BrewMethodFilter from '@/src/components/analytics/BrewMethodFilter';
import TelemetrySummary from '@/src/components/analytics/TelemetrySummary';
import TopFlavorNotes from '@/src/components/analytics/TopFlavorNotes';
import { getBrowserUserSafely } from '@/src/lib/supabase/browserAuth';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

export default function BatchAnalyticsPage() {
  const params = useParams();
  const batchId = typeof params.batchId === 'string' ? params.batchId : null;
  const [coffeeId, setCoffeeId] = useState<string | null>(null);

  useEffect(() => {
    async function ensureAuth() {
      const user = await getBrowserUserSafely();
      if (!user) {
        const path =
          typeof window !== 'undefined'
            ? window.location.pathname + window.location.search
            : '/roaster-hub';
        window.location.href = '/login?next=' + encodeURIComponent(path);
      }
    }
    void ensureAuth();
  }, []);

  useEffect(() => {
    if (!batchId) return;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabaseBrowser
        .from('roast_batches')
        .select('coffee_id')
        .eq('id', batchId)
        .maybeSingle();
      const row = data as { coffee_id: string } | null;
      if (!cancelled && !error && row?.coffee_id) {
        setCoffeeId(row.coffee_id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [batchId]);

  const { data, error, isLoading, selectedBrewMethodId, setSelectedBrewMethodId } =
    useRoasterAnalytics({
      supabase: supabaseBrowser,
      batchId,
    });

  const analyticsError =
    error != null ? normalizeFlowError({ error, domain: 'analytics' }) : null;
  const errorCopy = analyticsError ? flowErrorUiCopy(analyticsError) : null;

  const emptySummary = {
    totalTastings: 0,
    avgRating: 0,
    ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
  } as const;

  const globalSummary = data
    ? (data.globalFromStats ??
      (data.logs.length > 0 ? aggregateRatingSummary(data.logs) : { ...emptySummary }))
    : null;

  const backHref =
    coffeeId && batchId
      ? `/roaster-hub/coffees/${coffeeId}/batches/${batchId}`
      : coffeeId
        ? `/roaster-hub/coffees/${coffeeId}`
        : '/coffee-bank';

  return (
    <main className="mx-auto w-full max-w-[1240px] px-6 py-10 font-sans text-vs-text-primary">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-lg">
        <Link href="/coffee-bank" className="font-semibold text-vs-text-secondary underline underline-offset-4 hover:text-vs-text-primary">
          Coffee Bank
        </Link>
        <span className="text-vs-text-muted">/</span>
        <Link href={backHref} className="font-semibold text-vs-text-secondary underline underline-offset-4 hover:text-vs-text-primary">
          Batch
        </Link>
        <span className="text-vs-text-muted">/</span>
        <span className="font-semibold text-vs-text-primary">Analytics</span>
      </nav>

      <h1 className="font-display text-5xl uppercase tracking-[-0.03em] text-vs-text-primary">Batch analytics</h1>
      <p className="mt-2 inline-flex rounded-vs-sm border border-vs-border-subtle/40 bg-vs-surface px-3 py-1 font-mono text-sm text-vs-text-muted">
        {batchId ?? '—'}
      </p>
      <p className="mt-3 text-base text-vs-text-muted">Auto-refresh every 30s to keep stats close to live logs.</p>

      {isLoading ? <p className="mt-8 text-lg text-vs-text-secondary">Loading analytics…</p> : null}

      {errorCopy ? (
        <div className="mt-8 rounded-vs-md border-2 border-vs-danger/30 bg-vs-danger/10 px-5 py-4 text-base text-vs-danger shadow-vs-sm">
          <p className="font-display text-2xl uppercase tracking-[-0.02em]">{errorCopy.title}</p>
          <p className="mt-1">{errorCopy.message}</p>
        </div>
      ) : null}

      {!isLoading && data && !errorCopy ? (
        <>
          {!data.globalFromStats && data.logs.length === 0 ? (
            <p className="mt-8 text-lg text-vs-text-secondary">
              No tastings logged for this batch yet. Totals will appear after the first tasting.
            </p>
          ) : null}

          <div className="mt-8 space-y-8">
            <AnalyticsSummary
              title="Published batch totals"
              caption={
                data.globalFromStats && data.statsUpdatedAt && data.statsAreFresh
                  ? `Synced aggregates (updated ${new Date(data.statsUpdatedAt).toLocaleString()})`
                  : data.globalFromStats && data.statsUpdatedAt
                    ? `Stats row is stale (last update ${new Date(data.statsUpdatedAt).toLocaleString()}). Falling back to raw tasting logs below.`
                    : data.globalFromStats
                    ? 'Aggregates from batch statistics'
                    : data.logs.length > 0
                      ? 'Derived from tastings on file (batch stats row not present yet).'
                      : 'Aggregates from batch statistics'
              }
              summary={globalSummary ?? { ...emptySummary }}
            />

            <TopFlavorNotes
              title="Top flavor notes (all tastings)"
              caption="Ranked from logged tastings on file."
              notes={data.globalTopFlavorNotes}
            />

            <TelemetrySummary
              title="Roaster telemetry (all tastings)"
              caption="Telemetry fields captured in consumer tasting log: acidity, sweetness, body, repurchase intent, experience level."
              summary={data.globalTelemetrySummary}
            />

            <BrewMethodFilter
              options={data.brewMethodOptions}
              value={selectedBrewMethodId}
              onChange={setSelectedBrewMethodId}
            />

            {selectedBrewMethodId !== null ? (
              <>
                <AnalyticsSummary
                  title="Filtered totals"
                  caption="Only tastings matching the selected brew method."
                  summary={data.filteredSummary}
                />
                <TopFlavorNotes
                  title="Top flavor notes (filtered)"
                  caption="Same selection as the brew-method filter."
                  notes={data.filteredTopFlavorNotes}
                />
                <TelemetrySummary
                  title="Roaster telemetry (filtered)"
                  caption="Telemetry subset matching the same brew-method filter."
                  summary={data.filteredTelemetrySummary}
                />
              </>
            ) : (
              <p className="rounded-vs-md border-2 border-dashed border-vs-border-strong bg-vs-surface px-5 py-4 text-base text-vs-text-muted">
                Select a brew method to compare flavor notes and ratings for that subset.
              </p>
            )}

            <AnonymizedFreeTextNotes notes={data.anonymizedFreeTextNotes} />
            <AnonymizedReviews reviews={data.anonymizedReviews} />
          </div>
        </>
      ) : null}
    </main>
  );
}
