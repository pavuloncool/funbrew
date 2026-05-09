'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState, type HTMLAttributes } from 'react';

import { CoffeeLabelUploadField } from '@/src/components/ui/coffee-label-upload-field';
import {
  getBrowserSessionSafely,
  getBrowserUserSafely,
} from '@/src/lib/supabase/browserAuth';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';
import { uploadCoffeeLabelToSupabase } from '@/src/lib/uploadCoffeeLabel';
import {
  emptyCanonicalCoffeeFormValues,
  mapCoffeeRecordToFormValues,
  normalizeCoffeePayload,
  normalizeOriginPayload,
  PROCESSING_METHOD_OPTIONS,
  trimCanonicalCoffeeFormValues,
  type CanonicalCoffeeRecord,
  type CanonicalCoffeeFormValues,
} from '@/src/lib/canonicalPublisher';

import { hubCrudStyles } from '@/app/roaster-hub/hub-crud.styles';

type CoffeeEditorProps = {
  mode: 'create' | 'edit';
  coffeeId?: string;
};

type FormErrors = Partial<Record<keyof CanonicalCoffeeFormValues, string>>;
type QrPreview = {
  created: boolean;
  hash: string;
  lotNumber: string;
  url: string;
  svg: string;
  png: string;
};
type BatchCreateValues = {
  lotNumber: string;
  roastDate: string;
  brewingNotes: string;
  roasterStory: string;
};

function defaultBatchCreateValues(): BatchCreateValues {
  return {
    lotNumber: '',
    roastDate: new Date().toISOString().slice(0, 10),
    brewingNotes: '',
    roasterStory: '',
  };
}

function validateCoffeeForm(values: CanonicalCoffeeFormValues): FormErrors {
  const trimmed = trimCanonicalCoffeeFormValues(values);
  const errors: FormErrors = {};
  if (!trimmed.name) errors.name = 'Coffee name is required.';

  const originFields = [
    trimmed.originCountry,
    trimmed.originRegion,
    trimmed.originFarm,
    trimmed.originProducer,
    trimmed.originAltitudeMin,
    trimmed.originAltitudeMax,
  ];
  if (originFields.some(Boolean) && !trimmed.originCountry) {
    errors.originCountry = 'Origin country is required when origin details are provided.';
  }

  return errors;
}

export function CoffeeEditor(props: CoffeeEditorProps) {
  const { mode, coffeeId } = props;
  const router = useRouter();
  const [values, setValues] = useState<CanonicalCoffeeFormValues>(
    emptyCanonicalCoffeeFormValues()
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [roasterId, setRoasterId] = useState<string | null>(null);
  const [roasterShortName, setRoasterShortName] = useState<string | null>(null);
  const [roasterResolved, setRoasterResolved] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | undefined>(undefined);
  const [status, setStatus] = useState<string>('active');
  const [originId, setOriginId] = useState<string | null>(null);
  const [batchValues, setBatchValues] = useState<BatchCreateValues>(defaultBatchCreateValues());
  const [publishPreview, setPublishPreview] = useState<{
    coffeeId: string;
    batchId: string;
    qr: QrPreview;
  } | null>(null);

  async function createBatchForCoffee(input: {
    coffeeId: string;
    lotNumber: string;
    roastDate: string;
    brewingNotes: string;
    roasterStory: string;
  }): Promise<{ id: string }> {
    const session = await getBrowserSessionSafely();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!session?.access_token || !supabaseUrl || !anonKey) {
      throw new Error('Missing auth session or Supabase env.');
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/roast_batches?select=id`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        coffee_id: input.coffeeId,
        lot_number: input.lotNumber,
        roast_date: input.roastDate,
        brewing_notes: input.brewingNotes || null,
        roaster_story: input.roasterStory || null,
        status: 'active',
      }),
    });
    const rows = (await response.json()) as Array<{ id: string }>;
    const batchId = rows[0]?.id;
    if (!response.ok || !batchId) {
      throw new Error('Unable to create batch.');
    }
    return { id: batchId };
  }

  async function generateQrForBatch(batchId: string): Promise<QrPreview> {
    const session = await getBrowserSessionSafely();
    if (!session?.access_token) {
      throw new Error('Missing auth session.');
    }
    const response = await fetch('/api/batch-qr', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ batchId }),
    });
    const body = (await response.json()) as QrPreview | { message?: string };
    if (!response.ok) {
      throw new Error('message' in body && body.message ? body.message : 'Unable to generate QR.');
    }
    return body as QrPreview;
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      let user = null;
      let userError: Error | null = null;
      try {
        user = await getBrowserUserSafely();
      } catch (error) {
        userError = error instanceof Error ? error : new Error('Auth error');
      }

      if (cancelled) return;

      if (userError) {
        setSubmitError(userError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        router.replace(
          `/login?next=${encodeURIComponent(
            mode === 'create'
              ? '/roaster-hub/coffees/new'
              : `/roaster-hub/coffees/${coffeeId ?? ''}`
          )}`
        );
        return;
      }

      setUserId(user.id);

      const { data: roaster, error: roasterError } = await supabaseBrowser
        .from('roasters')
        .select('id, roaster_short_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (roasterError) {
        setSubmitError(roasterError.message);
        setRoasterResolved(true);
        setLoading(false);
        return;
      }

      const roasterRow = roaster as { id: string; roaster_short_name: string | null } | null;
      setRoasterId(roasterRow?.id ?? null);
      setRoasterShortName(roasterRow?.roaster_short_name ?? null);
      setRoasterResolved(true);

      if (mode !== 'edit' || !coffeeId || !roasterRow?.id) {
        setLoading(false);
        return;
      }

      const { data: coffee, error: coffeeError } = await supabaseBrowser
        .from('coffees')
        .select(
          'id, name, variety, processing_method, producer_notes, cover_image_url, status, origin_id, origins(country, region, farm, producer, altitude_min, altitude_max)'
        )
        .eq('id', coffeeId)
        .eq('roaster_id', roasterRow.id)
        .maybeSingle();

      if (cancelled) return;

      if (coffeeError) {
        setSubmitError(coffeeError.message);
        setLoading(false);
        return;
      }

      if (!coffee) {
        setSubmitError('Coffee not found for this roaster.');
        setLoading(false);
        return;
      }

      const record = coffee as CanonicalCoffeeRecord;
      setValues(mapCoffeeRecordToFormValues(record));
      setStatus(record.status);
      setOriginId(record.origin_id);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [coffeeId, mode, router]);

  const intro = useMemo(() => {
    if (mode === 'create') {
      return 'Canonical publisher: create a coffee record with the origin and product fields consumed by mobile.';
    }
    return 'Canonical publisher: update the product fields that feed QR Coffee Page and tasting flow.';
  }, [mode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    const nextErrors = validateCoffeeForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!userId || !roasterId) {
      setSubmitError('Create your roaster profile before publishing coffee.');
      return;
    }
    if (mode === 'create') {
      if (!batchValues.lotNumber.trim()) {
        setSubmitError('Lot number is required.');
        return;
      }
      if (!batchValues.roastDate.trim()) {
        setSubmitError('Roast date is required.');
        return;
      }
    }

    setSaving(true);
    setPublishPreview(null);

    try {
      let nextValues = values;
      if (coverImageFile) {
        const shortName = roasterShortName?.trim();
        if (!shortName) {
          throw new Error('Set roaster short name in Roaster Profile before uploading cover image.');
        }
        const uploadedCoverUrl = await uploadCoffeeLabelToSupabase(
          supabaseBrowser,
          coverImageFile,
          shortName
        );
        nextValues = { ...values, coverImageUrl: uploadedCoverUrl };
        setValues(nextValues);
        setCoverImageFile(undefined);
      }

      const originPayload = normalizeOriginPayload(nextValues);
      const session = await getBrowserSessionSafely();
      if (!session?.access_token) {
        throw new Error('Missing auth session.');
      }
      const coffeePayload = normalizeCoffeePayload({
        roasterId,
        originId,
        values: nextValues,
        status,
      });
      const response = await fetch('/api/canonical-coffee', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode,
          coffeeId: coffeeId ?? null,
          roasterId,
          originId,
          originPayload,
          coffeePayload,
        }),
      });
      const body = (await response.json()) as
        | { id: string; originId: string | null }
        | { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(
          'message' in body && typeof body.message === 'string'
            ? body.message
            : 'Unable to save canonical coffee.'
        );
      }
      const saved = body as { id: string; originId: string | null };
      setOriginId(saved.originId);

      if (mode === 'create') {
        const createdBatch = await createBatchForCoffee({
          coffeeId: saved.id,
          lotNumber: batchValues.lotNumber.trim(),
          roastDate: batchValues.roastDate.trim(),
          brewingNotes: batchValues.brewingNotes.trim(),
          roasterStory: batchValues.roasterStory.trim(),
        });
        const qrPreview = await generateQrForBatch(createdBatch.id);
        setPublishPreview({
          coffeeId: saved.id,
          batchId: createdBatch.id,
          qr: qrPreview,
        });
        return;
      }

      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save coffee.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className={hubCrudStyles.main760}>
        <p className={hubCrudStyles.muted}>Loading canonical coffee editor…</p>
      </main>
    );
  }

  return (
    <main className={hubCrudStyles.main760}>
      <p className="mb-4">
        <Link href="/roaster-hub" className={hubCrudStyles.navBack}>
          ← Roaster Hub
        </Link>
      </p>
      <h1 className={hubCrudStyles.pageHeading}>
        {mode === 'create' ? 'Create canonical coffee' : 'Edit canonical coffee'}
      </h1>
      <p className={`${hubCrudStyles.muted} mb-5 max-w-[640px]`}>{intro}</p>

      {roasterResolved && !roasterId ? (
        <div className="rounded border border-vs-warning/40 bg-vs-warning/10 p-3 text-sm text-vs-text-primary">
          Create your roaster profile first in{' '}
          <Link href="/roaster-profile" className={hubCrudStyles.linkStrong}>
            Roaster Profile
          </Link>
          .
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
          <span className={hubCrudStyles.label}>Zdjęcie etykiety / opakowania</span>
          <CoffeeLabelUploadField
            file={coverImageFile}
            onFileChange={setCoverImageFile}
            className="rounded border border-vs-border-subtle/30 bg-vs-elevated p-2"
            testId="coffee-cover-image-upload"
          />
          {mode === 'edit' && values.coverImageUrl ? (
            <span className={`${hubCrudStyles.muted} text-xs`}>
              Current image exists. Uploading a new file will replace it.
            </span>
          ) : null}
        </label>

        {mode === 'create' ? (
          <>
            <hr className="my-2 border-vs-border-default" />
            <h2 className={hubCrudStyles.pageHeading}>Batch + public QR</h2>
            <Field
              label="Lot number"
              value={batchValues.lotNumber}
              onChange={(value) => setBatchValues((prev) => ({ ...prev, lotNumber: value }))}
              required
            />
            <label className={hubCrudStyles.formGrid}>
              <span className={hubCrudStyles.label}>Roast date *</span>
              <input
                className={hubCrudStyles.input}
                type="date"
                value={batchValues.roastDate}
                onChange={(event) =>
                  setBatchValues((prev) => ({ ...prev, roastDate: event.target.value }))
                }
                required
              />
            </label>
            <TextAreaField
              label="Brewing notes"
              value={batchValues.brewingNotes}
              onChange={(value) =>
                setBatchValues((prev) => ({ ...prev, brewingNotes: value }))
              }
              placeholder="Recipe hints, water, ratio, grind…"
            />
            <TextAreaField
              label="Roaster story"
              value={batchValues.roasterStory}
              onChange={(value) =>
                setBatchValues((prev) => ({ ...prev, roasterStory: value }))
              }
              placeholder="What makes this batch worth tasting?"
            />
          </>
        ) : null}
        <TextAreaField
          label="Producer notes"
          value={values.producerNotes}
          onChange={(value) => setValues((prev) => ({ ...prev, producerNotes: value }))}
          placeholder="What should the consumer know about this coffee?"
        />

        <hr className="my-2 border-vs-border-default" />

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

        {submitError ? <p className={hubCrudStyles.error}>{submitError}</p> : null}

        <button
          type="submit"
          className={hubCrudStyles.submitBtn}
          disabled={saving || !roasterResolved || !roasterId}
        >
          {saving
            ? mode === 'create'
              ? 'Publishing…'
              : 'Saving…'
            : mode === 'create'
              ? 'Publish coffee + batch + QR'
              : 'Save coffee'}
        </button>
      </form>

      {mode === 'create' && publishPreview ? (
        <div className="mt-6 rounded border border-vs-border-default bg-vs-elevated p-4">
          <p className={`${hubCrudStyles.bodyStrong} mb-2`}>Publish complete</p>
          <p className={hubCrudStyles.bodyText}>
            <strong className={hubCrudStyles.bodyStrong}>Hash:</strong> {publishPreview.qr.hash}
          </p>
          <p className={`${hubCrudStyles.bodyText} break-all`}>
            <strong className={hubCrudStyles.bodyStrong}>Public URL:</strong> {publishPreview.qr.url}
          </p>
          {publishPreview.qr.svg ? (
            <div className="mt-3 space-y-3">
              <div
                className="max-w-[240px]"
                dangerouslySetInnerHTML={{ __html: publishPreview.qr.svg }}
              />
              <button
                type="button"
                className={hubCrudStyles.submitBtn}
                onClick={() => {
                  const blob = new Blob([publishPreview.qr.svg], { type: 'image/svg+xml' });
                  const href = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = href;
                  a.download = `batch-${publishPreview.batchId}.svg`;
                  a.click();
                  URL.revokeObjectURL(href);
                }}
              >
                Download SVG
              </button>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/roaster-hub/coffees/${publishPreview.coffeeId}/batches/${publishPreview.batchId}`}
              className={hubCrudStyles.actionLink}
            >
              Batch details
            </Link>
            <Link href={`/roaster-hub/analytics/${publishPreview.batchId}`} className={hubCrudStyles.actionLink}>
              Batch analytics
            </Link>
          </div>
        </div>
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
