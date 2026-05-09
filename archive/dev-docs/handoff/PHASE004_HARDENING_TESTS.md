# Phase 004 Hardening Tests (US2)

Ten dokument opisuje automatyczne testy hardeningu dla US2 (Phase 004), zgodnie z handoffem:

- `generate_qr` ma test integracyjny (kontrakt API bez zmian),
- happy path E2E: `dashboard -> QR -> hash resolve`.

## Zakres testow

### 1) Integracja `generate_qr`

Plik: `apps/web/tests/generate-qr.spec.ts`

Waliduje:
- `201` i `created: true` dla pierwszego wywolania,
- `200` i `created: false` (idempotencja) dla drugiego wywolania na tym samym `batch_id`,
- `404 not_found` dla nieistniejacego `batch_id`.

### 2) E2E happy path US2

Plik: `apps/web/tests/us2-happy-path.e2e.spec.ts`

Waliduje:
- login przez `/login`,
- utworzenie coffee przez `/dashboard/coffees/new`,
- utworzenie batcha przez `/dashboard/coffees/[id]/batches/new`,
- generacje QR przez `Download PNG`,
- resolve hasha przez `/q/[hash]`.

## Wymagane srodowisko lokalne

1. Uruchom web:

```bash
pnpm -C apps/web dev
```

2. Uruchom Supabase + edge functions:

```bash
supabase start --exclude logflare,vector,studio,imgproxy,mailpit
supabase functions serve --no-verify-jwt
```

3. Ustaw env do testow (`apps/web`):

- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- opcjonalnie `SUPABASE_URL` (domyslnie: `http://127.0.0.1:54321`)
- opcjonalnie `WEB_BASE_URL` (domyslnie: `http://127.0.0.1:3000`)

## Uruchamianie testow

W katalogu `apps/web`:

```bash
pnpm test:generate-qr
pnpm test:e2e
```

## Uwagi

- Testy nie zmieniaja kontraktu API `generate_qr`.
- Testy celowo korzystaja z aktualnych sciezek `apps/web/app/...` (App Router).
- Dane testowe tworzone sa dynamicznie przez API admina Supabase (unikalne emaile/test users).
