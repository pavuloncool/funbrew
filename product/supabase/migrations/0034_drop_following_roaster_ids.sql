BEGIN;

ALTER TABLE public.users
  DROP COLUMN IF EXISTS following_roaster_ids;

COMMIT;
