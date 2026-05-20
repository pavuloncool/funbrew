#!/usr/bin/env bash
set -euo pipefail

SUPABASE_LOCAL_URL="${SUPABASE_LOCAL_URL:-http://127.0.0.1:54321}"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared not found."
  echo "Install it first: brew install cloudflared"
  exit 1
fi

if ! curl -sS -o /dev/null --max-time 3 "${SUPABASE_LOCAL_URL}/functions/v1/scan_qr"; then
  echo "Warning: ${SUPABASE_LOCAL_URL} is not reachable right now."
  echo "Start local Supabase first and run: bash product/scripts/mobile-functions-smoke-check.sh"
fi

echo "Starting Cloudflare quick tunnel for ${SUPABASE_LOCAL_URL}"
echo "Copy generated https://<random>.trycloudflare.com URL into EXPO_PUBLIC_SUPABASE_URL."
echo

exec cloudflared tunnel --url "${SUPABASE_LOCAL_URL}"
