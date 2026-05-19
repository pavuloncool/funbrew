BEGIN;

CREATE OR REPLACE FUNCTION public.get_roaster_batch_telemetry_summary(p_batch_id uuid)
RETURNS TABLE (
  row_scope text,
  brew_method_id uuid,
  total_logs integer,
  logs_with_telemetry integer,
  avg_sensory_acidity numeric,
  avg_sensory_sweetness numeric,
  avg_sensory_body numeric,
  repurchase_yes_count integer,
  repurchase_no_count integer,
  repurchase_unsure_count integer,
  experience_beginner_count integer,
  experience_advanced_count integer,
  experience_expert_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH owned_batch AS (
    SELECT rb.id AS batch_id
    FROM public.roast_batches rb
    JOIN public.coffees c ON c.id = rb.coffee_id
    JOIN public.roasters r ON r.id = c.roaster_id
    WHERE rb.id = p_batch_id
      AND r.user_id = auth.uid()
  ),
  scoped_logs AS (
    SELECT cl.id, cl.brew_method_id
    FROM public.coffee_logs cl
    JOIN owned_batch ob ON ob.batch_id = cl.batch_id
  ),
  joined AS (
    SELECT
      sl.id AS coffee_log_id,
      sl.brew_method_id,
      tc.coffee_log_id AS telemetry_log_id,
      tc.sensory_acidity,
      tc.sensory_sweetness,
      tc.sensory_body,
      tc.repurchase_intent,
      tc.experience_level
    FROM scoped_logs sl
    LEFT JOIN public.coffee_log_telemetry_core tc
      ON tc.coffee_log_id = sl.id
  )
  SELECT
    CASE WHEN GROUPING(j.brew_method_id) = 1 THEN 'global' ELSE 'brew_method' END AS row_scope,
    CASE WHEN GROUPING(j.brew_method_id) = 1 THEN NULL::uuid ELSE j.brew_method_id END AS brew_method_id,
    COUNT(*)::integer AS total_logs,
    COUNT(j.telemetry_log_id)::integer AS logs_with_telemetry,
    AVG(j.sensory_acidity)::numeric AS avg_sensory_acidity,
    AVG(j.sensory_sweetness)::numeric AS avg_sensory_sweetness,
    AVG(j.sensory_body)::numeric AS avg_sensory_body,
    COUNT(*) FILTER (WHERE j.repurchase_intent = 'yes')::integer AS repurchase_yes_count,
    COUNT(*) FILTER (WHERE j.repurchase_intent = 'no')::integer AS repurchase_no_count,
    COUNT(*) FILTER (WHERE j.repurchase_intent = 'unsure')::integer AS repurchase_unsure_count,
    COUNT(*) FILTER (WHERE j.experience_level = 'beginner')::integer AS experience_beginner_count,
    COUNT(*) FILTER (WHERE j.experience_level = 'advanced')::integer AS experience_advanced_count,
    COUNT(*) FILTER (WHERE j.experience_level = 'expert')::integer AS experience_expert_count
  FROM joined j
  GROUP BY GROUPING SETS ((), (j.brew_method_id))
  HAVING EXISTS (SELECT 1 FROM owned_batch)
  ORDER BY CASE WHEN GROUPING(j.brew_method_id) = 1 THEN 0 ELSE 1 END, j.brew_method_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_roaster_batch_telemetry_summary(uuid) TO authenticated;

COMMIT;
