-- Persist roaster suggestions for each published batch.
-- Version: 0024
-- Created: 2026-05-31

BEGIN;

ALTER TABLE public.roast_batches
  ADD COLUMN IF NOT EXISTS suggested_brew_method_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS suggested_tasting_note_ids uuid[] NOT NULL DEFAULT '{}';

COMMIT;
