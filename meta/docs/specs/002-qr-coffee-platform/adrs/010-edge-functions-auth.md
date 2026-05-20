# ADR-010: Edge Functions Structure for Auth

**Date:** 2026-04-08  
**Status:** Accepted  
**Feature:** 002-qr-coffee-platform

## Context
Need server-side endpoints for user authentication and profile management.

## Decision
Implement Edge Functions (Deno) in product/supabase/functions/:
```
auth/
  sign-up.ts       # User registration
  sign-in.ts       # Login with PKCE flow
  sign-out.ts      # Logout
  update-profile.ts # Profile updates
```

All functions use CORS headers, handle OPTIONS, and return JSON.

## Consequences
- ✅ Server-side auth logic
- ✅ Extensible for coffee/roaster endpoints
- ⚠️ Deno runtime (Supabase-specific)

## Related
- T016, T017, T019