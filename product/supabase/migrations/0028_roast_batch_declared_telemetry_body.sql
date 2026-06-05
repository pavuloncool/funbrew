-- Persist roaster-declared sensory body targets for each batch.
-- Version: 0028
-- Created: 2026-05-31

BEGIN;

ALTER TABLE public.roast_batches
  ADD COLUMN IF NOT EXISTS declared_sensory_body smallint
    CHECK (declared_sensory_body BETWEEN 1 AND 5);

COMMIT;
