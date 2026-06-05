# Research: funcup MVP — QR-Driven Coffee Platform

**Feature**: `002-qr-coffee-platform` | **Date**: 2026-03-25

All NEEDS CLARIFICATION items from Technical Context resolved below.

---

## 1. Monorepo Tooling

**Decision**: Turborepo + pnpm workspaces

**Rationale**: Turborepo provides incremental build/lint/type-check caching with minimal configuration — ideal for two apps + one shared package. pnpm workspaces handle module resolution cleanly across `product/apps/*` and `product/packages/*`. Combined overhead is low; setup is a single `turbo.json` + `pnpm-workspace.yaml`.

**Alternatives considered**:
- Nx — more powerful (code generators, affected analysis), but significant configuration overhead for a two-app monorepo at MVP scale.
- Plain npm/yarn workspaces — no build caching; every `tsc` and `lint` runs from scratch.

**Configuration sketch**:
```json
// turbo.json
{
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "typecheck": { "dependsOn": ["^typecheck"] },
    "lint": {},
    "dev": { "cache": false, "persistent": true }
  }
}
```

---

## 2. QR Scanning Library

**Decision**: `expo-camera` with `useCameraPermissions` + built-in `BarcodeScanner` (Expo SDK 52+)

**Rationale**: Expo managed workflow — `expo-camera` is first-party, maintained in SDK, requires no native config changes. The `Camera` component with `barCodeScannerSettings={{ barCodeTypes: ['qr'] }}` handles QR scanning natively on both iOS and Android. SDK 52 integrates barcode scanning directly into the camera API (the standalone `expo-barcode-scanner` is deprecated).

**Alternatives considered**:
- `react-native-vision-camera` — more powerful (60fps, custom frame processors), but requires bare workflow or complex EAS config plugin. Over-engineered for single-purpose QR scanning.
- `expo-barcode-scanner` (standalone) — deprecated in Expo SDK 52; no longer maintained separately.

**Scan-to-URL flow**: Camera detects QR → extracts URL `https://funcup.app/q/{hash}` → app strips hash → calls `scan_qr` Edge Function with `{ hash }`.

---

## 3. Offline Queue Mechanism

**Decision**: MMKV for local persistence + TanStack Query v5 mutation caching + custom `OfflineSyncManager`

**Rationale**:
- MMKV is synchronous and extremely fast for mobile key-value storage (~30× faster than AsyncStorage). Used to persist the pending tastings queue across app restarts.
- TanStack Query v5 handles retry logic, stale/fresh state, and mutation queuing natively.
- A lightweight `OfflineSyncManager` wraps `@react-native-community/netinfo` to detect connectivity changes and flush the MMKV queue to Supabase.

**Queue data structure** (stored in MMKV under key `pending_tastings`):
```typescript
type PendingTasting = {
  localId: string;        // uuid generated locally
  batchId: string;
  payload: TastingInsert; // full insert payload
  createdAt: string;      // ISO 8601
  retryCount: number;
};
```

**Conflict resolution**: Server-side `updated_at` last-write-wins for ratings; union for flavor note collections (constitution Principle IV). Synced tastings receive a `synced_at` timestamp.

**Queue size limit**: If `pending_tastings.length > 50`, oldest entries are preserved and user is notified (spec edge case). The 50-entry cap prevents unbounded local storage growth.

**Alternatives considered**:
- WatermelonDB — full reactive offline DB, complex setup, overkill for a queue of tasting payloads.
- expo-sqlite — heavier than MMKV for simple key-value queue; sync logic would need to be built from scratch anyway.
- AsyncStorage — deprecated performance issues; synchronous access not possible.

---

## 4. Sensory Reputation Algorithm

**Decision**: Rule-based point accumulation, evaluated server-side after each tasting sync via `update_coffee_stats` Edge Function (which also calls `update_user_reputation` DB function).

**Scoring rules**:

| Signal | Points | Cap |
|--------|--------|-----|
| Per tasting logged | +1 | — |
| Tasting has ≥ 3 distinct flavor note tags | +2 bonus | — |
| Tasting has review text ≥ 50 characters | +1 bonus | — |
| Unique flavor tag vocabulary milestone (10 / 20 / 30 unique tags reached) | +10 each | 30 total |

**Level thresholds**:
- `beginner`: 0–29 points
- `advanced`: 30–99 points
- `expert`: 100+ points

**Implementation**: After a tasting is synced to Supabase, `update_coffee_stats` Edge Function calls a PostgreSQL function `recalculate_user_reputation(user_id)` that recomputes the score from `coffee_logs` + `tasting_notes` + `reviews` and updates `users.sensory_level`. Level changes are applied silently — no notification, toast, or gate (constitution Principle VII + spec FR-008, US-4 AC-2).

**Why server-side**: Prevents client-side manipulation of reputation level. Score is always derived from server-authoritative data.

**Alternatives considered**:
- ML model (sentiment analysis on review text) — post-MVP; requires training data that doesn't exist at launch.
- Fixed tasting count only (e.g., Advanced at 10, Expert at 50) — ignores note quality signal; too gameable.

---

## 5. Flavor Notes Taxonomy

**Decision**: 36 predefined tags in 6 categories, stored in the `flavor_notes` table (seeded via `product/supabase/seed.sql`). Free-text field available alongside tags.

| Category | Tags |
|----------|------|
| **Fruity** | citrus, lemon, orange, berry, raspberry, blueberry, stone-fruit, peach, cherry, tropical, mango, pineapple, apple-pear, dried-fruit, raisin |
| **Floral** | jasmine, rose, chamomile, lavender |
| **Sweet** | chocolate, dark-chocolate, caramel, honey, vanilla, brown-sugar, molasses |
| **Nutty** | almond, hazelnut, walnut, peanut |
| **Spice** | cinnamon, clove, black-pepper |
| **Savory / Other** | cedar, tobacco, earthy, herbal, green-tea |

**Rationale**: Based on the SCA Coffee Taster's Flavor Wheel, trimmed to 36 terms that are accessible to non-experts (removing highly technical descriptors). 6 categories cover the primary sensory dimensions of specialty coffee without overwhelming new users.

**Alternatives considered**:
- Full SCA/SCAA flavor wheel (84+ terms) — too granular; intimidates beginners; contrary to the warm, accessible brand voice (Principle I).
- Pure free-text only — reduces discovery and makes reputation scoring/analytics (top flavor notes) unreliable.

---

## 6. QR Code Generation (Edge Function)

**Decision**: `qrcode` npm package (generates SVG string) inside Supabase Edge Function (Deno runtime). PNG generated via `resvg-js` (Deno-compatible WASM build) from the SVG. Both assets stored in Supabase Storage under `qr/{batch_id}/`.

**QR hash**: UUID v4 generated by the Edge Function using `crypto.randomUUID()`. Stored in `qr_codes.hash`. Permanent — never regenerated.

**URL encoded in QR**: `https://funcup.app/q/{hash}` — a plain HTTPS URL readable by any QR scanner, not just the funcup app.

**Asset names**:
- SVG: `qr/{batch_id}/qr.svg`
- PNG: `qr/{batch_id}/qr.png`

Signed download URLs (1-hour expiry) returned to roaster for download.

**Alternatives considered**:
- External QR API (e.g., api.qrserver.com) — external network dependency from Edge Function; latency; third-party data exposure.
- Client-side QR generation (react-native-qrcode-svg / qrcode.react) — loses the server-side guarantee that the hash is registered in `qr_codes` before the QR is shown. Risk: roaster prints QR before it's saved to DB.

---

## 7. Analytics Aggregation

**Decision**: Direct recalculation in `update_coffee_stats` Edge Function, called after each tasting POST.

**Flow**:
1. Consumer submits tasting → mobile app POSTs to Supabase (inserts `coffee_logs` + `tasting_notes` + optional `reviews` row).
2. A PostgreSQL trigger on `coffee_logs` INSERT calls `pg_net.http_post` to invoke the `update_coffee_stats` Edge Function with `{ batch_id }`.
3. Edge Function runs SQL aggregations:
   - `COUNT(*) + AVG(rating) + COUNT per rating` from `coffee_logs WHERE batch_id = $1`
   - Top 10 `flavor_notes` by frequency from `tasting_notes JOIN flavor_notes`
4. UPSERTs into `coffee_stats`.
5. Calls `recalculate_user_reputation(user_id)`.

**Why `pg_net` trigger**: Keeps the tasting write path fast (no blocking); stats update is async but near-real-time (satisfies SC-008: within 5 minutes).

**Alternatives considered**:
- Scheduled cron (every 5 min) — simpler but introduces up to 5-min delay even for the first tasting; doesn't satisfy SC-008 reliably.
- Supabase Realtime aggregation — Realtime broadcasts row changes but has no native aggregation; client would need to compute stats, violating server-authority principle.

---

## 8. Authentication Flow

**Decision**: Supabase Auth for all authentication. Platform-specific session handling.

**Mobile (Expo)**:
- Email/password: `supabase.auth.signInWithPassword()` — straightforward.
- Google OAuth: `expo-auth-session` + Supabase Auth Google provider. Uses Supabase's PKCE flow with `makeRedirectUri('expo', { scheme: 'funcup' })`.
- Apple Sign-In: `expo-apple-authentication` native module → passes Apple credential to `supabase.auth.signInWithIdToken({ provider: 'apple', token })`.
- Session persistence: `@supabase/supabase-js` with `AsyncStorage` adapter pointing to `expo-secure-store` (encrypted, persists across app restarts).

**Web (Next.js)**:
- Email/password + Google OAuth: `@supabase/ssr` with server-side session handling via cookies.
- `createServerClient` in Server Components / Route Handlers; `createBrowserClient` in Client Components.
- Apple OAuth on web: via Supabase Auth Apple provider (standard OAuth redirect flow).

**Alternatives considered**:
- Firebase Auth — external vendor dependency, cost, diverges from "Supabase is single source of truth."
- Auth0 — overkill for MVP; additional cost layer.

---

## 9. Static Content for Learn Coffee

**Decision**: MDX files checked into the repository (`product/apps/consumer-mobile/content/learn/` + `product/apps/web/content/learn/`). Rendered with `@expo/mdx` (mobile) and `@next/mdx` (web).

**Rationale**: The spec explicitly states "Learn Coffee section in MVP contains static or manually curated content; dynamic CMS is post-MVP." MDX gives content authors markdown with component embedding; no database queries; zero infrastructure cost; content versioned in git.

**Structure**:
```
content/learn/
  origins-101.mdx
  processing-methods.mdx
  brew-guide-v60.mdx
  how-to-taste-coffee.mdx
```

**Alternatives considered**:
- Supabase `learn_articles` table — requires a CMS interface to edit; out of MVP scope.
- Contentful / Sanity — external CMS, monthly cost, integration work; flagged as post-MVP.

---

## 10. Image Handling

**Decision**: `expo-image` (mobile) + `next/image` (web) + Supabase Storage CDN URLs. No images bundled in the app binary.

**Supabase Storage buckets**:
- `roasters/` — roaster logos (`roasters/{roaster_id}/logo.jpg`)
- `coffees/` — coffee cover images (`coffees/{coffee_id}/cover.jpg`)
- `users/` — consumer avatars (`users/{user_id}/avatar.jpg`)
- `qr/` — QR assets (`qr/{batch_id}/qr.svg`, `qr/{batch_id}/qr.png`)

**Access control**: `roasters/`, `coffees/`, and `qr/` buckets are public-read (images are non-sensitive). `users/` bucket is private; avatars served via signed URLs. RLS on storage objects mirrors table-level policies.

**Image upload**: Roaster logo and coffee images uploaded from the Next.js web app via `supabase.storage.upload()`. Avatar upload from the mobile app.

**Alternatives considered**:
- Cloudinary — external CDN cost; redundant given Supabase Storage CDN is included.
- Bundled assets — violates constitution constraint ("never bundled into app binary").

---

## 11. Consumer Follows

**Finding**: FR-007 requires consumers to follow roasters, and the array-based MVP shortcut does not scale well for analytics, RLS clarity, or future roaster-facing follower insights.

**Resolution**: Use a dedicated junction table `user_roaster_follows` with `(user_id, roaster_id)` as the composite primary key plus `source`, `created_at`, and `last_seen_at`.

**Recommendation**: Prefer the junction table as the implemented model. It is the better long-term fit for growth, analytics, and product extensions while preserving a single auth/user root.

---

## Summary Table

| Item | Decision | Key Dependency |
|------|----------|----------------|
| Monorepo tooling | Turborepo + pnpm workspaces | `turbo.json` + `pnpm-workspace.yaml` |
| QR scanning | `expo-camera` barcode scanner | Expo SDK 52+ |
| Offline queue | MMKV + TanStack Query + `OfflineSyncManager` | `netinfo`, `expo-secure-store` |
| Sensory reputation | Rule-based scoring, server-side | `recalculate_user_reputation()` DB fn |
| Flavor notes | 36 tags / 6 categories | Seeded in `flavor_notes` table |
| QR generation | `qrcode` + `resvg-js` in Edge Function | Deno WASM, Supabase Storage |
| Analytics | pg_net trigger → `update_coffee_stats` EF | `pg_net` extension enabled |
| Auth | Supabase Auth + expo-auth-session + @supabase/ssr | Apple: `expo-apple-authentication` |
| Learn Coffee | MDX files in repo | `@expo/mdx`, `@next/mdx` |
| Images | `expo-image` / `next/image` + Supabase Storage CDN | 4 Storage buckets |
| Consumer follows | `user_roaster_follows` junction table | Runtime source of truth |
