-- Seed data (T016)
-- Minimal-but-complete seed for Phase 1–3 demo flows.

BEGIN;

-- Brew methods (10)
INSERT INTO public.brew_methods (name, sort_order) VALUES
  ('V60', 10),
  ('Chemex', 20),
  ('Aeropress', 30),
  ('French Press', 40),
  ('Espresso', 50),
  ('Moka Pot', 60),
  ('Kalita Wave', 70),
  ('Cold Brew', 80),
  ('Cupping', 90),
  ('Other', 100)
ON CONFLICT (name) DO NOTHING;

-- Tasting notes taxonomy (12, canonical)
INSERT INTO public.tasting_notes (name, label, category, sort_order) VALUES
  ('berry', 'Berry', 'fruity', 1),
  ('citrus', 'Citrus', 'fruity', 2),
  ('stone-fruit', 'Stone Fruit', 'fruity', 3),
  ('floral', 'Floral', 'floral', 4),
  ('jasmine', 'Jasmine', 'floral', 5),
  ('chocolate', 'Chocolate', 'sweet', 6),
  ('caramel', 'Caramel', 'sweet', 7),
  ('honey', 'Honey', 'sweet', 8),
  ('brown-sugar', 'Brown Sugar', 'sweet', 9),
  ('almond', 'Almond', 'nutty', 10),
  ('hazelnut', 'Hazelnut', 'nutty', 11),
  ('cinnamon', 'Cinnamon', 'spice', 12)
ON CONFLICT (name) DO NOTHING;

-- Seed verified roasters + active coffees/batches/QRs for QR and discovery MVP.
DO $$
DECLARE
  v_demo_roaster_id uuid;
  v_tide_roaster_id uuid;
  v_forest_roaster_id uuid;
BEGIN
  -- Local Auth seed: create fully usable email/password accounts for db reset.
  -- These rows mirror the minimum shape created by Supabase Auth so signInWithPassword works.
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    email_change_token_current,
    reauthentication_token,
    is_sso_user,
    is_anonymous
  )
  VALUES
    (
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000001',
      'authenticated',
      'authenticated',
      'bart@ex.com',
      crypt('swetry', gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"app_role":"roaster","display_name":"Bart","email_verified":true}'::jsonb,
      now(),
      now(),
      '',
      '',
      false,
      false
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000002',
      'authenticated',
      'authenticated',
      'tide@example.com',
      crypt('swetry', gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"app_role":"roaster","display_name":"Morning Tide","email_verified":true}'::jsonb,
      now(),
      now(),
      '',
      '',
      false,
      false
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000003',
      'authenticated',
      'authenticated',
      'forest@example.com',
      crypt('swetry', gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"app_role":"roaster","display_name":"Forest Roast","email_verified":true}'::jsonb,
      now(),
      now(),
      '',
      '',
      false,
      false
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000101',
      'authenticated',
      'authenticated',
      'kazik@neoneon.online',
      crypt('swetry', gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"app_role":"consumer","display_name":"Kazik","email_verified":true}'::jsonb,
      now(),
      now(),
      '',
      '',
      false,
      false
    )
  ON CONFLICT (id) DO UPDATE
  SET
    instance_id = EXCLUDED.instance_id,
    aud = EXCLUDED.aud,
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    confirmation_token = EXCLUDED.confirmation_token,
    recovery_token = EXCLUDED.recovery_token,
    email_change_token_new = EXCLUDED.email_change_token_new,
    email_change = EXCLUDED.email_change,
    raw_app_meta_data = EXCLUDED.raw_app_meta_data,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    created_at = COALESCE(auth.users.created_at, EXCLUDED.created_at),
    updated_at = EXCLUDED.updated_at,
    email_change_token_current = EXCLUDED.email_change_token_current,
    reauthentication_token = EXCLUDED.reauthentication_token,
    is_sso_user = EXCLUDED.is_sso_user,
    is_anonymous = EXCLUDED.is_anonymous;

  INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES
    (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001',
      '{"sub":"00000000-0000-0000-0000-000000000001","email":"bart@ex.com","email_verified":false,"phone_verified":false}'::jsonb,
      'email',
      now(),
      now(),
      now()
    ),
    (
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000002',
      '{"sub":"00000000-0000-0000-0000-000000000002","email":"tide@example.com","email_verified":false,"phone_verified":false}'::jsonb,
      'email',
      now(),
      now(),
      now()
    ),
    (
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000003',
      '{"sub":"00000000-0000-0000-0000-000000000003","email":"forest@example.com","email_verified":false,"phone_verified":false}'::jsonb,
      'email',
      now(),
      now(),
      now()
    ),
    (
      '00000000-0000-0000-0000-000000000101',
      '00000000-0000-0000-0000-000000000101',
      '{"sub":"00000000-0000-0000-0000-000000000101","email":"kazik@neoneon.online","email_verified":false,"phone_verified":false}'::jsonb,
      'email',
      now(),
      now(),
      now()
    )
  ON CONFLICT (provider_id, provider) DO UPDATE
  SET
    user_id = EXCLUDED.user_id,
    identity_data = EXCLUDED.identity_data,
    last_sign_in_at = EXCLUDED.last_sign_in_at,
    updated_at = now();

  INSERT INTO public.users (id, display_name)
  VALUES ('00000000-0000-0000-0000-000000000101', 'Kazik')
  ON CONFLICT (id) DO UPDATE
  SET display_name = EXCLUDED.display_name;

  INSERT INTO public.roasters (
    user_id,
    name,
    country,
    city,
    description,
    website,
    roaster_short_name,
    verification_status
  )
  VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Demo Roaster',
    'PL',
    'Warsaw',
    'Warsaw roaster focused on bright filter profiles.',
    'https://demo-roaster.example.com',
    'Demo',
    'verified'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    name = EXCLUDED.name,
    country = EXCLUDED.country,
    city = EXCLUDED.city,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    roaster_short_name = EXCLUDED.roaster_short_name,
    verification_status = EXCLUDED.verification_status
  RETURNING id INTO v_demo_roaster_id;

  INSERT INTO public.roasters (
    user_id,
    name,
    country,
    city,
    description,
    website,
    roaster_short_name,
    verification_status
  )
  VALUES (
    '00000000-0000-0000-0000-000000000002',
    'Morning Tide Roasters',
    'DE',
    'Berlin',
    'Berlin team publishing fruit-forward coffees for espresso and filter.',
    'https://morning-tide.example.com',
    'Morning Tide',
    'verified'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    name = EXCLUDED.name,
    country = EXCLUDED.country,
    city = EXCLUDED.city,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    roaster_short_name = EXCLUDED.roaster_short_name,
    verification_status = EXCLUDED.verification_status
  RETURNING id INTO v_tide_roaster_id;

  INSERT INTO public.roasters (
    user_id,
    name,
    country,
    city,
    description,
    website,
    roaster_short_name,
    verification_status
  )
  VALUES (
    '00000000-0000-0000-0000-000000000003',
    'Forest Roast Lab',
    'SE',
    'Stockholm',
    'Small Nordic roaster with clean, floral seasonal releases.',
    'https://forest-roast.example.com',
    'Forest Roast',
    'verified'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    name = EXCLUDED.name,
    country = EXCLUDED.country,
    city = EXCLUDED.city,
    description = EXCLUDED.description,
    website = EXCLUDED.website,
    roaster_short_name = EXCLUDED.roaster_short_name,
    verification_status = EXCLUDED.verification_status
  RETURNING id INTO v_forest_roaster_id;

  INSERT INTO public.origins (id, country, region, farm, altitude_min, altitude_max, producer)
  VALUES
    ('20000000-0000-0000-0000-000000000001', 'Ethiopia', 'Yirgacheffe', 'Demo Farm', 1800, 2200, 'Demo Producer'),
    ('20000000-0000-0000-0000-000000000002', 'Colombia', 'Huila', 'Las Flores', 1650, 1900, 'Ana Gutierrez'),
    ('20000000-0000-0000-0000-000000000003', 'Kenya', 'Kirinyaga', 'Kangocho', 1700, 1900, 'Baragwi Cooperative'),
    ('20000000-0000-0000-0000-000000000004', 'Peru', 'Cajamarca', 'El Mirador', 1750, 2050, 'Luis Ramirez'),
    ('20000000-0000-0000-0000-000000000005', 'Rwanda', 'Nyamasheke', 'Gatare', 1750, 2100, 'Aline Mukamana')
  ON CONFLICT (id) DO UPDATE
  SET
    country = EXCLUDED.country,
    region = EXCLUDED.region,
    farm = EXCLUDED.farm,
    altitude_min = EXCLUDED.altitude_min,
    altitude_max = EXCLUDED.altitude_max,
    producer = EXCLUDED.producer;

  INSERT INTO public.coffees (
    id,
    roaster_id,
    origin_id,
    name,
    variety,
    processing_method,
    producer_notes,
    status,
    cover_image_url
  )
  VALUES
    (
      '30000000-0000-0000-0000-000000000001',
      v_demo_roaster_id,
      '20000000-0000-0000-0000-000000000001',
      'Demo Coffee',
      'Heirloom',
      'washed',
      'Seeded coffee for QR scan and discovery MVP.',
      'active',
      'https://images.example.com/demo-coffee.jpg'
    ),
    (
      '30000000-0000-0000-0000-000000000002',
      v_demo_roaster_id,
      '20000000-0000-0000-0000-000000000002',
      'Huila Sunset',
      'Caturra',
      'honey',
      'Sweet and syrupy espresso release.',
      'active',
      'https://images.example.com/huila-sunset.jpg'
    ),
    (
      '30000000-0000-0000-0000-000000000003',
      v_tide_roaster_id,
      '20000000-0000-0000-0000-000000000003',
      'Kirinyaga Burst',
      'SL28',
      'natural',
      'Bright berry-forward filter lot.',
      'active',
      'https://images.example.com/kirinyaga-burst.jpg'
    ),
    (
      '30000000-0000-0000-0000-000000000004',
      v_tide_roaster_id,
      '20000000-0000-0000-0000-000000000004',
      'Cajamarca Bloom',
      'Bourbon',
      'washed',
      'Clean cup built for daily V60 brewing.',
      'active',
      'https://images.example.com/cajamarca-bloom.jpg'
    ),
    (
      '30000000-0000-0000-0000-000000000005',
      v_forest_roaster_id,
      '20000000-0000-0000-0000-000000000005',
      'Gatare Night',
      'Red Bourbon',
      'anaerobic',
      'Expressive seasonal release with a dense body.',
      'active',
      'https://images.example.com/gatare-night.jpg'
    )
  ON CONFLICT (id) DO UPDATE
  SET
    roaster_id = EXCLUDED.roaster_id,
    origin_id = EXCLUDED.origin_id,
    name = EXCLUDED.name,
    variety = EXCLUDED.variety,
    processing_method = EXCLUDED.processing_method,
    producer_notes = EXCLUDED.producer_notes,
    status = EXCLUDED.status,
    cover_image_url = EXCLUDED.cover_image_url;

  INSERT INTO public.roast_batches (
    id,
    coffee_id,
    roast_date,
    lot_number,
    status,
    brewing_notes,
    roaster_story
  )
  VALUES
    (
      '40000000-0000-0000-0000-000000000001',
      '30000000-0000-0000-0000-000000000001',
      DATE '2026-05-01',
      'LOT-0001',
      'active',
      'Start at 1:16 and 93C for a bright, tea-like cup.',
      'Our benchmark washed Ethiopian release for onboarding and QR demo.'
    ),
    (
      '40000000-0000-0000-0000-000000000002',
      '30000000-0000-0000-0000-000000000002',
      DATE '2026-04-28',
      'LOT-0002',
      'active',
      'Built for espresso at 1:2.2 with a slightly longer preinfusion.',
      'A sweeter Colombian lot for the first discovery shelf.'
    ),
    (
      '40000000-0000-0000-0000-000000000003',
      '30000000-0000-0000-0000-000000000003',
      DATE '2026-04-25',
      'LOT-0003',
      'active',
      'Use a medium-coarse grind to keep the fruit clean.',
      'Morning Tide uses this lot to represent the fruit side of its lineup.'
    ),
    (
      '40000000-0000-0000-0000-000000000004',
      '30000000-0000-0000-0000-000000000004',
      DATE '2026-04-22',
      'LOT-0004',
      'active',
      'Best at 1:15.5 for sweetness and structure.',
      'A stable daily filter coffee for discovery and first-taste comparisons.'
    ),
    (
      '40000000-0000-0000-0000-000000000005',
      '30000000-0000-0000-0000-000000000005',
      DATE '2026-04-20',
      'LOT-0005',
      'active',
      'Try immersion or Aeropress to push body and spice.',
      'Forest Roast uses this release to show a more experimental profile.'
    )
  ON CONFLICT (id) DO UPDATE
  SET
    coffee_id = EXCLUDED.coffee_id,
    roast_date = EXCLUDED.roast_date,
    lot_number = EXCLUDED.lot_number,
    status = EXCLUDED.status,
    brewing_notes = EXCLUDED.brewing_notes,
    roaster_story = EXCLUDED.roaster_story;

  INSERT INTO public.qr_codes (
    id,
    batch_id,
    hash,
    qr_url,
    svg_storage_path,
    png_storage_path
  )
  VALUES
    (
      '50000000-0000-0000-0000-000000000001',
      '40000000-0000-0000-0000-000000000001',
      '11111111-1111-1111-1111-111111111111',
      'https://funcup.app/q/11111111-1111-1111-1111-111111111111',
      'qr/demo/demo-coffee.svg',
      'qr/demo/demo-coffee.png'
    ),
    (
      '50000000-0000-0000-0000-000000000002',
      '40000000-0000-0000-0000-000000000002',
      '22222222-2222-2222-2222-222222222222',
      'https://funcup.app/q/22222222-2222-2222-2222-222222222222',
      'qr/demo/huila-sunset.svg',
      'qr/demo/huila-sunset.png'
    ),
    (
      '50000000-0000-0000-0000-000000000003',
      '40000000-0000-0000-0000-000000000003',
      '33333333-3333-3333-3333-333333333333',
      'https://funcup.app/q/33333333-3333-3333-3333-333333333333',
      'qr/demo/kirinyaga-burst.svg',
      'qr/demo/kirinyaga-burst.png'
    ),
    (
      '50000000-0000-0000-0000-000000000004',
      '40000000-0000-0000-0000-000000000004',
      '44444444-4444-4444-4444-444444444444',
      'https://funcup.app/q/44444444-4444-4444-4444-444444444444',
      'qr/demo/cajamarca-bloom.svg',
      'qr/demo/cajamarca-bloom.png'
    ),
    (
      '50000000-0000-0000-0000-000000000005',
      '40000000-0000-0000-0000-000000000005',
      '55555555-5555-5555-5555-555555555555',
      'https://funcup.app/q/55555555-5555-5555-5555-555555555555',
      'qr/demo/gatare-night.svg',
      'qr/demo/gatare-night.png'
    )
  ON CONFLICT (id) DO UPDATE
  SET
    batch_id = EXCLUDED.batch_id,
    hash = EXCLUDED.hash,
    qr_url = EXCLUDED.qr_url,
    svg_storage_path = EXCLUDED.svg_storage_path,
    png_storage_path = EXCLUDED.png_storage_path;
END $$;

COMMIT;
