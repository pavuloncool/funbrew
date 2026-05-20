# Contract: Edge Function `generate_qr`

**Function**: `generate_qr`
**Runtime**: Supabase Edge Function (Deno)
**Invoked by**: Supabase Edge caller (legacy/optional path).  
Primary beta web flow currently uses Next.js API routes: `/api/batch-qr` and `/api/qr`.

---

## Purpose

Generates a permanent, unique QR code for a roasting batch. Creates the `qr_codes` row, generates SVG + PNG assets, stores them in Supabase Storage, and returns signed download URLs to the roaster. Called exactly once per batch (idempotent: re-calling returns the existing QR).

---

## Request

```
POST https://{project}.supabase.co/functions/v1/generate_qr
Content-Type: application/json
Authorization: Bearer {user_jwt}   # authenticated roaster session required
```

**Body**:
```typescript
{
  batch_id: string;  // UUID of the roast_batch to generate a QR for
}
```

**Auth**: Required. The calling user must be the owner of the batch's parent coffee's roaster, and the roaster must have `verification_status = 'verified'`.

---

## Response — 201 Created (new QR generated)

```typescript
{
  created: true;
  hash: string;           // UUID v4 — the {qr_hash} used in the URL
  qr_url: string;         // "https://<beta-host>/q/{hash}" — URL encoded in the QR
  svg_storage_path: string;   // "qr/{batch_id}/qr.svg"
  png_storage_path: string;   // "qr/{batch_id}/qr.png"
  svg_signed_url: string;     // 1-hour signed download URL for SVG
  png_signed_url: string;     // 1-hour signed download URL for PNG
}
```

---

## Response — 200 OK (QR already exists — idempotent)

Same shape as 201, with `created: false`. Returns fresh signed URLs (1-hour expiry).

```typescript
{
  created: false;
  hash: string;
  qr_url: string;
  svg_storage_path: string;
  png_storage_path: string;
  svg_signed_url: string;     // fresh 1-hour signed URL
  png_signed_url: string;     // fresh 1-hour signed URL
}
```

---

## Response — 401 Unauthorized

```typescript
{ error: "unauthorized"; message: "Valid session required." }
```

---

## Response — 403 Forbidden

```typescript
{ error: "forbidden"; message: "Roaster must be verified to generate QR codes." }
// or
{ error: "forbidden"; message: "You do not own this batch." }
```

---

## Response — 404 Not Found

```typescript
{ error: "not_found"; message: "Batch not found." }
```

---

## Side Effects

1. Inserts row into `qr_codes` (if new): `{ batch_id, hash, qr_url, svg_storage_path, png_storage_path }`
2. Writes `qr/{batch_id}/qr.svg` to Supabase Storage bucket `qr`
3. Writes `qr/{batch_id}/qr.png` to Supabase Storage bucket `qr`

---

## Key Invariants

- `hash` is generated once via `crypto.randomUUID()` and never changed (FR-016).
- QR resolves to the batch regardless of subsequent edits to the coffee profile (FR-016, spec US-2 AC-4).
- Assets are stored permanently; signed URLs are ephemeral (1-hour). Roasters can re-call to get fresh signed URLs.
- Public host must come from env (`APP_PUBLIC_URL`, fallback `NEXT_PUBLIC_APP_URL`), not fixed-domain literals.

---

## Implementation Notes

- Use `qrcode` npm package (Deno-compatible) to generate SVG string.
- Use `resvg-js` (WASM build) to rasterize SVG → PNG at 1024×1024 px (print-ready resolution).
- QR error correction level: **H** (30%) — tolerates up to 30% damage; important for printed packaging.
- QR margin: 4 modules (quiet zone per ISO 18004).
- Verify roaster ownership via SQL join: `roast_batches → coffees → roasters WHERE roasters.user_id = auth.uid()`.
