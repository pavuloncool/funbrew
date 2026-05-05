export type RoasterProfile = {
  id: string;
  user_id: string;
  company_name: string | null;
  roaster_short_name: string | null;
  city: string | null;
  website: string | null;
  subscription_status: string | null;
};

export type RoasterProfileFormValues = {
  company_name: string;
  roaster_short_name: string;
  city: string;
  website: string;
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
    city: '',
    website: '',
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
    company_name: normalizeNullableString(value.company_name),
    roaster_short_name: normalizeNullableString(value.roaster_short_name),
    city: normalizeNullableString(value.city),
    website: normalizeNullableString(value.website),
    subscription_status: normalizeNullableString(value.subscription_status),
  };
}

export function profileToFormValues(profile: RoasterProfile): RoasterProfileFormValues {
  return {
    company_name: profile.company_name ?? '',
    roaster_short_name: profile.roaster_short_name ?? '',
    city: profile.city ?? '',
    website: profile.website ?? '',
  };
}
