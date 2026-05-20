-- US6: Roaster analytics — read tastings for batches owned by the signed-in roaster.
BEGIN;

CREATE POLICY "Roaster owners can read coffee logs for their batches" ON coffee_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1
            FROM roast_batches rb
            JOIN coffees c ON c.id = rb.coffee_id
            JOIN roasters r ON r.id = c.roaster_id
            WHERE rb.id = batch_id AND r.user_id = auth.uid()
        )
    );

CREATE POLICY "Roaster owners can read tasting notes for their batch logs" ON tasting_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1
            FROM coffee_logs cl
            JOIN roast_batches rb ON rb.id = cl.batch_id
            JOIN coffees c ON c.id = rb.coffee_id
            JOIN roasters r ON r.id = c.roaster_id
            WHERE cl.id = coffee_log_id AND r.user_id = auth.uid()
        )
    );

COMMIT;
