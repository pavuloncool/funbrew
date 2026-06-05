export const PROCESSING_METHOD_OPTIONS = [
  { value: 'washed', label: 'Washed' },
  { value: 'natural', label: 'Natural' },
  { value: 'honey', label: 'Honey' },
  { value: 'anaerobic', label: 'Anaerobic' },
  { value: 'wet-hulled', label: 'Wet-hulled' },
  { value: 'other', label: 'Other' },
] as const;

export type CanonicalCoffeeFormValues = {
  name: string;
  variety: string;
  processingMethod: string;
  producerNotes: string;
  coverImageUrl: string;
  originCountry: string;
  originRegion: string;
  originFarm: string;
  originProducer: string;
  originAltitudeMin: string;
  originAltitudeMax: string;
};

export type CanonicalCoffeeRecord = {
  id: string;
  name: string;
  variety: string | null;
  processing_method: string | null;
  producer_notes: string | null;
  cover_image_url: string | null;
  origin_id: string | null;
  origins?: {
    country: string | null;
    region: string | null;
    farm: string | null;
    producer: string | null;
    altitude_min: number | null;
    altitude_max: number | null;
  } | null;
};

export type CanonicalBatchFormValues = {
  lotNumber: string;
  roastDate: string;
  brewingNotes: string;
  roasterStory: string;
};

export function emptyCanonicalCoffeeFormValues(): CanonicalCoffeeFormValues {
  return {
    name: '',
    variety: '',
    processingMethod: '',
    producerNotes: '',
    coverImageUrl: '',
    originCountry: '',
    originRegion: '',
    originFarm: '',
    originProducer: '',
    originAltitudeMin: '',
    originAltitudeMax: '',
  };
}

export function emptyCanonicalBatchFormValues(): CanonicalBatchFormValues {
  return {
    lotNumber: '',
    roastDate: new Date().toISOString().slice(0, 10),
    brewingNotes: '',
    roasterStory: '',
  };
}

function trimValue(value: string): string {
  return value.trim();
}

function toNullableString(value: string): string | null {
  const trimmed = trimValue(value);
  return trimmed ? trimmed : null;
}

function toNullableNumber(value: string): number | null {
  const trimmed = trimValue(value);
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function trimCanonicalCoffeeFormValues(
  values: CanonicalCoffeeFormValues
): CanonicalCoffeeFormValues {
  return {
    name: trimValue(values.name),
    variety: trimValue(values.variety),
    processingMethod: trimValue(values.processingMethod),
    producerNotes: trimValue(values.producerNotes),
    coverImageUrl: trimValue(values.coverImageUrl),
    originCountry: trimValue(values.originCountry),
    originRegion: trimValue(values.originRegion),
    originFarm: trimValue(values.originFarm),
    originProducer: trimValue(values.originProducer),
    originAltitudeMin: trimValue(values.originAltitudeMin),
    originAltitudeMax: trimValue(values.originAltitudeMax),
  };
}

export function trimCanonicalBatchFormValues(
  values: CanonicalBatchFormValues
): CanonicalBatchFormValues {
  return {
    lotNumber: trimValue(values.lotNumber),
    roastDate: trimValue(values.roastDate),
    brewingNotes: trimValue(values.brewingNotes),
    roasterStory: trimValue(values.roasterStory),
  };
}

export function normalizeOriginPayload(values: CanonicalCoffeeFormValues) {
  const trimmed = trimCanonicalCoffeeFormValues(values);
  const payload = {
    country: toNullableString(trimmed.originCountry),
    region: toNullableString(trimmed.originRegion),
    farm: toNullableString(trimmed.originFarm),
    producer: toNullableString(trimmed.originProducer),
    altitude_min: toNullableNumber(trimmed.originAltitudeMin),
    altitude_max: toNullableNumber(trimmed.originAltitudeMax),
  };

  if (Object.values(payload).every((value) => value == null)) {
    return null;
  }

  if (!payload.country) {
    throw new Error('Origin country is required when origin details are provided.');
  }

  return payload;
}

export function normalizeCoffeePayload(input: {
  roasterId: string;
  originId: string | null;
  values: CanonicalCoffeeFormValues;
}) {
  const trimmed = trimCanonicalCoffeeFormValues(input.values);
  if (!trimmed.name) {
    throw new Error('Coffee name is required.');
  }

  return {
    roaster_id: input.roasterId,
    origin_id: input.originId,
    name: trimmed.name,
    variety: toNullableString(trimmed.variety),
    processing_method: toNullableString(trimmed.processingMethod),
    producer_notes: toNullableString(trimmed.producerNotes),
    cover_image_url: toNullableString(trimmed.coverImageUrl),
    status: 'active',
  };
}

export function normalizeBatchPayload(input: {
  coffeeId: string;
  values: CanonicalBatchFormValues;
}) {
  const trimmed = trimCanonicalBatchFormValues(input.values);
  if (!trimmed.lotNumber) {
    throw new Error('Lot number is required.');
  }
  if (!trimmed.roastDate) {
    throw new Error('Roast date is required.');
  }

  return {
    coffee_id: input.coffeeId,
    lot_number: trimmed.lotNumber,
    roast_date: trimmed.roastDate,
    brewing_notes: toNullableString(trimmed.brewingNotes),
    roaster_story: toNullableString(trimmed.roasterStory),
    status: 'active',
  };
}

export function mapCoffeeRecordToFormValues(
  record: CanonicalCoffeeRecord
): CanonicalCoffeeFormValues {
  return {
    name: record.name,
    variety: record.variety ?? '',
    processingMethod: record.processing_method ?? '',
    producerNotes: record.producer_notes ?? '',
    coverImageUrl: record.cover_image_url ?? '',
    originCountry: record.origins?.country ?? '',
    originRegion: record.origins?.region ?? '',
    originFarm: record.origins?.farm ?? '',
    originProducer: record.origins?.producer ?? '',
    originAltitudeMin:
      record.origins?.altitude_min == null ? '' : String(record.origins.altitude_min),
    originAltitudeMax:
      record.origins?.altitude_max == null ? '' : String(record.origins.altitude_max),
  };
}
