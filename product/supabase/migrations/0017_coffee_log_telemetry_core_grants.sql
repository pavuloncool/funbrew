-- Ensure API roles can access telemetry core table created via SQL migration
-- Version: 0017
-- Created: 2026-05-08

BEGIN;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.coffee_log_telemetry_core
  TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.coffee_log_telemetry_core
  TO service_role;

COMMIT;
