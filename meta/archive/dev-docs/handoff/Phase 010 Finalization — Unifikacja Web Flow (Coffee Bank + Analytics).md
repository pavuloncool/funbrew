### Phase 010 Finalization — Unifikacja Web Flow (Coffee Bank + Analytics)

#### Summary
- Stan na **2026-05-06**: `010-001..010-006` i `010-019` są domknięte; `010-007` i `010-008` są partial; `010-009..010-018` oraz `010-020..010-038` pozostają open wg backlogu.
- Potwierdzony drift: publisher MVP zapisuje canonical (`coffees`, `roast_batches`, `qr_codes`), ale Coffee Bank czyta legacy `roaster_coffee_tags`, więc nowe kawy nie pojawiają się w Coffee Bank.
- Ustalony kierunek: **`/coffee-bank` przechodzi na canonical-only** oraz **analytics w modelu batch-first**.

#### Implementation Changes (product/apps/web)
- Routing i IA:
  - Utrzymać `/coffee-bank` jako główną powierzchnię zarządzania, ale przepiąć ją na canonical read model.
  - Zostawić `/tag` jako legacy compatibility surface (bez dalszego rozwoju biznesowego).
  - Zachować redirect legacy `/dashboard/coffees -> /coffee-bank`, ale semantycznie prowadzi już do canonical Coffee Bank.
- Coffee Bank data flow:
  - W [coffee-bank/page.tsx](/Users/pa/projects/funcup/product/apps/web/app/coffee-bank/page.tsx) zastąpić `useRoasterCoffeeTags` zapytaniem po roaster-owned `coffees` + ich batchach + `qr_codes`.
  - Pokazać akcje: `Edit coffee`, `Batch details`, `Batch analytics`, `QR download/refresh`.
  - Dodać jawny link „Legacy tag flow” do `/tag` dla kompatybilności.
- Publish/QR/Analytics continuity:
  - W [CoffeeEditor.tsx](/Users/pa/projects/funcup/product/apps/web/src/components/roaster-hub/CoffeeEditor.tsx) po publish dodać CTA do `Batch details` i `Batch analytics` (nie tylko download SVG).
  - W [roaster-hub/analytics/page.tsx](/Users/pa/projects/funcup/product/apps/web/app/roaster-hub/analytics/page.tsx) zastąpić statyczny komunikat listą batchy roastera z quick stats + empty state.
- Backlog finalization (Phase 010):
  - Zaktualizować statusy: `010-025/026/027/028/029` jako done/partial zgodnie z realnym efektem po wdrożeniu.
  - Po tej paczce przejść do `010-030..033` (contracts/refresh/errors), potem `010-034..038` (QA + sign-off).

#### Public APIs / Interfaces / Types
- Brak zmian schematu DB.
- Zmiana kontraktu UI `Coffee Bank`: źródłem staje się canonical batch flow, nie `roaster_coffee_tags`.
- `roaster_coffee_tags` pozostaje tylko compatibility/read-model fallback (bez nowych feature’ów).

#### Test Plan
- Web:
  - `coffee-bank.e2e`: nowe przypadki z canonical listą roastera i nawigacją do batch analytics.
  - `dashboard-redirects...`: redirect nadal poprawny.
  - Test publish flow: po utworzeniu kawy+batcha widoczne CTA do analytics.
- Integration/runtime:
  - `product/apps/web test`, lokalne `product/apps/web dev`, smoke: publish -> QR -> batch analytics.
- Regression:
  - Brak regresji `/tag` (legacy dostępny), brak regresji `/q/[hash]` i mobile discovery.

#### Assumptions
- Nie rozszerzamy scope o globalny dashboard ponad batchami w tej fazie.
- Nie przenosimy ownership obrazu na `roast_batches`; zostaje `coffees.cover_image_url`.
- Priorytet na domknięcie web flow (Epic E/F) jako blocker końcowego sign-off Phase 010.
