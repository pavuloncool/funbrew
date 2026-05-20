# Plan higieny repo po audycie MVP

## Podsumowanie
Tak, można i warto to zrobić w sposób kontrolowany.

Rekomendowany model to **hybryda**:
- **aktywny produkt** rozwijamy w normalnym drzewie repo
- **wygaszane pliki** przenosimy do jawnego archiwum w repo
- **Git/GitHub branch history** zostaje tylko historią, nie głównym sposobem odnajdywania starych plików

Dla promptów, duplikatów dokumentów i legacy flow stosujemy dokładnie tę samą zasadę, ale:
- **każda grupa zmian wymaga Twojego zatwierdzenia**
- przed zmianą dostajesz krótkie streszczenie:
  - co dany plik robi dziś
  - dlaczego jest wygaszany
  - gdzie jest jego aktywny odpowiednik albo dlaczego odpowiednik nie jest już potrzebny

## Zmiany organizacyjne
### 1. Rozdzielić repo na trzy strefy
- **Active**: jedyne miejsce, gdzie rozwija się bieżąca wersja MVP i post-audit refactor.
- **Archive**: jawne katalogi dla wygaszonych plików, które nadal chcemy mieć pod ręką bez grzebania w historii Git.
- **History-only**: rzeczy, których nie warto trzymać w drzewie repo, bo wystarczy commit history.

### 2. Ustalić regułę: branch nie zastępuje archiwum
- Branch służy do pracy i historii zmian.
- Nie używamy branchy jako “szuflady” na stare wersje aplikacji.
- Jeśli coś ma być czytelne po miesiącu bez `git log`, trafia do `meta/archive/` w repo.

### 3. Wprowadzić jedno jawne archiwum
Rekomendowany docelowy układ:
- `meta/archive/apps/...`
- `meta/archive/dev-docs/...`
- `meta/archive/prompts/...`
- `meta/archive/assets/...`

To zastępuje rozproszone miejsca typu:
- `old-files/`
- `unused project files/`
- część `.cursor/plans/`
- powielone “Stage UI prompts” lub legacy szkice w `dev-docs`

### 4. Dodać status plików
Każda grupa plików przed przeniesieniem dostaje status:
- `active`
- `legacy-compatible`
- `archive`
- `delete-after-approval`

To ma być decyzja operacyjna, nie domysł implementera.

## Etapy porządkowania
### Etap A — polityka archiwizacji
- Spisać krótki dokument zasad:
  - co wolno archiwizować
  - co wolno usuwać całkowicie
  - kiedy branch history wystarcza
  - jak wygląda approval
- Zdefiniować listę katalogów archiwum i ich przeznaczenie.

### Etap B — inwentaryzacja kandydatów
Przygotować pierwsze paczki do zatwierdzenia:
- legacy app files:
  - `old-files/`
  - `unused project files/`
  - scaffolding typu `product/apps/frontend`, jeśli nie jest już aktywny
- stare prompty:
  - `.cursor/plans/*`
  - `meta/docs/Stage UI prompts/*`
- duplikaty dokumentów:
  - równoległe wersje vision/spec/qr docs
  - dokumenty, których aktywny odpowiednik jest już w `funcup-src-docs` albo w nowym audycie

Każda paczka powinna mieć:
- listę plików
- rolę historyczną
- aktualny odpowiednik albo informację “brak odpowiednika, bo flow wygaszone”

### Etap C — porządkowanie aplikacji
- Najpierw oddzielić **aktywną linię MVP/post-audit** od legacy plików aplikacyjnych.
- Nie robić tego nowym top-level branchem zamiast struktury katalogów.
- Jeśli jakaś część aplikacji jest jeszcze referencją techniczną, oznaczyć ją jako `legacy-compatible` i zostawić poza archiwum tylko czasowo.

Priorytet:
- aktywny web roaster flow
- aktywny mobile consumer flow
- public coffee flow
- legacy CRUD/tag forks dopiero potem

### Etap D — porządkowanie dokumentacji i promptów
- Prompty i szkice projektowe archiwizować tak samo jak kod.
- Zostawić w aktywnym drzewie tylko dokumenty będące source of truth:
  - bieżąca spec
  - backlog
  - ADR-y
  - audit
  - aktualne handoffy, jeśli naprawdę są używane
- Resztę:
  - do `meta/archive/dev-docs`
  - lub usunąć całkowicie, jeśli są czysto robocze i bez wartości referencyjnej

## Reguła approval
Każda grupa zmian idzie do zatwierdzenia osobno.

Dla każdej grupy przygotować krótką notę:
- **Co to jest**
- **Co robi dziś w wygaszanej wersji repo**
- **Dlaczego nie powinno zostać w aktywnej strefie**
- **Dokąd trafi**
- **Czy jest aktywny odpowiednik**

Dopiero po Twoim zatwierdzeniu:
- przeniesienie do `meta/archive/`
- albo usunięcie z repo

## Test plan i kryteria akceptacji
- Po każdym pakiecie archiwizacji aktywne ścieżki w repo nadal są jednoznaczne:
  - wiadomo, gdzie jest aktywny web
  - wiadomo, gdzie jest aktywny mobile
  - wiadomo, które docs są source of truth
- Nie może zostać sytuacja, w której ten sam flow ma 2–3 równorzędne miejsca w repo bez jawnego oznaczenia.
- Każdy przeniesiony plik musi być:
  - albo w `meta/archive/`
  - albo całkowicie usunięty za zgodą
  - nigdy “porzucony” w losowym katalogu
- README lub krótki indeks repo powinien finalnie wskazywać:
  - aktywne aplikacje
  - aktywne docs
  - miejsce archiwum

## Założenia
- `meta/archive/` jest preferowanym celem dla rzeczy historycznie istotnych.
- Branch history nie jest wystarczającym interfejsem do codziennej higieny repo.
- Prompty, szkice i duplikaty dokumentów traktujemy tak samo jak legacy code.
- Approval następuje **per grupa zmian**, z krótkim uzasadnieniem każdej grupy.
