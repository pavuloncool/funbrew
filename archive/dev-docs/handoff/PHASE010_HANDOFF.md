# Phase 010 Handoff — następny task: **010-003**

Skrócona pamięć robocza na start kolejnego sprintu / czatu dla **Product UX & UI (Phase 010)**.  
Backlog: [funcup-src-docs/04-tasks/14-tasks-003-phase-010-product-ux-ui-backlog.md](funcup-src-docs/04-tasks/14-tasks-003-phase-010-product-ux-ui-backlog.md)  
**Definition of Ready (nowy czat):** [DEFINITION_OF_READY_PHASE010_010-003.md](DEFINITION_OF_READY_PHASE010_010-003.md)

---

## 1) Stan wejściowy (ukończone w tej fazie)

| Task | Status | Dowód / artefakty |
|:-----|:-------|:------------------|
| **010-001** | DONE | [funcup-src-docs/02-specs/08-entry-ux-spec-fr012.md](funcup-src-docs/02-specs/08-entry-ux-spec-fr012.md) — timing, tokeny, tap, loading/error, reduced motion (opis), kontrakt stanu (preview). |
| **010-002** | DONE | **Vite:** [apps/frontend/src/AnimatedSplash.jsx](apps/frontend/src/AnimatedSplash.jsx) + `public/assets/home-print.svg`, `home-bean.svg`; [apps/frontend/src/App.tsx](apps/frontend/src/App.tsx) (`ready` + `<Routes>`). **Next:** [apps/web/components/AnimatedSplash.tsx](apps/web/components/AnimatedSplash.tsx), [apps/web/components/AppOpenGate.tsx](apps/web/components/AppOpenGate.tsx), [apps/web/app/layout.tsx](apps/web/app/layout.tsx), assety w `apps/web/public/assets/`. **Frontend:** nawigacja z home — **`<Link to>`** (react-router), **nie** `<a href>`, żeby uniknąć pełnego reloadu i ponownego splashu ([apps/frontend/src/pages/HomePage.tsx](apps/frontend/src/pages/HomePage.tsx)). **Next:** strona główna jak Vite + trasy `/scan`, `/hub`, `/profile`. **Expo (010-002):** pierwotnie [apps/consumer-mobile/app/index.tsx](apps/consumer-mobile/app/index.tsx) → redirect `/home`; **010-003** zastąpiło entry przez [MobileEntrySplash](apps/consumer-mobile/src/components/entry/MobileEntrySplash.tsx). |

**Source of truth (FR-012 + zakres):** [funcup-src-docs/02-specs/spec.md](funcup-src-docs/02-specs/spec.md) — sekcja **Global UI/UX constraint — FR-012 entry animation** oraz **FR-012** (tylko przy starcie aplikacji, bez powtórzeń przy zwykłej nawigacji w shellu).

---

## 2) Następny task do realizacji: **010-003**

**Epic A (P0)** — Entry experience hardening — **FR-012**

- **[x] 010-003** [P] **Mobile:** **Reduced motion / accessibility:** alternatywna ścieżka (np. statyczna klatka + haptic lub komunikat screen readera), która **nie** zastępuje ani nie zmienia kolejności kroków FR-012 dla użytkowników domyślnych.  
- **Depends:** 010-001, 010-002  
- **Surfaces (backlog):** mobile  

### Cel 010-003

Zaimplementować zachowanie zgodne z [08-entry-ux-spec-fr012.md § Accessibility and reduced motion](funcup-src-docs/02-specs/08-entry-ux-spec-fr012.md) na kliencie **mobile (Expo / React Native)**:

- Respektować **Reduce Motion** (iOS) / odpowiednik na Androidzie (`AccessibilityInfo` / `expo` API — sprawdź aktualny SDK 52).
- Ta sama **semantyczna kolejność** beatów co FR-012, ale **uproszczone skrócone ruchy** (np. krótsze fade, bez canvas „pyłu”, statyczna fasada ziarna tam gdzie spec dopuszcza).
- **Zabronione:** zmiana kolejności beatów, pomijanie wymaganego tapu bez zatwierdzenia w gate **010-006** (preferuj tap na obszarze odcisku z redukcją efektów).
- **Screen reader:** po wejściu do shellu focus na pierwszym sensownym elemencie; opcjonalnie jednorazowe ogłoszenie „funcup” — bez kolizji z przejściami (patrz spec).

### Uwaga implementacyjna (stan repo)

**010-003 (done):** `apps/consumer-mobile` montuje `MobileEntrySplash` z `app/index.tsx` — ten sam artwork SVG co web (`react-native-svg`), uproszczony ruch (bez canvas „pyłu”), gałąź **reduce motion** przez `AccessibilityInfo`. Opcjonalny follow-up przed **010-006:** pełniejszy port animacji z wersji web (Reanimated / cząsteczki), jeśli product wymaga wizualnej równoważności 1:1.

---

## 3) Zależności i kolejność po 010-003

| Task | Krótki opis | Zależy od |
|:-----|:-------------|:----------|
| **010-004** | Routing po splashu: auth vs tabs; reguła sesji (deep link bez powtórki splash). | 010-002 |
| **010-005** | Dokumentacja kontraktu stanu entry (`splashPhase`, `splashComplete`, …). | 010-001 |
| **010-006** | Gate sign-off FR-012 (nagrania, reduced motion, atest). | 010-002, 010-003, 010-004 |

**010-004** można równolegle planować z 010-003, ale **010-006** wymaga domknięcia **010-003** i **010-004**.

---

## 4) Krytyczne zasady (niełamać)

- **FR-012:** kolejność beatów chroniona konstytucją — zmiana sekwencji tylko przez formalną zmianę constitution.
- **spec.md — Global UI/UX constraint:** animacja wejścia **tylko przy starcie aplikacji**; **nie** jako zwykła transycja między ekranami; wewnętrzna nawigacja bez pełnego reloadu tam gdzie to resetuje stan splashu.
- Web/Vite: nadal używać **client-side** linków wewnątrz aplikacji.

---

## 5) Sugerowany plan pracy na 010-003

1. Dodać w `apps/consumer-mobile` **jeden** komponent / ekran entry (np. `app/index.tsx` zamiast samego `Redirect`, lub grupa tras), który:
   - czyta **reduce motion** z API RN/Expo;
   - w gałęzi domyślnej może póki co prowadzić do `/home` **po** krótkim placeholderze **albo** od razu implementuje min. wersję FR-012 (product decision).
2. Dla **reduce motion:** ścieżka uproszczona wg [08-entry-ux-spec-fr012.md](funcup-src-docs/02-specs/08-entry-ux-spec-fr012.md) § Accessibility.
3. Dodać test ręczny: VoiceOver / TalkBack na pierwszym ekranie po splashu.
4. Zaktualizować backlog: `[x]` przy **010-003** + wpis w sekcji **Status** pliku `14-tasks-003-...md` + krótka notka w [08-entry-ux-spec-fr012.md](funcup-src-docs/02-specs/08-entry-ux-spec-fr012.md) (Document history).

---

## 6) Minimalny quality gate (po 010-003)

```bash
pnpm -C apps/consumer-mobile typecheck
pnpm -C apps/consumer-mobile lint
```

Opcjonalnie regresja web (nie jest strict częścią 010-003, ale zdrowy nawyk):

```bash
pnpm -C apps/web lint
pnpm -C apps/frontend lint
```

---

## 7) Uruchomienie lokalne (skrót)

```bash
pnpm install
pnpm -C apps/consumer-mobile start          # Expo
pnpm -C apps/frontend dev          # Vite :5173
pnpm -C apps/web dev               # Next :3000
```

---

## 8) Linki szybkie

- Backlog Phase 010: [14-tasks-003-phase-010-product-ux-ui-backlog.md](funcup-src-docs/04-tasks/14-tasks-003-phase-010-product-ux-ui-backlog.md)  
- Entry UX spec: [08-entry-ux-spec-fr012.md](funcup-src-docs/02-specs/08-entry-ux-spec-fr012.md)  
- Product spec (FR-012 + global constraint): [spec.md](funcup-src-docs/02-specs/spec.md)  

---

*Wygenerowano jako handoff do taska **010-003** (Epic A, Phase 010).*
