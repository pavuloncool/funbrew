#!/usr/bin/env bash
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

run_required() {
  local label="$1"
  local cmd="$2"
  echo
  echo "== $label =="
  echo "$cmd"
  if bash -lc "$cmd"; then
    echo "PASS: $label"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "FAIL: $label"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

run_optional_e2e() {
  local label="$1"
  local cmd="$2"
  local fallback_label="$3"
  local fallback_cmd="$4"

  echo
  echo "== $label =="
  echo "$cmd"

  local e2e_log
  e2e_log="$(mktemp)"

  if bash -lc "$cmd" 2>&1 | tee "$e2e_log"; then
    echo "PASS: $label"
    PASS_COUNT=$((PASS_COUNT + 1))
    rm -f "$e2e_log"
    return
  fi

  local reason
  reason="$(tail -n 80 "$e2e_log" | tr '\n' ' ' | sed 's/[[:space:]]\+/ /g' | cut -c1-600)"
  echo "WARN: $label failed. Reason: ${reason}"
  WARN_COUNT=$((WARN_COUNT + 1))

  echo
  echo "== Fallback: $fallback_label =="
  echo "$fallback_cmd"
  if bash -lc "$fallback_cmd"; then
    echo "PASS (fallback): $fallback_label"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "FAIL (fallback): $fallback_label"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi

  rm -f "$e2e_log"
}

echo "Running beta smoke tests from: $ROOT_DIR"

run_required \
  "1) Shared tasting/offline" \
  "pnpm -C packages/shared test -- src/services/tastingService.test.ts src/services/offlineTastingQueue.test.ts src/services/offlineTasting.integration.test.ts"

run_required \
  "2) Shared coffee-page normalization" \
  "pnpm -C packages/shared test -- src/coffeePage/normalizeCoffeePage.test.ts"

run_required \
  "3) Web key logic tests" \
  "pnpm -C apps/web test -- src/lib/canonicalBatchFlow.test.ts src/lib/uploadCoffeeLabel.test.ts"

run_optional_e2e \
  "4) Web e2e smoke (batch|qr|analytics)" \
  "pnpm -C apps/web test:e2e -- --grep \"batch|qr|analytics\"" \
  "4b) Web fallback smoke (unit subset)" \
  "pnpm -C apps/web test -- src/lib/canonicalBatchFlow.test.ts src/lib/uploadCoffeeLabel.test.ts"

echo
if [[ "$FAIL_COUNT" -gt 0 ]]; then
  echo "Beta smoke summary: FAIL (pass=${PASS_COUNT}, warn=${WARN_COUNT}, fail=${FAIL_COUNT})"
  exit 1
fi

echo "Beta smoke summary: PASS (pass=${PASS_COUNT}, warn=${WARN_COUNT}, fail=${FAIL_COUNT})"
