# Phase 004 Handoff (US2 — Roaster Publishes QR)

Ten dokument jest skróconą "pamięcią roboczą" do kontynuacji w nowym czacie.

## 1) Aktualny stan (na `main`)

- Blokery pre-Go zostały domknięte:
  - Smoke `supabase/seed.sql` + runtime edge functions (US1): PASS.
  - T043 `generate_qr`: zaimplementowane + smoke (201/404/403 + idempotent 200): PASS.
  - Gate E2E US2 (`login -> create coffee -> create batch -> QR download -> hash resolves`): PASS.
- Zmiany są wypchnięte na GitHub:
  - Repo: `github.com/pavuloncool/funcup`
  - Branch: `main`
  - Commit: `c4d6350`
- Local repo jest czyste (`git status -sb` bez zmian).

## 2) Co zostało zaimplementowane w US2

### Backend / Supabase

- `supabase/functions/generate_qr/index.ts`
  - auth token check,
  - ownership check batcha,
  - verification status check roastera (`verified`),
  - generowanie SVG + PNG,
  - upload do bucketa `qr`,
  - insert do `qr_codes`,
  - signed URLs (`createSignedUrl`),
  - idempotencja (zwraca istniejący QR dla tego samego `batch_id`).

### Web (App Router, minimalny flow operacyjny)

- Auth:
  - `apps/web/app/(auth)/login/page.tsx`
  - `apps/web/app/(auth)/register/page.tsx`
  - `apps/web/app/(auth)/pending/page.tsx`
- Dashboard / coffee-batch:
  - `apps/web/app/dashboard/coffees/page.tsx`
  - `apps/web/app/dashboard/coffees/new/page.tsx`
  - `apps/web/app/dashboard/coffees/[id]/page.tsx`
  - `apps/web/app/dashboard/coffees/[id]/batches/new/page.tsx`
  - `apps/web/app/dashboard/coffees/[id]/batches/[batchId]/page.tsx`
  - `apps/web/app/dashboard/coffees/[id]/batches/[batchId]/QRDownloadButton.tsx`
- Hash resolve:
  - `apps/web/app/q/[hash]/page.tsx`
- Entry:
  - `apps/web/app/page.tsx` (linki do flow)

### DoR / dokumentacja

- `DEFINITION_OF_READY_NEXT_SPRINT.md`
  - zaktualizowane statusy blokera #1, #2, #3 (wszystkie PASS).
- `funcup-src-docs/04-tasks/13-tasks-002-qr-coffee-platform-88-tasks.md`
  - doprecyzowane ścieżki web dla Phase 4: `apps/web/app/...`.

## 3) Krytyczne decyzje techniczne (ważne dla kontynuacji)

- Canonical path dla web tasków Phase 4: `apps/web/app/...` (Next App Router).
- W lokalnym smoke signed URLs z Supabase storage mogą zwracać host `http://kong:8000`.
  - Dla testów host-machine zamieniaj na `http://127.0.0.1:54321`.
- Dla pre-commit builda usunięto build-time throw na brak env w:
  - `apps/web/src/lib/supabase/browserClient.ts`
  - `apps/web/src/lib/supabase/serverClient.ts`
  aby Next build nie padał podczas prerenderu.
- Zasada dokumentacyjna (obowiązkowa): gdy powstaje nowy core-document, dodaj link do niego w `README.md`.

## 4) Jak szybko odtworzyć i zweryfikować

```bash
pnpm install
pnpm -C apps/web dev
```

W osobnym terminalu:

```bash
supabase start --exclude logflare,vector,studio,imgproxy,mailpit
supabase functions serve --no-verify-jwt
```

Minimalna walidacja ręczna:

1. `/login`
2. `/dashboard/coffees/new` -> create coffee
3. create batch
4. `Download PNG` / `Download SVG` z `QRDownloadButton`
5. wejście na `/q/{hash}` i potwierdzenie resolve

Po testach:

```bash
supabase stop
```

## 5) Otwarte tematy po domknięciu gate

- Obecna implementacja web jest "minimal operational" (MVP do gate), wymaga dalszego hardeningu UX/UI.
- Brak pełnych testów automatycznych (smoke był uruchamiany manualnie/skryptowo).
- Warto dodać oficjalny test plan CI dla:
  - T043 (`generate_qr`),
  - T047/T049 (create coffee/batch),
  - T052 (download button),
  - hash resolve.

## 6) Sugerowany pierwszy prompt do nowego czatu

```text
Przeczytaj PHASE004_HANDOFF.md i kontynuuj hardening US2 (Phase 004).
Priorytet: testy automatyczne dla generate_qr + E2E happy path dashboard->QR->hash resolve,
bez zmiany kontraktu API i bez regresji ścieżek apps/web/app/... .
Pamiętaj: każdy nowy core-document ma mieć link w README.md.
```

