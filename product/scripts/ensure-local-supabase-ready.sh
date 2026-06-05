#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PRODUCT_DIR="${ROOT_DIR}/product"
WEB_ENV_SYNC_SCRIPT="${PRODUCT_DIR}/apps/web/scripts/sync-supabase-env-local.sh"

FORCE_RESET=0
SKIP_WEB_ENV_SYNC=0
MIN_PUBLIC_TABLES="${MIN_PUBLIC_TABLES:-15}"
MIN_AUTH_USERS="${MIN_AUTH_USERS:-4}"
MIN_COFFEES="${MIN_COFFEES:-5}"
MIN_BATCHES="${MIN_BATCHES:-5}"
REQUIRED_SENSORY_COLUMN_COUNT="${REQUIRED_SENSORY_COLUMN_COUNT:-1}"

usage() {
  cat <<'USAGE'
Usage: bash product/scripts/ensure-local-supabase-ready.sh [options]

Ensures the local Supabase stack is healthy for Funcup web/mobile work.
The script starts the stack if needed, checks schema/auth/demo seed state,
and fails closed if local data drift is detected. It does not reset data
unless you explicitly pass `--force-reset`.

Options:
  --force-reset        destructive: run `supabase db reset --local` even if health checks pass
  --skip-web-env-sync  do not refresh product/apps/web/.env.local from Supabase status
  --help               show this help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force-reset)
      FORCE_RESET=1
      shift
      ;;
    --skip-web-env-sync)
      SKIP_WEB_ENV_SYNC=1
      shift
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

run_supabase() {
  (
    cd "$ROOT_DIR"
    pnpm exec supabase "$@" --workdir product
  )
}

query_scalar() {
  local sql="$1"
  local output

  if ! output="$(
    cd "$ROOT_DIR" &&
      pnpm exec supabase db query "$sql" --local --output csv --agent=no --workdir product 2>/dev/null
  )"; then
    echo "0"
    return 0
  fi

  echo "$output" | tail -n1 | tr -d '\r'
}

sync_web_env() {
  if [[ "$SKIP_WEB_ENV_SYNC" -eq 1 ]]; then
    return 0
  fi

  if [[ ! -x "$WEB_ENV_SYNC_SCRIPT" ]]; then
    chmod +x "$WEB_ENV_SYNC_SCRIPT"
  fi

  (
    cd "$ROOT_DIR"
    bash "$WEB_ENV_SYNC_SCRIPT"
  )
}

collect_health_metrics() {
  PUBLIC_TABLES="$(
    query_scalar "select count(*) from pg_tables where schemaname = 'public';"
  )"
  AUTH_USERS="$(
    query_scalar "select count(*) from auth.users;"
  )"
  COFFEES="$(
    query_scalar "select case when to_regclass('public.coffees') is null then 0 else (select count(*) from public.coffees) end;"
  )"
  BATCHES="$(
    query_scalar "select case when to_regclass('public.roast_batches') is null then 0 else (select count(*) from public.roast_batches) end;"
  )"
  TELEMETRY_SENSORY_BITTER_COLUMNS="$(
    query_scalar "select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'coffee_log_telemetry_core' and column_name = 'sensory_bitter';"
  )"
  TELEMETRY_SENSORY_AFTERTASTE_COLUMNS="$(
    query_scalar "select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'coffee_log_telemetry_core' and column_name = 'sensory_aftertaste';"
  )"
}

is_healthy() {
  [[ "$PUBLIC_TABLES" =~ ^[0-9]+$ ]] || return 1
  [[ "$AUTH_USERS" =~ ^[0-9]+$ ]] || return 1
  [[ "$COFFEES" =~ ^[0-9]+$ ]] || return 1
  [[ "$BATCHES" =~ ^[0-9]+$ ]] || return 1
  [[ "$TELEMETRY_SENSORY_BITTER_COLUMNS" =~ ^[0-9]+$ ]] || return 1
  [[ "$TELEMETRY_SENSORY_AFTERTASTE_COLUMNS" =~ ^[0-9]+$ ]] || return 1

  (( PUBLIC_TABLES >= MIN_PUBLIC_TABLES )) &&
    (( AUTH_USERS >= MIN_AUTH_USERS )) &&
    (( COFFEES >= MIN_COFFEES )) &&
    (( BATCHES >= MIN_BATCHES )) &&
    (( TELEMETRY_SENSORY_BITTER_COLUMNS >= REQUIRED_SENSORY_COLUMN_COUNT )) &&
    (( TELEMETRY_SENSORY_AFTERTASTE_COLUMNS >= REQUIRED_SENSORY_COLUMN_COUNT ))
}

print_metrics() {
  echo "Local Supabase metrics:"
  echo "  public tables : ${PUBLIC_TABLES}"
  echo "  auth users    : ${AUTH_USERS}"
  echo "  coffees       : ${COFFEES}"
  echo "  roast batches : ${BATCHES}"
  echo "  telemetry.sensory_bitter columns     : ${TELEMETRY_SENSORY_BITTER_COLUMNS}"
  echo "  telemetry.sensory_aftertaste columns : ${TELEMETRY_SENSORY_AFTERTASTE_COLUMNS}"
}

echo "Starting local Supabase..."
run_supabase start

echo "Syncing web Supabase env..."
sync_web_env

echo "Checking schema/auth/demo seed health..."
collect_health_metrics
print_metrics

if [[ "$FORCE_RESET" -eq 1 ]]; then
  echo "Forced reset requested."
  echo "WARNING: this deletes local runtime data and restores seed state."

  run_supabase db reset --local

  echo "Refreshing web Supabase env after reset..."
  sync_web_env

  echo "Re-checking schema/auth/demo seed health..."
  collect_health_metrics
  print_metrics
fi

if ! is_healthy; then
  echo "Local Supabase health check failed." >&2
  echo "No automatic reset was performed." >&2
  if (( TELEMETRY_SENSORY_BITTER_COLUMNS < REQUIRED_SENSORY_COLUMN_COUNT )) || (( TELEMETRY_SENSORY_AFTERTASTE_COLUMNS < REQUIRED_SENSORY_COLUMN_COUNT )); then
    echo "Local Supabase is missing required Sensory Core columns in public.coffee_log_telemetry_core." >&2
    echo "Run a schema-only repair before considering any reset." >&2
  fi
  echo "Inspect local state: \`bash product/scripts/inspect-local-supabase-state.sh\`" >&2
  echo "Backup current volume: \`bash product/scripts/backup-local-supabase-volume.sh\`" >&2
  echo "Destructive reset only if you accept data loss: \`bash product/scripts/ensure-local-supabase-ready.sh --force-reset\`" >&2
  exit 1
fi

echo "Local Supabase is ready for Funcup."
