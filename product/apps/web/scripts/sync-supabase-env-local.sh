#!/usr/bin/env bash
# Merge ANON_KEY / SERVICE_ROLE_KEY / API_URL from `supabase status` into product/apps/web/.env.local
# Run from repo root after: supabase start
set -euo pipefail
PRODUCT_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
WEB="$PRODUCT_ROOT/apps/web"
ENV_LOCAL="$WEB/.env.local"

cd "$PRODUCT_ROOT"
if ! supabase status -o env >/tmp/supabase-status.env 2>/dev/null; then
  echo "error: supabase status failed (is Docker running and supabase start done?)" >&2
  exit 1
fi

API_URL="$(grep '^API_URL=' /tmp/supabase-status.env | sed 's/^API_URL="//;s/"$//')"
ANON="$(grep '^ANON_KEY=' /tmp/supabase-status.env | sed 's/^ANON_KEY="//;s/"$//')"
SR="$(grep '^SERVICE_ROLE_KEY=' /tmp/supabase-status.env | sed 's/^SERVICE_ROLE_KEY="//;s/"$//')"

if [[ -z "$ANON" || -z "$SR" || -z "$API_URL" ]]; then
  echo "error: could not parse ANON_KEY, SERVICE_ROLE_KEY, or API_URL from supabase status" >&2
  exit 1
fi

umask 077
if [[ -f "$ENV_LOCAL" ]]; then
  grep -v -E '^(SUPABASE_URL|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY)=' "$ENV_LOCAL" >"${ENV_LOCAL}.tmp" || true
  mv "${ENV_LOCAL}.tmp" "$ENV_LOCAL"
fi

{
  echo "# Synced from: supabase status -o env ($(date -u +%Y-%m-%dT%H:%MZ))"
  echo "SUPABASE_URL=${API_URL}"
  echo "SUPABASE_ANON_KEY=${ANON}"
  echo "SUPABASE_SERVICE_ROLE_KEY=${SR}"
  echo "NEXT_PUBLIC_SUPABASE_URL=${API_URL}"
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON}"
  echo ""
} >>"$ENV_LOCAL"

echo "Updated $ENV_LOCAL (Supabase URL + anon + service role JWTs)."
