# Beta Readiness Report

Baseline date: 2026-05-07  
Doc refresh date: 2026-05-09  
Branch context: `mvp-release-candidate`  
Integration source of truth: `meta/runbooks/BETA_INTEGRATION_CONTRACT.md`

## 1) Beta system scope (hard constraint)
- Beta is one integrated system:
  - `product/apps/web` (roaster + public web entry),
  - `product/apps/consumer-mobile` (consumer app),
  - `product/packages/shared` (contracts/services),
  - one shared Supabase beta backend.
- Release readiness is invalid if any RC is evaluated as web-only.

## 2) Gate status snapshot
- 010-033 Deployment parity gate: **OPEN**.
- 010-034 Mobile UX audit: **OPEN** (manual device evidence pending).
- 010-035 Offline UX audit: **PARTIAL** (code behavior present; fresh device evidence pending).
- 010-036 Cross accessibility pass: **OPEN**.
- 010-037 Cross performance sanity: **OPEN**.
- 010-038 Final sign-off: **IN PROGRESS / CONDITIONAL PASS**.

Primary checklist: `meta/runbooks/BETA_RELEASE_CHECKLIST.md`

## 3) Smoke verification model (must be used for RC)
- Functions readiness:
```bash
bash product/scripts/mobile-functions-smoke-check.sh https://<project-ref>.supabase.co/functions/v1
```
- Code-level smoke:
```bash
bash product/scripts/beta-smoke-tests.sh
```
- Manual cross-app loop:
  - web publish + QR generate,
  - browser resolve `/q/{hash}`,
  - mobile scan + log tasting,
  - web analytics sees new data (<= 30s expected refresh cycle).
- Role-gate sanity:
  - consumer on web protected route => local sign-out + `consumer_mobile_only`,
  - roaster on mobile => local sign-out + `roaster_web_only`.

Runbook: `meta/runbooks/BETA_SMOKE_RUNBOOK.md`

## 4) Final deploy readiness (cross-app)
- Final deploy checklist is now explicit in:
  - `meta/runbooks/BETA_RELEASE_CHECKLIST.md` (section: `Final deploy checklist`),
  - same file section: `Cross-app compatibility`.
- Release manager should not approve RC without all items marked PASS with timestamped evidence.

## 5) Risks to track
- Env drift between web and mobile Supabase targets.
- Mobile local fallback (`127.0.0.1:54321`) accidentally used in beta build.
- Function availability regressions (`scan_qr`, `log_tasting`, `update_coffee_stats`, `submit_contact_lead`).
- Payload compatibility regressions between mobile writes and web analytics reads.
- QR host mismatch from wrong `NEXT_PUBLIC_APP_URL`.
- Manual evidence lag for accessibility/performance/device audits.

## 6) Code-aligned assumptions used by these docs
- Shared write path for tasting:
  - `product/packages/shared/src/services/tastingService.ts` invokes `log_tasting`,
  - fallback to `coffee/log-tasting` on `not_found`,
  - then invokes `update_coffee_stats`.
- Mobile scan payload parser accepts:
  - `https://<host>/q/{hash}`,
  - `funcup://q/{hash}`,
  - bare UUID.
- Web and mobile role gates are best-effort UX controls; Supabase RLS remains the security boundary.

## 7) Next action
1. Execute full runbook for current RC.
2. Update this report with exact timestamps, commit SHA, and PASS/FAIL evidence per gate item.
3. Close remaining open manual gates before final beta sign-off.
