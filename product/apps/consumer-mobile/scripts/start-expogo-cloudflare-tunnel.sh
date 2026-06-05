#!/usr/bin/env bash
set -euo pipefail

PORT="${EXPO_METRO_PORT:-8081}"
WAIT_SECONDS="${WAIT_METRO_TUNNEL_SECONDS:-30}"
TUNNEL_LOG="${EXPO_METRO_TUNNEL_LOG:-/tmp/funcup-expo-metro-tunnel.log}"

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

if ! has_cmd cloudflared; then
  echo "Missing dependency: cloudflared"
  echo "Install: brew install cloudflared"
  exit 1
fi

rm -f "$TUNNEL_LOG"

cloudflared tunnel --url "http://127.0.0.1:${PORT}" >"$TUNNEL_LOG" 2>&1 &
tunnel_pid="$!"

cleanup() {
  kill "$tunnel_pid" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

extract_tunnel_url() {
  local elapsed=0
  local url=""

  while [[ "$elapsed" -lt "$WAIT_SECONDS" ]]; do
    url="$(
      grep -Eo 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" \
        | grep -v '^https://api\.trycloudflare\.com$' \
        | head -n1 || true
    )"
    if [[ -n "$url" ]]; then
      echo "$url"
      return 0
    fi

    if ! kill -0 "$tunnel_pid" >/dev/null 2>&1; then
      echo "Cloudflare tunnel exited before publishing a URL." >&2
      tail -n 40 "$TUNNEL_LOG" >&2 || true
      return 1
    fi

    sleep 1
    elapsed=$((elapsed + 1))
  done

  echo "Could not extract Cloudflare tunnel URL within ${WAIT_SECONDS}s." >&2
  tail -n 40 "$TUNNEL_LOG" >&2 || true
  return 1
}

TUNNEL_URL="$(extract_tunnel_url)"

echo "Expo Metro tunnel: $TUNNEL_URL"
echo "Tunnel log: $TUNNEL_LOG"

if has_cmd expo; then
  EXPO_PACKAGER_PROXY_URL="$TUNNEL_URL" expo start --host lan --port "$PORT"
elif has_cmd node; then
  expo_cli="$(node -p "require.resolve('expo/bin/cli')")"
  EXPO_PACKAGER_PROXY_URL="$TUNNEL_URL" node "$expo_cli" start --host lan --port "$PORT"
else
  echo "Missing dependency: expo CLI (or node to run local expo)" >&2
  exit 1
fi
