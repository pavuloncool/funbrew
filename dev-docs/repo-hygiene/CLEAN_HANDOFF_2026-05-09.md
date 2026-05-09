# Clean Handoff Repo Cleanup Log

Date: 2026-05-09
Branch: `mvp-release-candidate`
Scope: repository hygiene and information architecture cleanup (no public API changes).

## Applied changes

1. Documentation zoning (lean active docs)
- moved `dev-docs/handoff/` -> `archive/dev-docs/handoff/`
- moved `dev-docs/DoR/` -> `archive/dev-docs/DoR/`
- moved `dev-docs/Beta-Hardening-sprint.md` -> `archive/dev-docs/Beta-Hardening-sprint.md`

2. Legacy root assets moved to archive
- moved `app-palette.scss` -> `archive/assets/legacy-design-references/app-palette.scss`
- moved `app-screen-layout.jpg` -> `archive/assets/legacy-design-references/app-screen-layout.jpg`
- moved `landing-reference.html` -> `archive/assets/legacy-design-references/landing-reference.html`

3. Transient artifacts removed
- removed `Spline_Sans.zip`
- removed `gt-walsheim-font-family/`

4. Repository entry docs updated
- updated root `README.md` to point only to active app areas and source-of-truth docs
- added `dev-docs/README.md` as active-docs index
- updated `archive/README.md` with current historical docs layout

5. Ignore policy tightened
- updated `.gitignore` with:
  - `Spline_Sans.zip`
  - `gt-walsheim-font-family/`
  - `supabase/.temp/`

## Intent

- Keep runtime/product development in active zones:
  - `apps/web`, `apps/consumer-mobile`, `packages/*`, `supabase/*`
- Keep historical materials discoverable but out of active path through `archive/`.
