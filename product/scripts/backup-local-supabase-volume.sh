#!/usr/bin/env bash
set -euo pipefail

SOURCE_VOLUME="${1:-supabase_db_funcup}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_VOLUME="${2:-${SOURCE_VOLUME}_backup_${TIMESTAMP}}"
IMAGE="${SUPABASE_POSTGRES_IMAGE:-public.ecr.aws/supabase/postgres:17.6.1.106}"

if ! docker volume ls --format '{{.Name}}' | rg -x "$SOURCE_VOLUME" >/dev/null; then
  echo "Missing source Docker volume: $SOURCE_VOLUME" >&2
  exit 1
fi

if docker volume ls --format '{{.Name}}' | rg -x "$BACKUP_VOLUME" >/dev/null; then
  echo "Backup volume already exists: $BACKUP_VOLUME" >&2
  exit 1
fi

docker volume create "$BACKUP_VOLUME" >/dev/null
docker run --rm --user root --entrypoint bash \
  -v "${SOURCE_VOLUME}:/from:ro" \
  -v "${BACKUP_VOLUME}:/to" \
  "$IMAGE" \
  -lc "cd /from && tar cf - . | tar xpf - -C /to"

echo "Created backup volume: $BACKUP_VOLUME"
