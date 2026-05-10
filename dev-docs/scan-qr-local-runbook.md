# Local Scan QR Runbook (Expo Go + iPhone + local Supabase)

## Goal
- Keep canonical-only scan flow (`scan_qr` + `batch`) working on Expo Go with a physical iPhone.
- Keep DB/functions local (`127.0.0.1:54321`) and expose them as HTTPS for Expo Go via Cloudflare tunnel.

## 1) Preflight local backend (required)
From repo root:

```bash
bash scripts/mobile-functions-smoke-check.sh
```

Expected:
- `scan_qr` is `PASS`
- preferably `log_tasting` and `update_coffee_stats` are also `PASS`

If preflight fails, do not continue with scan QA.

## 2) Start HTTPS tunnel to local Supabase API
Install once:

```bash
brew install cloudflared
```

Start tunnel:

```bash
bash scripts/start-supabase-https-tunnel.sh
```

Or manually:

```bash
cloudflared tunnel --url http://127.0.0.1:54321
```

Copy generated URL:
- `https://<random>.trycloudflare.com`

Use it as `EXPO_PUBLIC_SUPABASE_URL`.

## 3) Configure mobile env for Expo Go
Set `apps/consumer-mobile/.env.local`:

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

After every `.env*` change, restart Metro.

## 4) Start apps
Web:

```bash
pnpm -C apps/web dev
```

Mobile (with preflight gate):

```bash
pnpm -C apps/consumer-mobile run start:expogo:tunnel
```

## 5) QA flow
1. In web: `roaster-hub/coffees/new` create/publish coffee + batch + QR.
2. Open Expo Go on iPhone and connect to Metro.
3. Scan coffee QR in app.
4. Verify `coffee/[id]/index` renders canonical publication fields and does not show `Scan temporarily unavailable`.

## 6) Failure triage for 503
If app shows 503 or `Scan temporarily unavailable`:
1. Re-run `bash scripts/mobile-functions-smoke-check.sh`.
2. Confirm tunnel process is still running.
3. Confirm mobile logs show `EXPO_PUBLIC_SUPABASE_URL` host with `trycloudflare.com`.
4. Retry scan.

Most local 503 cases are availability/transport issues, not UI regressions.
