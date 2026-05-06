# Kontekst: 
## Czym jest aplikacja **funcup**?
Aplikacja **funcup** jest areną **wymiany informacji** pomiędzy dwoma środowiskami:
1. `roaster` – palarnie kawy specialty;
2. `consumer` – konsumenci kawy specialty.
Oba środowiska łączy wspólna pasja: **kawa specialty**.
`roaster` jest przedsiębiorcą, wypala kawę i pakuje ją w opakowania detaliczne.
`consumer` jest konsumentem, który nabywa kawę – kupuje ją online lub stacjonarnie albo otrzymuje w prezencie.

## Dwie warstwy aplikacji
Aplikacja **funcup** zbudowana jest na architekturze Expo React i obsługuje dwie warstwy funkcjonalne:
1. `roaster-app`: strony, routing, funkcjonalności i UI/UX dedykowane do obsługi użytkownika `roaster`, dostępne wyłącznie w przeglądarce web browser;
2. `consumer-app`: strony, routing, funkcjonalności i UI/UX dedykowane dla użytkownika `consumer`, dostępne wyłącznie jako aplikacja iOS/Android na urządzeniach mobile.

### Separation of Concerns – Routing Core
`roaster-app` nie posiada wersji mobile, a jedynie wersję web browser.
`consumer-app` nie posiada wersji web, a jedynie wersję mobile iOS/Android.

## Metoda wymiany informacji pomiędzy `roaster` a `consumer`
Nośnikiem informacji pomiędzy środowiskami jest **kod QR**.
Kod QR może zostać wygenerowany wyłącznie w aplikacji (self-hosted QR model).
Kod QR jest generowany przez `roaster` i odczytowany przez `consumer`.

## Jak `roaster` generuje kod QR?
Aby wygenerować kod QR, Roaster wchodzi na stronę `roaster-add-coffee.tsx` (po zmianach: apps/web/app/tag/page.tsx) i uzupełnia metrykę produktu `roaster-coffee-tag`.
`roaster-coffee-tag` to zestaw informacji, które są zapisywane i przechowywane w bazie danych aplikacji (Supabase):
- Nazwa Roastera (`roaster_short_name` zasysana z profilu `roaster-profile`, wyświetlana jako URL do `roaster-profile`);
- zdjęcie etykiety lub opakowania (url do `img_coffee_label` na serwerach 'funcup');
- Kraj pochodzenia ziarna `bean_origin_country` (field type: dropdown, 8 items);
- Nazwa farmy ziarna `bean_origin_farm` (field type: text, max. 96 chars);
- Nazwa handlowa ziarna `bean_origin_tradename` (field type: text, max. 48 chars);
- Region uprawy ziarna `bean_origin_region` (field type: text, max. 96 chars);
- Gatunek kawy `bean_type` (field type: dropdown, 2 items: Arabica or Robusta);
- Odmiana dominująca ziarna `bean_varietal_main` (field type: text, max. 48 chars);
- Odmiany dodatkowe ziarna `bean_varietal_extra` (field type: text, max. 48 chars);
- Wysokość uprawy ziarna `bean_origin_height` (field type: number, max. 4 cyfry, liczby naturalne, wartość nie wyższa niż 3.000);
- Obróbka ziarna `bean_processing` (field type: dropdown, 5 items);
- Data wypału ziarna `bean_roast_date` (field type: calendar);
- Stopień wypału `bean_roast_level` (field type: dropdown, 3 items);
- Przeznaczenie `brew_method` (field type: dropdown, 4 items);
Następnie kliknięcie `btn-generate-qr` wysyła powyższe informacje do Supabase, gdzie są one przechowywane.
Po zakończonym sukcesem zapisaniu danych w Supabase, przycisk `btn-generate-qr` zyskuje napis "Wygeneruj kod QR".
Kliknięcie przycisku `btn-generate-qr` z napisem "Wygeneruj kod QR" powoduje wygenerowanie na serwerze aplikacji **funcup** kodu QR z pakietem informacji `roaster-coffee-tag`.
Na stronie `roaster-add-coffee.tsx` (po zmianach: apps/web/app/tag/page.tsx), obok formularza `roaster-coffee-tag` pokazuje się img/png wygenerowanego kodu QR oraz przycisk `download-QR-svg`.

**Koniec ścieżki generowania kodu QR przez `roaster`**

# Zadanie:
Stosuj regułę "najpierw pytaj, potem działaj" przed zapisaniem lub modyfikacją plików deliverable w root repo lub podjęciem decyzji:
1. Wygeneruj stronę `test-select-user.tsx` uruchamianą po zakończeniu powitalnego animated-splash. Na stronie `test-select-user.tsx` umieść dwa przyciski: `btn-add-coffee` (label "Roaster") i `btn-scan-coffee` (label "Consumer").
2. Wygeneruj stronę `roaster-add-coffee.tsx` (po zmianach: apps/web/app/tag/page.tsx), zawierającą wszystkie pola danych do wprowadzania i przechowywania informacji `roaster-coffee-tag`.
3. Implementuj pola typu "dropdown" jako komponenty Select.
4. Wprowadź walidację frontendową zgodnie z limitami znaków wskazanymi w metryce produktu.
5. Utwórz plik tabeli bazy danych Supabase do przechowywania danych `roaster-coffee-tag`.
6. Ze względu na stosowanie TypeScript, wygeneruj interfejs RoasterCoffeeTag w dedykowanym pliku typów, co ułatwi późniejszą integrację z `consumer-app`
7. Podłącz stronę `roaster-add-coffee.tsx` (po zmianach: apps/web/app/tag/page.tsx) do nawigacji przyciskiem `btn-add-coffee`.
8. Na wszystkich stronach w przeglądarce użyj stylów spójnych z `apps/web/src/theme/authScreenStyles.ts` (tokeny jak `consumer-mobile` / auth).
9. Upewnij się, że struktura katalogów w app/ odpowiada wymaganiom Expo Router dla nowo utworzonych stron.

# Definition of Ready:
1. Strona **funcup** uruchamia się w przeglądarce.
2. Pierwotny animated-splash przebiega do końca.
3. Po zakończeniu animated-splash aplikacja wyświetla `test-select-user.tsx`.
4. `roaster` klika `btn-add-coffee` i przechodzi na stronę `roaster-add-coffee.tsx` (po zmianach: apps/web/app/tag/page.tsx).
5. Na stronie `roaster-add-coffee.tsx` (po zmianach: apps/web/app/tag/page.tsx) `roaster` uzupełnia `roaster-coffee-tag`, a wprowadzone dane zapisują się w tabeli Supabase.