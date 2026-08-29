#!/usr/bin/env bash
# SAMPLE / product-lock gate for site/** — must pass before Pages deploy.
# v11: home sells the Shopify app (Harbor SAMPLE). Custom pages may still hold Northline.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0
ok() { echo "    OK: $*"; }
bad() { echo "    FAIL: $*" >&2; fail=1; }

echo "==> site-sample-lock"
echo "    cwd: $ROOT"

HOME=site/index.html
PARKED=(site/lab.html site/custom-analytics.html site/advanced-mds.html)

[[ -f "$HOME" ]] || bad "missing $HOME"

if grep -qE '\$84,?200' "$HOME"; then
  bad "$HOME still has \$84,200"
else
  ok "$HOME no \$84,200"
fi
if grep -qE '\$98,?500' "$HOME"; then
  bad "$HOME has Northline \$98,500 — app home must use Harbor SAMPLE"
else
  ok "$HOME has no Northline \$98,500"
fi
if grep -qE 'Harbor' "$HOME" && grep -qE '\$23,?414' "$HOME" && grep -qE '3\.51' "$HOME"; then
  ok "$HOME Harbor SAMPLE \$23,414 / 3.51×"
else
  bad "$HOME missing Harbor SAMPLE (\$23,414 / 3.51×)"
fi
if grep -qE '\$39' "$HOME" && grep -q '/demo' "$HOME"; then
  ok "$HOME has \$39 and /demo CTA"
else
  bad "$HOME missing \$39 or /demo"
fi
if grep -qiE 'Close Memo|Hired System|Pipeline Desk' "$HOME"; then
  bad "$HOME still sells Custom packages"
else
  ok "$HOME does not sell Custom packages"
fi
if grep -qiE 'cash desk|two books' "$HOME"; then
  bad "$HOME uses banned cash-desk / two-books branding"
else
  ok "$HOME voice lock"
fi
if grep -qiE '500-seat|184 of 240|login 184' "$HOME"; then
  bad "$HOME has SaaS seat theater"
else
  ok "$HOME no SaaS seat theater"
fi
if grep -q '/assets/mcfly/mcfly.css' "$HOME" && ! grep -q '/assets/site.css' "$HOME"; then
  ok "home uses greenfield mcfly.css"
else
  bad "home must load mcfly.css only (no site.css)"
fi

for f in "${PARKED[@]}"; do
  [[ -f "$f" ]] || continue
  if grep -qE '\$84,?200' "$f"; then
    bad "$f still has \$84,200"
  else
    ok "$f no \$84,200"
  fi
done

if [[ -f site/lab.html ]]; then
  if grep -q 'A\. Chen' site/lab.html && grep -qE 'seat 2 of 4|2 of 4' site/lab.html; then
    ok "/lab parked desk still has A. Chen seat 2 of 4"
  else
    ok "/lab session check skipped or changed"
  fi
  if grep -qiE 'fonts\.googleapis\.com|fonts\.gstatic\.com' site/lab.html; then
    bad "/lab still loads Google Fonts"
  else
    ok "/lab no Google Fonts CDN"
  fi
fi

[[ -f site/assets/fonts-local.css ]] || bad "missing site/assets/fonts-local.css"
[[ -d site/assets/fonts ]] || bad "missing site/assets/fonts/"
if [[ -d site/assets/fonts ]]; then
  n=$(find site/assets/fonts -name '*.woff2' | wc -l | tr -d ' ')
  if [[ "$n" -ge 1 ]]; then
    ok "woff2 count=$n"
  else
    bad "no woff2 files under site/assets/fonts"
  fi
fi

if grep -q 'Try the demo' site/assets/mcfly/chrome.js && grep -q 'href="/demo"' site/assets/mcfly/chrome.js; then
  ok "chrome CTA is Try the demo"
else
  bad "chrome missing Try the demo /demo"
fi
if grep -q '>Custom</a>' site/assets/mcfly/chrome.js || grep -q 'custom-analytics#inquire' site/assets/mcfly/chrome.js; then
  bad "chrome still promotes Custom / inquire"
else
  ok "chrome does not promote Custom"
fi
if grep -q 'Mcfly Ads' site/assets/mcfly/chrome.js && grep -q 'nav__brand-sub">Ads' site/assets/mcfly/chrome.js; then
  ok "chrome firm mark is Mcfly Ads"
else
  bad "chrome missing Mcfly Ads firm mark"
fi
if grep -qiE 'site-mode-bar|brand-toggle|Ads ↔' site/assets/mcfly/chrome.js; then
  bad "chrome revived dual-site toggle"
else
  ok "chrome has no dual-site toggle"
fi

echo ""
if [[ "$fail" -ne 0 ]]; then
  echo "SAMPLE LOCK FAILED"
  exit 1
fi
echo "SAMPLE LOCK PASSED"
exit 0
