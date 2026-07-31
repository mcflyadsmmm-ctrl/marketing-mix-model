#!/usr/bin/env bash
# Mcfly compliance spot-check — advisory companion to agent-ship-gate.sh
# Exit 0 if critical patterns look healthy; exit 1 on hard misses.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
fail=0

echo "==> Mcfly compliance spot-check"

check() {
  local label="$1"
  local ok="$2"
  if [[ "$ok" == "1" ]]; then
    echo "    OK: $label"
  else
    echo "    FAIL: $label" >&2
    fail=1
  fi
}

# TOML: compliance topics + read_orders + not marketing domain as app url
TOML="app/shopify.app.toml"
if [[ -f "$TOML" ]]; then
  grep -q 'customers/data_request' "$TOML" && grep -q 'customers/redact' "$TOML" && grep -q 'shop/redact' "$TOML" \
    && check "toml compliance_topics present" 1 || check "toml compliance_topics present" 0
  # Allow read_orders plus optional read_customers / read_all_orders (any order/subset).
  grep -Eq 'scopes = "read_orders(,read_(customers|all_orders))*"' "$TOML" \
    && check "scopes read_orders (+ optional read_customers/read_all_orders)" 1 \
    || check "scopes read_orders (+ optional read_customers/read_all_orders)" 0
  if grep -q 'application_url = "https://mcflyads.com"' "$TOML"; then
    check "App URL is not marketing site" 0
  else
    check "App URL is not marketing site" 1
  fi
else
  check "shopify.app.toml exists" 0
fi

# Routes exist
[[ -f app/app/routes/webhooks.compliance.tsx ]] \
  && check "compliance webhook route" 1 || check "compliance webhook route" 0
[[ -f app/app/routes/webhooks.app.uninstalled.tsx ]] \
  && check "uninstall webhook route" 1 || check "uninstall webhook route" 0

# No shop-domain install form (auth.login should not collect shop domain input)
if [[ -f app/app/routes/auth.login/route.tsx ]]; then
  if grep -Eiq 'name=["'\'']shop["'\'']|myshopify\.com.*input|Enter your shop' app/app/routes/auth.login/route.tsx; then
    check "no shop-domain install form" 0
  else
    check "no shop-domain install form" 1
  fi
fi

# Sales query may read customer id + numberOfOrders for new/returning counts,
# but must not request name/email/phone/address PII fields in the GraphQL selection.
if [[ -f app/app/lib/shopify-sales.server.ts ]]; then
  # Only inspect the GraphQL document (between ORDERS_QUERY backticks / #graphql block)
  gql=$(sed -n '/#graphql/,/`;/p' app/app/lib/shopify-sales.server.ts)
  if echo "$gql" | grep -Eiq '\b(email|phone|firstName|lastName|defaultAddress|shippingAddress|billingAddress|displayName)\b'; then
    check "sales loader avoids customer PII fields" 0
  else
    check "sales loader avoids customer PII fields" 1
  fi
fi

# CSV spend exists
[[ -f app/app/lib/spend-csv.ts ]] \
  && check "CSV spend parser present" 1 || check "CSV spend parser present" 0

# Health
APP_URL="${APP_URL:-https://mcfly-analytics.fly.dev}"
if curl -sfS --max-time 12 "$APP_URL/health" | grep -q '"ok"[[:space:]]*:[[:space:]]*true'; then
  check "hosted /health ok" 1
else
  check "hosted /health ok" 0
fi

echo ""
if [[ "$fail" -ne 0 ]]; then
  echo "COMPLIANCE SPOT-CHECK FAILED"
  exit 1
fi
echo "COMPLIANCE SPOT-CHECK PASSED"
exit 0
