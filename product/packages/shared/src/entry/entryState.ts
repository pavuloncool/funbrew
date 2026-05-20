export const ENTRY_SPLASH_PHASES = [
  'entry.white',
  'entry.fingerprint',
  'entry.tap',
  'entry.confetti',
  'entry.beanRise',
  'entry.beanDissolve',
  'entry.mainReveal',
] as const;

export type EntrySplashPhase = (typeof ENTRY_SPLASH_PHASES)[number];

export type EntrySplashPhaseOrFallback = EntrySplashPhase | 'errorFallback';

export type EntryShellStatus = 'bootstrapping' | 'locked' | 'unauthenticated' | 'authenticated';

export const entryStateContract = {
  splashComplete: false,
  minDisplayMs: 400,
  sessionRule: 'per-process-start',
} as const;

export function isEntrySplashPhase(value: string): value is EntrySplashPhase {
  return (ENTRY_SPLASH_PHASES as readonly string[]).includes(value);
}

export function resolvePostEntryHref(params: {
  status: EntryShellStatus;
  profileCompleted: boolean;
}): '/(auth)/login' | '/(auth)/complete-profile' | '/(tabs)/hub' | null {
  if (params.status === 'bootstrapping') {
    return null;
  }

  if (params.status === 'locked' || params.status === 'unauthenticated') {
    return '/(auth)/login';
  }

  return params.profileCompleted ? '/(tabs)/hub' : '/(auth)/complete-profile';
}
