import type { TypedSupabaseClient } from './supabaseClientFactory';

export type CoffeeLogDetails = {
  id: string;
  batchId: string;
  brewMethodId: string | null;
  coffeeName: string;
  coverImageUrl: string | null;
  roasterName: string | null;
  loggedAt: string;
  rating: number;
  tastingNoteIds: string[];
  freeTextNotes: string | null;
  reviewBody: string | null;
};

type EmbeddedReview =
  | { body?: string | null }
  | Array<{ body?: string | null }>
  | null
  | undefined;

function extractReviewBody(review: EmbeddedReview): string | null {
  if (Array.isArray(review)) {
    const body = review[0]?.body;
    return typeof body === 'string' ? body : null;
  }
  if (review && typeof review === 'object') {
    return typeof review.body === 'string' ? review.body : null;
  }
  return null;
}

export function parseCoffeeLogDetails(raw: unknown): CoffeeLogDetails | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as {
    id: string;
    batch_id: string;
    brew_method_id: string | null;
    rating: number;
    free_text_notes: string | null;
    logged_at: string;
    roast_batches?: {
      coffees?: {
        name?: string;
        cover_image_url?: string | null;
        roasters?: { name?: string | null } | null;
      } | null;
    } | null;
    coffee_log_tasting_notes?: Array<{ tasting_note_id: string }> | null;
    reviews?: EmbeddedReview;
  };

  return {
    id: row.id,
    batchId: row.batch_id,
    brewMethodId: row.brew_method_id,
    coffeeName: row.roast_batches?.coffees?.name ?? 'Coffee',
    coverImageUrl: row.roast_batches?.coffees?.cover_image_url ?? null,
    roasterName: row.roast_batches?.coffees?.roasters?.name ?? null,
    loggedAt: row.logged_at,
    rating: row.rating,
    tastingNoteIds: (row.coffee_log_tasting_notes ?? []).map((item) => item.tasting_note_id),
    freeTextNotes: row.free_text_notes,
    reviewBody: extractReviewBody(row.reviews),
  };
}

export async function fetchCoffeeLogDetails(
  supabase: TypedSupabaseClient,
  params: { logId: string; userId: string }
): Promise<CoffeeLogDetails | null> {
  const { data, error } = await supabase
    .from('coffee_logs')
    .select(
      `
      id,
      batch_id,
      brew_method_id,
      rating,
      free_text_notes,
      logged_at,
      roast_batches (
        coffees (
          name,
          cover_image_url,
          roasters ( name )
        )
      ),
      coffee_log_tasting_notes ( tasting_note_id ),
      reviews ( body )
    `
    )
    .eq('id', params.logId)
    .eq('user_id', params.userId)
    .maybeSingle();

  if (error) throw error;
  return parseCoffeeLogDetails(data);
}
