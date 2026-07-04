BEGIN;

CREATE TABLE IF NOT EXISTS public.user_favorite_coffee_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  coffee_log_id uuid NOT NULL REFERENCES public.coffee_logs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, coffee_log_id)
);

CREATE INDEX IF NOT EXISTS user_favorite_coffee_logs_user_created_idx
  ON public.user_favorite_coffee_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_favorite_coffee_logs_coffee_log_idx
  ON public.user_favorite_coffee_logs(coffee_log_id);

ALTER TABLE public.user_favorite_coffee_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own favorite coffee logs" ON public.user_favorite_coffee_logs;
CREATE POLICY "Users can read own favorite coffee logs"
  ON public.user_favorite_coffee_logs
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorite coffee logs" ON public.user_favorite_coffee_logs;
CREATE POLICY "Users can insert own favorite coffee logs"
  ON public.user_favorite_coffee_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorite coffee logs" ON public.user_favorite_coffee_logs;
CREATE POLICY "Users can delete own favorite coffee logs"
  ON public.user_favorite_coffee_logs
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_coffee_favorite_user_count(p_coffee_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT f.user_id)::bigint
  FROM public.user_favorite_coffee_logs f
  INNER JOIN public.coffee_logs cl
    ON cl.id = f.coffee_log_id
  INNER JOIN public.roast_batches rb
    ON rb.id = cl.batch_id
  WHERE rb.coffee_id = p_coffee_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_coffee_favorite_user_count(uuid) TO authenticated;

COMMIT;
