# Beta Readiness Report

Data: 2026-05-07
Branch: `mvp-release-candidate`
Repo: `funcup`

## 1) P0 status

### P0-1 Release hardening + QA gate (`010-034..010-038`)
- Status: **PARTIAL / CONDITIONAL PASS**
- Done:
  - release checklist z mierzalnym PASS/FAIL: `mvp-release-flow-diagrams/BETA_RELEASE_CHECKLIST.md`
  - smoke runbook + runner script: `mvp-release-flow-diagrams/BETA_SMOKE_RUNBOOK.md`, `scripts/beta-smoke-tests.sh`
- Open:
  - 010-034/010-036/010-037 wymagają manual evidence (device/accessibility/perf).

### P0-2 Error contracts + UI messages (`010-030..010-033`)
- Status: **MOSTLY DONE**
- Done:
  - wspólna normalizacja błędów i retry policy (`packages/shared/src/errors/flowError.ts`)
  - integracja w mobile + web + shared (`scan`, `tasting log`, `analytics`)
  - spójne logowanie cross-app `[flow-error]`
  - dokument kontraktów: `mvp-release-flow-diagrams/BETA_ERROR_CONTRACTS.md`
  - analytics refresh behavior 30s (`useRoasterAnalytics` + web UI copy)
- Open:
  - 010-031 backend duplicate hints: brak final decyzji i payload flag po stronie functions
  - 010-032 backend rate-limit enforcement: kontrakt UI gotowy, brak enforce w edge functions

### P0-3 Stabilny i udokumentowany E2E krytyczny flow US1
- Status: **DONE (testable runbook + smoke evidence)**
- Done:
  - runbook + smoke script
  - smoke execution evidence (sekcja 3)

### P0-4 Spójność loading/empty/error dla blockerów beta
- Status: **DONE dla krytycznych ekranów flow**
- Done:
  - coffee scan resolve -> ujednolicone error copy
  - tasting log -> ujednolicone retry/validation/unauthorized copy
  - roaster analytics -> ujednolicone error copy + empty handling + refresh notice

## 2) Zmiany w kodzie i dokumentacji

### Shared contracts and services
- `packages/shared/src/errors/flowError.ts`
- `packages/shared/src/errors/flowError.test.ts`
- `packages/shared/src/hooks/useCoffeePage.ts`
- `packages/shared/src/hooks/useRoasterAnalytics.ts`
- `packages/shared/src/services/tastingService.ts`
- `packages/shared/src/index.ts`

### Mobile/Web UI integration
- `apps/consumer-mobile/app/coffee/[id]/index.tsx`
- `apps/consumer-mobile/app/coffee/[id]/log.tsx`
- `apps/web/app/q/[hash]/page.tsx`
- `apps/web/app/roaster-hub/analytics/[batchId]/page.tsx`

### Release docs + flows
- `scripts/beta-smoke-tests.sh`
- `mvp-release-flow-diagrams/BETA_ERROR_CONTRACTS.md`
- `mvp-release-flow-diagrams/BETA_RELEASE_CHECKLIST.md`
- `mvp-release-flow-diagrams/BETA_SMOKE_RUNBOOK.md`
- `mvp-release-flow-diagrams/MVP_CANDIDATE_ASSESSMENT.md`
- `mvp-release-flow-diagrams/05_error_offline_sync_flows.mmd`

## 3) Wyniki smoke-testów

### A. Runner script
Command:
```bash
bash scripts/beta-smoke-tests.sh
```
Result:
- PASS: Shared tasting/offline
- PASS: Shared coffee-page normalization
- PASS: Web key logic tests
- WARN: Web e2e smoke in sandbox (`EPERM listen 0.0.0.0:3006`)
- PASS fallback: Web unit subset
- Summary: `PASS (pass=4, warn=1, fail=0)`

### B. E2E rerun outside sandbox
Command:
```bash
pnpm -C apps/web test:e2e -- --grep "coffee-bank|qr|analytics"
```
Result:
- PASS: `8 passed (26.3s)`

## 4) Ryzyka po zmianach
- Backend rate-limit enforcement (`010-032`) nadal do wdrożenia po stronie Supabase functions.
- Backend payload flags dla duplicate/inactive semantics (`010-031`) częściowo poza zakresem tej paczki.
- Final gate `010-034/036/037` wymaga manualnych dowodów QA (device + accessibility + perf).

## 4b) Data-first hardening update — 2026-05-08

- Dostarczony stock-taking danych screen/field:
  - `mvp-release-flow-diagrams/SCREEN_FIELD_PARITY_MATRIX.md`
  - `mvp-release-flow-diagrams/06_screen_field_parity.mmd`
- Roaster data profile MVP core wdrożony (shared contract + persistence):
  - `packages/shared/src/roasterDataProfile/telemetryCore.ts`
  - `packages/shared/src/roasterDataProfile/telemetryCoreService.ts`
  - `supabase/migrations/0016_coffee_log_telemetry_core.sql`
- Mobile navigation polish:
  - Rated Coffees -> detail/edit/delete: `/coffee-log/[logId]`
  - Roasters local search `contains(name|city)` dla Followed i Discover
- Conservative cleanup:
  - usunięte jedynie jednoznaczne artefakty systemowe `.DS_Store`
  - log cleanupu: `dev-docs/repo-hygiene/CONSERVATIVE_CLEANUP_2026-05-08.md`

## 5) Rekomendowany następny krok
1. Zrobić manual evidence sprint dla 010-034/036/037 i dołączyć artefakty (nagrania/screenshoty + checklist PASS/FAIL).
2. Zamknąć backend `010-031/010-032` (flags + rate-limit responses) i zaktualizować `BETA_ERROR_CONTRACTS.md` o final payload examples.

## Manual evidence sprint — 2026-05-08 (010-034/036/037)

Evidence pack:
- `dev-docs/DoR/PHASE010_MANUAL_EVIDENCE_2026-05-07/CHECKLIST_010-034_036_037.md`
- `dev-docs/DoR/PHASE010_MANUAL_EVIDENCE_2026-05-07/ARTIFACTS_MANIFEST.md`

Gate result:
- 010-034: PARTIAL (Profile Expert PASS, Community BLOCKED in current manual flow)
- 010-036: FAIL (web keyboard focus missing on Sign in/Create one)
- 010-037: PARTIAL (Coffee tab scroll PASS, analytics load PASS, Coffee Page entrypoint BLOCKED in this session)
- Overall: FAIL (accessibility blocker)

Follow-up:
1. Fix web focus order/visibility on login CTA + register link.
2. Re-run 010-036 keyboard test and update screenshot evidence.
3. Expose/verify Community section entrypoint for full 010-034 closure.
4. Re-run final gate and update checklist from FAIL to PASS/PARTIAL as applicable.
