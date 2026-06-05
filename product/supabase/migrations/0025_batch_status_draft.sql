-- Add draft status for shared-safe orphan coffee backfill.
-- Version: 0025
-- Created: 2026-05-31

ALTER TYPE public.batch_status ADD VALUE IF NOT EXISTS 'draft';
