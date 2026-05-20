---
# yaml-language-server: $schema=schemas/page.schema.json
Object type:
    - Page
Backlinks:
    - funcup-the-first-structured-feedback-loop-4-co.md
Creation date: "2026-03-25T21:05:00Z"
Created by:
    - Pa Koolig
Emoji: ✅
id: bafyreigiwlf3jaba2v6dg3szq45tqbmfad756kzb3ck2dhw4hx5l2sgazu
---
# 13 Tasks — 002-qr-coffee-platform (88 tasks)   
## Status   
Wygenerowane: 2026-03-25 \| Branch: `main` \| Constitution Check: **9/9 PASS**   
Source of truth: `.specify/features/002-qr-coffee-platform/tasks.md`   
- Phase 004 (US2, T043–T053) **SIGN-OFF: PASS** (2026-04-08)  
- Evidence: `pnpm -C product/apps/web test:generate-qr && pnpm -C product/apps/web test:e2e` -> PASS (generate_qr + E2E happy path dashboard -> QR -> hash resolve)  
- Phase 005 (US3, T054–T063) **SIGN-OFF: PASS** (2026-04-08)  
- Evidence: `pnpm -C product/packages/shared test && pnpm -C product/packages/shared typecheck && pnpm -C product/apps/consumer-mobile typecheck` -> PASS (discovery/follow hooks + US3 integration smoke)  
- Evidence: `pnpm -C product/apps/web test:generate-qr && pnpm -C product/apps/web test:e2e` -> PASS (US2 regression gate green after US3 changes)  
- Phase 006 (US4, T064–T068) **SIGN-OFF: PASS** (2026-04-08)  
- Evidence: `pnpm -C product/packages/shared test && pnpm -C product/packages/shared typecheck && pnpm -C product/apps/consumer-mobile typecheck` -> PASS (reputation progression integration + anti-gamification guards)  
- Evidence: `pnpm -C product/apps/web test:generate-qr && pnpm -C product/apps/web test:e2e` -> PASS (US2 regression gate green after US4 changes)  
- Phase 007 (US5, T069–T074) **SIGN-OFF: PASS** (2026-04-08)  
- Evidence: `pnpm -C product/packages/shared test && pnpm -C product/packages/shared typecheck && pnpm -C product/apps/consumer-mobile typecheck` -> PASS (offline queue + reconnect sync + conflict resolution coverage)  
- Evidence: `pnpm -C product/apps/web test:generate-qr && pnpm -C product/apps/web test:e2e` -> PASS (US2 regression gate green after US5 changes + hardening rerun)  
- Phase 008 (US6, T075–T080) **SIGN-OFF: PASS** (2026-04-10)  
- Evidence: `pnpm -C product/packages/shared test && pnpm -C product/packages/shared typecheck && pnpm -C product/apps/consumer-mobile typecheck` -> PASS (roaster analytics aggregates + `roasterBatchAnalytics.test.ts` US6/T080)  
- Evidence: `pnpm -C product/apps/web test:generate-qr && pnpm -C product/apps/web test:e2e` -> PASS przy lokalnym Supabase (`supabase start`, klucze w `product/apps/web/.env.local`; Kong: `[functions.generate_qr] verify_jwt = false` + naglowek `apikey` w testach) — regresja US2 po US6  
- Phase 009 (Polish, T081–T088) **SIGN-OFF: PASS** (2026-04-10)  
- Evidence (quality gate): `pnpm -C product/packages/shared test && pnpm -C product/packages/shared typecheck && pnpm -C product/apps/consumer-mobile typecheck` -> PASS (19 testów Vitest; m.in. discovery przez `qr_codes`, Polish UX)  
- Evidence (US2 regression): `pnpm -C product/apps/web test:generate-qr` -> PASS; `WEB_BASE_URL=http://127.0.0.1:3000 pnpm -C product/apps/web test:e2e` -> PASS przy równoległym `next dev -p 3000` (happy path wymaga działającego serwera web)  
- Evidence (hardening / perf baseline web): `pnpm -C product/apps/web build` -> PASS (`next build`, bundle report w logu)  
 --- 
## Podsumowanie   
|      Faza |                     User Story |            Taski |
|:----------|:-------------------------------|:-----------------|
|   Phase 1 |               Setup (Monorepo) |   T001–T012 (12) |
|   Phase 2 |                   Foundational |   T013–T024 (12) |
|   Phase 3 |          US1 — QR Scan + Log 🎯 |   T025–T042 (18) |
|   Phase 4 |     US2 — Roaster Publishes QR |   T043–T053 (11) |
|   Phase 5 |   US3 — Coffee Hub + Discovery |   T054–T063 (10) |
|   Phase 6 |       US4 — Sensory Reputation |    T064–T068 (5) |
|   Phase 7 |          US5 — Offline Tasting |    T069–T074 (6) |
|   Phase 8 |        US6 — Roaster Analytics |    T075–T080 (6) |
|   Phase 9 |                         Polish |    T081–T088 (8) |
| **Total** |                                |     **88 tasks** |

 --- 
## MVP Scope (rekomendacja Spec Kit)   
Phases 1–3 only (T001–T042) — 42 tasks.   
Dostarcza north star flow end-to-end: consumer scans QR → Coffee Page → tasting log → journal.   
Demonstratable bez roaster web app (seed data wystarczy).   
 --- 
## Phase 1: Setup (T001–T012)   
- [x] T001 Initialize pnpm workspaces monorepo   
- [x] T002 Configure Turborepo   
- [x] T003 [P] Initialize `product/apps/consumer-mobile` (Expo SDK 52)   
- [x] T004 [P] Initialize `product/apps/web` (Next.js 15 App Router)   
- [x] T005 [P] Initialize `product/packages/shared`   
- [x] T006 Install Expo Router in `product/apps/consumer-mobile`   
- [x] T007 [P] Install NativeWind 4 + Tailwind CSS 3 in mobile   
- [x] T008 [P] Configure Tailwind CSS 3 + Framer Motion 11 in web   
- [x] T009 [P] Configure ESLint + Prettier (no-explicit-any: error)   
- [x] T010 [P] Install all mobile dependencies   
- [x] T011 [P] Install all web dependencies   
- [x] T012 [P] Create `.env.example` files   
 --- 
## Phase 2: Foundational (T013–T024)   
⚠️ CRITICAL: No user story work can begin until this phase is complete.   
- [x] T013 Write `product/supabase/migrations/0001\_initial\_schema.sql` — 13 tables + enums   
- [x] T014 Write `product/supabase/migrations/0002\_rls\_policies.sql` — RLS on all 13 tables   
- [x] T015 Write `product/supabase/migrations/0003\_functions\_triggers.sql` — updated\_at, handle\_new\_user, recalculate\_user\_reputation, notify\_update\_coffee\_stats   
- [x] T016 Write `product/supabase/seed.sql` — 36 flavor\_notes, 10 brew\_methods, test roaster + coffee + batch   
- [x] T017 Apply migrations locally + generate TypeScript types   
- [x] T018 [P] Enable pg\_net + configure Storage buckets   
- [x] T019 [P] Create `product/packages/shared/src/services/supabaseClientFactory.ts`   
- [x] T020 Create `product/apps/consumer-mobile/src/services/supabaseClient.ts`   
- [x] T021 [P] Create Supabase server + browser clients for web   
- [x] T022 [P] Create shared constants (flavorNotes, brewMethods, reputationThresholds)   
- [x] T022b [P] Resolve follows architecture — `uuid[]` for MVP, junction table post-MVP   
- [x] T023 Create `product/apps/consumer-mobile/src/app/\_layout.tsx` (root layout)   
- [x] T024 [P] Create auth + tabs layouts (mobile + web)   
 --- 
## Phase 3: US1 — QR Scan + Tasting Log 🎯 (T025–T042)   
- [x] T025 [P] Implement `product/supabase/functions/scan\_qr/index.ts` (p95 < 500ms)   
- [x] T026 Implement `product/supabase/functions/update\_coffee\_stats/index.ts`   
- [x] T027 [P] Create `product/apps/consumer-mobile/app/(auth)/login.tsx` (email + Google + Apple)   
- [x] T028 [P] Create `product/apps/consumer-mobile/app/(auth)/register.tsx`   
- [x] T029 Create `product/apps/consumer-mobile/app/(tabs)/hub/scan.tsx` (QR Scanner)   
- [x] T030 Create `product/packages/shared/src/hooks/useCoffeePage.ts`   
- [x] T031 Create `product/apps/consumer-mobile/app/coffee/[id]/index.tsx` (Coffee Page — 4 sections)   
- [x] T032 [P] CoffeePageProduct.tsx   
- [x] T033 [P] CoffeePageBrewing.tsx   
- [x] T034 [P] CoffeePageStory.tsx   
- [x] T035 [P] CoffeePageCommunity.tsx   
- [x] T036 [P] FlavorNoteSelector.tsx   
- [x] T037 [P] RatingInput.tsx   
- [x] T038 [P] BrewMethodPicker.tsx   
- [x] T039 Create `product/apps/consumer-mobile/app/coffee/[id]/log.tsx` (Tasting Log screen)   
- [x] T040 Create `product/packages/shared/src/services/tastingService.ts`   
- [x] T041 Create `product/apps/consumer-mobile/app/(tabs)/journal/index.tsx`   
- [x] T042 Create `product/packages/shared/src/hooks/useJournal.ts`   
 --- 
## Phase 4: US2 — Roaster Publishes QR (T043–T053)   
- [x] T043 Implement `product/supabase/functions/generate\_qr/index.ts`   
- [x] T044 [P] `product/apps/web/app/(auth)/login/page.tsx`   
- [x] T045 [P] `product/apps/web/app/(auth)/register/page.tsx`   
- [x] T046 [P] `product/apps/web/app/(auth)/pending/page.tsx`   
- [x] T047 `product/apps/web/app/dashboard/coffees/new/page.tsx`   
- [x] T048 `product/apps/web/app/dashboard/coffees/[id]/page.tsx`   
- [x] T049 `product/apps/web/app/dashboard/coffees/[id]/batches/new/page.tsx`   
- [x] T050 `product/apps/web/app/dashboard/coffees/[id]/batches/[batchId]/page.tsx`   
- [x] T051 `product/apps/web/app/dashboard/coffees/page.tsx` (coffee list)   
- [x] T052 [P] QRDownloadButton component (PNG + SVG)   
- [x] T053 [P] useRoasterCoffees + useCreateBatch hooks   
 --- 
## Phase 5: US3 — Coffee Hub + Discovery (T054–T063)   
- [x] T054 `product/apps/consumer-mobile/app/(tabs)/hub/index.tsx` (Coffee Hub — 4 sections)   
- [x] T054b [P] Scan Coffee visually dominant (min 40% screen, primary CTA per Founding Philosophy)   
- [x] T055 [P] DiscoverCoffees tab component   
- [x] T056 [P] DiscoverRoasters tab component   
- [x] T057 RoasterProfile screen   
- [x] T058 [P] useDiscoverCoffees hook   
- [x] T059 [P] useDiscoverRoasters hook   
- [x] T060 useFollowRoaster hook + follow action   
- [x] T061 [P] LearnCoffee tab component   
- [x] T062 LearnArticle screen   
- [x] T063 MDX article content (3 seed articles)   
 --- 
## Phase 6: US4 — Sensory Reputation (T064–T068)   
- [x] T064 Expose reputation level in user profile screen   
- [x] T065 Expand flavor note selector per reputation level (silent)   
- [x] T066 Expert label in Community section (subtle)   
- [x] T067 Integration test: reputation advances silently   
- [x] T068 Guard: no progress bar, no unlock message, no notification   
 --- 
## Phase 7: US5 — Offline Tasting (T069–T074)   
- [x] T069 MMKV offline queue implementation   
- [x] T070 NetInfo connectivity listener   
- [x] T071 Offline-aware useCoffeePage (staleTime: Infinity)   
- [x] T072 Sync on reconnect — flush queue to tastingService   
- [x] T073 Conflict resolution (last-write-wins for ratings)   
- [x] T074 Integration test: airplane mode → queue → sync within 30s   
 --- 
## Phase 8: US6 — Roaster Analytics (T075–T080)
- [x] T075 `product/apps/web/dashboard/analytics/[batchId]/page.tsx`
- [x] T076 AnalyticsSummary component (total tastings, avg rating, distribution)
- [x] T077 TopFlavorNotes component
- [x] T078 BrewMethodFilter component
- [x] T079 useRoasterAnalytics hook
- [x] T080 Integration test: 5 mock tastings → stats correct → filter works
 --- 
## Phase 9: Polish (T081–T088)   
- [x] T081 Error boundary + global error states (mobile)   
- [x] T082 Loading skeletons for Coffee Page + Hub   
- [x] T083 Empty states for Journal + Discovery   
- [x] T084 Deep link handling (web: `/q/{hash}` → mobile: funcup://q/{hash})   
- [x] T085 Accessibility audit (mobile + web)   
- [x] T086 Performance audit (JS bundle size, image optimization)   
- [x] T087 EAS Build configuration (production profile)   
- [x] T088 Final QA checklist   
 --- 
## Independent Test Criteria per Story   
| Story |                                                                   Co weryfikować |
|:------|:---------------------------------------------------------------------------------|
|   US1 |                 Seeded QR → Coffee Page 4 sections → tasting log → journal entry |
|   US2 |         Web login → create coffee → create batch → QR downloaded → hash resolves |
|   US3 |               5 seeded coffees browsable, roaster profile + follow, MDX articles |
|   US4 |           Test account tastings advance level silently; Expert label w Community |
|   US5 |                   Airplane mode → cached page → tasting queued → sync within 30s |
|   US6 |                    5 mock tastings → stats displayed → brew method filter działa |

### Weryfikacja kryteriów (Independent Test Criteria) — stan repozytorium

Poniżej: co jest **pokryte testami automatycznymi**, co **wymaga smoke manualnego**, oraz **rozjazdy** względem opisu w tabeli.

| Story | Ocena | Uzasadnienie |
|:------|:------|:-------------|
| **US1** | Częściowo | **Seed:** `product/supabase/seed.sql` — jeden hash QR (`11111111-1111-1111-1111-111111111111`), jedna kawa Demo. **UI:** Coffee Page ma cztery sekcje (`CoffeePageProduct`, `CoffeePageBrewing`, `CoffeePageStory`, `CoffeePageCommunity` w `product/apps/consumer-mobile/app/coffee/[id]/`). **Tasting log / journal:** przepływ jest w kodzie (`log.tsx`, `useJournal`); **brak** jednego zautomatyzowanego E2E mobile od skanu do wpisu w journalu. |
| **US2** | Tak | **E2E:** `product/apps/web/tests/us2-happy-path.e2e.spec.ts` — login → nowa kawa → batch → pobranie PNG → hash → `/q/{hash}` rozwiązuje kawę i batch. **API:** `product/apps/web/tests/generate-qr.spec.ts` — `generate_qr` 201/200/404. |
| **US3** | Częściowo | **Discover / follow:** `product/packages/shared/src/hooks/us3IntegrationSmoke.test.ts` (mock Supabase: lista roasterów + follow). **Learn:** 3 artykuły seed w `product/apps/consumer-mobile/src/content/learn/articles.ts` (zgodnie z T063 — „3 seed articles”, nie pięć kaw). **„5 seeded coffees”:** w `seed.sql` jest **jedna** kawa z QR; kryterium „5” nie jest spełnione przez obecny seed — discovery pokazuje kawy z `qr_codes` (może być mniej niż 5 bez rozszerzenia seeda). Profil roastera: ekran `product/apps/consumer-mobile/app/roaster/[id]/index.tsx` (manual smoke). |
| **US4** | Częściowo | **Logika:** `product/packages/shared/src/hooks/reputation.integration.test.ts` — progi poziomów, rozszerzanie flavor notes bez fanfar, `hasExpertBadge`, `silentReputationUi`. **UI „Expert”:** `CoffeePageCommunity` (etykieta przy odpowiednim `reputationScore`). **Brak** automatycznego testu „konto po serii tastings w DB przechodzi poziom” end-to-end. |
| **US5** | Częściowo | **Kolejka offline:** `product/packages/shared/src/services/offlineTastingQueue.test.ts`, `offlineTasting.integration.test.ts` — enqueue, flush, budżet czasu sync w teście integracyjnym. **Brak** E2E z prawdziwym airplane mode / NetInfo na urządzeniu; cache Coffee Page (`staleTime: Infinity` w `useCoffeePage`) wymaga weryfikacji manualnej. |
| **US6** | Tak | **Unit:** `product/packages/shared/src/analytics/roasterBatchAnalytics.test.ts` — dokładnie 5 mock logów, agregaty (średnia, rozkład), top flavor notes, filtr metody parzenia (`filterLogsByBrewMethod`, `brewMethodsPresentInLogs`). |

**Podsumowanie:** US2 i US6 mają najsilniejsze pokrycie automatyczne zgodne z tabelą. US1, US3, US4, US5 są **częściowo** potwierdzone w repo; pełna zgodność z opisem „5 kaw” (US3) i pełny łańcuch US1 wymaga albo rozszerzenia seeda / testów, albo rejestracji smoke QA poza CI.

