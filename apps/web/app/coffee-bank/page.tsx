'use client';

import { format, parse, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import { supabaseBrowser } from '@/src/lib/supabase/browserClient';
import {
  type RoasterCoffeeTagRow,
  useRoasterCoffeeTags,
} from '@/src/hooks/useRoasterCoffeeTags';

import { coffeeBankStyles } from './coffee-bank.styles';
import { getResolvedSupabasePublicOrigin } from '@/src/lib/supabasePublicOrigin';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SortKey = 'name' | 'roastDate';
type SortDir = 'asc' | 'desc';

type QrPreview = { svg: string; png: string; url: string };

function displayName(row: RoasterCoffeeTagRow): string {
  const t = row.bean_origin_tradename?.trim();
  if (t) return t;
  const f = row.bean_origin_farm?.trim();
  if (f) return f;
  return `Kawa ${row.id.slice(0, 8)}`;
}

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

  const [sortKey, setSortKey] = useState<SortKey>('roastDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [qrPreview, setQrPreview] = useState<QrPreview | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [tastingNoteLabelsById, setTastingNoteLabelsById] = useState<Record<string, string>>({});

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';

  const { data: tags = [], error: tagsError, isLoading: tagsLoading } = useRoasterCoffeeTags(roasterId);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();
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
      const r = roaster as { id: string } | null;
      setRoasterId(r?.id ?? null);
      setSessionReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const primary = await supabaseBrowser
        .from('tasting_notes')
        .select('id,label')
        .order('sort_order', { ascending: true });

      if (!cancelled && !primary.error) {
        const rows = (primary.data ?? []) as Array<{ id: string; label: string }>;
        const map = Object.fromEntries(rows.map((item) => [item.id, item.label]));
        setTastingNoteLabelsById(map);
        return;
      }

      const fallback = await supabaseBrowser
        .from('flavor_notes')
        .select('id,label')
        .order('sort_order', { ascending: true });

      if (cancelled || fallback.error) return;
      const rows = (fallback.data ?? []) as Array<{ id: string; label: string }>;
      const map = Object.fromEntries(rows.map((item) => [item.id, item.label]));
      setTastingNoteLabelsById(map);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tagParam = searchParams.get('tag');
  const selectedId = useMemo(() => {
    if (!tagParam || !UUID_RE.test(tagParam)) return null;
    if (!tags.some((t) => t.id === tagParam)) return null;
    return tagParam;
  }, [tagParam, tags]);

  const selectedRow = useMemo(
    () => (selectedId ? tags.find((t) => t.id === selectedId) ?? null : null),
    [selectedId, tags]
  );

  const selectedTastingNoteLabels = useMemo(() => {
    if (!selectedRow) return [];
    const ids = Array.isArray(selectedRow.tasting_note_ids) ? selectedRow.tasting_note_ids : [];
    return ids
      .map((id) => tastingNoteLabelsById[id] ?? null)
      .filter((label): label is string => Boolean(label));
  }, [selectedRow, tastingNoteLabelsById]);

  const sortedTags = useMemo(() => {
    const copy = [...tags];
    copy.sort((a, b) => {
      if (sortKey === 'name') {
        const an = displayName(a).toLowerCase();
        const bn = displayName(b).toLowerCase();
        const c = an.localeCompare(bn, 'pl');
        return sortDir === 'asc' ? c : -c;
      }
      const ad = a.bean_roast_date ?? '';
      const bd = b.bean_roast_date ?? '';
      const c = ad.localeCompare(bd);
      return sortDir === 'asc' ? c : -c;
    });
    return copy;
  }, [tags, sortKey, sortDir]);

  useEffect(() => {
    if (!selectedId) {
      setQrPreview(null);
      setQrError(null);
      setQrLoading(false);
      return;
    }

    let cancelled = false;
    setQrPreview(null);
    setQrError(null);
    setQrLoading(true);

    void (async () => {
      try {
        const {
          data: { session },
        } = await supabaseBrowser.auth.getSession();
        if (!session?.access_token) {
          if (!cancelled) {
            setQrError('Brak sesji. Zaloguj się ponownie.');
            setQrLoading(false);
          }
          return;
        }
        const res = await fetch('/api/qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ tagId: selectedId }),
        });
        const body = (await res.json()) as QrPreview & { error?: string; message?: string };
        if (cancelled) return;
        if (!res.ok) {
          setQrError(body.message ?? body.error ?? 'Nie udało się wygenerować kodu QR.');
          setQrLoading(false);
          return;
        }
        setQrPreview({ svg: body.svg, png: body.png, url: body.url });
      } catch (e) {
        if (!cancelled) {
          setQrError(e instanceof Error ? e.message : 'Błąd sieci');
        }
      } finally {
        if (!cancelled) setQrLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const selectTag = useCallback(
    (id: string) => {
      router.replace(`/coffee-bank?tag=${encodeURIComponent(id)}`);
    },
    [router]
  );

  const toggleSort = useCallback((key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'roastDate' ? 'desc' : 'asc');
    }
  }, [sortKey]);

  const downloadSvg = useCallback(() => {
    if (!qrPreview || !selectedRow) return;
    const blob = new Blob([qrPreview.svg], { type: 'image/svg+xml' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `qr-${selectedRow.public_hash}.svg`;
    a.click();
    URL.revokeObjectURL(href);
  }, [qrPreview, selectedRow]);

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
          wyświetlić zapisane tagi kaw.
        </p>
        <Link href="/roaster-hub/setup" className={coffeeBankStyles.roasterGateLinkPrimary}>
          Utwórz profil palarni
        </Link>
        <Link href="/tag" className={coffeeBankStyles.roasterGateLinkSecondary}>
          Dodaj tag kawy
        </Link>
      </div>
    ) : null;

  const tagsErrorMessage =
    tagsError instanceof Error ? tagsError.message : tagsError ? String(tagsError) : null;

  const nameHeaderClass =
    sortKey === 'name'
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

        {authGate}
        {roasterGate}

        {tagsErrorMessage ? (
          <div className={coffeeBankStyles.errorBox} role="alert">
            <p className={coffeeBankStyles.errorText}>{tagsErrorMessage}</p>
          </div>
        ) : null}

        {sessionReady && hasSession && roasterId ? (
          <div className={coffeeBankStyles.twoColumnGrid}>
            <div className={coffeeBankStyles.leftColumn}>
              <p className={coffeeBankStyles.tableTitle}>Twoje tagi kaw</p>
              {tagsLoading ? (
                <p className={coffeeBankStyles.loadingText}>Ładowanie listy…</p>
              ) : sortedTags.length === 0 ? (
                <p className={coffeeBankStyles.emptyText}>
                  Brak zapisanych tagów. Dodaj kawę na stronie{' '}
                  <Link href="/tag" className={coffeeBankStyles.authGateLink}>
                    Dodaj tag kawy
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
                              sortKey === 'name'
                                ? sortDir === 'asc'
                                  ? 'ascending'
                                  : 'descending'
                                : 'none'
                            }
                            onClick={() => toggleSort('name')}
                          >
                            Nazwa kawy
                            <span className={coffeeBankStyles.sortIcon} aria-hidden>
                              {sortKey === 'name' ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                            </span>
                          </button>
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
                      {sortedTags.map((row) => {
                        const isSel = row.id === selectedId;
                        return (
                          <tr
                            key={row.id}
                            className={isSel ? coffeeBankStyles.tableTrSelected : coffeeBankStyles.tableTr}
                          >
                            <td className={coffeeBankStyles.tableTd}>
                              <button
                                type="button"
                                className={coffeeBankStyles.nameLink}
                                data-testid={`coffee-bank-select-${row.id}`}
                                onClick={() => selectTag(row.id)}
                              >
                                {displayName(row)}
                              </button>
                            </td>
                            <td className={coffeeBankStyles.tableTd}>{formatRoastDate(row.bean_roast_date)}</td>
                            <td className={coffeeBankStyles.tableTdAction}>
                              <Link
                                href={`/tag/edit/${row.id}`}
                                className={coffeeBankStyles.editLink}
                                data-testid={`coffee-bank-edit-${row.id}`}
                              >
                                Edytuj
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
              {!selectedRow ? (
                <div className={coffeeBankStyles.productCard}>
                  <p className={coffeeBankStyles.productEmpty}>Wybierz kawę z listy po lewej stronie.</p>
                </div>
              ) : (
                <div className={coffeeBankStyles.productCard}>
                  <h2 className={coffeeBankStyles.productCardTitle}>{displayName(selectedRow)}</h2>
                  <div className={coffeeBankStyles.productImageWrap}>
                    <img
                      src={selectedRow.img_coffee_label}
                      alt="Etykieta kawy"
                      className={coffeeBankStyles.productImage}
                    />
                  </div>
                  <p className={coffeeBankStyles.productSection}>
                    <span className={coffeeBankStyles.productStrong}>Roaster:</span> {selectedRow.roaster_short_name}
                  </p>
                  <p className={coffeeBankStyles.productSection}>
                    <span className={coffeeBankStyles.productStrong}>Nazwa handlowa:</span>{' '}
                    {selectedRow.bean_origin_tradename || '—'}
                  </p>
                  <p className={coffeeBankStyles.productSection}>
                    <span className={coffeeBankStyles.productStrong}>Pochodzenie:</span> {selectedRow.bean_origin_country}{' '}
                    · {selectedRow.bean_origin_region} · {selectedRow.bean_origin_farm}
                  </p>
                  <p className={coffeeBankStyles.productSection}>
                    <span className={coffeeBankStyles.productStrong}>Ziarno:</span> {selectedRow.bean_type} ·{' '}
                    {selectedRow.bean_varietal_main}
                    {selectedRow.bean_varietal_extra ? ` · ${selectedRow.bean_varietal_extra}` : ''}
                  </p>
                  <p className={coffeeBankStyles.productSection}>
                    <span className={coffeeBankStyles.productStrong}>Obróbka:</span> {selectedRow.bean_processing}
                  </p>
                  <p className={coffeeBankStyles.productSection}>
                    <span className={coffeeBankStyles.productStrong}>Wypał:</span> {formatRoastDate(selectedRow.bean_roast_date)} (
                    {selectedRow.bean_roast_level})
                  </p>
                  <p className={coffeeBankStyles.productSection}>
                    <span className={coffeeBankStyles.productStrong}>Parzenie:</span> {selectedRow.brew_method}
                  </p>
                  <p className={coffeeBankStyles.productSection}>
                    <span className={coffeeBankStyles.productStrong}>Wysokość:</span> {selectedRow.bean_origin_height} m
                  </p>
                  <p className={coffeeBankStyles.productSection}>
                    <span className={coffeeBankStyles.productStrong}>Tasting notes:</span>{' '}
                    {selectedTastingNoteLabels.length > 0 ? selectedTastingNoteLabels.join(', ') : '—'}
                  </p>

                  <div className={coffeeBankStyles.qrBlock}>
                    <p className={coffeeBankStyles.qrTitle}>Kod QR</p>
                    {qrLoading ? (
                      <p className={coffeeBankStyles.qrLoading}>Generowanie kodu…</p>
                    ) : qrPreview ? (
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
                        <p className={coffeeBankStyles.qrUrl}>{qrPreview.url}</p>
                        <button
                          type="button"
                          data-testid="coffee-bank-download-qr-svg"
                          className={coffeeBankStyles.qrDownloadBtn}
                          onClick={() => downloadSvg()}
                        >
                          Pobierz SVG
                        </button>
                      </div>
                    ) : null}
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
