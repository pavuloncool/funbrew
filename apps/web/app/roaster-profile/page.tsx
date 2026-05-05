'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useRoasterProfile } from '@/src/hooks/useRoasterProfile';
import {
  emptyRoasterProfileFormValues,
  isProfileComplete,
  profileToFormValues,
  type RoasterProfileFormValues,
} from '@/src/lib/roasterProfile';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';

import { roasterProfileStyles } from './roaster-profile.styles';

type Mode = 'create' | 'view' | 'edit';
type FormErrors = Partial<Record<keyof RoasterProfileFormValues, string>>;

const REQUIRED_FIELDS: Array<keyof RoasterProfileFormValues> = [
  'company_name',
  'roaster_short_name',
  'city',
];

function trimForm(values: RoasterProfileFormValues): RoasterProfileFormValues {
  return {
    company_name: values.company_name.trim(),
    roaster_short_name: values.roaster_short_name.trim(),
    country: values.country.trim(),
    city: values.city.trim(),
    description: values.description.trim(),
    website: values.website.trim(),
    logo_url: values.logo_url.trim(),
  };
}

function validateForm(values: RoasterProfileFormValues): FormErrors {
  const v = trimForm(values);
  const errors: FormErrors = {};

  REQUIRED_FIELDS.forEach((field) => {
    if (!v[field]) errors[field] = 'Pole wymagane.';
  });

  return errors;
}

export default function RoasterProfilePage() {
  const router = useRouter();
  const { loading, userId, profile, exists, complete, error: loadError, refresh } = useRoasterProfile();

  const [mode, setMode] = useState<Mode>('create');
  const [form, setForm] = useState<RoasterProfileFormValues>(emptyRoasterProfileFormValues());
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!userId) {
      router.replace('/login?next=/roaster-profile');
      return;
    }

    if (!exists || !profile) {
      setMode('create');
      setForm(emptyRoasterProfileFormValues());
      return;
    }

    setMode('view');
    setForm(profileToFormValues(profile));
  }, [exists, loading, profile, router, userId]);

  async function handleSave() {
    if (!userId) return;

    setSubmitError(null);
    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const values = trimForm(form);
    setSaving(true);

    const payload = {
      user_id: userId,
      name: values.company_name,
      company_name: values.company_name,
      roaster_short_name: values.roaster_short_name,
      country: values.country || null,
      city: values.city,
      description: values.description || null,
      website: values.website || null,
      logo_url: values.logo_url || null,
    };

    if (mode === 'create') {
      const { error } = await supabaseBrowser.from('roasters').insert(payload as never);
      if (error) {
        setSubmitError(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabaseBrowser.from('roasters').update(payload as never).eq('user_id', userId);
      if (error) {
        setSubmitError(error.message);
        setSaving(false);
        return;
      }
    }

    await refresh();
    setSaving(false);
    setMode('view');

    if (isProfileComplete(values)) {
      router.replace('/roaster-hub');
    }
  }

  function startEdit() {
    if (!profile) return;
    setForm(profileToFormValues(profile));
    setErrors({});
    setSubmitError(null);
    setMode('edit');
  }

  function cancelEdit() {
    if (!profile) return;
    setForm(profileToFormValues(profile));
    setErrors({});
    setSubmitError(null);
    setMode('view');
  }

  if (loading) {
    return (
      <div className={roasterProfileStyles.pageWithPad}>
        <div className={roasterProfileStyles.narrowContent}>
          <p className={roasterProfileStyles.mutedSmall}>Ładowanie profilu palarni…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={roasterProfileStyles.pageWithPad}>
        <div className={roasterProfileStyles.narrowContent}>
          <p className={roasterProfileStyles.errorSmall}>Błąd ładowania: {loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={roasterProfileStyles.pageWithPad}>
      <div className={roasterProfileStyles.narrowContentMain}>
        <h1 className={roasterProfileStyles.pageTitle}>Profil palarni</h1>
        <Link href="/roaster-hub" className={roasterProfileStyles.backToHub}>
          Wróć do Roaster Hub
        </Link>

        {mode === 'view' && profile ? (
          <div className={roasterProfileStyles.viewCard}>
            <p className={roasterProfileStyles.viewModeHint}>Tryb podglądu</p>
            <dl className={roasterProfileStyles.dlRoot}>
              <div>
                <dt className={roasterProfileStyles.dlTerm}>Nazwa firmy</dt>
                <dd>{profile.company_name ?? '—'}</dd>
              </div>
              <div>
                <dt className={roasterProfileStyles.dlTerm}>Nazwa skrócona</dt>
                <dd>{profile.roaster_short_name ?? '—'}</dd>
              </div>
              <div>
                <dt className={roasterProfileStyles.dlTerm}>Miasto</dt>
                <dd>{profile.city ?? '—'}</dd>
              </div>
              <div>
                <dt className={roasterProfileStyles.dlTerm}>Kraj</dt>
                <dd>{profile.country ?? '—'}</dd>
              </div>
              <div>
                <dt className={roasterProfileStyles.dlTerm}>Strona WWW</dt>
                <dd>{profile.website ?? '—'}</dd>
              </div>
              <div>
                <dt className={roasterProfileStyles.dlTerm}>Logo URL</dt>
                <dd>{profile.logo_url ?? '—'}</dd>
              </div>
              <div>
                <dt className={roasterProfileStyles.dlTerm}>Opis</dt>
                <dd>{profile.description ?? '—'}</dd>
              </div>
              <div>
                <dt className={roasterProfileStyles.dlTerm}>Weryfikacja</dt>
                <dd>{profile.verification_status ?? '—'}</dd>
              </div>
              <div>
                <dt className={roasterProfileStyles.dlTerm}>Subskrypcja</dt>
                <dd>{profile.subscription_status ?? 'placeholder'}</dd>
              </div>
            </dl>

            {!complete ? (
              <p className={roasterProfileStyles.incompleteBanner}>
                Profil niekompletny. Uzupełnij wszystkie wymagane pola, aby odblokować roaster hub.
              </p>
            ) : null}

            <button
              type="button"
              className={roasterProfileStyles.editCta}
              onClick={startEdit}
            >
              <span className={roasterProfileStyles.ctaText}>Edytuj dane</span>
            </button>
          </div>
        ) : (
          <form
            className={roasterProfileStyles.formCard}
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
            }}
          >
            <p className={roasterProfileStyles.formIntro}>{mode === 'create' ? 'Utwórz profil palarni' : 'Edytuj profil palarni'}</p>

            <Field
              label="Zarejestrowana nazwa firmy"
              value={form.company_name}
              onChange={(value) => setForm((prev) => ({ ...prev, company_name: value }))}
              error={errors.company_name}
              required
            />
            <Field
              label="Nazwa skrócona palarni"
              value={form.roaster_short_name}
              onChange={(value) => setForm((prev) => ({ ...prev, roaster_short_name: value }))}
              error={errors.roaster_short_name}
              required
            />
            <Field
              label="Miasto"
              value={form.city}
              onChange={(value) => setForm((prev) => ({ ...prev, city: value }))}
              error={errors.city}
              required
            />
            <Field
              label="Kraj (opcjonalnie, ale używany publicznie)"
              value={form.country}
              onChange={(value) => setForm((prev) => ({ ...prev, country: value }))}
              error={errors.country}
            />
            <Field
              label="Strona WWW (opcjonalnie)"
              value={form.website}
              onChange={(value) => setForm((prev) => ({ ...prev, website: value }))}
              error={errors.website}
            />
            <Field
              label="Logo URL (opcjonalnie)"
              value={form.logo_url}
              onChange={(value) => setForm((prev) => ({ ...prev, logo_url: value }))}
              error={errors.logo_url}
              placeholder="https://..."
            />
            <Field
              label="Opis palarni (opcjonalnie)"
              value={form.description}
              onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
              error={errors.description}
              multiline
            />

            {submitError ? <p className={roasterProfileStyles.submitError}>{submitError}</p> : null}

            <button
              type="submit"
              className={roasterProfileStyles.saveCta}
              disabled={saving}
            >
              <span className={roasterProfileStyles.ctaText}>{saving ? 'Zapisywanie…' : 'Zapisz dane'}</span>
            </button>

            {mode === 'edit' ? (
              <button
                type="button"
                className={roasterProfileStyles.cancelButton}
                onClick={cancelEdit}
              >
                Anuluj
              </button>
            ) : null}
          </form>
        )}
      </div>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
}) {
  const { label, value, onChange, error, placeholder, required, multiline } = props;

  return (
    <div className={roasterProfileStyles.fieldWrap}>
      <p className={roasterProfileStyles.fieldLabel}>
        {label}
        {required ? ' *' : ''}
      </p>
      {multiline ? (
        <textarea
          className={`${roasterProfileStyles.fieldInput} min-h-28 resize-y`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          className={roasterProfileStyles.fieldInput}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      )}
      {error ? <p className={roasterProfileStyles.fieldError}>{error}</p> : null}
    </div>
  );
}
