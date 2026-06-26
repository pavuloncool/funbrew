-- Fair sensory reputation scoring with manual override support.
-- Score rewards structured, repeatable tasting data and small dictionary-learning moments.

BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS sensory_level_override public.sensory_level;

CREATE OR REPLACE FUNCTION public.resolve_sensory_level_from_score(p_score integer)
RETURNS public.sensory_level
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN COALESCE(p_score, 0) >= 55 THEN 'expert'::public.sensory_level
    WHEN COALESCE(p_score, 0) >= 30 THEN 'advanced'::public.sensory_level
    ELSE 'beginner'::public.sensory_level
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_tasting_note_unlock_level(p_note_name text)
RETURNS public.sensory_level
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN lower(replace(COALESCE(p_note_name, ''), '_', '-')) IN (
      'berry',
      'chocolate',
      'caramel',
      'honey',
      'brown-sugar',
      'almond',
      'hazelnut',
      'cinnamon'
    ) THEN 'beginner'::public.sensory_level
    WHEN lower(replace(COALESCE(p_note_name, ''), '_', '-')) IN (
      'citrus',
      'stone-fruit'
    ) THEN 'advanced'::public.sensory_level
    ELSE 'expert'::public.sensory_level
  END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_user_reputation(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  scan_activity_score integer := 0;
  tasting_log_score integer := 0;
  structured_consistency_score integer := 0;
  dictionary_learning_score integer := 0;
  text_field_score integer := 0;
  new_score integer := 0;
  new_level public.sensory_level := 'beginner'::public.sensory_level;
BEGIN
  WITH user_logs AS (
    SELECT
      cl.id,
      cl.batch_id,
      cl.rating,
      cl.brew_method_id,
      COALESCE(cl.free_text_notes, '') AS free_text_notes,
      COALESCE(r.body, '') AS review_body,
      COUNT(DISTINCT cltn.tasting_note_id)::integer AS note_count,
      EXISTS (
        SELECT 1
        FROM public.coffee_log_telemetry_core tc
        WHERE tc.coffee_log_id = cl.id
          AND tc.overall_rating BETWEEN 1 AND 5
          AND tc.sensory_acidity BETWEEN 1 AND 5
          AND tc.sensory_sweetness BETWEEN 1 AND 5
          AND tc.sensory_body BETWEEN 1 AND 5
          AND COALESCE(tc.sensory_bitter, 3) BETWEEN 1 AND 5
          AND COALESCE(tc.sensory_aftertaste, 3) BETWEEN 1 AND 5
      ) AS has_complete_sensory_core
    FROM public.coffee_logs cl
    LEFT JOIN public.reviews r
      ON r.coffee_log_id = cl.id
    LEFT JOIN public.coffee_log_tasting_notes cltn
      ON cltn.coffee_log_id = cl.id
    WHERE cl.user_id = p_user_id
    GROUP BY cl.id, r.body
  ),
  selected_note_names AS (
    SELECT DISTINCT lower(replace(tn.name, '_', '-')) AS name
    FROM public.coffee_logs cl
    INNER JOIN public.coffee_log_tasting_notes cltn
      ON cltn.coffee_log_id = cl.id
    INNER JOIN public.tasting_notes tn
      ON tn.id = cltn.tasting_note_id
    WHERE cl.user_id = p_user_id
  ),
  text_note_names AS (
    SELECT DISTINCT lower(replace(tn.name, '_', '-')) AS name
    FROM user_logs ul
    CROSS JOIN public.tasting_notes tn
    WHERE (
      ' ' || regexp_replace(lower(ul.free_text_notes || ' ' || ul.review_body), '[^a-z0-9]+', ' ', 'g') || ' '
    ) LIKE (
      '% ' || regexp_replace(lower(tn.name), '[^a-z0-9]+', ' ', 'g') || ' %'
    )
      OR (
        ' ' || regexp_replace(lower(ul.free_text_notes || ' ' || ul.review_body), '[^a-z0-9]+', ' ', 'g') || ' '
      ) LIKE (
        '% ' || regexp_replace(lower(tn.label), '[^a-z0-9]+', ' ', 'g') || ' %'
      )
  ),
  learned_note_names AS (
    SELECT name FROM selected_note_names
    UNION
    SELECT name FROM text_note_names
  ),
  score_parts AS (
    SELECT
      (SELECT COUNT(DISTINCT batch_id)::integer FROM user_logs) AS scan_activity,
      COALESCE(SUM(
        CASE WHEN rating IS NOT NULL THEN 2 ELSE 0 END
        + CASE WHEN brew_method_id IS NOT NULL THEN 1 ELSE 0 END
        + CASE WHEN note_count >= 1 THEN 1 ELSE 0 END
        + CASE WHEN note_count >= 3 THEN 1 ELSE 0 END
        + CASE WHEN has_complete_sensory_core THEN 1 ELSE 0 END
      ), 0)::integer AS tasting_logs,
      (FLOOR(COUNT(*) FILTER (
        WHERE rating IS NOT NULL
          AND brew_method_id IS NOT NULL
          AND note_count >= 1
      ) / 5.0) * 3)::integer AS structured_consistency,
      (
        (SELECT COUNT(*)::integer FROM learned_note_names)
        + (
          SELECT COUNT(DISTINCT public.get_tasting_note_unlock_level(name))::integer * 2
          FROM learned_note_names
        )
      ) AS dictionary_learning,
      COALESCE(SUM(
        CASE
          WHEN char_length(btrim(free_text_notes)) >= 20 OR char_length(btrim(review_body)) >= 20 THEN 1
          ELSE 0
        END
      ), 0)::integer AS text_fields
    FROM user_logs
  )
  SELECT
    scan_activity,
    tasting_logs,
    structured_consistency,
    dictionary_learning,
    text_fields,
    scan_activity + tasting_logs + structured_consistency + dictionary_learning + text_fields
  INTO
    scan_activity_score,
    tasting_log_score,
    structured_consistency_score,
    dictionary_learning_score,
    text_field_score,
    new_score
  FROM score_parts;

  new_score := COALESCE(new_score, 0);
  new_level := public.resolve_sensory_level_from_score(new_score);

  UPDATE public.users
  SET sensory_score = new_score,
      sensory_level = new_level
  WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_batch_community_reviews(p_batch_id uuid)
RETURNS TABLE (
  review_id uuid,
  body text,
  coffee_log_id uuid,
  logged_at timestamptz,
  helpful_count bigint,
  viewer_marked_helpful boolean,
  author_name text,
  author_sensory_level public.sensory_level
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id AS review_id,
    r.body,
    cl.id AS coffee_log_id,
    cl.logged_at,
    COALESCE(votes.helpful_count, 0) AS helpful_count,
    COALESCE(viewer.viewer_marked_helpful, false) AS viewer_marked_helpful,
    u.display_name AS author_name,
    COALESCE(u.sensory_level_override, u.sensory_level) AS author_sensory_level
  FROM public.reviews r
  INNER JOIN public.coffee_logs cl
    ON cl.id = r.coffee_log_id
  INNER JOIN public.users u
    ON u.id = cl.user_id
  LEFT JOIN (
    SELECT rv.review_id, COUNT(*)::bigint AS helpful_count
    FROM public.review_votes rv
    WHERE rv.vote = true
    GROUP BY rv.review_id
  ) votes
    ON votes.review_id = r.id
  LEFT JOIN (
    SELECT rv.review_id, true AS viewer_marked_helpful
    FROM public.review_votes rv
    WHERE rv.user_id = auth.uid()
      AND rv.vote = true
  ) viewer
    ON viewer.review_id = r.id
  WHERE cl.batch_id = p_batch_id
  ORDER BY COALESCE(votes.helpful_count, 0) DESC, cl.logged_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_batch_community_reviews(uuid) TO authenticated;

DO $$
DECLARE
  user_record record;
BEGIN
  FOR user_record IN SELECT id FROM public.users LOOP
    PERFORM public.recalculate_user_reputation(user_record.id);
  END LOOP;
END;
$$;

COMMIT;
