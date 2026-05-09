# Definition of Ready (DoR) — Phase 009 / Polish

Projekt: `funcup`  
Zakres odniesienia: domkniety Phase 008 (US6, T075-T080) i wejscie w Phase 009 (Polish, T081-T088).

Ten dokument definiuje warunki wejscia do sprintu implementujacego Polish (finalne wykończenie przed release).

## 1) Gate wejsciowy po Phase 008

- [x] Backlog ma formalny sign-off dla Phase 008 (US6).
- [x] Testy sign-off Phase 008 przeszly (shared + mobile; regresja web z lokalnym Supabase):
  - [x] `pnpm -C packages/shared test`
  - [x] `pnpm -C packages/shared typecheck`
  - [x] `pnpm -C apps/consumer-mobile typecheck`
  - [x] `pnpm -C apps/web test:generate-qr` (wymaga `supabase start` + `SUPABASE_*` w `apps/web/.env.local`)
  - [x] `pnpm -C apps/web test:e2e` (j.w.)

## 2) Repozytorium i srodowisko

- [x] `pnpm install` konczy sie bez bledow blokujacych.
- [x] `pnpm-lock.yaml` jest aktualny.
- [x] Baseline lokalny: Node `22.x`, pnpm `10.x` (zalecane).
- [x] Supabase CLI + Docker do testow web wymagajacych API lokalnego.

## 3) Zakres sprintu (Phase 009)

- [x] Sprint goal: domknac Polish (`T081-T088`).
- [x] Zakres committed: error/loading/empty UX, deep links, a11y, performance, EAS, final QA.

## 4) Zaleznosci produktowe

- [x] Wszystkie user stories MVP (US1–US6) sa zaimplementowane w backlogu przed Polish.
- [x] Lista priorytetow a11y/perf uzgodniona (minimalny zakres vs “ideal”) — minimal: mobile tab/hub/CTA labels + web `/q` status/alert; perf: Next `images.remotePatterns` dla Supabase storage, build report jako baseline.

## 5) Jakosc i test plan

- [x] Regresja automatyczna (shared + mobile) przed merge Phase 009.
- [x] Regresja Playwright (generate-qr + e2e) przed final sign-off Phase 009.
- [x] Checklist `T088` wypelniona przed oznaczeniem fazy jako PASS (smoke: patrz `PHASE009_HANDOFF.md` sekcja QA).

## 6) Ryzyka

- [x] Ryzyko: scope Polish rozplywa sie — mitigacja: trzymac sie taskow T081-T088 i checklisty.
- [x] Ryzyko: regresja US2 — mitigacja: rerun `test:generate-qr` i `test:e2e` z lokalnym Supabase.

## 7) Go / No-Go

Phase 009 moze startowac, gdy Phase 008 ma sign-off w backlogu i quality gate shared+mobile jest PASS.

Status: **DONE** — Phase 009 zamkniety: **SIGN-OFF PASS** (2026-04-10); evidence: `PHASE009_HANDOFF.md` (section 11), `project-log.md` (section 3).
