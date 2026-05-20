'use client';

import { aggregateRatingSummary, useRoasterAnalytics } from '@funcup/shared';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import AnalyticsSummary from '@/src/components/analytics/AnalyticsSummary';
import BrewMethodFilter from '@/src/components/analytics/BrewMethodFilter';
import TopFlavorNotes from '@/src/components/analytics/TopFlavorNotes';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

export default function BatchAnalyticsPage() {
  const params = useParams();
  const batchId = typeof params.batchId === 'string' ? params.batchId : null;
  const [coffeeId, setCoffeeId] = useState<string | null>(null);

  useEffect(() => {
    async function ensureAuth() {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();
      if (!user) {
        window.location.href = '/login';
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

  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null;

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
      ? `/dashboard/coffees/${coffeeId}/batches/${batchId}`
      : coffeeId
        ? `/dashboard/coffees/${coffeeId}`
        : '/dashboard/coffees';

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 font-sans text-zinc-900">
      <nav className="mb-6 text-sm">
        <Link href="/dashboard/coffees" className="text-zinc-600 underline hover:text-zinc-900">
          Coffees
        </Link>
        <span className="mx-2 text-zinc-400">/</span>
        <Link href={backHref} className="text-zinc-600 underline hover:text-zinc-900">
          Batch
        </Link>
        <span className="mx-2 text-zinc-400">/</span>
        <span className="text-zinc-800">Analytics</span>
      </nav>

      <h1 className="text-2xl font-semibold tracking-tight">Batch analytics</h1>
      <p className="mt-1 font-mono text-sm text-zinc-500">{batchId ?? '—'}</p>

      {isLoading ? <p className="mt-8 text-zinc-600">Loading analytics…</p> : null}

      {errorMessage ? (
        <p className="mt-8 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {errorMessage}
        </p>
      ) : null}

      {!isLoading && data && !errorMessage ? (
        <>
          {!data.globalFromStats && data.logs.length === 0 ? (
            <p className="mt-8 text-zinc-600">
              No tastings logged for this batch yet. Totals will appear after the first tasting.
            </p>
          ) : null}

          <div className="mt-8 space-y-8">
            <AnalyticsSummary
              title="Published batch totals"
              caption={
                data.globalFromStats && data.statsUpdatedAt
                  ? `Synced aggregates (updated ${new Date(data.statsUpdatedAt).toLocaleString()})`
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
              </>
            ) : (
              <p className="text-sm text-zinc-500">
                Select a brew method to compare flavor notes and ratings for that subset.
              </p>
            )}
          </div>
        </>
      ) : null}
    </main>
  );
}
