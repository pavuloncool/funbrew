type ProfileCompletionMetadata = {
  profile_completed?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Normalizes profile completion flag with legacy fallback:
 * - explicit boolean: use as-is
 * - missing / invalid value: treat as completed for legacy users
 */
export function resolveProfileCompleted(userMetadata: unknown): boolean {
  if (!isRecord(userMetadata)) {
    return true;
  }

  const metadata = userMetadata as ProfileCompletionMetadata;
  if (typeof metadata.profile_completed === 'boolean') {
    return metadata.profile_completed;
  }

  return true;
}

export function resolveProfileCompletedFromUser(user: { user_metadata?: unknown } | null | undefined): boolean {
  if (!user) {
    return true;
  }

  return resolveProfileCompleted(user.user_metadata);
}
