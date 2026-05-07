import type { TypedSupabaseClient } from './supabaseClientFactory';
import {
  normalizeFlowError,
  type FlowError,
  type FlowErrorKind,
} from '../errors/flowError';

export type LogTastingInput = {
  batchId: string;
  rating: number;
  brewMethodId?: string;
  brewTimeSeconds?: number;
  tastingNoteIds?: string[];
  freeTextNotes?: string;
  review?: string;
};

export type TastingSyncErrorKind = FlowErrorKind;

export type TastingSyncError = FlowError & {
  name: 'TastingSyncError';
  domain: 'tasting_log';
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

export function normalizeTastingSyncError(error: unknown): TastingSyncError {
  const normalized = normalizeFlowError({
    error,
    domain: 'tasting_log',
    fallbackMessage: 'Unexpected tasting sync failure.',
  });
  (normalized as Error).name = 'TastingSyncError';
  return normalized as TastingSyncError;
}

async function invokeLogTastingWithFallback(
  supabase: TypedSupabaseClient,
  body: Record<string, unknown>
): Promise<unknown> {
  const primary = await supabase.functions.invoke<unknown>('log_tasting', { body });
  if (!primary.error) return primary.data;

  const primaryError = normalizeTastingSyncError(primary.error);
  if (primaryError.kind !== 'not_found') {
    throw primaryError;
  }

  const legacy = await supabase.functions.invoke<unknown>('coffee/log-tasting', { body });
  if (legacy.error) throw normalizeTastingSyncError(legacy.error);
  return legacy.data;
}

export async function logTasting(
  supabase: TypedSupabaseClient,
  input: LogTastingInput
): Promise<{ coffeeLogId: string }> {
  const data = await invokeLogTastingWithFallback(supabase, {
    batch_id: input.batchId,
    rating: input.rating,
    brew_method_id: input.brewMethodId,
    brew_time_seconds: input.brewTimeSeconds,
    tasting_note_ids: input.tastingNoteIds,
    free_text_notes: input.freeTextNotes,
    review: input.review,
  });
  const payload = asRecord(data);
  if (!payload || typeof payload.coffee_log_id !== 'string') {
    throw new Error('Unexpected response from log-tasting');
  }

  return { coffeeLogId: payload.coffee_log_id };
}

export async function updateCoffeeStats(
  supabase: TypedSupabaseClient,
  params: { batchId: string; userId: string }
): Promise<void> {
  const { error } = await supabase.functions.invoke('update_coffee_stats', {
    body: { batch_id: params.batchId, user_id: params.userId },
  });
  if (error) throw normalizeTastingSyncError(error);
}
