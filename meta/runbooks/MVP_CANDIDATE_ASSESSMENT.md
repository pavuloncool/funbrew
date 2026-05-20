# MVP Candidate Assessment (funcup)

Assessment date: 2026-05-09  
Scope: `product/apps/web` + `product/apps/consumer-mobile` + `product/packages/shared` + Supabase beta  
Integration reference: `meta/runbooks/BETA_INTEGRATION_CONTRACT.md`

## 1) Current MVP baseline

### A. Role boundaries and entry points
- `product/apps/web` serves roaster flow and public entry (`/`, `/q/{hash}`).
- `product/apps/consumer-mobile` serves consumer flow (auth + tabs + scan + coffee + log).
- Cross-role gates are implemented on both sides (`consumer_mobile_only`, `roaster_web_only`) as UX controls.

### B. Core product loop (publish -> scan -> log -> analytics)
- Web can publish batch and generate QR hash URL on `/q/{hash}`.
- Mobile can scan/parse QR payload (`https://.../q/{hash}`, `funcup://q/{hash}`, bare UUID).
- Mobile tasting writes through shared service path (`log_tasting`, fallback `coffee/log-tasting`) and triggers `update_coffee_stats`.
- Web analytics reads shared Supabase data with 30s refresh interval.

### C. Shared-backend assumptions validated in code
- Web and mobile both rely on Supabase URL + anon key environment contract.
- `resolveAccountRole` uses `user_metadata.app_role` first, with `roasters.user_id` fallback.
- Public hash resolve uses `scan_qr` function from shared backend.

## 2) MVP candidate conclusion

Functionally: **yes, this repo is an MVP candidate**.  
Release quality: **not yet full beta-ready** until remaining gate evidence is completed.

## 3) Beta blockers and gate status

### P0 (must-have before beta sign-off)
- Close release gate `010-033..010-038` with current evidence.
- Keep one-system deploy parity (web + mobile + shared Supabase) for every RC.
- Keep error contract parity (`scan/log/analytics`) across web/mobile/shared.
- Keep repeatable smoke evidence via runbook + scripts + manual cross-app loop.

### P1 (stability hardening for beta period)
- Finish web UX consistency/responsiveness polish where still open.
- Extend offline QA runs on real devices with timestamped evidence.
- Improve cross-app observability around scan/log/analytics failures.

## 4) Key release risks (cross-app)
- Env drift risk: mobile has local fallback config; wrong build env can silently target `127.0.0.1:54321` instead of beta Supabase.
- Backend contract risk: changes in `log_tasting` payload or response shape can break web analytics assumptions.
- Function readiness risk: missing or degraded `scan_qr`, `log_tasting`, `update_coffee_stats` blocks core loop.
- Host contract risk: `NEXT_PUBLIC_APP_URL` mismatch can generate QR links that do not match current beta host.
- Data consistency risk: mobile edit/delete bypass paths must still call `updateCoffeeStats`, or analytics becomes stale.
- Manual evidence risk: open accessibility/performance/device checks can delay final sign-off.

## 5) Recommended path to full beta-ready
1. Execute `BETA_RELEASE_CHECKLIST.md` final deploy checklist, including cross-app compatibility section.
2. Run `BETA_SMOKE_RUNBOOK.md` full sequence (functions readiness, code smoke, manual cross-app loop, role-gate sanity).
3. Update `BETA_READINESS_REPORT_2026-05-07.md` with fresh timestamped evidence for current RC.
4. Close open manual gates (`010-034`, `010-036`, `010-037`) with artifacts linked in report.
