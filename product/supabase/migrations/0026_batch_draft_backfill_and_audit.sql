-- Backfill orphan coffees into draft batches and add shared-safe data contract audits.
-- Version: 0026
-- Created: 2026-05-31

BEGIN;

UPDATE public.roasters
SET
  name = COALESCE(NULLIF(btrim(company_name), ''), NULLIF(btrim(name), ''), name),
  company_name = COALESCE(NULLIF(btrim(company_name), ''), NULLIF(btrim(name), ''), name)
WHERE
  name IS DISTINCT FROM COALESCE(NULLIF(btrim(company_name), ''), NULLIF(btrim(name), ''), name)
  OR company_name IS DISTINCT FROM COALESCE(NULLIF(btrim(company_name), ''), NULLIF(btrim(name), ''), name);

CREATE OR REPLACE FUNCTION public.sync_roaster_display_names()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  normalized_name text;
BEGIN
  normalized_name := COALESCE(NULLIF(btrim(NEW.company_name), ''), NULLIF(btrim(NEW.name), ''));

  IF normalized_name IS NULL THEN
    RAISE EXCEPTION 'Roaster display name cannot be blank.';
  END IF;

  NEW.name := normalized_name;
  NEW.company_name := normalized_name;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS roasters_sync_display_names_trg ON public.roasters;

CREATE TRIGGER roasters_sync_display_names_trg
BEFORE INSERT OR UPDATE OF name, company_name ON public.roasters
FOR EACH ROW
EXECUTE FUNCTION public.sync_roaster_display_names();

INSERT INTO public.roast_batches (
  coffee_id,
  roast_date,
  lot_number,
  status,
  brewing_notes,
  roaster_story,
  suggested_brew_method_ids,
  suggested_tasting_note_ids,
  created_at,
  updated_at
)
SELECT
  c.id,
  c.created_at::date,
  'LEGACY-' || left(c.id::text, 8),
  'draft'::public.batch_status,
  NULL,
  NULL,
  '{}'::uuid[],
  '{}'::uuid[],
  c.created_at,
  c.updated_at
FROM public.coffees c
WHERE NOT EXISTS (
  SELECT 1
  FROM public.roast_batches b
  WHERE b.coffee_id = c.id
);

CREATE OR REPLACE VIEW public.orphan_coffees_report AS
SELECT
  'coffee_without_batch'::text AS issue_type,
  c.roaster_id,
  c.id AS coffee_id,
  NULL::uuid AS batch_id,
  c.created_at AS detected_at,
  c.name AS summary,
  jsonb_build_object(
    'coffee_status', c.status,
    'coffee_created_at', c.created_at
  ) AS details
FROM public.coffees c
WHERE NOT EXISTS (
  SELECT 1
  FROM public.roast_batches b
  WHERE b.coffee_id = c.id
)

UNION ALL

SELECT
  'roaster_name_mismatch'::text AS issue_type,
  r.id AS roaster_id,
  NULL::uuid AS coffee_id,
  NULL::uuid AS batch_id,
  r.updated_at AS detected_at,
  COALESCE(r.company_name, r.name) AS summary,
  jsonb_build_object(
    'name', r.name,
    'company_name', r.company_name
  ) AS details
FROM public.roasters r
WHERE COALESCE(NULLIF(btrim(r.company_name), ''), NULLIF(btrim(r.name), ''), '') IS DISTINCT FROM COALESCE(NULLIF(btrim(r.name), ''), '')

UNION ALL

SELECT
  'stale_draft_batch'::text AS issue_type,
  c.roaster_id,
  c.id AS coffee_id,
  b.id AS batch_id,
  b.updated_at AS detected_at,
  b.lot_number AS summary,
  jsonb_build_object(
    'coffee_name', c.name,
    'coffee_status', c.status,
    'batch_status', b.status,
    'batch_updated_at', b.updated_at
  ) AS details
FROM public.roast_batches b
JOIN public.coffees c ON c.id = b.coffee_id
WHERE b.status = 'draft'
  AND b.updated_at < (now() - interval '14 days');

COMMENT ON VIEW public.orphan_coffees_report IS
  'Shared-safe audit helper for data states hidden by the batch-first web flow.';

COMMENT ON TABLE public.roaster_coffee_tags IS
  'Legacy compatibility read model. Do not extend for new product behavior.';

COMMENT ON COLUMN public.roasters.street IS
  'Backoffice-only / not used by product runtime as of 2026-05-31.';
COMMENT ON COLUMN public.roasters.building_number IS
  'Backoffice-only / not used by product runtime as of 2026-05-31.';
COMMENT ON COLUMN public.roasters.apartment_number IS
  'Backoffice-only / not used by product runtime as of 2026-05-31.';
COMMENT ON COLUMN public.roasters.postal_code IS
  'Backoffice-only / not used by product runtime as of 2026-05-31.';
COMMENT ON COLUMN public.roasters.regon IS
  'Backoffice-only / not used by product runtime as of 2026-05-31.';
COMMENT ON COLUMN public.roasters.nip IS
  'Backoffice-only / not used by product runtime as of 2026-05-31.';
COMMENT ON COLUMN public.roasters.subscription_status IS
  'Operational/backoffice field. Not used by product runtime as of 2026-05-31.';

COMMIT;
