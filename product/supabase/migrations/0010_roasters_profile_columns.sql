BEGIN;

ALTER TABLE roasters
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS roaster_short_name text,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS building_number text,
  ADD COLUMN IF NOT EXISTS apartment_number text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS regon text,
  ADD COLUMN IF NOT EXISTS nip text,
  ADD COLUMN IF NOT EXISTS subscription_status text;

UPDATE roasters
SET company_name = COALESCE(NULLIF(company_name, ''), name)
WHERE COALESCE(company_name, '') = '';

UPDATE roasters
SET subscription_status = COALESCE(NULLIF(subscription_status, ''), 'placeholder')
WHERE COALESCE(subscription_status, '') = '';

COMMIT;
