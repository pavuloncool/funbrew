# Clean Handoff Repo Cleanup Log

Date: 2026-05-09
Branch: `mvp-release-candidate`
Scope: repository hygiene and information architecture cleanup (no public API changes).

## Applied changes

1. Documentation zoning (lean active docs)
- moved `meta/docs/handoff/` -> `meta/archive/dev-docs/handoff/`
- moved `meta/docs/DoR/` -> `meta/archive/dev-docs/DoR/`
- moved `meta/docs/Beta-Hardening-sprint.md` -> `meta/archive/dev-docs/Beta-Hardening-sprint.md`

2. Legacy root assets moved to archive
- moved `app-palette.scss` -> `meta/archive/assets/legacy-design-references/app-palette.scss`
- moved `app-screen-layout.jpg` -> `meta/archive/assets/legacy-design-references/app-screen-layout.jpg`
- moved `landing-reference.html` -> `meta/archive/assets/legacy-design-references/landing-reference.html`

3. Transient artifacts removed
- removed `Spline_Sans.zip`
- removed `gt-walsheim-font-family/`

4. Repository entry docs updated
- updated root `README.md` to point only to active app areas and source-of-truth docs
- added `meta/docs/README.md` as active-docs index
- updated `meta/archive/README.md` with current historical docs layout

5. Ignore policy tightened
- updated `.gitignore` with:
  - `Spline_Sans.zip`
  - `gt-walsheim-font-family/`
  - `product/supabase/.temp/`

## Intent

- Keep runtime/product development in active zones:
  - `product/apps/web`, `product/apps/consumer-mobile`, `product/packages/*`, `product/supabase/*`
- Keep historical materials discoverable but out of active path through `meta/archive/`.
