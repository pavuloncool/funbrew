-- Public bucket for roaster coffee label images (tag flow / QR).
BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('coffee-labels', 'coffee-labels', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Dev-friendly policies (align with roaster_coffee_tags anon insert mockup).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'storage') THEN
    DROP POLICY IF EXISTS "coffee_labels_public_read" ON storage.objects;
    CREATE POLICY "coffee_labels_public_read"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'coffee-labels');

    DROP POLICY IF EXISTS "coffee_labels_anon_insert" ON storage.objects;
    CREATE POLICY "coffee_labels_anon_insert"
      ON storage.objects FOR INSERT
      TO anon
      WITH CHECK (bucket_id = 'coffee-labels');

    DROP POLICY IF EXISTS "coffee_labels_auth_insert" ON storage.objects;
    CREATE POLICY "coffee_labels_auth_insert"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'coffee-labels');
  END IF;
END $$;

COMMIT;
