BEGIN;

CREATE TEMP TABLE touched_duplicate_batches (
  batch_id uuid PRIMARY KEY
) ON COMMIT DROP;

CREATE TEMP TABLE duplicate_coffee_logs (
  duplicate_log_id uuid PRIMARY KEY,
  keep_log_id uuid NOT NULL,
  user_id uuid NOT NULL,
  batch_id uuid NOT NULL
) ON COMMIT DROP;

WITH ranked_logs AS (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY user_id, batch_id
      ORDER BY logged_at DESC, created_at DESC, id DESC
    ) AS keep_log_id,
    user_id,
    batch_id,
    row_number() OVER (
      PARTITION BY user_id, batch_id
      ORDER BY logged_at DESC, created_at DESC, id DESC
    ) AS row_rank,
    count(*) OVER (PARTITION BY user_id, batch_id) AS duplicate_count
  FROM public.coffee_logs
)
INSERT INTO duplicate_coffee_logs (duplicate_log_id, keep_log_id, user_id, batch_id)
SELECT id, keep_log_id, user_id, batch_id
FROM ranked_logs
WHERE duplicate_count > 1
  AND row_rank > 1;

INSERT INTO touched_duplicate_batches (batch_id)
SELECT DISTINCT batch_id
FROM duplicate_coffee_logs
ON CONFLICT (batch_id) DO NOTHING;

INSERT INTO public.user_favorite_coffee_logs (user_id, coffee_log_id, created_at)
SELECT DISTINCT ON (favorites.user_id, duplicates.keep_log_id)
  favorites.user_id,
  duplicates.keep_log_id,
  min(favorites.created_at) OVER (
    PARTITION BY favorites.user_id, duplicates.keep_log_id
  ) AS created_at
FROM public.user_favorite_coffee_logs favorites
INNER JOIN duplicate_coffee_logs duplicates
  ON duplicates.duplicate_log_id = favorites.coffee_log_id
ORDER BY favorites.user_id, duplicates.keep_log_id, favorites.created_at ASC
ON CONFLICT (user_id, coffee_log_id) DO NOTHING;

DELETE FROM public.user_favorite_coffee_logs favorites
USING duplicate_coffee_logs duplicates
WHERE favorites.coffee_log_id = duplicates.duplicate_log_id;

DELETE FROM public.coffee_logs logs
USING duplicate_coffee_logs duplicates
WHERE logs.id = duplicates.duplicate_log_id;

WITH log_stats AS (
  SELECT
    logs.batch_id,
    count(*)::integer AS total_count,
    COALESCE(round(avg(logs.rating)::numeric, 2), 0)::numeric(3, 2) AS avg_rating,
    jsonb_build_object(
      '1', count(*) FILTER (WHERE logs.rating = 1),
      '2', count(*) FILTER (WHERE logs.rating = 2),
      '3', count(*) FILTER (WHERE logs.rating = 3),
      '4', count(*) FILTER (WHERE logs.rating = 4),
      '5', count(*) FILTER (WHERE logs.rating = 5)
    ) AS rating_distribution
  FROM public.coffee_logs logs
  INNER JOIN touched_duplicate_batches touched
    ON touched.batch_id = logs.batch_id
  GROUP BY logs.batch_id
),
note_counts AS (
  SELECT
    logs.batch_id,
    notes.tasting_note_id,
    count(*) AS note_count
  FROM public.coffee_logs logs
  INNER JOIN touched_duplicate_batches touched
    ON touched.batch_id = logs.batch_id
  INNER JOIN public.coffee_log_tasting_notes notes
    ON notes.coffee_log_id = logs.id
  GROUP BY logs.batch_id, notes.tasting_note_id
),
ranked_notes AS (
  SELECT
    note_counts.batch_id,
    note_counts.tasting_note_id,
    note_counts.note_count,
    row_number() OVER (
      PARTITION BY note_counts.batch_id
      ORDER BY note_counts.note_count DESC, note_counts.tasting_note_id
    ) AS note_rank
  FROM note_counts
),
top_notes AS (
  SELECT
    ranked_notes.batch_id,
    COALESCE(
      jsonb_agg(ranked_notes.tasting_note_id ORDER BY ranked_notes.note_count DESC, ranked_notes.tasting_note_id)
        FILTER (WHERE ranked_notes.note_rank <= 10),
      '[]'::jsonb
    ) AS top_flavor_notes
  FROM ranked_notes
  GROUP BY ranked_notes.batch_id
)
INSERT INTO public.coffee_stats (
  batch_id,
  total_count,
  avg_rating,
  rating_distribution,
  top_flavor_notes,
  updated_at
)
SELECT
  log_stats.batch_id,
  log_stats.total_count,
  log_stats.avg_rating,
  log_stats.rating_distribution,
  COALESCE(top_notes.top_flavor_notes, '[]'::jsonb),
  now()
FROM log_stats
LEFT JOIN top_notes
  ON top_notes.batch_id = log_stats.batch_id
ON CONFLICT (batch_id) DO UPDATE
SET
  total_count = EXCLUDED.total_count,
  avg_rating = EXCLUDED.avg_rating,
  rating_distribution = EXCLUDED.rating_distribution,
  top_flavor_notes = EXCLUDED.top_flavor_notes,
  updated_at = EXCLUDED.updated_at;

CREATE UNIQUE INDEX IF NOT EXISTS coffee_logs_user_batch_unique_idx
  ON public.coffee_logs(user_id, batch_id);

COMMIT;
