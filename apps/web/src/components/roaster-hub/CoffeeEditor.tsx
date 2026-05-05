'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState, type HTMLAttributes } from 'react';

import {
  getBrowserSessionSafely,
  getBrowserUserSafely,
} from '@/src/lib/supabase/browserAuth';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';
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
  const [status, setStatus] = useState<string>('active');
  const [originId, setOriginId] = useState<string | null>(null);

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
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (roasterError) {
        setSubmitError(roasterError.message);
        setLoading(false);
        return;
      }

      const roasterRow = roaster as { id: string } | null;
      setRoasterId(roasterRow?.id ?? null);

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

    setSaving(true);

    try {
      const originPayload = normalizeOriginPayload(values);
      const session = await getBrowserSessionSafely();
      if (!session?.access_token) {
        throw new Error('Missing auth session.');
      }
      const coffeePayload = normalizeCoffeePayload({
        roasterId,
        originId,
        values,
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
        router.push(`/roaster-hub/coffees/${saved.id}`);
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

      {!roasterId ? (
        <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-neutral-900">
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
        <Field
          label="Cover image URL"
          value={values.coverImageUrl}
          onChange={(value) => setValues((prev) => ({ ...prev, coverImageUrl: value }))}
          placeholder="https://..."
        />
        <TextAreaField
          label="Producer notes"
          value={values.producerNotes}
          onChange={(value) => setValues((prev) => ({ ...prev, producerNotes: value }))}
          placeholder="What should the consumer know about this coffee?"
        />

        <hr className="my-2 border-neutral-300" />

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
          disabled={saving || !roasterId}
        >
          {saving
            ? mode === 'create'
              ? 'Creating…'
              : 'Saving…'
            : mode === 'create'
              ? 'Create coffee'
              : 'Save coffee'}
        </button>
      </form>

      {mode === 'edit' && coffeeId ? (
        <p className={hubCrudStyles.inlineGapTop}>
          <Link
            href={`/roaster-hub/coffees/${coffeeId}/batches/new`}
            className={hubCrudStyles.actionLink}
          >
            + Create batch for this coffee
          </Link>
        </p>
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
