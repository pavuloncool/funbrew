# MVP Refactor Handoff — 2026-05-06

Stan po przerwie w realizacji post-audit MVP refactor.

## 1) Domknięte paczki

### Canonical decision + public contract
- ADR: [012-canonical-product-model.md](../specs/002-qr-coffee-platform/adrs/012-canonical-product-model.md)
- `scan_qr` czytany przez jeden znormalizowany public model:
  - `packages/shared/src/coffeePage/normalizeCoffeePage.ts`
  - `apps/web/app/q/[hash]/page.tsx`
  - `apps/consumer-mobile/app/coffee/[id]/index.tsx`

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
  - `packages/shared/src/auth/accountRole.ts`

### Canonical producer flow on web
- `Roaster Hub -> Publikuj batch MVP`
- web publikuje:
  - `roasters.country`, `description`, `logo_url`
  - `coffees.origin_id`, `variety`, `processing_method`, `producer_notes`, `cover_image_url`
  - `roast_batches.brewing_notes`, `roaster_story`
- canonical batch ma własny publiczny QR:
  - `apps/web/app/api/batch-qr/route.ts`
  - `apps/web/app/roaster-hub/coffees/[id]/batches/[batchId]/page.tsx`

### Analytics roastera
- analytics czytają:
  - `coffee_stats`
  - surowe `coffee_logs`
  - filtr po `brew_method_id`
  - anonimowe `reviews`
- UI pokazuje też stan `stats fresh vs stale`

## 2) Zweryfikowane ręcznie

- `apps/web` generuje canonical batch QR
- `consumer-mobile` skanuje canonical batch QR
- mobile Coffee Page pokazuje te same dane co canonical publisher
- deep link Expo Go działa:
  - `exp://192.168.1.106:8081/--/q/{hash}`

## 3) Zweryfikowane komendami

```bash
pnpm -C packages/shared test
pnpm -C packages/shared typecheck
pnpm -C apps/consumer-mobile typecheck
pnpm -C apps/web build
pnpm -C apps/web exec playwright test tests/batch-qr.spec.ts
```

## 4) Świadomie odłożone

To nie są błędy architektury canonical modelu, tylko znane luki przejściowe:

- `Coffee Bank` nadal jest tag-first management surface
- canonical batch nie wraca jeszcze do zarządzania przez `Coffee Bank`
- nie ruszaliśmy jeszcze ograniczenia discovery do scope MVP
- nie ruszaliśmy jeszcze repo cleanup / archive paczek za approvalem

## 5) Następny etap z pierwotnej listy

### Następna paczka główna
**Ograniczyć scope discovery do wersji MVP**

Cel:
- zostawić tylko:
  - discover coffees
  - discover roasters
  - follow roaster
  - static learn articles
- nie rozwijać nowych social/community flow poza minimum

Kryterium wyjścia:
- US3 działa na seedzie
- discovery nie wymaga nowych decyzji modelowych

## 6) Ryzyka / uwagi operacyjne

- Lokalny web może trzymać stary refresh token po restarcie Supabase; web ma już guard w `browserAuth.ts`, ale przy bardzo starym stanie przeglądarki można jednorazowo wyczyścić site data.
- `origins` pozostaje pod RLS read-only; canonical save idzie przez serwerowy bridge:
  - `apps/web/app/api/canonical-coffee/route.ts`
- `Animated Splash` nie był ruszany jako kolejność wejścia dla `apps/web` i `apps/consumer-mobile`.

## 7) Przy kolejnym wejściu

1. Uruchomić:
```bash
pnpm -C apps/web dev --hostname 0.0.0.0 --port 3000
pnpm -C apps/consumer-mobile start -- --port 8081
```
2. Potwierdzić, że canonical QR nadal przechodzi web -> mobile.
3. Wejść w paczkę discovery MVP, bez otwierania side-tracków typu `Coffee Bank canonical management`, chyba że zakres zostanie świadomie zmieniony.
