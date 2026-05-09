# Phase 008 Handoff (US6 - Roaster Analytics)

Ten dokument jest skrocona pamiecia robocza do startu nowego czatu dla implementacji Phase 008.

## 1) Status wejsciowy

- Phase 007 (US5, `T069-T074`) ma formalny sign-off: PASS.
- Backlog taskow jest zsynchronizowany z repo:
  - `funcup-src-docs/04-tasks/13-tasks-002-qr-coffee-platform-88-tasks.md`
  - Phase 007: wszystkie taski `T069-T074` oznaczone jako `[x]`.
- Quality gate US5 jest zielony:
  - `pnpm -C packages/shared test` -> PASS
  - `pnpm -C packages/shared typecheck` -> PASS
  - `pnpm -C apps/consumer-mobile typecheck` -> PASS
- Regression gate US2 po zmianach US5 jest zielony:
  - `pnpm -C apps/web test:generate-qr` -> PASS
  - `pnpm -C apps/web test:e2e` -> PASS

## 2) Cel sprintu (Phase 008 / US6)

Domknac US6: Roaster Analytics (`T075-T080`) z naciskiem na wiarygodne metryki i czytelny dashboard:

1. Ekran analityki batcha (`T075`)
2. Podsumowanie metryk: total tastings, avg rating, distribution (`T076`)
3. Top flavor notes component (`T077`)
4. Brew method filter (`T078`)
5. Hook `useRoasterAnalytics` (`T079`)
6. Integracyjny test: 5 mock tastings -> stats correct -> filter works (`T080`)

## 3) Aktualny stan kodu istotny dla US6

### Web

- Istnieja ekrany dashboardu roastera:
  - `apps/web/app/dashboard/coffees/page.tsx`
  - `apps/web/app/dashboard/coffees/[id]/page.tsx`
  - `apps/web/app/dashboard/coffees/[id]/batches/[batchId]/page.tsx`
- Istnieje flow danych dla batchy i tasting log:
  - `supabase/functions/coffee/log-tasting`
  - `packages/shared/src/services/tastingService.ts`

### Shared / testy

- Istnieje baseline testowy i integration coverage:
  - `packages/shared/src/hooks/us3IntegrationSmoke.test.ts`
  - `packages/shared/src/services/offlineTasting.integration.test.ts`

## 4) Scope implementacyjny Task-by-Task (Phase 008)

- `T075` `apps/web/dashboard/analytics/[batchId]/page.tsx`
- `T076` AnalyticsSummary component (total tastings, avg rating, distribution)
- `T077` TopFlavorNotes component
- `T078` BrewMethodFilter component
- `T079` useRoasterAnalytics hook
- `T080` Integration test: 5 mock tastings -> stats correct -> filter works

## 5) Krytyczne zasady i ograniczenia

- Nie psuc przeplywow US2/US3/US4/US5 (wszystkie maja sign-off PASS).
- Metryki musza byc deterministyczne i zgodne z danymi z backendu.
- Filtr brew method nie moze zafalszowac aggregate totals (jasny podzial: global vs filtered).
- Dla nowych core-dokumentow zawsze dodac link w `README.md`.
- Testy wprowadzac rownolegle do taskow (integration + edge cases filtrowania i agregacji).

## 6) Rekomendowany porzadek prac (bezpieczny)

1. `T079` (hook i kontrakt danych)
2. `T076` (summary metrics)
3. `T077` (top flavor notes)
4. `T078` (brew method filter)
5. `T075` (final page composition)
6. `T080` (integracja end-to-end i hardening)

## 7) Minimalny test plan US6 (quality gate)

- Unit/integration:
  - poprawne agregacje rating distribution,
  - poprawne top flavor notes dla danych mieszanych,
  - filtr brew method ogranicza tylko widok zgodnie z kryteriami.
- Integration:
  - 5 mock tastings -> stats correct -> filter works.
- Regression:
  - rerun US5 tests (`packages/shared` + mobile typecheck),
  - rerun US2 web regression (`test:generate-qr`, `test:e2e`) przed final sign-off.

## 8) Uruchomienie lokalne (quickstart)

```bash
pnpm install
supabase start --exclude logflare,vector,studio,imgproxy,mailpit
supabase functions serve --no-verify-jwt
pnpm -C apps/consumer-mobile start
pnpm -C apps/web dev
```

## 9) Sugerowany pierwszy prompt do nowego czatu

```text
Przeczytaj DEFINTION_OF_READY_PHASE008.md i PHASE008_HANDOFF.md i rozpocznij implementacje Phase 008 (US6, T075-T080).
Priorytet: T079/T076/T077 (analytics foundation), potem filtr i kompozycja strony (T078/T075),
na koncu integration test i hardening (T080), bez regresji US2/US3/US4/US5.
Pamietaj o aktualizacji checklisty taskow po kazdym domknietym tasku.
Pamietaj o hardening test przed Phase Sign-off.
```

## 10) Sign-off Phase 008 (2026-04-10)

- **Status:** PASS (US6, T075–T080).
- **Quality gate (shared + mobile):** `pnpm -C packages/shared test`, `pnpm -C packages/shared typecheck`, `pnpm -C apps/consumer-mobile typecheck` → PASS.
- **Hardening / regresja US2 (web):** `pnpm -C apps/web test:generate-qr`, `pnpm -C apps/web test:e2e` → PASS przy lokalnym Supabase (`supabase start`; klucze w `apps/web/.env.local` lub `./apps/web/scripts/sync-supabase-env-local.sh`).
- **US6:** integracja `packages/shared/src/analytics/roasterBatchAnalytics.test.ts` (mock tastings + filtr); ekran `apps/web/app/dashboard/analytics/[batchId]`.
- **Nastepna faza:** Phase 009 (Polish) — `PHASE009_HANDOFF.md`, `DEFINTION_OF_READY_PHASE009.md`.
