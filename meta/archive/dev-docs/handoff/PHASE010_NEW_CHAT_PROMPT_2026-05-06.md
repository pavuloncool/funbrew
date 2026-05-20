Kontynuujemy pracę na branchu:
`codex-mvp-refactor-handoff-2026-05-06`

Wchodzimy w **Phase 010: Product UX & UI** dopiero po domknięciu post-audit MVP refactor. To założenie jest już potwierdzone.

Najpierw przeczytaj:

- [PHASE010_RESTART_HANDOFF_2026-05-06.md](/Users/pa/projects/funcup/meta/docs/handoff/PHASE010_RESTART_HANDOFF_2026-05-06.md)
- [Zadanie MVP refactor.md](/Users/pa/projects/funcup/meta/docs/Zadanie%20MVP%20refactor.md)
- [14-tasks-003-phase-010-product-ux-ui-backlog.md](/Users/pa/projects/funcup/meta/docs/funcup-src-docs/04-tasks/14-tasks-003-phase-010-product-ux-ui-backlog.md)
- [08-entry-ux-spec-fr012.md](/Users/pa/projects/funcup/meta/docs/funcup-src-docs/02-specs/08-entry-ux-spec-fr012.md)

Ważne:

- backlog Phase 010 ma stale references do `product/apps/frontend` i mobile `/home`
- nie używaj starego `PHASE010_HANDOFF.md` jako source of truth
- aktywna rzeczywistość repo jest opisana w `PHASE010_RESTART_HANDOFF_2026-05-06.md`

Zadanie startowe:

1. potwierdź re-baseline dla:
   - `010-002`
   - `010-003`
   - `010-004`
   - `010-005`
   - `010-006`
   - `010-007`
   - `010-008`
2. wskaż, które z tych tasków są:
   - realnie done
   - partial
   - nadal open
3. zaktualizuj backlog / handoff tylko tam, gdzie to naprawdę potrzebne, żeby usunąć drift dokumentów
4. jeśli Epic A nie jest domknięty, dokończ najpierw Epic A
5. jeśli Epic A jest już efektywnie domknięty, wejdź w pierwszą sensowną paczkę implementacyjną Phase 010:
   - preferencja: `010-019` Mobile Hub layout

Twarde ograniczenia:

- nie łam FR-012 entry sequence
- nie przywracaj `product/apps/frontend`, `/home`, `test-select-user` ani innych zarchiwizowanych scaffoldów
- nie rozwijaj równolegle drugiego modelu biznesowego obok canonical flow
- nie rozszerzaj social/community scope poza MVP
- zachowaj:
  - roaster only on web
  - consumer only on mobile

Po wejściu:

- zrób realną weryfikację w kodzie, nie tylko na podstawie backlogu
- pracuj end-to-end: analiza -> implementacja -> weryfikacja -> aktualizacja docs
- jeśli znajdziesz drift między backlogiem a repo, nazwij go wprost i skoryguj
