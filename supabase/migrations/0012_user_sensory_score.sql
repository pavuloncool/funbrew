-- User sensory score source of truth
-- Version: 0012
-- Created: 2026-05-04

BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS sensory_score integer NOT NULL DEFAULT 0;

-- Backfill sensory score from existing tasting volume.
UPDATE public.users AS u
SET sensory_score = COALESCE(logs.log_count, 0)
FROM (
  SELECT user_id, COUNT(*)::integer AS log_count
  FROM public.coffee_logs
  GROUP BY user_id
) AS logs
WHERE u.id = logs.user_id;

UPDATE public.users
SET sensory_score = 0
WHERE sensory_score IS NULL OR sensory_score < 0;

-- Keep sensory_level aligned with score thresholds.
UPDATE public.users
SET sensory_level = CASE
  WHEN sensory_score >= 50 THEN 'expert'::sensory_level
  WHEN sensory_score >= 20 THEN 'advanced'::sensory_level
  ELSE 'beginner'::sensory_level
END;

COMMIT;
