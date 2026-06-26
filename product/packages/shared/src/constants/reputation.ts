import { flavorNotes } from './flavorNotes';
import { reputationThresholds } from './reputationThresholds';

export type ReputationLevel = 'beginner' | 'advanced' | 'expert';

export type SensoryReputationState = {
  score: number;
  computedLevel: ReputationLevel;
  storedLevel: ReputationLevel;
  overrideLevel: ReputationLevel | null;
  effectiveLevel: ReputationLevel;
  isOverridden: boolean;
};

export const silentReputationUi = {
  showProgressBar: false,
  unlockMessage: null,
  notification: null,
} as const;

export function getReputationLevel(reputationScore: number): ReputationLevel {
  const safeScore = Number.isFinite(reputationScore) ? Math.max(0, Math.floor(reputationScore)) : 0;
  if (safeScore >= reputationThresholds.advancedToExpert) return 'expert';
  if (safeScore >= reputationThresholds.beginnerToAdvanced) return 'advanced';
  return 'beginner';
}

export function normalizeReputationScore(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
    return Math.floor(raw);
  }
  return 0;
}

export function normalizeReputationLevel(raw: unknown): ReputationLevel {
  if (raw === 'advanced' || raw === 'expert') return raw;
  return 'beginner';
}

export function normalizeOptionalReputationLevel(raw: unknown): ReputationLevel | null {
  if (raw === 'beginner' || raw === 'advanced' || raw === 'expert') return raw;
  return null;
}

export function resolveSensoryReputation(params: {
  sensoryScore: unknown;
  sensoryLevel?: unknown;
  sensoryLevelOverride?: unknown;
}): SensoryReputationState {
  const score = normalizeReputationScore(params.sensoryScore);
  const computedLevel = getReputationLevel(score);
  const storedLevel = normalizeReputationLevel(params.sensoryLevel ?? computedLevel);
  const overrideLevel = normalizeOptionalReputationLevel(params.sensoryLevelOverride);
  const effectiveLevel = overrideLevel ?? computedLevel;

  return {
    score,
    computedLevel,
    storedLevel,
    overrideLevel,
    effectiveLevel,
    isOverridden: overrideLevel !== null,
  };
}

export function getFlavorNotesForReputation(reputationScore: number) {
  const level = getReputationLevel(reputationScore);
  const beginnerCount = 12;
  const advancedCount = 24;

  if (level === 'expert') return flavorNotes;
  if (level === 'advanced') return flavorNotes.slice(0, advancedCount);
  return flavorNotes.slice(0, beginnerCount);
}

export function getReputationLevelLabel(level: ReputationLevel): string {
  if (level === 'expert') return 'Expert';
  if (level === 'advanced') return 'Advanced';
  return 'Beginner';
}

export function hasExpertBadge(reputationScore: number): boolean {
  return getReputationLevel(reputationScore) === 'expert';
}
