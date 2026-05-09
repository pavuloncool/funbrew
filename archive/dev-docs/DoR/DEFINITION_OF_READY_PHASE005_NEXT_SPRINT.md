# Definition of Ready (DoR) — Next Sprint (Phase 005 / US3)

Projekt: `funcup`  
Zakres odniesienia: domkniety Phase 004 (US2, T043-T053) i wejscie w Phase 005 (US3, T054-T063).

Ten dokument definiuje warunki wejscia do sprintu implementujacego Coffee Hub + Discovery.

## 1) Gate wejsciowy po Phase 004

- [x] Backlog ma formalny sign-off dla Phase 004 (US2).
- [x] Testy sign-off Phase 004 przeszly lokalnie:
  - [x] `pnpm -C apps/web test:generate-qr`
  - [x] `pnpm -C apps/web test:e2e`
- [x] Runtime lokalny dziala:
  - [x] `supabase start --exclude logflare,vector,studio,imgproxy,mailpit`
  - [x] `supabase functions serve --no-verify-jwt`
- [x] Kontrakt API dla `generate_qr` pozostaje bez zmian.

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

## 3) Zakres sprintu (Phase 005)

- [x] Sprint goal jest jednoznaczny: dostarczyc US3 (Coffee Hub + Discovery).
- [x] Zakres committed obejmuje: `T054-T063`.
- [x] Kolejnosc realizacji:
  1. Hub shell i dominant scan CTA: `T054`, `T054b`
  2. Discovery tabs + hooki: `T055-T060`
  3. Learn tab + article screen + seed content: `T061-T063`
- [x] Zaleznosci miedzy taskami sa jawne (UI <-> hooki <-> dane seed).

## 4) Backend / dane wymagane przez US3

- [x] Migracje i seed z Phases 1-4 sa w repo i dzialaja lokalnie.
- [x] Seed zawiera dane bazowe potrzebne dla discovery (roaster/coffee/batch baseline).
- [ ] Lista brakujacych danych seed dla artykulow/roaster profile jest uzgodniona przed implementacja `T062-T063`.
- [x] RLS i auth flow nie blokuja odczytu danych wymaganych przez Hub (po stronie user flow).

## 5) Frontend readiness dla US3 (mobile-first)

- [x] Istnieje punkt wejscia do scan flow (`apps/consumer-mobile/app/(tabs)/hub/scan.tsx`).
- [ ] Zdefiniowane sa kryteria UX dla dominant scan CTA (co najmniej 40% ekranu, primary action).
- [ ] Zdefiniowane sa states dla Discovery:
  - loading
  - empty
  - error
  - success
- [ ] Uzgodniony shape danych dla:
  - discover coffees
  - discover roasters
  - roaster profile

## 6) Jakosc i test plan (wymagane do wejscia w sprint)

- [x] Dla US2 istnieja testy automatyczne i sa zielone.
- [ ] Dla US3 zaplanowano minimum testowe:
  - [x] `T058/T059` hook tests (success/error/empty)
  - [x] `T060` follow action test (state update + rollback on error)
  - [x] smoke UI dla `T054/T055/T056/T061`
  - [x] co najmniej 1 integration flow: Hub -> discover -> roaster profile
- [ ] Definition of Done dla T054-T063 jest wpisane przy kazdym tasku (owner, estymacja, zaleznosci, testy).

## 7) Ryzyka i decyzje przed startem

- [ ] Ryzyko: niedookreslony model tresci Learn (`T063`) - decyzja: format MDX + miejsce przechowywania.
- [ ] Ryzyko: zakres roaster profile (`T057`) moze rosnac - decyzja: MVP scope tylko pola wymagane przez US3.
- [x] Ryzyko: regresja US2 - mitigacja: rerun `test:generate-qr` i `test:e2e` przed merge kazdego wiekszego PR.

## 8) Go / No-Go dla sprintu Phase 005

Sprint Phase 005 moze wystartowac, jezeli jednoczesnie:

- [x] Phase 004 ma formalny sign-off w backlogu,
- [x] testy sign-off Phase 004 sa PASS,
- [x] backlog T054-T063 jest gotowy i sproiorytetyzowany,
- [ ] test plan dla US3 jest rozpisany per task i zaakceptowany przez zespol.

Status: **GO warunkowe** (mozna startowac implementacje, ale zamknac otwarte checkboxy planistyczne najpozniej na kick-off sprintu).
