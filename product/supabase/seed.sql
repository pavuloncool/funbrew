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

DO $$
DECLARE
  v_bart_user_id constant uuid := '00000000-0000-0000-0000-000000000001';
  v_kazik_user_id constant uuid := '00000000-0000-0000-0000-000000000101';
  v_removed_roaster_user_ids constant uuid[] := ARRAY[
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid
  ];
  v_new_roaster_ids constant uuid[] := ARRAY[
    '00000000-0000-0000-0000-000000000011'::uuid,
    '00000000-0000-0000-0000-000000000012'::uuid,
    '00000000-0000-0000-0000-000000000013'::uuid,
    '00000000-0000-0000-0000-000000000014'::uuid
  ];
  v_new_consumer_ids constant uuid[] := ARRAY[
    '00000000-0000-0000-0000-000000000102'::uuid,
    '00000000-0000-0000-0000-000000000103'::uuid,
    '00000000-0000-0000-0000-000000000104'::uuid,
    '00000000-0000-0000-0000-000000000105'::uuid,
    '00000000-0000-0000-0000-000000000106'::uuid,
    '00000000-0000-0000-0000-000000000107'::uuid,
    '00000000-0000-0000-0000-000000000108'::uuid,
    '00000000-0000-0000-0000-000000000109'::uuid,
    '00000000-0000-0000-0000-000000000110'::uuid
  ];
  v_double_batch_indices constant integer[] := ARRAY[2, 5, 8, 12, 16, 19];
  v_avatar_prefix constant text := 'avatar:dicebear:toon-head:';
  v_roaster_specs constant jsonb := '[
    {
      "user_id":"00000000-0000-0000-0000-000000000011",
      "email":"luma@funcup.local",
      "display_name":"Maja Luma",
      "name":"Luma Peak Coffee",
      "company_name":"Luma Peak Coffee Sp. z o.o.",
      "short_name":"Luma Peak",
      "country":"JP",
      "city":"Tokyo",
      "description":"Tokyo roasting studio focused on precise washed lots and low-solubility filter releases.",
      "website":"https://luma-peak.example.com",
      "street":"Aoyama-dori",
      "building_number":"18-4",
      "apartment_number":"7A",
      "postal_code":"107-0062",
      "regon":"120000001",
      "nip":"7010000001",
      "subscription_status":"beta"
    },
    {
      "user_id":"00000000-0000-0000-0000-000000000012",
      "email":"selva@funcup.local",
      "display_name":"Diego Selva",
      "name":"Selva Fina Roastery",
      "company_name":"Selva Fina Roastery Ltd.",
      "short_name":"Selva Fina",
      "country":"CO",
      "city":"Bogota",
      "description":"Bogota team shipping fruit-driven experimental lots with transparent producer storytelling.",
      "website":"https://selva-fina.example.com",
      "street":"Carrera 11",
      "building_number":"94-21",
      "apartment_number":"4",
      "postal_code":"110221",
      "regon":"120000002",
      "nip":"7010000002",
      "subscription_status":"beta"
    },
    {
      "user_id":"00000000-0000-0000-0000-000000000013",
      "email":"fjord@funcup.local",
      "display_name":"Ingrid Fjord",
      "name":"Fjord Ember Coffee",
      "company_name":"Fjord Ember Coffee AS",
      "short_name":"Fjord Ember",
      "country":"NO",
      "city":"Oslo",
      "description":"Nordic roaster building clean seasonal menus around delicate florals and elegant sweetness.",
      "website":"https://fjord-ember.example.com",
      "street":"Dronning Eufemias gate",
      "building_number":"31",
      "apartment_number":"2B",
      "postal_code":"0191",
      "regon":"120000003",
      "nip":"7010000003",
      "subscription_status":"beta"
    },
    {
      "user_id":"00000000-0000-0000-0000-000000000014",
      "email":"mesa@funcup.local",
      "display_name":"Camila Mesa",
      "name":"Mesa Solar Coffee",
      "company_name":"Mesa Solar Coffee LLC",
      "short_name":"Mesa Solar",
      "country":"US",
      "city":"Austin",
      "description":"Austin-based roast lab balancing approachable espresso releases with structured omniroast projects.",
      "website":"https://mesa-solar.example.com",
      "street":"South Lamar Blvd",
      "building_number":"2401",
      "apartment_number":"12",
      "postal_code":"78704",
      "regon":"120000004",
      "nip":"7010000004",
      "subscription_status":"beta"
    }
  ]'::jsonb;
  v_consumer_specs constant jsonb := '[
    {
      "user_id":"00000000-0000-0000-0000-000000000101",
      "email":"kazik@neoneon.online",
      "display_name":"Kazik",
      "country":"PL",
      "avatar_id":"atlas",
      "favorite_brew_method":"V60",
      "favorite_tasting_notes":["berry","citrus","honey"],
      "experience_level":"advanced"
    },
    {
      "user_id":"00000000-0000-0000-0000-000000000102",
      "email":"nora@funcup.local",
      "display_name":"Nora Vale",
      "country":"FR",
      "avatar_id":"nova",
      "favorite_brew_method":"Chemex",
      "favorite_tasting_notes":["floral","jasmine","stone-fruit"],
      "experience_level":"advanced"
    },
    {
      "user_id":"00000000-0000-0000-0000-000000000103",
      "email":"mateo@funcup.local",
      "display_name":"Mateo Ruiz",
      "country":"ES",
      "avatar_id":"rio",
      "favorite_brew_method":"Espresso",
      "favorite_tasting_notes":["chocolate","caramel","almond"],
      "experience_level":"expert"
    },
    {
      "user_id":"00000000-0000-0000-0000-000000000104",
      "email":"sana@funcup.local",
      "display_name":"Sana Ito",
      "country":"JP",
      "avatar_id":"sage",
      "favorite_brew_method":"Aeropress",
      "favorite_tasting_notes":["citrus","jasmine","honey"],
      "experience_level":"advanced"
    },
    {
      "user_id":"00000000-0000-0000-0000-000000000105",
      "email":"thiago@funcup.local",
      "display_name":"Thiago Luz",
      "country":"BR",
      "avatar_id":"echo",
      "favorite_brew_method":"Moka Pot",
      "favorite_tasting_notes":["brown-sugar","hazelnut","cinnamon"],
      "experience_level":"beginner"
    },
    {
      "user_id":"00000000-0000-0000-0000-000000000106",
      "email":"amina@funcup.local",
      "display_name":"Amina Diallo",
      "country":"SN",
      "avatar_id":"lumen",
      "favorite_brew_method":"Cold Brew",
      "favorite_tasting_notes":["berry","chocolate","brown-sugar"],
      "experience_level":"advanced"
    },
    {
      "user_id":"00000000-0000-0000-0000-000000000107",
      "email":"luca@funcup.local",
      "display_name":"Luca Bernaschi",
      "country":"IT",
      "avatar_id":"kai",
      "favorite_brew_method":"Kalita Wave",
      "favorite_tasting_notes":["caramel","almond","hazelnut"],
      "experience_level":"advanced"
    },
    {
      "user_id":"00000000-0000-0000-0000-000000000108",
      "email":"hana@funcup.local",
      "display_name":"Hana Novak",
      "country":"CZ",
      "avatar_id":"mika",
      "favorite_brew_method":"French Press",
      "favorite_tasting_notes":["stone-fruit","honey","cinnamon"],
      "experience_level":"beginner"
    },
    {
      "user_id":"00000000-0000-0000-0000-000000000109",
      "email":"noah@funcup.local",
      "display_name":"Noah Brooks",
      "country":"GB",
      "avatar_id":"atlas",
      "favorite_brew_method":"Espresso",
      "favorite_tasting_notes":["chocolate","citrus","almond"],
      "experience_level":"expert"
    },
    {
      "user_id":"00000000-0000-0000-0000-000000000110",
      "email":"leila@funcup.local",
      "display_name":"Leila Haddad",
      "country":"MA",
      "avatar_id":"nova",
      "favorite_brew_method":"V60",
      "favorite_tasting_notes":["floral","berry","brown-sugar"],
      "experience_level":"advanced"
    }
  ]'::jsonb;
  v_coffee_specs constant jsonb := '[
    {"roaster_user_id":"00000000-0000-0000-0000-000000000011","name":"Hoshizora Bloom","country":"Ethiopia","region":"Gedeb","farm":"Halo Beriti","producer":"Alemayehu Kassa","altitude_min":1950,"altitude_max":2150,"variety":"74110","processing":"washed","producer_notes":"Transparent jasmine and citrus profile built for luminous brews.","cover":"https://images.example.com/luma-hoshizora-bloom.jpg"},
    {"roaster_user_id":"00000000-0000-0000-0000-000000000011","name":"Kissa Morning","country":"Rwanda","region":"Nyamasheke","farm":"Kanzu Hill","producer":"Claire Uwera","altitude_min":1820,"altitude_max":2050,"variety":"Red Bourbon","processing":"honey","producer_notes":"Honey-processed lot with nectarine sweetness and black tea finish.","cover":"https://images.example.com/luma-kissa-morning.jpg"},
    {"roaster_user_id":"00000000-0000-0000-0000-000000000011","name":"Shibuya Ember","country":"Kenya","region":"Nyeri","farm":"Gachatha","producer":"Mutahi Farmers Coop","altitude_min":1720,"altitude_max":1880,"variety":"SL28","processing":"washed","producer_notes":"Structured red fruit lot for precise brewers and layered acidity.","cover":"https://images.example.com/luma-shibuya-ember.jpg"},
    {"roaster_user_id":"00000000-0000-0000-0000-000000000011","name":"Lantern Orchard","country":"Colombia","region":"Caldas","farm":"La Esperanza","producer":"Daniela Mejia","altitude_min":1680,"altitude_max":1940,"variety":"Pink Bourbon","processing":"anaerobic","producer_notes":"Perfumed tropical profile with dense sweetness and long finish.","cover":"https://images.example.com/luma-lantern-orchard.jpg"},
    {"roaster_user_id":"00000000-0000-0000-0000-000000000011","name":"Paper Crane Decaf","country":"Mexico","region":"Chiapas","farm":"Finca Aurora","producer":"Lucero Jimenez","altitude_min":1500,"altitude_max":1780,"variety":"Typica","processing":"other","producer_notes":"Sugarcane decaf with praline sweetness and calm citrus sparkle.","cover":"https://images.example.com/luma-paper-crane-decaf.jpg"},
    {"roaster_user_id":"00000000-0000-0000-0000-000000000012","name":"Cerro Limon","country":"Colombia","region":"Huila","farm":"Cerro Limon","producer":"Julian Pardo","altitude_min":1720,"altitude_max":1960,"variety":"Caturra","processing":"washed","producer_notes":"Sweet lime acidity, panela depth and clean stone-fruit finish.","cover":"https://images.example.com/selva-cerro-limon.jpg"},
    {"roaster_user_id":"00000000-0000-0000-0000-000000000012","name":"Guayacan Nectar","country":"Colombia","region":"Narino","farm":"El Guayacan","producer":"Rosa Cabrera","altitude_min":1880,"altitude_max":2140,"variety":"Bourbon Aji","processing":"honey","producer_notes":"Juicy honey process layered with florals and ripe mandarin.","cover":"https://images.example.com/selva-guayacan-nectar.jpg"},
    {"roaster_user_id":"00000000-0000-0000-0000-000000000012","name":"Sierra Plum","country":"Peru","region":"Cajamarca","farm":"Los Cedros","producer":"Martin Cieza","altitude_min":1760,"altitude_max":2020,"variety":"Bourbon","processing":"washed","producer_notes":"Balanced plum sweetness and cocoa nib structure for daily drinking.","cover":"https://images.example.com/selva-sierra-plum.jpg"},
    {"roaster_user_id":"00000000-0000-0000-0000-000000000012","name":"Aji Carbonica","country":"Colombia","region":"Quindio","farm":"Finca Paraiso","producer":"Nicolas Ospina","altitude_min":1640,"altitude_max":1860,"variety":"Castillo","processing":"anaerobic","producer_notes":"Carbonic style lot with berry candy top notes and silky body.","cover":"https://images.example.com/selva-aji-carbonica.jpg"},
    {"roaster_user_id":"00000000-0000-0000-0000-000000000012","name":"Selva Late Harvest","country":"Ecuador","region":"Loja","farm":"San Miguel","producer":"Paula Mena","altitude_min":1800,"altitude_max":2060,"variety":"Sidra","processing":"natural","producer_notes":"Late-harvest natural with grape sweetness and floral lift.","cover":"https://images.example.com/selva-late-harvest.jpg"},
    {"roaster_user_id":"00000000-0000-0000-0000-000000000013","name":"Aurora Glass","country":"Ethiopia","region":"Yirgacheffe","farm":"Chelbesa","producer":"Mekdes Tadesse","altitude_min":1980,"altitude_max":2200,"variety":"Heirloom","processing":"washed","producer_notes":"Crisp bergamot and tea-like body shaped for high-clarity filters.","cover":"https://images.example.com/fjord-aurora-glass.jpg"},
    {"roaster_user_id":"00000000-0000-0000-0000-000000000013","name":"Midsummer Pine","country":"Rwanda","region":"Karongi","farm":"Gitesi","producer":"Alexis Nshuti","altitude_min":1780,"altitude_max":2050,"variety":"Red Bourbon","processing":"washed","producer_notes":"Soft plum sweetness and floral aromatics with polished structure.","cover":"https://images.example.com/fjord-midsummer-pine.jpg"},
    {"roaster_user_id":"00000000-0000-0000-0000-000000000013","name":"Snowline Orchard","country":"Burundi","region":"Kayanza","farm":"Ninga","producer":"Violette Bizimana","altitude_min":1820,"altitude_max":2100,"variety":"Bourbon","processing":"honey","producer_notes":"Round honey process balancing apricot sweetness and spice.","cover":"https://images.example.com/fjord-snowline-orchard.jpg"},
    {"roaster_user_id":"00000000-0000-0000-0000-000000000013","name":"North Sea Cherry","country":"Kenya","region":"Kirinyaga","farm":"Karimikui","producer":"Rungeto Cooperative","altitude_min":1700,"altitude_max":1880,"variety":"Ruiru 11","processing":"washed","producer_notes":"Blackcurrant and citrus snap with a cool mineral finish.","cover":"https://images.example.com/fjord-north-sea-cherry.jpg"},
    {"roaster_user_id":"00000000-0000-0000-0000-000000000013","name":"Evening Fjell","country":"Guatemala","region":"Huehuetenango","farm":"Finca La Bolsa","producer":"Vides Family","altitude_min":1650,"altitude_max":1910,"variety":"Catuai","processing":"natural","producer_notes":"Natural lot delivering cocoa, berry jam and steady sweetness.","cover":"https://images.example.com/fjord-evening-fjell.jpg"},
    {"roaster_user_id":"00000000-0000-0000-0000-000000000014","name":"Solar Mesa House","country":"Brazil","region":"Cerrado Mineiro","farm":"Sitio Bela Vista","producer":"Joao Pereira","altitude_min":1080,"altitude_max":1260,"variety":"Yellow Bourbon","processing":"natural","producer_notes":"Comforting chocolate profile built for espresso and milk drinks.","cover":"https://images.example.com/mesa-solar-house.jpg"},
    {"roaster_user_id":"00000000-0000-0000-0000-000000000014","name":"Hill Country Zest","country":"Costa Rica","region":"Tarrazu","farm":"Los Anonos","producer":"Mariela Solis","altitude_min":1580,"altitude_max":1840,"variety":"Caturra","processing":"honey","producer_notes":"Orange zest, caramel and red apple in an omniroast-friendly cup.","cover":"https://images.example.com/mesa-hill-country-zest.jpg"},
    {"roaster_user_id":"00000000-0000-0000-0000-000000000014","name":"Rio Switchback","country":"El Salvador","region":"Apaneca","farm":"San Rafael","producer":"Mauricio Salaverria","altitude_min":1480,"altitude_max":1710,"variety":"Pacamara","processing":"washed","producer_notes":"Creamy washed Pacamara with cocoa, citrus and cedar structure.","cover":"https://images.example.com/mesa-rio-switchback.jpg"},
    {"roaster_user_id":"00000000-0000-0000-0000-000000000014","name":"Desert Bloom Espresso","country":"Panama","region":"Boquete","farm":"Elida Estate","producer":"Lamastus Family","altitude_min":1650,"altitude_max":1910,"variety":"Catuai","processing":"anaerobic","producer_notes":"Dense espresso release with berry lift and syrupy sweetness.","cover":"https://images.example.com/mesa-desert-bloom.jpg"},
    {"roaster_user_id":"00000000-0000-0000-0000-000000000014","name":"Sunset Conveyor","country":"Honduras","region":"Santa Barbara","farm":"El Cielito","producer":"Marysabel Caballero","altitude_min":1560,"altitude_max":1820,"variety":"Parainema","processing":"washed","producer_notes":"Bright citrus, toasted sugar and brisk finish for modern batch brew.","cover":"https://images.example.com/mesa-sunset-conveyor.jpg"}
  ]'::jsonb;
  v_roaster_spec jsonb;
  v_consumer_spec jsonb;
  v_coffee_spec jsonb;
  v_note_name text;
  v_favorite_note text;
  v_roaster_id uuid;
  v_consumer_id uuid;
  v_coffee_id uuid;
  v_origin_id uuid;
  v_batch_id uuid;
  v_qr_id uuid;
  v_log_id uuid;
  v_review_id uuid;
  v_telemetry_id uuid;
  v_brew_method_id uuid;
  v_roaster_short_name text;
  v_batch_ids uuid[];
  v_tasting_note_ids uuid[];
  v_log_batch_id uuid;
  v_rating integer;
  v_brew_time integer;
  v_note_count integer;
  v_note_slot integer;
  v_consumer_index integer := 0;
  v_coffee_index integer := 0;
  v_batch_seq integer := 0;
  v_log_seq integer := 0;
  v_review_body text;
  v_logged_at timestamptz;
  v_experience_level text;
  v_repurchase_intent text;
BEGIN
  DELETE FROM public.qr_codes
  WHERE batch_id IN (
    SELECT rb.id
    FROM public.roast_batches rb
    JOIN public.coffees c ON c.id = rb.coffee_id
    JOIN public.roasters r ON r.id = c.roaster_id
    WHERE r.user_id = ANY(v_removed_roaster_user_ids)
  );

  DELETE FROM public.roast_batches
  WHERE coffee_id IN (
    SELECT c.id
    FROM public.coffees c
    JOIN public.roasters r ON r.id = c.roaster_id
    WHERE r.user_id = ANY(v_removed_roaster_user_ids)
  );

  DELETE FROM public.coffees
  WHERE roaster_id IN (
    SELECT id
    FROM public.roasters
    WHERE user_id = ANY(v_removed_roaster_user_ids)
  );

  DELETE FROM public.roasters
  WHERE user_id = ANY(v_removed_roaster_user_ids);

  DELETE FROM public.users
  WHERE id = ANY(v_removed_roaster_user_ids);

  DELETE FROM auth.identities
  WHERE user_id = ANY(v_removed_roaster_user_ids);

  DELETE FROM auth.users
  WHERE id = ANY(v_removed_roaster_user_ids);

  FOR v_roaster_spec IN
    SELECT value
    FROM jsonb_array_elements(v_roaster_specs)
  LOOP
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
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      (v_roaster_spec->>'user_id')::uuid,
      'authenticated',
      'authenticated',
      v_roaster_spec->>'email',
      crypt('swetry', gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'app_role', 'roaster',
        'display_name', v_roaster_spec->>'display_name',
        'email_verified', true
      ),
      now(),
      now(),
      '',
      '',
      false,
      false
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      encrypted_password = EXCLUDED.encrypted_password,
      raw_app_meta_data = EXCLUDED.raw_app_meta_data,
      raw_user_meta_data = EXCLUDED.raw_user_meta_data,
      updated_at = EXCLUDED.updated_at;

    INSERT INTO auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      v_roaster_spec->>'user_id',
      (v_roaster_spec->>'user_id')::uuid,
      jsonb_build_object(
        'sub', v_roaster_spec->>'user_id',
        'email', v_roaster_spec->>'email',
        'email_verified', false,
        'phone_verified', false
      ),
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
      updated_at = EXCLUDED.updated_at;

    INSERT INTO public.users (
      id,
      display_name,
      avatar_url,
      sensory_level,
      sensory_score
    )
    VALUES (
      (v_roaster_spec->>'user_id')::uuid,
      v_roaster_spec->>'display_name',
      v_avatar_prefix || 'kai',
      'beginner',
      0
    )
    ON CONFLICT (id) DO UPDATE
    SET
      display_name = EXCLUDED.display_name,
      avatar_url = EXCLUDED.avatar_url;

    INSERT INTO public.roasters (
      user_id,
      name,
      country,
      city,
      description,
      website,
      roaster_short_name,
      company_name,
      street,
      building_number,
      apartment_number,
      postal_code,
      regon,
      nip,
      verification_status,
      subscription_status
    )
    VALUES (
      (v_roaster_spec->>'user_id')::uuid,
      v_roaster_spec->>'name',
      v_roaster_spec->>'country',
      v_roaster_spec->>'city',
      v_roaster_spec->>'description',
      v_roaster_spec->>'website',
      v_roaster_spec->>'short_name',
      v_roaster_spec->>'company_name',
      v_roaster_spec->>'street',
      v_roaster_spec->>'building_number',
      v_roaster_spec->>'apartment_number',
      v_roaster_spec->>'postal_code',
      v_roaster_spec->>'regon',
      v_roaster_spec->>'nip',
      'verified',
      v_roaster_spec->>'subscription_status'
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
      name = EXCLUDED.name,
      country = EXCLUDED.country,
      city = EXCLUDED.city,
      description = EXCLUDED.description,
      website = EXCLUDED.website,
      roaster_short_name = EXCLUDED.roaster_short_name,
      company_name = EXCLUDED.company_name,
      street = EXCLUDED.street,
      building_number = EXCLUDED.building_number,
      apartment_number = EXCLUDED.apartment_number,
      postal_code = EXCLUDED.postal_code,
      regon = EXCLUDED.regon,
      nip = EXCLUDED.nip,
      verification_status = EXCLUDED.verification_status,
      subscription_status = EXCLUDED.subscription_status;
  END LOOP;

  FOR v_consumer_spec IN
    SELECT value
    FROM jsonb_array_elements(v_consumer_specs)
  LOOP
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
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      (v_consumer_spec->>'user_id')::uuid,
      'authenticated',
      'authenticated',
      v_consumer_spec->>'email',
      crypt('swetry', gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'app_role', 'consumer',
        'display_name', v_consumer_spec->>'display_name',
        'email_verified', true,
        'profile_completed', true,
        'avatar_url', v_avatar_prefix || (v_consumer_spec->>'avatar_id'),
        'country', v_consumer_spec->>'country'
      ),
      now(),
      now(),
      '',
      '',
      false,
      false
    )
    ON CONFLICT (id) DO UPDATE
    SET
      email = EXCLUDED.email,
      encrypted_password = EXCLUDED.encrypted_password,
      raw_app_meta_data = EXCLUDED.raw_app_meta_data,
      raw_user_meta_data = EXCLUDED.raw_user_meta_data,
      updated_at = EXCLUDED.updated_at;

    INSERT INTO auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      v_consumer_spec->>'user_id',
      (v_consumer_spec->>'user_id')::uuid,
      jsonb_build_object(
        'sub', v_consumer_spec->>'user_id',
        'email', v_consumer_spec->>'email',
        'email_verified', false,
        'phone_verified', false
      ),
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
      updated_at = EXCLUDED.updated_at;

    SELECT id
    INTO v_brew_method_id
    FROM public.brew_methods
    WHERE lower(name) = lower(v_consumer_spec->>'favorite_brew_method')
    ORDER BY name = v_consumer_spec->>'favorite_brew_method' DESC, name
    LIMIT 1;

    INSERT INTO public.users (
      id,
      display_name,
      avatar_url,
      favorite_brew_method_id,
      sensory_level,
      sensory_score
    )
    VALUES (
      (v_consumer_spec->>'user_id')::uuid,
      v_consumer_spec->>'display_name',
      v_avatar_prefix || (v_consumer_spec->>'avatar_id'),
      v_brew_method_id,
      'beginner',
      0
    )
    ON CONFLICT (id) DO UPDATE
    SET
      display_name = EXCLUDED.display_name,
      avatar_url = EXCLUDED.avatar_url,
      favorite_brew_method_id = EXCLUDED.favorite_brew_method_id;

    DELETE FROM public.user_favorite_flavor_notes
    WHERE user_id = (v_consumer_spec->>'user_id')::uuid;

    FOR v_favorite_note IN
      SELECT jsonb_array_elements_text(v_consumer_spec->'favorite_tasting_notes')
    LOOP
      INSERT INTO public.user_favorite_flavor_notes (
        user_id,
        tasting_note_id
      )
      SELECT
        (v_consumer_spec->>'user_id')::uuid,
        id
      FROM public.tasting_notes
      WHERE name = v_favorite_note
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  FOR v_coffee_spec IN
    SELECT value
    FROM jsonb_array_elements(v_coffee_specs)
  LOOP
    v_coffee_index := v_coffee_index + 1;
    v_origin_id := (
      '21000000-0000-0000-0000-' || lpad(v_coffee_index::text, 12, '0')
    )::uuid;
    v_coffee_id := (
      '31000000-0000-0000-0000-' || lpad(v_coffee_index::text, 12, '0')
    )::uuid;

    SELECT id, roaster_short_name
    INTO v_roaster_id, v_roaster_short_name
    FROM public.roasters
    WHERE user_id = (v_coffee_spec->>'roaster_user_id')::uuid;

    INSERT INTO public.origins (
      id,
      country,
      region,
      farm,
      altitude_min,
      altitude_max,
      producer
    )
    VALUES (
      v_origin_id,
      v_coffee_spec->>'country',
      v_coffee_spec->>'region',
      v_coffee_spec->>'farm',
      (v_coffee_spec->>'altitude_min')::integer,
      (v_coffee_spec->>'altitude_max')::integer,
      v_coffee_spec->>'producer'
    )
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
    VALUES (
      v_coffee_id,
      v_roaster_id,
      v_origin_id,
      v_coffee_spec->>'name',
      v_coffee_spec->>'variety',
      (v_coffee_spec->>'processing')::processing_method,
      v_coffee_spec->>'producer_notes',
      'active',
      v_coffee_spec->>'cover'
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

    FOR v_note_count IN 1..CASE WHEN v_coffee_index = ANY(v_double_batch_indices) THEN 2 ELSE 1 END
    LOOP
      v_batch_seq := v_batch_seq + 1;
      v_batch_id := (
        '41000000-0000-0000-0000-' || lpad(v_batch_seq::text, 12, '0')
      )::uuid;
      v_qr_id := (
        '51000000-0000-0000-0000-' || lpad(v_batch_seq::text, 12, '0')
      )::uuid;

      INSERT INTO public.roast_batches (
        id,
        coffee_id,
        roast_date,
        lot_number,
        status,
        brewing_notes,
        roaster_story
      )
      VALUES (
        v_batch_id,
        v_coffee_id,
        DATE '2026-03-01' + (v_coffee_index * 3 + v_note_count),
        format(
          '%s-%s-B%s',
          upper(replace(COALESCE(v_roaster_short_name, 'Roaster'), ' ', '')),
          lpad(v_coffee_index::text, 2, '0'),
          v_note_count
        ),
        'active',
        format(
          'Batch %s of %s: start at 1:%s on %s and adjust slightly finer on day %s.',
          v_note_count,
          v_coffee_spec->>'name',
          15 + ((v_coffee_index + v_note_count) % 3),
          COALESCE(v_consumer_specs->0->>'favorite_brew_method', 'V60'),
          6 + ((v_coffee_index + v_note_count) % 4)
        ),
        format(
          '%s by %s for %s: roasted to show %s while keeping %s structure.',
          v_coffee_spec->>'name',
          COALESCE(v_roaster_short_name, 'the roastery'),
          v_coffee_spec->>'country',
          split_part(v_coffee_spec->>'producer_notes', ' ', 1),
          lower(v_coffee_spec->>'processing')
        )
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
      VALUES (
        v_qr_id,
        v_batch_id,
        '9' || lpad(v_coffee_index::text, 7, '0') || '-0000-0000-0000-' || lpad(v_batch_seq::text, 12, '0'),
        'https://funcup.app/q/9' || lpad(v_coffee_index::text, 7, '0') || '-0000-0000-0000-' || lpad(v_batch_seq::text, 12, '0'),
        format('qr/beta/%s/batch-%s.svg', replace(lower(COALESCE(v_roaster_short_name, 'roaster')), ' ', '-'), v_batch_seq),
        format('qr/beta/%s/batch-%s.png', replace(lower(COALESCE(v_roaster_short_name, 'roaster')), ' ', '-'), v_batch_seq)
      )
      ON CONFLICT (id) DO UPDATE
      SET
        batch_id = EXCLUDED.batch_id,
        hash = EXCLUDED.hash,
        qr_url = EXCLUDED.qr_url,
        svg_storage_path = EXCLUDED.svg_storage_path,
        png_storage_path = EXCLUDED.png_storage_path;
    END LOOP;
  END LOOP;

  SELECT array_agg(id ORDER BY sort_order)
  INTO v_tasting_note_ids
  FROM public.tasting_notes;

  FOR v_consumer_spec IN
    SELECT value
    FROM jsonb_array_elements(v_consumer_specs)
  LOOP
    v_consumer_index := v_consumer_index + 1;
    v_consumer_id := (v_consumer_spec->>'user_id')::uuid;
    v_experience_level := v_consumer_spec->>'experience_level';

    FOR v_coffee_index IN 1..jsonb_array_length(v_coffee_specs)
    LOOP
      v_coffee_id := (
        '31000000-0000-0000-0000-' || lpad(v_coffee_index::text, 12, '0')
      )::uuid;

      SELECT array_agg(id ORDER BY roast_date, lot_number)
      INTO v_batch_ids
      FROM public.roast_batches
      WHERE coffee_id = v_coffee_id;

      IF COALESCE(array_length(v_batch_ids, 1), 0) = 0 THEN
        RAISE EXCEPTION 'Missing batch for coffee %', v_coffee_id;
      END IF;

      IF array_length(v_batch_ids, 1) = 1 THEN
        v_log_batch_id := v_batch_ids[1];
      ELSE
        v_log_batch_id := v_batch_ids[1 + ((v_consumer_index + v_coffee_index) % 2)];
      END IF;

      SELECT id
      INTO v_brew_method_id
      FROM public.brew_methods
      WHERE lower(name) = lower(v_consumer_spec->>'favorite_brew_method')
      ORDER BY name = v_consumer_spec->>'favorite_brew_method' DESC, name
      LIMIT 1;

      v_log_seq := v_log_seq + 1;
      v_log_id := (
        '61000000-0000-0000-0000-' || lpad(v_log_seq::text, 12, '0')
      )::uuid;
      v_review_id := (
        '62000000-0000-0000-0000-' || lpad(v_log_seq::text, 12, '0')
      )::uuid;
      v_telemetry_id := (
        '63000000-0000-0000-0000-' || lpad(v_log_seq::text, 12, '0')
      )::uuid;
      v_rating := 1 + ((v_consumer_index * 3 + v_coffee_index * 2 + array_length(v_batch_ids, 1)) % 5);
      v_brew_time := 120 + ((v_consumer_index * 37 + v_coffee_index * 19) % 240);
      v_logged_at := timestamptz '2026-05-02 08:00:00+00'
        + (v_consumer_index * INTERVAL '7 hours')
        + (v_coffee_index * INTERVAL '43 minutes');

      INSERT INTO public.coffee_logs (
        id,
        user_id,
        batch_id,
        rating,
        brew_method_id,
        brew_time_seconds,
        free_text_notes,
        logged_at
      )
      VALUES (
        v_log_id,
        v_consumer_id,
        v_log_batch_id,
        v_rating,
        v_brew_method_id,
        v_brew_time,
        format(
          '%s logged %s with %s on pass %s; focus was %s sweetness, %s texture and a %s finish.',
          v_consumer_spec->>'display_name',
          (SELECT name FROM public.coffees WHERE id = v_coffee_id),
          COALESCE((SELECT name FROM public.brew_methods WHERE id = v_brew_method_id), 'brew'),
          1 + ((v_consumer_index + v_coffee_index) % 3),
          CASE (v_consumer_index + v_coffee_index) % 4
            WHEN 0 THEN 'lifted'
            WHEN 1 THEN 'layered'
            WHEN 2 THEN 'rounded'
            ELSE 'sparkling'
          END,
          CASE (v_consumer_index + v_coffee_index) % 4
            WHEN 0 THEN 'silky'
            WHEN 1 THEN 'tea-like'
            WHEN 2 THEN 'dense'
            ELSE 'creamy'
          END,
          CASE (v_consumer_index + v_coffee_index) % 4
            WHEN 0 THEN 'cocoa'
            WHEN 1 THEN 'citrus'
            WHEN 2 THEN 'floral'
            ELSE 'spice'
          END
        ),
        v_logged_at
      )
      ON CONFLICT (id) DO UPDATE
      SET
        user_id = EXCLUDED.user_id,
        batch_id = EXCLUDED.batch_id,
        rating = EXCLUDED.rating,
        brew_method_id = EXCLUDED.brew_method_id,
        brew_time_seconds = EXCLUDED.brew_time_seconds,
        free_text_notes = EXCLUDED.free_text_notes,
        logged_at = EXCLUDED.logged_at;

      v_review_body := format(
        '%s rated %s %s/5 after a %s-second brew: batch showed %s aromatics, %s sweetness, and a %s aftertaste that felt distinct from the rest of the session.',
        v_consumer_spec->>'display_name',
        (SELECT name FROM public.coffees WHERE id = v_coffee_id),
        v_rating,
        v_brew_time,
        CASE (v_consumer_index + v_coffee_index) % 5
          WHEN 0 THEN 'berry-led'
          WHEN 1 THEN 'citrus-led'
          WHEN 2 THEN 'floral'
          WHEN 3 THEN 'brown-sugar'
          ELSE 'nutty'
        END,
        CASE (v_consumer_index * 2 + v_coffee_index) % 5
          WHEN 0 THEN 'compact'
          WHEN 1 THEN 'juicy'
          WHEN 2 THEN 'sticky'
          WHEN 3 THEN 'elegant'
          ELSE 'jammy'
        END,
        CASE (v_consumer_index + v_coffee_index * 3) % 5
          WHEN 0 THEN 'clean'
          WHEN 1 THEN 'lingering'
          WHEN 2 THEN 'tea-like'
          WHEN 3 THEN 'sparkling'
          ELSE 'warming'
        END
      );

      INSERT INTO public.reviews (
        id,
        coffee_log_id,
        body,
        created_at,
        updated_at
      )
      VALUES (
        v_review_id,
        v_log_id,
        v_review_body,
        v_logged_at,
        v_logged_at
      )
      ON CONFLICT (id) DO UPDATE
      SET
        coffee_log_id = EXCLUDED.coffee_log_id,
        body = EXCLUDED.body,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at;

      v_note_count := 2 + ((v_consumer_index + v_coffee_index) % 2);
      FOR v_note_slot IN 1..v_note_count LOOP
        v_note_name := (
          ARRAY[
            v_tasting_note_ids[1 + ((v_consumer_index + v_coffee_index - 1) % array_length(v_tasting_note_ids, 1))],
            v_tasting_note_ids[1 + ((v_consumer_index + v_coffee_index + 3) % array_length(v_tasting_note_ids, 1))],
            v_tasting_note_ids[1 + ((v_consumer_index + v_coffee_index + 7) % array_length(v_tasting_note_ids, 1))]
          ]
        )[v_note_slot]::text;

        INSERT INTO public.coffee_log_tasting_notes (
          id,
          coffee_log_id,
          tasting_note_id
        )
        VALUES (
          (
            '64000000-0000-0000-0000-' ||
            lpad((v_log_seq * 10 + v_note_slot)::text, 12, '0')
          )::uuid,
          v_log_id,
          v_note_name::uuid
        )
        ON CONFLICT (coffee_log_id, tasting_note_id) DO NOTHING;
      END LOOP;

      v_repurchase_intent :=
        CASE
          WHEN v_rating >= 4 THEN 'yes'
          WHEN v_rating = 3 THEN 'unsure'
          ELSE 'no'
        END;

      INSERT INTO public.coffee_log_telemetry_core (
        id,
        coffee_log_id,
        brew_method_id,
        overall_rating,
        sensory_acidity,
        sensory_sweetness,
        sensory_body,
        repurchase_intent,
        experience_level,
        created_at,
        updated_at
      )
      VALUES (
        v_telemetry_id,
        v_log_id,
        v_brew_method_id,
        v_rating,
        1 + ((v_consumer_index + v_coffee_index) % 5),
        1 + ((v_consumer_index * 2 + v_coffee_index) % 5),
        1 + ((v_consumer_index * 3 + v_coffee_index) % 5),
        v_repurchase_intent,
        v_experience_level::sensory_level,
        v_logged_at,
        v_logged_at
      )
      ON CONFLICT (id) DO UPDATE
      SET
        coffee_log_id = EXCLUDED.coffee_log_id,
        brew_method_id = EXCLUDED.brew_method_id,
        overall_rating = EXCLUDED.overall_rating,
        sensory_acidity = EXCLUDED.sensory_acidity,
        sensory_sweetness = EXCLUDED.sensory_sweetness,
        sensory_body = EXCLUDED.sensory_body,
        repurchase_intent = EXCLUDED.repurchase_intent,
        experience_level = EXCLUDED.experience_level,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at;
    END LOOP;
  END LOOP;

  UPDATE public.users u
  SET
    sensory_score = COALESCE(stats.log_count, 0),
    sensory_level = CASE
      WHEN COALESCE(stats.log_count, 0) >= 50 THEN 'expert'::sensory_level
      WHEN COALESCE(stats.log_count, 0) >= 20 THEN 'advanced'::sensory_level
      ELSE 'beginner'::sensory_level
    END
  FROM (
    SELECT user_id, COUNT(*)::integer AS log_count
    FROM public.coffee_logs
    GROUP BY user_id
  ) AS stats
  WHERE u.id = stats.user_id;

  DELETE FROM public.coffee_stats;

  INSERT INTO public.coffee_stats (
    batch_id,
    total_count,
    avg_rating,
    rating_distribution,
    top_flavor_notes,
    updated_at
  )
  SELECT
    rb.id AS batch_id,
    COUNT(cl.id)::integer AS total_count,
    COALESCE(ROUND(AVG(cl.rating)::numeric, 2), 0) AS avg_rating,
    jsonb_build_object(
      '1', COUNT(*) FILTER (WHERE cl.rating = 1),
      '2', COUNT(*) FILTER (WHERE cl.rating = 2),
      '3', COUNT(*) FILTER (WHERE cl.rating = 3),
      '4', COUNT(*) FILTER (WHERE cl.rating = 4),
      '5', COUNT(*) FILTER (WHERE cl.rating = 5)
    ) AS rating_distribution,
    COALESCE(
      (
        SELECT jsonb_agg(flavor.tasting_note_id ORDER BY flavor.cnt DESC, flavor.tasting_note_id)
        FROM (
          SELECT cltn.tasting_note_id, COUNT(*) AS cnt
          FROM public.coffee_log_tasting_notes cltn
          JOIN public.coffee_logs inner_logs ON inner_logs.id = cltn.coffee_log_id
          WHERE inner_logs.batch_id = rb.id
          GROUP BY cltn.tasting_note_id
          ORDER BY COUNT(*) DESC, cltn.tasting_note_id
          LIMIT 10
        ) AS flavor
      ),
      '[]'::jsonb
    ) AS top_flavor_notes,
    now() AS updated_at
  FROM public.roast_batches rb
  LEFT JOIN public.coffee_logs cl ON cl.batch_id = rb.id
  GROUP BY rb.id
  ON CONFLICT (batch_id) DO UPDATE
  SET
    total_count = EXCLUDED.total_count,
    avg_rating = EXCLUDED.avg_rating,
    rating_distribution = EXCLUDED.rating_distribution,
    top_flavor_notes = EXCLUDED.top_flavor_notes,
    updated_at = EXCLUDED.updated_at;

  DELETE FROM public.user_roaster_follows
  WHERE user_id = v_kazik_user_id;

  INSERT INTO public.user_roaster_follows (
    user_id,
    roaster_id,
    source,
    created_at,
    last_seen_at
  )
  SELECT
    v_kazik_user_id,
    followed_roaster_id,
    'roasters-screen',
    now(),
    now()
  FROM unnest(ARRAY[
    (SELECT id FROM public.roasters WHERE user_id = v_bart_user_id),
    (SELECT id FROM public.roasters WHERE user_id = v_new_roaster_ids[1]),
    (SELECT id FROM public.roasters WHERE user_id = v_new_roaster_ids[2])
  ]::uuid[]) AS followed_roaster_id;
END $$;

COMMIT;
