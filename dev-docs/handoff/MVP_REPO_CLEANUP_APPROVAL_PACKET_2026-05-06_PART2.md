# MVP Repo Cleanup — Approval Packet 2 (2026-05-06)

Drugi pakiet wejściowy do paczki:

- **Posprzątać repo fizycznie**

Zgodnie z:

- [Zadanie MVP refactor.md](/Users/pa/projects/funcup/dev-docs/Zadanie%20MVP%20refactor.md)
- [Plan higieny repo po audycie MVP.md](/Users/pa/projects/funcup/dev-docs/Plan%20higieny%20repo%20po%20audycie%20MVP.md)
- [MVP_REPO_CLEANUP_APPROVAL_PACKET_2026-05-06.md](/Users/pa/projects/funcup/dev-docs/handoff/MVP_REPO_CLEANUP_APPROVAL_PACKET_2026-05-06.md)

Poniżej są kolejne grupy przygotowane do osobnego approvalu. Ten packet dostał approval i został wykonany tego samego dnia.

## Status

- `2026-05-06`: **Group C** i **Group D** dostały approval i zostały wykonane.

## Group C — `old-files/`

### Status

- `approved`
- `executed`

### Pliki

- `old-files/README.md`
- `old-files/apps/consumer-mobile/src/features/profile/preferences/flavorNotes.ts`

### Co to jest

Ręcznie wydzielony mini-zbiór plików po migracji mobile preferences z `public.flavor_notes` na `public.tasting_notes`.

### Co robi dziś

- trzyma historyczną notę migracyjną w `old-files/README.md`
- trzyma jeden wycofany helper mobile:
  - `flavorNotes.ts`
- nie jest aktywną częścią runtime ani jedynym źródłem wiedzy o kompatybilności

### Dlaczego nie powinno zostać w active

- `old-files/` jest ad hoc top-level katalogiem, który udaje osobną strefę repo poza ustalonym `archive/`
- dokładnie taki typ rozproszonego składowania ma zostać zastąpiony przez jawne archiwum
- nowy developer nie ma powodu odróżniać `old-files/` od innych potencjalnie aktywnych katalogów bez czytania dodatkowego README

### Aktywny odpowiednik

- aktywny loader preferencji mobile:
  - `apps/consumer-mobile/src/features/profile/preferences/tastingNotes.ts`
- ten aktywny loader ma już fallback kompatybilności do `flavor_notes`, więc archiwizacja starego helpera nie usuwa żadnego aktywnego mostka runtime

### Proponowana decyzja

- przenieść notę migracyjną do:
  - `archive/dev-docs/old-files/README.md`
- przenieść legacy helper do:
  - `archive/apps/consumer-mobile/src/features/profile/preferences/flavorNotes.ts`
- usunąć pusty top-level `old-files/` po przenosinach

### Ryzyko / uwagi

- zmieni się tylko fizyczne położenie historycznej referencji
- jeśli ktoś używał `old-files/` jako nieformalnego parkingu na kolejne pliki, po tym cleanupie nie powinien już tego robić; właściwym miejscem staje się `archive/`

### Wykonano

- `old-files/README.md` -> `archive/dev-docs/old-files/README.md`
- `old-files/apps/consumer-mobile/src/features/profile/preferences/flavorNotes.ts` -> `archive/apps/consumer-mobile/src/features/profile/preferences/flavorNotes.ts`
- pusty top-level `old-files/` został usunięty

## Group D — `unused project files/`

### Status

- `approved`
- `executed`

### Pliki

- `unused project files/apps/web/app/(tabs)/layout.tsx`
- `unused project files/apps/web/app/dashboard-archived/analytics/[batchId]/page.tsx`
- `unused project files/apps/web/app/dashboard-archived/coffees/[id]/batches/[batchId]/page.tsx`
- `unused project files/apps/web/app/dashboard-archived/coffees/[id]/batches/new/page.tsx`
- `unused project files/apps/web/app/dashboard-archived/coffees/[id]/page.tsx`
- `unused project files/apps/web/app/dashboard-archived/coffees/new/page.tsx`
- `unused project files/apps/web/app/dashboard-archived/coffees/page.tsx`
- `unused project files/apps/web/app/dashboard-archived/roaster/setup/page.tsx`
- `unused project files/apps/web/app/home/page.tsx`
- `unused project files/apps/web/app/hub/page.tsx`
- `unused project files/apps/web/app/profile/page.tsx`

### Co to jest

Drugi ręcznie wydzielony top-level stash z legacy route files dla weba:

- stary kierunek `dashboard/*`
- historyczny tabs wrapper
- placeholderowe strony `home`, `hub`, `profile`

### Co robi dziś

- przechowuje stare wersje route'ów poza aktywnym drzewem `apps/web/app`
- zachowuje historyczne nazewnictwo `dashboard`, mimo że aktywny produkt przeszedł już na `roaster-hub`
- nie bierze udziału w buildzie aktywnego `apps/web`, ale pozostaje mylącym source tree obok aktualnych route'ów

### Dlaczego nie powinno zostać w active

- `unused project files/` to kolejny rozproszony top-level magazyn poza `archive/`
- utrwala równoległe słownictwo `dashboard` vs `roaster-hub`, mimo że cleanup ma zostawić jeden kierunek nazewnictwa
- zawiera placeholdery i dawne ekrany wejścia, które nie są już aktywnym flow MVP

### Aktywny odpowiednik

- aktywne wejście web:
  - `apps/web/app/page.tsx`
  - `apps/web/components/AppOpenGate.tsx`
  - `apps/web/components/AnimatedSplash.tsx`
- aktywny roaster flow:
  - `apps/web/app/roaster-hub/page.tsx`
  - `apps/web/app/roaster-hub/setup/page.tsx`
  - `apps/web/app/roaster-hub/coffees/new/page.tsx`
  - `apps/web/app/roaster-hub/coffees/[id]/page.tsx`
  - `apps/web/app/roaster-hub/coffees/[id]/batches/new/page.tsx`
  - `apps/web/app/roaster-hub/coffees/[id]/batches/[batchId]/page.tsx`
  - `apps/web/app/roaster-hub/analytics/[batchId]/page.tsx`
- aktywny profil roastera:
  - `apps/web/app/roaster-profile/page.tsx`

### Proponowana decyzja

- przenieść cały katalog `unused project files/apps/web/` do archiwum
- preferowany cel:
  - `archive/apps/web/legacy-routes/`
- przy przenosinach zachować wewnętrzną strukturę dawnych route'ów, żeby było jasne co było tabs wrapperem, co było `dashboard-archived`, a co placeholderem

### Ryzyko / uwagi

- ewentualne stare notatki lub linki opisujące ścieżki `/dashboard/*`, `/hub`, `/profile` pozostaną tylko referencją historyczną
- nie powinno to wpływać na runtime, bo aktywne `apps/web` używa już `roaster-hub` i root `app/page.tsx`

### Wykonano

- `unused project files/apps/web/app/*` -> `archive/apps/web/legacy-routes/app/*`
- pusty top-level `unused project files/` został usunięty
