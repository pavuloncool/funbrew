# MVP Repo Cleanup — Approval Packet 3 (2026-05-06)

Trzeci pakiet wejściowy do paczki:

- **Posprzątać repo fizycznie**

Zgodnie z:

- [Zadanie MVP refactor.md](/Users/pa/projects/funcup/meta/docs/Zadanie%20MVP%20refactor.md)
- [Plan higieny repo po audycie MVP.md](/Users/pa/projects/funcup/meta/docs/Plan%20higieny%20repo%20po%20audycie%20MVP.md)
- [MVP_REFACTOR_HANDOFF_2026-05-06.md](/Users/pa/projects/funcup/meta/docs/handoff/MVP_REFACTOR_HANDOFF_2026-05-06.md)

Poniżej są kolejne grupy przygotowane do osobnego approvalu. Ten packet dostał approval i został wykonany tego samego dnia.

## Status

- `2026-05-06`: **Group E** i **Group F** dostały approval i zostały wykonane.

## Group E — `.cursor/plans/*`

### Status

- `approved`
- `executed`

### Pliki

- `.cursor/plans/Czym jest aplikacja funcup.md`
- `.cursor/plans/Profil danych dla palarni - plan wdrozenia.md`
- `.cursor/plans/Profil danych dla palarni.md`
- `.cursor/plans/coffee_bank_strona_6e2da49b.plan.md`
- `.cursor/plans/prompt-consumer_complete_profile.md`
- `.cursor/plans/prompt-ekran-hub.md`
- `.cursor/plans/prompt-styles_refactor.md`
- `.cursor/plans/self-hosted_qr_tag_flow_842b819d.plan.md`
- `.cursor/plans/stan_funcup_+_consumer_scan_fd71f752.plan.md`
- `.cursor/plans/styles-refactor-light.md`

### Co to jest

Workspace-local plany i prompty robocze dla sesji Cursor / Codex.

Ta grupa miesza kilka typów artefaktów:

- szkice architektury i opisu produktu
- jednorazowe task specy dla agenta
- checklisty wdrożeniowe `.plan.md`
- prompty UX / UI i refaktoryzacyjne

### Co robi dziś

- przechowuje historyczny kontekst tego, jak konkretne zadania były delegowane agentowi
- częściowo opisuje rzeczy już wdrożone:
  - `coffee_bank_strona_6e2da49b.plan.md`
  - `self-hosted_qr_tag_flow_842b819d.plan.md`
- częściowo opisuje starsze lub robocze kierunki, które nie są aktualnym source of truth:
  - `stan_funcup_+_consumer_scan_fd71f752.plan.md`
  - `prompt-consumer_complete_profile.md`
  - `prompt-ekran-hub.md`
  - `styles-refactor-light.md`
- nie jest używane przez runtime produktu i nie ma aktywnych referencji w kodzie poza dokumentami cleanupu

### Dlaczego nie powinno zostać w active

- `.cursor/` jest narzędziowo-specyficznym katalogiem roboczym, nie miejscem na repo-wide source of truth
- pliki mieszają rzeczy wykonane, porzucone i tylko brainstormingowe, więc zaciemniają bieżący stan produktu
- część z nich dubluje lub poprzedza aktualniejsze dokumenty w `meta/docs/handoff`, audit i ADR-y

### Aktywny odpowiednik

- bieżący kierunek MVP i cleanup:
  - `meta/docs/Zadanie MVP refactor.md`
  - `meta/docs/funcup-web-mobile-data-flow-audit.md`
  - `meta/docs/handoff/MVP_REFACTOR_HANDOFF_2026-05-06.md`
- decyzje modelowe:
  - `meta/docs/specs/002-qr-coffee-platform/adrs/012-canonical-product-model.md`
- aktywna implementacja flow:
  - `product/apps/web/app/*`
  - `product/apps/consumer-mobile/app/*`
  - `product/packages/shared/*`
  - `product/supabase/*`

Dla części promptów nie ma potrzeby utrzymywać aktywnego odpowiednika dokumentowego:

- są to instrukcje jednorazowe dla agenta, nie trwały backlog ani spec produktu

### Proponowana decyzja

- przenieść cały katalog `.cursor/plans/` do:
  - `meta/archive/prompts/cursor-plans/`
- zachować nazwy plików i ich obecny układ 1:1, bez próby redagowania treści

### Ryzyko / uwagi

- jeśli ktoś używa tych plików jako szybkich promptów startowych dla kolejnych sesji, po cleanupie nie będą już pod `.cursor/plans`
- to ryzyko jest akceptowalne, bo nadal pozostaną w repo pod `meta/archive/prompts/`, ale przestaną udawać aktywną warstwę dokumentacji

### Wykonano

- `.cursor/plans/*` -> `meta/archive/prompts/cursor-plans/*`
- pusty katalog `.cursor/plans/` został usunięty

## Group F — `meta/docs/Stage UI prompts/*`

### Status

- `approved`
- `executed`

### Pliki

- `meta/docs/Stage UI prompts/QR GENERATE ROASTER – CAL AND UPLOAD.md`
- `meta/docs/Stage UI prompts/create-roaster-hub.md`
- `meta/docs/Stage UI prompts/create-roaster-profile-page.md`
- `meta/docs/Stage UI prompts/qr gen prompt 2.md`
- `meta/docs/Stage UI prompts/qr-code-roaster-coffee-tag-calendar.md`
- `meta/docs/Stage UI prompts/qr-code-roaster-session.md`
- `meta/docs/Stage UI prompts/qr-generate-roaster.md`
- `meta/docs/Stage UI prompts/qr-scan-consumer.md`

### Co to jest

Stary zbiór promptów etapowych dla budowy webowego flow roastera i QR bridge do consumer app.

To są głównie:

- prompty implementacyjne pod agenta
- decyzje przejściowe sprzed obecnego refactoru
- rozbite etapy tego samego tematu:
  - tworzenie `tag`
  - generacja QR
  - `roaster-hub`
  - `roaster-profile`
  - consumer scan

### Co robi dziś

- zachowuje historyczny zapis tego, jak powstawały wcześniejsze etapy produktu
- częściowo opisuje rzeczy już wdrożone w aktywnym drzewie:
  - `create-roaster-hub.md`
  - `create-roaster-profile-page.md`
  - `qr gen prompt 2.md`
  - `qr-scan-consumer.md`
- częściowo opisuje dawne założenia, które zostały już zawężone lub zastąpione przez refactor MVP:
  - `qr-generate-roaster.md`
  - `qr-code-roaster-session.md`
  - `QR GENERATE ROASTER – CAL AND UPLOAD.md`

### Dlaczego nie powinno zostać w active

- `meta/docs/Stage UI prompts/` wygląda jak aktywna dokumentacja produktu, ale w praktyce jest kolekcją starych promptów operatorskich
- część promptów zakłada dawne route'y, stare nazwy ekranów albo wcześniejsze etapy modelu danych
- utrzymywanie ich w `dev-docs` obok handoffów, ADR-ów i audytu myli to, co jest source of truth, z tym, co było tylko roboczym briefingiem

### Aktywny odpowiednik

- aktualny stan produktu jest już opisany przez:
  - `meta/docs/handoff/MVP_REFACTOR_HANDOFF_2026-05-06.md`
  - `meta/docs/funcup-web-mobile-data-flow-audit.md`
  - `meta/docs/Zadanie MVP refactor.md`
  - `meta/docs/specs/002-qr-coffee-platform/adrs/012-canonical-product-model.md`
- aktywna implementacja tych flow jest w:
  - `product/apps/web/app/tag/page.tsx`
  - `product/apps/web/app/roaster-hub/*`
  - `product/apps/web/app/roaster-profile/page.tsx`
  - `product/apps/web/app/api/qr/route.ts`
  - `product/apps/consumer-mobile/app/q/[hash].tsx`
  - `product/packages/shared/src/hooks/useCoffeePage.ts`
  - `product/supabase/functions/scan_qr/index.ts`

### Proponowana decyzja

- przenieść cały katalog `meta/docs/Stage UI prompts/` do:
  - `meta/archive/prompts/stage-ui/`
- zachować wszystkie pliki jako historyczne reference prompts

### Ryzyko / uwagi

- stare linki lub rozmowy odwołujące się do `meta/docs/Stage UI prompts/*` przestaną wskazywać aktywne miejsce
- nie wpływa to na runtime ani source of truth, bo te pliki nie pełnią już roli bieżącej dokumentacji wykonawczej

### Wykonano

- `meta/docs/Stage UI prompts/*` -> `meta/archive/prompts/stage-ui/*`
- pusty katalog `meta/docs/Stage UI prompts/` został usunięty
