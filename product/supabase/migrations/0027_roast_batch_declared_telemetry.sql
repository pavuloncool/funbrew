-- Persist roaster-declared sensory targets for each batch.
-- Version: 0027
-- Created: 2026-05-31

BEGIN;

ALTER TABLE public.roast_batches
  ADD COLUMN IF NOT EXISTS declared_sensory_acidity smallint
    CHECK (declared_sensory_acidity BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS declared_sensory_sweetness smallint
    CHECK (declared_sensory_sweetness BETWEEN 1 AND 5);

COMMIT;
