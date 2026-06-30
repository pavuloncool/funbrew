#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PRODUCT_DIR="${ROOT_DIR}/product"
WEB_ENV_SYNC_SCRIPT="${PRODUCT_DIR}/apps/web/scripts/sync-supabase-env-local.sh"
MOBILE_ENV_SYNC_SCRIPT="${PRODUCT_DIR}/apps/consumer-mobile/scripts/sync-supabase-env-local.sh"

FORCE_RESET=0
SKIP_WEB_ENV_SYNC=0
SKIP_MOBILE_ENV_SYNC=0
RECOMMENDED_DEMO_COFFEES="${RECOMMENDED_DEMO_COFFEES:-5}"
RECOMMENDED_DEMO_BATCHES="${RECOMMENDED_DEMO_BATCHES:-5}"
REQUIRED_SENSORY_COLUMN_COUNT="${REQUIRED_SENSORY_COLUMN_COUNT:-1}"
REQUIRED_PUBLIC_TABLE_COUNT=5
LATEST_REPO_MIGRATION=""

usage() {
  cat <<'USAGE'
Usage: bash product/scripts/ensure-local-supabase-ready.sh [options]

Ensures the local Supabase stack is healthy for Funcup web/mobile work.
The script starts the stack if needed, applies pending local migrations,
syncs local app env files, and validates schema/runtime readiness.
It does not reset data unless you explicitly pass `--force-reset`.

Options:
  --force-reset         destructive: run `supabase db reset --local` and restore demo seed state
  --skip-web-env-sync   do not refresh product/apps/web/.env.local from Supabase status
  --skip-mobile-env-sync do not refresh product/apps/consumer-mobile/.env.local
  --help                show this help
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
    --skip-mobile-env-sync)
      SKIP_MOBILE_ENV_SYNC=1
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

query_value() {
  local sql="$1"
  local default_value="${2:-}"
  local output

  if ! output="$(
    cd "$ROOT_DIR" &&
      pnpm exec supabase db query "$sql" --local --output csv --agent=no --workdir product 2>/dev/null
  )"; then
    printf '%s' "$default_value"
    return 0
  fi

  printf '%s' "$(echo "$output" | tail -n1 | tr -d '\r')"
}

execute_sql() {
  local sql="$1"
  (
    cd "$ROOT_DIR"
    pnpm exec supabase db query "$sql" --local --agent=no --workdir product >/dev/null
  )
}

get_latest_repo_migration() {
  local latest_file
  if command -v rg >/dev/null 2>&1; then
    latest_file="$(
      cd "$ROOT_DIR" &&
        rg --files product/supabase/migrations | sort | tail -n1
    )"
  else
    latest_file="$(
      cd "$ROOT_DIR" &&
        find product/supabase/migrations -maxdepth 1 -type f | sort | tail -n1
    )"
  fi

  if [[ -z "$latest_file" ]]; then
    echo ""
    return 0
  fi

  basename "$latest_file" | cut -d_ -f1
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

sync_mobile_env() {
  if [[ "$SKIP_MOBILE_ENV_SYNC" -eq 1 ]]; then
    return 0
  fi

  if [[ ! -x "$MOBILE_ENV_SYNC_SCRIPT" ]]; then
    chmod +x "$MOBILE_ENV_SYNC_SCRIPT"
  fi

  (
    cd "$ROOT_DIR"
    bash "$MOBILE_ENV_SYNC_SCRIPT" \
      --supabase-url "http://127.0.0.1:54321" \
      --roaster-web-url "http://127.0.0.1:3000"
  )
}

apply_pending_migrations() {
  echo "Applying pending local migrations..."
  run_supabase migration up --local --yes
}

mark_demo_reset_state() {
  local seed_version="$1"
  execute_sql "
    INSERT INTO public.dev_bootstrap_state (
      singleton,
      profile,
      seed_version,
      last_reset_at,
      updated_at
    )
    VALUES (
      true,
      'demo-reset',
      '${seed_version}',
      now(),
      now()
    )
    ON CONFLICT (singleton) DO UPDATE
    SET
      profile = EXCLUDED.profile,
      seed_version = EXCLUDED.seed_version,
      last_reset_at = EXCLUDED.last_reset_at,
      updated_at = EXCLUDED.updated_at;
  "
}

collect_health_metrics() {
  PUBLIC_TABLES="$(
    query_value "select count(*) from pg_tables where schemaname = 'public';" "0"
  )"
  REQUIRED_PUBLIC_TABLES_PRESENT="$(
    query_value "select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('users', 'roasters', 'coffees', 'roast_batches', 'coffee_log_telemetry_core');" "0"
  )"
  AUTH_USERS="$(
    query_value "select case when to_regclass('auth.users') is null then 0 else (select count(*) from auth.users) end;" "0"
  )"
  COFFEES="$(
    query_value "select case when to_regclass('public.coffees') is null then 0 else (select count(*) from public.coffees) end;" "0"
  )"
  BATCHES="$(
    query_value "select case when to_regclass('public.roast_batches') is null then 0 else (select count(*) from public.roast_batches) end;" "0"
  )"
  TELEMETRY_SENSORY_BITTER_COLUMNS="$(
    query_value "select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'coffee_log_telemetry_core' and column_name = 'sensory_bitter';" "0"
  )"
  TELEMETRY_SENSORY_AFTERTASTE_COLUMNS="$(
    query_value "select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'coffee_log_telemetry_core' and column_name = 'sensory_aftertaste';" "0"
  )"
  LATEST_APPLIED_MIGRATION="$(
    query_value "select coalesce(max(version), '') from supabase_migrations.schema_migrations;" ""
  )"
  DEV_BOOTSTRAP_STATE_TABLE_PRESENT="$(
    query_value "select count(*) from information_schema.tables where table_schema = 'public' and table_name = 'dev_bootstrap_state';" "0"
  )"
  DEV_PROFILE="$(
    query_value "select coalesce((select profile from public.dev_bootstrap_state where singleton = true limit 1), 'missing');" "missing"
  )"
  DEV_SEED_VERSION="$(
    query_value "select coalesce((select seed_version from public.dev_bootstrap_state where singleton = true limit 1), 'unset');" "unset"
  )"
  DEV_LAST_RESET_AT="$(
    query_value "select coalesce((select to_char(last_reset_at, 'YYYY-MM-DD\"T\"HH24:MI:SSOF') from public.dev_bootstrap_state where singleton = true limit 1), 'never');" "never"
  )"

  FUNCTIONS_SCAN_QR_STATUS="$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "http://127.0.0.1:54321/functions/v1/scan_qr" || true)"
}

is_healthy() {
  [[ "$PUBLIC_TABLES" =~ ^[0-9]+$ ]] || return 1
  [[ "$REQUIRED_PUBLIC_TABLES_PRESENT" =~ ^[0-9]+$ ]] || return 1
  [[ "$AUTH_USERS" =~ ^[0-9]+$ ]] || return 1
  [[ "$COFFEES" =~ ^[0-9]+$ ]] || return 1
  [[ "$BATCHES" =~ ^[0-9]+$ ]] || return 1
  [[ "$TELEMETRY_SENSORY_BITTER_COLUMNS" =~ ^[0-9]+$ ]] || return 1
  [[ "$TELEMETRY_SENSORY_AFTERTASTE_COLUMNS" =~ ^[0-9]+$ ]] || return 1
  [[ "$DEV_BOOTSTRAP_STATE_TABLE_PRESENT" =~ ^[0-9]+$ ]] || return 1
  [[ -n "$LATEST_REPO_MIGRATION" ]] || return 1

  (( REQUIRED_PUBLIC_TABLES_PRESENT == REQUIRED_PUBLIC_TABLE_COUNT )) &&
    (( DEV_BOOTSTRAP_STATE_TABLE_PRESENT >= 1 )) &&
    (( TELEMETRY_SENSORY_BITTER_COLUMNS >= REQUIRED_SENSORY_COLUMN_COUNT )) &&
    (( TELEMETRY_SENSORY_AFTERTASTE_COLUMNS >= REQUIRED_SENSORY_COLUMN_COUNT )) &&
    [[ "$LATEST_APPLIED_MIGRATION" == "$LATEST_REPO_MIGRATION" ]] &&
    [[ "$DEV_PROFILE" != "missing" ]]
}

print_metrics() {
  echo "Local Supabase metrics:"
  echo "  public tables                  : ${PUBLIC_TABLES}"
  echo "  required public tables present : ${REQUIRED_PUBLIC_TABLES_PRESENT}/${REQUIRED_PUBLIC_TABLE_COUNT}"
  echo "  auth users                     : ${AUTH_USERS}"
  echo "  coffees                        : ${COFFEES}"
  echo "  roast batches                  : ${BATCHES}"
  echo "  telemetry.sensory_bitter cols  : ${TELEMETRY_SENSORY_BITTER_COLUMNS}"
  echo "  telemetry.sensory_aftertaste cols: ${TELEMETRY_SENSORY_AFTERTASTE_COLUMNS}"
  echo "  latest repo migration          : ${LATEST_REPO_MIGRATION}"
  echo "  latest applied migration       : ${LATEST_APPLIED_MIGRATION}"
  echo "  dev profile                    : ${DEV_PROFILE}"
  echo "  dev seed version               : ${DEV_SEED_VERSION}"
  echo "  last demo reset                : ${DEV_LAST_RESET_AT}"
  echo "  scan_qr endpoint status        : ${FUNCTIONS_SCAN_QR_STATUS:-000}"

  if (( COFFEES < RECOMMENDED_DEMO_COFFEES )); then
    echo "WARN: demo coffee count is below the recommended seed benchmark (${COFFEES} < ${RECOMMENDED_DEMO_COFFEES})."
  fi

  if (( BATCHES < RECOMMENDED_DEMO_BATCHES )); then
    echo "WARN: demo roast batch count is below the recommended seed benchmark (${BATCHES} < ${RECOMMENDED_DEMO_BATCHES})."
  fi

  if [[ "${FUNCTIONS_SCAN_QR_STATUS:-000}" == "000" ]]; then
    echo "NOTE: local Edge Functions are not serving yet. This is expected until you run \`supabase functions serve\`."
  fi
}

LATEST_REPO_MIGRATION="$(get_latest_repo_migration)"

echo "Starting local Supabase..."
run_supabase start

apply_pending_migrations

echo "Syncing web Supabase env..."
sync_web_env

echo "Syncing mobile Supabase env..."
sync_mobile_env

echo "Checking schema/runtime health..."
collect_health_metrics
print_metrics

if [[ "$FORCE_RESET" -eq 1 ]]; then
  echo "Forced demo reset requested."
  echo "WARNING: this deletes local runtime data and restores demo seed state."

  run_supabase db reset --local --yes
  mark_demo_reset_state "$LATEST_REPO_MIGRATION"

  echo "Refreshing app env after reset..."
  sync_web_env
  sync_mobile_env

  echo "Re-checking schema/runtime health..."
  collect_health_metrics
  print_metrics
fi

if ! is_healthy; then
  echo "Local Supabase health check failed." >&2
  if [[ "$LATEST_APPLIED_MIGRATION" != "$LATEST_REPO_MIGRATION" ]]; then
    echo "Pending local migrations were not applied cleanly." >&2
  fi
  if (( DEV_BOOTSTRAP_STATE_TABLE_PRESENT < 1 )); then
    echo "Missing public.dev_bootstrap_state metadata table." >&2
  fi
  if (( TELEMETRY_SENSORY_BITTER_COLUMNS < REQUIRED_SENSORY_COLUMN_COUNT )) || (( TELEMETRY_SENSORY_AFTERTASTE_COLUMNS < REQUIRED_SENSORY_COLUMN_COUNT )); then
    echo "Local Supabase is missing required Sensory Core columns in public.coffee_log_telemetry_core." >&2
  fi
  echo "Inspect local state: \`bash product/scripts/inspect-local-supabase-state.sh\`" >&2
  echo "Doctor summary: \`bash product/scripts/db-doctor.sh\`" >&2
  echo "Backup current volume: \`bash product/scripts/backup-local-supabase-volume.sh\`" >&2
  echo "Destructive demo reset only if you accept data loss: \`pnpm run db:reset:demo\`" >&2
  exit 1
fi

echo "Local Supabase is ready for Funcup."
