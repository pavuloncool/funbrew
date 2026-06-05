# MVP Refactor Handoff — 2026-05-06

Stan po przerwie w realizacji post-audit MVP refactor.

## 1) Domknięte paczki

### Canonical decision + public contract
- ADR: [012-canonical-product-model.md](../specs/002-qr-coffee-platform/adrs/012-canonical-product-model.md)
- `scan_qr` czytany przez jeden znormalizowany public model:
  - `product/packages/shared/src/coffeePage/normalizeCoffeePage.ts`
  - `product/apps/web/app/q/[hash]/page.tsx`
  - `product/apps/consumer-mobile/app/coffee/[id]/index.tsx`

### Mobile tasting loop
- `mobile /coffee/[id]/log` wysyła realnie:
  - `rating`
  - `brew_method_id`
  - `tasting_note_ids`
  - `free_text_notes`
  - opcjonalnie `review`
- po sync online i po flushu offline queue wywoływane jest `updateCoffeeStats`

### Role gate: web vs mobile
- `roaster only on web`
- `consumer only on mobile`
- shared resolver roli:
  - `product/packages/shared/src/auth/accountRole.ts`

### Canonical producer flow on web
- `Roaster Hub -> Publikuj batch MVP`
- web publikuje:
  - `roasters.country`, `description`, `logo_url`
  - `coffees.origin_id`, `variety`, `processing_method`, `producer_notes`, `cover_image_url`
  - `roast_batches.brewing_notes`, `roaster_story`
- canonical batch ma własny publiczny QR:
  - `product/apps/web/app/api/batch-qr/route.ts`
  - `product/apps/web/app/roaster-hub/coffees/[id]/batches/[batchId]/page.tsx`

### Analytics roastera
- analytics czytają:
  - `coffee_stats`
  - surowe `coffee_logs`
  - filtr po `brew_method_id`
  - anonimowe `reviews`
- UI pokazuje też stan `stats fresh vs stale`

### Discovery scope ograniczony do MVP
- mobile `Discover` pokazuje tylko:
  - `Coffees`
  - `Roasters`
- `Learn Coffee` pokazuje statyczne artykuły i otwiera `/learn/[slug]`
- profil roastera pokazuje:
  - nazwę / short name
  - lokalizację
  - opis
  - website
  - `Follow`
- seed discovery został domknięty pod US3:
  - 3 verified roasters
  - 5 active coffees
  - 5 active batches
  - 5 `qr_codes`
- `useFollowRoaster` odświeża cache discovery i profil roastera po follow / unfollow

### Repo cleanup: przygotowanie operacyjne
- powstał jawny szkielet archiwum:
  - `meta/archive/apps`
  - `meta/archive/dev-docs`
  - `meta/archive/prompts`
  - `meta/archive/assets`
- przygotowano pierwszy approval packet:
  - [MVP_REPO_CLEANUP_APPROVAL_PACKET_2026-05-06.md](./MVP_REPO_CLEANUP_APPROVAL_PACKET_2026-05-06.md)
- przygotowano drugi approval packet:
  - [MVP_REPO_CLEANUP_APPROVAL_PACKET_2026-05-06_PART2.md](./MVP_REPO_CLEANUP_APPROVAL_PACKET_2026-05-06_PART2.md)
- przygotowano trzeci approval packet:
  - [MVP_REPO_CLEANUP_APPROVAL_PACKET_2026-05-06_PART3.md](./MVP_REPO_CLEANUP_APPROVAL_PACKET_2026-05-06_PART3.md)
- mobile scaffold routes zostały odpięte od aktywnego flow:
  - `app/q/[hash].tsx` nie fallbackuje już do `/home`
  - `app/_layout.tsx` nie rejestruje już `home` ani `test-select-user`
- wykonano pierwszy cleanup po approvalu:
  - `product/apps/frontend` -> `meta/archive/product/apps/frontend`
  - `product/apps/consumer-mobile/app/home.tsx` -> `meta/archive/product/apps/consumer-mobile/routes/home.tsx`
  - `product/apps/consumer-mobile/app/test-select-user.tsx` -> `meta/archive/product/apps/consumer-mobile/routes/test-select-user.tsx`
  - generated leftovers legacy frontend (`node_modules`, `dist`, `.turbo`) nie zostały przeniesione do archiwum
- wykonano drugi cleanup po approvalu:
  - `old-files/README.md` -> `meta/archive/meta/docs/old-files/README.md`
  - `old-files/product/apps/consumer-mobile/src/features/profile/preferences/flavorNotes.ts` -> `meta/archive/product/apps/consumer-mobile/src/features/profile/preferences/flavorNotes.ts`
  - `unused project files/product/apps/web/app/*` -> `meta/archive/product/apps/web/legacy-routes/app/*`
  - puste top-level `old-files/` i `unused project files/` zostały usunięte
- wykonano trzeci cleanup po approvalu:
  - `.cursor/plans/*` -> `meta/archive/prompts/cursor-plans/*`
  - `meta/docs/Stage UI prompts/*` -> `meta/archive/prompts/stage-ui/*`
  - puste katalogi `.cursor/plans/` i `meta/docs/Stage UI prompts/` zostały usunięte

## 2) Zweryfikowane ręcznie

- `product/apps/web` generuje canonical batch QR
- `consumer-mobile` skanuje canonical batch QR
- mobile Coffee Page pokazuje te same dane co canonical publisher
- deep link Expo Go działa:
  - `exp://192.168.1.106:8081/--/q/{hash}`
- `Discover` w mobile pokazuje `Coffees` i `Roasters`
- `Learn Coffee` pokazuje listę artykułów i otwiera `/learn/[slug]`
- profil roastera pokazuje opis / lokalizację i działa `Follow`
- discovery kaw czyta seeded `qr_codes`; po ręcznym dodaniu nowego canonical batcha z web licznik wzrósł z 5 do 6
- discovery roasterów pokazuje tylko `verified`

## 3) Zweryfikowane komendami

```bash
pnpm -C product/packages/shared test
pnpm -C product/packages/shared typecheck
pnpm -C product/apps/consumer-mobile typecheck
pnpm -C product/apps/web build
pnpm -C product/apps/web exec playwright test tests/batch-qr.spec.ts
```

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/scan_qr \
  -H 'Content-Type: application/json' \
  -H 'apikey: <local-publishable-key>' \
  -H 'Authorization: Bearer <local-publishable-key>' \
  --data '{"hash":"5109e402-c58a-4269-a76d-52fc02edd7f5"}'
```

## 4) Świadomie odłożone

To nie są błędy architektury canonical modelu, tylko znane luki przejściowe:

- Legacy batch manager nadal jest tag-first management surface
- canonical batch nie wraca jeszcze do zarządzania przez legacy batch manager
- część starszych dokumentów Phase 010 nadal odnosi się do `product/apps/frontend` i mobile `/home`; przed wejściem w UX backlog trzeba zrobić re-baseline dokumentów względem aktualnego repo

## 5) Następny etap z pierwotnej listy

### Następna paczka główna
**Wejść w Phase 010**

Cel:
- wejść w backlog UX/UI dopiero po realnym domknięciu redukcji i unifikacji
- zacząć od re-baseline backlogu Phase 010 względem aktualnego repo
- nie przenosić do nowego etapu starych założeń o `product/apps/frontend` i mobile `/home`

Kryterium wyjścia:
- preconditions z `Zadanie MVP refactor.md` są spełnione
- nowy czat ma aktualny handoff i prompt startowy dla Phase 010
- backlog wejściowy jest czytany z korektą driftu dokumentacyjnego

### Dokumenty startowe

- [PHASE010_RESTART_HANDOFF_2026-05-06.md](./PHASE010_RESTART_HANDOFF_2026-05-06.md)
- [PHASE010_NEW_CHAT_PROMPT_2026-05-06.md](./PHASE010_NEW_CHAT_PROMPT_2026-05-06.md)

## 6) Ryzyka / uwagi operacyjne

- Lokalny web może trzymać stary refresh token po restarcie Supabase; web ma już guard w `browserAuth.ts`, ale przy bardzo starym stanie przeglądarki można jednorazowo wyczyścić site data.
- `origins` pozostaje pod RLS read-only; canonical save idzie przez serwerowy bridge:
  - `product/apps/web/app/api/canonical-coffee/route.ts`
- `Animated Splash` nie był ruszany jako kolejność wejścia dla `product/apps/web` i `product/apps/consumer-mobile`.
- Po `supabase db reset` lokalne loginy seedowe działają z:
  - `bart@ex.com / swetry`
  - `kazik@neoneon.online / swetry`
- Po restarcie lokalnego Supabase Expo/web flow może wymagać ponownego uruchomienia funkcji:
  - `scan_qr`
  - `log_tasting` (lub potwierdzony alias `coffee/log-tasting`)
  - `update_coffee_stats`

## 7) Przy kolejnym wejściu

1. Uruchomić:
```bash
pnpm -C product/apps/web dev --hostname 0.0.0.0 --port 3000
pnpm -C product/apps/consumer-mobile start -- --port 8081
supabase functions serve --no-verify-jwt
./product/scripts/mobile-functions-smoke-check.sh
```
2. Potwierdzić, że canonical QR nadal przechodzi web -> mobile.
3. Wejść w [PHASE010_RESTART_HANDOFF_2026-05-06.md](./PHASE010_RESTART_HANDOFF_2026-05-06.md).
4. Użyć [PHASE010_NEW_CHAT_PROMPT_2026-05-06.md](./PHASE010_NEW_CHAT_PROMPT_2026-05-06.md) do startu nowego czatu.
