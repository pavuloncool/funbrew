Poniżej masz plan wdrożenia ustawiony pod dwa cele: szybko sprawdzić, czy użytkownicy w ogóle chcą logować dane, i nie budować zbyt wcześnie drogich funkcji analitycznych dla palarni.

**Założenie**
Najpierw walidujecie `data capture`, potem `data quality`, a dopiero na końcu `paid insight`. Jeśli odwrócicie tę kolejność, powstanie ładny dashboard bez wiarygodnego sygnału.

**Faza 1: Telemetria MVP**
Cel: potwierdzić, że da się zebrać regularne logi z sensownym kosztem UX.

Backend:
- Wdrożyć minimalny model: `roasteries`, `coffees`, `coffee_lots`, `qr_codes`, `users`, `brew_logs`.
- Do `brew_logs` na starcie tylko: `coffee_lot_id`, `user_id`, `brew_method`, `overall_rating`, `repeat_purchase_intent`, `created_at`.
- Dodać prostą warstwę eventową: `qr_scanned`, `quick_log_started`, `quick_log_completed`.
- Przygotować podstawowe endpointy: skan QR, pobranie lotu, zapis quick logu, podstawowe agregaty per lot.
- Zapewnić anonimizację i zgodę na przetwarzanie danych od początku.

Mobile UX:
- Zbudować flow `scan QR -> lot screen -> quick log`.
- Quick log ma trwać realnie 5-10 sekund.
- Formularz bez ekranów opcjonalnych, bez zaawansowanych parametrów, bez sensorycznych multi-selectów.
- Po zapisie pokazać prostą wartość dla usera: historia logów, średnia ocena danego lotu, ewentualnie “jak inni ocenili”.

Analytics:
- Dashboard wewnętrzny, nie dla palarni: liczba skanów, start/completion rate, time-to-log, logs per lot, logs per user, rating distribution.
- Nie budować jeszcze pełnego panelu B2B.
- Sprawdzić, czy QR rzeczywiście działa jako stabilny punkt wejścia.

Go / no-go:
- `Go`, jeśli completion rate quick logu po skanie QR jest co najmniej umiarkowany i powtarzalny.
- `Go`, jeśli macie regularne logi dla wielu lotów, a nie tylko pojedyncze skoki.
- `Go`, jeśli median time do zapisania quick logu mieści się w zakładanym budżecie UX.
- `No-go`, jeśli większość userów odpada między skanem a zapisem.
- `No-go`, jeśli logi są zbyt rzadkie, by budować sensowną analitykę lot-level.
- `No-go`, jeśli użytkownik nie dostaje żadnej wartości zwrotnej i retencja logowania jest bliska zeru.

Praktyczny gate:
- Minimum kilkanaście aktywnych lotów z powtarzalnymi logami.
- Minimum kilkuset quick logów łącznie, zanim rozszerzycie model.

**Faza 2: Jakość danych i segmentacja**
Cel: sprawdzić, czy da się zebrać dane wystarczająco dobre, by generować użyteczne insighty dla palarni.

Backend:
- Rozszerzyć model o `brew_parameters`, `sensory_evaluations`, `consumption_contexts`.
- Dodać `experience_level`, `primary_brew_method`, `equipment_class` do profilu usera.
- Ustandaryzować słowniki i enumy, żeby nie rozwalić analityki tekstem wolnym.
- Dodać walidację zakresów dla temperatury, czasu, ratio i ratingów.
- Przygotować wersjonowanie schematu eventów i prosty model jakości danych.

Mobile UX:
- Wprowadzić 3 poziomy logowania:
  1. `Quick log` – jak w Fazie 1.
  2. `Standard log` – + 2-3 parametry parzenia.
  3. `Advanced log` – pełny profil sensoryczny i kontekst.
- Rozszerzony formularz pokazywać dopiero po quick logu albo użytkownikom z wyższą intencją.
- Użyć predefiniowanych wyborów zamiast manualnych pól tam, gdzie to możliwe.
- Dodać onboarding segmentacyjny, ale maksymalnie krótki.

Analytics:
- Wewnętrznie policzyć: `brew success rate`, rating per segment, rating vs brew method, rating vs dni od roast date.
- Zacząć liczyć jakość danych: % braków, % wartości skrajnych, udział quick vs standard vs advanced logów.
- Uruchomić pierwsze testy z 2-5 palarniami na rzeczywistych danych, nawet ręcznie raportowanych.

Go / no-go:
- `Go`, jeśli przynajmniej część userów wchodzi w standard log bez dramatycznego spadku completion rate.
- `Go`, jeśli pola parametryczne mają akceptowalną spójność i nie są głównie śmieciowe.
- `Go`, jeśli palarnie potwierdzają, że przynajmniej 2-3 insighty są dla nich operacyjnie użyteczne.
- `No-go`, jeśli advanced logging zabija wolumen.
- `No-go`, jeśli dane sensoryczne są zbyt losowe, by porównywać je z deklaracjami palarni.
- `No-go`, jeśli nie umiecie odróżnić problemu produktu od problemu złego parzenia.

Praktyczny gate:
- Minimum kilka lotów z sensowną liczbą `standard` lub `advanced` logów.
- Minimum 2-3 insighty, które palarnia uznaje za warte zapłaty albo co najmniej pilotażu.

**Faza 3: Produkt B2B i monetyzacja**
Cel: zamienić telemetryczny sygnał w płatny produkt dla palarni.

Backend:
- Zbudować multi-tenant dashboard API dla palarni.
- Dodać warstwę agregatów i denormalizacji pod widoki: overview, lot detail, segments, sensory vs declared.
- Wdrożyć alerty i progi jakości danych, żeby nie pokazywać palarniom wniosków opartych na zbyt małej próbie.
- Dodać role, uprawnienia, export CSV i ewentualnie API dla planów wyższych.
- Wprowadzić billing i flagi planów.

Mobile UX:
- Domknąć pętlę wartości dla usera, bo bez tego B2B będzie wysychać od strony supply danych.
- Pokazać rekomendacje receptur, crowd notes, historię własnych ocen, ewentualnie porównanie z innymi.
- Dodać mechaniki zwiększające wolumen logów dla palarni partnerskich: przypomnienia, follow roastery, log kolejnej paczki.

Analytics:
- Udostępnić palarniom tylko te moduły, które mają wystarczający sygnał:
  `Overview`, `Lot Detail`, `Segments`, `Sensory vs Declared`, `Alerts`.
- Każdy insight musi mieć minimalny próg danych i poziom ufności.
- Formalnie zdefiniować metryki premium, np. `Flavor Accuracy Score`, `Repurchase Likelihood`, `Degassing Peak Window`.
- Mierzyć adopcję dashboardu i korelację z retencją płatnych kont.

Go / no-go:
- `Go`, jeśli palarnie wracają do dashboardu i korzystają z niego w decyzjach operacyjnych.
- `Go`, jeśli przynajmniej część z nich akceptuje płatny plan lub pilotaż płatny.
- `Go`, jeśli na poziomie lotu macie próg danych pozwalający pokazywać wnioski bez wprowadzania w błąd.
- `No-go`, jeśli dashboard jest oglądany, ale nie wpływa na decyzje.
- `No-go`, jeśli większość insightów opiera się na zbyt małych próbach.
- `No-go`, jeśli koszt utrzymania zbierania danych po stronie mobile jest większy niż potencjalna wartość B2B.

Praktyczny gate:
- Co najmniej kilka palarni aktywnie korzystających z panelu przez kilka cykli wypuszczenia lotów.
- Co najmniej pierwsze płatne lub jednoznacznie płatnościowe wdrożenia pilotażowe.

**Kolejność wdrożenia zespołowo**
1. Najpierw `backend + quick log + internal analytics`.
2. Potem `segmentacja + standard log + data quality`.
3. Na końcu `B2B dashboard + billing + alerts`.

**Najważniejsza zasada decyzyjna**
Nie przechodźcie do fazy 3 tylko dlatego, że “schema już jest gotowy”. Przechodzicie dopiero wtedy, gdy macie dowód, że:
- użytkownik daje dane regularnie,
- dane są wystarczająco spójne,
- palarnia potrafi wskazać konkretną decyzję, którą podejmie na ich podstawie.

Jeśli chcesz, mogę teraz zamienić to na bardziej operacyjny artefakt: `roadmapę 8-12 tygodni` z backlogiem per sprint dla backendu, mobile i analytics.