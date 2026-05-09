# Definition of Ready (DoR) - Next Sprint (Phase 007 / US5)

Projekt: `funcup`  
Zakres odniesienia: domkniety Phase 006 (US4, T064-T068) i wejscie w Phase 007 (US5, T069-T074).

Ten dokument definiuje warunki wejscia do sprintu implementujacego Offline Tasting.

## 1) Gate wejsciowy po Phase 006

- [x] Backlog ma formalny sign-off dla Phase 006 (US4).
- [x] Testy sign-off Phase 006 przeszly lokalnie:
  - [x] `pnpm -C packages/shared test`
  - [x] `pnpm -C packages/shared typecheck`
  - [x] `pnpm -C apps/consumer-mobile typecheck`
- [x] Regression gate US2 jest zielony po zmianach US4:
  - [x] `pnpm -C apps/web test:generate-qr`
  - [x] `pnpm -C apps/web test:e2e`

## 2) Repozytorium i srodowisko

- [x] `pnpm install` konczy sie bez bledow blokujacych.
- [x] `pnpm-lock.yaml` jest aktualny.
- [x] Baseline lokalny:
  - [x] Node `22.x`
  - [x] pnpm `10.x`
- [ ] Kazdy dev potwierdzil baseline na swoim komputerze.
- [x] Srodowiska uruchomieniowe sa gotowe:
  - [x] `apps/consumer-mobile` startuje lokalnie
  - [x] `apps/web` startuje lokalnie
  - [x] Supabase local stack startuje lokalnie

## 3) Zakres sprintu (Phase 007)

- [x] Sprint goal jest jednoznaczny: dostarczyc US5 (Offline Tasting).
- [x] Zakres committed obejmuje: `T069-T074`.
- [x] Kolejnosc realizacji:
  1. `T069` MMKV offline queue
  2. `T070` NetInfo connectivity listener
  3. `T071` offline-aware useCoffeePage
  4. `T072` sync na reconnect
  5. `T073` conflict resolution
  6. `T074` integration test + hardening
- [x] Zaleznosci miedzy taskami sa jawne (queue <-> connectivity <-> sync <-> conflict).

## 4) Backend / dane wymagane przez US5

- [x] Migracje i seed z poprzednich faz sa w repo i dzialaja lokalnie.
- [x] `tastingService` posiada operacje potrzebne do flush kolejki.
- [ ] Potwierdzony jest finalny format payloadu queue item dla offline sync.
- [ ] Uzgodnione sa scenariusze konfliktow i idempotencji.

## 5) Frontend readiness dla US5 (mobile-first)

- [x] Istnieja komponenty i flow do rozszerzenia:
  - [x] `apps/consumer-mobile/app/coffee/[id]/log.tsx`
  - [x] `packages/shared/src/hooks/useCoffeePage.ts`
  - [x] `packages/shared/src/services/tastingService.ts`
- [ ] Zdefiniowane sa wszystkie states dla offline UX:
  - queued
  - syncing
  - synced
  - conflict-resolved
- [ ] Uzgodniony jest finalny UX sygnalizacji offline (bez szumu i bez regresji UX).

## 6) Jakosc i test plan (wymagane do wejscia w sprint)

- [x] Dla US2/US3/US4 istnieja testy automatyczne i sa zielone.
- [ ] Dla US5 zaplanowano minimum testowe:
  - [ ] test kolejki MMKV (`T069`)
  - [ ] test listenera reconnect (`T070`)
  - [ ] test stale cache behavior (`T071`)
  - [ ] test sync + retry (`T072`)
  - [ ] test conflict resolution (`T073`)
  - [ ] integration test airplane mode -> sync <= 30s (`T074`)
- [ ] Definition of Done dla T069-T074 jest wpisane przy kazdym tasku (owner, estymacja, zaleznosci, testy).

## 7) Ryzyka i decyzje przed startem

- [ ] Ryzyko: duplikaty sync po reconnect - decyzja: idempotentny flush + dedupe key.
- [ ] Ryzyko: race conditions przy wielu pending entries - decyzja: deterministic queue order.
- [x] Ryzyko: regresja US2/US3/US4 - mitigacja: rerun regression gate przed merge.

## 8) Go / No-Go dla sprintu Phase 007

Sprint Phase 007 moze wystartowac, jezeli jednoczesnie:

- [x] Phase 006 ma formalny sign-off w backlogu,
- [x] testy sign-off Phase 006 sa PASS,
- [x] backlog T069-T074 jest gotowy i sproiorytetyzowany,
- [ ] test plan dla US5 jest rozpisany per task i zaakceptowany przez zespol.

Status: **GO warunkowe** (mozna startowac implementacje, ale zamknac otwarte checkboxy planistyczne najpozniej na kick-off sprintu).
