# Phase 005 Handoff (US3 — Coffee Hub + Discovery)

Ten dokument jest skrocona "pamiecia robocza" do kontynuacji implementacji w nowym czacie.

## 1) Status wejsciowy

- Phase 004 (US2, `T043-T053`) ma formalny sign-off: PASS.
- Backlog taskow jest zsynchronizowany z repo:
  - `funcup-src-docs/04-tasks/13-tasks-002-qr-coffee-platform-88-tasks.md`
  - Phase 4: wszystkie taski `T043-T053` oznaczone jako `[x]`.
- Testy sign-off US2 przechodza lokalnie:
  - `pnpm -C apps/web test:generate-qr` -> PASS
  - `pnpm -C apps/web test:e2e` -> PASS

## 2) Cel sprintu (Phase 005 / US3)

Domknac US3: Coffee Hub + Discovery (`T054-T063`) z naciskiem na:

1. Hub shell + dominant scan CTA (`T054`, `T054b`)
2. Discovery tabs + data hooks (`T055-T060`)
3. Learn tab + article screen + seed content (`T061-T063`)

## 3) Aktualny stan kodu istotny dla US3

### Mobile

- Istnieje punkt startowy scan:
  - `apps/consumer-mobile/app/(tabs)/hub/scan.tsx`
  - obecnie placeholder z recznym hashem i linkiem do `/coffee/[id]`.
- Kluczowe elementy z US1 juz istnieja i mozna je reutilizowac:
  - Coffee Page + sekcje
  - hooki i services w `packages/shared`

### Web / backend

- Web US2 jest domkniety i przetestowany; traktuj jako stabilna baze.
- Supabase migrations + seed + edge functions sa obecne i testowalne lokalnie.

## 4) Scope implementacyjny Task-by-Task (Phase 005)

- `T054` `apps/consumer-mobile/app/(tabs)/hub/index.tsx` (Coffee Hub 4 sekcje)
- `T054b` dominant Scan Coffee (min. 40% ekranu, primary CTA)
- `T055` DiscoverCoffees tab component
- `T056` DiscoverRoasters tab component
- `T057` RoasterProfile screen
- `T058` useDiscoverCoffees hook
- `T059` useDiscoverRoasters hook
- `T060` useFollowRoaster hook + follow action
- `T061` LearnCoffee tab component
- `T062` LearnArticle screen
- `T063` MDX article content (3 seed articles)

## 5) Krytyczne zasady i ograniczenia

- Nie psuc przeplywu US2 (web sign-off juz domkniety).
- Zachowac konwencje sciezek i nazewnictwa z backlogu.
- Dla nowych core-documentow: zawsze dodac link w `README.md`.
- Wprowadzac testy rownolegle do feature'ow US3 (przynajmniej smoke + hook tests).

## 6) Rekomendowany porzadek prac (bezpieczny)

1. `T054` + `T054b` (struktura Hub i UX entry)
2. `T058` + `T059` (hooki danych dla discovery)
3. `T055` + `T056` (taby oparte o hooki)
4. `T057` + `T060` (profil roastera + follow)
5. `T061` + `T062` + `T063` (Learn vertical + tresci)
6. Testy i hardening US3

## 7) Minimalny test plan US3 (do utrzymania quality gate)

- Hook tests:
  - `useDiscoverCoffees` (success/empty/error)
  - `useDiscoverRoasters` (success/empty/error)
  - `useFollowRoaster` (optimistic update + rollback on error)
- UI smoke:
  - Hub render + dominant scan CTA
  - Discover tabs render + empty/loading/error states
  - Learn tab + article route
- Integration:
  - Hub -> Discover -> RoasterProfile -> Follow action

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
Przeczytaj PHASE005_HANDOFF.md i rozpocznij implementacje Phase 005 (US3, T054-T063).
Priorytet: T054/T054b (Hub + dominant scan CTA), potem hooki discovery (T058/T059)
i komponenty tabs (T055/T056), bez regresji US2.
Pamietaj o testach hookow/smoke UI i o aktualizacji checklisty taskow po kazdym domknietym tasku.
```
