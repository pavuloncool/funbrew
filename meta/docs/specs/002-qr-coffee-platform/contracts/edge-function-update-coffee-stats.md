# Contract: Edge Function `update_coffee_stats`

**Function**: `update_coffee_stats`
**Runtime**: Supabase Edge Function (Deno)
**Invoked by**: PostgreSQL trigger on `coffee_logs` INSERT (via `pg_net.http_post`) or called directly from `log_tasting`

---

## Purpose

Recalculates aggregated statistics for a batch after a new tasting is submitted. Also triggers sensory reputation recalculation for the consumer. Ensures `coffee_stats` reflects new tastings within 5 minutes (SC-008) — in practice, within seconds.

---

## Request

```
POST https://{project}.supabase.co/functions/v1/update_coffee_stats
Content-Type: application/json
Authorization: Bearer {service_role_key}   # internal — never exposed to clients
```

**Body**:
```typescript
{
  batch_id: string;   // UUID of the batch whose stats need recalculation
  user_id: string;    // UUID of the consumer who just logged the tasting
}
```

**Auth**: Service role only. This function is never called directly from client apps.

---

## Response — 200 OK

```typescript
{
  updated: boolean;
  batch_id: string;
  stats: {
    total_count: number;
    avg_rating: number;
    rating_distribution: { "1": number; "2": number; "3": number; "4": number; "5": number };
    top_flavor_notes: Array<{ id: string; name: string; label: string; category: string; count: number }>;
    updated_at: string;   // ISO 8601 timestamp
  };
  reputation_updated: boolean;   // true if user's sensory_level changed
  new_sensory_level: "beginner" | "advanced" | "expert" | null;  // null if unchanged
}
```

---

## Response — 400 Bad Request

```typescript
{ error: "invalid_input"; message: "batch_id and user_id are required." }
```

---

## Response — 500 Internal Server Error

```typescript
{ error: "aggregation_failed"; message: string }
```

On failure, the trigger retries via `pg_net` up to 3 times (exponential backoff). Stats may be temporarily stale but will self-heal on the next tasting.

---

## Side Effects

### 1. Recalculate `coffee_stats`

- Count all coffee_logs for the batch
- Calculate average rating
- Build rating distribution (count per 1-5)
- Aggregate top 10 flavor notes from tasting_notes join
- Upsert into coffee_stats table

### 2. Recalculate user sensory reputation

Simple threshold-based algorithm:
- 20+ tastings: beginner → advanced
- 50+ tastings: advanced/expert → expert
- Updates `users.sensory_level` if threshold met

No notification is sent to the user (spec FR-008, US-4 AC-2).

---

## Implementation Notes

- Function runs with `service_role` JWT — bypasses RLS for aggregate reads.
- Uses Supabase client queries instead of raw SQL (no exec_sql RPC required)
- Idempotent: calling multiple times with the same `batch_id` simply recalculates from current data — no double-counting.
- Flavor notes counted via join: tasting_notes → flavor_notes → coffee_logs WHERE batch_id
