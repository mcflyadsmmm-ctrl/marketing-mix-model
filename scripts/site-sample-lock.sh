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
  if ! grep -q 'IF Meta UI' "$page" || ! grep -q 'IF cash ROAS' "$page" || ! grep -q 'IF marketplace residual' "$page" || ! grep -q 'IF CPQL' "$page"; then
    die "$page missing four if/then rules"
  else
    ok "$(basename "$page") four if/then rules"
  fi
  for f in metric_contracts_v1.md spend_recon_jul2026.csv northline_desk.html runbook.md owner_transfer_checklist.md; do
    if ! grep -q -- "$f" "$page"; then
      die "$page missing $f"
    fi
  done
  ok "$(basename "$page") five handoff filenames"
  if ! grep -q 'Refuse:' "$page"; then
    die "$page missing refuse list"
  else
    ok "$(basename "$page") refuse list"
  fi
  if ! grep -q 'Marty Smithson' "$page"; then
    die "$page missing Marty Smithson"
  else
    ok "$(basename "$page") named operator"
  fi
  if grep -Eiq 'next start|join the waitlist|waitlist theater' "$page"; then
    die "$page invents a next start / waitlist"
  else
    ok "$(basename "$page") no invented next start"
  fi
  if grep -q 'data-lab-hurdle' "$page"; then
    die "$page still has CPQL/hurdle slider toy"
  else
    ok "$(basename "$page") no hurdle slider"
  fi
  if grep -Eq 'class="lab-hero"|hero-atmosphere' "$page"; then
    die "$page still opens on a craft hero"
  else
    ok "$(basename "$page") no craft hero"
  fi
  if ! grep -q '<h1[^>]*>Invoice $98,500 vs UI $99,950</h1>' "$page"; then
    die "$page h1 is not invoice vs UI"
  else
    ok "$(basename "$page") h1 is invoice vs UI"
  fi
  if ! grep -q 'HOLD Meta' "$page" || ! grep -q 'PROTECT Other' "$page" || ! grep -q 'SHIFT +10% Google' "$page"; then
    die "$page missing hold/protect/shift close memo"
  else
    ok "$(basename "$page") printable hold/protect/shift"
  fi
  if ! grep -q 'href="/about"' "$page"; then
    die "$page missing /about link for Marty"
  else
    ok "$(basename "$page") Marty → /about"
  fi
  if grep -q 'href="/mmm"' "$page"; then
    die "$page sends /mmm as the custom MMM story"
  else
    ok "$(basename "$page") no /mmm"
  fi
  if grep -Eiq 'calendly\.com|stripe\.com/checkout' "$page"; then
    die "$page publishes Calendly or Stripe checkout"
  else
    ok "$(basename "$page") no Calendly / Stripe checkout"
  fi
  if ! grep -q 'data-ca-billed>$98,500' "$page"; then
    die "$page billed SSR is not \$98,500"
  else
    ok "$(basename "$page") billed SSR \$98,500"
  fi
done

ca="$site/custom-analytics.html"
if ! grep -q 'METRIC CONTRACT v1' "$ca"; then
  die "custom-analytics.html missing METRIC CONTRACT v1"
else
  ok "custom-analytics METRIC CONTRACT v1"
fi
if ! grep -q 'invoice CSV' "$ca" || ! grep -q 'signed $98,500' "$ca"; then
  die "custom-analytics.html missing lineage strip"
else
  ok "custom-analytics lineage strip"
fi
if ! grep -q 'lab-table--contract' "$ca"; then
  die "custom-analytics.html METRIC CONTRACT table missing wrap class"
else
  ok "custom-analytics METRIC CONTRACT table wraps"
fi
if ! grep -q '<ol class="lab-lineage">' "$ca"; then
  die "custom-analytics.html lineage is not an always-visible list"
else
  ok "custom-analytics lineage always visible"
fi
if grep -q 'data-lineage=' "$ca"; then
  die "custom-analytics.html lineage still uses hide/show buttons"
else
  ok "custom-analytics lineage not click-to-reveal"
fi
if grep -Eq 'id="faq"|id="market-title"|ca-packages reveal' "$ca"; then
  die "custom-analytics.html still brochure-centered (faq/market/price tiles)"
else
  ok "custom-analytics brochure visual center removed"
fi

node --check "$site/assets/lab-desk.js"
node --check "$site/assets/sku-science.js"
ok "lab-desk.js and sku-science.js parse"

if [[ $fail -ne 0 ]]; then
  exit 1
fi
echo "SAMPLE lock passed."
