Plan

Prompt Do Kolejnego Sprintu Codex Agent — Phase 010 Finalization
Summary
Poniżej gotowy prompt do nowego sprintu dla Codex agenta.
Cel sprintu: domknąć pozostały zakres Phase 010: Product UX & UI, przygotować final sign-off checklist dla całej fazy oraz wdrożyć jedną dodatkową zmianę produktową:

w roaster web flow, przy dodawaniu batcha MVP, zastąpić dotychczasowy input Cover image URL dropzonem wzorowanym na /tag (Zdjęcie etykiety / opakowania)
technicznie zapisywać wynik uploadu do canonical coffees.cover_image_url, bez zmiany modelu danych batcha
Ready Prompt
Kontynuujemy pracę na branchu:
`codex-mvp-refactor-handoff-2026-05-06`

Pracujemy dalej w **Phase 010: Product UX & UI**.

Najpierw przeczytaj:

- `meta/docs/handoff/PHASE010_RESTART_HANDOFF_2026-05-06.md`
- `meta/docs/handoff/PHASE010_NEW_CHAT_PROMPT_2026-05-06.md`
- `meta/docs/funcup-src-docs/04-tasks/14-tasks-003-phase-010-product-ux-ui-backlog.md`
- `meta/docs/funcup-src-docs/02-specs/08-entry-ux-spec-fr012.md`
- `meta/docs/Zadanie MVP refactor.md`

Ważne źródła prawdy:

- backlog Phase 010 jest source of truth dla pozostałych tasków
- aktywna rzeczywistość repo nie używa `product/apps/frontend`, mobile `/home`, `test-select-user`
- roaster only on web
- consumer only on mobile
- nie łam FR-012 entry sequence
- nie przywracaj zarchiwizowanych scaffoldów
- nie rozwijaj równoległego drugiego modelu biznesowego obok canonical flow

## Stan wejściowy, który trzeba przyjąć jako aktualny

Za domknięte uznaj:

- `010-001`
- `010-002`
- `010-003`
- `010-004`
- `010-005`
- `010-006`
- `010-019`

Za częściowe uznaj:

- `010-007`
- `010-008`

Pozostałe taski `010-009` do `010-018` oraz `010-020` do `010-038` traktuj jako nadal otwarte, chyba że realna weryfikacja kodu pokaże inaczej.

## Główny cel sprintu

Domknąć **pozostały zakres Phase 010** w kolejności, która minimalizuje drift i nie wprowadza nowych rozjazdów między mobile, web i shared.

Pracuj end-to-end:
analiza -> implementacja -> testy -> runtime verification -> aktualizacja backlogu / sign-off evidence

## Zakres, który został do zamknięcia w Phase 010

### Epic B — foundations

Najpierw uporządkuj fundamenty UX:

- `010-007` Design tokens
- `010-008` Primitives
- `010-009` Patterns
- `010-010` Navigation chrome
- `010-011` Component gallery / preview agreement

Oczekiwany rezultat:

- jeden spójny kierunek tokenów między `product/packages/shared`, mobile i web
- brak dalszego driftu typu legacy theme vs canonical visual system
- prymitywy i wzorce, na których można bezpiecznie oprzeć resztę ekranów Phase 010

### Epic C — US1 consumer journey polish

Następnie domknij:

- `010-012`
- `010-013`
- `010-014`
- `010-015`
- `010-016`
- `010-017`
- `010-018`

Oczekiwany rezultat:

- scan UX z dobrym handlingiem permission/error
- Coffee Page z czytelną hierarchią czterech sekcji
- tasting log z lepszym progressive disclosure i validation
- journal z sensownym UI filtrów
- archived batch banner
- repeat scan UX
- unknown QR UX

### Epic D — US3 discovery polish

Po `010-019` zostały:

- `010-020`
- `010-021`
- `010-022`
- `010-023`

Oczekiwany rezultat:

- discovery cards i sortowanie
- lepszy roaster profile i follow CTA
- dopracowany Learn Coffee reader

### Epic E — roaster web UX

Domknij:

- `010-024`
- `010-025`
- `010-026`
- `010-027`
- `010-028`
- `010-029`

Oczekiwany rezultat:

- spójny auth polish
- lepszy coffee/create/edit UX
- batch create + QR UX
- analytics UX z brew filter i empty state
- uporządkowana nawigacja i responsywność roaster hub

### Epic F — contracts and backend UX

Domknij:

- `010-030`
- `010-031`
- `010-032`
- `010-033`

Oczekiwany rezultat:

- jawna mapa błędów `scan_qr` -> copy w UI
- flags / hints potrzebne do archived batch i repeat scan
- user-safe error handling
- określona i zaimplementowana strategia refreshu analytics

### Epic G — QA and final release readiness

Na końcu domknij:

- `010-034`
- `010-035`
- `010-036`
- `010-037`
- `010-038`

To ma być końcowa paczka sign-offowa dla całej fazy.

## Jedna dodatkowa zmiana produktowa do wdrożenia w tym sprincie

Wprowadź zmianę w **roaster web flow**:

### Zmiana

Przy dodawaniu batcha MVP:
zastąp dotychczasowy sposób podawania obrazu przez **dropzone / file upload** wzorowany na `http://localhost:3000/tag` pod etykietą:

- `Zdjęcie etykiety / opakowania`

### Ważne doprecyzowanie implementacyjne

Ta zmiana ma działać tak:

- UX entry point jest w **batch create flow**
- ale zapis ma trafiać do **canonical `coffees.cover_image_url`**
- nie wprowadzaj nowego pola obrazu do `roast_batches`
- nie zmieniaj schema DB, jeśli nie jest to absolutnie konieczne
- nie buduj nowego równoległego tag-model upload flow
- reuse istniejący mechanizm uploadu z `/tag`, jeśli to sensowne

### Oczekiwane zachowanie

- użytkownik tworzący batch może dodać obraz etykiety / opakowania przez dropzone
- upload korzysta z istniejącej infrastruktury storage/upload
- po sukcesie URL obrazu zapisuje się do canonical coffee record powiązanego z batch creation flow
- consumer/public read model dalej czyta obraz z `coffees.cover_image_url`
- UX ma być spójny z aktualnym `/tag`:
  - ten sam typ komponentu / podobny interaction model
  - te same lub jawnie uzasadnione ograniczenia pliku
  - podobne komunikaty walidacyjne

### Preferowana implementacja

- reuse obecnego upload helpera i walidacji wykorzystywanej przez `/tag`
- jeśli trzeba, wydziel współdzielony webowy komponent dropzone tak, aby służył zarówno `/tag`, jak i roaster canonical flow
- unikaj duplikacji logiki FilePond / walidacji / uploadu

## Definition of Done dla tego sprintu

Sprint uznaj za zakończony dopiero, gdy:

- pozostałe taski Phase 010 są albo:
  - realnie dowiezione,
  - albo jawnie zre-baselinowane jako partial/open z uzasadnieniem w backlogu
- finalny backlog nie kłamie o statusach
- dodatkowa zmiana z dropzonem działa w batch create flow i zapisuje `coffees.cover_image_url`
- testy przechodzą
- aplikacje uruchamiają się lokalnie
- final sign-off evidence dla Phase 010 jest zaktualizowane

## Phase 010 Final Sign-off Checklist

Przy końcu sprintu przygotuj i wypełnij checklistę sign-off dla całej fazy.

Checklist musi potwierdzać:

### 1. Status i traceability

- wszystkie taski `010-001` do `010-038` mają aktualny status
- backlog Phase 010 jest zgodny z realnym stanem repo
- traceability table ma PASS notes / evidence tam, gdzie wymagane

### 2. Entry non-regression

- FR-012 sequence unchanged
- splash runs once per app open
- reduced motion path działa poprawnie
- brak replay splasha przy zwykłej nawigacji

### 3. Mobile UX coverage

- US1 independent test:
  - QR -> Coffee Page -> log -> journal
- US3 independent test:
  - hub -> discover -> roaster -> follow -> learn
- US4 UX audit:
  - no progress bars
  - no unlock toasts
  - subtle Expert label
- US5 UX audit:
  - offline readable
  - pending sync visible
  - reconnect clears sync within expected window

### 4. Web UX coverage

- US2 independent test:
  - login -> coffee -> batch -> QR -> hash resolve
- canonical batch flow działa z nowym dropzonem dla obrazu
- obraz zapisuje się do `coffees.cover_image_url`
- QR download UX jest czytelny
- analytics UX ma sensowny summary, filter, empty state i no-PII review list

### 5. Contracts / backend UX

- `scan_qr` error mapping jest udokumentowany i zużywany przez UI
- archived batch / repeat scan flags są wystawione, jeśli wymagane przez UI
- rate-limit / abuse responses nie przeciekają technicznych detali
- analytics refresh behavior jest jawnie określony i zaimplementowany

### 6. Accessibility and performance

- touched screens mają sprawdzone contrast / labels / focus order
- listy i obrazy nie mają oczywistych regressions performance
- journal / discovery / coffee page mają sensowne loading / empty / error states

### 7. Runtime verification

Uruchom i zweryfikuj lokalnie minimum:

- `pnpm -C product/packages/shared test`
- `pnpm -C product/apps/web test`
- `pnpm -C product/apps/consumer-mobile typecheck`
- właściwe testy Playwright / regresje US2 tam, gdzie mają sens
- `pnpm -C product/apps/web dev --hostname 0.0.0.0 --port 3000` lub alternatywny wolny port
- `pnpm -C product/apps/consumer-mobile start -- --port 8081`

Jeżeli jakieś testy wymagają env / lokalnego Supabase / browser permissions:
- nazwij to wprost
- podaj dokładnie, co było wymagane
- odróżnij blocker środowiskowy od realnego faila produktu

## Aktualizacja dokumentów

Na końcu zaktualizuj tylko to, co naprawdę musi zostać skorygowane:

- backlog Phase 010
- ewentualny final sign-off doc dla Phase 010
- ewentualne spec / handoffy tylko tam, gdzie inaczej zostanie trwały drift

Nie rób zbędnych edycji historycznych dokumentów.

## Twarde ograniczenia

- nie przywracaj `product/apps/frontend`, `/home`, `test-select-user`
- nie rozbudowuj social/community poza MVP
- nie buduj drugiego równoległego modelu obok canonical flow
- nie przenoś ownership obrazu z coffee na batch bez jawnej potrzeby
- nie łam public contract Coffee Page bez testów i migration note

## Oczekiwany output na końcu sprintu

W finalnej odpowiedzi podaj:

1. które taski Phase 010 zostały domknięte,
2. które nadal są partial/open i dlaczego,
3. co dokładnie zmieniło się w batch image flow,
4. jakie testy przeszły,
5. czy Phase 010 ma już pełny sign-off, czy jeszcze nie.
Key Decisions And Assumptions
Przyjąłem wariant: dropzone pojawia się w batch create flow, ale zapis trafia do coffees.cover_image_url.
Nie planuję zmiany schematu roast_batches; obraz pozostaje własnością canonical coffee.
Prompt zakłada, że sprint ma prowadzić do możliwie pełnego domknięcia Phase 010, ale dopuszcza jawne oznaczenie pozostałych luk jako partial/open, jeśli wyjdą realne blokery techniczne.
Final sign-off dla Phase 010 oznacza nie tylko implementację, ale też aktualizację backlogu, evidence i regresji US1–US6.
Test Plan
W samym sprincie implementer powinien uruchomić minimum:
pnpm -C product/packages/shared test
pnpm -C product/apps/web test
pnpm -C product/apps/consumer-mobile typecheck
Playwright / US2 regression dla web
local runtime boot web + mobile
Dodatkowo powinien jawnie potwierdzić działanie nowego image flow:
upload przez dropzone
zapis URL do coffees.cover_image_url
odczyt obrazu przez public coffee page / consumer flow
