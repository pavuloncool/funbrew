'use client';

import {
  assertCoffeeLabelFileSize,
  clientFormValuesToInsert,
  getTodayIsoDateString,
  roasterCoffeeTagClientFormSchema,
  type RoasterCoffeeTagClientFormInput,
  type RoasterCoffeeTagClientFormValues,
} from '@funcup/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Calendar } from '@/src/components/ui/calendar';
import { Button } from '@/src/components/ui/button';
import { CoffeeLabelUploadField } from '@/src/components/ui/coffee-label-upload-field';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';
import { uploadCoffeeLabelToSupabase } from '@/src/lib/uploadCoffeeLabel';
import { getResolvedSupabasePublicOrigin } from '@/src/lib/supabasePublicOrigin';
import { getBrowserSessionSafely } from '@/src/lib/supabase/browserAuth';
import { tagStyles } from './tag.styles';

const ORIGIN_COUNTRIES: { value: string; label: string }[] = [
  { value: 'Nicaragua', label: 'Nikaragua' },
  { value: 'Ethiopia', label: 'Etiopia' },
  { value: 'Colombia', label: 'Kolumbia' },
  { value: 'Kenya', label: 'Kenia' },
  { value: 'Brazil', label: 'Brazylia' },
  { value: 'Guatemala', label: 'Gwatemala' },
  { value: 'Costa Rica', label: 'Kostaryka' },
  { value: 'Indonesia', label: 'Indonezja' },
  { value: 'Rwanda', label: 'Rwanda' },
];

const BEAN_TYPES = [
  { value: 'arabica', label: 'Arabica' },
  { value: 'robusta', label: 'Robusta' },
];

const PROCESSING = [
  { value: 'washed', label: 'Myta (washed)' },
  { value: 'natural', label: 'Naturalna' },
  { value: 'honey', label: 'Honey' },
  { value: 'anaerobic', label: 'Anaerobic' },
  { value: 'wet-hulled', label: 'Wet-hulled' },
];

const ROAST_LEVEL = [
  { value: 'light', label: 'Jasny' },
  { value: 'medium', label: 'Średni' },
  { value: 'dark', label: 'Ciemny' },
];

const BREW_METHOD = [
  { value: 'espresso', label: 'Espresso' },
  { value: 'filter', label: 'Filtr' },
  { value: 'french_press', label: 'French press' },
  { value: 'other', label: 'Inne' },
];

function parseLocalIsoDate(iso: string): Date | undefined {
  const t = iso.trim();
  if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(t)) return undefined;
  const [y, m, d] = t.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const defaultFormValues = (): RoasterCoffeeTagClientFormInput => ({
  roaster_short_name: '',
  coffeeLabelFile: undefined,
  bean_origin_country: '',
  bean_origin_farm: '',
  bean_origin_tradename: '',
  bean_origin_region: '',
  bean_type: '',
  bean_varietal_main: '',
  bean_varietal_extra: '',
  bean_origin_height: '',
  bean_processing: '',
  bean_roast_date: '',
  bean_roast_level: '',
  brew_method: '',
});

type SaveFeedback =
  | { kind: 'success'; id: string; public_hash: string; roaster_short_name: string }
  | { kind: 'error'; message: string };

type QrPreview = { svg: string; png: string; url: string };
type TastingNoteOption = { id: string; name: string; label: string; category: string; sort_order: number };
const CANONICAL_TASTING_NOTES = [
  { key: 'berry', names: ['berry'], label: 'Berry', category: 'fruity', sortOrder: 1 },
  { key: 'citrus', names: ['citrus'], label: 'Citrus', category: 'fruity', sortOrder: 2 },
  { key: 'stone-fruit', names: ['stone-fruit', 'stone_fruit'], label: 'Stone Fruit', category: 'fruity', sortOrder: 3 },
  { key: 'floral', names: ['floral'], label: 'Floral', category: 'floral', sortOrder: 4 },
  { key: 'jasmine', names: ['jasmine'], label: 'Jasmine', category: 'floral', sortOrder: 5 },
  { key: 'chocolate', names: ['chocolate'], label: 'Chocolate', category: 'sweet', sortOrder: 6 },
  { key: 'caramel', names: ['caramel'], label: 'Caramel', category: 'sweet', sortOrder: 7 },
  { key: 'honey', names: ['honey'], label: 'Honey', category: 'sweet', sortOrder: 8 },
  { key: 'brown-sugar', names: ['brown-sugar', 'brown_sugar'], label: 'Brown Sugar', category: 'sweet', sortOrder: 9 },
  { key: 'almond', names: ['almond'], label: 'Almond', category: 'nutty', sortOrder: 10 },
  { key: 'hazelnut', names: ['hazelnut'], label: 'Hazelnut', category: 'nutty', sortOrder: 11 },
  { key: 'cinnamon', names: ['cinnamon'], label: 'Cinnamon', category: 'spice', sortOrder: 12 },
] as const;

export default function RoasterAddCoffeePage() {
  const router = useRouter();
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [roasterMeta, setRoasterMeta] = useState<{
    id: string;
    roaster_short_name: string | null;
  } | null>(null);
  const roasterId = roasterMeta?.id ?? null;
  const [qrPreview, setQrPreview] = useState<QrPreview | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [tastingNoteOptions, setTastingNoteOptions] = useState<TastingNoteOption[]>([]);
  const [selectedTastingNoteIds, setSelectedTastingNoteIds] = useState<string[]>([]);
  const tastingPickerRef = useRef<HTMLDivElement | null>(null);
  const [tastingPickerOpen, setTastingPickerOpen] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const session = await getBrowserSessionSafely();
      if (cancelled) return;
      setHasSession(Boolean(session));
      if (!session) {
        setRoasterMeta(null);
        setSessionReady(true);
        return;
      }
      const { data: roaster } = await supabaseBrowser
        .from('roasters')
        .select('id, roaster_short_name')
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (cancelled) return;
      const r = roaster as { id: string; roaster_short_name: string | null } | null;
      setRoasterMeta(r ? { id: r.id, roaster_short_name: r.roaster_short_name } : null);
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
        .select('id,name,label,category,sort_order')
        .in(
          'name',
          CANONICAL_TASTING_NOTES.flatMap((note) => note.names)
        )
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      const mapToCanonical = (rows: TastingNoteOption[]): TastingNoteOption[] => {
        const byName = new Map(rows.map((row) => [row.name, row] as const));
        const mapped: TastingNoteOption[] = [];
        for (const canonical of CANONICAL_TASTING_NOTES) {
          const match = canonical.names.map((name) => byName.get(name)).find(Boolean);
          if (!match) continue;
          mapped.push({
            id: match.id,
            name: canonical.key,
            label: canonical.label,
            category: canonical.category,
            sort_order: canonical.sortOrder,
          });
        }
        return mapped;
      };

      if (!primary.error) {
        setTastingNoteOptions(mapToCanonical((primary.data ?? []) as TastingNoteOption[]));
        return;
      }

      const fallback = await supabaseBrowser
        .from('flavor_notes')
        .select('id,name,label,category,sort_order')
        .in(
          'name',
          CANONICAL_TASTING_NOTES.flatMap((note) => note.names)
        )
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      if (fallback.error) {
        setTastingNoteOptions([]);
        return;
      }
      setTastingNoteOptions(mapToCanonical((fallback.data ?? []) as TastingNoteOption[]));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const form = useForm<RoasterCoffeeTagClientFormInput, unknown, RoasterCoffeeTagClientFormValues>({
    resolver: zodResolver(roasterCoffeeTagClientFormSchema),
    defaultValues: defaultFormValues(),
    mode: 'onSubmit',
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    const fromProfile = roasterMeta?.roaster_short_name?.trim() ?? '';
    setValue('roaster_short_name', fromProfile, { shouldValidate: true, shouldDirty: false });
  }, [roasterMeta, setValue]);

  const roasterShortNameDisplay = useMemo(() => {
    if (!sessionReady) return '…';
    const n = roasterMeta?.roaster_short_name?.trim();
    if (n) return n;
    return '—';
  }, [sessionReady, roasterMeta]);

  const coffeeLabelFile = watch('coffeeLabelFile');

  const onSubmit = useCallback(
    async (values: RoasterCoffeeTagClientFormValues) => {
      setSaveFeedback(null);
      setQrPreview(null);
      setQrError(null);
      if (!(values.coffeeLabelFile instanceof File)) {
        throw new Error('Image upload failed');
      }
      assertCoffeeLabelFileSize(values.coffeeLabelFile);

      const session = await getBrowserSessionSafely();
      if (!session) {
        setSaveFeedback({
          kind: 'error',
          message: 'Zaloguj się jako palarnia, aby zapisać tag.',
        });
        return;
      }
      if (!roasterId) {
        setSaveFeedback({
          kind: 'error',
          message:
            'Brak profilu palarni dla tego konta. Utwórz wpis w tabeli roasters lub skontaktuj się z administratorem.',
        });
        return;
      }

      let coffeeLabelUrl: string;
      try {
        coffeeLabelUrl = await uploadCoffeeLabelToSupabase(
          supabaseBrowser,
          values.coffeeLabelFile,
          values.roaster_short_name
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Upload nie powiódł się';
        setSaveFeedback({ kind: 'error', message });
        return;
      }

      if (!coffeeLabelUrl) {
        throw new Error('Image upload failed');
      }

      const row = clientFormValuesToInsert(values, coffeeLabelUrl, roasterId);
      const rowWithTastingNotes = {
        ...row,
        tasting_note_ids: selectedTastingNoteIds,
      };

      try {
        const { data, error } = await supabaseBrowser
          .from('roaster_coffee_tags')
          .insert(rowWithTastingNotes as never)
          .select('id, public_hash, roaster_short_name')
          .single();
        if (error) {
          setSaveFeedback({ kind: 'error', message: error.message });
          return;
        }
        const saved = data as { id: string; public_hash: string; roaster_short_name: string };
        setSaveFeedback({
          kind: 'success',
          id: saved.id,
          public_hash: saved.public_hash,
          roaster_short_name: saved.roaster_short_name,
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Błąd zapisu';
        setSaveFeedback({ kind: 'error', message });
      }
    },
    [roasterId, selectedTastingNoteIds]
  );

  const handleGenerateQr = useCallback(async () => {
    if (saveFeedback?.kind !== 'success') return;
    setQrError(null);
    setQrLoading(true);
    try {
      const session = await getBrowserSessionSafely();
      if (!session?.access_token) {
        setQrError('Brak sesji. Zaloguj się ponownie.');
        setQrLoading(false);
        return;
      }
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tagId: saveFeedback.id }),
      });
      const body = (await res.json()) as QrPreview & { error?: string; message?: string };
      if (!res.ok) {
        setQrError(body.message ?? body.error ?? 'Nie udało się wygenerować kodu QR.');
        setQrLoading(false);
        return;
      }
      setQrPreview({ svg: body.svg, png: body.png, url: body.url });
    } catch (e) {
      setQrError(e instanceof Error ? e.message : 'Błąd sieci');
    } finally {
      setQrLoading(false);
    }
  }, [saveFeedback]);

  const downloadSvg = useCallback(() => {
    if (!qrPreview || saveFeedback?.kind !== 'success') return;
    const blob = new Blob([qrPreview.svg], { type: 'image/svg+xml' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `qr-${saveFeedback.public_hash}.svg`;
    a.click();
    URL.revokeObjectURL(href);
  }, [qrPreview, saveFeedback]);

  const setTodayRoastDate = useCallback(() => {
    setValue('bean_roast_date', getTodayIsoDateString(), { shouldValidate: true });
  }, [setValue]);

  const toggleTastingNote = useCallback((id: string) => {
    setSelectedTastingNoteIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }, []);

  useEffect(() => {
    if (!tastingPickerOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!tastingPickerRef.current) return;
      if (!(event.target instanceof Node)) return;
      if (!tastingPickerRef.current.contains(event.target)) {
        setTastingPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [tastingPickerOpen]);

  const selectedTastingLabels = useMemo(
    () =>
      selectedTastingNoteIds
        .map((id) => tastingNoteOptions.find((note) => note.id === id)?.label)
        .filter((label): label is string => Boolean(label)),
    [selectedTastingNoteIds, tastingNoteOptions]
  );

  const authGate =
    sessionReady && !hasSession ? (
      <div
        className={tagStyles.authGateBox}
        role="status"
      >
        <p className={tagStyles.authGateTitle}>Wymagane logowanie</p>
        <p className={tagStyles.authGateBody}>
          Aby zapisać tag kawy i wygenerować kod QR,{' '}
          <Link href="/login?next=/tag" className={tagStyles.authGateLink}>
            zaloguj się
          </Link>{' '}
          kontem palarni.
        </p>
      </div>
    ) : null;

  const roasterGate =
    sessionReady && hasSession && !roasterId ? (
      <div className={tagStyles.roasterGateBox} role="alert">
        <p className={tagStyles.roasterGateTitle}>Brak profilu palarni</p>
        <p className={tagStyles.roasterGateBody}>
          To konto nie ma powiązanego wiersza w tabeli <code className={tagStyles.roasterGateCode}>roasters</code>. Utwórz profil palarni,
          aby zapisywać tagi i generować kody QR.
        </p>
        <Link
          href="/roaster-hub/setup"
          className={tagStyles.roasterGateLinkPrimary}
          data-testid="link-roaster-setup"
        >
          Utwórz profil palarni
        </Link>
        <Link href="/coffee-bank" className={tagStyles.roasterGateLinkSecondary}>
          Coffee Bank
        </Link>
      </div>
    ) : null;

  const qrPanel = (
    <div className={tagStyles.qrPanelWrap}>
      <p className={tagStyles.qrPanelTitle}>Kod QR</p>
      {qrPreview ? (
        <div className={tagStyles.qrCard}>
          <img
            alt="Wygenerowany kod QR"
            className={tagStyles.qrImage}
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrPreview.svg)}`}
          />
          {qrPreview.png ? (
            <img
              alt="Podgląd PNG"
              className={tagStyles.qrImagePng}
              src={`data:image/png;base64,${qrPreview.png}`}
            />
          ) : null}
          <p className={tagStyles.qrUrl}>{qrPreview.url}</p>
          <button
            type="button"
            data-testid="btn-download-qr-svg"
            className={tagStyles.qrDownloadBtn}
            onClick={downloadSvg}
          >
            Pobierz SVG
          </button>
        </div>
      ) : (
        <p className={tagStyles.qrHint}>
          Po zapisaniu tagu użyj przycisku „Generuj kod QR”, aby zobaczyć podgląd tutaj.
        </p>
      )}
      {qrError ? (
        <p className={tagStyles.qrError} role="alert">
          {qrError}
        </p>
      ) : null}
    </div>
  );

  return (
    <div className={tagStyles.pageShell}>
      <div className={tagStyles.contentInner}>
        <h1 className={tagStyles.pageTitle}>Dodaj tag kawy</h1>
        <Link href="/roaster-hub" className={tagStyles.backToHub}>
          Wróć do Roaster Hub
        </Link>
        <div className={tagStyles.compatibilityBox}>
          <p className={tagStyles.compatibilityTitle}>Compatibility flow</p>
          <p className={tagStyles.compatibilityBody}>
            Ten ekran nadal zapisuje do <code>roaster_coffee_tags</code> jako legacy public read model.
            Dla canonical MVP publishera użyj{' '}
            <Link href="/roaster-hub/coffees/new" className={tagStyles.compatibilityLink}>
              Roaster Hub → Publikuj batch MVP
            </Link>
            .
          </p>
        </div>

        {authGate}
        {roasterGate}

        {saveFeedback?.kind === 'success' ? (
          <div
            className={tagStyles.successBox}
            role="status"
            aria-live="polite"
          >
            <p className={tagStyles.successTitle}>Dane zapisane</p>
            <p className={tagStyles.successBody}>
              Roaster: {saveFeedback.roaster_short_name}
              <br />
              Public hash: <code className={tagStyles.successCode}>{saveFeedback.public_hash}</code>
            </p>
            {process.env.NODE_ENV === 'development' ? (
              <p className={tagStyles.successDevNote}>
                Studio: tabela <code className={tagStyles.successDevMono}>roaster_coffee_tags</code>, kolumna{' '}
                <code className={tagStyles.successDevMono}>public_hash</code>.
              </p>
            ) : null}
            <button
              type="button"
              className={tagStyles.successCta}
              onClick={() => router.replace('/roaster-hub')}
            >
              Wróć do Roaster Hub
            </button>
          </div>
        ) : null}

        {saveFeedback?.kind === 'error' ? (
          <div
            className={tagStyles.errorBox}
            role="alert"
            aria-live="assertive"
          >
            <p className={tagStyles.errorTitle}>Błąd zapisu</p>
            <p className={tagStyles.errorBody}>{saveFeedback.message}</p>
          </div>
        ) : null}

        <div className={tagStyles.formGrid}>
          <div className={tagStyles.formColumn}>
        <form onSubmit={handleSubmit(onSubmit)} className={tagStyles.formRoot}>
          <FieldLabel text="Nazwa roastera (skrót)" />
          <input type="hidden" {...register('roaster_short_name')} />
          <p
            className={tagStyles.readOnlyRoasterName}
            data-testid="roaster-short-name-display"
            aria-label={`Nazwa roastera: ${roasterShortNameDisplay}`}
          >
            {roasterShortNameDisplay}
          </p>
          <Err msg={errors.roaster_short_name?.message} />

          <FieldLabel text="Zdjęcie etykiety / opakowania" />
          <div className={tagStyles.filepondWrap} data-testid="coffee-label-filepond">
            <Controller
              name="coffeeLabelFile"
              control={control}
              render={({ field: { onChange } }) => (
                <CoffeeLabelUploadField
                  file={coffeeLabelFile}
                  onFileChange={onChange}
                  labelIdle='Przeciągnij obraz lub <span class="filepond--label-action">wybierz</span>'
                />
              )}
            />
          </div>
          <Err msg={errors.coffeeLabelFile?.message} />

          <FieldLabel text="Kraj pochodzenia ziarna" />
          <select
            className={tagStyles.input}
            {...register('bean_origin_country')}
            data-testid="select-bean-origin-country"
            aria-label="Kraj pochodzenia ziarna"
          >
            <option value="">— wybierz —</option>
            {ORIGIN_COUNTRIES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Err msg={errors.bean_origin_country?.message} />

          <FieldLabel text="Nazwa farmy" />
          <input
            className={tagStyles.input}
            {...register('bean_origin_farm')}
            maxLength={96}
            aria-label="Nazwa farmy"
          />
          <Err msg={errors.bean_origin_farm?.message} />

          <FieldLabel text="Nazwa handlowa ziarna" />
          <input
            className={tagStyles.input}
            {...register('bean_origin_tradename')}
            maxLength={48}
            aria-label="Nazwa handlowa ziarna"
          />
          <Err msg={errors.bean_origin_tradename?.message} />

          <FieldLabel text="Region uprawy" />
          <input
            className={tagStyles.input}
            {...register('bean_origin_region')}
            maxLength={96}
            aria-label="Region uprawy"
          />
          <Err msg={errors.bean_origin_region?.message} />

          <FieldLabel text="Gatunek kawy" />
          <select
            className={tagStyles.input}
            {...register('bean_type')}
            aria-label="Gatunek kawy"
          >
            <option value="">— wybierz —</option>
            {BEAN_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Err msg={errors.bean_type?.message} />

          <FieldLabel text="Odmiana dominująca" />
          <input
            className={tagStyles.input}
            {...register('bean_varietal_main')}
            maxLength={48}
            aria-label="Odmiana dominująca"
          />
          <Err msg={errors.bean_varietal_main?.message} />

          <FieldLabel text="Odmiany dodatkowe (opcjonalnie)" />
          <input
            className={tagStyles.input}
            {...register('bean_varietal_extra')}
            maxLength={48}
            aria-label="Odmiany dodatkowe"
          />
          <Err msg={errors.bean_varietal_extra?.message} />

          <FieldLabel text="Wysokość uprawy (m n.p.m.)" />
          <input
            className={tagStyles.input}
            {...register('bean_origin_height')}
            inputMode="numeric"
            placeholder="np. 1800"
            aria-label="Wysokość uprawy"
          />
          <Err msg={errors.bean_origin_height?.message} />

          <FieldLabel text="Obróbka ziarna" />
          <select
            className={tagStyles.input}
            {...register('bean_processing')}
            aria-label="Obróbka ziarna"
          >
            <option value="">— wybierz —</option>
            {PROCESSING.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Err msg={errors.bean_processing?.message} />

          <FieldLabel text="Data wypału" />
          <div className={tagStyles.dateRow}>
            <Controller
              name="bean_roast_date"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      data-testid="date-picker-roast-trigger"
                      className={tagStyles.datePickerTrigger}
                      aria-label="Data wypału — otwórz kalendarz"
                    >
                      {field.value ? (
                        format(parseLocalIsoDate(field.value) ?? new Date(), 'd MMM yyyy', { locale: pl })
                      ) : (
                        <span className={tagStyles.datePlaceholder}>Wybierz datę</span>
                      )}
                      <CalendarDays className={tagStyles.calendarIcon} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      locale={pl}
                      selected={parseLocalIsoDate(field.value)}
                      onSelect={(d) => {
                        field.onChange(d ? format(d, 'yyyy-MM-dd') : '');
                      }}
                      disabled={(date) => {
                        const t = new Date();
                        t.setHours(0, 0, 0, 0);
                        const x = new Date(date);
                        x.setHours(0, 0, 0, 0);
                        return x.getTime() > t.getTime();
                      }}
                      defaultMonth={parseLocalIsoDate(field.value) ?? new Date()}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <Button
              type="button"
              variant="outline"
              data-testid="btn-roast-date-today"
              className={tagStyles.todayBtn}
              onClick={setTodayRoastDate}
            >
              Dziś
            </Button>
          </div>
          <Err msg={errors.bean_roast_date?.message} />

          <FieldLabel text="Stopień wypału" />
          <select
            className={tagStyles.input}
            {...register('bean_roast_level')}
            aria-label="Stopień wypału"
          >
            <option value="">— wybierz —</option>
            {ROAST_LEVEL.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Err msg={errors.bean_roast_level?.message} />

          <FieldLabel text="Przeznaczenie / parzenie" />
          <select
            className={tagStyles.input}
            {...register('brew_method')}
            aria-label="Przeznaczenie"
          >
            <option value="">— wybierz —</option>
            {BREW_METHOD.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Err msg={errors.brew_method?.message} />

          <FieldLabel text="Tasting notes (max 4)" />
          <div className={tagStyles.tastingDropdown} ref={tastingPickerRef}>
            <button
              type="button"
              className={tagStyles.tastingDropdownTrigger}
              onClick={() => setTastingPickerOpen((prev) => !prev)}
              aria-expanded={tastingPickerOpen}
              aria-haspopup="listbox"
              data-testid="tasting-notes-dropdown-trigger"
            >
              {selectedTastingLabels.length > 0
                ? `${selectedTastingLabels.join(', ')}`
                : 'Wybierz tasting notes'}
            </button>
            {tastingPickerOpen ? (
              <div className={tagStyles.tastingDropdownPanel} role="listbox" aria-label="Tasting notes picker">
                {tastingNoteOptions.map((note) => {
                  const selected = selectedTastingNoteIds.includes(note.id);
                  const disabled = !selected && selectedTastingNoteIds.length >= 4;
                  return (
                    <label key={note.id} className={tagStyles.tastingDropdownOption}>
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={disabled}
                        onChange={() => toggleTastingNote(note.id)}
                      />
                      <span>{note.label}</span>
                    </label>
                  );
                })}
              </div>
            ) : null}
          </div>
          <p className={tagStyles.tastingNotesHint}>
            Wybrano: {selectedTastingNoteIds.length}/4
          </p>

          <button
            type="submit"
            data-testid="btn-save-coffee-tag"
            className={tagStyles.saveBtn}
            disabled={isSubmitting || !sessionReady || !hasSession || !roasterId}
          >
            {isSubmitting ? (
              <span className={tagStyles.saveBtnSpinner}>…</span>
            ) : (
              <span className={tagStyles.socialButtonText}>Zapisz dane</span>
            )}
          </button>
        </form>

        {saveFeedback?.kind === 'success' ? (
          <div className={tagStyles.qrGenerateWrap}>
            <button
              type="button"
              data-testid="btn-generate-qr"
              className={tagStyles.qrGenerateBtn}
              disabled={qrLoading}
              onClick={() => void handleGenerateQr()}
            >
              {qrLoading ? (
                <span className={tagStyles.qrGenerateSpinner}>…</span>
              ) : (
                <span className={tagStyles.socialButtonText}>Generuj kod QR</span>
              )}
            </button>
          </div>
        ) : null}

        {process.env.NODE_ENV === 'development' ? (
          <p className={tagStyles.devApiNote} aria-label="Adres API Supabase w trybie deweloperskim">
            API: {getResolvedSupabasePublicOrigin(supabaseUrl)} — musi być 127.0.0.1:54321, żeby rekord pojawił się w lokalnym
            Studio (127.0.0.1:54323). Po zmianie .env.local: zrestartuj Next.
          </p>
        ) : null}
          </div>
          {qrPanel}
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <p className={tagStyles.fieldLabel}>{text}</p>;
}

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className={tagStyles.err}>{msg}</p>;
}
