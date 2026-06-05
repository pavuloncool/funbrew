#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

run_query() {
  (
    cd "$ROOT_DIR"
    pnpm exec supabase db query "$1" --local --agent=no --workdir product
  )
}

echo "== Local Supabase State =="
echo

run_query "select datname from pg_database order by datname;"
echo
run_query \"select 'auth.users' as table_name, count(*) from auth.users union all select 'public.users', count(*) from public.users union all select 'public.coffees', count(*) from public.coffees union all select 'public.roast_batches', count(*) from public.roast_batches union all select 'public.reviews', count(*) from public.reviews union all select 'public.coffee_logs', count(*) from public.coffee_logs union all select 'public.coffee_log_tasting_notes', count(*) from public.coffee_log_tasting_notes union all select 'public.coffee_log_telemetry_core', count(*) from public.coffee_log_telemetry_core union all select 'public.user_favorite_flavor_notes', count(*) from public.user_favorite_flavor_notes order by 1;\"
echo
run_query "select column_name from information_schema.columns where table_schema = 'public' and table_name = 'coffee_log_telemetry_core' order by ordinal_position;"
