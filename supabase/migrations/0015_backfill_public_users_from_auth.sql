-- Safety migration: restore missing rows in public.users from auth.users
-- Version: 0015
-- Created: 2026-05-04

BEGIN;

INSERT INTO public.users (id, display_name, avatar_url)
SELECT
  au.id,
  COALESCE(NULLIF(au.raw_user_meta_data->>'display_name', ''), 'New user') AS display_name,
  NULLIF(au.raw_user_meta_data->>'avatar_url', '') AS avatar_url
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;

COMMIT;
