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

# Public TOMLs: compliance topics + PCD Level 1 scopes + exact hosted App URL.
for TOML in app/shopify.app.toml app/shopify.app.public.toml; do
  if [[ -f "$TOML" ]]; then
    grep -q 'customers/data_request' "$TOML" && grep -q 'customers/redact' "$TOML" && grep -q 'shop/redact' "$TOML" \
      && check "$TOML compliance_topics present" 1 || check "$TOML compliance_topics present" 0
    grep -Eq '^[[:space:]]*scopes = "read_orders,read_customers"[[:space:]]*$' "$TOML" \
      && check "$TOML scopes are PCD Level 1 only" 1 \
      || check "$TOML scopes are PCD Level 1 only" 0
    grep -Eq '^[[:space:]]*application_url = "https://mcfly-analytics\.fly\.dev"[[:space:]]*$' "$TOML" \
      && check "$TOML App URL is the Fly app" 1 \
      || check "$TOML App URL is the Fly app" 0
    grep -Eq '^[[:space:]]*url = "https://mcfly-analytics\.fly\.dev/support"[[:space:]]*$' "$TOML" \
      && check "$TOML app_preferences Support URL is Fly" 1 \
      || check "$TOML app_preferences Support URL is Fly" 0
  else
    check "$TOML exists" 0
  fi
done

# Routes exist
[[ -f app/app/routes/webhooks.compliance.tsx ]] \
  && check "compliance webhook route" 1 || check "compliance webhook route" 0
[[ -f app/app/routes/webhooks.app.uninstalled.tsx ]] \
  && check "uninstall webhook route" 1 || check "uninstall webhook route" 0
[[ -f app/app/routes/support.tsx && -f app/app/routes/privacy.tsx && -f app/app/routes/terms.tsx && -f app/app/routes/pricing.tsx ]] \
  && check "Fly-origin trust page routes" 1 || check "Fly-origin trust page routes" 0
[[ -f app/scripts/serve-with-site.mjs && -f app/scripts/shopify-app-path.mjs ]] \
  && check "Fly serves marketing site/ next to Remix" 1 || check "Fly serves marketing site/ next to Remix" 0
if grep -q 'COPY site /repo/site' app/Dockerfile && grep -q 'serve-with-site.mjs' app/package.json; then
  check "Docker image copies site/ and starts serve-with-site" 1
else
  check "Docker image copies site/ and starts serve-with-site" 0
fi

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
