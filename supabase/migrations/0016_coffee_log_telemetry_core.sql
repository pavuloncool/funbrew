-- Roaster data profile MVP core telemetry (per tasting log)
-- Version: 0016
-- Created: 2026-05-08

BEGIN;

CREATE TABLE IF NOT EXISTS public.coffee_log_telemetry_core (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  coffee_log_id uuid NOT NULL UNIQUE REFERENCES public.coffee_logs(id) ON DELETE CASCADE,
  brew_method_id uuid NOT NULL REFERENCES public.brew_methods(id) ON DELETE RESTRICT,
  overall_rating smallint NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  sensory_acidity smallint NOT NULL CHECK (sensory_acidity BETWEEN 1 AND 5),
  sensory_sweetness smallint NOT NULL CHECK (sensory_sweetness BETWEEN 1 AND 5),
  sensory_body smallint NOT NULL CHECK (sensory_body BETWEEN 1 AND 5),
  repurchase_intent text NOT NULL CHECK (repurchase_intent IN ('yes', 'no', 'unsure')),
  experience_level sensory_level NOT NULL DEFAULT 'beginner'::sensory_level,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'coffee_log_telemetry_core_updated_at'
  ) THEN
    CREATE TRIGGER coffee_log_telemetry_core_updated_at
      BEFORE UPDATE ON public.coffee_log_telemetry_core
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;

ALTER TABLE public.coffee_log_telemetry_core ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own telemetry core" ON public.coffee_log_telemetry_core;
CREATE POLICY "Users can read own telemetry core" ON public.coffee_log_telemetry_core
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.coffee_logs cl
      WHERE cl.id = coffee_log_id
        AND cl.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create own telemetry core" ON public.coffee_log_telemetry_core;
CREATE POLICY "Users can create own telemetry core" ON public.coffee_log_telemetry_core
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.coffee_logs cl
      WHERE cl.id = coffee_log_id
        AND cl.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own telemetry core" ON public.coffee_log_telemetry_core;
CREATE POLICY "Users can update own telemetry core" ON public.coffee_log_telemetry_core
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM public.coffee_logs cl
      WHERE cl.id = coffee_log_id
        AND cl.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own telemetry core" ON public.coffee_log_telemetry_core;
CREATE POLICY "Users can delete own telemetry core" ON public.coffee_log_telemetry_core
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM public.coffee_logs cl
      WHERE cl.id = coffee_log_id
        AND cl.user_id = auth.uid()
    )
  );

COMMIT;
