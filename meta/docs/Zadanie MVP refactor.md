#Zadanie
Doprowadzić MVP do końca przez **redukcję i unifikację**, nie przez dalsze dokładanie ekranów.

Najważniejsza decyzja powinna być jedna:

**Przyjąć model kanoniczny jako źródło prawdy**
`roasters -> coffees -> roast_batches -> qr_codes -> coffee_logs -> coffee_stats`

a `roaster_coffee_tags` potraktować jako:
- tymczasową projekcję/publiczny read model, albo
- warstwę kompatybilności do wygaszenia.

To wynika wprost z:
- specyfikacji MVP w [spec.md](/Users/pa/projects/funcup/meta/docs/funcup-src-docs/02-specs/spec.md)
- backlogu 88 tasków w [13-tasks-002-qr-coffee-platform-88-tasks.md](/Users/pa/projects/funcup/meta/docs/funcup-src-docs/04-tasks/13-tasks-002-qr-coffee-platform-88-tasks.md)
- audytu przepływów w [funcup-web-mobile-data-flow-audit.md](/Users/pa/projects/funcup/meta/docs/funcup-web-mobile-data-flow-audit.md)

Jeśli zostawisz dwa równorzędne modele, repo będzie się dalej rozjeżdżać.

**Proponowana ścieżka**

1. **Zamknąć decyzję architektoniczną**
   - Spisać krótki ADR: `coffees/roast_batches/qr_codes` są canonical.
   - Określić status `roaster_coffee_tags`: `derived` albo `deprecated`.
   - Zablokować dodawanie nowych feature’ów do obu modeli naraz.

Kryterium wyjścia:
- każdy nowy ekran i endpoint wie, który model zapisuje.

2. **Ujednolicić kontrakt publicznego Coffee Page**
   - `scan_qr` powinno zwracać jeden spójny kontrakt produktu.
   - Coffee Page ma czytać jeden model domenowy, nie dwa konkurencyjne.
   - Jeśli tymczasowo zostaje `roaster_coffee_tags`, to tylko jako adapter do tego samego publicznego kształtu danych.

Kryterium wyjścia:
- `/q/[hash]` i `mobile /coffee/[id]` nie mają rozgałęzionej logiki “tag vs batch” poza cienką warstwą mapowania.

3. **Domknąć producer flow po stronie roastera**
   - Web musi naprawdę produkować pola, które consumer czyta.
   - Priorytetowe luki z audytu:
     - `coffees.origin_id`, `variety`, `processing_method`, `producer_notes`, `cover_image_url`
     - `roast_batches.brewing_notes`, `roaster_story`
     - `roasters.description`, `country`, `logo_url`
   - Tu trzeba zdecydować: albo rozbudować legacy CRUD, albo przepisać `/tag` tak, by zapisywał do canonical model.

Moja rekomendacja:
- nie rozwijać dalej osobnego `/tag` jako osobnej encji biznesowej;
- przepisać go na UI do tworzenia `coffee + batch + qr`.

Kryterium wyjścia:
- roaster z weba potrafi opublikować produkt, który consumer widzi bez brakujących pól.

4. **Domknąć feedback loop consumera**
   - `mobile /coffee/[id]/log` musi wysyłać realnie:
     - `rating`
     - `brew_method_id`
     - `tasting_note_ids`
     - `free_text_notes`
     - opcjonalnie `review`
   - Dziś część API to wspiera, ale UI tego nie używa.
   - Journal i analytics już czekają na te dane.

Kryterium wyjścia:
- pełny flow US1 działa bez “placeholder payload”.

5. **Domknąć analytics roastera**
   - Analytics są dobrym końcem MVP, bo zamykają obieg wartości.
   - Po domknięciu logowania tastingów trzeba tylko dopilnować:
     - świeżości `coffee_stats`
     - filtra po `brew_method_id`
     - anonymized reviews
   - Na tym etapie można dodać minimalny “followers/favorites insight” dla relacji follow consumer -> roaster.

Kryterium wyjścia:
- roaster widzi prawdziwy feedback wynikający z consumer flow, nie tylko agregaty z testów.

6. **Ograniczyć scope discovery do wersji MVP**
   - Discovery nie może blokować domknięcia core loop.
   - Zostawić w MVP:
     - discover coffees
     - discover roasters
     - follow roaster
     - learn articles jako static content
   - Nie rozwijać jeszcze bardziej social/community niż to konieczne.

Kryterium wyjścia:
- US3 działa na seedzie i nie wymaga dalszych decyzji modelowych.

7. **Posprzątać repo fizycznie**
   - Oznaczyć i wygasić:
     - `product/apps/frontend`
     - `unused project files`
     - `old-files`
     - route’y testowe/scaffoldowe typu `test-select-user`, `home`
   - Uporządkować nazewnictwo:
     - jeden kierunek: `roaster-hub`, bez resztek `dashboard`
   - Zostawić w repo tylko aktywne ścieżki produktu i jawne compatibility shims.

Kryterium wyjścia:
- nowy developer widzi jeden aktywny flow, nie trzy historyczne warstwy.

8. **Dopiero potem wejść w Phase 010**
   - Backlog z [14-tasks-003-phase-010-product-ux-ui-backlog.md](/Users/pa/projects/funcup/meta/docs/funcup-src-docs/04-tasks/14-tasks-003-phase-010-product-ux-ui-backlog.md) ma sens dopiero po unifikacji modelu.
   - Inaczej dopolerujesz UX dla repo, które dalej jest niespójne domenowo.

**Najkrótsza wersja kolejności**

1. ADR: canonical model.
2. Jeden kontrakt Coffee Page.
3. Web publikuje pełne dane produktu i batcha.
4. Mobile loguje pełne tastingi.
5. Analytics czyta realne dane.
6. Cleanup repo.
7. UX polish Phase 010.

**Czego bym nie robił teraz**
- nie rozwijał równolegle `roaster_coffee_tags` i `coffees/roast_batches`
- nie zaczynał od kosmetycznego UI
- nie dopisywał nowych funkcji social
- nie utrzymywał placeholderów jako “tymczasowych”, jeśli blokują model danych

**Jedna decyzja wykonawcza, którą polecam wprost**
- `roaster_coffee_tags` przekształcić z encji biznesowej w **projection/read model**
- formularz `/tag` przepisać tak, by zapisywał do canonical model
- publiczny hash i QR generować z `roast_batches/qr_codes`

To jest najprostsza droga do spójnego MVP.

Jeśli chcesz, mogę teraz rozbić to na **konkretny plan wykonawczy w 3 sprintach** albo od razu przygotować **backlog techniczny plik-po-pliku**.
