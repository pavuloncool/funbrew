# Beta Release Checklist (Phase 010 gate 010-033..010-038)

Date: 2026-05-09  
Owner: `mvp-release-candidate`  
Integration source of truth: `meta/runbooks/BETA_INTEGRATION_CONTRACT.md`

## Beta system definition (release hard gate)
- [x] Beta is one system: `product/apps/web` + `product/apps/consumer-mobile` + `product/packages/shared` + one shared Supabase backend.
- [x] Beta is not a web-only deploy.
- [x] Scope lock: publish batch -> scan/resolve hash -> coffee page -> tasting log -> analytics.
- [x] Critical error contracts (`scan/log/analytics`) are mapped to UI copy (`BETA_ERROR_CONTRACTS.md`).

## PASS/FAIL criteria

### 010-033 Deployment parity gate (web + mobile + shared backend)
- PASS when:
  - env matrix from `BETA_DEPLOY_PLAN.md` is filled for the current RC,
  - `product/apps/web` and `product/apps/consumer-mobile` point to the same Supabase beta,
  - deploy order is executed without skipping mobile.
- Status: **OPEN**
- Evidence required:
  - `BETA_PUBLIC_WEB_ORIGIN`,
  - `BETA_SUPABASE_URL` (sanity only, no secret dump),
  - mobile build profile + timestamp,
  - `product/scripts/mobile-functions-smoke-check.sh` result against beta endpoint.

### 010-034 US4 UX audit (mobile)
- PASS when:
  - no progress bar or unlock toast in reputation path,
  - Community/Profile shows subtle expert state without gamification noise.
- Status: **OPEN (manual QA required on device)**
- Evidence gap: no fresh device session recording for current RC.

### 010-035 US5 offline UX audit (mobile)
- PASS when:
  - coffee page is readable offline,
  - pending sync indicator is visible,
  - reconnect sync clears queue in <= 30s.
- Status: **PARTIAL**
- Evidence: 30s auto-sync interval and queue handling are in code; no fresh device run with timestamp.

### 010-036 Cross accessibility pass
- PASS when:
  - contrast/labels/focus are checked for touched screens on web + mobile.
- Status: **OPEN (manual accessibility pass pending)**

### 010-037 Cross performance sanity
- PASS when:
  - no performance blockers on key lists and images,
  - journal/coffee list remains smooth in smoke.
- Status: **OPEN (profiling run pending)**

### 010-038 Final release sign-off
- PASS when:
  - US1/US2/US6 smoke has PASS evidence,
  - P0 blockers are resolved or have an explicit release plan.
- Status: **IN PROGRESS**
- Evidence baseline: `BETA_SMOKE_RUNBOOK.md` + `product/scripts/beta-smoke-tests.sh` + `BETA_READINESS_REPORT_2026-05-07.md`.

## Cross-app smoke checks (release-blocking)
- [ ] `bash product/scripts/beta-smoke-tests.sh` => PASS (required steps + fallback policy respected).
- [ ] `bash product/scripts/mobile-functions-smoke-check.sh <SUPABASE_FUNCTIONS_BASE_URL>` => PASS (`scan_qr`, `log_tasting` or legacy fallback, `update_coffee_stats`).
- [ ] Web publish path generates `https://<host>/q/{hash}` (via `/api/batch-qr` or `/api/qr`) and hash resolves publicly.
- [ ] Mobile scan accepts `https://<host>/q/{hash}` and opens coffee page via `parseFuncupQrScanPayload`.
- [ ] Mobile tasting log writes data and web batch analytics shows new entry/aggregates after refresh (max 30s polling cycle).
- [ ] Role gates work on both sides:
  - consumer session on web -> local sign-out + `/login?reason=consumer_mobile_only`,
  - roaster session on mobile -> local sign-out + `/(auth)/login-form?reason=roaster_web_only`.

## Final deploy checklist (010-038 final gate)
- [ ] Web deploy target env is correct: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`.
- [ ] QR/open-in-app env is correct: `QR_PUBLIC_HOST`, `APP_STORE_URL`, `PLAY_STORE_URL`, `ANDROID_SHA256_CERT_FINGERPRINTS`, `APPLE_TEAM_ID`.
- [ ] `pnpm qr:check` => PASS for the final beta host before web deploy.
- [ ] Mobile build env is correct: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (no fallback to `127.0.0.1:54321`).
- [ ] Supabase beta has matching migrations + functions (`scan_qr`, `log_tasting`, `update_coffee_stats`, `submit_contact_lead`).
- [ ] Public `/q/{hash}` works without session and survives host change.
- [ ] Contact lead flow (`/api/lead-submit` -> `submit_contact_lead`) saves lead, and email notify failure does not block user success.

### Cross-app compatibility (must be PASS before deploy)
- [ ] Web and mobile point to the same logical `SUPABASE_URL` target (no split-backend or stale env cache).
- [ ] `log_tasting` payload shape remains compatible with analytics read model (no breaking change without cross-app review).
- [ ] Every mobile edit/delete log mutation still calls `updateCoffeeStats` for `batch_id`.
- [ ] QR host contract and deep link contract are both valid (`https://<host>/q/{hash}`, `funcup://q/{hash}`, bare UUID parsing).

## Hard gate summary
- Gate result: **CONDITIONAL PASS**
- Conditions for full PASS:
  - close 010-033 deployment parity gate,
  - close 010-034/036/037 manual evidence,
  - close cross-app compatibility checklist in this document.
