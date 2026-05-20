# funcup

Repo jest podzielone na dwie jawne strefy:

- `product/` — aktywny runtime i development workflow fun•brew
- `meta/` — dokumentacja, runbooki, archiwum i materiały pomocnicze

## Product

- `product/apps/web` — aktywna aplikacja web
- `product/apps/consumer-mobile` — aktywna aplikacja mobile consumer
- `product/packages/*` — współdzielone pakiety produktu
- `product/supabase` — migracje, funkcje i typy backendowe
- `product/scripts` — aktywne skrypty developerskie i release tooling

## Meta

- `meta/docs` — bieżące source-of-truth docs
- `meta/runbooks` — operacyjne diagramy i runbooki beta/release
- `meta/archive` — historia, legacy materiały i wcześniejsze handoffy

## Root Rules

- root zostaje tylko dla workspace/tooling entrypointów
- nowy aktywny runtime trafia wyłącznie do `product/`
- nowe docs, runbooki i materiały pomocnicze trafiają wyłącznie do `meta/`

## Development

- instalacja: `pnpm install`
- uruchomienie workspace: `pnpm dev`
- testy: `pnpm test`
- lint: `pnpm lint`
