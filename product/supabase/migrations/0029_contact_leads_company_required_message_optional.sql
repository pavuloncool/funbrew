BEGIN;

UPDATE public.contact_leads
SET company = COALESCE(NULLIF(btrim(company), ''), full_name)
WHERE company IS NULL OR btrim(company) = '';

ALTER TABLE public.contact_leads
  DROP CONSTRAINT IF EXISTS contact_leads_company_check,
  DROP CONSTRAINT IF EXISTS contact_leads_message_check;

ALTER TABLE public.contact_leads
  ALTER COLUMN company SET NOT NULL,
  ALTER COLUMN message DROP NOT NULL;

ALTER TABLE public.contact_leads
  ADD CONSTRAINT contact_leads_company_check
    CHECK (char_length(company) BETWEEN 1 AND 160),
  ADD CONSTRAINT contact_leads_message_check
    CHECK (message IS NULL OR char_length(message) BETWEEN 1 AND 4000);

COMMIT;
