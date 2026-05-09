# Phase 007 Handoff (US5 - Offline Tasting)

Ten dokument jest skrocona pamiecia robocza do startu nowego czatu dla implementacji Phase 007.

## 1) Status wejsciowy

- Phase 006 (US4, `T064-T068`) ma formalny sign-off: PASS.
- Backlog taskow jest zsynchronizowany z repo:
  - `funcup-src-docs/04-tasks/13-tasks-002-qr-coffee-platform-88-tasks.md`
  - Phase 006: wszystkie taski `T064-T068` oznaczone jako `[x]`.
- Quality gate US4 jest zielony:
  - `pnpm -C packages/shared test` -> PASS
  - `pnpm -C packages/shared typecheck` -> PASS
  - `pnpm -C apps/consumer-mobile typecheck` -> PASS
- Regression gate US2 po zmianach US4 jest zielony:
  - `pnpm -C apps/web test:generate-qr` -> PASS
  - `pnpm -C apps/web test:e2e` -> PASS

## 2) Cel sprintu (Phase 007 / US5)

Domknac US5: Offline Tasting (`T069-T074`) z naciskiem na niezawodny offline-first workflow:

1. Kolejka wpisow tastingow w MMKV (`T069`)
2. NetInfo listener i wykrywanie reconnect (`T070`)
3. Offline-aware `useCoffeePage` z `staleTime: Infinity` (`T071`)
4. Sync kolejki po reconnect do `tastingService` (`T072`)
5. Conflict resolution last-write-wins dla ratingow (`T073`)
6. Integracyjny test: airplane mode -> queue -> sync <= 30s (`T074`)

## 3) Aktualny stan kodu istotny dla US5

### Mobile

- Istnieje ekran logowania tastingu:
  - `apps/consumer-mobile/app/coffee/[id]/log.tsx`
- Istnieje Coffee Page i baza pod cache:
  - `apps/consumer-mobile/app/coffee/[id]/index.tsx`
  - `packages/shared/src/hooks/useCoffeePage.ts`
- Wspolna warstwa service:
  - `packages/shared/src/services/tastingService.ts`

### Shared / testy

- Istnieje konfiguracja testowa i integration baseline:
  - `packages/shared/src/hooks/reputation.integration.test.ts`
  - `packages/shared/src/hooks/us3IntegrationSmoke.test.ts`

## 4) Scope implementacyjny Task-by-Task (Phase 007)

- `T069` MMKV offline queue implementation
- `T070` NetInfo connectivity listener
- `T071` Offline-aware useCoffeePage (staleTime: Infinity)
- `T072` Sync on reconnect — flush queue to tastingService
- `T073` Conflict resolution (last-write-wins for ratings)
- `T074` Integration test: airplane mode -> queue -> sync within 30s

## 5) Krytyczne zasady i ograniczenia

- Nie psuc przeplywow US2/US3/US4 (wszystkie maja sign-off PASS).
- Zachowac zasade offline-first:
  - wpis tastingu nigdy nie ginie przy braku sieci,
  - user dostaje przewidywalny stan lokalny,
  - sync jest idempotentny i odporny na retry.
- Dla nowych core-dokumentow zawsze dodac link w `README.md`.
- Testy wprowadzac rownolegle do taskow (integration + guardy konfliktow).

## 6) Rekomendowany porzadek prac (bezpieczny)

1. `T069` (kolejka MMKV i model payloadu)
2. `T070` (NetInfo listener i status online/offline)
3. `T071` (cache strategy i staleTime w hooku)
4. `T072` (flush kolejki po reconnect)
5. `T073` (last-write-wins i edge cases)
6. `T074` (integracja end-to-end i hardening)

## 7) Minimalny test plan US5 (quality gate)

- Unit/integration:
  - enqueue/dequeue w MMKV,
  - reconnect trigger uruchamia sync,
  - last-write-wins dla rating collisions.
- Integration:
  - airplane mode -> enqueue -> reconnect -> sync <= 30s.
- Regression:
  - rerun US4 tests (`packages/shared` + mobile typecheck),
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
Przeczytaj PHASE007_HANDOFF.md i rozpocznij implementacje Phase 007 (US5, T069-T074).
Priorytet: T069/T070/T071 (offline foundation), potem sync i conflict resolution (T072/T073),
na koncu integration test i hardening (T074), bez regresji US2/US3/US4.
Pamietaj o aktualizacji checklisty taskow po kazdym domknietym tasku.
Pamietaj o hardening test przed Phase Sign-off.
```
