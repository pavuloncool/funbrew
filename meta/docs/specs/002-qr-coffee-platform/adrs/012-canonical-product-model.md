# ADR-012: Canonical Product Model with `roaster_coffee_tags` as Projection

**Date:** 2026-05-05  
**Status:** Accepted  
**Feature:** 002-qr-coffee-platform

## Context
Audit `meta/docs/funcup-web-mobile-data-flow-audit.md` confirmed that funcup currently runs two active but divergent product models:

- canonical domain: `roasters -> coffees -> roast_batches -> qr_codes -> coffee_logs -> coffee_stats`
- tag flow: `roasters -> roaster_coffee_tags -> /q/[public_hash] -> Coffee Page`

That split causes three concrete MVP failures:

1. roaster write flows do not fully produce the fields consumer and analytics flows read;
2. public Coffee Page logic branches between two competing domain sources;
3. every new feature risks being implemented twice or against the wrong source of truth.

The MVP refactor task requires reduction and unification, not parallel expansion of both models.

## Decision
Funcup adopts the canonical domain model as the only business source of truth for MVP and post-audit refactor:

- `roasters`
- `coffees`
- `roast_batches`
- `qr_codes`
- `coffee_logs`
- `coffee_stats`

`roaster_coffee_tags` remains temporarily allowed only as a legacy-compatible projection/read model.

Operational rules from this decision:

1. New product behavior must not introduce dual writes to both models.
2. New screens and endpoints must declare which canonical entity they write.
3. Public QR/Coffee Page readers may keep a temporary adapter for `roaster_coffee_tags`, but that adapter is compatibility-only.
4. The `/tag` flow is transitional and is expected to be rewritten to publish canonical `coffee + batch + qr` data in a later sprint.
5. Consumer tasting, journal, analytics, and future feedback flows must target canonical batch/log/stat entities.

## Consequences
- `scan_qr` may remain a bridge for both models for now, but only behind a thin mapping layer.
- Producer-side refactor priority moves to canonical coffee/batch publication, not further enrichment of `roaster_coffee_tags`.
- Mobile tasting submission and roaster analytics can be hardened immediately against canonical IDs without waiting for `/tag` migration.
- Repo cleanup can treat standalone tag-domain growth as deprecated work rather than a parallel roadmap.

## Related
- `meta/docs/Zadanie MVP refactor.md`
- `meta/docs/funcup-web-mobile-data-flow-audit.md`
- `meta/docs/funcup-src-docs/02-specs/spec.md`
