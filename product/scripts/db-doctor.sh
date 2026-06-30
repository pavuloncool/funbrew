#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

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

LATEST_REPO_MIGRATION="$(get_latest_repo_migration)"

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

echo "== Funcup DB Doctor =="
echo

LATEST_APPLIED_MIGRATION="$(
  query_value "select coalesce(max(version), '') from supabase_migrations.schema_migrations;" "unavailable"
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
COFFEES="$(
  query_value "select case when to_regclass('public.coffees') is null then 0 else (select count(*) from public.coffees) end;" "0"
)"
BATCHES="$(
  query_value "select case when to_regclass('public.roast_batches') is null then 0 else (select count(*) from public.roast_batches) end;" "0"
)"
AUTH_USERS="$(
  query_value "select case when to_regclass('auth.users') is null then 0 else (select count(*) from auth.users) end;" "0"
)"
SENSORY_BITTER="$(
  query_value "select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'coffee_log_telemetry_core' and column_name = 'sensory_bitter';" "0"
)"
SENSORY_AFTERTASTE="$(
  query_value "select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'coffee_log_telemetry_core' and column_name = 'sensory_aftertaste';" "0"
)"
FUNCTIONS_SCAN_QR_STATUS="$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "http://127.0.0.1:54321/functions/v1/scan_qr" || true)"

echo "Latest repo migration    : ${LATEST_REPO_MIGRATION:-missing}"
echo "Latest applied migration : ${LATEST_APPLIED_MIGRATION}"
echo "Dev profile              : ${DEV_PROFILE}"
echo "Dev seed version         : ${DEV_SEED_VERSION}"
echo "Last demo reset          : ${DEV_LAST_RESET_AT}"
echo "Auth users               : ${AUTH_USERS}"
echo "Coffees                  : ${COFFEES}"
echo "Roast batches            : ${BATCHES}"
echo "Sensory bitter column    : ${SENSORY_BITTER}"
echo "Sensory aftertaste column: ${SENSORY_AFTERTASTE}"
echo "scan_qr status           : ${FUNCTIONS_SCAN_QR_STATUS:-000}"
echo

if [[ -n "${LATEST_REPO_MIGRATION:-}" && "$LATEST_APPLIED_MIGRATION" != "$LATEST_REPO_MIGRATION" ]]; then
  echo "WARN: latest repo migration is not applied locally."
fi

if [[ "$DEV_PROFILE" == "missing" ]]; then
  echo "WARN: dev bootstrap metadata is missing. Run \`pnpm run supabase:local:ensure\`."
fi

if [[ "${FUNCTIONS_SCAN_QR_STATUS:-000}" == "000" ]]; then
  echo "NOTE: Edge Functions runtime is not serving yet."
fi
