# ADR-004: 13-Table Data Model with 5 Enums

**Date:** 2026-04-08  
**Status:** Accepted  
**Feature:** 002-qr-coffee-platform

## Context
Need to define the canonical data schema for the coffee platform per Notion Data Model v3.

## Decision
13 tables with 5 enums:
- **Tables:** users, roasters, origins, coffees, roast_batches, qr_codes, brew_methods, flavor_notes, coffee_logs, tasting_notes, reviews, review_votes, coffee_stats
- **Enums:** sensory_level (beginner/advanced/expert), verification_status (pending/verified/revoked), coffee_status (draft/active/archived), batch_status (active/archived), processing_method (washed/natural/honey/anaerobic/wet-hulled/other)

## Consequences
- ✅ Matches spec exactly
- ✅ RLS-ready structure
- ⚠️ Complex joins required

## Related
- T013, T014, data-model.md