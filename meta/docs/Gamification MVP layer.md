# MVP/Beta Plan: Warstwa Gamifikacji dla `consumer-mobile` w `fun•brew`

## Summary
- Celem MVP nie jest pełna mechanika gamification, tylko spójna warstwa demo wspierająca `scan -> coffee page -> tasting log -> powrót do aplikacji z lepszym zrozumieniem kawy`.
- Wdrożone na 100%:
  - `Sensory Progression` oparte o istniejące `users.sensory_score/sensory_level`
  - `Community Helpful` dla publicznych review przy aktualnie skanowanej kawie/batchu
  - `Favourite rated coffees` jako szybki feature demo
  - `Coffee Geography` jako statyczna mapa + summary na Home Hub
- Placeholdery:
  - misje kontekstowe
  - pełny collection album origin/process/flavor
  - zaawansowany insight engine i jakościowe feedbacki per użytkownik

## Business Layer
- `QR scan` pozostaje wejściem głównym. Po skanie użytkownik trafia na Coffee Page, gdzie:
  - widzi produkt, origin, processing, batch i statystyki
  - może oznaczyć rated log gwiazdką i dodać go do ulubionych
  - widzi publiczne review dla tej kawy/batcha i może oznaczyć review jako `Helpful`
  - przechodzi do logowania degustacji
- `Tasting log` staje się głównym źródłem progresji:
  - `rating`, `brew_method_id`, `tasting_note_ids`, `free_text_notes`, `review` zapisują się jak dziś
  - po zapisie działa istniejący `update_coffee_stats`, który przelicza `sensory_score` i `sensory_level`
  - gating tasting notes jest `hard`: zablokowane deskryptory nie są możliwe do wyboru poniżej wymaganego poziomu
- `Sensory progression` w MVP:
  - wykorzystuje istniejące progi poziomów
  - steruje dostępnością tasting notes w formularzu logowania i edycji logu
  - daje prosty feedback tekstowy na Hub/Profile, bez punktów, XP i streaków
- `Coffee Geography` w MVP:
  - buduje podsumowanie z zalogowanych kaw przez join `coffee_logs -> roast_batches -> coffees -> origins`
  - pokazuje odwiedzone kraje i podstawowe liczniki
  - statyczna mapa służy jako warstwa prezentacyjna, nie interaktywna mechanika
- `Community layer` w MVP:
  - opiera się na publicznych `reviews`
  - pozwala dodać/usunąć `Helpful`
  - reputacja community jest lekka: liczymy `helpful received` i `review count`; nie wpływa jeszcze na unlocki, tylko na ekspozycję i snapshot na Hub
- `Favorites` w MVP:
  - zapisujemy ulubione na poziomie `coffee_log` oznaczonego gwiazdką
  - feature służy do szybkiego powrotu do konkretnych rated coffees, nie do modelu scan-entry

## Dev Layer
- Zmiany backend/schema:
  - dodać tabelę `user_favorite_coffee_logs` z `user_id`, `coffee_log_id`, `created_at`, `UNIQUE(user_id, coffee_log_id)`
  - dodać RLS dla `user_favorite_coffee_logs` tylko dla właściciela
  - nie dodawać na MVP `user_progression`, `vocabulary_unlocks`, `coffee_collection`; progresję i gating liczyć z istniejących danych
  - dodać community read model:
    - rekomendowane: nowy edge function/RPC `get_batch_community_reviews`
    - zwraca `review id`, `body`, `coffee_log_id`, `logged_at`, `helpful_count`, `viewer_marked_helpful`
  - dodać RPC `get_coffee_favorite_user_count(p_coffee_id)` do społecznościowego social proof
  - głos `Helpful` obsłużyć przez `review_votes` z toggle write; można użyć drugiego małego endpointu/RPC albo bezpośredniego upsert/delete
- Zmiany shared/mobile logic:
  - nowy shared moduł `sensoryProgression` z mapowaniem poziomów do dozwolonych tasting notes
  - nowy hook `useUnlockedTastingNotes(userId)`
  - nowy hook `useFavoriteRatedCoffeeLogs(userId)` + `toggleFavoriteRatedCoffeeLog`
  - nowy hook `useCoffeeGeographySummary(userId)` do mapy i liczników krajów
  - nowy hook `useBatchCommunityReviews(batchId, userId)` + `toggleReviewHelpful`
- Zmiany routingów i flows:
  - rozszerzyć `/(tabs)/hub` do roli głównego dashboardu gamification:
    - card progresji sensorycznej
    - preview statycznej mapy
    - snapshot community
    - skrót do ulubionych
  - rozszerzyć `/(tabs)/coffee/index` o trzeci segment `Favorites`
  - dodać route `app/atlas/index.tsx` jako ekran statycznej mapy + lista krajów
  - opcjonalnie dodać `app/coffee/[id]/community.tsx` jeśli lista review nie zmieści się czytelnie na Coffee Page; w przeciwnym razie community embedować bez nowego route
- Zmiany ekranów:
  - `Coffee Page`: dodać toggle `Favorite`, sekcję `Community Reviews`, CTA do logowania
  - `Tasting Log` i `Coffee Log Details`: wpiąć hard gating tasting notes + komunikat „unlock on next level”
  - `Home Hub`: zmienić z czysto nawigacyjnego ekranu na gamification dashboard
  - `Profile`: zostawić detal poziomu sensorycznego; dodać tylko secondary summary community
- Placeholdery w UI:
  - `Contextual Missions`: karta na Hub z opisem przyszłego modułu, bez silnika misji
  - `Collection Album`: sekcja na `Atlas` z opisem przyszłego widoku origin/process/flavor
  - `Qualitative Feedback`: 2-3 predefiniowane komunikaty, bez pełnego silnika insightów

## Public APIs / Interfaces
- Nowa tabela: `public.user_favorite_coffee_logs`
- Nowe route’y:
  - `/atlas`
  - rozszerzony `/ (tabs)/coffee` z sekcją `Favorites`
  - opcjonalnie `/coffee/[id]/community`
- Nowe typy/hooki:
  - `RatedCoffeeLogSummary`
  - `FavoriteRatedCoffeeLog`
  - `SensoryUnlockState`
  - `CoffeeGeographySummary`
  - `BatchCommunityReview`
  - `useUnlockedTastingNotes`
  - `useFavoriteRatedCoffeeLogs`
  - `useCoffeeGeographySummary`
  - `useBatchCommunityReviews`

## Test Plan
- Progression:
  - user z niskim `sensory_score` nie może wybrać advanced tasting notes
  - po kolejnym logu i refreshu `sensory_level` oraz dostępne notes aktualizują się poprawnie
- Favorites:
  - zapis i usunięcie `Favourite rated coffee` działa z Coffee Page i `coffee-log/[logId]`
  - segment `Favorites` pokazuje tylko wpisy aktualnego usera
  - Coffee Page community card pokazuje `X users' favourite coffee`
- Geography:
  - user bez logów widzi empty state
  - user z logami widzi kraje zliczone z originów i poprawny preview mapy
- Community:
  - publiczne review dla batcha ładują się na Coffee Page
  - `Helpful` zapisuje się jako toggle i odświeża licznik
  - własny vote jest poprawnie odtwarzany po reopenie ekranu
- Flow end-to-end:
  - `scan -> coffee page -> favorite -> log tasting -> hub` pokazuje nowy stan bez potrzeby ręcznego restartu
  - edycja istniejącego logu respektuje gating i nie psuje review/community

## Assumptions And Defaults
- `Hard gating` dotyczy tylko wyboru tasting notes; nie blokuje samego zapisu logu, jeśli user wybrał poprawny dozwolony zestaw.
- `Community reputation` w MVP jest oddzielona od `sensory_score`; unlocki deskryptorów są sterowane wyłącznie progression sensoryczną.
- `Favourite rated coffee` jest teraz świadomym kompromisem demo, ale już opiera się o `coffee_log` zamiast `scan entry`.
- `Geography` w MVP jest read-only i opiera się głównie o kraj; region może być pokazany tekstowo, bez dodatkowej logiki mapowej.
- Nie dodajemy leaderboardów, streaków, XP bars, push-retention ani reward stacking.
