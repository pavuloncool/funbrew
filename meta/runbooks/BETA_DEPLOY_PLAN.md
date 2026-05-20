# Beta Deploy Plan (Vercel Web + Shared Supabase + Mobile Beta)

Data: 2026-05-09  
Owner: Agent 7 (Deployment)  
Source contract: `meta/runbooks/BETA_INTEGRATION_CONTRACT.md`

## 1) Scope lock
- Beta release to jeden system: `product/apps/web` + `product/apps/consumer-mobile` + shared Supabase beta.
- `product/apps/web` deploy bez gotowej konfiguracji mobile beta jest niedozwolony.
- Wszystkie środowiska muszą wskazywać ten sam projekt Supabase beta.

## 2) Canonical env matrix (beta)

Ustal raz na release:
- `BETA_PUBLIC_WEB_ORIGIN` = `https://<vercel-beta-host>`
- `BETA_SUPABASE_URL` = `https://<project-ref>.supabase.co`
- `BETA_SUPABASE_ANON_KEY` = anon key z tego samego projektu
- `BETA_SUPABASE_SERVICE_ROLE_KEY` = service role key z tego samego projektu

### 2a) Web (`product/apps/web` on Vercel)

| Variable | Required | Value in beta | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | `BETA_SUPABASE_URL` | Public client + server route resolver |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | `BETA_SUPABASE_ANON_KEY` | Browser auth/data access |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `BETA_SUPABASE_SERVICE_ROLE_KEY` | Server-only (`/api/*`) |
| `NEXT_PUBLIC_APP_URL` | Yes | `BETA_PUBLIC_WEB_ORIGIN` | Canonical host for QR URLs |
| `QR_PUBLIC_HOST` | Yes for store/deep-link readiness | host from `BETA_PUBLIC_WEB_ORIGIN` | Must match `NEXT_PUBLIC_APP_URL` hostname exactly |
| `APP_STORE_URL` | Yes for install fallback readiness | App Store listing URL | Used by readiness validation for fallback/open-in-app flows |
| `PLAY_STORE_URL` | Yes for install fallback readiness | Play Store listing URL | Used by readiness validation for fallback/open-in-app flows |
| `ANDROID_SHA256_CERT_FINGERPRINTS` | Yes for Android app links | release signing SHA-256 fingerprint(s) | Powers `/.well-known/assetlinks.json` generation |
| `APPLE_TEAM_ID` | Yes for iOS universal links | Apple Team ID | Powers `apple-app-site-association` generation |

### 2b) Supabase Edge Functions (beta project secrets)

| Variable | Required | Value in beta | Notes |
|---|---|---|---|
| `SUPABASE_URL` | Yes | `BETA_SUPABASE_URL` | Default platform secret |
| `SUPABASE_ANON_KEY` | Yes | `BETA_SUPABASE_ANON_KEY` | Required by auth/log functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `BETA_SUPABASE_SERVICE_ROLE_KEY` | Required by admin writes |
| `APP_PUBLIC_URL` | Recommended | `BETA_PUBLIC_WEB_ORIGIN` | Used by `qr/generate-qr.ts`; keeps host swap safe |
| `NEXT_PUBLIC_APP_URL` | Recommended | `BETA_PUBLIC_WEB_ORIGIN` | Backward-compatible fallback in functions |
| `CONTACT_NOTIFICATION_TO` | Optional (feature) | comma-separated emails | Contact form notifications |
| `CONTACT_NOTIFICATION_PROVIDER` | Optional (feature) | `resend` | Current supported provider |
| `CONTACT_NOTIFICATION_FROM` | Optional (feature) | verified sender | Required for email send |
| `RESEND_API_KEY` | Optional (feature) | resend key | Required for email send |

### 2c) Mobile beta build (`product/apps/consumer-mobile`, EAS env)

| Variable | Required | Value in beta | Notes |
|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | `BETA_SUPABASE_URL` | Must match web exactly |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | `BETA_SUPABASE_ANON_KEY` | Must match web exactly |
| `EXPO_PUBLIC_ROASTER_WEB_URL` | Yes for HTTPS deep links | `BETA_PUBLIC_WEB_ORIGIN` | Must be `https://...` at build time |
| `EXPO_PUBLIC_APP_URL` | Recommended | `BETA_PUBLIC_WEB_ORIGIN` | App/deeplink context parity |
| `EXPO_PUBLIC_ENV` | Recommended | `beta` or `production` by release policy | Environment flag |

## 3) Deploy order (hard sequence)

1. Freeze RC inputs:
- Pin commit SHA for `product/apps/web`, `product/apps/consumer-mobile`, `product/packages/shared`, `product/supabase/`.
- Confirm no env drift versus matrix above.

2. Supabase beta first:
- Apply migrations to beta project.
- Deploy required edge functions (`scan_qr`, `log_tasting`, `update_coffee_stats`, `submit_contact_lead`).
- Set/update function secrets from section `2b`.
- Run endpoint reachability smoke:
  - `bash product/scripts/mobile-functions-smoke-check.sh https://<project-ref>.supabase.co/functions/v1`

3. Vercel web second:
- Project root: `product/apps/web`.
- Build command: `pnpm -C product/apps/web build`.
- Set env vars from section `2a` for Beta/Preview and Production (if this beta host is promoted).
- Run `pnpm qr:check` before deploy; it must pass with the final host + store URLs + signing metadata.
- Deploy and bind `BETA_PUBLIC_WEB_ORIGIN`.

4. Mobile beta config third (cannot be skipped):
- Set EAS env for profile used in beta build from section `2c`.
- Rebuild mobile beta artifacts after web host is final (deep-link host is compile-time in `app.config.ts`).
- Verify generated config includes:
  - Android intent filter for `https://<beta-host>/q/*`,
  - iOS associated domain `applinks:<beta-host>`.

5. Cross-app verification gate last:
- Run smoke/test sequence from `meta/runbooks/BETA_SMOKE_RUNBOOK.md`.
- Manual end-to-end on beta:
  - web publish batch,
  - open generated `https://<beta-host>/q/{hash}`,
  - mobile scan/log tasting on same backend,
  - web analytics shows new data.
- Record evidence in release checklist before sign-off.

## 4) Required mobile beta infra for HTTPS universal links
- Host `https://<beta-host>/.well-known/assetlinks.json` (Android).
- Host `https://<beta-host>/apple-app-site-association` and/or `https://<beta-host>/.well-known/apple-app-site-association` (iOS).
- Files must match actual app ids/signing identities for the beta build.
- If these files are missing or invalid, fallback remains `funcup://q/{hash}` but OS-level `https://<beta-host>/q/{hash}` open-in-app is not guaranteed.

## 5) Rollback order
1. Stop new mobile beta rollout for the bad build.
2. Roll back Vercel deployment to last known-good build.
3. If issue is data-contract related, roll back Supabase functions and/or apply corrective SQL migration.
4. Re-run cross-app verification before reopening rollout.

## 6) Release blockers (do not waive silently)
- Web host differs from mobile `EXPO_PUBLIC_ROASTER_WEB_URL`.
- Mobile points to a different Supabase URL/key pair than web.
- `SUPABASE_SERVICE_ROLE_KEY` missing on Vercel.
- `scan_qr` / `log_tasting` / `update_coffee_stats` unavailable on beta functions endpoint.
- Manual cross-app loop not evidenced for current RC SHA.
