#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "${APP_ROOT}/../../.." && pwd)"
ENV_LOCAL="${APP_ROOT}/.env.local"

SUPABASE_URL_OVERRIDE=""
ANON_KEY_OVERRIDE=""
APP_URL_OVERRIDE=""
ROASTER_WEB_URL_OVERRIDE=""

usage() {
  cat <<'USAGE'
Usage: bash product/apps/consumer-mobile/scripts/sync-supabase-env-local.sh [options]

Options:
  --supabase-url <url>    override EXPO_PUBLIC_SUPABASE_URL
  --anon-key <key>        override EXPO_PUBLIC_SUPABASE_ANON_KEY
  --app-url <url>         set EXPO_PUBLIC_APP_URL
  --roaster-web-url <url> set EXPO_PUBLIC_ROASTER_WEB_URL
  --help                  show this help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --supabase-url)
      SUPABASE_URL_OVERRIDE="${2:-}"
      shift 2
      ;;
    --anon-key)
      ANON_KEY_OVERRIDE="${2:-}"
      shift 2
      ;;
    --app-url)
      APP_URL_OVERRIDE="${2:-}"
      shift 2
      ;;
    --roaster-web-url)
      ROASTER_WEB_URL_OVERRIDE="${2:-}"
      shift 2
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

STATUS_ENV="$(mktemp)"
trap 'rm -f "$STATUS_ENV"' EXIT

cd "$REPO_ROOT"
if ! pnpm exec supabase status -o env --workdir product >"$STATUS_ENV" 2>/dev/null; then
  echo "error: supabase status failed (is Docker running and local Supabase started?)" >&2
  exit 1
fi

API_URL="$(sed -n 's/^API_URL="\([^"]*\)"$/\1/p' "$STATUS_ENV" | head -n1)"
ANON_KEY="$(sed -n 's/^ANON_KEY="\([^"]*\)"$/\1/p' "$STATUS_ENV" | head -n1)"

SUPABASE_URL="${SUPABASE_URL_OVERRIDE:-$API_URL}"
ANON_KEY="${ANON_KEY_OVERRIDE:-$ANON_KEY}"

if [[ -z "$SUPABASE_URL" || -z "$ANON_KEY" ]]; then
  echo "error: could not resolve EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY" >&2
  exit 1
fi

umask 077
FILTERED_ENV="$(mktemp)"

if [[ -f "$ENV_LOCAL" ]]; then
  grep -v -E '^(EXPO_PUBLIC_SUPABASE_URL|EXPO_PUBLIC_SUPABASE_ANON_KEY|EXPO_PUBLIC_APP_URL|EXPO_PUBLIC_ROASTER_WEB_URL)=' "$ENV_LOCAL" >"$FILTERED_ENV" || true
else
  : >"$FILTERED_ENV"
fi

mv "$FILTERED_ENV" "$ENV_LOCAL"

{
  echo ""
  echo "# Synced from: supabase status -o env ($(date -u +%Y-%m-%dT%H:%MZ))"
  echo "EXPO_PUBLIC_SUPABASE_URL=${SUPABASE_URL}"
  echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}"
  if [[ -n "$APP_URL_OVERRIDE" ]]; then
    echo "EXPO_PUBLIC_APP_URL=${APP_URL_OVERRIDE}"
  fi
  if [[ -n "$ROASTER_WEB_URL_OVERRIDE" ]]; then
    echo "EXPO_PUBLIC_ROASTER_WEB_URL=${ROASTER_WEB_URL_OVERRIDE}"
  fi
} >>"$ENV_LOCAL"

echo "Updated $ENV_LOCAL (mobile Supabase env)."
