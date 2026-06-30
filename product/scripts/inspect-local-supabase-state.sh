#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

run_query() {
  (
    cd "$ROOT_DIR"
    pnpm exec supabase db query "$1" --local --agent=no --workdir product
  )
}

query_scalar() {
  (
    cd "$ROOT_DIR"
    pnpm exec supabase db query "$1" --local --output csv --agent=no --workdir product 2>/dev/null
  ) | tail -n1 | tr -d '\r'
}

echo "== Local Supabase State =="
echo

run_query "select datname from pg_database order by datname;"
echo
run_query \"select 'auth.users' as table_name, count(*) from auth.users union all select 'public.users', count(*) from public.users union all select 'public.coffees', count(*) from public.coffees union all select 'public.roast_batches', count(*) from public.roast_batches union all select 'public.reviews', count(*) from public.reviews union all select 'public.coffee_logs', count(*) from public.coffee_logs union all select 'public.coffee_log_tasting_notes', count(*) from public.coffee_log_tasting_notes union all select 'public.coffee_log_telemetry_core', count(*) from public.coffee_log_telemetry_core union all select 'public.user_favorite_flavor_notes', count(*) from public.user_favorite_flavor_notes order by 1;\"
echo
run_query "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'coffee_log_telemetry_core' order by ordinal_position;"
echo
DEV_BOOTSTRAP_STATE_TABLE="$(query_scalar "select case when to_regclass('public.dev_bootstrap_state') is null then 'missing' else 'present' end;")"
echo "dev_bootstrap_state table: ${DEV_BOOTSTRAP_STATE_TABLE}"

if [[ "$DEV_BOOTSTRAP_STATE_TABLE" == "present" ]]; then
  echo
  run_query "select singleton, profile, seed_version, last_reset_at, updated_at from public.dev_bootstrap_state order by singleton desc;"
fi
