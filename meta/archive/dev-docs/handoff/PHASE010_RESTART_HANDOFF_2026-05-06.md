# Phase 010 Restart Handoff — 2026-05-06

Start wejścia w **Phase 010: Product UX & UI** po domknięciu post-audit MVP refactor.

Backlog referencyjny:
- [14-tasks-003-phase-010-product-ux-ui-backlog.md](/Users/pa/projects/funcup/meta/docs/funcup-src-docs/04-tasks/14-tasks-003-phase-010-product-ux-ui-backlog.md)

Główne źródła prawdy do czytania przed pracą:
- [Zadanie MVP refactor.md](/Users/pa/projects/funcup/meta/docs/Zadanie%20MVP%20refactor.md)
- [MVP_REFACTOR_HANDOFF_2026-05-06.md](/Users/pa/projects/funcup/meta/docs/handoff/MVP_REFACTOR_HANDOFF_2026-05-06.md)
- [012-canonical-product-model.md](/Users/pa/projects/funcup/meta/docs/specs/002-qr-coffee-platform/adrs/012-canonical-product-model.md)
- [08-entry-ux-spec-fr012.md](/Users/pa/projects/funcup/meta/docs/funcup-src-docs/02-specs/08-entry-ux-spec-fr012.md)

## 1) Decyzja wejścia

**Tak: założenie z `Zadanie MVP refactor.md` jest już aktualne i można wejść w Phase 010.**

Powód:

1. canonical model został domknięty decyzyjnie i implementacyjnie
2. publiczny kontrakt Coffee Page jest ujednolicony
3. web publikuje canonical dane produktu i batcha
4. mobile loguje realny tasting payload
5. analytics czytają realne dane z canonical flow
6. discovery zostało zawężone do wersji MVP
7. repo cleanup został wykonany i aktywne ścieżki produktu są już jednoznaczne

To zamyka warunek z `Zadanie MVP refactor.md`:

- najpierw redukcja i unifikacja
- dopiero potem UX polish z backlogu Phase 010

## 2) Co jest gotowe przed Phase 010

### Canonical flow

- canonical source of truth:
  - `roasters -> coffees -> roast_batches -> qr_codes -> coffee_logs -> coffee_stats`
- publiczny read model:
  - `product/packages/shared/src/coffeePage/normalizeCoffeePage.ts`
- web QR page:
  - `product/apps/web/app/q/[hash]/page.tsx`
- mobile Coffee Page:
  - `product/apps/consumer-mobile/app/coffee/[id]/index.tsx`

### Producer + consumer loop

- web roaster publikuje canonical batch z publicznym QR
- mobile skanuje canonical QR
- mobile wysyła realne logi tastingu
- analytics czytają feedback z canonical danych

### Discovery MVP

- mobile `Discover` ograniczony do:
  - `Coffees`
  - `Roasters`
- `Learn Coffee` jest statyczne
- `Follow roaster` działa

### Repo hygiene

Do archiwum zostały już przeniesione:

- `product/apps/frontend`
- `old-files`
- `unused project files`
- `.cursor/plans`
- `meta/docs/Stage UI prompts`
- scaffold/mobile mock routes typu `home`, `test-select-user`

## 3) Najważniejszy drift w dokumentach Phase 010

**Backlog Phase 010 nie jest w 100% aktualny jako zapis stanu wykonania.**

Najważniejsze rozjazdy:

- `product/apps/frontend` nie jest już aktywną aplikacją:
  - jest w `meta/archive/product/apps/frontend`
- mobile entry nie idzie już do `/home`
  - aktywne wejście:
    - `product/apps/consumer-mobile/app/index.tsx`
    - `product/apps/consumer-mobile/src/components/entry/MobileEntrySplash.tsx`
  - po splashu:
    - `router.replace('/(auth)/login')`
  - dalszy dispatch robi auth flow:
    - `/(auth)/login-form`
    - `/(auth)/complete-profile`
    - `/(tabs)/hub`
- web entry jest aktywne przez:
  - `product/apps/web/app/layout.tsx`
  - `product/apps/web/components/AppOpenGate.tsx`
  - `product/apps/web/app/page.tsx`
- starszy [PHASE010_HANDOFF.md](/Users/pa/projects/funcup/meta/docs/handoff/PHASE010_HANDOFF.md) jest historyczny i zawiera nieaktualne odniesienia do:
  - `product/apps/frontend`
  - mobile `/home`
  - dawnej kolejności tasków

Wniosek operacyjny:

- backlog `14-tasks-003-phase-010-product-ux-ui-backlog.md` traktować jako **listę zadań i intencji UX**
- nie traktować go jako w pełni wiarygodnego status boardu bez re-baseline względem kodu

## 4) Rekomendowany start w nowym czacie

### Krok 1 — re-baseline Phase 010

Najpierw sprawdzić i skorygować względem aktualnego repo:

- `010-002`
- `010-003`
- `010-004`
- `010-005`
- `010-006`
- `010-007`
- `010-008`

Cel:

- odróżnić:
  - co jest naprawdę zrobione,
  - co jest częściowo zrobione,
  - co nadal blokuje wejście w właściwe paczki UX/UI.

### Krok 2 — dopiero potem wejść w pierwszą paczkę implementacyjną

Rekomendacja:

- jeśli Epic A (`010-004` do `010-006`) nie jest domknięty, dokończyć najpierw Epic A
- jeśli Epic A jest efektywnie domknięty po re-baseline, wejść w pierwszy widoczny slice produktowy:
  - preferencja: `010-019` Mobile Hub layout

Powód:

- discovery MVP jest już funkcjonalnie zamknięte
- `Hub` to dobry pierwszy ekran Phase 010 do realnego polishu UX bez wracania do sporów modelowych

## 5) Twarde zasady dla nowego wejścia

- Nie ruszać FR-012 bez jawnego respektowania:
  - [08-entry-ux-spec-fr012.md](/Users/pa/projects/funcup/meta/docs/funcup-src-docs/02-specs/08-entry-ux-spec-fr012.md)
- Nie przywracać `product/apps/frontend`, `home`, `test-select-user` ani innych zarchiwizowanych scaffoldów.
- Nie rozwijać równolegle starego `roaster_coffee_tags` jako drugiego modelu biznesowego.
- Nie rozszerzać discovery o nowe social/community scope.
- Zachować rozdział:
  - roaster only on web
  - consumer only on mobile

## 6) Ryzyka i uwagi operacyjne

- Lokalny flow consumer (scan + tasting log + rated coffees) wymaga działających funkcji:
  - `scan_qr`
  - `log_tasting` (lub potwierdzony alias `coffee/log-tasting`)
  - `update_coffee_stats`
- Lokalne loginy seedowe po `supabase db reset`:
  - `bart@ex.com / swetry`
  - `kazik@neoneon.online / swetry`
- Legacy batch manager nadal jest tag-first management surface i nie powinien wyznaczać kierunku dla nowych prac Phase 010.

## 7) Minimalny start lokalny

```bash
pnpm -C product/apps/web dev --hostname 0.0.0.0 --port 3000
pnpm -C product/apps/consumer-mobile start -- --port 8081
supabase functions serve --no-verify-jwt
./product/scripts/mobile-functions-smoke-check.sh
```

## 8) Co przekazać do nowego czatu

Do nowego okna czatu przekazać:

- ten handoff:
  - [PHASE010_RESTART_HANDOFF_2026-05-06.md](/Users/pa/projects/funcup/meta/docs/handoff/PHASE010_RESTART_HANDOFF_2026-05-06.md)
- prompt startowy:
  - [PHASE010_NEW_CHAT_PROMPT_2026-05-06.md](/Users/pa/projects/funcup/meta/docs/handoff/PHASE010_NEW_CHAT_PROMPT_2026-05-06.md)
