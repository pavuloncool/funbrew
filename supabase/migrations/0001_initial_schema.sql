-- Initial migration: Create all core tables for funcup MVP
-- Version: 0001
-- Created: 2026-04-08

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE sensory_level AS ENUM ('beginner', 'advanced', 'expert');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'revoked');
CREATE TYPE coffee_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE batch_status AS ENUM ('active', 'archived');
CREATE TYPE processing_method AS ENUM ('washed', 'natural', 'honey', 'anaerobic', 'wet-hulled', 'other');

-- Create users table (extends auth.users)
CREATE TABLE users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text NOT NULL,
    avatar_url text,
    sensory_level sensory_level NOT NULL DEFAULT 'beginner',
    sensory_score integer NOT NULL DEFAULT 0,
    following_roaster_ids uuid[] NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT display_name_length CHECK (char_length(display_name) <= 64)
);

-- Create roasters table
CREATE TABLE roasters (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    name text NOT NULL,
    country text,
    city text,
    description text,
    website text,
    logo_url text,
    verification_status verification_status NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT name_length CHECK (char_length(name) <= 128)
);

-- Create origins table
CREATE TABLE origins (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    country text NOT NULL,
    region text,
    farm text,
    altitude_min integer,
    altitude_max integer,
    producer text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT altitude_order CHECK (
        altitude_min IS NULL OR altitude_max IS NULL OR altitude_min <= altitude_max
    )
);

-- Create coffees table
CREATE TABLE coffees (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    roaster_id uuid NOT NULL REFERENCES roasters(id) ON DELETE RESTRICT,
    origin_id uuid REFERENCES origins(id) ON DELETE SET NULL,
    name text NOT NULL,
    variety text,
    processing_method processing_method,
    producer_notes text,
    status coffee_status NOT NULL DEFAULT 'draft',
    cover_image_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT name_length CHECK (char_length(name) <= 128)
);

-- Create roast_batches table
CREATE TABLE roast_batches (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    coffee_id uuid NOT NULL REFERENCES coffees(id) ON DELETE RESTRICT,
    roast_date date NOT NULL,
    lot_number text NOT NULL,
    status batch_status NOT NULL DEFAULT 'active',
    brewing_notes text,
    roaster_story text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create qr_codes table
CREATE TABLE qr_codes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id uuid NOT NULL REFERENCES roast_batches(id) ON DELETE RESTRICT UNIQUE,
    hash text NOT NULL UNIQUE,
    qr_url text NOT NULL,
    svg_storage_path text NOT NULL,
    png_storage_path text NOT NULL,
    generated_at timestamptz NOT NULL DEFAULT now()
);

-- Create brew_methods table
CREATE TABLE brew_methods (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    sort_order integer NOT NULL DEFAULT 0
);

-- Create flavor_notes table
CREATE TABLE flavor_notes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    label text NOT NULL,
    category text NOT NULL,
    sort_order integer NOT NULL DEFAULT 0
);

-- Create coffee_logs table
CREATE TABLE coffee_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    batch_id uuid NOT NULL REFERENCES roast_batches(id) ON DELETE RESTRICT,
    brew_method_id uuid REFERENCES brew_methods(id) ON DELETE SET NULL,
    rating smallint NOT NULL,
    brew_time_seconds integer,
    free_text_notes text,
    logged_at timestamptz NOT NULL DEFAULT now(),
    synced_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT rating_check CHECK (rating BETWEEN 1 AND 5)
);

-- Create tasting_notes junction table
CREATE TABLE tasting_notes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    coffee_log_id uuid NOT NULL REFERENCES coffee_logs(id) ON DELETE CASCADE,
    flavor_note_id uuid NOT NULL REFERENCES flavor_notes(id) ON DELETE RESTRICT,
    UNIQUE (coffee_log_id, flavor_note_id)
);

-- Create reviews table
CREATE TABLE reviews (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    coffee_log_id uuid NOT NULL REFERENCES coffee_logs(id) ON DELETE CASCADE UNIQUE,
    body text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT body_length CHECK (char_length(body) BETWEEN 1 AND 2000)
);

-- Create review_votes table
CREATE TABLE review_votes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote boolean NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (review_id, user_id)
);

-- Create coffee_stats table
CREATE TABLE coffee_stats (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id uuid NOT NULL REFERENCES roast_batches(id) ON DELETE CASCADE UNIQUE,
    total_count integer NOT NULL DEFAULT 0,
    avg_rating numeric(3,2) NOT NULL DEFAULT 0.00,
    rating_distribution jsonb NOT NULL DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0}',
    top_flavor_notes jsonb NOT NULL DEFAULT '[]',
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER roasters_updated_at BEFORE UPDATE ON roasters
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER coffees_updated_at BEFORE UPDATE ON coffees
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER roast_batches_updated_at BEFORE UPDATE ON roast_batches
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER coffee_logs_updated_at BEFORE UPDATE ON coffee_logs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed brew_methods
INSERT INTO brew_methods (name, sort_order) VALUES
    ('V60', 1),
    ('AeroPress', 2),
    ('Espresso', 3),
    ('French Press', 4),
    ('Chemex', 5),
    ('Moka Pot', 6),
    ('Cold Brew', 7),
    ('Siphon', 8),
    ('Pour Over', 9),
    ('Other', 10);

-- Seed flavor_notes (36 tags across 6 categories)
INSERT INTO flavor_notes (name, label, category, sort_order) VALUES
    -- Fruity (6)
    ('berry', 'Berry', 'fruity', 1),
    ('citrus', 'Citrus', 'fruity', 2),
    ('stone-fruit', 'Stone Fruit', 'fruity', 3),
    ('tropical', 'Tropical', 'fruity', 4),
    ('apple', 'Apple', 'fruity', 5),
    ('grape', 'Grape', 'fruity', 6),
    -- Floral (6)
    ('floral', 'Floral', 'floral', 1),
    ('jasmine', 'Jasmine', 'floral', 2),
    ('rose', 'Rose', 'floral', 3),
    ('lavender', 'Lavender', 'floral', 4),
    ('chamomile', 'Chamomile', 'floral', 5),
    ('hibiscus', 'Hibiscus', 'floral', 6),
    -- Sweet (6)
    ('honey', 'Honey', 'sweet', 1),
    ('caramel', 'Caramel', 'sweet', 2),
    ('maple', 'Maple', 'sweet', 3),
    ('brown-sugar', 'Brown Sugar', 'sweet', 4),
    ('vanilla', 'Vanilla', 'sweet', 5),
    ('chocolate', 'Chocolate', 'sweet', 6),
    -- Nutty (6)
    ('almond', 'Almond', 'nutty', 1),
    ('hazelnut', 'Hazelnut', 'nutty', 2),
    ('peanut', 'Peanut', 'nutty', 3),
    ('walnut', 'Walnut', 'nutty', 4),
    ('pecan', 'Pecan', 'nutty', 5),
    ('macadamia', 'Macadamia', 'nutty', 6),
    -- Spice (6)
    ('cinnamon', 'Cinnamon', 'spice', 1),
    ('nutmeg', 'Nutmeg', 'spice', 2),
    ('clove', 'Clove', 'spice', 3),
    ('cardamom', 'Cardamom', 'spice', 4),
    ('ginger', 'Ginger', 'spice', 5),
    ('black-pepper', 'Black Pepper', 'spice', 6),
    -- Savory (6)
    ('roasty', 'Roasty', 'savory', 1),
    ('smoky', 'Smoky', 'savory', 2),
    ('earthy', 'Earthy', 'savory', 3),
    ('herbaceous', 'Herbaceous', 'savory', 4),
    ('tobacco', 'Tobacco', 'savory', 5),
    ('leather', 'Leather', 'savory', 6);

-- Create trigger to auto-create user profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, display_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;
