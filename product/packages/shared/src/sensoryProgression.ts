import { getReputationLevel, getReputationLevelLabel, type ReputationLevel } from './constants/reputation';

export type SensoryUnlockLevel = ReputationLevel;

export type SensoryUnlockState = {
  score: number;
  level: ReputationLevel;
  levelLabel: string;
  unlockedNames: string[];
  lockedNames: string[];
  nextLevel: ReputationLevel | null;
  nextLevelLabel: string | null;
  unlockHint: string | null;
};

const BEGINNER_NOTES = [
  'berry',
  'chocolate',
  'caramel',
  'honey',
  'brown-sugar',
  'almond',
  'hazelnut',
  'cinnamon',
] as const;

const ADVANCED_NOTES = [
  ...BEGINNER_NOTES,
  'citrus',
  'stone-fruit',
] as const;

const EXPERT_NOTES = [
  ...ADVANCED_NOTES,
  'floral',
  'jasmine',
] as const;

export function normalizeTastingNoteName(name: string): string {
  return name.trim().toLowerCase().replace(/_/g, '-');
}

export function getUnlockedTastingNoteNames(level: ReputationLevel): string[] {
  if (level === 'expert') return [...EXPERT_NOTES];
  if (level === 'advanced') return [...ADVANCED_NOTES];
  return [...BEGINNER_NOTES];
}

export function getRequiredUnlockLevelForTastingNote(name: string): SensoryUnlockLevel {
  const normalized = normalizeTastingNoteName(name);
  if ((BEGINNER_NOTES as readonly string[]).includes(normalized)) return 'beginner';
  if ((ADVANCED_NOTES as readonly string[]).includes(normalized)) return 'advanced';
  return 'expert';
}

export function buildSensoryUnlockState(
  score: number,
  allTastingNoteNames: string[],
  effectiveLevel?: ReputationLevel
): SensoryUnlockState {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  const level = effectiveLevel ?? getReputationLevel(safeScore);
  const unlockedSet = new Set(getUnlockedTastingNoteNames(level));
  const normalizedNames = Array.from(new Set(allTastingNoteNames.map(normalizeTastingNoteName)));
  const unlockedNames = normalizedNames.filter((name) => unlockedSet.has(name));
  const lockedNames = normalizedNames.filter((name) => !unlockedSet.has(name));
  const nextLevel: ReputationLevel | null =
    level === 'beginner' ? 'advanced' : level === 'advanced' ? 'expert' : null;
  const nextLevelLabel = nextLevel ? getReputationLevelLabel(nextLevel) : null;

  let unlockHint: string | null = null;
  if (level === 'beginner') {
    unlockHint = 'Log more coffees to unlock citrus and stone fruit descriptors.';
  } else if (level === 'advanced') {
    unlockHint = 'Keep logging tastings to unlock floral and jasmine descriptors.';
  }

  return {
    score: safeScore,
    level,
    levelLabel: getReputationLevelLabel(level),
    unlockedNames,
    lockedNames,
    nextLevel,
    nextLevelLabel,
    unlockHint,
  };
}
