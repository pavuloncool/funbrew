# Contract: QR URL

**Date**: 2026-05-09  
**Source of truth**: `meta/runbooks/BETA_INTEGRATION_CONTRACT.md` (section 5)

---

## URL Pattern

```
https://<beta-host>/q/{qr_hash}
```

| Component | Value |
|-----------|-------|
| Scheme | `https` |
| Host | `<beta-host>` (deployment-dependent; not hardcoded to `funcup.app`) |
| Path prefix | `/q/` |
| `{qr_hash}` | UUID v4/v7-compatible lowercase UUID (example: `550e8400-e29b-41d4-a716-446655440000`) |

`<beta-host>` is expected to come from `NEXT_PUBLIC_APP_URL` in web QR generation (`/api/qr`, `/api/batch-qr`). If missing, web falls back to request host headers.

---

## Invariants

1. **Permanent**: Hash is generated once and must stay stable for a published record.
2. **Public**: `/q/{hash}` must remain anonymously readable in browser.
3. **Host-swap safe**: Beta host/domain changes must not break parsing/resolution; parser uses path contract (`/q/{hash}`), not fixed host matching.
4. **Multi-entry payload support**: Mobile parser must accept:
   - full `https://<any-host>/q/{hash}`
   - `funcup://q/{hash}`
   - bare UUID fallback

---

## Resolution Flow (Current Implementation)

### Web (`product/apps/web/app/q/[hash]/page.tsx`)

```
GET https://<beta-host>/q/{hash}
  → Next.js public route renders resolver page
  → Client calls Supabase function scan_qr with { hash }
  → 200: renders normalized coffee/tag payload
  → 4xx/5xx: renders flow error state
```

### Mobile (`product/apps/consumer-mobile`)

```
QR scan payload
  → parseFuncupQrScanPayload() extracts hash from URL/scheme/UUID
  → router.replace('/q/[hash]')
  → /q/[hash] redirects to /coffee/[id] (id = hash)
  → useCoffeePage() invokes scan_qr with { hash }
```

---

## Deep Link Configuration Status

Current mobile config supports both:

- Custom scheme: `funcup://q/{hash}` (`scheme: "funcup"`, host `q`)
- Conditional HTTPS host mapping for `/q/*`, derived from `EXPO_PUBLIC_ROASTER_WEB_URL` when that URL is valid `https://...`
  - Android: `intentFilters` with `autoVerify: true`
  - iOS: `associatedDomains` (`applinks:<host>`)

Result:

- Browser resolver for `https://<beta-host>/q/{hash}` is always supported.
- Native app capture of `https://<beta-host>/q/{hash}` works only when the app is built with matching `EXPO_PUBLIC_ROASTER_WEB_URL` and infrastructure files are present on that host.

---

## Compatibility Checklist for Beta Host Changes

1. Set web `NEXT_PUBLIC_APP_URL` to the beta public host before generating new QR codes.
2. Keep `/q/{hash}` route public and unchanged.
3. Preserve parser acceptance tests for:
   - `https://<host>/q/{hash}`
   - `funcup://q/{hash}`
   - bare UUID
4. If OS-level HTTPS deep linking is required for beta:
   - set `EXPO_PUBLIC_ROASTER_WEB_URL=https://<beta-host>` at build time,
   - verify generated Android `intentFilters` and iOS `associatedDomains` include the same host,
   - host valid `assetlinks.json` + `apple-app-site-association` on that host.

---

## Error States

| Condition | HTTP | Client behaviour |
|-----------|------|-----------------|
| Hash not found | 404 | "not found" state from shared flow error copy |
| Malformed hash | 400 | parse/invalid-hash error state |
| Archived batch | 200 (`archived: true`) | Coffee page with archived notice |
| Network / backend failure | 5xx / transport error | retryable scan error state |
