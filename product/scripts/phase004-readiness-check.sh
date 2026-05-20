#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "== Phase 004 Readiness Check =="
echo

echo "[1/7] Toolchain baseline"
NODE_VERSION="$(node -v)"
PNPM_VERSION="$(pnpm -v)"
echo "Node: ${NODE_VERSION}"
echo "pnpm: ${PNPM_VERSION}"

if [[ ! "$NODE_VERSION" =~ ^v22\. ]]; then
  echo "FAIL: expected Node 22.x baseline"
  exit 1
fi

if [[ ! "$PNPM_VERSION" =~ ^10\. ]]; then
  echo "FAIL: expected pnpm 10.x baseline"
  exit 1
fi

echo
echo "[2/7] Dependency install and peer warnings"
INSTALL_LOG="$(mktemp)"
pnpm install | tee "$INSTALL_LOG"
if rg -i "peer dep|unmet peer|issues with peer dependencies" "$INSTALL_LOG" >/dev/null 2>&1; then
  echo "FAIL: peer dependency warnings detected in pnpm install output"
  rm -f "$INSTALL_LOG"
  exit 1
fi
rm -f "$INSTALL_LOG"
echo "PASS: no peer dependency warnings detected"

echo
echo "[3/7] TypeScript blockers in new modules"
pnpm -C apps/consumer-mobile typecheck
pnpm -C packages/shared typecheck
pnpm exec tsc -p apps/web/tsconfig.json --noEmit
echo "PASS: consumer-mobile/shared/web typechecks"

echo
echo "[4/7] Supabase seed smoke (requires Docker)"
if docker info >/dev/null 2>&1; then
  supabase db reset --local
  echo "PASS: supabase seed smoke completed"
else
  echo "BLOCKED: Docker daemon is not available; cannot run supabase db reset --local"
fi

echo
echo "[5/7] Edge functions readiness"
for fn in scan_qr update_coffee_stats; do
  if [[ -f "supabase/functions/${fn}/index.ts" ]]; then
    echo "PASS: ${fn}"
  else
    echo "FAIL: missing supabase/functions/${fn}/index.ts"
  fi
done

echo
echo "[6/7] Phase 4 web path convention gate"
REQUIRED_PATHS=(
  "apps/web/app/(auth)/login/page.tsx"
  "apps/web/app/(auth)/register/page.tsx"
  "apps/web/app/(auth)/pending/page.tsx"
  "apps/web/app/dashboard/coffees/new/page.tsx"
  "apps/web/app/dashboard/coffees/[id]/page.tsx"
  "apps/web/app/dashboard/coffees/[id]/batches/new/page.tsx"
  "apps/web/app/dashboard/coffees/[id]/batches/[batchId]/page.tsx"
  "apps/web/app/dashboard/coffees/page.tsx"
)

MISSING_PATHS=0
for p in "${REQUIRED_PATHS[@]}"; do
  if [[ -f "$p" ]]; then
    echo "PASS: $p"
  else
    echo "WARN: missing $p (expected if task not implemented yet)"
    MISSING_PATHS=$((MISSING_PATHS + 1))
  fi
done
echo "INFO: path convention anchored at apps/web/app/... (Next.js App Router)"

echo
echo "[7/7] US2 E2E gate definition"
echo "Required flow: web login -> create coffee -> create batch -> QR download (PNG/SVG) -> hash resolves"
echo "Use this as release gate for T043-T053 completion."

echo
echo "Readiness check completed."
