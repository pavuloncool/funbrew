-- pg_net + Storage buckets (T018)
-- Version: 0004
-- Created: 2026-04-08

BEGIN;

-- Enable pg_net extension if available
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Storage buckets (best-effort; storage schema is provided by Supabase)
-- Buckets used by Phase 3 QR generation flow.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('qr', 'qr', false)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

COMMIT;

