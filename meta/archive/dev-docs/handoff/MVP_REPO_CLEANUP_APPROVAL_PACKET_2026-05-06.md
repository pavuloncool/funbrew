# MVP Repo Cleanup — Approval Packet (2026-05-06)

Pierwszy pakiet wejściowy do paczki:

- **Posprzątać repo fizycznie**

Zgodnie z:

- [Zadanie MVP refactor.md](/Users/pa/projects/funcup/meta/docs/Zadanie%20MVP%20refactor.md)
- [Plan higieny repo po audycie MVP.md](/Users/pa/projects/funcup/meta/docs/Plan%20higieny%20repo%20po%20audycie%20MVP.md)

Poniżej są grupy przygotowane do osobnego approvalu. Na tym etapie nie wykonano jeszcze przenosin do `meta/archive/` ani usunięć.

## Status

- `2026-05-06`: **Group A** i **Group B** dostały approval i zostały wykonane.
- Generated leftovers z legacy `product/apps/frontend`:
  - `node_modules/`
  - `dist/`
  - `.turbo/`
  nie zostały zachowane w archiwum.

## Group A — `product/apps/frontend`

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

- nadal jest w workspace `product/apps/*`
- nadal ma własne `package.json`, `src/`, `dist/`, `.storybook/`
- pełni rolę historycznego źródła dla części rozwiązań przeniesionych potem do:
  - `product/apps/web`
  - `product/apps/consumer-mobile`

### Dlaczego nie powinno zostać w active

- aktywny web produktu działa w `product/apps/web`
- aktywna aplikacja consumer działa w `product/apps/consumer-mobile`
- `product/apps/frontend` wygląda jak trzecia równorzędna aplikacja produktu, co zaciera aktywny flow MVP

### Aktywny odpowiednik

- web entry / splash:
  - `product/apps/web/components/AnimatedSplash.tsx`
  - `product/apps/web/components/AppOpenGate.tsx`
- mobile entry:
  - `product/apps/consumer-mobile/app/index.tsx`
  - `product/apps/consumer-mobile/src/components/entry/MobileEntrySplash.tsx`
- aktywne Coffee / QR / Hub flow:
  - `product/apps/web/app/*`
  - `product/apps/consumer-mobile/app/*`

### Proponowana decyzja

- przenieść `product/apps/frontend/` do `meta/archive/product/apps/frontend/`

### Uwaga operacyjna

- po przeniesieniu zniknie z `pnpm-workspace.yaml` scope `product/apps/*`, więc przestanie udawać aktywną aplikację
- w dokumentach historycznych zostaną ślady odniesień do `product/apps/frontend`; to jest akceptowalne dla archiwum

## Group B — mobile scaffold routes

### Status

- `approved`
- `executed`

### Pliki

- `product/apps/consumer-mobile/app/home.tsx`
- `product/apps/consumer-mobile/app/test-select-user.tsx`

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
  - `product/apps/consumer-mobile/app/index.tsx`
  - `product/apps/consumer-mobile/src/components/entry/MobileEntrySplash.tsx`
- auth gate:
  - `product/apps/consumer-mobile/app/(auth)/login.tsx`
  - `product/apps/consumer-mobile/app/(auth)/login-form.tsx`
- consumer hub:
  - `product/apps/consumer-mobile/app/(tabs)/hub/index.tsx`

### Proponowana decyzja

- przenieść oba pliki do archiwum albo usunąć z repo po approvalu:
  - preferencja: `meta/archive/product/apps/consumer-mobile/routes/`

### Ryzyko

- manualne otwieranie `/home` lub `/test-select-user` po cleanupie przestanie działać
- nie powinno to wpływać na aktywne flow, bo runtime references zostały już odpięte

## Kolejne kandydatury do następnych grup

- `old-files/`
- `unused project files/`
- `.cursor/plans/*`
- `meta/docs/Stage UI prompts/*`

Te grupy nie są jeszcze rozpisane w pełnej nocie approval w tym pakiecie.
