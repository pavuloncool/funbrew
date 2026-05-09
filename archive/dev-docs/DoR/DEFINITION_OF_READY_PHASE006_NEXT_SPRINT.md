# Definition of Ready (DoR) - Next Sprint (Phase 006 / US4)

Projekt: `funcup`  
Zakres odniesienia: domkniety Phase 005 (US3, T054-T063) i wejscie w Phase 006 (US4, T064-T068).

Ten dokument definiuje warunki wejscia do sprintu implementujacego Sensory Reputation.

## 1) Gate wejsciowy po Phase 005

- [x] Backlog ma formalny sign-off dla Phase 005 (US3).
- [x] Testy sign-off Phase 005 przeszly lokalnie:
  - [x] `pnpm -C packages/shared test`
  - [x] `pnpm -C packages/shared typecheck`
  - [x] `pnpm -C apps/consumer-mobile typecheck`
- [x] Regression gate US2 jest zielony po zmianach US3:
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

## 3) Zakres sprintu (Phase 006)

- [x] Sprint goal jest jednoznaczny: dostarczyc US4 (Sensory Reputation).
- [x] Zakres committed obejmuje: `T064-T068`.
- [x] Kolejnosc realizacji:
  1. `T064` reputation level w profilu
  2. `T065` flavor selector expansion per level (silent)
  3. `T066` subtle expert label
  4. `T067` integration test
  5. `T068` guardy anty-gamification
- [x] Zaleznosci miedzy taskami sa jawne (profile <-> selector <-> community <-> tests).

## 4) Backend / dane wymagane przez US4

- [x] Migracje i seed z poprzednich faz sa w repo i dzialaja lokalnie.
- [x] Reputation thresholds sa zdefiniowane w shared constants.
- [ ] Potwierdzony jest finalny mapping poziomow reputacji do UX selectora.
- [ ] Uzgodnione sa graniczne przypadki (np. exact threshold boundaries).

## 5) Frontend readiness dla US4 (mobile-first)

- [x] Istnieja komponenty docelowe do rozszerzenia:
  - [x] `FlavorNoteSelector`
  - [x] `CoffeePageCommunity`
- [ ] Zdefiniowane sa states dla poziomow reputacji:
  - beginner
  - advanced
  - expert
- [ ] Uzgodniony jest finalny UX "silent progression" (bez widocznego unlock flow).

## 6) Jakosc i test plan (wymagane do wejscia w sprint)

- [x] Dla US2 i US3 istnieja testy automatyczne i sa zielone.
- [ ] Dla US4 zaplanowano minimum testowe:
  - [ ] test mapowania reputacji i progow (`T064/T065`)
  - [ ] test expert label (`T066`)
  - [ ] integration test awansu reputacji (`T067`)
  - [ ] guard testy negatywne: no progress bar / no unlock msg / no notification (`T068`)
- [ ] Definition of Done dla T064-T068 jest wpisane przy kazdym tasku (owner, estymacja, zaleznosci, testy).

## 7) Ryzyka i decyzje przed startem

- [ ] Ryzyko: UX moze niechcacy wejsc w gamification - decyzja: explicit guardy i review checklist.
- [ ] Ryzyko: niejasny boundary na progach reputacji - decyzja: zatwierdzic cases before coding.
- [x] Ryzyko: regresja US2/US3 - mitigacja: rerun regression gate przed merge.

## 8) Go / No-Go dla sprintu Phase 006

Sprint Phase 006 moze wystartowac, jezeli jednoczesnie:

- [x] Phase 005 ma formalny sign-off w backlogu,
- [x] testy sign-off Phase 005 sa PASS,
- [x] backlog T064-T068 jest gotowy i sproiorytetyzowany,
- [ ] test plan dla US4 jest rozpisany per task i zaakceptowany przez zespol.

Status: **GO warunkowe** (mozna startowac implementacje, ale zamknac otwarte checkboxy planistyczne najpozniej na kick-off sprintu).
