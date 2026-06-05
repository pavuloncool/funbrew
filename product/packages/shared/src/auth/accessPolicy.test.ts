import { describe, expect, it } from 'vitest';

import {
  buildWebLoginRedirectTarget,
  canAccessSurface,
  getDeniedAccessReason,
  getMobileLoginReasonMessage,
  getWebLoginReasonMessage,
  resolveMobileAuthenticatedPath,
  resolveWebAuthenticatedPath,
  resolveWebPostLoginPath,
  ROASTER_ONBOARDING_PATH,
  shouldRedirectRoasterToOnboarding,
} from './accessPolicy';

describe('accessPolicy', () => {
  it('keeps roaster access on web and consumer access on mobile', () => {
    expect(canAccessSurface('roaster', 'web_roaster')).toBe(true);
    expect(canAccessSurface('consumer', 'web_roaster')).toBe(false);
    expect(canAccessSurface('consumer', 'consumer_mobile')).toBe(true);
    expect(canAccessSurface('roaster', 'consumer_mobile')).toBe(false);
  });

  it('returns canonical denied-access reasons per surface', () => {
    expect(getDeniedAccessReason('web_roaster')).toBe('consumer_mobile_only');
    expect(getDeniedAccessReason('consumer_mobile')).toBe('roaster_web_only');
  });

  it('sanitizes unsafe and auth-looping web next params', () => {
    expect(resolveWebPostLoginPath(null)).toBe('/roaster-hub');
    expect(resolveWebPostLoginPath('https://evil.example')).toBe('/roaster-hub');
    expect(resolveWebPostLoginPath('//evil.example')).toBe('/roaster-hub');
    expect(resolveWebPostLoginPath('/login?next=%2Froaster-hub')).toBe('/roaster-hub');
    expect(resolveWebPostLoginPath('/roaster-hub/analytics/123')).toBe('/roaster-hub/analytics/123');
  });

  it('builds canonical roaster login redirect targets', () => {
    expect(buildWebLoginRedirectTarget('/roaster-hub', 'tab=analytics')).toBe(
      '/login?reason=roaster_auth_required&next=%2Froaster-hub%3Ftab%3Danalytics'
    );
  });

  it('resolves post-login paths and copy from shared policy', () => {
    expect(resolveMobileAuthenticatedPath(true)).toBe('/(tabs)/hub');
    expect(resolveMobileAuthenticatedPath(false)).toBe('/(auth)/complete-profile');
    expect(resolveWebAuthenticatedPath('/roaster-hub', { must_change_password: true })).toBe(
      ROASTER_ONBOARDING_PATH
    );
    expect(resolveWebAuthenticatedPath('/roaster-hub', { must_change_password: false })).toBe(
      '/roaster-hub'
    );
    expect(shouldRedirectRoasterToOnboarding('/roaster-hub', { must_change_password: true })).toBe(
      true
    );
    expect(
      shouldRedirectRoasterToOnboarding('/roaster-profile', { must_change_password: true })
    ).toBe(false);
    expect(getWebLoginReasonMessage('roaster_auth_required')).toContain('Zaloguj');
    expect(getWebLoginReasonMessage('consumer_mobile_only')).toContain('mobile app only');
    expect(getMobileLoginReasonMessage('roaster_web_only')).toContain('aplikacji web');
    expect(getMobileLoginReasonMessage('session_expired')).toContain('Twoja sesja wygasła');
  });
});
