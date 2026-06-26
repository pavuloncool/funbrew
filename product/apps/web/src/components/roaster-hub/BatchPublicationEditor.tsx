'use client';

import {
  ensureRoasterBatchQr,
  flowErrorUiCopy,
  getRoasterBatchPublicationDetail,
  listCoffeeVarieties,
  loadBrewMethodOptions,
  loadTastingNoteOptions,
  normalizeFlowError,
  sanitizeSelectedIds,
  SENSORY_CORE_METRICS,
  SENSORY_CORE_SCORE_OPTIONS,
  type BrewMethodOption,
  type CoffeeVarietyOption,
  type EnsureBatchQrResult,
  type TastingNoteOption,
  upsertRoasterBatchPublication,
} from '@funcup/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState, type HTMLAttributes } from 'react';

import { BrewMethodPicker } from '@/src/components/roaster-hub/BrewMethodPicker';
import { FlavorNoteSelector } from '@/src/components/roaster-hub/FlavorNoteSelector';
import { CoffeeLabelUploadField } from '@/src/components/ui/coffee-label-upload-field';
import { Popover, PopoverContent, PopoverTrigger } from '@/src/components/ui/popover';
import { useRoasterProfile } from '@/src/hooks/useRoasterProfile';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';
import { PROCESSING_METHOD_OPTIONS } from '@/src/lib/canonicalPublisher';
import { uploadCoffeeLabelToSupabase } from '@/src/lib/uploadCoffeeLabel';

import { hubCrudStyles } from '@/app/roaster-hub/hub-crud.styles';

type BatchPublicationEditorProps = {
  mode: 'create' | 'edit';
  batchId?: string;
};

type FormValues = {
  name: string;
  storeUrl: string;
  varietyIds: string[];
  processingMethod: string;
  producerNotes: string;
  coverImageUrl: string;
  originCountry: string;
  originRegion: string;
  originFarm: string;
  originProducer: string;
  originAltitudeMin: string;
  originAltitudeMax: string;
  lotNumber: string;
  roastDate: string;
  brewingNotes: string;
  roasterStory: string;
  declaredSensoryAcidity: string;
  declaredSensorySweetness: string;
  declaredSensoryBody: string;
  declaredSensoryBitter: string;
  declaredSensoryAftertaste: string;
  suggestedBrewMethodIds: string[];
  suggestedTastingNoteIds: string[];
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const ORIGIN_COUNTRY_OPTIONS = [
{ value: 'Ethiopia', label: 'Ethiopia' }, 
{ value: 'Colombia', label: 'Colombia' }, 
{ value: 'Panama', label: 'Panama' }, 
{ value: 'Kenya', label: 'Kenya' }, 
{ value: 'Brazil', label: 'Brazil' }, 
{ value: 'Guatemala', label: 'Guatemala' }, 
{ value: 'Costa Rica', label: 'Costa Rica' }, 
{ value: 'El Salvador', label: 'El Salvador' }, 
{ value: 'Honduras', label: 'Honduras' }, 
{ value: 'Peru', label: 'Peru' }, 
{ value: 'Rwanda', label: 'Rwanda' }, 
{ value: 'Burundi', label: 'Burundi' }, 
{ value: 'Uganda', label: 'Uganda' }, 
{ value: 'Indonesia', label: 'Indonesia' }, 
{ value: 'Yemen', label: 'Yemen' }, 
{ value: 'Mexico', label: 'Mexico' }, 
{ value: 'Nicaragua', label: 'Nicaragua' }, 
{ value: 'Tanzania', label: 'Tanzania' }, 
{ value: 'Ecuador', label: 'Ecuador' }, 
{ value: 'Laos', label: 'Laos' },
] as const;

const ALTITUDE_MIN_METERS = 500;
const ALTITUDE_MAX_METERS = 2600;
const ALTITUDE_STEP_METERS = 100;
const ALTITUDE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = Array.from(
  { length: Math.floor((ALTITUDE_MAX_METERS - ALTITUDE_MIN_METERS) / ALTITUDE_STEP_METERS) + 1 },
  (_, index) => {
    const meters = ALTITUDE_MIN_METERS + index * ALTITUDE_STEP_METERS;
    return { value: String(meters), label: String(meters) };
  }
);

function buildQrEntryPath(hash: string): string {
  return `/q/${encodeURIComponent(hash)}`;
}

function emptyFormValues(): FormValues {
  return {
    name: '',
    storeUrl: '',
    varietyIds: [],
    processingMethod: '',
    producerNotes: '',
    coverImageUrl: '',
    originCountry: '',
    originRegion: '',
    originFarm: '',
    originProducer: '',
    originAltitudeMin: '',
    originAltitudeMax: '',
    lotNumber: '',
    roastDate: new Date().toISOString().slice(0, 10),
    brewingNotes: '',
    roasterStory: '',
    declaredSensoryAcidity: '',
    declaredSensorySweetness: '',
    declaredSensoryBody: '',
    declaredSensoryBitter: '',
    declaredSensoryAftertaste: '',
    suggestedBrewMethodIds: [],
    suggestedTastingNoteIds: [],
  };
}

function trimNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidAbsoluteHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = 'Coffee name is required.';
  if (values.storeUrl.trim() && !isValidAbsoluteHttpUrl(values.storeUrl.trim())) {
    errors.storeUrl = 'Store URL must be a valid absolute http:// or https:// URL.';
  }
  if (!values.lotNumber.trim()) errors.lotNumber = 'Lot number is required.';
  if (!values.roastDate.trim()) errors.roastDate = 'Roast date is required.';

  const hasOriginDetails = [
    values.originCountry,
    values.originRegion,
    values.originFarm,
    values.originProducer,
    values.originAltitudeMin,
    values.originAltitudeMax,
  ].some((value) => value.trim().length > 0);

  if (hasOriginDetails && !values.originCountry.trim()) {
    errors.originCountry = 'Country of origin is required when origin details are provided.';
  }

  const altitudeMin = toNullableNumber(values.originAltitudeMin);
  const altitudeMax = toNullableNumber(values.originAltitudeMax);
  if (altitudeMin != null && altitudeMax != null && altitudeMax < altitudeMin) {
    errors.originAltitudeMax = 'Altitude max must be greater than or equal to altitude min.';
  }

  for (const metric of SENSORY_CORE_METRICS) {
    const declaredScore = toNullableNumber(values[metric.declaredKey]);
    if (
      values[metric.declaredKey].trim().length > 0 &&
      (declaredScore == null || declaredScore < 1 || declaredScore > 5 || !Number.isInteger(declaredScore))
    ) {
      errors[metric.declaredKey] = `Declared ${metric.label.toLowerCase()} must be an integer from 1 to 5.`;
    }
  }

  return errors;
}

function mapDetailToFormValues(detail: Awaited<ReturnType<typeof getRoasterBatchPublicationDetail>>): FormValues {
  const originAltitudeMin =
    detail.origin?.altitudeMin == null ? '' : String(detail.origin.altitudeMin);
  const originAltitudeMax =
    detail.origin?.altitudeMax == null ? '' : String(detail.origin.altitudeMax);
  const normalizedOriginAltitudeMax =
    originAltitudeMin && originAltitudeMax && Number(originAltitudeMax) < Number(originAltitudeMin)
      ? originAltitudeMin
      : originAltitudeMax;

  return {
    name: detail.coffee.name,
    storeUrl: detail.coffee.storeUrl ?? '',
    varietyIds: detail.coffee.varieties.map((entry) => entry.id),
    processingMethod: detail.coffee.processingMethod ?? '',
    producerNotes: detail.coffee.producerNotes ?? '',
    coverImageUrl: detail.coffee.coverImageUrl ?? '',
    originCountry: detail.origin?.country ?? '',
    originRegion: detail.origin?.region ?? '',
    originFarm: detail.origin?.farm ?? '',
    originProducer: detail.origin?.producer ?? '',
    originAltitudeMin,
    originAltitudeMax: normalizedOriginAltitudeMax,
    lotNumber: detail.batch.lotNumber,
    roastDate: detail.batch.roastDate,
    brewingNotes: detail.batch.brewingNotes ?? '',
    roasterStory: detail.batch.roasterStory ?? '',
    declaredSensoryAcidity:
      detail.batch.declaredSensoryAcidity == null ? '' : String(detail.batch.declaredSensoryAcidity),
    declaredSensorySweetness:
      detail.batch.declaredSensorySweetness == null ? '' : String(detail.batch.declaredSensorySweetness),
    declaredSensoryBody:
      detail.batch.declaredSensoryBody == null ? '' : String(detail.batch.declaredSensoryBody),
    declaredSensoryBitter:
      detail.batch.declaredSensoryBitter == null ? '' : String(detail.batch.declaredSensoryBitter),
    declaredSensoryAftertaste:
      detail.batch.declaredSensoryAftertaste == null ? '' : String(detail.batch.declaredSensoryAftertaste),
    suggestedBrewMethodIds: detail.batch.suggestedBrewMethodIds,
    suggestedTastingNoteIds: detail.batch.suggestedTastingNoteIds,
  };
}

function detailToQrPreview(detail: Awaited<ReturnType<typeof getRoasterBatchPublicationDetail>>): EnsureBatchQrResult | null {
  if (!detail.qr) return null;
  return {
    created: false,
    hash: detail.qr.hash,
    lotNumber: detail.batch.lotNumber,
    svg: '',
    png: '',
  };
}

export function BatchPublicationEditor(props: BatchPublicationEditorProps) {
  const { mode, batchId } = props;
  const router = useRouter();
  const {
    loading: profileLoading,
    userId,
    profile,
    exists: roasterExists,
    complete: roasterComplete,
    error: profileError,
  } = useRoasterProfile();
  const [values, setValues] = useState<FormValues>(emptyFormValues());
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | undefined>(undefined);
  const [qrPreview, setQrPreview] = useState<EnsureBatchQrResult | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [legacyVarietyLabel, setLegacyVarietyLabel] = useState<string | null>(null);
  const [varietyOptions, setVarietyOptions] = useState<CoffeeVarietyOption[]>([]);
  const [varietyOptionsLoading, setVarietyOptionsLoading] = useState(true);
  const [varietyOptionsError, setVarietyOptionsError] = useState<string | null>(null);
  const [brewMethodOptions, setBrewMethodOptions] = useState<BrewMethodOption[]>([]);
  const [tastingNoteOptions, setTastingNoteOptions] = useState<TastingNoteOption[]>([]);
  const [taxonomyLoading, setTaxonomyLoading] = useState(true);
  const [taxonomyError, setTaxonomyError] = useState<string | null>(null);
  const [legacyAnalyticsRedirecting, setLegacyAnalyticsRedirecting] = useState(false);

  async function hydrateQrPreview(nextBatchId: string) {
    setQrError(null);
    setQrLoading(true);

    try {
      const nextQr = await ensureRoasterBatchQr(supabaseBrowser, nextBatchId);
      setQrPreview(nextQr);
    } catch (error) {
      const normalized = normalizeFlowError({
        error,
        domain: 'qr',
      });
      setQrError(flowErrorUiCopy(normalized).message);
    } finally {
      setQrLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setVarietyOptionsLoading(true);
      setVarietyOptionsError(null);
      try {
        const options = await listCoffeeVarieties(supabaseBrowser);
        if (!cancelled) {
          setVarietyOptions(options);
        }
      } catch (error) {
        if (cancelled) return;
        const normalized = normalizeFlowError({
          error,
          domain: 'batch_publication',
        });
        setVarietyOptionsError(flowErrorUiCopy(normalized).message);
      } finally {
        if (!cancelled) {
          setVarietyOptionsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  useEffect(() => {
    if (mode !== 'edit' || !batchId) return;
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setSubmitError(null);
      try {
        const detail = await getRoasterBatchPublicationDetail(supabaseBrowser, batchId);
        if (cancelled) return;
        setValues(mapDetailToFormValues(detail));
        setLegacyVarietyLabel(
          detail.coffee.varieties.length === 0 ? detail.coffee.variety ?? null : null
        );
        setQrPreview(detailToQrPreview(detail));
        if (detail.qr?.hash) {
          void hydrateQrPreview(batchId);
        }
      } catch (error) {
        if (cancelled) return;
        const normalized = normalizeFlowError({
          error,
          domain: 'batch_publication',
        });
        setSubmitError(flowErrorUiCopy(normalized).message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [batchId, mode]);

  useEffect(() => {
    if (mode !== 'edit' || !batchId || typeof window === 'undefined') return;
    if (window.location.hash !== '#analytics') return;
    setLegacyAnalyticsRedirecting(true);
    router.replace(`/roaster-hub/analytics/${batchId}`);
  }, [batchId, mode, router]);

  const selectedVarietyOptions = useMemo(
    () =>
      varietyOptions.filter((option) => values.varietyIds.includes(option.id)),
    [values.varietyIds, varietyOptions]
  );
  const sanitizedSuggestedBrewMethodIds = useMemo(
    () => sanitizeSelectedIds(values.suggestedBrewMethodIds, brewMethodOptions),
    [values.suggestedBrewMethodIds, brewMethodOptions]
  );
  const sanitizedSuggestedTastingNoteIds = useMemo(
    () => sanitizeSelectedIds(values.suggestedTastingNoteIds, tastingNoteOptions),
    [values.suggestedTastingNoteIds, tastingNoteOptions]
  );

  useEffect(() => {
    if (!legacyVarietyLabel || values.varietyIds.length > 0 || varietyOptions.length === 0) return;
    const matchingOption = varietyOptions.find((option) => option.name === legacyVarietyLabel);
    if (!matchingOption) return;
    setValues((prev) =>
      prev.varietyIds.length > 0 ? prev : { ...prev, varietyIds: [matchingOption.id] }
    );
    setLegacyVarietyLabel(null);
  }, [legacyVarietyLabel, values.varietyIds, varietyOptions]);

  const currentBatchId = mode === 'edit' ? batchId ?? null : null;

  const altitudeMinValue = useMemo(
    () => toNullableNumber(values.originAltitudeMin),
    [values.originAltitudeMin]
  );
  const altitudeMaxOptions = useMemo(() => {
    if (altitudeMinValue == null) return ALTITUDE_OPTIONS;
    return ALTITUDE_OPTIONS.filter((option) => Number(option.value) >= altitudeMinValue);
  }, [altitudeMinValue]);

  function handleOriginAltitudeMinChange(nextMinValue: string) {
    setValues((prev) => {
      const currentMax = toNullableNumber(prev.originAltitudeMax);
      const nextMin = toNullableNumber(nextMinValue);
      if (nextMin == null || currentMax == null || currentMax >= nextMin) {
        return { ...prev, originAltitudeMin: nextMinValue };
      }
      return {
        ...prev,
        originAltitudeMin: nextMinValue,
        originAltitudeMax: nextMinValue,
      };
    });
  }

  async function refreshDetail(nextBatchId: string) {
    const detail = await getRoasterBatchPublicationDetail(supabaseBrowser, nextBatchId);
    setValues(mapDetailToFormValues(detail));
    setLegacyVarietyLabel(
      detail.coffee.varieties.length === 0 ? detail.coffee.variety ?? null : null
    );
    setQrPreview(detailToQrPreview(detail));
    if (detail.qr?.hash) {
      await hydrateQrPreview(nextBatchId);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setNotice(null);

    const nextErrors = validateForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!roasterExists || !roasterComplete) {
      setSubmitError('Create and complete your roaster profile before publishing batches.');
      return;
    }

    setSaving(true);

    try {
      let nextCoverImageUrl = values.coverImageUrl;
      if (coverImageFile) {
        const shortName = profile?.roaster_short_name?.trim();
        if (!shortName) {
          throw new Error('Set roaster short name in Roaster Profile before uploading cover image.');
        }
        nextCoverImageUrl = await uploadCoffeeLabelToSupabase(
          supabaseBrowser,
          coverImageFile,
          shortName
        );
        setCoverImageFile(undefined);
      }

      const originPayload =
        [
          values.originCountry,
          values.originRegion,
          values.originFarm,
          values.originProducer,
          values.originAltitudeMin,
          values.originAltitudeMax,
        ].some((value) => value.trim().length > 0)
          ? {
              country: trimNullable(values.originCountry),
              region: trimNullable(values.originRegion),
              farm: trimNullable(values.originFarm),
              producer: trimNullable(values.originProducer),
              altitudeMin: toNullableNumber(values.originAltitudeMin),
              altitudeMax: toNullableNumber(values.originAltitudeMax),
            }
          : null;

      if (originPayload && !originPayload.country) {
        throw new Error('Origin country is required when origin details are provided.');
      }

      const payloadBase = {
        coffee: {
          name: values.name.trim(),
          storeUrl: trimNullable(values.storeUrl),
          varietyIds: values.varietyIds,
          processingMethod: trimNullable(values.processingMethod),
          producerNotes: trimNullable(values.producerNotes),
          coverImageUrl: trimNullable(nextCoverImageUrl),
        },
        origin: originPayload,
        batch: {
          lotNumber: values.lotNumber.trim(),
          roastDate: values.roastDate.trim(),
          brewingNotes: trimNullable(values.brewingNotes),
          roasterStory: trimNullable(values.roasterStory),
          declaredSensoryAcidity: toNullableNumber(values.declaredSensoryAcidity),
          declaredSensorySweetness: toNullableNumber(values.declaredSensorySweetness),
          declaredSensoryBody: toNullableNumber(values.declaredSensoryBody),
          declaredSensoryBitter: toNullableNumber(values.declaredSensoryBitter),
          declaredSensoryAftertaste: toNullableNumber(values.declaredSensoryAftertaste),
          suggestedBrewMethodIds: sanitizedSuggestedBrewMethodIds,
          suggestedTastingNoteIds: sanitizedSuggestedTastingNoteIds,
        },
      };

      const saved = await upsertRoasterBatchPublication(
        supabaseBrowser,
        mode === 'edit'
          ? {
              mode: 'update',
              batchId: batchId as string,
              ...payloadBase,
            }
          : {
              mode: 'create',
              ...payloadBase,
            }
      );

      if (mode === 'create') {
        await ensureRoasterBatchQr(supabaseBrowser, saved.batchId);
        router.push(`/roaster-hub/batches/${saved.batchId}`);
        return;
      }

      await refreshDetail(saved.batchId);
      setNotice('Batch publication saved.');
    } catch (error) {
      const normalized = normalizeFlowError({
        error,
        domain: 'batch_publication',
      });
      setSubmitError(flowErrorUiCopy(normalized).message);
    } finally {
      setSaving(false);
    }
  }

  async function refreshQr() {
    if (!currentBatchId) return;
    await hydrateQrPreview(currentBatchId);
  }

  function downloadSvg() {
    if (!qrPreview?.svg || !currentBatchId) return;
    const blob = new Blob([qrPreview.svg], { type: 'image/svg+xml' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `batch-${currentBatchId}.svg`;
    a.click();
    URL.revokeObjectURL(href);
  }

  if (profileLoading || loading) {
    return (
      <main className={hubCrudStyles.main760}>
        <p className={hubCrudStyles.muted}>Loading batch publication…</p>
      </main>
    );
  }

  if (profileError) {
    return (
      <main className={hubCrudStyles.main760}>
        <p className={hubCrudStyles.error}>{profileError}</p>
      </main>
    );
  }

  if (legacyAnalyticsRedirecting) {
    return (
      <main className={hubCrudStyles.main760}>
        <p className={hubCrudStyles.muted}>Redirecting to batch analytics…</p>
      </main>
    );
  }

  return (
    <main className={hubCrudStyles.main760}>
      <p className="mb-4">
        <Link href="/roaster-hub/batches" className={hubCrudStyles.navBack}>
          ← Batch Manager
        </Link>
      </p>

      <h1 className={hubCrudStyles.pageHeading}>
        {mode === 'create' ? 'New Coffee + QR Code' : 'Manage batch'}
      </h1>
      <p className={`${hubCrudStyles.muted} mb-5 max-w-[720px]`}>
        {mode === 'create'
          ? 'Use this screen to publish a new batch, attach label assets, and prepare the QR handoff consumers will scan.'
          : 'Use this screen to update batch parameters, label assets, and QR handoff details. Tasting analytics now live in a separate workflow.'}
      </p>

      {currentBatchId ? (
        <div className="mb-6 flex flex-wrap gap-3">
          <Link href={`/roaster-hub/analytics/${currentBatchId}`} className={hubCrudStyles.actionLink}>
            Open batch analytics
          </Link>
        </div>
      ) : null}

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

      <form onSubmit={handleSubmit} className={hubCrudStyles.formGrid}>
        <Field
          label="Coffee name (shelf name, e.g. 'Ethiopia Yirgacheffe Chelbesa')"
          required
          value={values.name}
          onChange={(value) => setValues((prev) => ({ ...prev, name: value }))}
          error={errors.name}
        />
        <Field
          label="Store URL"
          value={values.storeUrl}
          onChange={(value) => setValues((prev) => ({ ...prev, storeUrl: value }))}
          error={errors.storeUrl}
          placeholder="https://your-store.example.com/products/coffee"
          inputMode="url"
        />
        <label className={hubCrudStyles.formGrid}>
          <span className={hubCrudStyles.label}>Package label (shelf package label (jpg, png))</span>
          <CoffeeLabelUploadField
            file={coverImageFile}
            onFileChange={setCoverImageFile}
            className="rounded border border-vs-border-subtle/30 bg-vs-elevated p-2"
            testId="coffee-cover-image-upload"
          />
          {values.coverImageUrl ? (
            <span className={`${hubCrudStyles.muted} text-xs`}>
              Current image exists. Uploading a new file will replace it on save.
            </span>
          ) : null}
          {values.coverImageUrl ? (
            <div>
              <span className={hubCrudStyles.label}>Current package label</span>
              <div className={hubCrudStyles.assetPreviewFrame}>
                <img
                  src={values.coverImageUrl}
                  alt={`${values.name || 'Coffee'} label`}
                  className={hubCrudStyles.assetPreviewImage}
                />
              </div>
            </div>
          ) : null}
        </label>
        <SelectField
          label="Country of Origin"
          value={values.originCountry}
          onChange={(value) => setValues((prev) => ({ ...prev, originCountry: value }))}
          placeholder="Select origin country"
          options={ORIGIN_COUNTRY_OPTIONS}
          error={errors.originCountry}
        />
        <VarietyMultiSelectField
          label="Variety"
          value={values.varietyIds}
          options={varietyOptions}
          selectedOptions={selectedVarietyOptions}
          onChange={(value) => setValues((prev) => ({ ...prev, varietyIds: value }))}
          loading={varietyOptionsLoading}
          error={varietyOptionsError}
        />
        <Field
          label="Region of origin"
          value={values.originRegion}
          onChange={(value) => setValues((prev) => ({ ...prev, originRegion: value }))}
        />
        <Field
          label="Farm"
          value={values.originFarm}
          onChange={(value) => setValues((prev) => ({ ...prev, originFarm: value }))}
        />
        <SelectField
          label="Processing method"
          value={values.processingMethod}
          onChange={(value) => setValues((prev) => ({ ...prev, processingMethod: value }))}
          placeholder="Select processing"
          options={PROCESSING_METHOD_OPTIONS}
        />
        {/*<TextAreaField
          label="Producer notes"
          value={values.producerNotes}
          onChange={(value) => setValues((prev) => ({ ...prev, producerNotes: value }))}
          placeholder="What should the consumer know about this coffee?"
        />*/}

        {/*<hr className="my-2 border-vs-border-default" />
        <h2 className={hubCrudStyles.pageHeading}>Origin</h2>*/}
        <Field
          label="Importer name"
          value={values.originProducer}
          onChange={(value) => setValues((prev) => ({ ...prev, originProducer: value }))}
        />
        <SelectField
          label="Altitude min (masl)"
          value={values.originAltitudeMin}
          onChange={handleOriginAltitudeMinChange}
          options={ALTITUDE_OPTIONS}
          placeholder="Select altitude min"
        />
        <SelectField
          label="Altitude max (masl)"
          value={values.originAltitudeMax}
          onChange={(value) => setValues((prev) => ({ ...prev, originAltitudeMax: value }))}
          options={altitudeMaxOptions}
          placeholder="Select altitude max"
          error={errors.originAltitudeMax}
        />
        <label className={hubCrudStyles.formGrid}>
          <span className={hubCrudStyles.label}>Roast date *</span>
          <input
            className={hubCrudStyles.input}
            type="date"
            value={values.roastDate}
            onChange={(event) => setValues((prev) => ({ ...prev, roastDate: event.target.value }))}
            required
          />
          {errors.roastDate ? <span className={hubCrudStyles.error}>{errors.roastDate}</span> : null}
        </label>
        <Field
          label="Lot ID (internal lot number or code on the bag)"
          required
          value={values.lotNumber}
          onChange={(value) => setValues((prev) => ({ ...prev, lotNumber: value }))}
          error={errors.lotNumber}
        />

        <hr className="my-2 border-vs-border-default" />
        {/*<h2 className={hubCrudStyles.pageHeading}>Batch</h2>*/}
        <TextAreaField
          label="Brewing notes"
          value={values.brewingNotes}
          onChange={(value) => setValues((prev) => ({ ...prev, brewingNotes: value }))}
          placeholder="Recipe hints, water, ratio, grind…"
        />
        <TextAreaField
          label="Roaster story"
          value={values.roasterStory}
          onChange={(value) => setValues((prev) => ({ ...prev, roasterStory: value }))}
          placeholder="What makes this batch worth tasting?"
        />
        <div className="space-y-4 rounded-vs-md border border-vs-border-default bg-vs-surface px-4 py-4">
          <div>
            <p className={hubCrudStyles.label}>Sensory Core</p>
            <p className={`${hubCrudStyles.muted} mt-1 text-xs`}>
              Same 1-5 scale consumers use for perceived Sensory Core.
            </p>
          </div>
          {SENSORY_CORE_METRICS.map((metric) => (
            <ScorePickerField
              key={metric.id}
              label={metric.label}
              leftLabel={metric.leftLabel}
              rightLabel={metric.rightLabel}
              value={values[metric.declaredKey]}
              onChange={(value) => setValues((prev) => ({ ...prev, [metric.declaredKey]: value }))}
              error={errors[metric.declaredKey]}
            />
          ))}
        </div>
        <BrewMethodPicker
          options={brewMethodOptions}
          selectedIds={values.suggestedBrewMethodIds}
          onChange={(value) => setValues((prev) => ({ ...prev, suggestedBrewMethodIds: value }))}
          disabled={Boolean(taxonomyError)}
          loading={taxonomyLoading}
          error={taxonomyError}
        />
        <FlavorNoteSelector
          options={tastingNoteOptions}
          selectedIds={values.suggestedTastingNoteIds}
          onChange={(value) => setValues((prev) => ({ ...prev, suggestedTastingNoteIds: value }))}
          disabled={Boolean(taxonomyError)}
          loading={taxonomyLoading}
          error={taxonomyError}
        />

        {submitError ? <p className={hubCrudStyles.error}>{submitError}</p> : null}
        {notice ? <p className={hubCrudStyles.muted}>{notice}</p> : null}

        <button
          type="submit"
          className={hubCrudStyles.submitBtn}
          disabled={
            saving ||
            varietyOptionsLoading ||
            taxonomyLoading ||
            Boolean(varietyOptionsError) ||
            Boolean(taxonomyError) ||
            !userId ||
            !roasterExists ||
            !roasterComplete
          }
        >
          {saving
            ? mode === 'create'
              ? 'Publishing…'
              : 'Saving…'
            : mode === 'create'
              ? 'Publish canonical batch'
              : 'Save batch publication'}
        </button>
      </form>

      {currentBatchId ? (
        <section className="mt-8">
          <article className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-3xl uppercase tracking-[-0.02em] text-vs-text-primary">
                  QR Handoff
                </p>
                <p className="mt-1 text-lg text-vs-text-secondary">
                  Lot {values.lotNumber || '—'} · Roast {values.roastDate || '—'}
                </p>
                <p className="mt-2 text-sm text-vs-text-secondary">
                  This is the QR label preview for the mobile handoff consumers open after scanning.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={hubCrudStyles.submitBtn}
                  onClick={() => void refreshQr()}
                  disabled={qrLoading}
                >
                  {qrLoading ? 'Refreshing preview…' : qrPreview?.hash ? 'Refresh preview' : 'Generate QR preview'}
                </button>
                <button
                  type="button"
                  className={hubCrudStyles.submitBtn}
                  onClick={() => downloadSvg()}
                  disabled={!qrPreview?.svg}
                >
                  Download SVG
                </button>
                {qrPreview?.hash ? (
                  <Link
                    href={buildQrEntryPath(qrPreview.hash)}
                    className={hubCrudStyles.submitBtn}
                    target="_blank"
                  >
                    Open mobile handoff
                  </Link>
                ) : null}
              </div>
            </div>

            {!qrPreview?.hash ? (
              <p className="mt-4 text-sm text-vs-text-secondary">
                No QR has been generated for this batch yet.
              </p>
            ) : null}

            {qrPreview?.svg ? (
              <div className="mt-4 space-y-3">
                <div
                  className="max-w-[240px]"
                  dangerouslySetInnerHTML={{ __html: qrPreview.svg }}
                />
              </div>
            ) : null}

            {qrError ? <p className={`${hubCrudStyles.error} mt-4`}>{qrError}</p> : null}
          </article>
        </section>
      ) : null}
    </main>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  const { label, value, onChange, error, placeholder, required, inputMode } = props;
  return (
    <label className={hubCrudStyles.formGrid}>
      <span className={hubCrudStyles.label}>
        {label}
        {required ? ' *' : ''}
      </span>
      <input
        className={hubCrudStyles.input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
      />
      {error ? <span className={hubCrudStyles.error}>{error}</span> : null}
    </label>
  );
}

function TextAreaField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const { label, value, onChange, placeholder } = props;
  return (
    <label className={hubCrudStyles.formGrid}>
      <span className={hubCrudStyles.label}>{label}</span>
      <textarea
        className={`${hubCrudStyles.input} min-h-28 resize-y`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function ScorePickerField(props: {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className={hubCrudStyles.formGrid}>
      <span className={hubCrudStyles.label}>{props.label}</span>
      <div className="flex flex-wrap items-center gap-3 rounded-vs-md border border-vs-border-default bg-vs-elevated px-3 py-3">
        <span className="min-w-0 flex-1 text-xs font-medium leading-snug text-vs-text-muted">
          {props.leftLabel}
        </span>
        <div className="flex shrink-0 gap-2">
          {SENSORY_CORE_SCORE_OPTIONS.map((option) => {
            const active = props.value === String(option);
            return (
              <button
                key={option}
                type="button"
                className={[
                  'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                  active
                    ? 'border-vs-accent-primary bg-vs-accent-primary text-vs-text-inverse'
                    : 'border-vs-border-default bg-vs-surface text-vs-text-secondary hover:bg-vs-elevated',
                ].join(' ')}
                onClick={() => props.onChange(String(option))}
                aria-pressed={active}
              >
                {option}
              </button>
            );
          })}
        </div>
        <span className="min-w-0 flex-1 text-right text-xs font-medium leading-snug text-vs-text-muted">
          {props.rightLabel}
        </span>
      </div>
      {props.error ? <span className={hubCrudStyles.error}>{props.error}</span> : null}
    </div>
  );
}

function VarietyMultiSelectField(props: {
  label: string;
  value: string[];
  options: CoffeeVarietyOption[];
  selectedOptions: CoffeeVarietyOption[];
  onChange: (value: string[]) => void;
  loading: boolean;
  error?: string | null;
}) {
  const { label, value, options, selectedOptions, onChange, loading, error } = props;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) => option.name.toLocaleLowerCase().includes(normalizedQuery));
  }, [options, query]);

  function toggleOption(optionId: string) {
    onChange(
      value.includes(optionId)
        ? value.filter((entry) => entry !== optionId)
        : [...value, optionId]
    );
  }

  const triggerLabel =
    selectedOptions.length > 0
      ? selectedOptions.map((option) => option.name).join(', ')
      : loading
        ? 'Loading varieties…'
        : 'Search and select varieties';

  return (
    <label className={hubCrudStyles.formGrid}>
      <span className={hubCrudStyles.label}>{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`${hubCrudStyles.input} min-h-11 text-left ${loading ? 'opacity-70' : ''}`}
            disabled={loading || Boolean(error)}
          >
            <span className={selectedOptions.length > 0 ? '' : 'text-vs-text-muted'}>
              {triggerLabel}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(32rem,calc(100vw-3rem))] border-2 border-vs-border-strong bg-vs-elevated p-3">
          <div className="grid gap-3">
            <input
              className={hubCrudStyles.input}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search WCR Arabica varieties"
            />
            <div className="max-h-72 overflow-y-auto rounded-vs-sm border border-vs-border-default bg-vs-surface">
              {filteredOptions.length === 0 ? (
                <p className="px-3 py-2 text-sm text-vs-text-secondary">No matching varieties.</p>
              ) : (
                filteredOptions.map((option) => {
                  const checked = value.includes(option.id);
                  return (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-vs-border-subtle/40 px-3 py-2 text-sm text-vs-text-primary last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOption(option.id)}
                      />
                      <span>{option.name}</span>
                    </label>
                  );
                })
              )}
            </div>
            {selectedOptions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="rounded-full border border-vs-border-strong px-3 py-1 text-xs text-vs-text-primary"
                    onClick={() => toggleOption(option.id)}
                  >
                    {option.name} ×
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
      {error ? <span className={hubCrudStyles.error}>{error}</span> : null}
    </label>
  );
}

function SelectField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder: string;
  error?: string;
}) {
  const { label, value, onChange, options, placeholder, error } = props;
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value) ?? null;
  const hasLegacyValue = value.trim().length > 0 && !selectedOption;

  return (
    <label className={hubCrudStyles.formGrid}>
      <span className={hubCrudStyles.label}>{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`${hubCrudStyles.input} min-h-11 text-left`}
          >
            <span className={selectedOption || hasLegacyValue ? '' : 'text-vs-text-muted'}>
              {selectedOption?.label ?? (hasLegacyValue ? value : placeholder)}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[min(32rem,calc(100vw-3rem))] border-2 border-vs-border-strong bg-vs-elevated p-3"
        >
          <div className="overflow-hidden rounded-vs-sm border border-vs-border-default bg-vs-surface">
            <button
              type="button"
              className={`flex w-full items-center gap-3 border-b border-vs-border-subtle/40 px-3 py-2 text-left text-sm ${
                value === '' ? 'bg-vs-border-default/20 text-vs-text-primary' : 'text-vs-text-muted'
              }`}
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              <input
                type="checkbox"
                checked={value === ''}
                readOnly
                disabled={value !== ''}
                className={`h-5 w-5 rounded border-vs-border-strong ${
                  value !== '' ? 'opacity-40' : ''
                }`}
              />
              <span>{placeholder}</span>
            </button>
            {options.map((option) => {
              const selected = option.value === value;
              const dimCheckbox = value !== '' && !selected;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`flex w-full items-center gap-3 border-b border-vs-border-subtle/40 px-3 py-2 text-left text-sm last:border-b-0 ${
                    selected ? 'bg-vs-border-default/20 text-vs-text-primary' : 'text-vs-text-primary'
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    readOnly
                    disabled={dimCheckbox}
                    className={`h-5 w-5 rounded border-vs-border-strong ${
                      dimCheckbox ? 'opacity-40' : ''
                    }`}
                  />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      {error ? <span className={hubCrudStyles.error}>{error}</span> : null}
    </label>
  );
}
