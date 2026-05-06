# SYSTEM PROMPT — QR GENERATE ROASTER – ADD CALENDAR-PICKER AND DROPZONE UPLOADER (PRODUCTION-GRADE + TEST LAYER)

---

## 0. Execution Rules (MANDATORY)

Agent MUST:

1. Ask-before-act:

   * If ANY ambiguity exists → STOP and ask
   * No assumptions about missing contracts

2. No architecture changes:

   * Do NOT modify:

     * DB schema
     * folder structure
     * routing
   * unless explicitly approved

3. Type safety:

   * TypeScript strict mode
   * NO `any`

4. Scope discipline:

   * Modify ONLY required files
   * No unrelated refactors

---

## 1. Application Context

Monorepo:

* `apps/web` → Next.js (App Router) → roaster-app (WEB ONLY)
* `apps/consumer-mobile` → Expo → consumer-app (MOBILE ONLY)

UI is platform-specific:
- apps/web → web UI (Next.js)
- apps/consumer-mobile → mobile UI (React Native)

Shared logic allowed:
- TypeScript types
- validation schemas
- API contracts

Do NOT share:
- platform-specific UI components

---

## 2. Feature Scope

File:

```
apps/web/app/tag/page.tsx
```

Feature:
Create **Roaster Coffee Tag**

---

## 3. Data Contract (SOURCE OF TRUTH)

```ts
export type BeanType = "ARABICA" | "ROBUSTA"

export type RoastLevel = "LIGHT" | "MEDIUM" | "DARK"

export type BrewMethod =
  | "ESPRESSO"
  | "FILTER"
  | "AEROPRESS"
  | "FRENCH_PRESS"

export type ProcessingMethod =
  | "WASHED"
  | "NATURAL"
  | "HONEY"
  | "ANAEROBIC"
  | "EXPERIMENTAL"

export interface RoasterCoffeeTag {
  id?: string
  roasterId: string

  coffeeLabelUrl: string

  beanOriginCountry: string
  beanOriginFarm?: string
  beanOriginTradename?: string
  beanOriginRegion?: string

  beanType: BeanType

  beanVarietalMain?: string
  beanVarietalExtra?: string

  beanOriginHeight?: number

  beanProcessing: ProcessingMethod

  beanRoastDate: string // YYYY-MM-DD

  beanRoastLevel: RoastLevel

  brewMethod: BrewMethod

  createdAt?: string
}
```

File:

```
apps/web/src/types/roasterCoffeeTag.ts
```

---

## 4. Form Architecture

REQUIRED:

* react-hook-form
* zod validation
* controlled inputs

---

## 5. Date Picker (STRICT)

* Shadcn Date Picker
* Add button: "Today"

Rules:

* disable future dates (UI)
* reject future dates (zod)
* format to DB: YYYY-MM-DD
* timezone: client local

---

## 6. Image Upload (STRICT)

Library:

* react-filepond

Config:

* max size: 512 KB
* types: jpeg, png, webp
* preview: enabled
* multiple: false
* upload: on submit ONLY

---

## 7. Supabase Integration

Storage:

* bucket: coffee-labels
* path:

```
{roasterId}/{uuid}.{ext}
```

Flow:

1. upload file
2. get public URL
3. save URL to DB

DB:

* table: roaster_coffee_tags
* field: img_coffee_label

---

## 8. Image Handling Rules (CRITICAL)

1. Source of truth:

   * Image MUST be uploaded to Supabase Storage
   * Database MUST store ONLY public URL (string)

2. Forbidden:

   * DO NOT store image as base64
   * DO NOT store binary in database
   * DO NOT skip storage upload

3. Upload flow (STRICT ORDER):

   a. User selects file (File object)
   b. Validate file (size, type)
   c. Upload file to Supabase Storage
   d. Retrieve public URL
   e. Inject URL into RoasterCoffeeTag
   f. Save record to database

4. Local state:

   * Form uses:
     coffeeLabelFile: File

   * After upload:
     coffeeLabelUrl: string

5. File format:

   * If file is not WEBP:

     * EITHER keep original format
     * OR explicitly convert to WEBP before upload

   * Agent MUST NOT rename file extension without conversion

6. Rendering guarantee:

   * Stored URL MUST be directly usable in: <img src="..." />
     or React Native <Image />

---

## 9. Validation Rules (ZOD)

* required:

  * roasterId
  * beanOriginCountry
  * beanType
  * beanProcessing
  * beanRoastDate
  * beanRoastLevel
  * brewMethod
  * coffeeLabelFile

* constraints:

  * file ≤ 512KB
  * valid MIME
  * date ≤ today
  * height ≤ 3000

---

## 10. Styling

Use:

```
apps/web/src/theme/authScreenStyles.ts
```

No new design system.

---

## 11. Routing

```
/tag
```

Next.js App Router.

---

## 12. Definition of Done

* app runs
* form submits
* upload works
* DB contains valid URL
* validation blocks invalid input
* TS: zero errors

---

## 13. Forbidden

* base64 images
* skipping upload
* `any`
* new dependencies (except FilePond)

---

## 14. TEST & ASSERTION LAYER (PRODUCTION-GRADE)

Agent MUST generate tests.

### 14.1 Unit Tests (Validation)

Test Zod schema:

* rejects:

  * future date
  * file > 512KB
  * invalid MIME
* accepts valid payload

---

### 14.2 Integration Tests (Upload Flow)

Mock Supabase:

Test sequence:

1. file selected
2. validation passes
3. upload called ONCE
4. URL returned
5. DB insert uses URL (NOT file)

Assertions:

* upload path correct
* URL saved in payload
* no base64 anywhere

---

### 14.3 Component Tests

Test UI:

* Date picker:

  * "Today" sets correct date
  * future dates disabled

* File upload:

  * rejects invalid file
  * shows preview

---

### 14.4 E2E Tests (Critical Path)

Scenario:

1. user fills form
2. uploads image
3. submits form
4. record created

Assertions:

* Supabase contains file
* DB contains URL
* URL resolves (HTTP 200)

---

### 14.5 Runtime Assertions (In Code)

Agent MUST add guards:

```ts
if (!coffeeLabelUrl) {
  throw new Error("Image upload failed")
}
```

```ts
if (file.size > 512_000) {
  throw new Error("File too large")
}
```

---

### 14.6 Anti-Regressions

Tests MUST ensure:

* no base64 in payload
* no direct DB image storage
* correct upload order

---

## 15. If Missing Data

Agent MUST STOP and ask for:

* Supabase config
* env variables
* API client setup

---

## END
