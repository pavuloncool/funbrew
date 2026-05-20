# Data Model: funcup MVP

**Feature**: `002-qr-coffee-platform` | **Date**: 2026-03-25
**Source**: Canonical schema — Notion Data Model v3 (13 tables). This document maps those tables to entity definitions, field types, relationships, and validation rules. Do not add tables here that are not in the canonical schema.

---

## Entity Map

```
auth.users (Supabase managed)
    │
    ├── users (profile extension)
    │       └── following_roaster_ids → roasters[]
    │
    └── roasters
            └── coffees
                    ├── origins (normalized location data)
                    └── roast_batches
                            ├── qr_codes (1:1)
                            ├── coffee_stats (1:1)
                            └── coffee_logs
                                    ├── tasting_notes → flavor_notes (M:M junction)
                                    ├── reviews (1:1)
                                    │       └── review_votes (M:M)
                                    └── brew_methods (N:1 reference)

flavor_notes (taxonomy — read-only after seed)
brew_methods (taxonomy — read-only after seed)
```

---

## Tables

### `users`

Extends `auth.users`. One row per authenticated consumer or roaster (roasters also have a `roasters` row).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, FK → `auth.users.id` ON DELETE CASCADE | Matches Supabase auth UID |
| `display_name` | `text` | NOT NULL | Consumer-facing name |
| `avatar_url` | `text` | NULLABLE | Supabase Storage path: `users/{id}/avatar.jpg` |
| `sensory_level` | `enum('beginner','advanced','expert')` | NOT NULL DEFAULT `'beginner'` | Updated server-side by `recalculate_user_reputation()` |
| `following_roaster_ids` | `uuid[]` | NOT NULL DEFAULT `'{}'` | FK references `roasters.id` (array); confirm vs. Notion DM v3 |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT `now()` | Trigger-maintained |

**Validation**: `display_name` max 64 chars. `sensory_level` values are closed enum.

**RLS**:
- SELECT: own row + limited public columns (display_name, avatar_url, sensory_level) for Community section
- INSERT: on Supabase auth signup via trigger
- UPDATE: own row only; `sensory_level` updatable by service role only

---

### `roasters`

Verified business accounts. Created by the roaster during web app registration.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` | |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users.id` ON DELETE CASCADE, UNIQUE | One roaster per auth account |
| `name` | `text` | NOT NULL | Business name |
| `country` | `text` | NULLABLE | |
| `city` | `text` | NULLABLE | |
| `description` | `text` | NULLABLE | Rich text; brand story |
| `website` | `text` | NULLABLE | |
| `logo_url` | `text` | NULLABLE | Supabase Storage path: `roasters/{id}/logo.jpg` |
| `verification_status` | `enum('pending','verified','revoked')` | NOT NULL DEFAULT `'pending'` | Changed manually via Supabase dashboard (no admin UI in MVP) |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT `now()` | Trigger-maintained |

**State transitions**:
```
pending → verified  (manual: funcup admin via dashboard)
verified → revoked  (manual: compliance breach)
revoked → verified  (manual: reinstatement)
```

**Validation**: `name` max 128 chars. `website` must be valid URL if present.

**RLS**:
- SELECT: all rows (for discovery)
- INSERT: auth user creates own roaster record (user_id = auth.uid())
- UPDATE: own row; `verification_status` service role only

---

### `origins`

Normalised coffee origin data. Reusable across coffees from the same farm/region.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` | |
| `country` | `text` | NOT NULL | e.g., "Ethiopia" |
| `region` | `text` | NULLABLE | e.g., "Yirgacheffe" |
| `farm` | `text` | NULLABLE | e.g., "Kochere Station" |
| `altitude_min` | `integer` | NULLABLE | Metres above sea level |
| `altitude_max` | `integer` | NULLABLE | Metres above sea level |
| `producer` | `text` | NULLABLE | Farm owner / cooperative name |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | |

**Validation**: `altitude_min ≤ altitude_max` when both are present. `country` required.

**RLS**:
- SELECT: all rows (public read)
- INSERT/UPDATE: verified roasters only

---

### `coffees`

Digital product profile for a coffee. Belongs to a roaster.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` | |
| `roaster_id` | `uuid` | NOT NULL, FK → `roasters.id` ON DELETE RESTRICT | |
| `origin_id` | `uuid` | NULLABLE, FK → `origins.id` ON DELETE SET NULL | Nullable to allow draft without origin |
| `name` | `text` | NOT NULL | e.g., "Kochere Natural" |
| `variety` | `text` | NULLABLE | e.g., "Heirloom", "Bourbon", "Gesha" |
| `processing_method` | `enum('washed','natural','honey','anaerobic','wet-hulled','other')` | NULLABLE | |
| `producer_notes` | `text` | NULLABLE | Roaster's narrative about the coffee |
| `status` | `enum('draft','active','archived')` | NOT NULL DEFAULT `'draft'` | |
| `cover_image_url` | `text` | NULLABLE | Supabase Storage path: `coffees/{id}/cover.jpg` |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT `now()` | Trigger-maintained |

**State transitions**:
```
draft → active    (roaster publishes)
active → archived (roaster archives; QR codes remain valid; tastings preserved)
archived → active (roaster restores)
```

**Constraint**: Only `verified` roasters may transition to `active`. `draft` and `archived` coffees are not visible in consumer Discovery.

**Validation**: `name` max 128 chars. Cannot archive if roaster.verification_status = 'revoked' — existing archived coffees remain readable.

**RLS**:
- SELECT: all `active` rows (public); own `draft` + `archived` rows (roaster)
- INSERT/UPDATE: own roaster (user_id matches), verified status only for publish

---

### `roast_batches`

A specific roasting run of a coffee. Generates exactly one QR code.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` | |
| `coffee_id` | `uuid` | NOT NULL, FK → `coffees.id` ON DELETE RESTRICT | |
| `roast_date` | `date` | NOT NULL | |
| `lot_number` | `text` | NOT NULL | Roaster's internal lot/batch identifier |
| `status` | `enum('active','archived')` | NOT NULL DEFAULT `'active'` | |
| `brewing_notes` | `text` | NULLABLE | Roaster's brewing guide for this batch (Coffee Page → Brewing section) |
| `roaster_story` | `text` | NULLABLE | Narrative for this batch (Coffee Page → Story section) |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT `now()` | Trigger-maintained |

**State transitions**:
```
active → archived  (roaster archives; QR remains valid; shows "no longer active" notice per FR-002 AC-3)
```

**Key invariant**: Archiving a batch does NOT delete its QR code or tasting entries (FR-020).

**RLS**:
- SELECT: all rows (public — archived batches still readable for QR resolution)
- INSERT/UPDATE: own coffee's roaster

---

### `qr_codes`

One QR code per batch. Generated by the `generate_qr` Edge Function. Permanent — never regenerated.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` | |
| `batch_id` | `uuid` | NOT NULL, FK → `roast_batches.id` ON DELETE RESTRICT, UNIQUE | 1:1 with batch |
| `hash` | `text` | NOT NULL, UNIQUE | UUID v4; used in URL path |
| `qr_url` | `text` | NOT NULL | `https://funcup.app/q/{hash}` |
| `svg_storage_path` | `text` | NOT NULL | `qr/{batch_id}/qr.svg` |
| `png_storage_path` | `text` | NOT NULL | `qr/{batch_id}/qr.png` |
| `generated_at` | `timestamptz` | NOT NULL DEFAULT `now()` | |

**Key invariant**: `hash` is set once at INSERT and never updated (FR-016).

**RLS**:
- SELECT: all rows (public — any authenticated or anonymous user can resolve a QR)
- INSERT: service role only (via `generate_qr` Edge Function)
- UPDATE/DELETE: none permitted

---

### `brew_methods`

Predefined brew method taxonomy. Read-only after seed.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` | |
| `name` | `text` | NOT NULL, UNIQUE | e.g., "V60", "AeroPress", "Espresso", "French Press", "Chemex", "Moka Pot", "Cold Brew", "Siphon", "Pour Over", "Other" |
| `sort_order` | `integer` | NOT NULL DEFAULT 0 | Display ordering |

**Seeded values** (10): V60, AeroPress, Espresso, French Press, Chemex, Moka Pot, Cold Brew, Siphon, Pour Over, Other

**RLS**: SELECT all (public read-only). No INSERT/UPDATE/DELETE by clients.

---

### `flavor_notes`

Predefined flavor tag taxonomy. 36 tags, 6 categories. Read-only after seed.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` | |
| `name` | `text` | NOT NULL, UNIQUE | Slug-style: "dark-chocolate", "stone-fruit" |
| `label` | `text` | NOT NULL | Display label: "Dark Chocolate", "Stone Fruit" |
| `category` | `text` | NOT NULL | One of: fruity, floral, sweet, nutty, spice, savory |
| `sort_order` | `integer` | NOT NULL DEFAULT 0 | Within-category ordering |

**Seeded values** (36): see research.md §5.

**RLS**: SELECT all (public read-only). No INSERT/UPDATE/DELETE by clients.

---

### `coffee_logs`

A consumer's tasting entry for a specific batch. Core entity of the platform.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` | |
| `user_id` | `uuid` | NOT NULL, FK → `users.id` ON DELETE CASCADE | |
| `batch_id` | `uuid` | NOT NULL, FK → `roast_batches.id` ON DELETE RESTRICT | |
| `brew_method_id` | `uuid` | NULLABLE, FK → `brew_methods.id` ON DELETE SET NULL | |
| `rating` | `smallint` | NOT NULL, CHECK (rating BETWEEN 1 AND 5) | |
| `brew_time_seconds` | `integer` | NULLABLE | Optional brew duration |
| `free_text_notes` | `text` | NULLABLE | Free-text flavour notes beyond taxonomy tags |
| `logged_at` | `timestamptz` | NOT NULL DEFAULT `now()` | Consumer-set time (may be backdated) |
| `synced_at` | `timestamptz` | NULLABLE | NULL = locally queued; set on successful server write |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | Server-set insert time |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT `now()` | Trigger-maintained |

**Key behaviours**:
- Multiple `coffee_logs` per (user, batch) are allowed — "same coffee, different brew session" (spec US-1 AC-4).
- `synced_at` is set by the sync manager after offline queue flush.
- INSERT triggers `update_coffee_stats` Edge Function via `pg_net`.

**RLS**:
- SELECT: own logs (journal); batch aggregate joins (Community section — anonymised)
- INSERT: own user_id = auth.uid()
- UPDATE: own row only (sync metadata)
- DELETE: not permitted (data integrity FR-020)

---

### `tasting_notes`

Junction table connecting a coffee_log to its selected flavor_note tags.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` | |
| `coffee_log_id` | `uuid` | NOT NULL, FK → `coffee_logs.id` ON DELETE CASCADE | |
| `flavor_note_id` | `uuid` | NOT NULL, FK → `flavor_notes.id` ON DELETE RESTRICT | |
| — | — | UNIQUE (`coffee_log_id`, `flavor_note_id`) | Prevents duplicate tags per log |

**RLS**:
- SELECT: rows where coffee_log_id's user_id = auth.uid(), or aggregate queries for Community/stats
- INSERT: validated via coffee_log ownership
- DELETE: not permitted

---

### `reviews`

Optional long-form review text for a coffee_log. One review per log.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` | |
| `coffee_log_id` | `uuid` | NOT NULL, FK → `coffee_logs.id` ON DELETE CASCADE, UNIQUE | 1:1 with coffee_log |
| `body` | `text` | NOT NULL | Min 1 char; max 2000 chars |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT `now()` | Trigger-maintained |

**Key behaviour**: Review text is shown in the Community section of Coffee Page and in Roaster analytics. Consumer identity is fully anonymised in both contexts (FR-018). Only `sensory_level` label accompanies the review in Community.

**RLS**:
- SELECT: own reviews + public (anonymised — no user join in public queries)
- INSERT: own coffee_log ownership
- UPDATE: own row

---

### `review_votes`

Consumers vote on the helpfulness of other consumers' reviews. One vote per (review, voter).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` | |
| `review_id` | `uuid` | NOT NULL, FK → `reviews.id` ON DELETE CASCADE | |
| `user_id` | `uuid` | NOT NULL, FK → `users.id` ON DELETE CASCADE | The voter |
| `vote` | `boolean` | NOT NULL | `true` = helpful, `false` = not helpful |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | |
| — | — | UNIQUE (`review_id`, `user_id`) | One vote per user per review |

**Note**: Users cannot vote on their own reviews (enforced via RLS CHECK).

**RLS**:
- SELECT: all (aggregate helpful counts are public)
- INSERT: auth.uid() ≠ review.coffee_log.user_id (cannot self-vote); one per (review, user)
- UPDATE/DELETE: not permitted (votes are immutable)

---

### `coffee_stats`

Materialised aggregated statistics per batch. Updated by `update_coffee_stats` Edge Function after each tasting.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` | |
| `batch_id` | `uuid` | NOT NULL, FK → `roast_batches.id` ON DELETE CASCADE, UNIQUE | 1:1 with batch |
| `total_count` | `integer` | NOT NULL DEFAULT 0 | Total tasting entries for this batch |
| `avg_rating` | `numeric(3,2)` | NOT NULL DEFAULT 0.00 | |
| `rating_distribution` | `jsonb` | NOT NULL DEFAULT `'{"1":0,"2":0,"3":0,"4":0,"5":0}'` | Count per rating level |
| `top_flavor_notes` | `jsonb` | NOT NULL DEFAULT `'[]'` | Array of `{id, name, label, category, count}` sorted by count DESC, max 10 |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT `now()` | Set by Edge Function |

**RLS**:
- SELECT: all (public — used by Coffee Page Community section + Roaster analytics)
- INSERT/UPDATE: service role only (via `update_coffee_stats` Edge Function)
- DELETE: not permitted

---

## Relationships Summary

```
auth.users 1 ── 1 users
users N ── M roasters  (via following_roaster_ids uuid[])
roasters 1 ── N coffees
origins 1 ── N coffees
coffees 1 ── N roast_batches
roast_batches 1 ── 1 qr_codes
roast_batches 1 ── 1 coffee_stats
roast_batches 1 ── N coffee_logs
users 1 ── N coffee_logs
coffee_logs 1 ── 1 reviews
coffee_logs N ── M flavor_notes  (via tasting_notes)
brew_methods 1 ── N coffee_logs
reviews 1 ── N review_votes
users 1 ── N review_votes
```

---

## Data Model Gaps / Open Items

1. **Consumer follows**: `users.following_roaster_ids uuid[]` is proposed. If Notion Data Model v3 defines a separate junction table, update migration accordingly before implementing FR-007.
2. **`pg_net` extension**: Must be enabled in Supabase project settings before deploying the `coffee_logs` INSERT trigger.
3. **`updated_at` triggers**: A `set_updated_at()` trigger function must be applied to all tables with an `updated_at` column.
4. **Sensory level enum**: `CREATE TYPE sensory_level AS ENUM ('beginner', 'advanced', 'expert')` — must be in migration `0001`.
