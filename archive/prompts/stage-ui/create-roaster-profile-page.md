Poniżej masz kompletny, „agent-proof” prompt pod Codex w Cursor — rozszerzony o:

* 🔒 **hard gate onboarding** (blokada wejścia do `/roaster-hub`)
* 🧪 **testy końcowe (manual + lekkie e2e)**
* ✅ **Definition of Done (twarde kryteria)**

---

# ⚙️ CODEX PROMPT (Cursor IDE)

**Feature: Roaster Profile (VIEW/EDIT/CREATE) + Hard Gate Onboarding**

---

## 🧠 Task Type

Full-stack feature (Supabase + routing guard + UI modes)

---

## 🎯 Objective

Implement:

1. `/roaster-profile` page with:

   * CREATE / VIEW / EDIT modes
2. **Hard gate onboarding**:

   * user **cannot access `/roaster-hub`** without completed profile
3. Supabase persistence using existing `roasters` table

---

## 📁 Scope

```txt
apps/web
```

---

## 🗄️ Data Source

Table: `roasters` (already extended)

Required fields for “profile completed”:

```txt
company_name
roaster_short_name
street
building_number
postal_code
city
regon
nip
```

---

## 🧭 Definition: Profile Completed

Profile is considered **complete ONLY if all required fields are non-empty**.

Implement helper:

```ts
function isProfileComplete(profile: any): boolean {
  return Boolean(
    profile?.company_name &&
    profile?.roaster_short_name &&
    profile?.street &&
    profile?.building_number &&
    profile?.postal_code &&
    profile?.city &&
    profile?.regon &&
    profile?.nip
  )
}
```

---

# 🔒 HARD GATE ONBOARDING (CRITICAL)

## Behavior

User MUST NOT access:

```txt
/roaster-hub
```

IF:

```ts
!profileExists || !isProfileComplete(profile)
```

---

## 🔁 Redirect Logic

When entering `/roaster-hub`:

```ts
if (!profile || !isProfileComplete(profile)) {
  router.replace('/roaster-profile')
}
```

---

## 📍 Where to Implement Guard

Choose ONE:

### Option A (preferred)

Inside `/roaster-hub/page.tsx`

### Option B

Shared hook:

```ts
useRequireRoasterProfile()
```

---

## 🚫 Constraints

* MUST block access even on manual URL entry
* MUST use `router.replace` (not push)
* MUST avoid redirect loops

---

# 📄 `/roaster-profile` Page

## 🧭 Modes

```ts
type Mode = 'create' | 'view' | 'edit'
```

---

## Mode Logic

| Condition           | Mode   |
| ------------------- | ------ |
| no row in DB        | create |
| row exists          | view   |
| click "Edytuj dane" | edit   |

---

## 🔄 Transitions

```txt
create → save → view
view → edit → save → view
view → edit → cancel → view
```

---

## 👁️ VIEW MODE (roaster-details)

Display:

* company_name
* roaster_short_name
* address (formatted)
* REGON
* NIP
* subscription_status (placeholder)

Button:

```txt
Edytuj dane
```

---

## ✏️ FORM (CREATE + EDIT)

Fields:

* company_name (required)
* roaster_short_name (required)
* street (required)
* building_number (required)
* apartment_number (optional)
* postal_code (required)
* city (required)
* regon (required)
* nip (required)

---

## ✅ Validation

* required → non-empty
* nip, regon → digits only
* postal_code → `/^\d{2}-\d{3}$/`

---

## 💾 Persistence

### CREATE

```ts
insert(...)
```

### UPDATE

```ts
update(...).eq('user_id', userId)
```

---

## 🔁 After Save

```ts
setMode('view')
```

AND refresh local state

---

## 🔙 Cancel (EDIT only)

```ts
setMode('view')
```

---

# 🔗 Flow Integration

## After Auth

```ts
if (!profileExists || !isProfileComplete(profile)) {
  router.replace('/roaster-profile')
} else {
  router.replace('/roaster-hub')
}
```

---

## From `roaster-hub`

* tile "Profil palarni" → `/roaster-profile`

---

# 🧪 TESTS (REQUIRED)

## 1. Manual Test Scenarios

### 🧪 Case 1 — New User

* no profile in DB
* go to `/roaster-hub`

✅ EXPECT:

* redirected to `/roaster-profile`
* form visible

---

### 🧪 Case 2 — Complete Profile

* fill all fields
* save

✅ EXPECT:

* view mode visible
* data displayed
* no redirect loop

---

### 🧪 Case 3 — Access Hub After Completion

* go to `/roaster-hub`

✅ EXPECT:

* access granted
* NO redirect

---

### 🧪 Case 4 — Edit Flow

* click "Edytuj dane"

✅ EXPECT:

* form visible
* fields prefilled

---

### 🧪 Case 5 — Cancel Edit

* click "Anuluj"

✅ EXPECT:

* return to view mode
* no data change

---

### 🧪 Case 6 — Validation

* clear required field
* submit

✅ EXPECT:

* validation error
* no API call

---

## 2. Lightweight E2E (OPTIONAL if trivial)

If test setup exists:

* simulate:

  * empty DB → redirect
  * filled DB → access

---

# ✅ DEFINITION OF DONE (STRICT)

## 🔒 Access Control

* [ ] `/roaster-hub` blocked if profile incomplete
* [ ] redirect uses `router.replace`
* [ ] no redirect loops

---

## 🧾 Profile

* [ ] create mode works
* [ ] edit mode works
* [ ] view mode renders correct data

---

## 🔄 UX

* [ ] smooth transitions between modes
* [ ] no page reload required
* [ ] form prefill works

---

## 💾 Data

* [ ] insert works
* [ ] update works
* [ ] data persists after reload

---

## 🧪 Testing

* [ ] all manual scenarios pass
* [ ] no console errors
* [ ] no runtime errors

---

## 🛠️ Execution Instructions (Codex)

1. Update `/roaster-profile/page.tsx`
2. Implement mode system
3. Implement Supabase fetch + save
4. Implement `isProfileComplete`
5. Add guard to `/roaster-hub`
6. Update post-auth redirect
7. Verify flows manually

---

## ⚡ Output Format

* FULL FILE: `/roaster-profile/page.tsx`
* UPDATED FILE: `/roaster-hub/page.tsx` (guard)
* minimal explanation

---

## 🔚 One-line task

Implement **roaster onboarding with enforced profile completion and protected access to dashboard**.