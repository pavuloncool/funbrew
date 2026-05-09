# Definition of Ready (DoR) — Next Sprint

Projekt: `funcup`  
Zakres odniesienia: wykonane prace do końca Phase 1–3 (T001–T042) + naprawa `pnpm install`.

Ten dokument definiuje warunki wejścia do kolejnego sprintu tak, aby zespół pracował na stabilnej bazie technicznej i jednoznacznym backlogu.

## 1) Repozytorium i środowisko

- [x] `pnpm install` kończy się lokalnie bez błędów blokujących.
- [x] `pnpm-lock.yaml` jest obecny i aktualny po instalacji.
- [x] Lokalnie działa co najmniej:
  - [x] `pnpm -C apps/web dev`
  - [x] `pnpm -C apps/consumer-mobile start`
- [x] Zdefiniowany i zwalidowany baseline narzędzi (lokalnie):
  - [x] Node `22.x` (lokalnie: `v22.17.1`)
  - [x] pnpm `10.12.x+` (lokalnie: `10.12.4`)
- [ ] Każdy członek zespołu potwierdził baseline narzędzi na swoim środowisku.

Wynik ostatniej walidacji:
- `pnpm install`: PASS
- `pnpm -C apps/web dev`: PASS
- `pnpm -C apps/consumer-mobile start`: PASS (Metro starts on `http://localhost:8081`)

## 2) Jakość kodu i pipeline lokalny

- [x] Przechodzi `pnpm lint` (bez nowych błędów).
- [x] Przechodzi `pnpm test` (co najmniej smoke + testy istniejących modułów).
- [x] Brak krytycznych błędów TypeScript w nowych modułach (apps/web, apps/consumer-mobile, packages/shared).
- [x] Peer dependency warnings są przejrzane:
  - [x] `pnpm install` (2026-04-08): brak peer dependency warnings.
  - [x] Na ten moment brak pozycji do wpisu do backlogu technicznego w tym obszarze.

Wynik ostatniej walidacji:
- `pnpm lint`: PASS
- `pnpm test`: PASS
- `pnpm -C apps/consumer-mobile typecheck`: PASS (po poprawce `supabaseClient.ts`)
- `pnpm -C packages/shared typecheck`: PASS
- `pnpm exec tsc -p apps/web/tsconfig.json --noEmit`: PASS (po poprawce `app/layout.tsx`)

## 3) Spójność z source of truth (`/Users/pa/projects/funcup/funcup-src-docs/04-tasks/13-tasks-002-qr-coffee-platform-88-tasks.md`)

- [x] Wszystkie ścieżki wymagane dla T001–T042 istnieją w repo.
- [x] `AUDIT_PHASE1_3_CHECKLIST.md` jest zaktualizowany do bieżącego stanu (PASS/FAIL/Partial).
- [x] Rozbieżności typu „placeholder vs produkcyjna implementacja” są jawnie oznaczone taskami.
- [x] Konwencja ścieżek dla web (Phase 4) została doprecyzowana: **canonical path = `apps/web/app/...`** (Next.js App Router).

## 4) Backend / Supabase readiness

- [x] Migracje są kompletne i uporządkowane:
  - [x] `0001_initial_schema.sql`
  - [x] `0002_rls_policies.sql`
  - [x] `0003_functions_triggers.sql`
  - [x] `0004_pg_net_and_storage.sql`
- [x] `supabase/seed.sql` uruchamia się bez błędów krytycznych w środowisku deweloperskim.
  - Status 2026-04-08: PASS po uruchomieniu `supabase start --exclude logflare,vector,studio,imgproxy,mailpit`.
- [x] Typy DB (`supabase/types/database.ts`) są zsynchronizowane z aktualnym schematem.
- [ ] Edge functions wymagane dla US1 istnieją i są testowalne:
  - [x] `scan_qr` istnieje (`supabase/functions/scan_qr/index.ts`)
  - [x] `update_coffee_stats` istnieje (`supabase/functions/update_coffee_stats/index.ts`)
  - [x] Test runtime lokalnie: PASS (`supabase functions serve --no-verify-jwt` + wywołania HTTP)
- [ ] Edge function dla US2 (`generate_qr`) istnieje i jest testowalna:
  - [x] `supabase/functions/generate_qr/index.ts` — zaimplementowana (T043)
  - [x] Smoke runtime: PASS (`201` create + `404` not_found + `403` forbidden + idempotent `200`)

Evidence T017/T018:
- `supabase/EVIDENCE_T017_T018.md`

## 5) Frontend readiness (mobile + web)

- [x] Mobile (US1) ma działający flow developerski:
  - [x] auth entry (`login`, `register`)
  - [x] scan entry (`app/(tabs)/hub/scan`)
  - [x] coffee page + tasting log + journal entry point
- [x] Web ma bazę pod kolejne sprinty (US2+):
  - [x] App Router działa
  - [x] klienci Supabase browser/server są dostępni
- [x] Shared (`packages/shared`) udostępnia:
  - [x] constants (flavor notes, brew methods, reputation thresholds)
  - [x] services (`supabaseClientFactory`, `tastingService`)
  - [x] hooks (`useCoffeePage`, `useJournal`)

## 6) Produkt i plan sprintu

- [x] Cel sprintu jest zdefiniowany na bazie kolejnych faz z `/Users/pa/projects/funcup/funcup-src-docs/04-tasks/13-tasks-002-qr-coffee-platform-88-tasks.md` (rekomendacja: wejście w Phase 4 US2).
- [x] Każdy task sprintu ma:
  - [x] akceptowalne kryteria ukończenia (DoD),
  - [x] ownera,
  - [x] estymację,
  - [x] zależności.
- [x] Ryzyka techniczne są jawnie wpisane do backlogu (np. zależności, peer warnings, hardening placeholderów).

### Owners i DoD — Phase 4 (T043–T053)

| Task | Owner | Estymacja | Zależności | Definition of Done (DoD) |
|:-----|:------|:----------|:-----------|:--------------------------|
| T043 `generate_qr` | Backend (Supabase) Owner | 2 dni | T013–T018, storage bucket `qr` | Edge Function wdrożona; walidacja ownership + verification; zwraca PNG/SVG signed URLs; test happy-path + 403/404. |
| T044 web auth login | Web Auth Owner | 1 dzień | T021, baza `apps/web` (T004) | Strona logowania działa; email auth flow + walidacja formularza; poprawne stany loading/error. |
| T045 web auth register | Web Auth Owner | 1 dzień | T021, T044 (wspólne komponenty auth) | Strona rejestracji działa; walidacje; redirect po sukcesie; stany błędów backend. |
| T046 auth pending | Web Auth Owner | 0.5 dnia | T045 | Strona pending dostępna po rejestracji; jasny komunikat i dalszy flow. |
| T047 coffees new | Web Dashboard Owner | 2 dni | T021, T044–T046, schema/migrations T013+ | Formularz tworzenia kawy zapisuje rekord; walidacje; obsługa błędów i sukcesu. |
| T048 coffee details | Web Dashboard Owner | 1 dzień | T047 | Widok szczegółów kawy z danymi z backendu; fallback/empty state. |
| T049 create batch | Web Dashboard Owner | 1.5 dnia | T047, T048 | Formularz tworzenia batcha działa i zapisuje dane; walidacje i feedback UI. |
| T050 batch details | Web Dashboard Owner | 1 dzień | T049 | Widok szczegółów batcha z poprawnym powiązaniem do kawy. |
| T051 coffees list | Web Dashboard Owner | 1.5 dnia | T047 | Lista kaw z paginacją/sort/filter (min. podstawowy); loading + empty + error state. |
| T052 QRDownloadButton | Web UI Owner | 1 dzień | T043, T050 | Komponent pobiera i zapisuje PNG/SVG; disabled/loading state; obsługa błędu pobierania. |
| T053 hooks roaster | Shared/Web Data Owner | 1 dzień | T047–T051, `@tanstack/react-query` | `useRoasterCoffees` + `useCreateBatch` z cache invalidation i obsługą błędów; test hooków. |

### Sprint 1 — Phase 4 (proposal)

- Sprint goal: dostarczyć pełny roaster flow od auth do wygenerowania i pobrania QR.
- Zakres committed: T043–T053.
- Proponowana sekwencja:
  1. Auth web: T044–T046
  2. CRUD coffee/batch: T047–T051
  3. QR backend + UI: T043 + T052
  4. Data hooks i stabilizacja: T053
- Łączna estymacja: ~12.5 dnia roboczego (1 dev). Przy 2 devach: ~6–7 dni + bufor QA.
- Bufor ryzyka: 20% na integracje Supabase/storage/auth.

### Rejestr ryzyk technicznych (Phase 4)

- Peer dependency drift w `apps/consumer-mobile` (Expo compatibility warnings) — monitorować, nie blokuje Phase 4 web.
- Patch `metro-cache` exports (postinstall workaround) — utrzymać do czasu stabilizacji upstream.
- Brak testów merytorycznych (obecnie pass przez `--passWithNoTests`) — dodać smoke tests dla T043/T047/T052/T053.
- Brak pełnej walidacji runtime Supabase dla `seed`/edge functions — wymagany smoke na środowisku developerskim.

### Minimalny plan testów jakości dla US2 (wymagane do wejścia w sprint)

- T043 (`generate_qr`): smoke edge function (happy path + 403 + 404, format PNG/SVG).
- T047 (create coffee): integration web form -> zapis rekordu -> walidacja błędów.
- T052 (QRDownloadButton): smoke UI (loading/disabled/error + download PNG/SVG).
- T053 (hooks): integration test hooków (`useRoasterCoffees`, `useCreateBatch`) z cache invalidation.

Uwagi planistyczne:
- Owner = rola odpowiedzialna; można podmienić na konkretne osoby przed startem sprintu.
- Estymacje i zależności zaktualizowane dla Sprint 1 Phase 4; aktualizować po re-estymacji zespołu.

## 7) Minimalne kryterium wejścia w next sprint (Go / No-Go)

Sprint może wystartować, jeśli jednocześnie:

- [x] `pnpm install` działa stabilnie,
- [x] lint/test nie mają blockerów,
- [x] wymagane artefakty T001–T042 są obecne,
- [x] backlog kolejnej fazy (co najmniej 1 sprint) jest rozpisany i priorytetyzowany.
- [ ] smoke `supabase/seed.sql` oraz runtime edge functions jest wykonany na środowisku dev.
- [x] smoke `supabase/seed.sql` oraz runtime edge functions jest wykonany na środowisku dev.
- [x] spełniony jest gate E2E dla US2: `web login -> create coffee -> create batch -> QR download (PNG/SVG) -> hash resolves`.
  - Smoke 2026-04-08: PASS lokalnie na `supabase start` + `supabase functions serve --no-verify-jwt` (`US2_E2E_GATE_PASS`).

## 8) Automatyzacja readiness (Phase 4)

- Dodano skrypt: `scripts/phase4-readiness-check.sh`
- Uruchamianie: `pnpm phase4:readiness`
- Zakres: baseline Node/pnpm, peer deps, typecheck mobile/shared/web, smoke Supabase (jeśli Docker działa), obecność edge functions (w tym `generate_qr`), gate ścieżek web oraz definicja gate E2E US2.

