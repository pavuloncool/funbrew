#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
PRODUCT_DIR="${ROOT_DIR}/product"

BASE_URL="${1:-http://127.0.0.1:54321/functions/v1}"
API_URL="${BASE_URL%/functions/v1}"
FAILED=0
CHECK_MODE="${MOBILE_SMOKE_CHECK_MODE:-full}"
HTTP_RETRY_COUNT="${MOBILE_SMOKE_CHECK_RETRIES:-5}"
HTTP_RETRY_DELAY_SECONDS="${MOBILE_SMOKE_CHECK_RETRY_DELAY_SECONDS:-2}"

if [[ "${1:-}" == "--consumer-only" ]]; then
  CHECK_MODE="consumer-only"
  BASE_URL="${2:-http://127.0.0.1:54321/functions/v1}"
  API_URL="${BASE_URL%/functions/v1}"
fi

get_status_env_value() {
  local key="$1"
  local value
  value="$(
    cd "$ROOT_DIR" &&
      pnpm exec supabase status -o env --workdir "$PRODUCT_DIR" 2>/dev/null |
      sed -n "s/^${key}=\"\\(.*\\)\"$/\\1/p" |
      head -n1
  )"
  printf '%s' "$value"
}

curl_with_retries() {
  local output_file="$1"
  shift

  local attempt=1
  local code=""

  while (( attempt <= HTTP_RETRY_COUNT )); do
    code="$(curl -s -o "$output_file" -w "%{http_code}" "$@" || true)"
    if [[ "$code" =~ ^[23] ]]; then
      printf '%s' "$code"
      return 0
    fi

    if (( attempt == HTTP_RETRY_COUNT )); then
      printf '%s' "$code"
      return 0
    fi

    sleep "$HTTP_RETRY_DELAY_SECONDS"
    attempt=$((attempt + 1))
  done
}

check_endpoint() {
  local fn_name="$1"
  local code
  local attempt=1

  while (( attempt <= HTTP_RETRY_COUNT )); do
    code="$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "${BASE_URL}/${fn_name}" || true)"
    if [[ "$code" =~ ^[23] ]]; then
      echo "PASS: ${fn_name} reachable (HTTP ${code})"
      return 0
    fi

    if [[ "$code" == "404" ]]; then
      echo "FAIL: ${fn_name} not found at ${BASE_URL}/${fn_name}"
      return 1
    fi

    if (( attempt == HTTP_RETRY_COUNT )); then
      if [[ "$code" == "000" ]]; then
        echo "FAIL: ${fn_name} unreachable at ${BASE_URL}/${fn_name} (connection failed)"
      else
        echo "FAIL: ${fn_name} returned HTTP ${code} at ${BASE_URL}/${fn_name}"
      fi
      return 1
    fi

    sleep "$HTTP_RETRY_DELAY_SECONDS"
    attempt=$((attempt + 1))
  done
}

check_roaster_batch_publications() {
  local anon_key token code body_file
  anon_key="$(get_status_env_value "ANON_KEY")"
  if [[ -z "$anon_key" ]]; then
    echo "FAIL: could not resolve ANON_KEY from supabase status -o env"
    return 1
  fi

  body_file="$(mktemp)"
  code="$(curl_with_retries "$body_file" \
    -X POST "${API_URL}/auth/v1/token?grant_type=password" \
    -H "apikey: ${anon_key}" \
    -H "Content-Type: application/json" \
    -d '{"email":"bart@ex.com","password":"swetry"}')"

  if [[ ! "$code" =~ ^2 ]]; then
    echo "FAIL: seeded roaster auth returned HTTP ${code}"
    cat "$body_file"
    rm -f "$body_file"
    return 1
  fi

  token="$(sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p' "$body_file" | head -n1)"
  rm -f "$body_file"

  if [[ -z "$token" ]]; then
    echo "FAIL: seeded roaster auth did not return an access token"
    return 1
  fi

  body_file="$(mktemp)"
  code="$(curl_with_retries "$body_file" \
    -X POST "${BASE_URL}/roaster_batch_publications" \
    -H "apikey: ${anon_key}" \
    -H "Authorization: Bearer ${token}" \
    -H "Content-Type: application/json" \
    -d '{"mode":"list"}')"

  if [[ ! "$code" =~ ^2 ]]; then
    echo "FAIL: roaster_batch_publications returned HTTP ${code}"
    cat "$body_file"
    rm -f "$body_file"
    return 1
  fi

  echo "PASS: roaster_batch_publications reachable after roaster auth (HTTP ${code})"
  rm -f "$body_file"
  return 0
}

check_consumer_auth() {
  local anon_key code body_file
  anon_key="$(get_status_env_value "ANON_KEY")"
  if [[ -z "$anon_key" ]]; then
    echo "FAIL: could not resolve ANON_KEY from supabase status -o env"
    return 1
  fi

  body_file="$(mktemp)"
  code="$(curl_with_retries "$body_file" \
    -X POST "${API_URL}/auth/v1/token?grant_type=password" \
    -H "apikey: ${anon_key}" \
    -H "Content-Type: application/json" \
    -d '{"email":"kazik@neoneon.online","password":"swetry"}')"

  if [[ ! "$code" =~ ^2 ]]; then
    echo "FAIL: seeded consumer auth returned HTTP ${code}"
    cat "$body_file"
    rm -f "$body_file"
    return 1
  fi

  echo "PASS: seeded consumer auth reachable (HTTP ${code})"
  rm -f "$body_file"
  return 0
}

echo "== Mobile Functions Smoke Check =="
echo "Base URL: ${BASE_URL}"
echo

check_endpoint "scan_qr" || FAILED=1

if check_endpoint "log_tasting"; then
  :
elif check_endpoint "coffee/log-tasting"; then
  echo "WARN: canonical log_tasting missing; using legacy coffee/log-tasting alias."
else
  FAILED=1
fi

check_endpoint "update_coffee_stats" || FAILED=1

if [[ "$CHECK_MODE" == "consumer-only" ]]; then
  check_consumer_auth || FAILED=1
else
  check_roaster_batch_publications || FAILED=1
fi

echo
if [[ "$FAILED" -ne 0 ]]; then
  echo "Smoke check failed. Start/serve missing functions before mobile QA."
  exit 1
fi

echo "Smoke check passed."
