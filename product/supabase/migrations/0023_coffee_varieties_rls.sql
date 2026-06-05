BEGIN;

ALTER TABLE public.coffee_varieties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_variety_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read coffee varieties"
    ON public.coffee_varieties
    FOR SELECT
    USING (true);

CREATE POLICY "Anyone can read active coffee variety assignments"
    ON public.coffee_variety_assignments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.coffees c
            JOIN public.roasters r ON r.id = c.roaster_id
            WHERE c.id = coffee_id
              AND c.status = 'active'
              AND r.verification_status = 'verified'
        )
    );

CREATE POLICY "Roaster owners can manage coffee variety assignments"
    ON public.coffee_variety_assignments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.coffees c
            JOIN public.roasters r ON r.id = c.roaster_id
            WHERE c.id = coffee_id
              AND r.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.coffees c
            JOIN public.roasters r ON r.id = c.roaster_id
            WHERE c.id = coffee_id
              AND r.user_id = auth.uid()
        )
    );

COMMIT;
