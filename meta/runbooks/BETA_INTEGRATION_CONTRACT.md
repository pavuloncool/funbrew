# Beta Integration Contract (Web + Mobile + Shared Supabase)

Data: 2026-05-09  
Status: Active reference for beta-funcup implementation and release

## 1) System scope and non-negotiables
- Beta to jeden system dwuwarstwowy:
  - `product/apps/web` (roaster + public web entry),
  - `product/apps/consumer-mobile` (consumer flow),
  - wspólne `product/packages/shared`,
  - jeden wspólny backend Supabase beta.
- Zabronione jest traktowanie bety jako web-only deploy.
- Zabronione jest odpięcie mobile od wspólnego backendu beta.

## 2) Role and auth boundaries
- `roaster`:
  - ma dostęp do `product/apps/web` i ścieżek roasterowych (`/roaster-hub`, setup, analytics, publish batch),
  - nie jest blokowany przez mobile role gate.
- `consumer`:
  - używa `product/apps/consumer-mobile`,
  - nie może przejść do roaster web flow; web ma wykonać local sign-out i przekierować do `/login?reason=consumer_mobile_only`.
- Public routes:
  - `/` (public entry po splashu),
  - `/q/{hash}` (public resolver QR),
  - brak wymagania sesji.
- Protected web routes:
  - wszystkie roasterowe poza `/q/*` i public entry.

## 3) Shared backend assumptions (beta)
- Web i mobile wskazują ten sam projekt Supabase beta:
  - ten sam `SUPABASE_URL`,
  - ten sam `anon key`,
  - ten sam zestaw migrations + edge functions.
- Shared data plane obejmuje minimum:
  - publish batch (web),
  - QR generation / resolution (web + functions),
  - consumer scan i coffee page (mobile + functions),
  - tasting log (mobile + functions + shared),
  - analytics roastera (web czyta dane z logów i agregatów),
  - auth i role gate.

## 4) Env contract for beta
- Web (`product/apps/web`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL` (canonical public host dla URL/QR)
- Mobile (`product/apps/consumer-mobile`):
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_ROASTER_WEB_URL` (jeśli używane przez cross-linking)
  - `EXPO_PUBLIC_APP_URL` (mobile app/deeplink context)
- Supabase / Functions:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY` (dla funkcji wymagających anon-context auth)
  - `SUPABASE_SERVICE_ROLE_KEY`
  - dodatkowe sekrety email provider dla notification function.

## 5) QR and deep link contract (`/q/{hash}`)
- QR URL contract: `https://<beta-host>/q/{hash}`.
- `hash` jest trwały i mapowany na jeden encodowany rekord domenowy (batch/tag flow).
- Web `/q/{hash}` pozostaje publiczny i działa w przeglądarce bez sesji.
- Mobile parser/deep-link musi akceptować:
  - pełny URL `https://<host>/q/{hash}`,
  - `funcup://q/{hash}`,
  - sam UUID (fallback).
- Zmiana hosta beta nie może rozbić scan flow ani resolvera.

## 6) Mobile log -> web analytics dependency
- Consumer tasting log zapisuje dane do wspólnego Supabase.
- Web analytics czyta agregaty i/lub surowe dane z tego samego backendu.
- Każda zmiana w payload/shape logów wymaga oceny wpływu na analytics (cross-app review).
- Canonical shared write path dla nowego wpisu:
  - `product/packages/shared/services/tastingService.logTasting` -> `log_tasting` (fallback: `coffee/log-tasting`),
  - następnie `product/packages/shared/services/tastingService.updateCoffeeStats` -> `update_coffee_stats`.
- Wykryty lokalny bypass (dozwolony tylko z tym samym post-condition):
  - mobile edit/delete flow może pisać bezpośrednio do `coffee_logs` / `coffee_log_tasting_notes` / `reviews`,
  - ale po każdej mutacji musi wywołać `updateCoffeeStats` dla tego `batch_id`, inaczej analytics może być stale.

## 6a) Auth-role assumptions (cross-app)
- `resolveAccountRole` (shared) traktuje `user_metadata.app_role` jako pierwszeństwo, a fallback robi przez lookup `roasters.user_id`.
- Role gate w web/mobile to kontrola UX (local sign-out + redirect), nie kontrola bezpieczeństwa danych.
- Enforcement dostępu do danych pozostaje po stronie Supabase RLS/policies; gate UI nie może być jedyną barierą.
- `app_role` spoza dozwolonego zbioru (`roaster` | `consumer`) jest ignorowane i przechodzi przez fallback lookup.

## 7) Contact form contract (beta)
- Public web entry zawiera formularz kontaktowy.
- Wymagane zachowanie:
  - zapis leada w Supabase jako źródło prawdy,
  - próba wysyłki email notification do autorów,
  - UI: loading/success/error,
  - degradacja: DB success + email fail => sukces dla usera, fail tylko w logach operacyjnych.

## 8) Coordination contract
- Każda warstwa jest lokalnym ownerem, ale nie jest source-of-truth dla całości.
- Zmiany shared contract (typy/flow/error/auth/env) wymagają jawnej oceny cross-app.
- W przypadku konfliktu assumptions:
  - najpierw blokada merge w danym obszarze,
  - potem decyzja na poziomie integration contract i dopiero finalna integracja.

## 9) Release verification minimum (cross-app)
- Smoke obejmuje pełną pętlę:
  - publish batch,
  - QR resolve,
  - mobile log tasting,
  - analytics visibility w web.
- Checklisty release muszą jawnie pokazywać web + mobile + shared Supabase jako jeden system.
- Operacyjny deploy order + env matrix: `BETA_DEPLOY_PLAN.md`.
