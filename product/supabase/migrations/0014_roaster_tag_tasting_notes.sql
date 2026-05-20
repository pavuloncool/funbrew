-- Add tasting notes selected by roaster to coffee tag payload
-- Version: 0014
-- Created: 2026-05-04

BEGIN;

ALTER TABLE public.roaster_coffee_tags
  ADD COLUMN IF NOT EXISTS tasting_note_ids uuid[] NOT NULL DEFAULT '{}';

COMMIT;
