-- Assign immutable random customer numbers to roaster accounts.
-- Version: 0032
-- Created: 2026-06-05

BEGIN;

CREATE TABLE IF NOT EXISTS public.roaster_customer_number_registry (
  customer_number text PRIMARY KEY CHECK (customer_number ~ '^\d{6}$'),
  roaster_id uuid UNIQUE NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roasters
  ADD COLUMN IF NOT EXISTS customer_number text;

ALTER TABLE public.roasters
  DROP CONSTRAINT IF EXISTS roasters_customer_number_format;

ALTER TABLE public.roasters
  ADD CONSTRAINT roasters_customer_number_format
  CHECK (customer_number IS NULL OR customer_number ~ '^\d{6}$');

CREATE OR REPLACE FUNCTION public.claim_roaster_customer_number(p_roaster_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  existing_number text;
  candidate_number text;
  attempt_count integer := 0;
BEGIN
  IF p_roaster_id IS NULL THEN
    RAISE EXCEPTION 'claim_roaster_customer_number requires roaster_id';
  END IF;

  SELECT customer_number
  INTO existing_number
  FROM public.roaster_customer_number_registry
  WHERE roaster_id = p_roaster_id;

  IF existing_number IS NOT NULL THEN
    RETURN existing_number;
  END IF;

  LOOP
    attempt_count := attempt_count + 1;
    IF attempt_count > 128 THEN
      RAISE EXCEPTION 'Unable to allocate a unique customer number after % attempts.', attempt_count - 1;
    END IF;

    candidate_number := lpad(floor(random() * 1000000)::text, 6, '0');

    BEGIN
      INSERT INTO public.roaster_customer_number_registry (customer_number, roaster_id)
      VALUES (candidate_number, p_roaster_id);

      RETURN candidate_number;
    EXCEPTION
      WHEN unique_violation THEN
        SELECT customer_number
        INTO existing_number
        FROM public.roaster_customer_number_registry
        WHERE roaster_id = p_roaster_id;

        IF existing_number IS NOT NULL THEN
          RETURN existing_number;
        END IF;
    END;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_roaster_customer_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.customer_number IS NOT NULL AND btrim(NEW.customer_number) <> '' THEN
    RAISE EXCEPTION 'customer_number is assigned automatically and cannot be provided explicitly.';
  END IF;

  NEW.customer_number := public.claim_roaster_customer_number(NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_roaster_customer_number_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.customer_number IS DISTINCT FROM OLD.customer_number THEN
    RAISE EXCEPTION 'customer_number is immutable once assigned.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS roasters_assign_customer_number_trg ON public.roasters;
CREATE TRIGGER roasters_assign_customer_number_trg
BEFORE INSERT ON public.roasters
FOR EACH ROW
EXECUTE FUNCTION public.assign_roaster_customer_number();

UPDATE public.roasters
SET customer_number = public.claim_roaster_customer_number(id)
WHERE customer_number IS NULL OR btrim(customer_number) = '';

INSERT INTO public.roaster_customer_number_registry (customer_number, roaster_id)
SELECT r.customer_number, r.id
FROM public.roasters r
LEFT JOIN public.roaster_customer_number_registry registry
  ON registry.roaster_id = r.id
WHERE r.customer_number IS NOT NULL
  AND registry.roaster_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS roasters_customer_number_key
  ON public.roasters (customer_number);

ALTER TABLE public.roasters
  ALTER COLUMN customer_number SET NOT NULL;

DROP TRIGGER IF EXISTS roasters_prevent_customer_number_change_trg ON public.roasters;
CREATE TRIGGER roasters_prevent_customer_number_change_trg
BEFORE UPDATE OF customer_number ON public.roasters
FOR EACH ROW
EXECUTE FUNCTION public.prevent_roaster_customer_number_change();

COMMIT;
