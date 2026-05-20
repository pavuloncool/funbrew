-- Roaster coffee tag payload for QR flow (local mockup: permissive RLS for anon).
-- TODO production: replace anon policies with auth.uid() / roaster ownership checks.

BEGIN;

CREATE TABLE roaster_coffee_tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    roaster_short_name text NOT NULL,
    img_coffee_label text NOT NULL,
    bean_origin_country text NOT NULL,
    bean_origin_farm text NOT NULL,
    bean_origin_tradename text NOT NULL,
    bean_origin_region text NOT NULL,
    bean_type text NOT NULL,
    bean_varietal_main text NOT NULL,
    bean_varietal_extra text NOT NULL,
    bean_origin_height integer NOT NULL,
    bean_processing text NOT NULL,
    bean_roast_date date NOT NULL,
    bean_roast_level text NOT NULL,
    brew_method text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT roaster_short_name_len CHECK (char_length(roaster_short_name) <= 64),
    CONSTRAINT img_coffee_label_len CHECK (char_length(img_coffee_label) <= 2048),
    CONSTRAINT bean_origin_farm_len CHECK (char_length(bean_origin_farm) <= 96),
    CONSTRAINT bean_origin_tradename_len CHECK (char_length(bean_origin_tradename) <= 48),
    CONSTRAINT bean_origin_region_len CHECK (char_length(bean_origin_region) <= 96),
    CONSTRAINT bean_varietal_main_len CHECK (char_length(bean_varietal_main) <= 48),
    CONSTRAINT bean_varietal_extra_len CHECK (char_length(bean_varietal_extra) <= 48),
    CONSTRAINT bean_origin_height_range CHECK (
        bean_origin_height >= 0 AND bean_origin_height <= 3000
    ),
    CONSTRAINT bean_type_allowed CHECK (bean_type IN ('arabica', 'robusta'))
);

CREATE INDEX roaster_coffee_tags_created_at_idx ON roaster_coffee_tags (created_at DESC);

ALTER TABLE roaster_coffee_tags ENABLE ROW LEVEL SECURITY;

-- DEV ONLY: allow unauthenticated clients to read/write for local mockup.
CREATE POLICY "dev_anon_select_roaster_coffee_tags" ON roaster_coffee_tags
    FOR SELECT TO anon USING (true);

CREATE POLICY "dev_anon_insert_roaster_coffee_tags" ON roaster_coffee_tags
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "dev_anon_update_roaster_coffee_tags" ON roaster_coffee_tags
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

COMMIT;
