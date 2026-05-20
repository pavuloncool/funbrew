'use client';

import {
  aggregateRatingSummary,
  ensureRoasterBatchQr,
  filterLogsByBrewMethod,
  flowErrorUiCopy,
  getRoasterBatchPublicationDetail,
  normalizeFlowError,
  topFlavorNotesFromLogs,
  type EnsureBatchQrResult,
  type TelemetrySummary,
  upsertRoasterBatchPublication,
  useRoasterAnalytics,
} from '@funcup/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState, type HTMLAttributes } from 'react';

import AnalyticsSummary from '@/src/components/analytics/AnalyticsSummary';
import AnonymizedFreeTextNotes from '@/src/components/analytics/AnonymizedFreeTextNotes';
import AnonymizedReviews from '@/src/components/analytics/AnonymizedReviews';
import BrewMethodFilter from '@/src/components/analytics/BrewMethodFilter';
import TelemetrySummaryCard from '@/src/components/analytics/TelemetrySummary';
import TopFlavorNotes from '@/src/components/analytics/TopFlavorNotes';
import { CoffeeLabelUploadField } from '@/src/components/ui/coffee-label-upload-field';
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
  variety: string;
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
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

function buildQrEntryPath(hash: string): string {
  return `/q/${encodeURIComponent(hash)}`;
}

function emptyFormValues(): FormValues {
  return {
    name: '',
    variety: '',
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

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = 'Coffee name is required.';
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
    errors.originCountry = 'Origin country is required when origin details are provided.';
  }

  return errors;
}

function mapDetailToFormValues(detail: Awaited<ReturnType<typeof getRoasterBatchPublicationDetail>>): FormValues {
  return {
    name: detail.coffee.name,
    variety: detail.coffee.variety ?? '',
    processingMethod: detail.coffee.processingMethod ?? '',
    producerNotes: detail.coffee.producerNotes ?? '',
    coverImageUrl: detail.coffee.coverImageUrl ?? '',
    originCountry: detail.origin?.country ?? '',
    originRegion: detail.origin?.region ?? '',
    originFarm: detail.origin?.farm ?? '',
    originProducer: detail.origin?.producer ?? '',
    originAltitudeMin: detail.origin?.altitudeMin == null ? '' : String(detail.origin.altitudeMin),
    originAltitudeMax: detail.origin?.altitudeMax == null ? '' : String(detail.origin.altitudeMax),
    lotNumber: detail.batch.lotNumber,
    roastDate: detail.batch.roastDate,
    brewingNotes: detail.batch.brewingNotes ?? '',
    roasterStory: detail.batch.roasterStory ?? '',
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

function formatUpdatedAt(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function emptyTelemetrySummary(totalLogs: number): TelemetrySummary {
  return {
    totalLogs,
    logsWithTelemetry: 0,
    coveragePercent: 0,
    avgSensoryAcidity: null,
    avgSensorySweetness: null,
    avgSensoryBody: null,
    repurchaseIntentDistribution: {
      yes: 0,
      no: 0,
      unsure: 0,
    },
    experienceLevelDistribution: {
      beginner: 0,
      advanced: 0,
      expert: 0,
    },
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
  const [coffeeStatus, setCoffeeStatus] = useState('active');
  const [batchStatus, setBatchStatus] = useState('active');
  const [qrPreview, setQrPreview] = useState<EnsureBatchQrResult | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

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
    if (mode !== 'edit' || !batchId) return;
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setSubmitError(null);
      try {
        const detail = await getRoasterBatchPublicationDetail(supabaseBrowser, batchId);
        if (cancelled) return;
        setValues(mapDetailToFormValues(detail));
        setCoffeeStatus(detail.coffee.status);
        setBatchStatus(detail.batch.status);
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

  const currentBatchId = mode === 'edit' ? batchId ?? null : null;
  const analytics = useRoasterAnalytics({
    supabase: supabaseBrowser,
    batchId: currentBatchId,
  });

  const filteredLogs = useMemo(
    () =>
      analytics.data && analytics.selectedBrewMethodId
        ? filterLogsByBrewMethod(analytics.data.logs, analytics.selectedBrewMethodId)
        : analytics.data?.logs ?? [],
    [analytics.data, analytics.selectedBrewMethodId]
  );
  const filteredSummary = useMemo(
    () => aggregateRatingSummary(filteredLogs),
    [filteredLogs]
  );
  const filteredTopFlavorNotes = useMemo(
    () => topFlavorNotesFromLogs(filteredLogs),
    [filteredLogs]
  );
  const filteredTelemetrySummary = useMemo<TelemetrySummary>(() => {
    if (!analytics.data || !analytics.selectedBrewMethodId) {
      return analytics.data?.globalTelemetrySummary ?? emptyTelemetrySummary(0);
    }
    return (
      analytics.data.telemetryByBrewMethodId[analytics.selectedBrewMethodId] ??
      emptyTelemetrySummary(filteredLogs.length)
    );
  }, [analytics.data, analytics.selectedBrewMethodId, filteredLogs.length]);

  async function refreshDetail(nextBatchId: string) {
    const detail = await getRoasterBatchPublicationDetail(supabaseBrowser, nextBatchId);
    setValues(mapDetailToFormValues(detail));
    setCoffeeStatus(detail.coffee.status);
    setBatchStatus(detail.batch.status);
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
          status: coffeeStatus,
          variety: trimNullable(values.variety),
          processingMethod: trimNullable(values.processingMethod),
          producerNotes: trimNullable(values.producerNotes),
          coverImageUrl: trimNullable(nextCoverImageUrl),
        },
        origin: originPayload,
        batch: {
          lotNumber: values.lotNumber.trim(),
          roastDate: values.roastDate.trim(),
          status: batchStatus,
          brewingNotes: trimNullable(values.brewingNotes),
          roasterStory: trimNullable(values.roasterStory),
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

  return (
    <main className={hubCrudStyles.main760}>
      <p className="mb-4">
        <Link href="/roaster-hub/batches" className={hubCrudStyles.navBack}>
          ← Batch Manager
        </Link>
      </p>

      <h1 className={hubCrudStyles.pageHeading}>
        {mode === 'create' ? 'Publish batch publication' : 'Manage batch publication'}
      </h1>
      <p className={`${hubCrudStyles.muted} mb-5 max-w-[720px]`}>
        Edge-first canonical batch publication: coffee, origin, roast batch, QR handoff and analytics are managed through one runtime contract.
      </p>

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
          label="Coffee name"
          required
          value={values.name}
          onChange={(value) => setValues((prev) => ({ ...prev, name: value }))}
          error={errors.name}
        />
        <Field
          label="Variety"
          value={values.variety}
          onChange={(value) => setValues((prev) => ({ ...prev, variety: value }))}
        />
        <SelectField
          label="Processing method"
          value={values.processingMethod}
          onChange={(value) => setValues((prev) => ({ ...prev, processingMethod: value }))}
        />
        <label className={hubCrudStyles.formGrid}>
          <span className={hubCrudStyles.label}>Coffee label / package image</span>
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
        </label>
        <TextAreaField
          label="Producer notes"
          value={values.producerNotes}
          onChange={(value) => setValues((prev) => ({ ...prev, producerNotes: value }))}
          placeholder="What should the consumer know about this coffee?"
        />

        <hr className="my-2 border-vs-border-default" />
        <h2 className={hubCrudStyles.pageHeading}>Origin</h2>
        <Field
          label="Origin country"
          value={values.originCountry}
          onChange={(value) => setValues((prev) => ({ ...prev, originCountry: value }))}
          error={errors.originCountry}
        />
        <Field
          label="Origin region"
          value={values.originRegion}
          onChange={(value) => setValues((prev) => ({ ...prev, originRegion: value }))}
        />
        <Field
          label="Farm"
          value={values.originFarm}
          onChange={(value) => setValues((prev) => ({ ...prev, originFarm: value }))}
        />
        <Field
          label="Producer"
          value={values.originProducer}
          onChange={(value) => setValues((prev) => ({ ...prev, originProducer: value }))}
        />
        <Field
          label="Altitude min (m)"
          value={values.originAltitudeMin}
          onChange={(value) => setValues((prev) => ({ ...prev, originAltitudeMin: value }))}
          inputMode="numeric"
        />
        <Field
          label="Altitude max (m)"
          value={values.originAltitudeMax}
          onChange={(value) => setValues((prev) => ({ ...prev, originAltitudeMax: value }))}
          inputMode="numeric"
        />

        <hr className="my-2 border-vs-border-default" />
        <h2 className={hubCrudStyles.pageHeading}>Batch</h2>
        <Field
          label="Lot number"
          required
          value={values.lotNumber}
          onChange={(value) => setValues((prev) => ({ ...prev, lotNumber: value }))}
          error={errors.lotNumber}
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

        <div className="rounded border border-vs-border-default bg-vs-surface p-4 text-sm text-vs-text-secondary">
          <p>
            <strong className={hubCrudStyles.bodyStrong}>Coffee status:</strong> {coffeeStatus}
          </p>
          <p>
            <strong className={hubCrudStyles.bodyStrong}>Batch status:</strong> {batchStatus}
          </p>
        </div>

        {submitError ? <p className={hubCrudStyles.error}>{submitError}</p> : null}
        {notice ? <p className={hubCrudStyles.muted}>{notice}</p> : null}

        <button
          type="submit"
          className={hubCrudStyles.submitBtn}
          disabled={saving || !userId || !roasterExists || !roasterComplete}
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
        <section className="mt-8 space-y-8">
          <article className="rounded-vs-md border-2 border-vs-border-strong bg-vs-elevated p-5 shadow-vs-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-3xl uppercase tracking-[-0.02em] text-vs-text-primary">
                  QR Handoff
                </p>
                <p className="mt-1 text-lg text-vs-text-secondary">
                  Lot {values.lotNumber || '—'} · Roast {values.roastDate || '—'} · {batchStatus}
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

          <section id="analytics" className="space-y-8">
            <div className="rounded-vs-md border border-vs-border-subtle/40 bg-vs-surface px-4 py-3">
              <p className="text-base text-vs-text-primary">
                <span className="font-semibold">Published tastings:</span> {analytics.data?.globalFromStats?.totalTastings ?? 0}
              </p>
              <p className="text-base text-vs-text-primary">
                <span className="font-semibold">Average rating:</span> {analytics.data?.globalFromStats?.avgRating ?? 0}
              </p>
              <p className="font-mono text-xs text-vs-text-muted">
                Stats updated: {formatUpdatedAt(analytics.data?.statsUpdatedAt ?? null)}
              </p>
            </div>

            {analytics.error ? (
              <p className={hubCrudStyles.error}>
                {flowErrorUiCopy(
                  normalizeFlowError({ error: analytics.error, domain: 'analytics' })
                ).message}
              </p>
            ) : null}

            {analytics.isLoading ? (
              <p className={hubCrudStyles.muted}>Loading analytics…</p>
            ) : analytics.data ? (
              <>
                <AnalyticsSummary
                  title="Published batch totals"
                  caption={
                    analytics.data.globalFromStats && analytics.data.statsUpdatedAt
                      ? `Synced aggregates (updated ${new Date(analytics.data.statsUpdatedAt).toLocaleString()})`
                      : 'Derived from raw tastings on file.'
                  }
                  summary={
                    analytics.data.globalFromStats ??
                    aggregateRatingSummary(analytics.data.logs)
                  }
                />

                <TopFlavorNotes
                  title="Top flavor notes (all tastings)"
                  caption="Ranked from logged tastings on file."
                  notes={analytics.data.globalTopFlavorNotes}
                />

                <TelemetrySummaryCard
                  title="Roaster telemetry (all tastings)"
                  caption="Telemetry fields captured in consumer tasting log."
                  summary={analytics.data.globalTelemetrySummary}
                />

                <BrewMethodFilter
                  options={analytics.data.brewMethodOptions}
                  value={analytics.selectedBrewMethodId}
                  onChange={analytics.setSelectedBrewMethodId}
                />

                {analytics.selectedBrewMethodId ? (
                  <>
                    <AnalyticsSummary
                      title="Filtered totals"
                      caption="Only tastings matching the selected brew method."
                      summary={filteredSummary}
                    />
                    <TopFlavorNotes
                      title="Top flavor notes (filtered)"
                      caption="Same selection as the brew-method filter."
                      notes={filteredTopFlavorNotes}
                    />
                    <TelemetrySummaryCard
                      title="Roaster telemetry (filtered)"
                      caption="Telemetry subset matching the same brew-method filter."
                      summary={filteredTelemetrySummary}
                    />
                  </>
                ) : null}

                <AnonymizedFreeTextNotes notes={analytics.data.anonymizedFreeTextNotes} />
                <AnonymizedReviews reviews={analytics.data.anonymizedReviews} />
              </>
            ) : null}
          </section>
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

function SelectField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { label, value, onChange } = props;
  return (
    <label className={hubCrudStyles.formGrid}>
      <span className={hubCrudStyles.label}>{label}</span>
      <select
        className={hubCrudStyles.input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select processing</option>
        {PROCESSING_METHOD_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
