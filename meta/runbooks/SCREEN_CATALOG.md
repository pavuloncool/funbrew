# Screen Catalog (dla odbiorcy nietechnicznego)

Data: 2026-05-07  
Zakres: `product/apps/web` + `product/apps/consumer-mobile`

Każdy ekran opisuje: **co użytkownik widzi**, **skąd biorą się dane**, **jaki jest efekt biznesowy**.

## product/apps/web

| Ekran (route) | Co pokazuje | Źródło danych | Efekt biznesowy |
|---|---|---|---|
| `/` | Ekran wejścia i automatyczne przekierowanie po sprawdzeniu sesji | Sesja auth + rola konta | Wpuszcza tylko roastera do panelu web |
| `/login` | Logowanie roastera | Supabase Auth | Start pracy roastera w panelu |
| `/register` | Rejestracja roastera | Supabase Auth | Utworzenie konta palarni |
| `/pending` | Komunikat o oczekiwaniu (np. weryfikacja maila) | Stan auth | Czytelny krok po rejestracji |
| `/roaster-hub` | Główny pulpit palarni (kafelki akcji) | Profil palarni | Skraca drogę do najważniejszych zadań |
| `/roaster-hub/setup` | Założenie rekordu palarni | `roasters` | Uruchamia profil i publikację produktów |
| `/roaster-profile` | Edycja danych palarni | `roasters` | Aktualne dane publiczne i operacyjne palarni |
| `/roaster-hub/coffees/new` | Kreator publikacji kawy i batcha MVP | `coffees`, `origins`, `roast_batches`, `/api/batch-qr` | Publikacja produktu, który consumer może zeskanować |
| `/roaster-hub/batches` | Lista batchy palarni i wejście do zarządzania/QR/analityki | `coffees`, `roast_batches`, `qr_codes` | Operacyjne zarządzanie publikacją i portfolio batchy |
| `/tag` | Formularz tagu kawy i generowanie publicznego QR/hash | `roaster_coffee_tags`, `tasting_notes`, `/api/qr` | Alternatywny, szybki kanał publikacji landingu |
| `/tag/edit/[id]` | Edycja istniejącego tagu | `roaster_coffee_tags`, `tasting_notes` | Aktualizacja treści produktu bez zmiany kanału publicznego |
| `/roaster-hub/analytics` | Lista batchy z podstawowymi metrykami | `coffees`, `roast_batches`, `coffee_stats` | Szybki podgląd skuteczności batchy |
| `/roaster-hub/analytics/[batchId]` | Szczegółowa analityka konkretnego batcha | `coffee_logs`, `coffee_log_tasting_notes`, `coffee_stats` | Decyzje produktowe na podstawie degustacji |
| `/roaster-hub/coffees/[id]/batches/[batchId]` | Szczegóły batcha i akcje wokół QR | `roast_batches`, `qr_codes` | Kontrola jakości i identyfikatora batcha |
| `/q/[hash]` | Publiczna strona odczytu hash QR (webowy resolver) | Supabase Function `scan_qr` | Prezentacja kawy po zeskanowaniu/otwarciu linku |
| `/scan` | Informacyjny ekran skanu (web placeholder) | Brak krytycznych danych | Komunikuje intencję flow QR w web |

## product/apps/consumer-mobile

| Ekran (route) | Co pokazuje | Źródło danych | Efekt biznesowy |
|---|---|---|---|
| `/index` | Sekwencja wejścia (entry splash) i przekierowanie | Stan sesji + stan profilu | Spójne wejście użytkownika do aplikacji |
| `/(auth)/login` | Bramka sesji/biometrii | Stan auth lokalny | Bezpieczne odblokowanie sesji |
| `/(auth)/login-form` | Formularz logowania consumera | Supabase Auth | Wejście consumera do aplikacji |
| `/(auth)/register` | Rejestracja i przejście dalej | Supabase Auth | Pozyskanie nowego użytkownika |
| `/(auth)/forgot-password` | Reset hasła (start) | Supabase Auth | Odzyskanie dostępu |
| `/(auth)/reset-password` | Ustawienie nowego hasła | Supabase Auth | Dokończenie odzyskiwania konta |
| `/(auth)/complete-profile` | Uzupełnienie profilu po rejestracji | `users`, preferencje | Lepsza personalizacja i gotowość do użycia |
| `/(tabs)/hub` | Główny ekran nawigacyjny consumera | Głównie routing lokalny | Szybki dostęp do scan/coffee/roasters/learn |
| `/(tabs)/scan/scan` | Skaner QR i odczyt hash | Kamera + parser QR | Start kluczowego flow produktu |
| `/q/[hash]` | Deep link resolver (przekierowanie do strony kawy) | Parametr hash | Spójność wejść z linku i skanu |
| `/coffee/[id]` | Strona kawy (produkt, historia, kontekst) | Public coffee model (`scan_qr`/normalized data) | Decyzja o degustacji i przejście do logu |
| `/coffee/[id]/log` | Formularz Tasting Log + status sync offline | `log_tasting`, `update_coffee_stats`, offline queue | Zapis feedbacku użytkownika |
| `/(tabs)/coffee` | Zakładka „Coffee”: Rated + Discover | `coffee_logs` + feed discover | Powrót do historii i odkrywanie nowych kaw |
| `/coffee-log/[logId]` | Szczegóły pojedynczego wpisu Rated Coffee + post-edycja/usuwanie | `coffee_logs`, `reviews`, `coffee_log_telemetry_core`, `update_coffee_stats` | Korekta i utrzymanie jakości danych po zapisaniu degustacji |
| `/(tabs)/journal` | Kompatybilny redirect do aktualnej sekcji coffee | Routing lokalny | Utrzymanie kompatybilności starych ścieżek |
| `/(tabs)/roasters` | Roasters: obserwowani i do odkrycia + wyszukiwanie local `contains(name \| city)` | `roasters`, follow state w `users` | Budowa relacji consumer -> palarnia i szybsze odnajdywanie marek |
| `/roaster/[id]` | Profil pojedynczej palarni + follow/unfollow | `roasters`, `users.following_roaster_ids` | Zwiększanie retencji i powrotów do marek |
| `/(tabs)/brew-your-skills` | Lista treści edukacyjnych | Statyczne treści | Rozwój wiedzy i częstsze użycie aplikacji |
| `/learn/[slug]` | Artykuł edukacyjny | Statyczne treści | Edukacja i wsparcie jakości degustacji |
| `/(tabs)/profile` | Ustawienia konta, preferencji, bezpieczeństwa | `users`, `user_favorite_flavor_notes`, `brew_methods` | Personalizacja i utrzymanie konta |

## Ważne doprecyzowanie
- `product/apps/consumer-online` **nie występuje** w repo; poprawny zakres to `product/apps/consumer-mobile`.
