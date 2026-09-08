#!/usr/bin/env bash
# Mcfly agent ship gate — run before claiming code done.
# Exit 0 = pass. Non-zero = do not claim shippable.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Mcfly agent ship gate"
echo "    cwd: $ROOT"

fail=0

run() {
  local label="$1"
  shift
  echo ""
  echo "==> $label"
  if "$@"; then
    echo "    OK: $label"
  else
    echo "    FAIL: $label" >&2
    fail=1
  fi
}

run "unit tests" npm test
run "typecheck" npm run typecheck
run "build" npm run build

APP_URL="${APP_URL:-${SHOPIFY_APP_URL:-https://mcfly-analytics.fly.dev}}"
APP_URL="${APP_URL%/}"

if [[ -n "${SKIP_HEALTH:-}" ]]; then
  echo ""
  echo "==> health check SKIPPED (SKIP_HEALTH set)"
else
  echo ""
  echo "==> health check ($APP_URL/health)"
  if curl -sfS --max-time 15 "$APP_URL/health" | tee /tmp/mcfly-health.json | grep -q '"ok"[[:space:]]*:[[:space:]]*true'; then
    if grep -q '"db"[[:space:]]*:[[:space:]]*"up"' /tmp/mcfly-health.json 2>/dev/null || grep -q '"db":"up"' /tmp/mcfly-health.json 2>/dev/null; then
      echo "    OK: health (db up)"
    else
      echo "    OK: health (ok true; deploy DB-aware health for db:up)"
    fi
  else
    echo "    FAIL: health (set SKIP_HEALTH=1 to skip; fix hosting otherwise)" >&2
    fail=1
  fi
fi

echo ""
echo "==> religion spot-check (advisory)"
# Soft: warn if common theater terms appear in new app routes — does not fail gate alone
if git diff --name-only HEAD 2>/dev/null | grep -E '^app/' >/dev/null 2>&1; then
  if git diff HEAD -- 'app/**' 2>/dev/null | grep -Eiq 'pixel|multi[- ]?touch|view[- ]?through|true roas|mta'; then
    echo "    WARN: diff mentions attribution-theater terms — review against MASTER_PLAN" >&2
  else
    echo "    OK: no obvious theater keywords in app diff"
  fi
else
  echo "    OK: no app diff vs HEAD (or clean tree)"
fi

echo ""
if [[ "$fail" -ne 0 ]]; then
  echo "SHIP GATE FAILED — do not claim done; fix or escalate with logs."
  exit 1
fi

echo "SHIP GATE PASSED"
exit 0
