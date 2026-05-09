# Definition of Ready (DoR) - Next Sprint (Phase 008 / US6)

Projekt: `funcup`  
Zakres odniesienia: domkniety Phase 007 (US5, T069-T074) i wejscie w Phase 008 (US6, T075-T080).

Ten dokument definiuje warunki wejscia do sprintu implementujacego Roaster Analytics.

> **Phase 008 zamkniety (sign-off 2026-04-10).** Kontynuacja: Phase 009 — [DEFINTION_OF_READY_PHASE009.md](DEFINTION_OF_READY_PHASE009.md), [PHASE009_HANDOFF.md](PHASE009_HANDOFF.md).

## 1) Gate wejsciowy po Phase 007

- [x] Backlog ma formalny sign-off dla Phase 007 (US5).
- [x] Testy sign-off Phase 007 przeszly lokalnie:
  - [x] `pnpm -C packages/shared test`
  - [x] `pnpm -C packages/shared typecheck`
  - [x] `pnpm -C apps/consumer-mobile typecheck`
- [x] Regression gate US2 jest zielony po zmianach US5:
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

## 3) Zakres sprintu (Phase 008)

- [x] Sprint goal jest jednoznaczny: dostarczyc US6 (Roaster Analytics).
- [x] Zakres committed obejmuje: `T075-T080`.
- [x] Kolejnosc realizacji:
  1. `T079` useRoasterAnalytics hook
  2. `T076` AnalyticsSummary
  3. `T077` TopFlavorNotes
  4. `T078` BrewMethodFilter
  5. `T075` analytics page composition
  6. `T080` integration test + hardening
- [x] Zaleznosci miedzy taskami sa jawne (data hook <-> aggregates <-> filter <-> page <-> integration).

## 4) Backend / dane wymagane przez US6

- [x] Migracje i seed z poprzednich faz sa w repo i dzialaja lokalnie.
- [x] Istnieje baza danych tasting logs potrzebna do agregacji.
- [ ] Potwierdzona jest finalna definicja metryk (total, average, distribution, top notes).
- [ ] Potwierdzona jest semantyka filtra brew method (co filtruje i czego nie filtruje).

## 5) Frontend readiness dla US6 (web-first)

- [x] Istnieja komponenty i flow do rozszerzenia:
  - [x] `apps/web/app/dashboard/coffees/[id]/batches/[batchId]/page.tsx`
  - [x] `apps/web/app/dashboard/coffees/page.tsx`
  - [x] `packages/shared/src/services/tastingService.ts`
- [ ] Zdefiniowane sa wszystkie states dla analytics UX:
  - loading
  - empty
  - partial-data
  - error
- [ ] Uzgodniony jest finalny UX prezentacji metryk i filtrow.

## 6) Jakosc i test plan (wymagane do wejscia w sprint)

- [x] Dla US2/US3/US4/US5 istnieja testy automatyczne i sa zielone.
- [ ] Dla US6 zaplanowano minimum testowe:
  - [ ] test hooka `useRoasterAnalytics` (`T079`)
  - [ ] test aggregate components (`T076`, `T077`)
  - [ ] test filtra brew method (`T078`)
  - [ ] integration test 5 mock tastings -> stats correct -> filter works (`T080`)
- [ ] Definition of Done dla T075-T080 jest wpisane przy kazdym tasku (owner, estymacja, zaleznosci, testy).

## 7) Ryzyka i decyzje przed startem

- [ ] Ryzyko: niespojne aggregate calculations miedzy UI i backend - decyzja: single source of truth + jawny kontrakt hooka.
- [ ] Ryzyko: filtr zaburza interpretacje metryk - decyzja: jasny podzial metryk globalnych i filtrowanych.
- [x] Ryzyko: regresja US2/US3/US4/US5 - mitigacja: rerun regression gate przed merge.

## 8) Go / No-Go dla sprintu Phase 008

Sprint Phase 008 moze wystartowac, jezeli jednoczesnie:

- [x] Phase 007 ma formalny sign-off w backlogu,
- [x] testy sign-off Phase 007 sa PASS,
- [x] backlog T075-T080 jest gotowy i sproiorytetyzowany,
- [ ] test plan dla US6 jest rozpisany per task i zaakceptowany przez zespol.

Status: **Zakonczony** — sprint Phase 008 dostarczony; backlog T075–T080 `[x]`; nastepny sprint: Polish (Phase 009).
