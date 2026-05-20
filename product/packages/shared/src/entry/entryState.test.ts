import { describe, expect, it } from 'vitest';

import {
  ENTRY_SPLASH_PHASES,
  entryStateContract,
  isEntrySplashPhase,
  resolvePostEntryHref,
} from './entryState';

describe('entryState', () => {
  it('keeps the FR-012 beat order stable', () => {
    expect(ENTRY_SPLASH_PHASES).toEqual([
      'entry.white',
      'entry.fingerprint',
      'entry.tap',
      'entry.confetti',
      'entry.beanRise',
      'entry.beanDissolve',
      'entry.mainReveal',
    ]);
  });

  it('exposes the session rule and minimum display contract', () => {
    expect(entryStateContract.minDisplayMs).toBe(400);
    expect(entryStateContract.sessionRule).toBe('per-process-start');
    expect(entryStateContract.splashComplete).toBe(false);
  });

  it('resolves post-entry routes from auth state', () => {
    expect(resolvePostEntryHref({ status: 'bootstrapping', profileCompleted: false })).toBeNull();
    expect(resolvePostEntryHref({ status: 'unauthenticated', profileCompleted: false })).toBe('/(auth)/login');
    expect(resolvePostEntryHref({ status: 'locked', profileCompleted: true })).toBe('/(auth)/login');
    expect(resolvePostEntryHref({ status: 'authenticated', profileCompleted: false })).toBe('/(auth)/complete-profile');
    expect(resolvePostEntryHref({ status: 'authenticated', profileCompleted: true })).toBe('/(tabs)/hub');
  });

  it('recognizes only declared FR-012 phases', () => {
    expect(isEntrySplashPhase('entry.tap')).toBe(true);
    expect(isEntrySplashPhase('entry.unknown')).toBe(false);
  });
});
