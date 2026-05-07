#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:54321/functions/v1}"
FAILED=0

check_endpoint() {
  local fn_name="$1"
  local code
  code="$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "${BASE_URL}/${fn_name}" || true)"
  if [[ "$code" == "404" ]]; then
    echo "FAIL: ${fn_name} not found at ${BASE_URL}/${fn_name}"
    return 1
  fi
  if [[ "$code" == "000" ]]; then
    echo "FAIL: ${fn_name} unreachable at ${BASE_URL}/${fn_name} (connection failed)"
    return 1
  fi
  if [[ ! "$code" =~ ^[23] ]]; then
    echo "FAIL: ${fn_name} returned HTTP ${code} at ${BASE_URL}/${fn_name}"
    return 1
  fi
  echo "PASS: ${fn_name} reachable (HTTP ${code})"
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

echo
if [[ "$FAILED" -ne 0 ]]; then
  echo "Smoke check failed. Start/serve missing functions before mobile QA."
  exit 1
fi

echo "Smoke check passed."
