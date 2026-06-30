#!/usr/bin/env bash
set -euo pipefail

MODE="web"
ATTACH_SESSION=1
RESTART_SESSION=0
SESSION_NAME=""
WAIT_FUNCTIONS_SECONDS="${WAIT_FUNCTIONS_SECONDS:-20}"
WAIT_TUNNEL_SECONDS="${WAIT_TUNNEL_SECONDS:-30}"
SUPABASE_LOCAL_URL="${SUPABASE_LOCAL_URL:-http://127.0.0.1:54321}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
MOBILE_ENV_SYNC_SCRIPT="${REPO_ROOT}/product/apps/consumer-mobile/scripts/sync-supabase-env-local.sh"
MOBILE_SIM_COMMAND="cd \"$REPO_ROOT\" && pnpm -C product/apps/consumer-mobile run start:sim"
SUPABASE_TUNNEL_LOG=""
FUNCTIONS_LOG=""

usage() {
  cat <<'USAGE'
Usage: bash product/scripts/dev-workspace.sh [options]

Options:
  --mode <web|sim|phone>  start profile (default: web)
  --session <name>        tmux session name override
  --no-attach             do not attach after setup
  --restart               kill existing session and start fresh
  --help                  show this help
USAGE
}

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

set_mode_defaults() {
  case "$MODE" in
    web)
      SESSION_NAME="${SESSION_NAME:-funcup-web}"
      ;;
    sim)
      SESSION_NAME="${SESSION_NAME:-funcup-sim}"
      ;;
    phone)
      SESSION_NAME="${SESSION_NAME:-funcup-phone}"
      ;;
    *)
      echo "Unsupported mode: $MODE" >&2
      usage >&2
      exit 1
      ;;
  esac

  SUPABASE_TUNNEL_LOG="/tmp/${SESSION_NAME}.supabase-tunnel.log"
  FUNCTIONS_LOG="/tmp/${SESSION_NAME}.functions.log"
}

check_dependencies() {
  local missing=0

  for cmd in tmux pnpm supabase grep sed curl; do
    if ! has_cmd "$cmd"; then
      echo "Missing dependency: $cmd"
      missing=1
    fi
  done

  if [[ "$MODE" == "phone" ]] && ! has_cmd cloudflared; then
    echo "Missing dependency: cloudflared"
    missing=1
  fi

  if [[ "$MODE" == "sim" ]] && ! has_cmd xcrun; then
    echo "Missing dependency: xcrun (install Xcode command line tools)"
    missing=1
  fi

  if [[ "$missing" -ne 0 ]]; then
    exit 1
  fi
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

extract_tunnel_url() {
  local elapsed=0
  local url=""

  while [[ "$elapsed" -lt "$WAIT_TUNNEL_SECONDS" ]]; do
    if [[ -f "$SUPABASE_TUNNEL_LOG" ]]; then
      url="$(grep -Eo 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$SUPABASE_TUNNEL_LOG" | head -n1 || true)"
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

prepare_mobile_local_env() {
  bash "$MOBILE_ENV_SYNC_SCRIPT" \
    --supabase-url "http://127.0.0.1:54321" \
    --roaster-web-url "http://127.0.0.1:3000"
}

cleanup_failed_session() {
  tmux kill-session -t "$SESSION_NAME" >/dev/null 2>&1 || true
}

tmux_session_has_mobile_pane() {
  tmux list-panes -t "${SESSION_NAME}:0" -F '#{pane_start_command}' 2>/dev/null \
    | grep -Fq 'pnpm -C product/apps/consumer-mobile run start:sim'
}

launch_simulator_expo_url() {
  local lan_ip=""
  lan_ip="$(node "${REPO_ROOT}/product/apps/consumer-mobile/scripts/get-lan-ip.cjs" 2>/dev/null || true)"
  if [[ -z "$lan_ip" ]]; then
    return 0
  fi
  xcrun simctl openurl booted "exp://${lan_ip}:8081" >/dev/null 2>&1 || true
}

ensure_sim_mobile_pane() {
  if tmux_session_has_mobile_pane; then
    launch_simulator_expo_url
    return 0
  fi

  echo "Restoring mobile pane for Simulator workflow..."
  tmux split-window -t "${SESSION_NAME}:0" -v "$MOBILE_SIM_COMMAND"
  tmux select-layout -t "${SESSION_NAME}:0" tiled
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      MODE="${2:-}"
      shift 2
      ;;
    --session)
      SESSION_NAME="${2:-}"
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
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

set_mode_defaults
check_dependencies

cd "$REPO_ROOT"

if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
  if [[ "$RESTART_SESSION" -eq 1 ]]; then
    tmux kill-session -t "$SESSION_NAME"
  else
    echo "Session '$SESSION_NAME' already exists. Reusing."
    if [[ "$MODE" == "sim" ]]; then
      ensure_sim_mobile_pane
    fi
    if [[ "$ATTACH_SESSION" -eq 1 ]]; then
      exec tmux attach-session -t "$SESSION_NAME"
    fi
    exit 0
  fi
fi

echo "Ensuring local Supabase state..."
bash "${REPO_ROOT}/product/scripts/ensure-local-supabase-ready.sh"

if [[ "$MODE" != "phone" ]]; then
  echo "Syncing mobile env for local simulator/development..."
  prepare_mobile_local_env
fi

rm -f "$SUPABASE_TUNNEL_LOG" "$FUNCTIONS_LOG"

echo "Creating tmux session: $SESSION_NAME"
tmux new-session -d -s "$SESSION_NAME" -n stack "cd \"$REPO_ROOT\" && pnpm exec supabase status --workdir product; echo ''; echo 'Funcup local stack ready on ${SUPABASE_LOCAL_URL}'; exec zsh"
tmux split-window -t "${SESSION_NAME}:0" -v "cd \"$REPO_ROOT\" && pnpm exec supabase functions serve --workdir product --no-verify-jwt 2>&1 | tee \"$FUNCTIONS_LOG\""

echo "Waiting for edge functions runtime..."
if ! wait_for_functions; then
  cleanup_failed_session
  exit 1
fi

echo "Running local function smoke-check..."
bash "${REPO_ROOT}/product/scripts/mobile-functions-smoke-check.sh"

tmux split-window -t "${SESSION_NAME}:0" -h "cd \"$REPO_ROOT\" && pnpm -C product/apps/web dev"

case "$MODE" in
  web)
    tmux select-layout -t "${SESSION_NAME}:0" tiled
    ;;
  sim)
    tmux split-window -t "${SESSION_NAME}:0" -v "$MOBILE_SIM_COMMAND"
    tmux select-layout -t "${SESSION_NAME}:0" tiled
    ;;
  phone)
    tmux split-window -t "${SESSION_NAME}:0" -v "cd \"$REPO_ROOT\" && bash product/scripts/start-supabase-https-tunnel.sh 2>&1 | tee \"$SUPABASE_TUNNEL_LOG\""

    echo "Waiting for Supabase HTTPS tunnel..."
    TUNNEL_URL="$(extract_tunnel_url || true)"
    if [[ -z "$TUNNEL_URL" ]]; then
      echo "Could not extract Supabase tunnel URL within ${WAIT_TUNNEL_SECONDS}s."
      echo "Inspect tunnel logs in tmux pane or: $SUPABASE_TUNNEL_LOG"
      cleanup_failed_session
      exit 1
    fi

    echo "Syncing mobile env for phone workflow..."
    bash "$MOBILE_ENV_SYNC_SCRIPT" --supabase-url "$TUNNEL_URL"
    echo "Supabase tunnel URL: $TUNNEL_URL"

    tmux split-window -t "${SESSION_NAME}:0.2" -v "cd \"$REPO_ROOT\" && pnpm -C product/apps/consumer-mobile run start:expogo:tunnel"
    tmux select-layout -t "${SESSION_NAME}:0" tiled
    ;;
esac

echo "tmux session '$SESSION_NAME' is ready."

if [[ "$ATTACH_SESSION" -eq 1 ]]; then
  exec tmux attach-session -t "$SESSION_NAME"
fi
