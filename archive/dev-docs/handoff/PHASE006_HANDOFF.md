# Phase 006 Handoff (US4 - Sensory Reputation)

Ten dokument jest skrocona pamiecia robocza do startu nowego czatu dla implementacji Phase 006.

## 1) Status wejsciowy

- Phase 005 (US3, `T054-T063`) ma formalny sign-off: PASS.
- Backlog taskow jest zsynchronizowany z repo:
  - `funcup-src-docs/04-tasks/13-tasks-002-qr-coffee-platform-88-tasks.md`
  - Phase 005: wszystkie taski `T054-T063` oznaczone jako `[x]`.
- Quality gate US3 jest zielony:
  - `pnpm -C packages/shared test` -> PASS
  - `pnpm -C packages/shared typecheck` -> PASS
  - `pnpm -C apps/consumer-mobile typecheck` -> PASS
- Regression gate US2 po zmianach US3 jest zielony:
  - `pnpm -C apps/web test:generate-qr` -> PASS
  - `pnpm -C apps/web test:e2e` -> PASS

## 2) Cel sprintu (Phase 006 / US4)

Domknac US4: Sensory Reputation (`T064-T068`) z naciskiem na "silent progression":

1. Expose reputation level w profilu usera (`T064`)
2. Rozszerzanie flavor note selector per level bez komunikatow unlock (`T065`)
3. Subtelny expert label w Community (`T066`)
4. Test integracyjny awansu reputacji (`T067`)
5. Guard na brak progress bar / unlock message / notification (`T068`)

## 3) Aktualny stan kodu istotny dla US4

### Mobile

- Istnieja ekrany i komponenty, ktore beda rozszerzane:
  - `apps/consumer-mobile/app/coffee/[id]/components/FlavorNoteSelector.tsx`
  - `apps/consumer-mobile/app/coffee/[id]/CoffeePageCommunity.tsx`
- Reputation thresholds sa dostepne w shared:
  - `packages/shared/src/constants/reputationThresholds.ts`

### Shared / data

- Istnieja hooki i services pod log tasting oraz discovery:
  - `packages/shared/src/services/tastingService.ts`
  - `packages/shared/src/hooks/*`
- Fundament pod testy integracyjne jest gotowy (vitest w `packages/shared`).

## 4) Scope implementacyjny Task-by-Task (Phase 006)

- `T064` Expose reputation level in user profile screen
- `T065` Expand flavor note selector per reputation level (silent)
- `T066` Expert label in Community section (subtle)
- `T067` Integration test: reputation advances silently
- `T068` Guard: no progress bar, no unlock message, no notification

## 5) Krytyczne zasady i ograniczenia

- Nie psuc przeplywu US2 i US3 (obie fazy maja sign-off PASS).
- Zachowac "Founding Philosophy" dla reputacji:
  - brak gamification UX,
  - brak explicit unlock messaging,
  - progres ma byc odczuwalny przez UX, nie komunikowany popupami.
- Dla nowych core-dokumentow zawsze dodac link w `README.md`.
- Testy wprowadzac rownolegle do taskow (minimum integration + guard tests).

## 6) Rekomendowany porzadek prac (bezpieczny)

1. `T064` (widocznosc poziomu reputacji)
2. `T065` (selector behavior per level, silent)
3. `T066` (expert label)
4. `T067` (integration test awansu)
5. `T068` (guardy negatywne, brak niedozwolonych elementow UX)

## 7) Minimalny test plan US4 (quality gate)

- Unit/integration:
  - reputation level mapping per thresholds,
  - selector expansion logic by level,
  - community expert label visibility.
- Guard tests:
  - brak progress bar,
  - brak unlock message,
  - brak notifications zwiazanych z reputacja.
- Regression:
  - rerun US3 tests (`packages/shared` + mobile typecheck),
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
Przeczytaj PHASE006_HANDOFF.md i rozpocznij implementacje Phase 006 (US4, T064-T068).
Priorytet: T064/T065/T066 (reputation UX), potem test integracyjny i guardy (T067/T068),
bez regresji US2 i US3.
Pamietaj o aktualizacji checklisty taskow po kazdym domknietym tasku.
Pamietaj o hardening test przed Phase Sign-off.
```
