-- Functions & triggers (T015)
-- Version: 0003
-- Created: 2026-04-08

BEGIN;

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach updated_at triggers to tables that have updated_at
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users',
    'roasters',
    'coffees',
    'roast_batches',
    'coffee_stats'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at_%1$s ON public.%1$s;', t);
    EXECUTE format(
      'CREATE TRIGGER set_updated_at_%1$s BEFORE UPDATE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      t
    );
  END LOOP;
END $$;

-- Create a corresponding public.users row when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name', ''), 'New user'),
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Recalculate sensory reputation level from tasting volume
CREATE OR REPLACE FUNCTION public.recalculate_user_reputation(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_count integer;
  current_level sensory_level;
  current_score integer;
  new_level sensory_level;
BEGIN
  SELECT COUNT(*) INTO log_count
  FROM public.coffee_logs
  WHERE user_id = p_user_id;

  SELECT sensory_level, sensory_score INTO current_level, current_score
  FROM public.users
  WHERE id = p_user_id;

  new_level := current_level;

  IF log_count >= 50 THEN
    new_level := 'expert';
  ELSIF log_count >= 20 THEN
    new_level := 'advanced';
  ELSE
    new_level := 'beginner';
  END IF;

  IF new_level IS DISTINCT FROM current_level OR COALESCE(current_score, -1) IS DISTINCT FROM log_count THEN
    UPDATE public.users
    SET sensory_level = new_level,
        sensory_score = log_count
    WHERE id = p_user_id;
  END IF;
END;
$$;

-- Notify update_coffee_stats function (stub for async hook)
-- Intended for pg_net or background worker wiring in later phases.
CREATE OR REPLACE FUNCTION public.notify_update_coffee_stats(p_batch_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- No-op in local SQL migration; wired by Edge Function in Phase 3.
  PERFORM 1;
END;
$$;

COMMIT;
