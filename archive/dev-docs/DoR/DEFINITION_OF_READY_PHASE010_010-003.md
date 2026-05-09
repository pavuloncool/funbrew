# Definition of Ready (DoR) — Phase 010 / Task **010-003**

Projekt: `funcup`  
Zakres odniesienia: ukończone **010-001**, **010-002** (Epic A — Entry, FR-012) oraz wejście w implementację **010-003** na nowym czacie / w nowym sprincie.

Ten dokument definiuje warunki **wejścia** w pracę nad taskiem **010-003** (mobile: reduced motion / accessibility dla ścieżki wejścia). Wzorowany strukturą na [DEFINTION_OF_READY_PHASE009.md](DEFINTION_OF_READY_PHASE009.md) i rozbudowany o elementy z wcześniejszych faz (gate zależności, środowisko, plan testów, ryzyka).

Powiązane: [PHASE010_HANDOFF.md](PHASE010_HANDOFF.md), backlog [funcup-src-docs/04-tasks/14-tasks-003-phase-010-product-ux-ui-backlog.md](funcup-src-docs/04-tasks/14-tasks-003-phase-010-product-ux-ui-backlog.md).

---

## 1) Gate wejściowy — zależności taska

- [x] **010-001** **DONE** — normatywny opis entry UX i zasad a11y / reduced motion: [funcup-src-docs/02-specs/08-entry-ux-spec-fr012.md](funcup-src-docs/02-specs/08-entry-ux-spec-fr012.md) (m.in. § *Accessibility and reduced motion*).
- [x] **010-002** **DONE** — `AnimatedSplash` + `AppOpenGate` w `apps/frontend` i `apps/web`; na mobile obecnie [apps/consumer-mobile/app/index.tsx](apps/consumer-mobile/app/index.tsx) → `Redirect` na `/home` (bez pełnego FR-012 w RN).
- [x] **FR-012** i zakres „tylko przy starcie aplikacji” są zapisane w [funcup-src-docs/02-specs/spec.md](funcup-src-docs/02-specs/spec.md) (Global UI/UX constraint + FR-012).

**Brak gate:** jeśli powyższe nie są spełnione, **010-003** nie startuje.

---

## 2) Repozytorium i środowisko

- [ ] `pnpm install` kończy się bez błędów blokujących.
- [ ] `pnpm-lock.yaml` jest aktualny względem brancha bazowego.
- [ ] Baseline lokalny (zalecane): Node `22.x`, pnpm `10.x`.
- [ ] `pnpm -C apps/consumer-mobile start` — Expo Router działa; do weryfikacji **Reduce Motion** i screen readerów potrzebne są **urządzenie fizyczne lub symulator iOS + emulator Android** (ustawienia systemowe „Reduce motion” / odpowiednik).

---

## 3) Zakres taska **010-003** (committed)

Źródło backlogu:

> **010-003** [P] **Mobile:** **Reduced motion / accessibility:** alternative path (e.g. static frame + haptic or screen-reader announcement) that does **not** replace or reorder FR-012 steps for default users. **Depends:** 010-001, 010-002. **Surfaces:** mobile.

- [ ] Sprint / czat ma **jednoznaczny cel**: dostarczyć na **`apps/consumer-mobile`** ścieżkę zgodną z [08-entry-ux-spec-fr012.md](funcup-src-docs/02-specs/08-entry-ux-spec-fr012.md) § *Accessibility and reduced motion* (system reduce motion / odpowiednik, semantyczna kolejność beatów bez reorderingu, bez pomijania wymaganego tapu bez uzgodnienia w **010-006**).
- [ ] Zespół wie, że **użytkownicy domyślni** nadal widzą pełną intencję FR-012; alternatywa dotyczy **preferencji dostępności**, nie zastępuje produktu dla wszystkich.

---

## 4) Zależności produktowe i decyzja przed kodem (wymagana do „Go”)

- [ ] **Decyzja implementacyjna (product / tech lead):** w repo **nie ma** jeszcze pełnego animated entry na RN. Przed większym portem ustalić jedną z ścieżek (lub hybrydę udokumentowaną w PR):
  - **A)** wprowadzić **minimalny ekran entry** spełniający semantykę beatów przy włączonym reduce motion (krótsze fade, statyczne assety, ewentualnie „Continue” tylko jeśli spec/product zaakceptuje równoważnik tapu — preferencja spec: tap na obszarze odcisku),
  - **B)** rozpocząć **port uproszczonej sekwencji** (np. SVG / `react-native-svg`, animacje RN) z gałęzią `reduceMotion`,
  - **C)** inna opcja **jawnie zapisana** w opisie PR + odsyłacz do tego DoR.
- [ ] Potwierdzenie: zmiana **kolejności** beatów FR-012 jest **poza zakresem** (wymagałaby zmiany constitution); w zakresie są tylko **dozwolone adaptacje ruchu** i a11y zgodnie ze spec.

---

## 5) Odniesienia implementacyjne (readiness techniczna)

- [ ] Przeczytane: § *Accessibility and reduced motion* i *Screen reader* w [08-entry-ux-spec-fr012.md](funcup-src-docs/02-specs/08-entry-ux-spec-fr012.md).
- [ ] **Referencja zachowania (web):** [apps/web/components/AnimatedSplash.tsx](apps/web/components/AnimatedSplash.tsx) — do inspiracji dla `prefers-reduced-motion` **tylko** jeśli product uzgodni spójność cross-platform; **obowiązuje** spec mobile + RN API (`AccessibilityInfo` / dokumentacja Expo SDK **52**).
- [ ] Znany punkt wejścia mobile: [apps/consumer-mobile/app/index.tsx](apps/consumer-mobile/app/index.tsx) (obecnie sam redirect — prawdopodobna zmiana w ramach 010-003).

---

## 6) Jakość i plan testów (minimum przed merge)

- [ ] `pnpm -C apps/consumer-mobile typecheck` — PASS.
- [ ] `pnpm -C apps/consumer-mobile lint` — PASS (lub uzasadnione wyjątki w PR).
- [ ] **Ręcznie:** włączone **Reduce motion** (iOS) / odpowiednik (Android) — ścieżka alternatywna działa bez psucia flow domyślnego.
- [ ] **Ręcznie:** **VoiceOver** (iOS) i/lub **TalkBack** (Android) — po zakończeniu entry focus na pierwszym sensownym elemencie shellu; brak kolizji ogłoszeń z krytycznymi przejściami (wg spec).
- [ ] Krótki opis w PR: jak odtworzyć testy + zrzut lub lista kroków (nagranie może wejść później do **010-006**).

---

## 7) Ryzyka

- [ ] **Ryzyko:** scope 010-003 rozrasta się do pełnego portu canvas z web — **mitigacja:** trzymać się decyzji z § 4 i backlogu; duży port rozbić na follow-up za zgodą product.
- [ ] **Ryzyko:** „Continue” zamiast tapu na odcisku bez akceptacji **010-006** — **mitigacja:** trzymać się spec (preferuj tap z redukcją efektów).
- [ ] **Ryzyko:** regresja cold start / deep link — **mitigacja:** po zmianach smoke: cold start + jeden deep link (szczegóły domknąć z **010-004** jeśli nakładają się).

---

## 8) Go / No-Go

**Go** — można przenieść pracę do nowego czatu i implementować **010-003**, gdy:

1. § **1** jest kompletne (010-001, 010-002, spec FR-012),  
2. § **4** ma **podpisaną** decyzję implementacyjną (A/B/C),  
3. § **2** — dev może uruchomić mobile i przetestować reduce motion + screen reader.

**No-Go** — najpierw domknąć brakujące checkboxy lub eskalować decyzję produktową.

---

## 9) Po ukończeniu (Definition of Done — przypomnienie)

- Oznaczyć **010-003** jako done w [14-tasks-003-phase-010-product-ux-ui-backlog.md](funcup-src-docs/04-tasks/14-tasks-003-phase-010-product-ux-ui-backlog.md) (sekcja Status / checkbox).
- Uzupełnić **Document history** w [08-entry-ux-spec-fr012.md](funcup-src-docs/02-specs/08-entry-ux-spec-fr012.md), jeśli zachowanie odbiega od opisu tylko kosmetycznie — inaczej tylko notka „implemented in mobile @ commit/PR”.
- **010-006** (gate sign-off) nadal wymaga m.in. nagrania z reduce motion — zaplanować dowód na czas gate’u.

---

*Status dokumentu: szablon DoR dla startu pracy nad **010-003**; aktualizuj checkboxy przed/po wejściu w implementację.*
