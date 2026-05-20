# Implementation Plan: funcup — QR-Driven Specialty Coffee Discovery Platform

**Branch**: `002-qr-coffee-platform` | **Date**: 2026-03-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-qr-coffee-platform/spec.md`

---

## Summary

Build funcup MVP: a QR-driven specialty coffee discovery platform consisting of (1) an Expo mobile app for consumers to scan batch QR codes, log tastings, and discover coffees, and (2) a Next.js web app for verified roasters to publish coffee profiles, create batches, generate QR codes, and read consumer feedback. Both apps share a single Supabase/PostgreSQL backend with three Edge Functions (scan_qr, generate_qr, update_coffee_stats) and a 13-table schema pre-defined in Notion Data Model v3.

---

## Technical Context

**Language/Version**: TypeScript 5.x — `"strict": true` in all `tsconfig.json` files
**Primary Dependencies**:
- Mobile: Expo SDK 52+, expo-camera (QR scan), NativeWind 4, React Native Reanimated 3, TanStack Query v5, @supabase/supabase-js, MMKV (offline queue), expo-secure-store, expo-auth-session, expo-apple-authentication, expo-linking
- Web: Next.js 15 App Router, Framer Motion 11, @supabase/supabase-js, @supabase/ssr, Tailwind CSS 3, qrcode (QR generation in Edge Function)
- Shared (`/product/packages/shared`): Supabase-generated TypeScript types, TanStack Query hooks, Supabase client factory, flavor notes + brew method constants

**Storage**: Supabase/PostgreSQL (cloud, canonical), MMKV (mobile — offline tasting queue), Supabase Storage (images + QR assets)
**Testing**: Jest + React Native Testing Library (mobile), Vitest + Playwright (web); Supabase local via `supabase start`
**Target Platform**: iOS 16+, Android API 31+ (Expo managed workflow + EAS Build); Web — all modern browsers (Next.js SSR)
**Project Type**: Monorepo — consumer mobile app + roaster web dashboard + shared packages (Turborepo + pnpm workspaces)
**Performance Goals**:
- Coffee Page load ≤ 5 s on standard 4G connection (SC-003)
- Full QR scan → Coffee Page ≤ 5 s (FR-002)
- Offline tasting sync within 30 s of reconnect (SC-005)
- Tasting journal scrollable up to 500 entries without lag (SC-007)
- `coffee_stats` reflect new tastings within 5 min (SC-008)

**Constraints**:
- RLS enabled on all Supabase tables; no publicly writable table without a policy
- Offline-capable mobile: previously cached pages readable; tastings queued locally via MMKV
- Animations ≤ 400 ms, 60 fps on Snapdragon 6xx; `prefers-reduced-motion` respected
- TypeScript strict; `any` banned except third-party wrappers (with inline `// TODO: type this`)
- Supabase-generated types are canonical; hand-written entity interfaces are not permitted
- No `console.log` in production; environment secrets never in client bundles

**Scale/Scope**: 13 DB tables, 3 Edge Functions, ~15 mobile screens, ~10 web screens, MVP launch

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. Mobile-First, Coffee-First** | ✅ PASS | Expo is the consumer product; Next.js is the roaster product. Coffee domain language enforced throughout spec (origin, roast, tasting notes, brew method, rating). No generic CRUD labels in user-facing copy. |
| **II. Shared Data Contract** | ✅ PASS | Supabase/PostgreSQL is single source of truth. `supabase gen types typescript` generates canonical types in `/product/packages/shared/src/types/`. Migrations versioned in `/product/supabase/migrations/` before any client PR. |
| **III. Dual-Product Architecture** | ✅ PASS | Expo (consumers) + Next.js (roasters) share Supabase backend. UX, navigation, and features are designed independently. Platform-specific code isolated via `.native.tsx` / `.web.tsx` or `Platform.select()`. |
| **IV. Offline-Aware UX** | ✅ PASS | FR-009 mandates offline queue for tastings. US-5 (P5) covers full offline scenario. MMKV + TanStack Query mutation cache + `NetInfo` sync manager. Conflict resolution: server `updated_at` last-write-wins. |
| **V. Animation with Intent** | ✅ PASS | React Native Reanimated 3 (mobile) + Framer Motion 11 (web). All animations ≤ 400 ms. `prefers-reduced-motion` suppresses decorative animations. 60 fps target on mid-range Android. Entry animation protected (Principle IX). |
| **VI. Type-Safe Across the Stack** | ✅ PASS | TypeScript strict mode in all packages. Supabase-generated types as canonical entity definitions. `any` policy enforced via ESLint rule. |
| **VII. QR-First Interaction** | ✅ PASS | QR scanner is primary entry point (FR-001); Coffee Page loads within 5 s (FR-002). Scan Coffee is visually dominant CTA in Coffee Hub (FR-006). All mobile features designed around the scan moment. |
| **VIII. Separation of Roles** | ✅ PASS | FR-021 enforces: roasters write product data, consumers write sensory data. RLS policies enforce this at DB level. Verified-roaster check in Edge Functions + Supabase policies. |
| **IX. Entry Interaction — Tap to Bean** | ✅ PASS | FR-012 protects the splash screen (fingerprint → confetti → bean). It is the **app-open** sequence only—not replayed on every route. Phase 010 tracks entry UX hardening; sequence order remains constitution-protected. |

**Gate result: ALL PASS — proceed to Phase 0.**

---

## Project Structure

### Documentation (this feature)

```text
specs/002-qr-coffee-platform/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── edge-function-scan-qr.md
│   ├── edge-function-generate-qr.md
│   ├── edge-function-update-coffee-stats.md
│   ├── qr-url-contract.md
│   └── rls-policies.md
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
product/apps/
  mobile/                          # Expo app — consumers
    src/
      app/                         # Expo Router (file-based)
        (auth)/                    # login.tsx, register.tsx
        (tabs)/                    # Tab navigator root
          hub/                     # Coffee Hub: scan, discover coffees, discover roasters, learn
          journal/                 # Tasting journal + offline queue indicator
          profile/                 # Consumer profile + sensory reputation level
        coffee/[id]/               # Coffee Page (public — no auth required to view)
        scan/                      # QR scanner screen (deep-linked from hub)
      components/                  # Shared UI: CoffeeCard, TastingForm, FlavorNoteSelector,
                                   # BrewMethodPicker, RatingInput, OfflineBanner
      hooks/                       # useOfflineQueue, useQRScanner, useReputationLevel,
                                   # useCoffeePage, useTastingLog
      services/                    # supabaseClient.ts, offlineSyncManager.ts
    content/
      learn/                       # MDX files for Learn Coffee section (static, git-managed)
    .env.example

  web/                             # Next.js App Router — roasters
    app/
      (auth)/                      # login/page.tsx, register/page.tsx, pending/page.tsx
      dashboard/                   # Overview + quick stats
      coffees/                     # List + create/edit coffee profiles
        [id]/                      # Edit coffee
      batches/[coffeeId]/          # Batch list + create batch + QR download
      analytics/[batchId]/         # Consumer feedback: ratings, flavor notes, reviews
    components/                    # QRDownloadButton, FeedbackChart, FlavorNoteFrequency,
                                   # RatingDistribution, BatchCard
    lib/                           # supabaseClient.ts (server + client), auth helpers
    content/
      learn/                       # MDX files for Learn Coffee (web mirror)
    .env.example

product/packages/
  shared/                          # Shared across apps — no platform-specific imports
    src/
      types/                       # database.types.ts (supabase gen types output — DO NOT EDIT)
      hooks/                       # useCoffees, useRoasters, useBatches, useCoffeeLogs
      services/                    # supabaseClientFactory.ts
      constants/
        flavorNotes.ts             # Flavor notes taxonomy (36 tags, 6 categories)
        brewMethods.ts             # Predefined brew method list
        reputationThresholds.ts    # Scoring constants for sensory reputation

product/supabase/
  migrations/                      # Versioned SQL — applied before any client PR
    0001_initial_schema.sql
    0002_rls_policies.sql
    0003_seed_taxonomy.sql
  functions/
    scan_qr/index.ts               # Resolve hash → batch + coffee + stats
    generate_qr/index.ts           # Create hash + store QR assets + write qr_codes row
    update_coffee_stats/index.ts   # Recalculate coffee_stats + update sensory reputation
  seed.sql                         # flavor_notes, brew_methods, test roaster + coffees

turbo.json
pnpm-workspace.yaml
```

**Structure Decision**: Monorepo (Option 3 extended) with Turborepo + pnpm workspaces. `/product/apps/consumer-mobile` and `/product/apps/web` are fully independent products; `/product/packages/shared` holds only platform-agnostic code. `/supabase` is at repo root per Supabase CLI convention.

---

## Complexity Tracking

*No constitution violations — this section is not required.*
