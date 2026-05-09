'use client';

import { format, parse, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import { getBrowserSessionSafely } from '@/src/lib/supabase/browserAuth';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';
import { getResolvedSupabasePublicOrigin } from '@/src/lib/supabasePublicOrigin';

import { coffeeBankStyles } from './coffee-bank.styles';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SortKey = 'coffeeName' | 'roastDate';
type SortDir = 'asc' | 'desc';

type CoffeeRow = {
  id: string;
  name: string;
  status: string;
  cover_image_url: string | null;
};

type BatchRow = {
  id: string;
  coffee_id: string;
  lot_number: string;
  roast_date: string;
  status: string;
  created_at: string;
};

type QrCodeRow = {
  batch_id: string;
  hash: string;
  qr_url: string;
};

type CanonicalBatchRecord = {
  coffeeId: string;
  coffeeName: string;
  coffeeStatus: string;
  coverImageUrl: string | null;
  batchId: string;
  lotNumber: string;
  roastDate: string;
  batchStatus: string;
  batchCreatedAt: string;
  qrHash: string | null;
  qrUrl: string | null;
};

type QrPreview = {
  hash: string;
  url: string;
  svg: string;
  png: string;
};

function formatRoastDate(iso: string): string {
  if (!iso?.trim()) return '—';
  try {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(iso.trim())
      ? parse(iso.trim(), 'yyyy-MM-dd', new Date())
      : parseISO(iso.trim());
    if (Number.isNaN(d.getTime())) return iso;
    return format(d, 'd MMM yyyy', { locale: pl });
  } catch {
    return iso;
  }
}

function CoffeeBankContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [roasterId, setRoasterId] = useState<string | null>(null);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [records, setRecords] = useState<CanonicalBatchRecord[]>([]);

  const [sortKey, setSortKey] = useState<SortKey>('roastDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [qrPreview, setQrPreview] = useState<QrPreview | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';

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
      const { data: roaster } = await supabaseBrowser
        .from('roasters')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (cancelled) return;
      const row = roaster as { id: string } | null;
      setRoasterId(row?.id ?? null);
      setSessionReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!roasterId) {
      setRecords([]);
      setRecordsLoading(false);
      setRecordsError(null);
      return;
    }

    let cancelled = false;
    setRecordsLoading(true);
    setRecordsError(null);

    void (async () => {
      try {
        const coffeesRes = await supabaseBrowser
          .from('coffees')
          .select('id,name,status,cover_image_url')
          .eq('roaster_id', roasterId)
          .order('created_at', { ascending: false });
        if (coffeesRes.error) {
          throw new Error(coffeesRes.error.message);
        }

        const coffees = (coffeesRes.data ?? []) as CoffeeRow[];
        const coffeeById = new Map(coffees.map((coffee) => [coffee.id, coffee] as const));
        if (coffees.length === 0) {
          if (!cancelled) setRecords([]);
          return;
        }

        const coffeeIds = coffees.map((coffee) => coffee.id);
        const batchesRes = await supabaseBrowser
          .from('roast_batches')
          .select('id,coffee_id,lot_number,roast_date,status,created_at')
          .in('coffee_id', coffeeIds)
          .order('roast_date', { ascending: false });
        if (batchesRes.error) {
          throw new Error(batchesRes.error.message);
        }

        const batches = (batchesRes.data ?? []) as BatchRow[];
        if (batches.length === 0) {
          if (!cancelled) setRecords([]);
          return;
        }

        const batchIds = batches.map((batch) => batch.id);
        const qrRes = await supabaseBrowser
          .from('qr_codes')
          .select('batch_id,hash,qr_url')
          .in('batch_id', batchIds)
          .order('generated_at', { ascending: false });
        if (qrRes.error) {
          throw new Error(qrRes.error.message);
        }

        const qrRows = (qrRes.data ?? []) as QrCodeRow[];
        const qrByBatch = new Map<string, QrCodeRow>();
        for (const row of qrRows) {
          if (!qrByBatch.has(row.batch_id)) {
            qrByBatch.set(row.batch_id, row);
          }
        }

        const nextRecords: CanonicalBatchRecord[] = [];
        for (const batch of batches) {
          const coffee = coffeeById.get(batch.coffee_id);
          if (!coffee) continue;
          const qr = qrByBatch.get(batch.id) ?? null;
          nextRecords.push({
            coffeeId: coffee.id,
            coffeeName: coffee.name,
            coffeeStatus: coffee.status,
            coverImageUrl: coffee.cover_image_url,
            batchId: batch.id,
            lotNumber: batch.lot_number,
            roastDate: batch.roast_date,
            batchStatus: batch.status,
            batchCreatedAt: batch.created_at,
            qrHash: qr?.hash ?? null,
            qrUrl: qr?.qr_url ?? null,
          });
        }

        if (!cancelled) {
          setRecords(nextRecords);
        }
      } catch (error) {
        if (!cancelled) {
          setRecordsError(error instanceof Error ? error.message : 'Failed to load canonical coffee bank.');
          setRecords([]);
        }
      } finally {
        if (!cancelled) {
          setRecordsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [roasterId]);

  const batchParam = searchParams.get('batch');
  const selectedBatchId = useMemo(() => {
    if (!batchParam || !UUID_RE.test(batchParam)) return null;
    if (!records.some((record) => record.batchId === batchParam)) return null;
    return batchParam;
  }, [batchParam, records]);

  const selectedRecord = useMemo(
    () => (selectedBatchId ? records.find((record) => record.batchId === selectedBatchId) ?? null : null),
    [selectedBatchId, records]
  );

  const sortedRecords = useMemo(() => {
    const copy = [...records];
    copy.sort((a, b) => {
      if (sortKey === 'coffeeName') {
        const c = a.coffeeName.toLowerCase().localeCompare(b.coffeeName.toLowerCase(), 'pl');
        return sortDir === 'asc' ? c : -c;
      }
      const c = a.roastDate.localeCompare(b.roastDate);
      return sortDir === 'asc' ? c : -c;
    });
    return copy;
  }, [records, sortKey, sortDir]);

  useEffect(() => {
    setQrPreview(null);
    setQrError(null);
    setQrLoading(false);
  }, [selectedBatchId]);

  const selectBatch = useCallback(
    (batchId: string) => {
      router.replace(`/coffee-bank?batch=${encodeURIComponent(batchId)}`);
    },
    [router]
  );

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir(key === 'roastDate' ? 'desc' : 'asc');
      }
    },
    [sortKey]
  );

  const refreshQr = useCallback(async () => {
    if (!selectedRecord) return;
    setQrLoading(true);
    setQrError(null);

    try {
      const session = await getBrowserSessionSafely();
      if (!session?.access_token) {
        throw new Error('Brak sesji. Zaloguj się ponownie.');
      }
      const response = await fetch('/api/batch-qr', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchId: selectedRecord.batchId }),
      });
      const body = (await response.json()) as
        | QrPreview
        | { error?: string; message?: string };
      if (!response.ok) {
        throw new Error('message' in body && body.message ? body.message : 'Unable to generate QR.');
      }
      const preview = body as QrPreview;
      setQrPreview(preview);
    } catch (error) {
      setQrError(error instanceof Error ? error.message : 'Nie udało się wygenerować kodu QR.');
    } finally {
      setQrLoading(false);
    }
  }, [selectedRecord]);

  const downloadSvg = useCallback(() => {
    if (!selectedRecord || !qrPreview?.svg) return;
    const blob = new Blob([qrPreview.svg], { type: 'image/svg+xml' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `batch-${selectedRecord.batchId}.svg`;
    a.click();
    URL.revokeObjectURL(href);
  }, [selectedRecord, qrPreview]);

  const effectiveQrHash = qrPreview?.hash ?? selectedRecord?.qrHash ?? null;
  const effectiveQrUrl = qrPreview?.url ?? selectedRecord?.qrUrl ?? null;

  const authGate =
    sessionReady && !hasSession ? (
      <div className={coffeeBankStyles.authGateBox} role="status">
        <p className={coffeeBankStyles.authGateTitle}>Wymagane logowanie</p>
        <p className={coffeeBankStyles.authGateBody}>
          Aby zobaczyć Coffee Bank,{' '}
          <Link href="/login?next=/coffee-bank" className={coffeeBankStyles.authGateLink}>
            zaloguj się
          </Link>{' '}
          kontem palarni.
        </p>
      </div>
    ) : null;

  const roasterGate =
    sessionReady && hasSession && !roasterId ? (
      <div className={coffeeBankStyles.roasterGateBox} role="alert">
        <p className={coffeeBankStyles.roasterGateTitle}>Brak profilu palarni</p>
        <p className={coffeeBankStyles.roasterGateBody}>
          To konto nie ma powiązanego wpisu w tabeli{' '}
          <code className={coffeeBankStyles.roasterGateCode}>roasters</code>. Utwórz profil palarni, aby
          zarządzać canonical coffee bank.
        </p>
        <Link href="/roaster-hub/setup" className={coffeeBankStyles.roasterGateLinkPrimary}>
          Utwórz profil palarni
        </Link>
      </div>
    ) : null;

  const nameHeaderClass =
    sortKey === 'coffeeName'
      ? `${coffeeBankStyles.tableThBtn} ${coffeeBankStyles.tableThBtnActive}`
      : coffeeBankStyles.tableThBtn;
  const roastHeaderClass =
    sortKey === 'roastDate'
      ? `${coffeeBankStyles.tableThBtn} ${coffeeBankStyles.tableThBtnActive}`
      : coffeeBankStyles.tableThBtn;

  return (
    <div className={coffeeBankStyles.pageShell}>
      <div className={coffeeBankStyles.contentInner}>
        <h1 className={coffeeBankStyles.pageTitle}>Coffee Bank</h1>
        <Link href="/roaster-hub" className={coffeeBankStyles.backToHub}>
          Wróć do Roaster Hub
        </Link>

        <div className={coffeeBankStyles.compatibilityBox}>
          <p className={coffeeBankStyles.compatibilityTitle}>Canonical management surface</p>
          <p className={coffeeBankStyles.compatibilityBody}>
            Ta strona pokazuje canonical rekordy ({' '}
            <code className={coffeeBankStyles.inlineCode}>coffees + roast_batches + qr_codes</code>) i jest jedyną
            ścieżką zarządzania danymi kaw w wersji beta.
          </p>
        </div>

        {authGate}
        {roasterGate}

        {recordsError ? (
          <div className={coffeeBankStyles.errorBox} role="alert">
            <p className={coffeeBankStyles.errorText}>{recordsError}</p>
          </div>
        ) : null}

        {sessionReady && hasSession && roasterId ? (
          <div className={coffeeBankStyles.twoColumnGrid}>
            <div className={coffeeBankStyles.leftColumn}>
              <p className={coffeeBankStyles.tableTitle}>Canonical batche Twojej palarni</p>
              {recordsLoading ? (
                <p className={coffeeBankStyles.loadingText}>Ładowanie listy…</p>
              ) : sortedRecords.length === 0 ? (
                <p className={coffeeBankStyles.emptyText}>
                  Brak canonical batchy. Opublikuj pierwszy przez{' '}
                  <Link href="/roaster-hub/coffees/new" className={coffeeBankStyles.authGateLink}>
                    Publikuj batch MVP
                  </Link>
                  .
                </p>
              ) : (
                <div className={coffeeBankStyles.tableScroll}>
                  <table className={coffeeBankStyles.table}>
                    <thead>
                      <tr className={coffeeBankStyles.tableHeadRow}>
                        <th className={coffeeBankStyles.tableTh} scope="col">
                          <button
                            type="button"
                            className={nameHeaderClass}
                            aria-sort={
                              sortKey === 'coffeeName'
                                ? sortDir === 'asc'
                                  ? 'ascending'
                                  : 'descending'
                                : 'none'
                            }
                            onClick={() => toggleSort('coffeeName')}
                          >
                            Kawa
                            <span className={coffeeBankStyles.sortIcon} aria-hidden>
                              {sortKey === 'coffeeName' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                            </span>
                          </button>
                        </th>
                        <th className={coffeeBankStyles.tableTh} scope="col">
                          Batch / wypał
                        </th>
                        <th className={coffeeBankStyles.tableTh} scope="col">
                          <button
                            type="button"
                            className={roastHeaderClass}
                            aria-sort={
                              sortKey === 'roastDate'
                                ? sortDir === 'asc'
                                  ? 'ascending'
                                  : 'descending'
                                : 'none'
                            }
                            onClick={() => toggleSort('roastDate')}
                          >
                            Data wypału
                            <span className={coffeeBankStyles.sortIcon} aria-hidden>
                              {sortKey === 'roastDate' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                            </span>
                          </button>
                        </th>
                        <th className={coffeeBankStyles.tableTh} scope="col">
                          Akcje
                        </th>
                      </tr>
                    </thead>
                    <tbody className={coffeeBankStyles.tableBody}>
                      {sortedRecords.map((record) => {
                        const isSel = record.batchId === selectedBatchId;
                        return (
                          <tr
                            key={record.batchId}
                            className={isSel ? coffeeBankStyles.tableTrSelected : coffeeBankStyles.tableTr}
                          >
                            <td className={coffeeBankStyles.tableTd}>
                              <button
                                type="button"
                                className={coffeeBankStyles.nameLink}
                                data-testid={`coffee-bank-select-${record.batchId}`}
                                onClick={() => selectBatch(record.batchId)}
                              >
                                {record.coffeeName}
                              </button>
                            </td>
                            <td className={coffeeBankStyles.tableTd}>
                              {record.lotNumber} · {record.batchStatus}
                            </td>
                            <td className={coffeeBankStyles.tableTd}>{formatRoastDate(record.roastDate)}</td>
                            <td className={coffeeBankStyles.tableTdAction}>
                              <Link
                                href={`/roaster-hub/coffees/${record.coffeeId}`}
                                className={coffeeBankStyles.editLink}
                              >
                                Edit coffee
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className={coffeeBankStyles.rightColumn}>
              {!selectedRecord ? (
                <div className={coffeeBankStyles.productCard}>
                  <p className={coffeeBankStyles.productEmpty}>Wybierz batch z listy po lewej stronie.</p>
                </div>
              ) : (
                <div className={coffeeBankStyles.productCard}>
                  <h2 className={coffeeBankStyles.productCardTitle}>{selectedRecord.coffeeName}</h2>
                  {selectedRecord.coverImageUrl ? (
                    <div className={coffeeBankStyles.productImageWrap}>
                      <img
                        src={selectedRecord.coverImageUrl}
                        alt="Coffee cover"
                        className={coffeeBankStyles.productImage}
                      />
                    </div>
                  ) : null}

                  <p className={coffeeBankStyles.productSection}>
                    <span className={coffeeBankStyles.productStrong}>Coffee status:</span> {selectedRecord.coffeeStatus}
                  </p>
                  <p className={coffeeBankStyles.productSection}>
                    <span className={coffeeBankStyles.productStrong}>Batch lot:</span> {selectedRecord.lotNumber}
                  </p>
                  <p className={coffeeBankStyles.productSection}>
                    <span className={coffeeBankStyles.productStrong}>Roast date:</span>{' '}
                    {formatRoastDate(selectedRecord.roastDate)}
                  </p>
                  <p className={coffeeBankStyles.productSection}>
                    <span className={coffeeBankStyles.productStrong}>Batch status:</span> {selectedRecord.batchStatus}
                  </p>
                  <p className={coffeeBankStyles.productSection}>
                    <span className={coffeeBankStyles.productStrong}>Created:</span>{' '}
                    {formatRoastDate(selectedRecord.batchCreatedAt)}
                  </p>

                  <div className={coffeeBankStyles.actionRow}>
                    <Link
                      href={`/roaster-hub/coffees/${selectedRecord.coffeeId}`}
                      className={coffeeBankStyles.actionLink}
                    >
                      Edit coffee
                    </Link>
                    <Link
                      href={`/roaster-hub/coffees/${selectedRecord.coffeeId}/batches/${selectedRecord.batchId}`}
                      className={coffeeBankStyles.actionLink}
                    >
                      Batch details
                    </Link>
                    <Link
                      href={`/roaster-hub/analytics/${selectedRecord.batchId}`}
                      className={coffeeBankStyles.actionLink}
                    >
                      Batch analytics
                    </Link>
                  </div>

                  <div className={coffeeBankStyles.qrBlock}>
                    <p className={coffeeBankStyles.qrTitle}>Kod QR</p>
                    {effectiveQrHash ? (
                      <p className={coffeeBankStyles.productSection}>
                        <span className={coffeeBankStyles.productStrong}>Hash:</span> {effectiveQrHash}
                      </p>
                    ) : null}
                    {effectiveQrUrl ? (
                      <p className={coffeeBankStyles.qrUrl}>{effectiveQrUrl}</p>
                    ) : (
                      <p className={coffeeBankStyles.qrLoading}>Brak wygenerowanego QR dla tego batcha.</p>
                    )}
                    {qrPreview?.svg ? (
                      <div className={coffeeBankStyles.qrCard}>
                        <img
                          alt="Kod QR"
                          className={coffeeBankStyles.qrImage}
                          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrPreview.svg)}`}
                        />
                        {qrPreview.png ? (
                          <img
                            alt="Podgląd PNG"
                            className={coffeeBankStyles.qrImagePng}
                            src={`data:image/png;base64,${qrPreview.png}`}
                          />
                        ) : null}
                      </div>
                    ) : null}
                    <div className={coffeeBankStyles.qrActionRow}>
                      <button
                        type="button"
                        className={coffeeBankStyles.qrDownloadBtn}
                        onClick={() => void refreshQr()}
                        disabled={qrLoading}
                      >
                        {qrLoading ? 'Generowanie…' : 'Refresh QR preview'}
                      </button>
                      <button
                        type="button"
                        data-testid="coffee-bank-download-qr-svg"
                        className={coffeeBankStyles.qrDownloadBtn}
                        onClick={() => downloadSvg()}
                        disabled={!qrPreview?.svg}
                      >
                        Pobierz SVG
                      </button>
                    </div>
                    {qrError ? (
                      <p className={coffeeBankStyles.qrError} role="alert">
                        {qrError}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {process.env.NODE_ENV === 'development' ? (
          <p className={coffeeBankStyles.devApiNote} aria-label="Adres API Supabase w trybie deweloperskim">
            API: {getResolvedSupabasePublicOrigin(supabaseUrl)} — po zmianie .env.local zrestartuj Next.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CoffeeBankFallback() {
  return (
    <div className={coffeeBankStyles.pageShell}>
      <div className={coffeeBankStyles.contentInner}>
        <p className={coffeeBankStyles.loadingText}>Ładowanie…</p>
      </div>
    </div>
  );
}

export default function CoffeeBankPage() {
  return (
    <Suspense fallback={<CoffeeBankFallback />}>
      <CoffeeBankContent />
    </Suspense>
  );
}
