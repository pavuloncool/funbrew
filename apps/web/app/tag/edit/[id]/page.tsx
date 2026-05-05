'use client';

import { assertCoffeeLabelFileSize, getTodayIsoDateString } from '@funcup/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FilePond, registerPlugin } from 'react-filepond';
import { z } from 'zod';

import { Calendar } from '@/src/components/ui/calendar';
import { Button } from '@/src/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';
import { uploadCoffeeLabelToSupabase } from '@/src/lib/uploadCoffeeLabel';
import { tagStyles } from '../../tag.styles';

import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';

import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

registerPlugin(FilePondPluginFileValidateType, FilePondPluginFileValidateSize, FilePondPluginImagePreview);

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
] as const;

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

const editSchema = z.object({
  roaster_short_name: z.string().trim().min(1, 'Wymagane').max(64, 'Max 64 znaków'),
  coffeeLabelFile: z.union([z.instanceof(File), z.undefined()]),
  bean_origin_country: z.string().trim().min(1, 'Wybierz kraj'),
  bean_origin_farm: z.string().trim().min(1, 'Wymagane').max(96, 'Max 96 znaków'),
  bean_origin_tradename: z.string().trim().min(1, 'Wymagane').max(48, 'Max 48 znaków'),
  bean_origin_region: z.string().trim().min(1, 'Wymagane').max(96, 'Max 96 znaków'),
  bean_type: z.enum(['arabica', 'robusta']),
  bean_varietal_main: z.string().trim().min(1, 'Wymagane').max(48, 'Max 48 znaków'),
  bean_varietal_extra: z.string().trim().max(48, 'Max 48 znaków'),
  bean_origin_height: z
    .string()
    .trim()
    .regex(/^\d{1,4}$/, 'Liczba naturalna, max 4 cyfry')
    .refine((s) => {
      const h = Number(s);
      return Number.isInteger(h) && h >= 0 && h <= 3000;
    }, 'Wartość 0–3000'),
  bean_processing: z.string().trim().min(1, 'Wybierz obróbkę'),
  bean_roast_date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format RRRR-MM-DD'),
  bean_roast_level: z.string().trim().min(1, 'Wybierz stopień wypału'),
  brew_method: z.string().trim().min(1, 'Wybierz przeznaczenie'),
});

type EditInput = z.input<typeof editSchema>;
type EditValues = z.output<typeof editSchema>;
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

function parseLocalIsoDate(iso: string): Date | undefined {
  const t = iso.trim();
  if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(t)) return undefined;
  const [y, m, d] = t.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function EditCoffeeTagPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const tagId = params.id;

  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [roasterId, setRoasterId] = useState<string | null>(null);
  const [initialImageUrl, setInitialImageUrl] = useState<string>('');
  const [loadingTag, setLoadingTag] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [tastingNoteOptions, setTastingNoteOptions] = useState<TastingNoteOption[]>([]);
  const [selectedTastingNoteIds, setSelectedTastingNoteIds] = useState<string[]>([]);
  const tastingPickerRef = useRef<HTMLDivElement | null>(null);
  const [tastingPickerOpen, setTastingPickerOpen] = useState(false);

  const form = useForm<EditInput, unknown, EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      roaster_short_name: '',
      coffeeLabelFile: undefined,
      bean_origin_country: '',
      bean_origin_farm: '',
      bean_origin_tradename: '',
      bean_origin_region: '',
      bean_type: 'arabica',
      bean_varietal_main: '',
      bean_varietal_extra: '',
      bean_origin_height: '',
      bean_processing: '',
      bean_roast_date: '',
      bean_roast_level: '',
      brew_method: '',
    },
    mode: 'onSubmit',
  });

  const { register, control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = form;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (cancelled) return;
      setHasSession(Boolean(session));
      if (!session) {
        setSessionReady(true);
        setLoadingTag(false);
        return;
      }

      const { data: roaster } = await supabaseBrowser.from('roasters').select('id, roaster_short_name').eq('user_id', session.user.id).maybeSingle();
      if (cancelled) return;

      const r = roaster as { id: string; roaster_short_name: string | null } | null;
      setRoasterId(r?.id ?? null);
      setSessionReady(true);

      if (!r?.id) {
        setLoadingTag(false);
        return;
      }

      const { data: tag, error } = await supabaseBrowser.from('roaster_coffee_tags').select('*').eq('id', tagId).eq('roaster_id', r.id).maybeSingle();

      if (cancelled) return;
      if (error || !tag) {
        setPageError(error?.message ?? 'Nie znaleziono taga do edycji.');
        setLoadingTag(false);
        return;
      }
      const tagRow = tag as {
        img_coffee_label: string | null;
        tasting_note_ids: string[] | null;
        roaster_short_name: string | null;
        bean_origin_country: string | null;
        bean_origin_farm: string | null;
        bean_origin_tradename: string | null;
        bean_origin_region: string | null;
        bean_type: string | null;
        bean_varietal_main: string | null;
        bean_varietal_extra: string | null;
        bean_origin_height: number | null;
        bean_processing: string | null;
        bean_roast_date: string | null;
        bean_roast_level: string | null;
        brew_method: string | null;
      };

      setInitialImageUrl(tagRow.img_coffee_label ?? '');
      setSelectedTastingNoteIds(Array.isArray(tagRow.tasting_note_ids) ? tagRow.tasting_note_ids : []);

      setValue('roaster_short_name', tagRow.roaster_short_name ?? r.roaster_short_name ?? '');
      setValue('bean_origin_country', tagRow.bean_origin_country ?? '');
      setValue('bean_origin_farm', tagRow.bean_origin_farm ?? '');
      setValue('bean_origin_tradename', tagRow.bean_origin_tradename ?? '');
      setValue('bean_origin_region', tagRow.bean_origin_region ?? '');
      setValue('bean_type', (tagRow.bean_type as 'arabica' | 'robusta') ?? 'arabica');
      setValue('bean_varietal_main', tagRow.bean_varietal_main ?? '');
      setValue('bean_varietal_extra', tagRow.bean_varietal_extra ?? '');
      setValue('bean_origin_height', String(tagRow.bean_origin_height ?? ''));
      setValue('bean_processing', tagRow.bean_processing ?? '');
      setValue('bean_roast_date', tagRow.bean_roast_date ?? '');
      setValue('bean_roast_level', tagRow.bean_roast_level ?? '');
      setValue('brew_method', tagRow.brew_method ?? '');
      setLoadingTag(false);
    })();
    return () => { cancelled = true; };
  }, [setValue, tagId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const names = CANONICAL_TASTING_NOTES.flatMap((note) => note.names);
      const mapToCanonical = (rows: TastingNoteOption[]): TastingNoteOption[] => {
        const byName = new Map(rows.map((row) => [row.name, row] as const));
        const out: TastingNoteOption[] = [];
        for (const canonical of CANONICAL_TASTING_NOTES) {
          const match = canonical.names.map((name) => byName.get(name)).find(Boolean);
          if (!match) continue;
          out.push({ id: match.id, name: canonical.key, label: canonical.label, category: canonical.category, sort_order: canonical.sortOrder });
        }
        return out;
      };

      const primary = await supabaseBrowser.from('tasting_notes').select('id,name,label,category,sort_order').in('name', names).order('sort_order', { ascending: true });
      if (cancelled) return;
      if (!primary.error) {
        setTastingNoteOptions(mapToCanonical((primary.data ?? []) as TastingNoteOption[]));
        return;
      }
      const fallback = await supabaseBrowser.from('flavor_notes').select('id,name,label,category,sort_order').in('name', names).order('sort_order', { ascending: true });
      if (cancelled || fallback.error) return;
      setTastingNoteOptions(mapToCanonical((fallback.data ?? []) as TastingNoteOption[]));
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!tastingPickerOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (!tastingPickerRef.current) return;
      if (!(event.target instanceof Node)) return;
      if (!tastingPickerRef.current.contains(event.target)) setTastingPickerOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [tastingPickerOpen]);

  const selectedTastingLabels = useMemo(() => selectedTastingNoteIds.map((id) => tastingNoteOptions.find((note) => note.id === id)?.label).filter((x): x is string => Boolean(x)), [selectedTastingNoteIds, tastingNoteOptions]);

  const toggleTastingNote = useCallback((id: string) => {
    setSelectedTastingNoteIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }, []);

  const coffeeLabelFile = watch('coffeeLabelFile');
  const pondFiles = useMemo(() => (coffeeLabelFile instanceof File ? [coffeeLabelFile] : []), [coffeeLabelFile]);

  const onSubmit = useCallback(async (values: EditValues) => {
    setPageError(null);

    if (!hasSession || !roasterId) {
      setPageError('Zaloguj się jako palarnia, aby edytować tag.');
      return;
    }

    let imageUrl = initialImageUrl;
    if (values.coffeeLabelFile instanceof File) {
      assertCoffeeLabelFileSize(values.coffeeLabelFile);
      imageUrl = await uploadCoffeeLabelToSupabase(supabaseBrowser, values.coffeeLabelFile, values.roaster_short_name);
    }

    if (!imageUrl) {
      setPageError('Brak obrazu etykiety. Dodaj obraz i spróbuj ponownie.');
      return;
    }

    const payload = {
      roaster_short_name: values.roaster_short_name,
      img_coffee_label: imageUrl,
      bean_origin_country: values.bean_origin_country,
      bean_origin_farm: values.bean_origin_farm,
      bean_origin_tradename: values.bean_origin_tradename,
      bean_origin_region: values.bean_origin_region,
      bean_type: values.bean_type,
      bean_varietal_main: values.bean_varietal_main,
      bean_varietal_extra: values.bean_varietal_extra,
      bean_origin_height: Number(values.bean_origin_height),
      bean_processing: values.bean_processing,
      bean_roast_date: values.bean_roast_date,
      bean_roast_level: values.bean_roast_level,
      brew_method: values.brew_method,
      tasting_note_ids: selectedTastingNoteIds,
    };

    const { data: updated, error } = await supabaseBrowser
      .from('roaster_coffee_tags')
      .update(payload as never)
      .eq('id', tagId)
      .eq('roaster_id', roasterId)
      .select('id, bean_origin_tradename')
      .maybeSingle();

    if (error) {
      setPageError(error.message);
      return;
    }
    if (!updated) {
      setPageError('Nie udało się zapisać zmian (brak rekordu po update).');
      return;
    }

    router.replace(`/coffee-bank?tag=${encodeURIComponent(tagId)}&updated=${Date.now()}`);
    router.refresh();
  }, [hasSession, initialImageUrl, roasterId, router, selectedTastingNoteIds, tagId]);

  const setTodayRoastDate = useCallback(() => {
    setValue('bean_roast_date', getTodayIsoDateString(), { shouldValidate: true });
  }, [setValue]);

  if (loadingTag) return <div className={tagStyles.pageShell}><div className={tagStyles.contentInner}><p className={tagStyles.qrHint}>Ładowanie…</p></div></div>;

  return (
    <div className={tagStyles.pageShell}>
      <div className={tagStyles.contentInner}>
        <h1 className={tagStyles.pageTitle}>Edytuj tag kawy</h1>
        <Link href={`/coffee-bank?tag=${encodeURIComponent(tagId)}`} className={tagStyles.backToHub}>Wróć do Coffee Bank</Link>

        {sessionReady && !hasSession ? (
          <div className={tagStyles.authGateBox} role="status">
            <p className={tagStyles.authGateTitle}>Wymagane logowanie</p>
            <p className={tagStyles.authGateBody}>Aby edytować tag kawy, <Link href="/login?next=/coffee-bank" className={tagStyles.authGateLink}>zaloguj się</Link> kontem palarni.</p>
          </div>
        ) : null}

        {pageError ? <div className={tagStyles.errorBox} role="alert"><p className={tagStyles.errorBody}>{pageError}</p></div> : null}

        <form onSubmit={handleSubmit(onSubmit)} className={tagStyles.formRoot}>
          <FieldLabel text="Nazwa roastera (skrót)" />
          <input className={tagStyles.input} {...register('roaster_short_name')} />
          <Err msg={errors.roaster_short_name?.message} />

          <FieldLabel text="Zdjęcie etykiety / opakowania (opcjonalnie: podmień)" />
          {initialImageUrl ? <div className={tagStyles.filepondWrap}><img src={initialImageUrl} alt="Aktualna etykieta" className="max-h-48 w-full rounded object-contain" /></div> : null}
          <div className={tagStyles.filepondWrap}>
            <Controller
              name="coffeeLabelFile"
              control={control}
              render={({ field: { onChange } }) => (
                <FilePond
                  files={pondFiles}
                  allowMultiple={false}
                  maxFiles={1}
                  instantUpload={false}
                  credits={false}
                  allowImagePreview
                  acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp']}
                  maxFileSize="512KB"
                  labelIdle='Przeciągnij nowy obraz lub <span class="filepond--label-action">wybierz</span>'
                  onupdatefiles={(items) => {
                    const f = items[0]?.file;
                    onChange(f instanceof File ? f : undefined);
                  }}
                />
              )}
            />
          </div>

          <FieldLabel text="Kraj pochodzenia ziarna" />
          <select className={tagStyles.input} {...register('bean_origin_country')}><option value="">— wybierz —</option>{ORIGIN_COUNTRIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          <Err msg={errors.bean_origin_country?.message} />

          <FieldLabel text="Nazwa farmy" />
          <input className={tagStyles.input} {...register('bean_origin_farm')} maxLength={96} />
          <Err msg={errors.bean_origin_farm?.message} />

          <FieldLabel text="Nazwa handlowa ziarna" />
          <input className={tagStyles.input} {...register('bean_origin_tradename')} maxLength={48} />
          <Err msg={errors.bean_origin_tradename?.message} />

          <FieldLabel text="Region uprawy" />
          <input className={tagStyles.input} {...register('bean_origin_region')} maxLength={96} />
          <Err msg={errors.bean_origin_region?.message} />

          <FieldLabel text="Gatunek kawy" />
          <select className={tagStyles.input} {...register('bean_type')}><option value="">— wybierz —</option>{BEAN_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          <Err msg={errors.bean_type?.message} />

          <FieldLabel text="Odmiana dominująca" />
          <input className={tagStyles.input} {...register('bean_varietal_main')} maxLength={48} />
          <Err msg={errors.bean_varietal_main?.message} />

          <FieldLabel text="Odmiany dodatkowe (opcjonalnie)" />
          <input className={tagStyles.input} {...register('bean_varietal_extra')} maxLength={48} />
          <Err msg={errors.bean_varietal_extra?.message} />

          <FieldLabel text="Wysokość uprawy (m n.p.m.)" />
          <input className={tagStyles.input} {...register('bean_origin_height')} inputMode="numeric" />
          <Err msg={errors.bean_origin_height?.message} />

          <FieldLabel text="Obróbka ziarna" />
          <select className={tagStyles.input} {...register('bean_processing')}><option value="">— wybierz —</option>{PROCESSING.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          <Err msg={errors.bean_processing?.message} />

          <FieldLabel text="Data wypału" />
          <div className={tagStyles.dateRow}>
            <Controller
              name="bean_roast_date"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className={tagStyles.datePickerTrigger}>
                      {field.value ? format(parseLocalIsoDate(field.value) ?? new Date(), 'd MMM yyyy', { locale: pl }) : <span className={tagStyles.datePlaceholder}>Wybierz datę</span>}
                      <CalendarDays className={tagStyles.calendarIcon} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" locale={pl} selected={parseLocalIsoDate(field.value)} onSelect={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')} defaultMonth={parseLocalIsoDate(field.value) ?? new Date()} />
                  </PopoverContent>
                </Popover>
              )}
            />
            <Button type="button" variant="outline" className={tagStyles.todayBtn} onClick={setTodayRoastDate}>Dziś</Button>
          </div>
          <Err msg={errors.bean_roast_date?.message} />

          <FieldLabel text="Stopień wypału" />
          <select className={tagStyles.input} {...register('bean_roast_level')}><option value="">— wybierz —</option>{ROAST_LEVEL.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          <Err msg={errors.bean_roast_level?.message} />

          <FieldLabel text="Przeznaczenie / parzenie" />
          <select className={tagStyles.input} {...register('brew_method')}><option value="">— wybierz —</option>{BREW_METHOD.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          <Err msg={errors.brew_method?.message} />

          <FieldLabel text="Tasting notes (max 4)" />
          <div className={tagStyles.tastingDropdown} ref={tastingPickerRef}>
            <button type="button" className={tagStyles.tastingDropdownTrigger} onClick={() => setTastingPickerOpen((prev) => !prev)}>{selectedTastingLabels.length > 0 ? selectedTastingLabels.join(', ') : 'Wybierz tasting notes'}</button>
            {tastingPickerOpen ? (
              <div className={tagStyles.tastingDropdownPanel} role="listbox">
                {tastingNoteOptions.map((note) => {
                  const selected = selectedTastingNoteIds.includes(note.id);
                  const disabled = !selected && selectedTastingNoteIds.length >= 4;
                  return <label key={note.id} className={tagStyles.tastingDropdownOption}><input type="checkbox" checked={selected} disabled={disabled} onChange={() => toggleTastingNote(note.id)} /><span>{note.label}</span></label>;
                })}
              </div>
            ) : null}
          </div>
          <p className={tagStyles.tastingNotesHint}>Wybrano: {selectedTastingNoteIds.length}/4</p>

          <button type="submit" className={tagStyles.saveBtn} disabled={isSubmitting || !hasSession || !roasterId}>
            <span className={tagStyles.socialButtonText}>{isSubmitting ? 'Zapisywanie…' : 'Zapisz zmiany'}</span>
          </button>
        </form>
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
