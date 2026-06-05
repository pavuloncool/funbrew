# Beta Smoke Runbook

Date: 2026-05-09  
Main script: `product/scripts/beta-smoke-tests.sh`  
Aux script: `product/scripts/mobile-functions-smoke-check.sh`  
Contract reference: `meta/runbooks/BETA_INTEGRATION_CONTRACT.md`

## Purpose
Repeatable RC smoke gate for beta as one integrated system: web + mobile + shared Supabase backend.

## Preflight (before smoke)
1. Confirm deploy target and env parity:
```bash
echo "$NEXT_PUBLIC_SUPABASE_URL"
echo "$EXPO_PUBLIC_SUPABASE_URL"
```
Expected: web and mobile point to the same Supabase beta project.
2. Confirm mobile is not using local fallback (`127.0.0.1:54321`) in beta build.
3. Confirm QR public host (`NEXT_PUBLIC_APP_URL`) is the current beta host.

## Verification sequence (release order)
1. Supabase functions readiness:
```bash
bash product/scripts/mobile-functions-smoke-check.sh https://<project-ref>.supabase.co/functions/v1
```
PASS criteria: `scan_qr`, `log_tasting` (or legacy `coffee/log-tasting`), `update_coffee_stats` are reachable.

2. Code-level smoke:
```bash
bash product/scripts/beta-smoke-tests.sh
```

3. Manual cross-app loop (same backend):
- Publish batch on web and generate QR URL `https://<beta-host>/q/{hash}`.
- Open `/q/{hash}` in browser without session.
- Scan the same QR in mobile beta build.
- Save tasting log on mobile.
- Verify web batch analytics reflects new data after refresh (up to 30s polling window).

4. Cross-role gate sanity:
- Login as `consumer` on web protected route, expect local sign-out + `/login?reason=consumer_mobile_only`.
- Login as `roaster` on mobile, expect local sign-out + `/(auth)/login-form?reason=roaster_web_only`.

## What `beta-smoke-tests.sh` runs
1. Shared tasting/offline tests:
```bash
pnpm -C product/packages/shared test -- src/services/tastingService.test.ts src/services/offlineTastingQueue.test.ts src/services/offlineTasting.integration.test.ts
```
2. Shared coffee-page normalization:
```bash
pnpm -C product/packages/shared test -- src/coffeePage/normalizeCoffeePage.test.ts
```
3. Web key logic tests:
```bash
pnpm -C product/apps/web test -- src/lib/canonicalBatchFlow.test.ts src/lib/uploadCoffeeLabel.test.ts
```
4. Web e2e smoke (optional environment gate):
```bash
pnpm -C product/apps/web test:e2e -- --grep "batch|qr|analytics"
```

## Optional e2e fallback behavior
If step 4 fails locally (for example missing Playwright browsers or no local stack), script behavior is:
- log explicit reason (tail of error output),
- run fallback smoke:
```bash
pnpm -C product/apps/web test -- src/lib/canonicalBatchFlow.test.ts src/lib/uploadCoffeeLabel.test.ts
```

## Exit code policy
- `exit 1`: any required smoke/fallback failure.
- `exit 0`: required smoke PASS; optional e2e may be WARN if fallback PASS.

## Reporting template (RC evidence)
After every run, append to readiness report:
- date/time,
- commit SHA,
- result per step (PASS/FAIL/WARN) for:
  - mobile functions readiness,
  - code-level smoke,
  - manual cross-app loop,
  - cross-role gate sanity,
- reason for each WARN/FAIL,
- explicit note if fallback path was used.
