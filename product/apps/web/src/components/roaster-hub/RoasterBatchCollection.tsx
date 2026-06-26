'use client';

import { flowErrorUiCopy, listRoasterBatchPublications, normalizeFlowError, type BatchPublicationSummary } from '@funcup/shared';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/src/components/ui/button';
import { useRoasterProfile } from '@/src/hooks/useRoasterProfile';
import { downloadCsv } from '@/src/lib/csv';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

import { hubCrudStyles } from '@/app/roaster-hub/hub-crud.styles';

type RoasterBatchCollectionProps = {
  variant: 'analytics' | 'manage';
};

type VariantCopy = {
  heading: string;
  description: string;
  emptyTitle: string;
  emptyCtaHref: string;
  emptyCtaLabel: string;
  primaryHref: (batchId: string) => string;
  primaryLabel: string;
  secondaryHref: (batchId: string) => string;
  secondaryLabel: string;
};

const VARIANT_COPY: Record<RoasterBatchCollectionProps['variant'], VariantCopy> = {
  manage: {
    heading: 'Batch Manager',
    description:
      'Manage roast batch details, update label assets, and control the QR handoff consumers open after scanning.',
    emptyTitle: 'No canonical batches yet. Publish the first batch to start the roaster workflow.',
    emptyCtaHref: '/roaster-hub/batches/new',
    emptyCtaLabel: 'Publish coffee + batch',
    primaryHref: (batchId) => `/roaster-hub/batches/${batchId}`,
    primaryLabel: 'Manage batch',
    secondaryHref: (batchId) => `/roaster-hub/analytics/${batchId}`,
    secondaryLabel: 'Open analytics',
  },
  analytics: {
    heading: 'Batch Analytics',
    description:
      'Review tasting totals, Sensory Core, and note patterns for each batch without entering the batch editing workflow.',
    emptyTitle: 'No batches available for analytics yet. Publish a batch first to start collecting tasting data.',
    emptyCtaHref: '/roaster-hub/batches/new',
    emptyCtaLabel: 'Publish first batch',
    primaryHref: (batchId) => `/roaster-hub/analytics/${batchId}`,
    primaryLabel: 'Open analytics',
    secondaryHref: (batchId) => `/roaster-hub/batches/${batchId}`,
    secondaryLabel: 'Manage batch',
  },
};

function formatStatsUpdatedAt(value: string | null): string {
  return value ? new Date(value).toLocaleString() : '—';
}

function batchSupportCopy(record: BatchPublicationSummary, variant: RoasterBatchCollectionProps['variant']): string {
  if (variant === 'manage') {
    return record.qrHash
      ? 'QR handoff is ready for this batch.'
      : 'Generate the QR handoff from batch details before sharing publicly.';
  }

  return record.totalCount > 0
    ? 'Consumer tastings are available for this batch.'
    : 'No tastings logged yet. Open analytics to monitor the first feedback as it arrives.';
}

export function RoasterBatchCollection(props: RoasterBatchCollectionProps) {
  const { variant } = props;
  const copy = VARIANT_COPY[variant];
  const {
    loading: profileLoading,
    userId,
    exists: roasterExists,
    complete: roasterComplete,
    error: profileError,
  } = useRoasterProfile();
  const [records, setRecords] = useState<BatchPublicationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState<'all' | 'with_tastings' | 'without_tastings'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'rating' | 'tastings' | 'name'>('updated');

  useEffect(() => {
    if (profileLoading || !userId || !roasterExists || !roasterComplete) {
      setRecords([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const nextRecords = await listRoasterBatchPublications(supabaseBrowser);
        if (!cancelled) {
          setRecords(nextRecords);
        }
      } catch (nextError) {
        if (!cancelled) {
          const normalized = normalizeFlowError({
            error: nextError,
            domain: 'batch_publication',
          });
          setError(flowErrorUiCopy(normalized).message);
          setRecords([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profileLoading, roasterComplete, roasterExists, userId]);

  const visibleRecords = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
    const nextRecords = records.filter((record) => {
      if (activityFilter === 'with_tastings' && record.totalCount === 0) return false;
      if (activityFilter === 'without_tastings' && record.totalCount > 0) return false;
      if (!normalizedQuery) return true;
      return [record.coffeeName, record.lotNumber, record.roastDate]
        .join(' ')
        .toLocaleLowerCase()
        .includes(normalizedQuery);
    });

    return nextRecords.sort((left, right) => {
      if (sortBy === 'rating') return right.avgRating - left.avgRating;
      if (sortBy === 'tastings') return right.totalCount - left.totalCount;
      if (sortBy === 'name') return left.coffeeName.localeCompare(right.coffeeName);
      return (right.statsUpdatedAt ?? '').localeCompare(left.statsUpdatedAt ?? '');
    });
  }, [activityFilter, records, searchQuery, sortBy]);

  const collectionSummary = useMemo(() => {
    return visibleRecords.reduce(
      (accumulator, record) => {
        accumulator.totalTastings += record.totalCount;
        if (record.totalCount > 0) accumulator.batchesWithTastings += 1;
        return accumulator;
      },
      {
        totalTastings: 0,
        batchesWithTastings: 0,
      }
    );
  }, [visibleRecords]);

  function exportVisibleRecords() {
    downloadCsv({
      fileName: variant === 'analytics' ? 'roaster-analytics-batches.csv' : 'roaster-batch-manager.csv',
      rows: visibleRecords.map((record) => ({
        coffee_name: record.coffeeName,
        lot_number: record.lotNumber,
        roast_date: record.roastDate,
        total_tastings: record.totalCount,
        average_rating: record.avgRating,
        stats_updated_at: record.statsUpdatedAt,
      })),
    });
  }

  return (
    <main className={hubCrudStyles.main760}>
      <p className="mb-4">
        <Link href="/roaster-hub" className={hubCrudStyles.navBack}>
          ← Roaster Hub
        </Link>
      </p>
      <h1 className={hubCrudStyles.pageHeading}>{copy.heading}</h1>
      <p className={`${hubCrudStyles.muted} mb-5 max-w-[780px]`}>{copy.description}</p>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link href={copy.emptyCtaHref} className={hubCrudStyles.actionLink}>
          {variant === 'manage' ? 'Publish new batch' : copy.emptyCtaLabel}
        </Link>
        {variant === 'analytics' ? (
          <Link href="/roaster-hub/batches" className={hubCrudStyles.actionLink}>
            Open Batch Manager
          </Link>
        ) : (
          <Link href="/roaster-hub/analytics" className={hubCrudStyles.actionLink}>
            Open analytics list
          </Link>
        )}
      </div>

      {variant === 'analytics' ? (
        <section className="mb-6 overflow-hidden rounded-vs-lg border-2 border-vs-border-strong bg-vs-elevated shadow-vs-md">
          <div className="grid gap-3 border-b border-vs-border-subtle/30 p-5 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-vs-text-muted">Visible batches</p>
              <p className="mt-2 font-display text-5xl uppercase tracking-[-0.03em] text-vs-text-primary">
                {visibleRecords.length}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-vs-text-muted">Total tastings</p>
              <p className="mt-2 font-display text-5xl uppercase tracking-[-0.03em] text-vs-text-primary">
                {collectionSummary.totalTastings}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-vs-text-muted">Batches with tastings</p>
              <p className="mt-2 font-display text-5xl uppercase tracking-[-0.03em] text-vs-text-primary">
                {collectionSummary.batchesWithTastings}
              </p>
            </div>
          </div>
          <div className="grid gap-3 p-5 xl:grid-cols-[1.6fr_repeat(3,minmax(0,1fr))_auto]">
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-vs-text-muted">Search</span>
              <input
                className={hubCrudStyles.input}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Coffee name, lot, roast date"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-vs-text-muted">Activity</span>
              <select
                className={hubCrudStyles.input}
                value={activityFilter}
                onChange={(event) => setActivityFilter(event.target.value as typeof activityFilter)}
              >
                <option value="all">All batches</option>
                <option value="with_tastings">With tastings</option>
                <option value="without_tastings">Without tastings</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-vs-text-muted">Sort by</span>
              <select
                className={hubCrudStyles.input}
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
              >
                <option value="updated">Latest update</option>
                <option value="rating">Highest rating</option>
                <option value="tastings">Most tastings</option>
                <option value="name">Coffee name</option>
              </select>
            </label>
            <div className="flex items-end">
              <Button type="button" variant="secondary" onClick={exportVisibleRecords}>
                Export visible CSV
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {profileError ? <p className={hubCrudStyles.error}>{profileError}</p> : null}

      {!userId ? (
        <div className="rounded border border-vs-warning/40 bg-vs-warning/10 p-3 text-sm text-vs-text-primary">
          Sign in as a roaster to access batch workflows.
        </div>
      ) : null}

      {userId && (!roasterExists || !roasterComplete) ? (
        <div className="rounded border border-vs-warning/40 bg-vs-warning/10 p-3 text-sm text-vs-text-primary">
          Complete your{' '}
          <Link href="/roaster-profile" className={hubCrudStyles.linkStrong}>
            Roaster Profile
          </Link>{' '}
          before publishing batches or reviewing analytics.
        </div>
      ) : null}

      {loading ? <p className={hubCrudStyles.muted}>Loading canonical batches…</p> : null}
      {error ? <p className={hubCrudStyles.error}>{error}</p> : null}

      {!loading && !error && userId && roasterExists && roasterComplete ? (
        visibleRecords.length > 0 ? (
          <div className="space-y-4">
            {visibleRecords.map((record) => (
              <article
                key={record.batchId}
                className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-wrap items-start gap-5">
                    {record.coverImageUrl ? (
                      <div className={hubCrudStyles.assetPreviewFrame}>
                        <img
                          src={record.coverImageUrl}
                          alt={`${record.coffeeName} label`}
                          className={hubCrudStyles.assetPreviewImage}
                        />
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <p className="font-display text-3xl uppercase tracking-[-0.02em] text-vs-text-primary">
                        {record.coffeeName}
                      </p>
                      <p className="text-base text-vs-text-secondary">
                        Lot {record.lotNumber} · Roast {record.roastDate}
                      </p>
                      <p className="text-sm text-vs-text-secondary">
                        Variety:{' '}
                        {record.coffeeVarieties.length > 0
                          ? record.coffeeVarieties.map((entry) => entry.name).join(', ')
                          : record.coffeeVariety ?? '—'}{' '}
                        · Processing: {record.coffeeProcessingMethod ?? '—'}
                      </p>
                      <p className="text-sm text-vs-text-muted">
                        {batchSupportCopy(record, variant)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-right">
                    <p className="text-base text-vs-text-primary">
                      <strong>{record.totalCount}</strong> tastings
                    </p>
                    <p className="text-base text-vs-text-primary">
                      Avg rating: <strong>{record.avgRating}</strong>
                    </p>
                    <p className="text-xs text-vs-text-muted">
                      Stats updated: {formatStatsUpdatedAt(record.statsUpdatedAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={copy.primaryHref(record.batchId)} className={hubCrudStyles.actionLink}>
                    {copy.primaryLabel}
                  </Link>
                  <Link href={copy.secondaryHref(record.batchId)} className={hubCrudStyles.actionLink}>
                    {copy.secondaryLabel}
                  </Link>
                  {record.storeUrl ? (
                    <Link href={record.storeUrl} className={hubCrudStyles.actionLink} target="_blank">
                      Coffee Store URL
                    </Link>
                  ) : null}
                  {record.qrHash ? (
                    <Link href={`/q/${record.qrHash}`} className={hubCrudStyles.actionLink} target="_blank">
                      Open mobile handoff
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-vs-md border-2 border-vs-border-strong bg-vs-surface p-5 shadow-vs-sm">
            <p className="text-base text-vs-text-primary">
              {records.length > 0
                ? 'No batches match the current search and filter set.'
                : copy.emptyTitle}
            </p>
            <p className="mt-3">
              <Link href={copy.emptyCtaHref} className={hubCrudStyles.actionLink}>
                {copy.emptyCtaLabel}
              </Link>
            </p>
          </div>
        )
      ) : null}
    </main>
  );
}
