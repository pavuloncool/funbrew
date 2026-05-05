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

export async function logTasting(
  supabase: TypedSupabaseClient,
  input: LogTastingInput
): Promise<{ coffeeLogId: string }> {
  const { data, error } = await supabase.functions.invoke('coffee/log-tasting', {
    body: {
      batch_id: input.batchId,
      rating: input.rating,
      brew_method_id: input.brewMethodId,
      brew_time_seconds: input.brewTimeSeconds,
      tasting_note_ids: input.tastingNoteIds,
      free_text_notes: input.freeTextNotes,
      review: input.review,
    },
  });

  if (error) throw error;
  if (!data?.coffee_log_id) throw new Error('Unexpected response from log-tasting');

  return { coffeeLogId: data.coffee_log_id as string };
}

export async function updateCoffeeStats(
  supabase: TypedSupabaseClient,
  params: { batchId: string; userId: string }
): Promise<void> {
  const { error } = await supabase.functions.invoke('update_coffee_stats', {
    body: { batch_id: params.batchId, user_id: params.userId },
  });
  if (error) throw error;
}
