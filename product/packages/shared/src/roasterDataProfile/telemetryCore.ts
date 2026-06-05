export type RoasterExperienceLevel = 'beginner' | 'advanced' | 'expert';

export type RepurchaseIntent = 'yes' | 'no' | 'unsure';

export type RoasterTelemetryCoreInput = {
  brewMethodId: string;
  overallRating: number;
  sensoryAcidity: number;
  sensorySweetness: number;
  sensoryBody: number;
  sensoryBitter: number;
  sensoryAftertaste: number;
  repurchaseIntent: RepurchaseIntent;
  experienceLevel: RoasterExperienceLevel;
};

export type RoasterTelemetryCoreRecord = RoasterTelemetryCoreInput & {
  coffeeLogId: string;
  createdAt: string;
  updatedAt: string;
};

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 1;
  if (value < 1) return 1;
  if (value > 5) return 5;
  return Math.round(value);
}

export function normalizeRoasterTelemetryCoreInput(
  input: RoasterTelemetryCoreInput
): RoasterTelemetryCoreInput {
  return {
    brewMethodId: input.brewMethodId,
    overallRating: clampScore(input.overallRating),
    sensoryAcidity: clampScore(input.sensoryAcidity),
    sensorySweetness: clampScore(input.sensorySweetness),
    sensoryBody: clampScore(input.sensoryBody),
    sensoryBitter: clampScore(input.sensoryBitter),
    sensoryAftertaste: clampScore(input.sensoryAftertaste),
    repurchaseIntent: input.repurchaseIntent,
    experienceLevel: input.experienceLevel,
  };
}

export function labelRepurchaseIntent(intent: RepurchaseIntent): string {
  if (intent === 'yes') return 'Would buy again';
  if (intent === 'no') return 'Would not buy again';
  return 'Not sure yet';
}

export function isRoasterExperienceLevel(value: unknown): value is RoasterExperienceLevel {
  return value === 'beginner' || value === 'advanced' || value === 'expert';
}
