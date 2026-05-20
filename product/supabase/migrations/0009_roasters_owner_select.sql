-- Roaster owners must read their own row while verification_status is still 'pending'.
-- Existing policy only exposes verified roasters to the public SELECT path.
BEGIN;

CREATE POLICY "Users can select own roaster" ON roasters
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

COMMIT;
