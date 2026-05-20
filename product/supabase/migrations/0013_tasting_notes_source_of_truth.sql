-- tasting_notes as single source of truth for coffee flavor taxonomy
-- Version: 0013
-- Created: 2026-05-04

BEGIN;

-- 1) Rename junction table out of the way.
ALTER TABLE IF EXISTS public.tasting_notes RENAME TO coffee_log_tasting_notes;

-- 2) Promote flavor taxonomy table to tasting_notes.
ALTER TABLE IF EXISTS public.flavor_notes RENAME TO tasting_notes;

-- 3) Rename FK columns to new domain language.
ALTER TABLE IF EXISTS public.coffee_log_tasting_notes
  RENAME COLUMN flavor_note_id TO tasting_note_id;

ALTER TABLE IF EXISTS public.user_favorite_flavor_notes
  RENAME COLUMN flavor_note_id TO tasting_note_id;

-- 4) Keep indexes coherent after column rename.
ALTER INDEX IF EXISTS public.user_favorite_flavor_notes_flavor_note_idx
  RENAME TO user_favorite_flavor_notes_tasting_note_idx;

-- 5) Ensure foreign keys point to public.tasting_notes after rename.
ALTER TABLE IF EXISTS public.coffee_log_tasting_notes
  DROP CONSTRAINT IF EXISTS tasting_notes_flavor_note_id_fkey,
  DROP CONSTRAINT IF EXISTS coffee_log_tasting_notes_flavor_note_id_fkey,
  DROP CONSTRAINT IF EXISTS coffee_log_tasting_notes_tasting_note_id_fkey;

ALTER TABLE IF EXISTS public.coffee_log_tasting_notes
  ADD CONSTRAINT coffee_log_tasting_notes_tasting_note_id_fkey
  FOREIGN KEY (tasting_note_id) REFERENCES public.tasting_notes(id) ON DELETE RESTRICT;

ALTER TABLE IF EXISTS public.user_favorite_flavor_notes
  DROP CONSTRAINT IF EXISTS user_favorite_flavor_notes_flavor_note_id_fkey,
  DROP CONSTRAINT IF EXISTS user_favorite_flavor_notes_tasting_note_id_fkey;

ALTER TABLE IF EXISTS public.user_favorite_flavor_notes
  ADD CONSTRAINT user_favorite_flavor_notes_tasting_note_id_fkey
  FOREIGN KEY (tasting_note_id) REFERENCES public.tasting_notes(id) ON DELETE RESTRICT;

-- 6) Restrict taxonomy to 12 canonical notes (SCA/WCR aligned curation).
-- Normalize legacy underscore aliases to canonical hyphen names.
DO $$
DECLARE
  old_id uuid;
  new_id uuid;
BEGIN
  -- stone_fruit -> stone-fruit
  SELECT id INTO old_id FROM public.tasting_notes WHERE name = 'stone_fruit' LIMIT 1;
  SELECT id INTO new_id FROM public.tasting_notes WHERE name = 'stone-fruit' LIMIT 1;
  IF old_id IS NOT NULL THEN
    IF new_id IS NOT NULL THEN
      UPDATE public.coffee_log_tasting_notes SET tasting_note_id = new_id WHERE tasting_note_id = old_id;
      UPDATE public.user_favorite_flavor_notes SET tasting_note_id = new_id WHERE tasting_note_id = old_id;
      DELETE FROM public.tasting_notes WHERE id = old_id;
    ELSE
      UPDATE public.tasting_notes SET name = 'stone-fruit', label = 'Stone Fruit' WHERE id = old_id;
    END IF;
  END IF;

  -- brown_sugar -> brown-sugar
  old_id := NULL;
  new_id := NULL;
  SELECT id INTO old_id FROM public.tasting_notes WHERE name = 'brown_sugar' LIMIT 1;
  SELECT id INTO new_id FROM public.tasting_notes WHERE name = 'brown-sugar' LIMIT 1;
  IF old_id IS NOT NULL THEN
    IF new_id IS NOT NULL THEN
      UPDATE public.coffee_log_tasting_notes SET tasting_note_id = new_id WHERE tasting_note_id = old_id;
      UPDATE public.user_favorite_flavor_notes SET tasting_note_id = new_id WHERE tasting_note_id = old_id;
      DELETE FROM public.tasting_notes WHERE id = old_id;
    ELSE
      UPDATE public.tasting_notes SET name = 'brown-sugar', label = 'Brown Sugar' WHERE id = old_id;
    END IF;
  END IF;
END $$;

CREATE TEMP TABLE canonical_tasting_note_names(name text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO canonical_tasting_note_names(name) VALUES
  ('berry'),
  ('citrus'),
  ('stone-fruit'),
  ('floral'),
  ('jasmine'),
  ('chocolate'),
  ('caramel'),
  ('honey'),
  ('brown-sugar'),
  ('almond'),
  ('hazelnut'),
  ('cinnamon');

-- Remove references to notes outside canonical set (prune-only policy).
DELETE FROM public.coffee_log_tasting_notes cltn
USING public.tasting_notes tn
WHERE cltn.tasting_note_id = tn.id
  AND tn.name NOT IN (SELECT name FROM canonical_tasting_note_names);

DELETE FROM public.user_favorite_flavor_notes uffn
USING public.tasting_notes tn
WHERE uffn.tasting_note_id = tn.id
  AND tn.name NOT IN (SELECT name FROM canonical_tasting_note_names);

-- Drop non-canonical notes from the taxonomy itself.
DELETE FROM public.tasting_notes tn
WHERE tn.name NOT IN (SELECT name FROM canonical_tasting_note_names);

-- Keep deterministic ordering for the 12-note UI list.
UPDATE public.tasting_notes
SET sort_order = mapped.sort_order
FROM (
  VALUES
    ('berry', 1),
    ('citrus', 2),
    ('stone-fruit', 3),
    ('floral', 4),
    ('jasmine', 5),
    ('chocolate', 6),
    ('caramel', 7),
    ('honey', 8),
    ('brown-sugar', 9),
    ('almond', 10),
    ('hazelnut', 11),
    ('cinnamon', 12)
) AS mapped(name, sort_order)
WHERE public.tasting_notes.name = mapped.name;

-- Sanity guard.
DO $$
DECLARE
  kept_count integer;
BEGIN
  SELECT COUNT(*) INTO kept_count FROM public.tasting_notes;
  IF kept_count <> 12 THEN
    RAISE EXCEPTION 'Expected exactly 12 tasting notes after migration, got %', kept_count;
  END IF;
END $$;

COMMIT;
