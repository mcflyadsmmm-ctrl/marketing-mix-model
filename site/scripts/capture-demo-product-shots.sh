#!/usr/bin/env bash
# Capture Sample shop /demo desk into site/assets/product-shots/
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SITE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PORT="${PORT:-8788}"
STARTED_SERVER=0

cleanup() {
  if [[ "$STARTED_SERVER" -eq 1 && -n "${SERVER_PID:-}" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if [[ -z "${DEMO_URL:-}" ]]; then
  if curl -sf -o /dev/null "http://127.0.0.1:${PORT}/demo.html"; then
    echo "Using existing server on :${PORT}"
  else
    python3 -m http.server "$PORT" --directory "$SITE_DIR" >/tmp/mcfly-demo-capture-http.log 2>&1 &
    SERVER_PID=$!
    STARTED_SERVER=1
    for _ in 1 2 3 4 5 6 7 8 9 10; do
      if curl -sf -o /dev/null "http://127.0.0.1:${PORT}/demo.html"; then
        break
      fi
      sleep 0.3
    done
  fi
  export DEMO_URL="http://127.0.0.1:${PORT}/demo.html"
fi

if ! node -e "require('playwright')" 2>/dev/null; then
  if ! node -e "require('${SITE_DIR}/../node_modules/playwright')" 2>/dev/null; then
    echo "playwright missing — installing chromium once via npx" >&2
    npx --yes playwright install chromium
  fi
fi

cd "$SITE_DIR/.."
node "$SCRIPT_DIR/capture-demo-product-shots.mjs"
