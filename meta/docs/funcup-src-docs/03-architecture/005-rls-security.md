# ADR-005: RLS as Primary Security Layer

**Date:** 2026-04-08  
**Status:** Accepted  
**Feature:** 002-qr-coffee-platform

## Context
Need to enforce data access control at the database level per Constitution Principle II.

## Decision
Enable RLS on all 13 tables with policies:
- users: SELECT/UPDATE own
- roasters: SELECT verified, INSERT/UPDATE owner
- coffees: SELECT active, INSERT/UPDATE owner
- coffee_logs: SELECT/INSERT/UPDATE own
- qr_codes: SELECT public (for QR resolution)
- reviews/review_votes: SELECT public, INSERT/UPDATE owner

## Consequences
- ✅ Database-level security
- ✅ No application-level bypass possible
- ⚠️ Requires careful policy design

## Related
- T015, rls-policies.md