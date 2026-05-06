-- User profile preferences for consumer onboarding
-- Version: 0011
-- Created: 2026-05-01

BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS favorite_brew_method_id uuid REFERENCES public.brew_methods(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.user_favorite_flavor_notes (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  flavor_note_id uuid NOT NULL REFERENCES public.flavor_notes(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, flavor_note_id)
);

CREATE INDEX IF NOT EXISTS user_favorite_flavor_notes_flavor_note_idx
  ON public.user_favorite_flavor_notes(flavor_note_id);

ALTER TABLE public.user_favorite_flavor_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own favorite flavor notes" ON public.user_favorite_flavor_notes;
CREATE POLICY "Users can read own favorite flavor notes"
  ON public.user_favorite_flavor_notes
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorite flavor notes" ON public.user_favorite_flavor_notes;
CREATE POLICY "Users can insert own favorite flavor notes"
  ON public.user_favorite_flavor_notes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorite flavor notes" ON public.user_favorite_flavor_notes;
CREATE POLICY "Users can delete own favorite flavor notes"
  ON public.user_favorite_flavor_notes
  FOR DELETE
  USING (auth.uid() = user_id);

COMMIT;
