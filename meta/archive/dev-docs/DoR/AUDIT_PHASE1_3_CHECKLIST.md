# Funcup — Phase 1–3 Audit Checklist (T001–T042)

Mode: **strict-paths** — task is considered **PASS** only if the exact file/folder paths referenced in the tasks doc exist.

Source of truth: `/Users/pa/projects/funcup/funcup-src-docs/04-tasks/13-tasks-002-qr-coffee-platform-88-tasks.md`

Repo audited: `/Users/pa/projects/funcup`

> Legend: PASS = exists at required path; FAIL = missing at required path; PARTIAL = exists but does not meet a critical requirement explicitly stated in the task.

## Phase 1: Setup (T001–T012)

- [x] **T001** Initialize pnpm workspaces monorepo — **PASS**
  - Present: `pnpm-workspace.yaml`
- [x] **T002** Configure Turborepo — **PASS**
  - Present: `turbo.json`
- [x] **T003** Initialize `product/apps/consumer-mobile` (Expo SDK 52) — **PASS**
  - Present: `product/apps/consumer-mobile/`
- [x] **T004** Initialize `product/apps/web` (Next.js 15 App Router) — **PASS**
  - Present: `product/apps/web/`
- [x] **T005** Initialize `product/packages/shared` — **PASS (minimal)**
  - Present: `product/packages/shared/`
- [x] **T006** Install Expo Router in `product/apps/consumer-mobile` — **PASS**
  - Present: `product/apps/consumer-mobile/package.json` (`expo-router` dependency + entrypoint)
- [x] **T007** Configure NativeWind 4 + Tailwind CSS 3 in mobile — **PASS**
  - Present: `product/apps/consumer-mobile/tailwind.config.js`, `product/apps/consumer-mobile/metro.config.js`
- [x] **T008** Configure Tailwind CSS 3 + Framer Motion 11 in web — **PASS**
  - Present: `product/apps/web/tailwind.config.ts` + `framer-motion` dependency
- [x] **T009** Configure ESLint + Prettier (no-explicit-any: error) — **PASS**
  - Present: `.eslintrc.json`, `.prettierrc`, and `@typescript-eslint/no-explicit-any: "error"`
- [x] **T010** Install all mobile dependencies — **PASS**
  - Verified by successful root `pnpm install`
- [x] **T011** Install all web dependencies — **PASS**
  - Verified by successful root `pnpm install`
- [x] **T012** Create `.env.example` files — **PASS**
  - Present: `.env.example`, `product/apps/consumer-mobile/.env.example`, `product/apps/web/.env.example`

## Phase 2: Foundational (T013–T024)

- [x] **T013** `product/supabase/migrations/0001_initial_schema.sql` — **PASS**
  - Present: `product/supabase/migrations/0001_initial_schema.sql`
- [x] **T014** `product/supabase/migrations/0002_rls_policies.sql` — **PASS**
  - Present: `product/supabase/migrations/0002_rls_policies.sql`
- [x] **T015** `product/supabase/migrations/0003_functions_triggers.sql` — **PASS**
  - Present: `product/supabase/migrations/0003_functions_triggers.sql`
- [x] **T016** `product/supabase/seed.sql` — **PASS**
  - Present: `product/supabase/seed.sql`
- [x] **T017** Apply migrations locally + generate TypeScript types — **PASS (repo evidence)**
  - Evidence: `product/supabase/EVIDENCE_T017_T018.md` + `product/supabase/types/database.ts` + `pnpm supabase:types`
- [x] **T018** Enable pg_net + configure Storage buckets — **PASS (repo evidence)**
  - Evidence: `product/supabase/EVIDENCE_T017_T018.md` + `product/supabase/migrations/0004_pg_net_and_storage.sql`
- [x] **T019** `product/packages/shared/src/services/supabaseClientFactory.ts` — **PASS**
  - Present: `product/packages/shared/src/services/supabaseClientFactory.ts`
- [x] **T020** `product/apps/consumer-mobile/src/services/supabaseClient.ts` — **PASS**
  - Present: `product/apps/consumer-mobile/src/services/supabaseClient.ts`
- [x] **T021** Create Supabase server + browser clients for web — **PASS**
  - Present: `product/apps/web/src/lib/product/supabase/browserClient.ts`, `product/apps/web/src/lib/product/supabase/serverClient.ts`
- [x] **T022** Shared constants (flavorNotes, brewMethods, reputationThresholds) — **PASS**
  - Present in `product/packages/shared/src/constants/*`
- [x] **T022b** Resolve follows architecture — `uuid[]` for MVP, junction table post-MVP — **PASS**
  - Present in schema: `users.following_roaster_ids uuid[]`
- [x] **T023** `product/apps/consumer-mobile/src/app/_layout.tsx` — **PASS**
  - Present: `product/apps/consumer-mobile/src/app/_layout.tsx`
- [x] **T024** Create auth + tabs layouts (mobile + web) — **PASS**
  - Present: `product/apps/consumer-mobile/app/(auth)/_layout.tsx`, `product/apps/consumer-mobile/app/(tabs)/_layout.tsx`, `product/apps/web/app/(auth)/layout.tsx`, `product/apps/web/app/(tabs)/layout.tsx`

## Phase 3: US1 — QR Scan + Tasting Log (T025–T042)

- [x] **T025** `product/supabase/functions/scan_qr/index.ts` — **PASS**
  - Present: `product/supabase/functions/scan_qr/index.ts`
- [x] **T026** `product/supabase/functions/update_coffee_stats/index.ts` — **PASS**
  - Present: `product/supabase/functions/update_coffee_stats/index.ts`
- [x] **T027** `product/apps/consumer-mobile/app/(auth)/login.tsx` — **PASS**
  - Present: `product/apps/consumer-mobile/app/(auth)/login.tsx`
- [x] **T028** `product/apps/consumer-mobile/app/(auth)/register.tsx` — **PASS**
  - Present: `product/apps/consumer-mobile/app/(auth)/register.tsx`
- [x] **T029** `product/apps/consumer-mobile/app/(tabs)/hub/scan.tsx` — **PASS**
  - Present: `product/apps/consumer-mobile/app/(tabs)/hub/scan.tsx`
- [x] **T030** `product/packages/shared/src/hooks/useCoffeePage.ts` — **PASS**
  - Present: `product/packages/shared/src/hooks/useCoffeePage.ts`
- [x] **T031** `product/apps/consumer-mobile/app/coffee/[id]/index.tsx` — **PASS**
  - Present: `product/apps/consumer-mobile/app/coffee/[id]/index.tsx`
- [x] **T032** CoffeePageProduct.tsx — **PASS**
  - Present: `product/apps/consumer-mobile/app/coffee/[id]/CoffeePageProduct.tsx`
- [x] **T033** CoffeePageBrewing.tsx — **PASS**
  - Present: `product/apps/consumer-mobile/app/coffee/[id]/CoffeePageBrewing.tsx`
- [x] **T034** CoffeePageStory.tsx — **PASS**
  - Present: `product/apps/consumer-mobile/app/coffee/[id]/CoffeePageStory.tsx`
- [x] **T035** CoffeePageCommunity.tsx — **PASS**
  - Present: `product/apps/consumer-mobile/app/coffee/[id]/CoffeePageCommunity.tsx`
- [x] **T036** FlavorNoteSelector.tsx — **PASS**
  - Present: `product/apps/consumer-mobile/app/coffee/[id]/components/FlavorNoteSelector.tsx`
- [x] **T037** RatingInput.tsx — **PASS**
  - Present: `product/apps/consumer-mobile/app/coffee/[id]/components/RatingInput.tsx`
- [x] **T038** BrewMethodPicker.tsx — **PASS**
  - Present: `product/apps/consumer-mobile/app/coffee/[id]/components/BrewMethodPicker.tsx`
- [x] **T039** `product/apps/consumer-mobile/app/coffee/[id]/log.tsx` — **PASS**
  - Present: `product/apps/consumer-mobile/app/coffee/[id]/log.tsx`
- [x] **T040** `product/packages/shared/src/services/tastingService.ts` — **PASS**
  - Present: `product/packages/shared/src/services/tastingService.ts`
- [x] **T041** `product/apps/consumer-mobile/app/(tabs)/journal/index.tsx` — **PASS**
  - Present: `product/apps/consumer-mobile/app/(tabs)/journal/index.tsx`
- [x] **T042** `product/packages/shared/src/hooks/useJournal.ts` — **PASS**
  - Present: `product/packages/shared/src/hooks/useJournal.ts`

