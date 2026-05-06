# MVP Repo Cleanup — Approval Packet (2026-05-06)

Pierwszy pakiet wejściowy do paczki:

- **Posprzątać repo fizycznie**

Zgodnie z:

- [Zadanie MVP refactor.md](/Users/pa/projects/funcup/dev-docs/Zadanie%20MVP%20refactor.md)
- [Plan higieny repo po audycie MVP.md](/Users/pa/projects/funcup/dev-docs/Plan%20higieny%20repo%20po%20audycie%20MVP.md)

Poniżej są grupy przygotowane do osobnego approvalu. Na tym etapie nie wykonano jeszcze przenosin do `archive/` ani usunięć.

## Status

- `2026-05-06`: **Group A** i **Group B** dostały approval i zostały wykonane.
- Generated leftovers z legacy `apps/frontend`:
  - `node_modules/`
  - `dist/`
  - `.turbo/`
  nie zostały zachowane w archiwum.

## Group A — `apps/frontend`

### Status

- `approved`
- `executed`

### Co to jest

Legacy Vite/React app z własnym routingiem, Storybookiem i historycznymi stronami:

- `HomePage`
- `ScanPage`
- `HubPage`
- `CoffeePage`
- `ProfilePage`

### Co robi dziś

- nadal jest w workspace `apps/*`
- nadal ma własne `package.json`, `src/`, `dist/`, `.storybook/`
- pełni rolę historycznego źródła dla części rozwiązań przeniesionych potem do:
  - `apps/web`
  - `apps/consumer-mobile`

### Dlaczego nie powinno zostać w active

- aktywny web produktu działa w `apps/web`
- aktywna aplikacja consumer działa w `apps/consumer-mobile`
- `apps/frontend` wygląda jak trzecia równorzędna aplikacja produktu, co zaciera aktywny flow MVP

### Aktywny odpowiednik

- web entry / splash:
  - `apps/web/components/AnimatedSplash.tsx`
  - `apps/web/components/AppOpenGate.tsx`
- mobile entry:
  - `apps/consumer-mobile/app/index.tsx`
  - `apps/consumer-mobile/src/components/entry/MobileEntrySplash.tsx`
- aktywne Coffee / QR / Hub flow:
  - `apps/web/app/*`
  - `apps/consumer-mobile/app/*`

### Proponowana decyzja

- przenieść `apps/frontend/` do `archive/apps/frontend/`

### Uwaga operacyjna

- po przeniesieniu zniknie z `pnpm-workspace.yaml` scope `apps/*`, więc przestanie udawać aktywną aplikację
- w dokumentach historycznych zostaną ślady odniesień do `apps/frontend`; to jest akceptowalne dla archiwum

## Group B — mobile scaffold routes

### Status

- `approved`
- `executed`

### Pliki

- `apps/consumer-mobile/app/home.tsx`
- `apps/consumer-mobile/app/test-select-user.tsx`

### Co to jest

Legacy / mock routes z wcześniejszych etapów budowy shella mobile.

### Co robiły dziś

- `home.tsx` było scaffoldowym ekranem startowym z ręcznymi linkami do auth / scan / journal / profile
- `test-select-user.tsx` było mock ekranem wyboru ścieżki `Roaster / Consumer`

### Co zostało już odpięte

W ramach przygotowania do cleanupu usunięto aktywne referencje runtime:

- brak hash w `app/q/[hash].tsx` nie prowadzi już do `/home`, tylko do `/(tabs)/hub`
- root stack w `app/_layout.tsx` nie rejestruje już `home` ani `test-select-user`

### Dlaczego nie powinny zostać w active

- nie należą do aktualnego produktu MVP
- dublują wejście i wprowadzają fałszywe ścieżki systemowe
- `test-select-user` jest wprost mockiem

### Aktywny odpowiednik

- wejście aplikacji:
  - `apps/consumer-mobile/app/index.tsx`
  - `apps/consumer-mobile/src/components/entry/MobileEntrySplash.tsx`
- auth gate:
  - `apps/consumer-mobile/app/(auth)/login.tsx`
  - `apps/consumer-mobile/app/(auth)/login-form.tsx`
- consumer hub:
  - `apps/consumer-mobile/app/(tabs)/hub/index.tsx`

### Proponowana decyzja

- przenieść oba pliki do archiwum albo usunąć z repo po approvalu:
  - preferencja: `archive/apps/consumer-mobile/routes/`

### Ryzyko

- manualne otwieranie `/home` lub `/test-select-user` po cleanupie przestanie działać
- nie powinno to wpływać na aktywne flow, bo runtime references zostały już odpięte

## Kolejne kandydatury do następnych grup

- `old-files/`
- `unused project files/`
- `.cursor/plans/*`
- `dev-docs/Stage UI prompts/*`

Te grupy nie są jeszcze rozpisane w pełnej nocie approval w tym pakiecie.
