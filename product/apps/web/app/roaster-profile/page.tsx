'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CoffeeLabelUploadField } from '@/src/components/ui/coffee-label-upload-field';
import { useRoasterProfile } from '@/src/hooks/useRoasterProfile';
import {
  emptyRoasterProfileFormValues,
  isProfileComplete,
  profileToFormValues,
  type RoasterProfileFormValues,
} from '@/src/lib/roasterProfile';
import { supabaseBrowser } from '@/src/lib/supabase/browserClient';
import { uploadCoffeeLabelToSupabase } from '@/src/lib/uploadCoffeeLabel';

import { hubCrudStyles } from '../roaster-hub/hub-crud.styles';
import { roasterProfileStyles } from './roaster-profile.styles';

type Mode = 'create' | 'view' | 'edit';
type FormErrors = Partial<Record<keyof RoasterProfileFormValues, string>>;
type PasswordFormState = {
  password: string;
  confirmPassword: string;
};

const REQUIRED_FIELDS: Array<keyof RoasterProfileFormValues> = [
  'company_name',
  'roaster_short_name',
  'city',
];
const MIN_PASSWORD_LENGTH = 8;
const INITIAL_PASSWORD_FORM: PasswordFormState = {
  password: '',
  confirmPassword: '',
};

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

function toUserMetadataObject(userMetadata: unknown): Record<string, unknown> {
  if (!userMetadata || typeof userMetadata !== 'object' || Array.isArray(userMetadata)) {
    return {};
  }

  return userMetadata as Record<string, unknown>;
}

export default function RoasterProfilePage() {
  const router = useRouter();
  const {
    loading,
    userId,
    userMetadata,
    profile,
    exists,
    complete,
    requiresPasswordChange,
    error: loadError,
    refresh,
  } = useRoasterProfile();

  const [mode, setMode] = useState<Mode>('create');
  const [form, setForm] = useState<RoasterProfileFormValues>(emptyRoasterProfileFormValues());
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | undefined>(undefined);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(INITIAL_PASSWORD_FORM);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const onboardingMode = requiresPasswordChange || passwordUpdated;
  const profileLocked = onboardingMode && !passwordUpdated;

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

    setForm(profileToFormValues(profile));

    if (onboardingMode) {
      setMode(complete ? 'view' : 'edit');
      return;
    }

    setMode('view');
  }, [complete, exists, loading, onboardingMode, profile, router, userId]);

  async function handlePasswordSetup() {
    const nextPassword = passwordForm.password.trim();
    const nextConfirmPassword = passwordForm.confirmPassword.trim();

    setPasswordError(null);
    setPasswordSuccess(null);

    if (nextPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (nextPassword !== nextConfirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordSaving(true);

    const { error } = await supabaseBrowser.auth.updateUser({
      password: nextPassword,
      data: {
        ...toUserMetadataObject(userMetadata),
        must_change_password: false,
      },
    });

    if (error) {
      setPasswordError(error.message);
      setPasswordSaving(false);
      return;
    }

    const profileAlreadyComplete = exists && complete;

    await refresh();
    setPasswordSaving(false);
    setPasswordUpdated(true);
    setPasswordForm(INITIAL_PASSWORD_FORM);
    setPasswordSuccess('Password updated. Continue with your roaster profile setup.');

    if (profileAlreadyComplete) {
      router.replace('/roaster-hub');
    }
  }

  async function handleSave() {
    if (!userId || profileLocked) return;

    setSubmitError(null);
    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const values = trimForm(form);
    const shouldRedirectToHubAfterSave = onboardingMode || mode === 'create';
    setSaving(true);
    let nextLogoUrl = values.logo_url;

    if (logoFile) {
      if (!values.roaster_short_name) {
        setSubmitError('Set the roaster short name before uploading a logo.');
        setSaving(false);
        return;
      }

      nextLogoUrl = await uploadCoffeeLabelToSupabase(
        supabaseBrowser,
        logoFile,
        values.roaster_short_name
      );
    }

    const payload = {
      user_id: userId,
      name: values.company_name,
      company_name: values.company_name,
      roaster_short_name: values.roaster_short_name,
      country: values.country || null,
      city: values.city,
      description: values.description || null,
      website: values.website || null,
      logo_url: nextLogoUrl || null,
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
    setLogoFile(undefined);
    setMode('view');
    setPasswordUpdated(false);

    if (shouldRedirectToHubAfterSave && isProfileComplete(values)) {
      router.replace('/roaster-hub');
    }
  }

  function startEdit() {
    if (!profile) return;
    setForm(profileToFormValues(profile));
    setErrors({});
    setSubmitError(null);
    setLogoFile(undefined);
    setMode('edit');
  }

  function cancelEdit() {
    if (!profile) return;
    setForm(profileToFormValues(profile));
    setErrors({});
    setSubmitError(null);
    setLogoFile(undefined);
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
        {!onboardingMode ? (
          <p className="mb-4">
            <Link href="/roaster-hub" className={hubCrudStyles.navBack}>
              ← Roaster Hub
            </Link>
          </p>
        ) : null}
        <h1 className={hubCrudStyles.pageHeading}>Roaster Profile</h1>

        {onboardingMode ? (
          <section className={roasterProfileStyles.onboardingCard}>
            <p className={roasterProfileStyles.onboardingEyebrow}>Roaster onboarding</p>
            <h2 className={roasterProfileStyles.onboardingTitle}>Set a new password to activate your account</h2>
            <p className={roasterProfileStyles.onboardingBody}>
              Support created this roaster account with a temporary password. Set your permanent
              password first, then complete your roaster profile to continue to Roaster Hub.
            </p>
            <p className={roasterProfileStyles.onboardingNote}>
              {profileLocked
                ? 'Your roaster profile stays locked until the password update succeeds.'
                : 'Password updated. You can now finish your roaster profile.'}
            </p>

            <form
              className="mt-6 max-w-[520px]"
              onSubmit={(event) => {
                event.preventDefault();
                void handlePasswordSetup();
              }}
            >
              <Field
                label="New password"
                value={passwordForm.password}
                onChange={(value) => setPasswordForm((prev) => ({ ...prev, password: value }))}
                placeholder="At least 8 characters"
                type="password"
                disabled={passwordUpdated || passwordSaving}
              />
              <Field
                label="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={(value) =>
                  setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))
                }
                type="password"
                disabled={passwordUpdated || passwordSaving}
              />

              {passwordError ? (
                <p className={roasterProfileStyles.submitError}>{passwordError}</p>
              ) : null}
              {passwordSuccess ? (
                <p className={roasterProfileStyles.successSmall}>{passwordSuccess}</p>
              ) : null}

              <button
                type="submit"
                className={roasterProfileStyles.saveCta}
                disabled={passwordUpdated || passwordSaving}
              >
                {passwordSaving ? 'Updating password…' : 'Set password'}
              </button>
            </form>
          </section>
        ) : null}

        {mode === 'view' && profile ? (
          <div className={roasterProfileStyles.viewCard}>
            <p className={roasterProfileStyles.viewModeHint}>Account info</p>
            <dl className={roasterProfileStyles.dlRoot}>
              <div>
                <dt className={roasterProfileStyles.dlTerm}>Account No.</dt>
                <dd className={roasterProfileStyles.definitionValue}>
                  {profile.customer_number ?? '—'}
                </dd>
              </div>
              <div>
                <dt className={roasterProfileStyles.dlTerm}>Company Name</dt>
                <dd className={roasterProfileStyles.definitionValue}>
                  {profile.company_name ?? '—'}
                </dd>
              </div>
              <div>
                <dt className={roasterProfileStyles.dlTerm}>Short Name</dt>
                <dd className={roasterProfileStyles.definitionValue}>
                  {profile.roaster_short_name ?? '—'}
                </dd>
              </div>
              <div>
                <dt className={roasterProfileStyles.dlTerm}>City</dt>
                <dd className={roasterProfileStyles.definitionValue}>{profile.city ?? '—'}</dd>
              </div>
              <div>
                <dt className={roasterProfileStyles.dlTerm}>Country</dt>
                <dd className={roasterProfileStyles.definitionValue}>{profile.country ?? '—'}</dd>
              </div>
              <div>
                <dt className={roasterProfileStyles.dlTerm}>Website</dt>
                <dd className={roasterProfileStyles.definitionValue}>{profile.website ?? '—'}</dd>
              </div>
              <div>
                <dt className={roasterProfileStyles.dlTerm}>Logo</dt>
                <dd className={roasterProfileStyles.definitionValue}>
                  {profile.logo_url ? (
                    <div className={roasterProfileStyles.logoPreviewFrame}>
                      <img
                        src={profile.logo_url}
                        alt={`${profile.company_name ?? profile.roaster_short_name ?? 'Roaster'} logo`}
                        className={roasterProfileStyles.logoPreviewImage}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={hubCrudStyles.actionLink}
                      onClick={startEdit}
                      disabled={profileLocked}
                    >
                      Upload logo (jpg/png)
                    </button>
                  )}
                </dd>
              </div>
              <div>
                <dt className={roasterProfileStyles.dlTerm}>Description</dt>
                <dd className={roasterProfileStyles.definitionValue}>
                  {profile.description ?? '—'}
                </dd>
              </div>
              <div>
                <dt className={roasterProfileStyles.dlTerm}>Verification</dt>
                <dd className={roasterProfileStyles.definitionValue}>
                  {profile.verification_status ?? '—'}
                </dd>
              </div>
              <div>
                <dt className={roasterProfileStyles.dlTerm}>Subscription</dt>
                <dd className={roasterProfileStyles.definitionValue}>
                  {profile.subscription_status ?? 'placeholder'}
                </dd>
              </div>
            </dl>

            {!complete ? (
              <p className={roasterProfileStyles.incompleteBanner}>
                Profile incomplete. Fill in all required fields to unlock the Roaster Hub.
              </p>
            ) : null}

            <button
              type="button"
              className={roasterProfileStyles.editCta}
              onClick={startEdit}
              disabled={profileLocked}
            >
              Edit Roaster Profile
            </button>
          </div>
        ) : (
          <form
            className={`${roasterProfileStyles.formCard} ${
              profileLocked ? roasterProfileStyles.formCardLocked : ''
            }`}
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
            }}
          >
            <p className={roasterProfileStyles.formIntro}>
              {mode === 'create' ? 'Create Roaster Profile' : 'Edit Roaster Profile'}
            </p>

            <Field
              label="Registered Roaster Name"
              value={form.company_name}
              onChange={(value) => setForm((prev) => ({ ...prev, company_name: value }))}
              error={errors.company_name}
              required
              disabled={profileLocked || saving}
            />
            <Field
              label="Displayed Roaster Name"
              value={form.roaster_short_name}
              onChange={(value) => setForm((prev) => ({ ...prev, roaster_short_name: value }))}
              error={errors.roaster_short_name}
              required
              disabled={profileLocked || saving}
            />
            <Field
              label="City"
              value={form.city}
              onChange={(value) => setForm((prev) => ({ ...prev, city: value }))}
              error={errors.city}
              required
              disabled={profileLocked || saving}
            />
            <Field
              label="Country"
              value={form.country}
              onChange={(value) => setForm((prev) => ({ ...prev, country: value }))}
              error={errors.country}
              required
              disabled={profileLocked || saving}
            />
            <Field
              label="Website (optional)"
              value={form.website}
              onChange={(value) => setForm((prev) => ({ ...prev, website: value }))}
              error={errors.website}
              disabled={profileLocked || saving}
            />
            <div className={roasterProfileStyles.fieldWrap}>
              <p className={roasterProfileStyles.fieldLabel}>Company logo (jpg/png)</p>
              <CoffeeLabelUploadField
                file={logoFile}
                onFileChange={setLogoFile}
                acceptedFileTypes={['image/jpeg', 'image/png']}
                className={roasterProfileStyles.uploadFieldWrap}
                labelIdle='Drag logo here or <span class="filepond--label-action">browse</span>'
                testId="roaster-logo-upload"
                disabled={profileLocked || saving}
              />
              {form.logo_url ? (
                <span className={roasterProfileStyles.logoHelp}>
                  Current logo exists. Uploading a new file will replace it on save.
                </span>
              ) : (
                <span className={roasterProfileStyles.logoHelp}>
                  Upload a JPG or PNG logo. The logo will be saved when you submit the profile.
                </span>
              )}
              {form.logo_url ? (
                <div className={roasterProfileStyles.logoPreviewFrame}>
                  <img
                    src={form.logo_url}
                    alt="Current roaster logo"
                    className={roasterProfileStyles.logoPreviewImage}
                  />
                </div>
              ) : null}
            </div>
            <Field
              label="Roaster Description (optional)"
              value={form.description}
              onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
              error={errors.description}
              multiline
              disabled={profileLocked || saving}
            />

            {submitError ? <p className={roasterProfileStyles.submitError}>{submitError}</p> : null}

            <button
              type="submit"
              className={roasterProfileStyles.formActionPrimary}
              disabled={saving || profileLocked}
            >
              {saving ? 'Saving... ' : 'Save Roaster Profile'}
            </button>

            {mode === 'edit' ? (
              <button
                type="button"
                className={roasterProfileStyles.formActionSecondary}
                onClick={cancelEdit}
                disabled={saving || profileLocked}
              >
                Cancel
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
  type?: 'text' | 'password';
  disabled?: boolean;
}) {
  const { label, value, onChange, error, placeholder, required, multiline, type, disabled } = props;
  const inputClassName = `${roasterProfileStyles.fieldInput} ${
    disabled ? roasterProfileStyles.fieldInputDisabled : ''
  }`;

  return (
    <div className={roasterProfileStyles.fieldWrap}>
      <p className={roasterProfileStyles.fieldLabel}>
        {label}
        {required ? ' *' : ''}
      </p>
      {multiline ? (
        <textarea
          className={`${inputClassName} min-h-28 resize-y`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
      ) : (
        <input
          className={inputClassName}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type ?? 'text'}
          disabled={disabled}
        />
      )}
      {error ? <p className={roasterProfileStyles.fieldError}>{error}</p> : null}
    </div>
  );
}
