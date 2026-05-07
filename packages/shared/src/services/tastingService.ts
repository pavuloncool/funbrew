import type { TypedSupabaseClient } from './supabaseClientFactory';

export type LogTastingInput = {
  batchId: string;
  rating: number;
  brewMethodId?: string;
  brewTimeSeconds?: number;
  tastingNoteIds?: string[];
  freeTextNotes?: string;
  review?: string;
};

export type TastingSyncErrorKind =
  | 'offline'
  | 'timeout'
  | 'unauthorized'
  | 'validation'
  | 'not_found'
  | 'server'
  | 'unknown';

export type TastingSyncError = Error & {
  kind: TastingSyncErrorKind;
  status: number | null;
  code: string | null;
  retryable: boolean;
  raw: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function extractStatus(error: Record<string, unknown>): number | null {
  const direct = readNumber(error.status) ?? readNumber(error.statusCode);
  if (direct != null) return direct;
  const context = asRecord(error.context);
  if (!context) return null;
  return readNumber(context.status) ?? readNumber(context.statusCode);
}

function extractCode(error: Record<string, unknown>): string | null {
  const direct = readString(error.code);
  if (direct) return direct;
  const context = asRecord(error.context);
  if (!context) return null;
  return readString(context.code);
}

function extractMessage(error: unknown): string {
  if (typeof error === 'string' && error.trim().length > 0) return error;
  const candidate = asRecord(error);
  if (!candidate) return 'Unexpected tasting sync failure.';
  const fromMessage = readString(candidate.message);
  if (fromMessage) return fromMessage;
  const context = asRecord(candidate.context);
  if (context) {
    const fromContext = readString(context.message);
    if (fromContext) return fromContext;
  }
  return 'Unexpected tasting sync failure.';
}

function isTastingSyncError(error: unknown): error is TastingSyncError {
  const candidate = asRecord(error);
  if (!candidate) return false;
  return (
    typeof candidate.kind === 'string' &&
    typeof candidate.retryable === 'boolean' &&
    Object.prototype.hasOwnProperty.call(candidate, 'status')
  );
}

function classifyTastingSyncError(params: {
  message: string;
  status: number | null;
  code: string | null;
}): TastingSyncErrorKind {
  const status = params.status;
  const message = params.message.toLowerCase();
  const code = (params.code ?? '').toLowerCase();

  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 400 || status === 422) return 'validation';
  if (status === 404 || code === 'not_found') return 'not_found';
  if (status != null && status >= 500) return 'server';
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    code.includes('timeout')
  ) {
    return 'timeout';
  }
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('offline') ||
    message.includes('internet')
  ) {
    return 'offline';
  }
  return 'unknown';
}

export function normalizeTastingSyncError(error: unknown): TastingSyncError {
  if (isTastingSyncError(error)) return error;

  const candidate = asRecord(error);
  const status = candidate ? extractStatus(candidate) : null;
  const code = candidate ? extractCode(candidate) : null;
  const message = extractMessage(error);
  const kind = classifyTastingSyncError({ message, status, code });
  const retryable = kind === 'offline' || kind === 'timeout' || kind === 'server';

  const next = new Error(message) as TastingSyncError;
  next.name = 'TastingSyncError';
  next.kind = kind;
  next.status = status;
  next.code = code;
  next.retryable = retryable;
  next.raw = error;
  return next;
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
