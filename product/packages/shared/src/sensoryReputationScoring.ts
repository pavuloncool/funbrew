import { getRequiredUnlockLevelForTastingNote, normalizeTastingNoteName } from './sensoryProgression';

export type SensoryReputationScoringNote = {
  name: string;
  label?: string | null;
};

export type SensoryReputationScoringLog = {
  batchId?: string | null;
  rating: number | null;
  brewMethodId?: string | null;
  freeTextNotes?: string | null;
  review?: string | null;
  tastingNotes?: SensoryReputationScoringNote[];
  hasCompleteSensoryCore?: boolean;
};

export type SensoryReputationScoreBreakdown = {
  scanActivity: number;
  tastingLogs: number;
  structuredConsistency: number;
  dictionaryLearning: number;
  textFields: number;
  total: number;
};

function normalizeSearchText(value: string | null | undefined): string {
  return ` ${value ?? ''} `.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function containsTastingNote(text: string, note: SensoryReputationScoringNote): boolean {
  const candidates = [note.name, note.label]
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeSearchText(value).trim())
    .filter(Boolean);

  return candidates.some((candidate) => text.includes(` ${candidate} `));
}

export function calculateFairSensoryReputationScore(
  logs: SensoryReputationScoringLog[],
  dictionaryNotes: SensoryReputationScoringNote[] = []
): SensoryReputationScoreBreakdown {
  const uniqueBatches = new Set<string>();
  const usedNoteNames = new Set<string>();
  const usedLevels = new Set<string>();
  let tastingLogs = 0;
  let completeStructuredLogs = 0;
  let textFields = 0;

  for (const log of logs) {
    if (log.batchId) uniqueBatches.add(log.batchId);
    if (typeof log.rating === 'number') tastingLogs += 2;
    if (log.brewMethodId) tastingLogs += 1;

    const explicitNoteNames = new Set(
      (log.tastingNotes ?? []).map((note) => normalizeTastingNoteName(note.name))
    );
    const noteCount = explicitNoteNames.size;
    if (noteCount >= 1) tastingLogs += 1;
    if (noteCount >= 3) tastingLogs += 1;
    if (log.hasCompleteSensoryCore) tastingLogs += 1;

    if (typeof log.rating === 'number' && log.brewMethodId && noteCount >= 1) {
      completeStructuredLogs += 1;
    }

    const freeText = log.freeTextNotes?.trim() ?? '';
    const review = log.review?.trim() ?? '';
    if (freeText.length >= 20 || review.length >= 20) {
      textFields += 1;
    }

    for (const noteName of explicitNoteNames) {
      usedNoteNames.add(noteName);
    }

    const searchableText = normalizeSearchText(`${freeText} ${review}`);
    if (searchableText.trim()) {
      for (const note of dictionaryNotes) {
        if (containsTastingNote(searchableText, note)) {
          usedNoteNames.add(normalizeTastingNoteName(note.name));
        }
      }
    }
  }

  for (const noteName of usedNoteNames) {
    usedLevels.add(getRequiredUnlockLevelForTastingNote(noteName));
  }

  const scanActivity = uniqueBatches.size;
  const structuredConsistency = Math.floor(completeStructuredLogs / 5) * 3;
  const dictionaryLearning = usedNoteNames.size + usedLevels.size * 2;
  const total = scanActivity + tastingLogs + structuredConsistency + dictionaryLearning + textFields;

  return {
    scanActivity,
    tastingLogs,
    structuredConsistency,
    dictionaryLearning,
    textFields,
    total,
  };
}
