#!/usr/bin/env bash
# SAMPLE book lock — Northline on site HTML. Fail if the email-only $84,200 book leaks.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
site="$root/site"
fail=0

die() { echo "FAIL: $*" >&2; fail=1; }
ok() { echo "OK: $*"; }

if grep -R -n --include='*.html' --include='*.js' --include='*.css' -E '84,200|84200' "$site"; then
  die "\$84,200 leaked into site HTML/JS/CSS (email-only)"
else
  ok "no \$84,200 in site/"
fi

for page in "$site/lab.html" "$site/custom-analytics.html"; do
  for needle in '98,500' '4.19' '4.8' '472,800' '412,400' '99,950'; do
    if ! grep -q -- "$needle" "$page"; then
      die "$page missing $needle"
    fi
  done
  if grep -Eiq 'cash desk|two books|Monday Close' "$page"; then
    die "$page still brands Monday / cash desk / two books"
  else
    ok "$(basename "$page") branding lock"
  fi
  if ! grep -q 'data-ca-billed>$98,500' "$page"; then
    die "$page billed SSR is not \$98,500"
  else
    ok "$(basename "$page") billed SSR \$98,500"
  fi
done

node --check "$site/assets/lab-desk.js"
node --check "$site/assets/sku-science.js"
ok "lab-desk.js and sku-science.js parse"

if [[ $fail -ne 0 ]]; then
  exit 1
fi
echo "SAMPLE lock passed."
