'use client';

import { flowErrorUiCopy, listRoasterBatchPublications, normalizeFlowError, type BatchPublicationSummary } from '@funcup/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useRoasterProfile } from '@/src/hooks/useRoasterProfile';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

import { hubCrudStyles } from '../hub-crud.styles';

export default function BatchPublicationsPage() {
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

  return (
    <main className={hubCrudStyles.main760}>
      <p className="mb-4">
        <Link href="/roaster-hub" className={hubCrudStyles.navBack}>
          ← Roaster Hub
        </Link>
      </p>
      <h1 className={hubCrudStyles.pageHeading}>Batch Manager</h1>
      <p className={`${hubCrudStyles.muted} mb-5 max-w-[720px]`}>
        Manage live roast batches, review tasting feedback, and verify the mobile handoff your QR code opens.
      </p>

      <p className="mb-6">
        <Link href="/roaster-hub/batches/new" className={hubCrudStyles.actionLink}>
          Publish new batch
        </Link>
      </p>

      {profileError ? <p className={hubCrudStyles.error}>{profileError}</p> : null}

      {!userId ? (
        <div className="rounded border border-vs-warning/40 bg-vs-warning/10 p-3 text-sm text-vs-text-primary">
          Sign in as a roaster to manage batch publications.
        </div>
      ) : null}

      {userId && (!roasterExists || !roasterComplete) ? (
        <div className="rounded border border-vs-warning/40 bg-vs-warning/10 p-3 text-sm text-vs-text-primary">
          Complete your{' '}
          <Link href="/roaster-profile" className={hubCrudStyles.linkStrong}>
            Roaster Profile
          </Link>{' '}
          before publishing batches.
        </div>
      ) : null}

      {loading ? <p className={hubCrudStyles.muted}>Loading canonical batches…</p> : null}
      {error ? <p className={hubCrudStyles.error}>{error}</p> : null}

      {!loading && !error && userId && roasterExists && roasterComplete ? (
        records.length > 0 ? (
          <div className="space-y-4">
            {records.map((record) => (
              <article
                key={record.batchId}
                className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="font-display text-3xl uppercase tracking-[-0.02em] text-vs-text-primary">
                      {record.coffeeName}
                    </p>
                    <p className="text-base text-vs-text-secondary">
                      Lot {record.lotNumber} · Roast {record.roastDate} · {record.batchStatus}
                    </p>
                    <p className="text-sm text-vs-text-secondary">
                      Variety: {record.coffeeVariety ?? '—'} · Processing: {record.coffeeProcessingMethod ?? '—'}
                    </p>
                    <p className="text-sm text-vs-text-muted">
                      {record.qrHash ? 'QR handoff is ready for this batch.' : 'Generate the QR handoff from batch details before sharing publicly.'}
                    </p>
                  </div>

                  <div className="space-y-2 text-right">
                    <p className="text-base text-vs-text-primary">
                      <strong>{record.totalCount}</strong> tastings
                    </p>
                    <p className="text-base text-vs-text-primary">
                      Avg rating: <strong>{record.avgRating}</strong>
                    </p>
                    <p className="text-xs text-vs-text-muted">
                      Stats updated: {record.statsUpdatedAt ? new Date(record.statsUpdatedAt).toLocaleString() : '—'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/roaster-hub/batches/${record.batchId}`} className={hubCrudStyles.actionLink}>
                    Manage batch
                  </Link>
                  <Link href={`/roaster-hub/batches/${record.batchId}#analytics`} className={hubCrudStyles.actionLink}>
                    Open analytics
                  </Link>
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
              No canonical batches yet. Publish the first batch to create the beta product loop.
            </p>
            <p className="mt-3">
              <Link href="/roaster-hub/batches/new" className={hubCrudStyles.actionLink}>
                Publish coffee + batch
              </Link>
            </p>
          </div>
        )
      ) : null}
    </main>
  );
}
