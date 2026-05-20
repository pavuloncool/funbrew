# Contract: Edge Function `log_tasting`

**Function**: `log_tasting`
**Runtime**: Supabase Edge Function (Deno)
**Invoked by**: Mobile app (CoffeePage) and web app after user submits tasting form

---

## Purpose

Logs a consumer's tasting entry for a specific batch. Creates records in `coffee_logs`, optionally `tasting_notes`, and optionally `reviews`. This is the primary way consumers interact with the platform after scanning a QR code (spec FR-004, US-1).

---

## Request

```
POST https://{project}.supabase.co/functions/v1/log_tasting
Content-Type: application/json
Authorization: Bearer {user_jwt}   # authenticated session required
```

**Body**:
```typescript
{
  batch_id: string;                    // UUID of the roast_batch
  rating: number;                      // 1-5 scale (required)
  brew_method_id?: string;              // UUID from brew_methods (optional)
  brew_time_seconds?: number;           // brewing time in seconds (optional)
  flavor_note_ids?: string[];           // array of flavor_note UUIDs (optional)
  free_text_notes?: string;            // free-form tasting notes (optional)
  review?: string;                     // public review text (optional)
}
```

**Auth**: Required. User must be authenticated (spec FR-011).

---

## Response — 201 Created

```typescript
{
  success: boolean;
  coffee_log_id: string;   // UUID of the created coffee_log
  message: string;
}
```

---

## Response — 400 Bad Request

```typescript
{ error: 'bad_request'; message: 'batch_id and rating are required' }
// or
{ error: 'bad_request'; message: 'rating must be between 1 and 5' }
```

---

## Response — 401 Unauthorized

```typescript
{ error: 'unauthorized'; message: 'Valid session required.' }
```

---

## Side Effects

1. **Insert into `coffee_logs`**:
   ```sql
   INSERT INTO coffee_logs (user_id, batch_id, rating, brew_method_id, brew_time_seconds, free_text_notes, logged_at)
   VALUES ($user_id, $batch_id, $rating, $brew_method_id, $brew_time_seconds, $free_text_notes, now())
   ```

2. **Insert into `tasting_notes`** (if flavor_note_ids provided):
   ```sql
   INSERT INTO tasting_notes (coffee_log_id, flavor_note_id)
   VALUES ($coffee_log_id, $flavor_note_id) -- for each flavor_note_id
   ```

3. **Insert into `reviews`** (if review text provided):
   ```sql
   INSERT INTO reviews (coffee_log_id, body)
   VALUES ($coffee_log_id, $review)
   ```

4. **Trigger**: `after_coffee_log_insert` fires, calling `update_coffee_stats` via `pg_net` to update aggregated stats.

---

## Implementation Notes

- Uses `service_role` client internally for inserts to bypass RLS (user has insert permission via policy)
- Validation: rating must be 1-5, batch_id must exist
- Multiple tastings per (user, batch) are allowed — "same coffee, different brew session" (spec US-1 AC-4)
- Returns the new coffee_log_id so client can navigate to the entry or show details

---

## Offline Support

The mobile app implements offline-first tasting via `useLocalStorageSync` hook:
- When offline, tastings are queued in localStorage with pending indicator
- Auto-sync triggers every 30 seconds when online (spec US-5 AC-3)
- Visual indicator shows "Offline" badge on form when disconnected
- Success message differs: "Saved offline. Will sync when online."

This is a client-side implementation - the Edge Function itself handles online requests only.