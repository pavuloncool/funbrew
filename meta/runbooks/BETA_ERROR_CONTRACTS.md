# Beta Error Contracts (010-030..010-033)

Data aktualizacji: 2026-05-07
Zakres: `product/packages/shared`, `product/apps/consumer-mobile`, `product/apps/web`

## Cel
Jedna mapa błędów dla krytycznego flow beta:
- `scan_qr` -> coffee page
- `log_tasting` / `coffee/log-tasting` -> tasting log
- analytics batch (`coffee_stats` + `coffee_logs`)

Źródło runtime: `product/packages/shared/src/errors/flowError.ts`

## Kontrakt normalizacji
Normalizowany błąd (`FlowError`) zawiera:
- `domain`: `scan` | `tasting_log` | `analytics`
- `kind`: `offline` | `timeout` | `unauthorized` | `validation` | `not_found` | `rate_limited` | `server` | `unknown`
- `status`, `code`, `retryable`, `message`

Reguły retryable:
- `true`: `offline`, `timeout`, `rate_limited`, `server`
- `false`: `unauthorized`, `validation`, `not_found`, `unknown`

## UI copy matrix (source of truth)

| Domain | Kind | UI title | UI message | Retry policy |
|---|---|---|---|---|
| `scan` | `not_found` | `QR not found` | QR nieaktywny/nieznany, poproś palarnię o nowy kod | retry manualny |
| `scan` | `offline` / `timeout` | `No connection` | Połącz internet i ponów skan | retry manualny |
| `scan` | `unauthorized` | `Session required` | Zaloguj się ponownie | retry po auth |
| `scan` | `rate_limited` | `Too many requests` | Odczekaj chwilę | retry z backoff |
| `scan` | `server` | `Scan temporarily unavailable` | Błąd serwera skanowania | retry manualny |
| `tasting_log` | `validation` | `Check tasting fields` | Pokazuj komunikat walidacyjny backendu | bez kolejki |
| `tasting_log` | `unauthorized` | `Session expired` | Zaloguj się ponownie i ponów | bez kolejki |
| `tasting_log` | `not_found` | `Tasting endpoint unavailable` | Brak `log_tasting` na env | bez kolejki |
| `tasting_log` | `offline` / `timeout` | `Queued for retry` | Dodaj do offline queue i sync po reconnect | auto retry |
| `tasting_log` | `rate_limited` | `Too many attempts` | Odczekaj i ponów zapis | retry manualny |
| `tasting_log` | `server` | `Save temporarily unavailable` | Chwilowa niedostępność zapisu | retry manualny |
| `analytics` | `unauthorized` | `Session expired` | Zaloguj się ponownie | retry po auth |
| `analytics` | `not_found` | `Batch not found` | Batch niedostępny w środowisku | retry/manual check |
| `analytics` | `offline` / `timeout` | `Network unavailable` | Podłącz internet i odśwież | retry manualny |
| `analytics` | `rate_limited` | `Analytics temporarily throttled` | Odczekaj chwilę | retry z backoff |
| `analytics` | `server` | `Analytics unavailable` | Błąd serwera analytics | retry manualny |

## Integracje w kodzie
- `product/packages/shared/src/hooks/useCoffeePage.ts`
- `product/packages/shared/src/hooks/useRoasterAnalytics.ts`
- `product/packages/shared/src/services/tastingService.ts`
- `product/apps/consumer-mobile/app/coffee/[id]/index.tsx`
- `product/apps/consumer-mobile/app/coffee/[id]/log.tsx`
- `product/apps/web/app/q/[hash]/page.tsx`
- `product/apps/web/app/roaster-hub/analytics/[batchId]/page.tsx`

## Observability (cross-app)
Błędy krytycznych flow logowane są jednolicie przez:
- `logFlowError(error, origin)`
- format konsoli: `[flow-error] { origin, domain, kind, status, code, retryable, message }`

## 010-033: refresh behavior (SC-008)
- `useRoasterAnalytics` ma `refetchInterval: 30000` (30s) + `refetchIntervalInBackground`.
- Ekran analytics komunikuje auto-refresh (`Auto-refresh every 30s...`).
