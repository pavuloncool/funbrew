# Quickstart: funcup Development Setup

**Feature**: `002-qr-coffee-platform` | **Date**: 2026-03-25

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 22+ | https://nodejs.org |
| pnpm | 9+ | `npm i -g pnpm` |
| Supabase CLI | latest | `brew install supabase/tap/supabase` |
| Expo CLI / EAS | latest | `pnpm add -g expo-cli eas-cli` |
| Docker | latest | Required for `supabase start` |
| iOS Simulator | Xcode 16+ | Mac only |
| Android Emulator | Android Studio | API 31+ |

---

## 1. Clone & Install

```bash
git clone <repo-url> funcup
cd funcup
pnpm install          # installs all workspaces
```

---

## 2. Supabase Local Setup

```bash
# Start local Supabase (PostgreSQL + Auth + Storage + Edge Functions)
supabase start

# Apply all migrations (creates tables, RLS policies, triggers, enums)
supabase db push

# Seed taxonomy data (flavor_notes, brew_methods) + test fixtures
supabase db seed

# Generate TypeScript types from the live schema
supabase gen types typescript --local \
  > product/packages/shared/src/types/database.types.ts
```

After `supabase start`, note the printed output — you'll need:
- **API URL** → `NEXT_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL`
- **anon key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (Edge Functions only — never in client bundles)

---

## 3. Environment Variables

```bash
# Mobile app
cp product/apps/consumer-mobile/.env.example product/apps/consumer-mobile/.env.local

# Web app
cp product/apps/web/.env.example product/apps/web/.env.local
```

**`product/apps/consumer-mobile/.env.local`**:
```env
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase-start>
```

**`product/apps/web/.env.local`**:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase-start>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # server-side only
```

---

## 4. Run the Apps

Open three terminal windows:

```bash
# Terminal 1 — Mobile (Expo)
cd product/apps/consumer-mobile
pnpm start
# Press 'i' for iOS Simulator, 'a' for Android Emulator

# Terminal 2 — Web (Next.js roaster dashboard)
cd product/apps/web
pnpm dev
# Open http://localhost:3000

# Terminal 3 — Edge Functions (local)
supabase functions serve
# Serves scan_qr, generate_qr, update_coffee_stats at http://localhost:54321/functions/v1/
```

---

## 5. Verify the Full QR Flow

After seeding, the DB contains one test roaster, one coffee, and one roast_batch (no QR yet).

1. **Login as test roaster** at `http://localhost:3000`
   - Email: `roaster@test.funcup` / Password: `testpassword`
2. **Create a batch QR**: Navigate to the test coffee → Batches → Generate QR
   - Verify PNG and SVG download links appear
3. **Resolve QR on web**: Open `http://localhost:3000/q/{hash}` in a browser
   - Should redirect to `/coffee/{id}?batch={batch_id}`
4. **Resolve QR on mobile**: Scan the printed/displayed QR with the Expo app
   - Coffee Page must load within 5 s (FR-002)
5. **Log a tasting**: Tap Log Tasting, fill rating + 3 flavor notes + brew method → Submit
   - Verify the entry appears in the Journal tab
6. **Check analytics**: On web, navigate to Batches → Analytics for the test batch
   - Verify total_count = 1, avg_rating = your rating, top flavor notes shown

---

## 6. Offline Flow Test

1. Enable airplane mode on the device / simulator
2. Open the mobile app — the cached Coffee Page should load (offline banner visible)
3. Log a tasting → verify "pending sync" indicator appears in Journal
4. Re-enable network
5. Within 30 s, verify the pending indicator disappears and the tasting appears in Supabase

---

## 7. Useful Commands

```bash
# Type-check all packages
pnpm turbo typecheck

# Lint all packages
pnpm turbo lint

# Run all tests
pnpm turbo test

# Reset local Supabase DB (drops all data)
supabase db reset

# Re-generate types after schema changes
supabase gen types typescript --local > product/packages/shared/src/types/database.types.ts

# Build for production (EAS)
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Deploy Edge Functions to remote project
supabase functions deploy scan_qr
supabase functions deploy generate_qr
supabase functions deploy update_coffee_stats
```

---

## 8. Seed Data Reference

| Entity | Test value |
|--------|-----------|
| Roaster | Kochere Roasters (verified) |
| Coffee | Kochere Natural — Ethiopia, Yirgacheffe |
| Batch | Lot #KN-001, roast date 2026-03-01 |
| Consumer | `consumer@test.funcup` / `testpassword` |
| Flavor notes | 36 tags seeded (see `product/supabase/seed.sql`) |
| Brew methods | 10 methods seeded |
