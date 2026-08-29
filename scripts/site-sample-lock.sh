#!/usr/bin/env bash
# SAMPLE / product-lock gate for site/** — must pass before Pages deploy.
# Exit 0 = pass.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0
ok() { echo "    OK: $*"; }
bad() { echo "    FAIL: $*" >&2; fail=1; }

echo "==> site-sample-lock"
echo "    cwd: $ROOT"

HIRE=(site/index.html site/lab.html site/custom-analytics.html site/advanced-mds.html)

for f in "${HIRE[@]}"; do
  [[ -f "$f" ]] || bad "missing $f"
done

# Northline SAMPLE dollars only (no $84,200 on hire pages)
for f in "${HIRE[@]}"; do
  [[ -f "$f" ]] || continue
  if grep -qE '\$84,?200' "$f"; then
    bad "$f still has \$84,200 (email-only SAMPLE)"
  else
    ok "$f no \$84,200"
  fi
  if ! grep -qE '\$98,?500' "$f"; then
    bad "$f missing Northline \$98,500"
  else
    ok "$f has \$98,500"
  fi
  if ! grep -qE '4\.19' "$f"; then
    bad "$f missing cash 4.19×"
  else
    ok "$f has 4.19×"
  fi
done

# /lab hired desk first paint
if [[ -f site/lab.html ]]; then
  if grep -q 'A\. Chen' site/lab.html && grep -qE 'seat 2 of 4|2 of 4' site/lab.html; then
    ok "/lab has A. Chen seat 2 of 4"
  else
    bad "/lab missing hired-desk session (A. Chen / seat 2 of 4)"
  fi
  if grep -qiE 'fonts\.googleapis\.com|fonts\.gstatic\.com' site/lab.html; then
    bad "/lab still loads Google Fonts (self-host required)"
  else
    ok "/lab no Google Fonts CDN"
  fi
  if grep -q 'fonts-local.css' site/lab.html; then
    ok "/lab uses fonts-local.css"
  else
    bad "/lab missing fonts-local.css"
  fi
fi

# Voice bans on hire pages
for f in "${HIRE[@]}"; do
  [[ -f "$f" ]] || continue
  if grep -qiE 'cash desk|two books' "$f"; then
    bad "$f uses banned cash-desk / two-books branding"
  else
    ok "$f voice lock (no cash desk / two books)"
  fi
  if grep -qiE '500-seat|184 of 240|login 184' "$f"; then
    bad "$f has SaaS seat theater (500-seat / 184 of 240)"
  else
    ok "$f no SaaS seat theater"
  fi
done

# Assets present
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

# Redirects must not bounce /lab away from hired desk
if grep -E '^/lab[[:space:]]+/custom' site/_redirects >/dev/null 2>&1; then
  bad "_redirects sends /lab to custom-analytics"
else
  ok "_redirects keeps /lab on lab"
fi

# Brand law v9 — firm = Mcfly Ads; no dual-site toggle in chrome
if grep -q 'Mcfly Ads' site/assets/chrome.js && grep -q 'brand-name-sub">Ads' site/assets/chrome.js; then
  ok "chrome firm mark is Mcfly Ads"
else
  bad "chrome missing Mcfly Ads firm mark"
fi
if grep -qiE 'site-mode-bar|brand-toggle|Ads ↔|dual.site' site/assets/chrome.js; then
  bad "chrome revived dual-site / brand toggle"
else
  ok "chrome has no dual-site toggle"
fi
if grep -q 'display: none !important' site/assets/site.css && grep -q 'Brand law v9' site/assets/site.css; then
  ok "site.css hides site-mode-bar (brand law)"
else
  bad "site.css missing brand-law hide for site-mode-bar"
fi
if grep -qiE 'cash desk' site/custom-analytics-engagement.html; then
  bad "engagement specimen still says cash desk"
else
  ok "engagement specimen voice (no cash desk)"
fi
if grep -q 'Mcfly Ads — Custom Data Solutions' site/custom-analytics-engagement.html; then
  ok "engagement provider is Mcfly Ads"
else
  bad "engagement provider not Mcfly Ads"
fi

echo ""
if [[ "$fail" -ne 0 ]]; then
  echo "SAMPLE LOCK FAILED"
  exit 1
fi
echo "SAMPLE LOCK PASSED"
exit 0
