export type RoasterProfile = {
  id: string;
  user_id: string;
  customer_number: string | null;
  company_name: string | null;
  roaster_short_name: string | null;
  country: string | null;
  city: string | null;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  subscription_status: string | null;
  verification_status: string | null;
};

export type RoasterProfileFormValues = {
  company_name: string;
  roaster_short_name: string;
  country: string;
  city: string;
  description: string;
  website: string;
  logo_url: string;
};

const REQUIRED_FIELDS: Array<keyof RoasterProfileFormValues> = [
  'company_name',
  'roaster_short_name',
  'city',
];

export function emptyRoasterProfileFormValues(): RoasterProfileFormValues {
  return {
    company_name: '',
    roaster_short_name: '',
    country: '',
    city: '',
    description: '',
    website: '',
    logo_url: '',
  };
}

function isNonEmpty(value: string | null | undefined): boolean {
  return Boolean(value && value.trim());
}

export function isProfileComplete(profile: Partial<RoasterProfile> | null | undefined): boolean {
  if (!profile) return false;

  return REQUIRED_FIELDS.every((field) => {
    const value = profile[field as keyof RoasterProfile];
    return typeof value === 'string' ? isNonEmpty(value) : false;
  });
}

function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function normalizeRoasterProfileRow(row: unknown): RoasterProfile | null {
  if (!row || typeof row !== 'object') return null;
  const value = row as Record<string, unknown>;

  if (typeof value.id !== 'string' || typeof value.user_id !== 'string') {
    return null;
  }

  return {
    id: value.id,
    user_id: value.user_id,
    customer_number: normalizeNullableString(value.customer_number),
    company_name: normalizeNullableString(value.company_name),
    roaster_short_name: normalizeNullableString(value.roaster_short_name),
    country: normalizeNullableString(value.country),
    city: normalizeNullableString(value.city),
    description: normalizeNullableString(value.description),
    website: normalizeNullableString(value.website),
    logo_url: normalizeNullableString(value.logo_url),
    subscription_status: normalizeNullableString(value.subscription_status),
    verification_status: normalizeNullableString(value.verification_status),
  };
}

export function profileToFormValues(profile: RoasterProfile): RoasterProfileFormValues {
  return {
    company_name: profile.company_name ?? '',
    roaster_short_name: profile.roaster_short_name ?? '',
    country: profile.country ?? '',
    city: profile.city ?? '',
    description: profile.description ?? '',
    website: profile.website ?? '',
    logo_url: profile.logo_url ?? '',
  };
}
