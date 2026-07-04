import { normalizeFlowError } from '../errors/flowError';
import type { TypedSupabaseClient } from './supabaseClientFactory';

export type BatchPublicationOrigin = {
  country: string | null;
  region: string | null;
  farm: string | null;
  producer: string | null;
  altitudeMin: number | null;
  altitudeMax: number | null;
};

export type CoffeeVarietyOption = {
  id: string;
  name: string;
};

export type BatchPublicationCoffee = {
  id: string;
  name: string;
  variety: string | null;
  varieties: CoffeeVarietyOption[];
  processingMethod: string | null;
  producerNotes: string | null;
  coverImageUrl: string | null;
  storeUrl: string | null;
};

export type BatchPublicationBatch = {
  id: string;
  lotNumber: string;
  roastDate: string;
  brewingNotes: string | null;
  roasterStory: string | null;
  declaredSensoryAcidity: number | null;
  declaredSensorySweetness: number | null;
  declaredSensoryBody: number | null;
  declaredSensoryBitter: number | null;
  declaredSensoryAftertaste: number | null;
  suggestedBrewMethodIds: string[];
  suggestedTastingNoteIds: string[];
  createdAt: string | null;
};

export type BatchPublicationQr = {
  hash: string;
};

export type BatchPublicationStats = {
  totalCount: number;
  avgRating: number;
  favoriteUsersCount: number;
  updatedAt: string | null;
};

export type BatchPublicationSummary = {
  batchId: string;
  coffeeId: string;
  coffeeName: string;
  coverImageUrl: string | null;
  storeUrl: string | null;
  coffeeVariety: string | null;
  coffeeVarieties: CoffeeVarietyOption[];
  coffeeProcessingMethod: string | null;
  lotNumber: string;
  roastDate: string;
  suggestedBrewMethodIds: string[];
  suggestedTastingNoteIds: string[];
  qrHash: string | null;
  totalCount: number;
  avgRating: number;
  statsUpdatedAt: string | null;
};

export type BatchPublicationDetail = {
  coffee: BatchPublicationCoffee;
  origin: BatchPublicationOrigin | null;
  batch: BatchPublicationBatch;
  qr: BatchPublicationQr | null;
  stats: BatchPublicationStats;
};

export type BatchPublicationPayload = {
  coffee: {
    name: string;
    varietyIds: string[];
    processingMethod: string | null;
    producerNotes: string | null;
    coverImageUrl: string | null;
    storeUrl: string | null;
  };
  origin: BatchPublicationOrigin | null;
  batch: {
    lotNumber: string;
    roastDate: string;
    brewingNotes: string | null;
    roasterStory: string | null;
    declaredSensoryAcidity: number | null;
    declaredSensorySweetness: number | null;
    declaredSensoryBody: number | null;
    declaredSensoryBitter: number | null;
    declaredSensoryAftertaste: number | null;
    suggestedBrewMethodIds: string[];
    suggestedTastingNoteIds: string[];
  };
};

export type UpsertBatchPublicationInput =
  | ({ mode: 'create' } & BatchPublicationPayload)
  | ({
      mode: 'update';
      batchId: string;
    } & BatchPublicationPayload);

export type UpsertBatchPublicationResult = {
  created: boolean;
  batchId: string;
  coffeeId: string;
  originId: string | null;
};

export type EnsureBatchQrResult = {
  created: boolean;
  hash: string;
  lotNumber: string;
  svg: string;
  png: string;
};

type FunctionErrorBody = {
  error?: string;
  message?: string;
};

function normalizeFunctionError(domain: 'batch_publication' | 'qr', error: unknown) {
  return normalizeFlowError({
    error,
    domain,
    fallbackMessage:
      domain === 'qr'
        ? 'Unexpected QR flow failure.'
        : 'Unexpected roaster batch publication failure.',
  });
}

async function invokeOrThrow<T>(
  supabase: TypedSupabaseClient,
  fn: string,
  body: Record<string, unknown>
): Promise<T> {
  const result = await supabase.functions.invoke<T | FunctionErrorBody>(fn, { body });
  if (result.error) {
    throw normalizeFunctionError(fn === 'ensure_batch_qr' ? 'qr' : 'batch_publication', result.error);
  }

  const payload = result.data;
  if (
    payload &&
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    'error' in payload &&
    typeof payload.error === 'string'
  ) {
    throw normalizeFunctionError(fn === 'ensure_batch_qr' ? 'qr' : 'batch_publication', payload);
  }

  return payload as T;
}

export async function listRoasterBatchPublications(
  supabase: TypedSupabaseClient
): Promise<BatchPublicationSummary[]> {
  return invokeOrThrow<BatchPublicationSummary[]>(supabase, 'roaster_batch_publications', {
    mode: 'list',
  });
}

export async function getRoasterBatchPublicationDetail(
  supabase: TypedSupabaseClient,
  batchId: string
): Promise<BatchPublicationDetail> {
  return invokeOrThrow<BatchPublicationDetail>(supabase, 'roaster_batch_publications', {
    mode: 'detail',
    batchId,
  });
}

export async function upsertRoasterBatchPublication(
  supabase: TypedSupabaseClient,
  input: UpsertBatchPublicationInput
): Promise<UpsertBatchPublicationResult> {
  return invokeOrThrow<UpsertBatchPublicationResult>(
    supabase,
    'upsert_roaster_batch_publication',
    input as unknown as Record<string, unknown>
  );
}

export async function ensureRoasterBatchQr(
  supabase: TypedSupabaseClient,
  batchId: string
): Promise<EnsureBatchQrResult> {
  return invokeOrThrow<EnsureBatchQrResult>(supabase, 'ensure_batch_qr', {
    batchId,
  });
}

export async function listCoffeeVarieties(
  supabase: TypedSupabaseClient
): Promise<CoffeeVarietyOption[]> {
  return invokeOrThrow<CoffeeVarietyOption[]>(supabase, 'roaster_batch_publications', {
    mode: 'varieties',
  });
}
