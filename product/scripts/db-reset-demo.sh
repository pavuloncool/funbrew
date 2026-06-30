#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "Creating backup of the current local Supabase volume..."
bash "${ROOT_DIR}/product/scripts/backup-local-supabase-volume.sh"

echo "Resetting local Supabase to the repo demo seed state..."
bash "${ROOT_DIR}/product/scripts/ensure-local-supabase-ready.sh" --force-reset

echo "Local demo reset completed."
