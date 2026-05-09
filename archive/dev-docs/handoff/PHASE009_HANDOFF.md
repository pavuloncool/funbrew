# Phase 009 Handoff (Polish — T081–T088)

Ten dokument jest skrocona pamiecia robocza do startu nowego czatu dla implementacji Phase 009.

## 1) Status wejsciowy

- Phase 008 (US6, `T075-T080`) ma formalny sign-off: PASS (patrz `funcup-src-docs/04-tasks/13-tasks-002-qr-coffee-platform-88-tasks.md` oraz `project-log.md`).
- Backlog taskow jest zsynchronizowany z repo:
  - `funcup-src-docs/04-tasks/13-tasks-002-qr-coffee-platform-88-tasks.md`
  - Phase 008: wszystkie taski `T075-T080` oznaczone jako `[x]`.
- Quality gate US6 (shared + mobile) jest zielony:
  - `pnpm -C packages/shared test` -> PASS
  - `pnpm -C packages/shared typecheck` -> PASS
  - `pnpm -C apps/consumer-mobile typecheck` -> PASS
- Regression gate US2 po zmianach US6 (lokalnie, Supabase + `.env.local`):
  - `pnpm -C apps/web test:generate-qr` -> PASS
  - `pnpm -C apps/web test:e2e` -> PASS

## 2) Cel sprintu (Phase 009 / Polish)

Domknac Polish (`T081-T088`): stabilnosc UX, puste stany, deep linki, dostepnosc, wydajnosc, build produkcyjny i finalne QA.

1. Error boundary + global error states (mobile) (`T081`)
2. Loading skeletons dla Coffee Page + Hub (`T082`)
3. Empty states dla Journal + Discovery (`T083`)
4. Deep link handling (web `/q/{hash}` -> mobile `funcup://q/{hash}`) (`T084`)
5. Accessibility audit (mobile + web) (`T085`)
6. Performance audit (bundle, obrazy) (`T086`)
7. EAS Build configuration (production profile) (`T087`)
8. Final QA checklist (`T088`)

## 3) Aktualny stan kodu istotny dla Polish

### Mobile / Web

- Glowne ekrany: Hub, Coffee Page, Journal, profil, Learn; web: dashboard roastera, analityka batcha (`/dashboard/analytics/[batchId]`).
- Wspolne hooki i serwisy w `packages/shared`.

### Testy

- Baseline: `packages/shared` (Vitest), Playwright web (`apps/web/tests/`).

## 4) Scope implementacyjny Task-by-Task (Phase 009)

- `T081` Error boundary + global error states (mobile)
- `T082` Loading skeletons for Coffee Page + Hub
- `T083` Empty states for Journal + Discovery
- `T084` Deep link handling (web `/q/{hash}` -> mobile `funcup://q/{hash}`)
- `T085` Accessibility audit (mobile + web)
- `T086` Performance audit (JS bundle size, image optimization)
- `T087` EAS Build configuration (production profile)
- `T088` Final QA checklist

## 5) Krytyczne zasady i ograniczenia

- Nie psuc przeplywow US1–US6 (sign-off PASS).
- Dla nowych core-dokumentow zawsze dodac link w `README.md`.
- Testy regresyjne US2 (`test:generate-qr`, `test:e2e`) przed final sign-off Phase 009.

## 6) Rekomendowany porzadek prac (orientacyjny)

1. `T081` / `T082` / `T083` (stany UI: blad, ladowanie, pusto)
2. `T084` (deep links)
3. `T085` / `T086` (a11y + perf)
4. `T087` (EAS)
5. `T088` (QA checklist + hardening)

## 7) Minimalny test plan Phase 009 (quality gate)

- Regresja: `packages/shared` test + typecheck, `apps/consumer-mobile` typecheck.
- Regresja US2: `pnpm -C apps/web test:generate-qr`, `pnpm -C apps/web test:e2e` (Supabase lokalnie).
- Smoke: scenariusze z checklisty `T088`.

## 8) Uruchomienie lokalne (quickstart)

```bash
pnpm install
supabase start
# lub przy problemach z analytics: supabase start --ignore-health-check
./apps/web/scripts/sync-supabase-env-local.sh   # opcjonalnie: klucze do apps/web/.env.local
pnpm -C apps/consumer-mobile start
pnpm -C apps/web dev
```

## 9) Sugerowany pierwszy prompt do nowego czatu

```text
Przeczytaj DEFINTION_OF_READY_PHASE009.md i PHASE009_HANDOFF.md i rozpocznij implementacje Phase 009 (Polish, T081-T088).
Priorytet: error/loading/empty states (T081-T083), potem deep links (T084), na koncu a11y/perf/EAS/QA (T085-T088).
Pamietaj o aktualizacji checklisty taskow po kazdym domknietym tasku i o regresji US2 przed sign-off.
```

## 10) T088 — smoke QA (Phase 009 close-out)

- Mobile: Coffee Page shows skeleton then data from `scan_qr`; error + retry on bad hash; Journal empty / signed-out / list; Hub discovery tabs empty + skeleton + list; `funcup://q/{uuid}` resolves via `q/[hash]` → Coffee Page (Expo Go or dev client).
- Web: `/q/[hash]` shows loading status and alert on error; dashboard build still green.
- CI/local: `pnpm -C packages/shared test`, `pnpm -C packages/shared typecheck`, `pnpm -C apps/consumer-mobile typecheck`, `pnpm -C apps/web test:generate-qr`, `pnpm -C apps/web test:e2e`.

## 11) SIGN-OFF: Phase 009 (Polish) — **PASS** (2026-04-10)

Potwierdzone testy i hardening zgodnie z sekcjami **7** (plan) i **10** (smoke), plus build produkcyjny web:

| Gate | Komenda | Wynik |
|------|---------|--------|
| Shared tests | `pnpm -C packages/shared test` | PASS (19 testów) |
| Shared types | `pnpm -C packages/shared typecheck` | PASS |
| Mobile types | `pnpm -C apps/consumer-mobile typecheck` | PASS |
| US2 generate_qr | `pnpm -C apps/web test:generate-qr` | PASS |
| US2 E2E | `pnpm -C apps/web test:e2e` | PASS (przy `WEB_BASE_URL=http://127.0.0.1:3000` i działającym `next dev -p 3000`; Playwright ładuje `.env.local` — ustaw spójny port lub nadpisz `WEB_BASE_URL`) |
| Web production build (perf/hardening baseline) | `pnpm -C apps/web build` | PASS |

Uwaga operacyjna: scenariusz `us2-happy-path.e2e.spec.ts` wymaga działającego serwera Next na adresie z `WEB_BASE_URL` (domyślnie `http://127.0.0.1:3000`).
