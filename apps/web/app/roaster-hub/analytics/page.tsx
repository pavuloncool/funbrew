'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { getBrowserSessionSafely } from '@/src/lib/supabase/browserAuth';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

import { hubCrudStyles } from '../hub-crud.styles';

type RoasterRow = { id: string };
type CoffeeRow = { id: string; name: string };
type BatchRow = {
  id: string;
  coffee_id: string;
  lot_number: string;
  roast_date: string;
  status: string;
};
type StatsRow = {
  batch_id: string;
  total_count: number;
  avg_rating: number;
  updated_at: string;
};

type AnalyticsBatchRecord = {
  batchId: string;
  coffeeId: string;
  coffeeName: string;
  lotNumber: string;
  roastDate: string;
  status: string;
  totalCount: number;
  avgRating: number;
  statsUpdatedAt: string | null;
};

export default function RoasterAnalyticsHubPage() {
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [roasterId, setRoasterId] = useState<string | null>(null);
  const [records, setRecords] = useState<AnalyticsBatchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const session = await getBrowserSessionSafely();
      if (cancelled) return;
      setHasSession(Boolean(session));

      if (!session) {
        setRoasterId(null);
        setSessionReady(true);
        return;
      }

      const roasterResult = await supabaseBrowser
        .from('roasters')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (roasterResult.error) {
        setError(roasterResult.error.message);
        setRoasterId(null);
        setSessionReady(true);
        return;
      }

      const roaster = roasterResult.data as RoasterRow | null;
      setRoasterId(roaster?.id ?? null);
      setSessionReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!roasterId) {
      setRecords([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const coffeesResult = await supabaseBrowser
          .from('coffees')
          .select('id,name')
          .eq('roaster_id', roasterId)
          .order('created_at', { ascending: false });
        if (coffeesResult.error) {
          throw new Error(coffeesResult.error.message);
        }

        const coffees = (coffeesResult.data ?? []) as CoffeeRow[];
        const coffeeById = new Map(coffees.map((coffee) => [coffee.id, coffee] as const));
        if (coffees.length === 0) {
          if (!cancelled) setRecords([]);
          return;
        }

        const batchesResult = await supabaseBrowser
          .from('roast_batches')
          .select('id,coffee_id,lot_number,roast_date,status')
          .in(
            'coffee_id',
            coffees.map((coffee) => coffee.id)
          )
          .order('roast_date', { ascending: false });
        if (batchesResult.error) {
          throw new Error(batchesResult.error.message);
        }

        const batches = (batchesResult.data ?? []) as BatchRow[];
        if (batches.length === 0) {
          if (!cancelled) setRecords([]);
          return;
        }

        const statsResult = await supabaseBrowser
          .from('coffee_stats')
          .select('batch_id,total_count,avg_rating,updated_at')
          .in(
            'batch_id',
            batches.map((batch) => batch.id)
          );
        if (statsResult.error) {
          throw new Error(statsResult.error.message);
        }

        const statsRows = (statsResult.data ?? []) as StatsRow[];
        const statsByBatchId = new Map(statsRows.map((stats) => [stats.batch_id, stats] as const));

        const nextRecords: AnalyticsBatchRecord[] = [];
        for (const batch of batches) {
          const coffee = coffeeById.get(batch.coffee_id);
          if (!coffee) continue;
          const stats = statsByBatchId.get(batch.id);
          nextRecords.push({
            batchId: batch.id,
            coffeeId: batch.coffee_id,
            coffeeName: coffee.name,
            lotNumber: batch.lot_number,
            roastDate: batch.roast_date,
            status: batch.status,
            totalCount: stats?.total_count ?? 0,
            avgRating: Number(stats?.avg_rating ?? 0),
            statsUpdatedAt: stats?.updated_at ?? null,
          });
        }

        if (!cancelled) {
          setRecords(nextRecords);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : 'Failed to load analytics records.');
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
  }, [roasterId]);

  const statsSummary = useMemo(() => {
    const batches = records.length;
    const totalTastings = records.reduce((sum, record) => sum + record.totalCount, 0);
    return { batches, totalTastings };
  }, [records]);

  return (
    <main className={hubCrudStyles.main760}>
      <p className="mb-4">
        <Link href="/roaster-hub" className={hubCrudStyles.navBack}>
          ← Roaster Hub
        </Link>
      </p>
      <h1 className={hubCrudStyles.pageHeading}>User data analytics</h1>

      {!sessionReady ? <p className={hubCrudStyles.muted}>Loading session…</p> : null}

      {sessionReady && !hasSession ? (
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-neutral-900">
          Aby wyświetlić analytics,{' '}
          <Link href="/login?next=/roaster-hub/analytics" className={hubCrudStyles.linkStrong}>
            zaloguj się
          </Link>{' '}
          kontem palarni.
        </div>
      ) : null}

      {sessionReady && hasSession && !roasterId ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-neutral-900">
          Brak profilu palarni. Utwórz go w{' '}
          <Link href="/roaster-hub/setup" className={hubCrudStyles.linkStrong}>
            Roaster Setup
          </Link>
          .
        </div>
      ) : null}

      {error ? <p className={hubCrudStyles.error}>{error}</p> : null}

      {sessionReady && hasSession && roasterId ? (
        <>
          <p className={`${hubCrudStyles.muted} mb-4`}>
            Batch-first analytics: wybierz batch, aby otworzyć pełny breakdown ratings, flavor notes i anonimizowanych review.
          </p>

          {loading ? <p className={hubCrudStyles.muted}>Loading canonical batches…</p> : null}

          {!loading && records.length === 0 ? (
            <div className="rounded border border-neutral-300 bg-neutral-50 p-4">
              <p className="text-sm text-neutral-800">
                Nie ma jeszcze batchy do analityki. Najpierw opublikuj canonical coffee + batch + QR.
              </p>
              <p className="mt-3">
                <Link href="/roaster-hub/coffees/new" className={hubCrudStyles.actionLink}>
                  Publish coffee + batch + QR
                </Link>
              </p>
            </div>
          ) : null}

          {!loading && records.length > 0 ? (
            <>
              <div className="mb-4 rounded border border-neutral-300 bg-neutral-50 p-3 text-sm text-neutral-800">
                <p>
                  <strong>{statsSummary.batches}</strong> batches · <strong>{statsSummary.totalTastings}</strong>{' '}
                  tastings
                </p>
              </div>

              <div className="space-y-3">
                {records.map((record) => (
                  <article key={record.batchId} className="rounded border border-neutral-300 bg-white p-4">
                    <p className="text-base font-semibold text-neutral-900">{record.coffeeName}</p>
                    <p className="text-sm text-neutral-700">
                      Lot {record.lotNumber} · Roast {record.roastDate} · {record.status}
                    </p>
                    <p className="mt-2 text-sm text-neutral-700">
                      Tastings: <strong>{record.totalCount}</strong> · Avg rating:{' '}
                      <strong>{record.avgRating.toFixed(2)}</strong>
                    </p>
                    <p className="text-xs text-neutral-500">
                      {record.statsUpdatedAt
                        ? `Stats updated ${new Date(record.statsUpdatedAt).toLocaleString()}`
                        : 'No aggregated stats row yet.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/roaster-hub/coffees/${record.coffeeId}/batches/${record.batchId}`}
                        className={hubCrudStyles.actionLink}
                      >
                        Batch details
                      </Link>
                      <Link href={`/roaster-hub/analytics/${record.batchId}`} className={hubCrudStyles.actionLink}>
                        Batch analytics
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
