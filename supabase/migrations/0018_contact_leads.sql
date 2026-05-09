-- Beta contact form lead persistence
-- Version: 0018
-- Created: 2026-05-09

BEGIN;

CREATE TABLE IF NOT EXISTS public.contact_leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 320),
  company text CHECK (company IS NULL OR char_length(company) <= 160),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 4000),
  source text NOT NULL DEFAULT 'web_public_beta' CHECK (char_length(source) <= 64),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contact_leads_created_at_idx
  ON public.contact_leads (created_at DESC);

CREATE INDEX IF NOT EXISTS contact_leads_email_idx
  ON public.contact_leads (lower(email));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'contact_leads_updated_at'
  ) THEN
    CREATE TRIGGER contact_leads_updated_at
      BEFORE UPDATE ON public.contact_leads
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;

ALTER TABLE public.contact_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage contact leads" ON public.contact_leads;
CREATE POLICY "Service role can manage contact leads" ON public.contact_leads
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON TABLE public.contact_leads FROM anon;
REVOKE ALL ON TABLE public.contact_leads FROM authenticated;

GRANT SELECT, INSERT, UPDATE
  ON TABLE public.contact_leads
  TO service_role;

COMMIT;
