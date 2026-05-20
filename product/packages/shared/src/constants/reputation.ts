import { flavorNotes } from './flavorNotes';
import { reputationThresholds } from './reputationThresholds';

export type ReputationLevel = 'beginner' | 'advanced' | 'expert';

export const silentReputationUi = {
  showProgressBar: false,
  unlockMessage: null,
  notification: null,
} as const;

export function getReputationLevel(reputationScore: number): ReputationLevel {
  if (reputationScore >= reputationThresholds.advancedToExpert) return 'expert';
  if (reputationScore >= reputationThresholds.beginnerToAdvanced) return 'advanced';
  return 'beginner';
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
