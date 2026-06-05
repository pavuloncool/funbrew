#!/usr/bin/env bash
set -euo pipefail

SESSION_NAME="funcup-dev"
ATTACH_SESSION=1
RESTART_SESSION=0
WAIT_TUNNEL_SECONDS="${WAIT_TUNNEL_SECONDS:-30}"
WAIT_FUNCTIONS_SECONDS="${WAIT_FUNCTIONS_SECONDS:-20}"
SUPABASE_LOCAL_URL="${SUPABASE_LOCAL_URL:-http://127.0.0.1:54321}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
PRODUCT_ROOT="${REPO_ROOT}/product"
MOBILE_ENV_FILE="${PRODUCT_ROOT}/apps/consumer-mobile/.env.local"
MOBILE_ENV_BACKUP="${MOBILE_ENV_FILE}.bak"
TUNNEL_LOG="/tmp/${SESSION_NAME}.tunnel.log"
FUNCTIONS_LOG="/tmp/${SESSION_NAME}.functions.log"

usage() {
  cat <<'USAGE'
Usage: bash product/scripts/dev-mobile-stack.sh [options]

Options:
  --session <name>  tmux session name (default: funcup-dev)
  --no-attach       do not attach to tmux after setup
  --restart         kill existing session and start fresh
  --help            show this help
USAGE
}

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

check_dependencies() {
  local missing=0

  if ! has_cmd tmux; then
    echo "Missing dependency: tmux"
    echo "Install: brew install tmux"
    missing=1
  fi

  if ! has_cmd cloudflared; then
    echo "Missing dependency: cloudflared"
    echo "Install: brew install cloudflared"
    missing=1
  fi

  if ! has_cmd pnpm; then
    echo "Missing dependency: pnpm"
    echo "Install pnpm and rerun."
    missing=1
  fi

  if ! has_cmd supabase; then
    echo "Missing dependency: supabase CLI"
    echo "Install Supabase CLI and rerun."
    missing=1
  fi

  if ! has_cmd grep; then
    echo "Missing dependency: grep"
    echo "Install grep and rerun."
    missing=1
  fi

  if ! has_cmd sed; then
    echo "Missing dependency: sed"
    echo "Install sed and rerun."
    missing=1
  fi

  if [[ "$missing" -ne 0 ]]; then
    exit 1
  fi
}

update_env_supabase_url() {
  local url="$1"

  if [[ ! -f "$MOBILE_ENV_FILE" ]]; then
    echo "Missing ${MOBILE_ENV_FILE}. Create it first."
    exit 1
  fi

  if [[ ! -f "$MOBILE_ENV_BACKUP" ]]; then
    cp "$MOBILE_ENV_FILE" "$MOBILE_ENV_BACKUP"
  fi

  if grep -q '^EXPO_PUBLIC_SUPABASE_URL=' "$MOBILE_ENV_FILE"; then
    sed -i '' "s#^EXPO_PUBLIC_SUPABASE_URL=.*#EXPO_PUBLIC_SUPABASE_URL=${url}#g" "$MOBILE_ENV_FILE"
  else
    printf '\nEXPO_PUBLIC_SUPABASE_URL=%s\n' "$url" >> "$MOBILE_ENV_FILE"
  fi

  echo "Updated EXPO_PUBLIC_SUPABASE_URL in product/apps/consumer-mobile/.env.local"
}

extract_tunnel_url() {
  local url=""
  local elapsed=0

  while [[ "$elapsed" -lt "$WAIT_TUNNEL_SECONDS" ]]; do
    if [[ -f "$TUNNEL_LOG" ]]; then
      url="$(grep -Eo 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | head -n1 || true)"
      if [[ -n "$url" ]]; then
        echo "$url"
        return 0
      fi
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done

  return 1
}

wait_for_functions() {
  local elapsed=0
  local code=""

  while [[ "$elapsed" -lt "$WAIT_FUNCTIONS_SECONDS" ]]; do
    code="$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "${SUPABASE_LOCAL_URL}/functions/v1/scan_qr" || true)"
    if [[ "$code" =~ ^[23] ]]; then
      return 0
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done

  echo "Edge functions did not become ready within ${WAIT_FUNCTIONS_SECONDS}s."
  if [[ -f "$FUNCTIONS_LOG" ]]; then
    echo "Recent functions log:"
    tail -n 40 "$FUNCTIONS_LOG" || true
  fi
  return 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --)
      shift
      continue
      ;;
    --session)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --session"
        exit 1
      fi
      SESSION_NAME="$2"
      shift 2
      ;;
    --no-attach)
      ATTACH_SESSION=0
      shift
      ;;
    --restart)
      RESTART_SESSION=1
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

TUNNEL_LOG="/tmp/${SESSION_NAME}.tunnel.log"
check_dependencies

cd "$REPO_ROOT"

if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  if [[ "$RESTART_SESSION" -eq 1 ]]; then
    tmux kill-session -t "$SESSION_NAME"
  else
    echo "Session '$SESSION_NAME' already exists. Reusing."
    if [[ "$ATTACH_SESSION" -eq 1 ]]; then
      exec tmux attach-session -t "$SESSION_NAME"
    fi
    exit 0
  fi
fi

echo "Ensuring local Supabase state..."
if ! bash "${REPO_ROOT}/product/scripts/ensure-local-supabase-ready.sh"; then
  echo "Local Supabase preflight failed."
  exit 1
fi

rm -f "$TUNNEL_LOG" "$FUNCTIONS_LOG"

echo "Creating tmux session: $SESSION_NAME"
tmux new-session -d -s "$SESSION_NAME" -n supabase "cd \"$REPO_ROOT\" && pnpm exec supabase status --workdir product; echo ''; echo 'Supabase local stack ready on ${SUPABASE_LOCAL_URL}'; exec zsh"
tmux split-window -t "${SESSION_NAME}:0" -v "cd \"$REPO_ROOT\" && pnpm exec supabase functions serve --workdir product --no-verify-jwt 2>&1 | tee \"$FUNCTIONS_LOG\""

echo "Waiting for edge functions runtime..."
if ! wait_for_functions; then
  echo "Stopping session $SESSION_NAME because functions did not start cleanly."
  tmux kill-session -t "$SESSION_NAME" || true
  exit 1
fi

echo "Running function smoke-check..."
bash "${REPO_ROOT}/product/scripts/mobile-functions-smoke-check.sh" --consumer-only

tmux split-window -t "${SESSION_NAME}:0" -v "cd \"$REPO_ROOT\" && bash product/scripts/start-supabase-https-tunnel.sh 2>&1 | tee \"$TUNNEL_LOG\""

echo "Waiting for tunnel URL..."
TUNNEL_URL="$(extract_tunnel_url || true)"
if [[ -z "$TUNNEL_URL" ]]; then
  echo "Could not extract Cloudflare tunnel URL within ${WAIT_TUNNEL_SECONDS}s."
  echo "Inspect tunnel logs in tmux pane or: $TUNNEL_LOG"
  echo "Stopping session $SESSION_NAME to avoid partial stack."
  tmux kill-session -t "$SESSION_NAME" || true
  exit 1
fi

update_env_supabase_url "$TUNNEL_URL"
echo "Tunnel URL: $TUNNEL_URL"

tmux split-window -t "${SESSION_NAME}:0" -h "cd \"$REPO_ROOT\" && pnpm -C product/apps/consumer-mobile run start:expogo:tunnel"
tmux split-window -t "${SESSION_NAME}:0.2" -v "cd \"$REPO_ROOT\" && pnpm -C product/apps/web dev"
tmux select-layout -t "${SESSION_NAME}:0" tiled

echo "tmux session '$SESSION_NAME' is ready."

if [[ "$ATTACH_SESSION" -eq 1 ]]; then
  exec tmux attach-session -t "$SESSION_NAME"
fi
