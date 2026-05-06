# Kontekst: 

## Dwie warstwy aplikacji **funcup**
Aplikacja **funcup** zbudowana jest na architekturze Next.js dla `roaster-app` i Expo/React Native dla `consumer-app` i obsługuje dwie warstwy funkcjonalne:
1. `roaster-app` (..apps/web): strony, routing, funkcjonalności i UI/UX dedykowane do obsługi użytkownika `roaster`, dostępne wyłącznie w przeglądarce web browser;
2. `consumer-app` (apps/consumer-mobile): strony, routing, funkcjonalności i UI/UX dedykowane dla użytkownika `consumer`, dostępne wyłącznie jako aplikacja iOS/Android na urządzeniach mobile.

### Separation of Concerns – Routing Core
`roaster-app` nie posiada wersji mobile, a jedynie wersję web browser.
`consumer-app` nie posiada wersji web, a jedynie wersję mobile iOS/Android.

## Metoda wymiany informacji pomiędzy `roaster` a `consumer`
Nośnikiem informacji pomiędzy środowiskami jest **kod QR**.
Kod QR jest generowany wyłącznie przez `roaster` w warstwie aplikacji `roaster-app` na stronie ../apps/web/app/tag/page.tsx (Next.js App Router; self-hosted QR model).
Kod QR jest generowany przez `roaster` i odczytowany przez `consumer`.

## Czym jest plik ../apps/web/app/tag/page.tsx?
../apps/web/app/tag/page.tsx to strona w `roaster-app`, za pomocą której `roaster` tworzy `roaster-coffee-tag`, czyli zestaw informacji na temat wyprodukowanej kawy, które są zapisywane i przechowywane w bazie danych aplikacji (Supabase, tabela roaster_coffee_tags), na potrzeby wygenerowania kodu QR, który z kolei skanuje potem `consumer`.
Aby wygenerować kod QR, `roaster` wchodzi na stronę ../apps/web/app/tag/page.tsx i uzupełnia metrykę produktu `roaster-coffee-tag`:
- Nazwa Roastera (`roaster_short_name` zasysana z profilu `roaster-profile`, wyświetlana jako URL do `roaster-profile`);
- zdjęcie etykiety lub opakowania `coffee-label` (dotychczas jako URL do `img_coffee_label` na serwerach 'funcup');
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

##Definicja problemu:
1. data w polu `bean_roast_date` musi być wprowadzana przy pomocy narzędzia Shadcn Date Picker (install: pnpm dlx shadcn@latest add https://date-picker.luca-felix.com/r/date-picker.json) w wariancie "Basic Date Picker":
```
"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Calendar } from "@/registry/new-york/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import * as React from "react"

export default function DatePicker() {
  const [date, setDate] = React.useState<Date>()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={setDate} autoFocus />
      </PopoverContent>
    </Popover>
  )
}
```
Dodatkowo calendar-picker powinien zawierać przycisk "Today", aby ułatwić wpisanie daty odpwowiadającej dacie systemowej.

2. w formularzu `roaster-coffee-tag` funkcja dodania zdjęcia opakowania lub etykiety kawy `coffe-label` w celu wysłania go do`img_coffee_label` w Supabase, tabela roaster_coffee_tags, ma być realizowana  przy pomocy uploadera (FilePond lub minimum tej samej klasy co FilePond: https://v5.filepond.com/docs/start-here/getting-started/) – REZYGNACJA Z URL.
IMPORTANT: uploader powinien ograniczać wagę pliku do 512 KB i możliwe formaty do JPG, PNG lub WEBP.

# Zadanie:
Stosuj regułę "najpierw pytaj, potem działaj" przed zapisaniem lub modyfikacją plików deliverable w root repo lub podjęciem decyzji:
1. Dodaj calendar picker wg opisu problemu powyżej, z uwzględnieniem przycisku "Today", którego kliknięcie wpisuje automatycznie aktualną datę systemową.
2. Wprowadź walidację daty jako nie późniejszej niż aktualna dla danego dnia data systemowa.
3. Dodaj uploader wg opisu problemu powyżej.
4. Wprowadź walidację wagi i rozszerzenia pliku.
5. Ze względu na stosowanie TypeScript, wygeneruj interfejs RoasterCoffeeTag w dedykowanym pliku typów, co ułatwi późniejszą integrację z `consumer-app`
6. Na wszystkich stronach w przeglądarce użyj stylów spójnych z `apps/web/src/theme/authScreenStyles.ts` (tokeny jak consumer / auth).
7. Dla web: struktura tras w `apps/web/app/` (Next.js App Router); roaster tag: np. `/tag`.

# Definition of Ready:
1. Strona **funcup** uruchamia się w przeglądarce.
2. Pierwotny animated-splash przebiega do końca.
3. Po zakończeniu animated-splash aplikacja web przechodzi do wyboru roli (`/role`, odpowiednik `test-select-user`).
4. ../apps/web/app/tag/page.tsx posiada zaimplementowany uploader `coffee-label`, który wysyła razem z pozostałymi danymi zdjęcie etykiety lub opakowania do bazy Supabase.
5. ../apps/web/app/tag/page.tsx posiada zaimplementowany calendar-picker do wyboru daty kliknięciem, z uwzględnieniem przycisku "Today", który automatycznie wstawia aktualną datę systemową.