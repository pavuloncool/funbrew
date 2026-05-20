-- Tag QR: public_hash, roaster ownership, immutable hash, RLS for authenticated roasters.
BEGIN;

ALTER TABLE roaster_coffee_tags
    ADD COLUMN IF NOT EXISTS public_hash text,
    ADD COLUMN IF NOT EXISTS roaster_id uuid REFERENCES roasters (id) ON DELETE RESTRICT;

UPDATE roaster_coffee_tags
SET public_hash = gen_random_uuid()::text
WHERE public_hash IS NULL;

ALTER TABLE roaster_coffee_tags
    ALTER COLUMN public_hash SET DEFAULT (gen_random_uuid()::text),
    ALTER COLUMN public_hash SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS roaster_coffee_tags_public_hash_idx ON roaster_coffee_tags (public_hash);

UPDATE roaster_coffee_tags t
SET roaster_id = (
        SELECT r.id
        FROM roasters r
        ORDER BY r.created_at
        LIMIT 1
    )
WHERE t.roaster_id IS NULL
    AND EXISTS (SELECT 1 FROM roasters);

DELETE FROM roaster_coffee_tags
WHERE roaster_id IS NULL;

ALTER TABLE roaster_coffee_tags
    ALTER COLUMN roaster_id SET NOT NULL;

CREATE OR REPLACE FUNCTION roaster_coffee_tags_immutable_public_hash ()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'UPDATE'
        AND NEW.public_hash IS DISTINCT FROM OLD.public_hash THEN
        RAISE EXCEPTION 'public_hash is immutable';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS roaster_coffee_tags_immutable_public_hash_trg ON roaster_coffee_tags;

CREATE TRIGGER roaster_coffee_tags_immutable_public_hash_trg
    BEFORE UPDATE ON roaster_coffee_tags
    FOR EACH ROW
    EXECUTE FUNCTION roaster_coffee_tags_immutable_public_hash();

DROP POLICY IF EXISTS "dev_anon_select_roaster_coffee_tags" ON roaster_coffee_tags;

DROP POLICY IF EXISTS "dev_anon_insert_roaster_coffee_tags" ON roaster_coffee_tags;

DROP POLICY IF EXISTS "dev_anon_update_roaster_coffee_tags" ON roaster_coffee_tags;

CREATE POLICY "authenticated_select_own_roaster_coffee_tags" ON roaster_coffee_tags
    FOR SELECT
    TO authenticated
    USING (EXISTS (
            SELECT 1
            FROM roasters r
            WHERE r.id = roaster_id
                AND r.user_id = auth.uid()));

CREATE POLICY "authenticated_insert_own_roaster_coffee_tags" ON roaster_coffee_tags
    FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
            SELECT 1
            FROM roasters r
            WHERE r.id = roaster_id
                AND r.user_id = auth.uid()));

CREATE POLICY "authenticated_update_own_roaster_coffee_tags" ON roaster_coffee_tags
    FOR UPDATE
    TO authenticated
    USING (EXISTS (
            SELECT 1
            FROM roasters r
            WHERE r.id = roaster_id
                AND r.user_id = auth.uid()))
    WITH CHECK (EXISTS (
            SELECT 1
            FROM roasters r
            WHERE r.id = roaster_id
                AND r.user_id = auth.uid()));

COMMIT;
