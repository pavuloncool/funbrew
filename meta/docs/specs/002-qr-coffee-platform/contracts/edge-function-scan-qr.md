# Contract: Edge Function `scan_qr`

**Function**: `scan_qr`
**Runtime**: Supabase Edge Function (Deno)
**Invoked by**: Web resolver page (`product/apps/web/app/q/[hash]/page.tsx`) + Expo mobile app (`useCoffeePage`)

---

## Purpose

Resolves a QR hash to a fully hydrated batch + coffee + roaster + stats payload. This is the single entry point for the entire QR flow (spec FR-002, US-1).

---

## Request

```
POST https://{project}.supabase.co/functions/v1/scan_qr
Content-Type: application/json
Authorization: Bearer {anon_key}   # anon key sufficient — public data
```

**Body**:
```typescript
{
  hash: string;  // UUID format — the {qr_hash} from https://<beta-host>/q/{qr_hash}
}
```

**Auth**: Not required (anonymous access). Coffee pages are publicly readable (FR-011).

---

## Response — 200 OK (active batch)

```typescript
{
  batch: {
    id: string;
    roast_date: string;        // ISO date: "2026-03-01"
    lot_number: string;
    status: "active";
    brewing_notes: string | null;
    roaster_story: string | null;
  };
  coffee: {
    id: string;
    name: string;
    variety: string | null;
    processing_method: "washed" | "natural" | "honey" | "anaerobic" | "wet-hulled" | "other" | null;
    producer_notes: string | null;
    cover_image_url: string | null;   // Supabase Storage URL
    status: "active" | "archived";
  };
  origin: {
    country: string;
    region: string | null;
    farm: string | null;
    altitude_min: number | null;
    altitude_max: number | null;
    producer: string | null;
  };
  roaster: {
    id: string;
    name: string;
    city: string | null;
    country: string | null;
    logo_url: string | null;
  };
  stats: {
    total_count: number;
    avg_rating: number;           // 0.00 – 5.00
    rating_distribution: {
      "1": number; "2": number; "3": number; "4": number; "5": number;
    };
    top_flavor_notes: Array<{
      id: string;
      name: string;
      label: string;
      category: string;
      count: number;
    }>;                           // max 10 items, sorted by count DESC
  };
}
```

---

## Response — 200 OK (archived batch)

Same shape as above, with `batch.status = "archived"` and an additional field:

```typescript
{
  ...sameShape,
  archived: true;   // signals client to show "no longer active" notice (FR-002 AC-3)
}
```

---

## Response — 404 Not Found

```typescript
{
  error: "not_found";
  message: "This QR code is not registered in funcup.";
}
```

Client behaviour: show "coffee isn't in the system" message with option to share code (spec US-1 AC-5).

---

## Response — 400 Bad Request

```typescript
{
  error: "invalid_hash";
  message: "hash must be a valid UUID v4";
}
```

---

## SLA

- p95 response time: < 500 ms (ensures full scan → page load ≤ 5 s target, SC-003)
- Function cold start budget: ≤ 1 s (included in the 5 s budget)

---

## Implementation Notes

- Join order: `qr_codes` → `roast_batches` → `coffees` → `origins` + `roasters` (single query with joins)
- `coffee_stats` fetched in same query via LEFT JOIN on `batch_id`
- Index required: `qr_codes.hash` (UNIQUE constraint provides this)
- Function uses the Supabase `service_role` client internally to bypass RLS for the read (public data, no security risk)
