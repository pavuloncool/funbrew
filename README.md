# funcup

Monorepo produktu funcup po cleanupie pre-go-live.

## Active Product Areas

- `apps/web` — aktywna aplikacja web (roaster + public web flow)
- `apps/consumer-mobile` — aktywna aplikacja mobile consumer (Expo)
- `packages/shared` i `packages/ui` — współdzielona logika i UI
- `supabase` — migracje, funkcje i integracja backendowa

## Active Source-of-Truth Docs

- `dev-docs/specs/002-qr-coffee-platform` — ADR-y, kontrakty, checklisty
- `dev-docs/funcup-src-docs` — product/spec/architecture/tasks (bieżący zestaw)
- `mvp-release-flow-diagrams` — operacyjne diagramy i runbooki beta/release
- `dev-docs/repo-hygiene/CONSERVATIVE_CLEANUP_2026-05-08.md` — polityka higieny repo

## Archive

- `archive/` — jawne archiwum legacy code, handoffów, evidence i promptów
- zasady archiwizacji: `archive/README.md`

## Development

- instalacja: `pnpm install`
- uruchomienie workspace: `pnpm dev`
- testy: `pnpm test`
- lint: `pnpm lint`

## Handoff Rule

Nowy developer powinien zaczynać od tego README i poruszać się wyłącznie po strefach Active + Source-of-Truth. Materiały historyczne są dostępne tylko przez `archive/`.
