import type { TypedSupabaseClient } from './supabaseClientFactory';
import {
  normalizeFlowError,
  type FlowError,
  type FlowErrorKind,
} from '../errors/flowError';
import {
  upsertRoasterTelemetryCore,
} from '../roasterDataProfile/telemetryCoreService';
import type {
  RoasterTelemetryCoreInput,
  RoasterTelemetryCoreRecord,
} from '../roasterDataProfile/telemetryCore';

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

export type UpdateTastingInput = {
  coffeeLogId: string;
  batchId: string;
  userId: string;
  rating: number;
  brewMethodId: string;
  tastingNoteIds: string[];
  freeTextNotes?: string | null;
  review?: string | null;
  telemetry?: RoasterTelemetryCoreInput | null;
};

export type UpdateTastingResult = {
  savedTelemetry: RoasterTelemetryCoreRecord | null;
  telemetryError: TastingSyncError | null;
  statsUpdated: boolean;
};

export type DeleteTastingResult = {
  statsUpdated: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

type CoffeeLogsTable = {
  update: (value: { rating?: number; brew_method_id?: string | null; free_text_notes?: string | null }) => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => {
        select: (columns: string) => {
          maybeSingle: () => Promise<{ data: { id: string; rating: number } | null; error: Error | null }>;
        };
      };
    };
  };
  delete: () => {
    eq: (column: string, value: string) => {
      eq: (column: string, value: string) => Promise<{ error: Error | null }>;
    };
  };
};

type ReviewsTable = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: () => Promise<{ data: { id: string } | null; error: Error | null }>;
    };
  };
  update: (value: { body: string }) => {
    eq: (column: string, value: string) => Promise<{ error: Error | null }>;
  };
  insert: (value: { coffee_log_id: string; body: string }) => Promise<{ error: Error | null }>;
  delete: () => {
    eq: (column: string, value: string) => Promise<{ error: Error | null }>;
  };
};

type CoffeeLogTastingNotesTable = {
  delete: () => {
    eq: (column: string, value: string) => Promise<{ error: Error | null }>;
  };
  insert: (
    value: Array<{ coffee_log_id: string; tasting_note_id: string }>
  ) => Promise<{ error: Error | null }>;
};

function getCoffeeLogsTable(supabase: TypedSupabaseClient): CoffeeLogsTable {
  return supabase.from('coffee_logs') as unknown as CoffeeLogsTable;
}

function getReviewsTable(supabase: TypedSupabaseClient): ReviewsTable {
  return supabase.from('reviews') as unknown as ReviewsTable;
}

function getCoffeeLogTastingNotesTable(
  supabase: TypedSupabaseClient
): CoffeeLogTastingNotesTable {
  return supabase.from('coffee_log_tasting_notes') as unknown as CoffeeLogTastingNotesTable;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
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
  if (primary.error) throw normalizeTastingSyncError(primary.error);
  return primary.data;
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

export async function updateTasting(
  supabase: TypedSupabaseClient,
  input: UpdateTastingInput
): Promise<UpdateTastingResult> {
  const coffeeLogsTable = getCoffeeLogsTable(supabase);
  const reviewsTable = getReviewsTable(supabase);
  const tastingNotesTable = getCoffeeLogTastingNotesTable(supabase);
  const normalizedFreeTextNotes = normalizeOptionalText(input.freeTextNotes);
  const normalizedReview = normalizeOptionalText(input.review);

  const { data: updatedLogRow, error: logError } = await coffeeLogsTable
    .update({
      rating: input.rating,
      brew_method_id: input.brewMethodId,
      free_text_notes: normalizedFreeTextNotes,
    })
    .eq('id', input.coffeeLogId)
    .eq('user_id', input.userId)
    .select('id,rating')
    .maybeSingle();
  if (logError) throw normalizeTastingSyncError(logError);
  if (!updatedLogRow) {
    throw normalizeTastingSyncError(
      new Error('Tasting update was not applied. Re-open the entry and try again.')
    );
  }
  if (updatedLogRow.rating !== input.rating) {
    throw normalizeTastingSyncError(
      new Error('Tasting rating was not persisted. Try again in a moment.')
    );
  }

  const { error: deleteTastingNotesError } = await tastingNotesTable
    .delete()
    .eq('coffee_log_id', input.coffeeLogId);
  if (deleteTastingNotesError) throw normalizeTastingSyncError(deleteTastingNotesError);

  const uniqueTastingNoteIds = Array.from(new Set(input.tastingNoteIds));
  if (uniqueTastingNoteIds.length > 0) {
    const { error: insertTastingNotesError } = await tastingNotesTable.insert(
      uniqueTastingNoteIds.map((tastingNoteId) => ({
        coffee_log_id: input.coffeeLogId,
        tasting_note_id: tastingNoteId,
      }))
    );
    if (insertTastingNotesError) throw normalizeTastingSyncError(insertTastingNotesError);
  }

  const { data: existingReview, error: existingReviewError } = await reviewsTable
    .select('id')
    .eq('coffee_log_id', input.coffeeLogId)
    .maybeSingle();
  if (existingReviewError) throw normalizeTastingSyncError(existingReviewError);

  if (normalizedReview) {
    if (existingReview?.id) {
      const { error: updateReviewError } = await reviewsTable
        .update({ body: normalizedReview })
        .eq('id', existingReview.id);
      if (updateReviewError) throw normalizeTastingSyncError(updateReviewError);
    } else {
      const { error: insertReviewError } = await reviewsTable.insert({
        coffee_log_id: input.coffeeLogId,
        body: normalizedReview,
      });
      if (insertReviewError) throw normalizeTastingSyncError(insertReviewError);
    }
  } else if (existingReview?.id) {
    const { error: deleteReviewError } = await reviewsTable
      .delete()
      .eq('coffee_log_id', input.coffeeLogId);
    if (deleteReviewError) throw normalizeTastingSyncError(deleteReviewError);
  }

  let savedTelemetry: RoasterTelemetryCoreRecord | null = null;
  let telemetryError: TastingSyncError | null = null;
  if (input.telemetry) {
    try {
      savedTelemetry = await upsertRoasterTelemetryCore({
        supabase,
        coffeeLogId: input.coffeeLogId,
        userId: input.userId,
        input: input.telemetry,
      });
    } catch (error) {
      telemetryError = normalizeTastingSyncError(error);
    }
  }

  let statsUpdated = true;
  try {
    await updateCoffeeStats(supabase, {
      batchId: input.batchId,
      userId: input.userId,
    });
  } catch {
    statsUpdated = false;
  }

  return {
    savedTelemetry,
    telemetryError,
    statsUpdated,
  };
}

export async function deleteTasting(
  supabase: TypedSupabaseClient,
  params: { coffeeLogId: string; batchId: string; userId: string }
): Promise<DeleteTastingResult> {
  const coffeeLogsTable = getCoffeeLogsTable(supabase);
  const { error } = await coffeeLogsTable
    .delete()
    .eq('id', params.coffeeLogId)
    .eq('user_id', params.userId);
  if (error) throw normalizeTastingSyncError(error);

  let statsUpdated = true;
  try {
    await updateCoffeeStats(supabase, {
      batchId: params.batchId,
      userId: params.userId,
    });
  } catch {
    statsUpdated = false;
  }

  return { statsUpdated };
}
