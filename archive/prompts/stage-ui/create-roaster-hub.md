# Kontekst:
W projekcie **funcup** po uruchomieniu aplikacji (zakończenie wyświetlania `animated-splash` (`apps/web/components/AnimatedSplash.tsx`)) następuje wybór roli: `roaster` lub `consumer`. 
Obecne zadanie dotyczy roli `roaster`, dla której aplikacja `roaster-app` mieszka w apps/web.
Po wybraniu roli `roaster` wyświetlany jest ekran strony `roaster-hub`. 
Ekran strony `roaster-hub` w górnej części wyświetla `roaster_short_name` zasysaną z profilu roastera `roaster-profile`.
Ponadto ekran strony `roaster-hub` wyświetla siatkę przycisków/kafli, które nawigują użytkownika do dalszych ekranów aplikacji. Kafle te to:
1. **Dodaj kawę** linkujący do `apps/web/app/tag/page.tsx`;
2. **Profil palarni** linkujcy do `roaster-profile` (strona do utworzenia, zawiera oficjalne informacje rejestrowe na temat firmy `roastera`, tj. zarejestrowana nazwa firmy, `roaster_short_name`, adres siedziby (ulica + numer domu, opcjonalny nr lokalu, kod pocztowy, miasto), REGON, NIP, informacje o subskrypcji aplikacji);
3. **Coffee Bank** linkujący do `coffee-bank` (strona do utworzenia, wyświetla listę wszystkich kaw, jakie `roaster` dodał za pomocą `apps/web/app/tag/page.tsx`; każda pozycja na tej liście jest linkiem URL do karty produktu wyświetlającej informacje na temat wprowadzonej kawy w kolumnie obok listy (układ strony dwukolumnowy, jak w przypadku `apps/web/app/tag/page.tsx`));
4. **Analytics** – entry gate do stron aplikacji udostępniających analitykę danych – do rozwinięcia w kolejnch etapach – na teraz potrzebna wizualizacja kafla, 

# Problem:
1. Potrzebujemy stworzyć ekran strony `roaster-hub`, zgodnie z instrukcją powyżej; użyj stylów jak na stronie `apps/web/app/tag/page.tsx` (uniwersalny styl aplikacji `roaster-app`).
2. Potrzebuujemy umieścić ekran strony `roaster-hub` we flow roli `roaster` po ekranie strony wyboru roli (sekwencja startowa: `animated-splash`, wybór roli, ekran strony `roaster-hub`).
3. Potrzebujemy na ekranie strony `roaster-hub` umieścić w górnej części `roaster_short_name`, a poniżej siatkę kafli: "Dodaj kawę" (`apps/web/app/tag/page.tsx`); "Profil palarni", "Coffee Bank", "Analytics".
4. Potrzebujemy do kafla **Dodaj kawę** podłącz URL do `apps/web/app/tag/page.tsx`, aby kliknięcie w niego otwierało ekran geneorwania kodu QR.

# Zadanie
Poniżej masz wersję **promptu zoptymalizowaną pod Codex działający w Cursor IDE** — czyli taką, która:

* wymusza **agentowe działanie (multi-file edits, routing, struktura)**
* jest kompatybilna z workflow Codex (plan → diff → apply)
* minimalizuje „gadanie”, maksymalizuje **konkretne zmiany w repo**
* uwzględnia fakt, że Codex operuje na plikach + shellu ([Cursor][1])

---

# ⚙️ CODEX TASK SPEC (Cursor IDE)

## 🧠 Task Type

**Multi-file feature implementation (Next.js App Router)**

---

## 🎯 Objective

Implement a **`roaster-hub` dashboard page** and integrate it into the existing app flow for role `roaster`.

This includes:

* new route
* navigation wiring
* UI implementation
* stub pages

---

## 📁 Project Scope

Work ONLY inside:

```txt
apps/web
```

---

## 🧭 Required Routes (App Router)

Create the following routes:

```txt
/app/roaster-hub/page.tsx
/app/roaster-profile/page.tsx
/app/coffee-bank/page.tsx
```

Existing route (DO NOT MODIFY structure, only link to it):

```txt
/app/tag/page.tsx
```

---

## 🔀 Flow Integration (CRITICAL)

Find where role selection happens (after `AnimatedSplash`).

Update logic:

```ts
if (role === 'roaster') {
  router.push('/roaster-hub')
}
```

Constraints:

* do not break existing flow
* do not modify `consumer` flow

---

## 🧱 Page: `/roaster-hub`

### Layout

Structure:

```txt
[HEADER]
  roaster_short_name

[GRID]
  4 tiles
```

---

### Data (NO BACKEND)

Use mock:

```ts
const roaster = {
  roaster_short_name: "Sample Roaster"
}
```

---

### Tiles (Navigation Contract)

Implement 4 clickable tiles:

| Label          | Action                            |
| -------------- | --------------------------------- |
| Dodaj kawę     | `router.push('/tag')`             |
| Profil palarni | `router.push('/roaster-profile')` |
| Coffee Bank    | `router.push('/coffee-bank')`     |
| Analytics      | no-op (disabled or no handler)    |

---

### Styling (MANDATORY)

Replicate style from:

```txt
/app/tag/page.tsx
```

Rules:

* reuse components if available
* otherwise copy layout patterns (spacing, grid, typography)
* do NOT introduce new design system

---

## 📄 Stub Pages

### `/roaster-profile/page.tsx`

```tsx
export default function Page() {
  return <h1>Profil palarni</h1>
}
```

---

### `/coffee-bank/page.tsx`

```tsx
export default function Page() {
  return <h1>Coffee Bank</h1>
}
```

---

## 🚫 Non-Goals

Do NOT implement:

* API calls
* database
* authentication
* form logic
* analytics logic

---

## ✅ Acceptance Criteria

All must pass:

### Flow

* selecting `roaster` redirects to `/roaster-hub`

### UI

* header shows `Sample Roaster`
* 4 tiles visible

### Navigation

* "Dodaj kawę" → `/tag`
* "Profil palarni" → `/roaster-profile`
* "Coffee Bank" → `/coffee-bank`

### Technical

* no TypeScript errors
* no runtime errors
* all routes compile

---

## 🛠️ Execution Instructions (for Codex)

1. **Search codebase** for:

   * role selection logic
   * router usage
   * layout patterns in `/tag/page.tsx`

2. **Create new route files**

3. **Implement UI**

   * copy layout patterns from `/tag/page.tsx`

4. **Wire navigation**

5. **Validate build**

---

## ⚡ Output Format (STRICT)

Codex MUST:

* produce **file diffs or full files**
* NOT explain unless necessary
* prioritize **working code over commentary**

---

## 🧩 Optional (if trivial)

* extract reusable `Tile` component
* keep it local (no global refactor)

---

## 🔚 One-line task

Implement a **roaster dashboard route with navigation tiles and integrate it into role selection flow**.

---

## 💡 Dlaczego ta wersja działa lepiej w Cursor + Codex

* Codex działa jak **agent na repo**, więc potrzebuje:

  * jasnych plików do stworzenia
  * jawnych ścieżek
  * zero „produktowego gadania”
* wymuszasz:

  * konkretne `router.push`
  * konkretne pliki
  * brak backendu → brak halucynacji

👉 To jest format bardzo zbliżony do tego, jak Codex generuje poprawne PR-y w praktyce (plan → edit → diff).

---

Jeśli chcesz, mogę zrobić jeszcze wersję:
👉 **„auto-apply safe”** (czyli taką, którą możesz wkleić i bez czytania kliknąć *Apply All Changes* w Cursor).

[1]: https://cursor.com/blog/codex-model-harness?utm_source=chatgpt.com "Improving Cursor’s agent for OpenAI Codex models · Cursor"
