# old-files (2026-05-04)

Poniżej znajdują się pliki wyizolowane po migracji SoT nut smakowych na `public.tasting_notes`.

## Przeniesione pliki

1. `old-files/product/apps/consumer-mobile/src/features/profile/preferences/flavorNotes.ts`
- Co robił: ładował listę nut smakowych z tabeli `public.flavor_notes` dla ekranów profilu mobile.
- Dlaczego wycofany: po migracji tabela słownikowa `flavor_notes` została zastąpiona przez `tasting_notes`.
- Co zastąpiło: `product/apps/consumer-mobile/src/features/profile/preferences/tastingNotes.ts`.
- Data migracji: 2026-05-04.

## Zweryfikowani kandydaci, których NIE przeniesiono

1. `product/packages/shared/src/constants/flavorNotes.ts`
- Nadal używany pośrednio przez `product/packages/shared/src/constants/reputation.ts` (kompatybilność z istniejącym komponentem selektora).

2. `product/supabase/functions/update_coffee_stats/index.ts`
- Nadal wywoływany przez `product/packages/shared/src/services/tastingService.ts` (`functions.invoke('update_coffee_stats')`).

3. `product/supabase/functions/scan_qr/index.ts`
- Nadal wywoływany przez `product/packages/shared/src/hooks/useCoffeePage.ts` (`functions.invoke('scan_qr')`).
