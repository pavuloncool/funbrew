# Local Scan QR Runbook (Expo Go + iPhone + local Supabase)

## Goal
- Keep canonical-only scan flow (`scan_qr` + `batch`) working on Expo Go with a physical iPhone.
- Keep DB/functions local (`127.0.0.1:54321`) and expose them as HTTPS for Expo Go via Cloudflare tunnel.

## Toolchain baseline
- Supabase CLI: `>= 2.98.2` (older versions may fail with unhealthy `analytics/vector` during local start).
- Docker Desktop/Engine must be running and healthy before `supabase start`.
- Verify before work:

```bash
supabase --version
docker version
```

## 1) Preflight local backend (required)
From repo root:

```bash
pnpm run supabase:local:ensure
bash product/scripts/mobile-functions-smoke-check.sh
```

Expected:
- local Supabase self-heals into a healthy state (`public` schema + seeded auth/demo data)
- `public.coffee_log_telemetry_core` contains `sensory_bitter` and `sensory_aftertaste`
- `scan_qr` is `PASS`
- preferably `log_tasting` and `update_coffee_stats` are also `PASS`

If preflight fails, do not continue with scan QA.

If you see a mobile save error such as `Could not find the 'sensory_aftertaste' column ... in the schema cache`, your local DB is stale relative to the current Sensory Core schema. Run one of:

```bash
pnpm run supabase:local:ensure
pnpm exec supabase db reset --local --workdir product
```

## 2) Start HTTPS tunnel to local Supabase API
Install once:

```bash
brew install cloudflared
```

Start tunnel:

```bash
bash product/scripts/start-supabase-https-tunnel.sh
```

Or manually:

```bash
cloudflared tunnel --url http://127.0.0.1:54321
```

Copy generated URL:
- `https://<random>.trycloudflare.com`

Use it as `EXPO_PUBLIC_SUPABASE_URL`.

## 3) Configure mobile env for Expo Go
Set `product/apps/consumer-mobile/.env.local`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://<random>.trycloudflare.com
EXPO_PUBLIC_SUPABASE_ANON_KEY=<local anon key>
EXPO_PUBLIC_APP_URL=http://<MAC_LAN_IP>:8081
EXPO_PUBLIC_ROASTER_WEB_URL=http://<MAC_LAN_IP>:3000
```

Get local anon key from:

```bash
pnpm exec supabase status
```

`pnpm run supabase:local:ensure` already refreshes `product/apps/web/.env.local` from the local Supabase status output. Re-run it after a local reset if web auth/data looks stale.

After every `.env*` change, restart Metro.

## 4) Start apps
Web:

```bash
pnpm -C product/apps/web dev
```

Mobile (with preflight gate):

```bash
pnpm -C product/apps/consumer-mobile run start:expogo:tunnel
```

Notes:
- This command uses a Cloudflare tunnel to Metro via `EXPO_PACKAGER_PROXY_URL`; it does not use Expo/ngrok `--tunnel`.
- Use it when your phone is on hotspot / outside the same LAN as your Mac.
- `EXPO_PUBLIC_SUPABASE_URL` still must point to an HTTPS Supabase endpoint reachable from the phone, e.g. the Cloudflare tunnel from step 2.

## 5) QA flow
1. In web: `roaster-hub/coffees/new` create/publish coffee + batch + QR.
2. Open Expo Go on iPhone and connect to Metro.
3. Scan coffee QR in app.
4. Verify `coffee/[id]/index` renders canonical publication fields and does not show `Scan temporarily unavailable`.

## 6) Failure triage for 503
If app shows 503 or `Scan temporarily unavailable`:
1. Re-run `bash product/scripts/mobile-functions-smoke-check.sh`.
2. Confirm tunnel process is still running.
3. Confirm mobile logs show `EXPO_PUBLIC_SUPABASE_URL` host with `trycloudflare.com`.
4. Retry scan.

Most local 503 cases are availability/transport issues, not UI regressions.

## 7) Known local failure modes and fixes
1. Symptom: `supabase start` fails with `container ... is not ready: unhealthy` for `analytics` or `vector`.
   - Fix: update CLI (`brew upgrade supabase`), then run:
   - `supabase stop`
   - `supabase start --debug`
2. Symptom: `supabase start` fails with `container name "/supabase_db_funcup" is already in use`.
   - Fix: cleanup and retry:
   - `supabase stop --debug`
   - `supabase start --debug`
3. Symptom: smoke-check returns connection failure (`000`) but `docker ps` shows healthy Supabase containers.
   - Fix: run smoke-check from your normal shell environment (not a restricted sandbox/session), then retry mobile start.
