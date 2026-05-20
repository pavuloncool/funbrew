import { describe, expect, it } from 'vitest';

import { resolveProfileCompleted, resolveProfileCompletedFromUser } from './profileCompletion';

describe('resolveProfileCompleted', () => {
  it('returns explicit boolean values as-is', () => {
    expect(resolveProfileCompleted({ profile_completed: true })).toBe(true);
    expect(resolveProfileCompleted({ profile_completed: false })).toBe(false);
  });

  it('falls back to true for missing and invalid values', () => {
    expect(resolveProfileCompleted(undefined)).toBe(true);
    expect(resolveProfileCompleted(null)).toBe(true);
    expect(resolveProfileCompleted({})).toBe(true);
    expect(resolveProfileCompleted({ profile_completed: 'false' })).toBe(true);
    expect(resolveProfileCompleted({ profile_completed: 0 })).toBe(true);
  });
});

describe('resolveProfileCompletedFromUser', () => {
  it('treats legacy user without flag as completed', () => {
    const legacyUser = { user_metadata: { display_name: 'Legacy' } };
    expect(resolveProfileCompletedFromUser(legacyUser)).toBe(true);
  });

  it('keeps onboarding flow when flag is explicitly false', () => {
    const onboardingUser = { user_metadata: { profile_completed: false } };
    expect(resolveProfileCompletedFromUser(onboardingUser)).toBe(false);
  });
});
