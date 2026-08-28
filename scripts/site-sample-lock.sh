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
  if grep -Eiq 'hostage fee|weekly decision desk|Monday cash desk' "$page"; then
    die "$page still uses Voice-killed manifesto slang"
  else
    ok "$(basename "$page") Voice slang lock"
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
if grep -q 'ca-packages reveal' "$ca"; then
  die "custom-analytics.html still brochure-centered (JS price tiles)"
else
  ok "custom-analytics no brochure price-tile widget"
fi
if ! grep -q '<h1[^>]*>Exact spend. Audited outcomes. A system finance will accept.</h1>' "$ca"; then
  die "custom-analytics.html missing Voice H1"
else
  ok "custom-analytics Voice H1"
fi
if ! grep -q 'We build custom reporting when ads and finance still disagree' "$ca"; then
  die "custom-analytics.html missing Voice lead"
else
  ok "custom-analytics Voice lead"
fi
if ! grep -q 'href="/spend-sales-audit"' "$ca" || ! grep -q 'href="/lead-gen-desk"' "$ca" || ! grep -q 'href="/advanced-mds"' "$ca"; then
  die "custom-analytics.html missing locked SKU hrefs"
else
  ok "custom-analytics SKU hrefs locked"
fi
if ! grep -q 'data-waitlist-success="Thanks. A person will reply in 1–2 business days with next steps, or with a no if this is not a fit."' "$ca"; then
  die "custom-analytics.html inquire thanks line drifted"
else
  ok "custom-analytics inquire thanks line locked"
fi
if ! grep -q 'Why we do not sell pixels and true ROAS' "$ca" || ! grep -q 'not required to keep the system' "$ca" || ! grep -q 'weekly report' "$ca"; then
  die "custom-analytics.html missing Voice FAQ"
else
  ok "custom-analytics Voice FAQ"
fi
if ! grep -q 'Net sales (returns adjusted) ÷ invoice billed, this period' "$ca"; then
  die "custom-analytics.html missing till metric sentence"
else
  ok "custom-analytics till metric sentence"
fi
if ! grep -q 'Yaniv' "$ca" || ! grep -q '30%' "$ca"; then
  die "custom-analytics.html missing Yaniv >30% SAMPLE rule"
else
  ok "custom-analytics Yaniv SAMPLE rule"
fi
if ! grep -q 'lab-unmatched' "$ca" || ! grep -q 'do not tie' "$ca"; then
  die "custom-analytics.html missing unmatched-row strip"
else
  ok "custom-analytics unmatched-row strip"
fi
if ! grep -q 'period join' "$ca" || ! grep -q 'Ads + invoices + CRM/cash' "$ca"; then
  die "custom-analytics.html missing SoT three boxes"
else
  ok "custom-analytics SoT three boxes"
fi
if ! grep -q 'Sheets / warehouse' "$ca" || ! grep -q 'Time-boxed credentials' "$ca"; then
  die "custom-analytics.html missing handoff checklist object"
else
  ok "custom-analytics handoff checklist"
fi
if ! grep -q 'not Recast / not Meridian' "$ca"; then
  die "custom-analytics.html mix missing not Recast / not Meridian"
else
  ok "custom-analytics mix not Recast / not Meridian"
fi
if grep -qE '62,787|62787' "$ca"; then
  die "custom-analytics.html cloned TW leftover dollars"
else
  ok "custom-analytics no TW \$62,787 clone"
fi
if grep -Eiq 'two books' "$ca"; then
  die "custom-analytics.html still says two books"
else
  ok "custom-analytics does not say two books"
fi
if awk '/id="recon"/,/id="exceptions"|id="except-h"|id="except"/' "$ca" | grep -q '42,000'; then
  die "custom-analytics.html put \$42,000 in the recon"
else
  ok "custom-analytics recon has no \$42,000"
fi
if ! grep -q '<h1[^>]*>Invoice $98,500 vs UI $99,950</h1>' "$site/lab.html"; then
  die "lab.html h1 is not invoice vs UI"
else
  ok "lab.html h1 is invoice vs UI"
fi

# Identity — one sans M = favicon = header (Pinemarsh). Anti-pattern: Orr mega-nav.
title_line="$(grep -m1 '<title>' "$ca")"
if [[ "$title_line" != *"Custom Data Solutions · Mcfly Ads"* ]]; then
  die "custom title is not Custom Data Solutions · Mcfly Ads"
else
  ok "custom title Mcfly Ads, no fee bands"
fi
if grep -E '<title>.*\$5' "$ca"; then
  die "custom TITLE still contains fee bands"
else
  ok "fee bands kept out of TITLE"
fi
if ! grep -q 'content="#082830"' "$ca"; then
  die "custom-analytics missing studio theme-color #082830"
else
  ok "studio theme-color #082830"
fi
if ! grep -q 'apple-touch-custom-analytics.png" sizes="180x180"' "$ca"; then
  die "custom-analytics apple-touch is not 180"
else
  ok "studio apple-touch 180"
fi
if grep -q 'mcfly-analytics.fly.dev' "$ca"; then
  die "custom-analytics still cites fly.dev"
else
  ok "custom-analytics origin is mcflyads.com"
fi
if ! grep -q 'https://mcflyads.com/assets/brand/favicon-custom-analytics-192.png' "$ca"; then
  die "custom-analytics JSON-LD logo is not the sans M on mcflyads.com"
else
  ok "JSON-LD logo sans M on mcflyads.com"
fi
if grep -qE 'href="/favicon\.png"|href="/apple-touch-icon\.png"|href="/favicon-192\.png"' "$ca" "$site/lab.html"; then
  die "studio pages mix the ribbon M"
else
  ok "studio pages do not mix ribbon M"
fi
chrome="$site/assets/chrome.js"
if grep -q 'site-mode-bar' "$chrome"; then
  die "chrome.js still has a mode bar"
else
  ok "chrome.js has no mode bar"
fi
if grep -Eiq 'calendly' "$chrome"; then
  die "chrome.js mentions Calendly"
else
  ok "chrome.js has no Calendly"
fi
for item in Process Packages Specimen About Inquire; do
  if ! grep -q -- "$item" "$chrome"; then
    die "chrome.js missing studio nav item $item"
  fi
done
ok "studio header is Process / Packages / Specimen / About / Inquire"
if ! grep -q 'mcfly-m.svg' "$chrome"; then
  die "studio header missing sans M"
else
  ok "studio header mark is mcfly-m.svg"
fi
if grep -q 'Two Mcfly products' "$chrome"; then
  die "chrome.js still has Two Mcfly products bar"
else
  ok "no Two Mcfly products bar"
fi
manifest="$site/assets/brand/site.webmanifest"
if ! grep -q '"theme_color": "#082830"' "$manifest"; then
  die "studio webmanifest theme_color is not #082830"
else
  ok "studio webmanifest theme #082830"
fi

# Science honesty — $84,200 stays gone (above). Invoice vs UI is tax/fee/timezone/credit timing.
for page in "$site/lab.html" "$site/custom-analytics.html"; do
  if ! grep -q 'tax / fee / timezone / credit timing' "$page"; then
    die "$(basename "$page") invoice-vs-UI memo is not tax/fee/timezone/credit timing"
  else
    ok "$(basename "$page") invoice vs UI = tax/fee/timezone/credit timing"
  fi
  if grep -Eiq 'invoice vs UI is returns|returns \+ last-touch explain (this ledger|invoice)' "$page"; then
    die "$(basename "$page") blames invoice vs UI on returns + last-touch"
  else
    ok "$(basename "$page") does not blame invoice vs UI on returns + last-touch"
  fi
done

# One CPQL target: $250. Seed $226. Do not invent $200 so the cut fires.
if grep -R -n --include='*.html' --include='*.js' -E '\$226 &gt; \$200|\$226 > \$200' "$site"; then
  die "CPQL target \$200 invented so \$226 fires a cut"
else
  ok "no invented \$200 CPQL target"
fi
for page in "$site/lab.html" "$site/custom-analytics.html" "$site/lead-gen-desk.html"; do
  if ! grep -q 'target $250' "$page"; then
    die "$(basename "$page") missing SAMPLE CPQL target \$250"
  else
    ok "$(basename "$page") CPQL target \$250"
  fi
  if ! grep -q '\$226' "$page"; then
    die "$(basename "$page") missing CPQL seed \$226"
  else
    ok "$(basename "$page") CPQL seed \$226"
  fi
done
if grep -q 'data-lab-rule="cpql-cut" checked' "$site/lab.html" "$site/custom-analytics.html"; then
  die "CPQL cut defaults on even though \$226 ≤ \$250"
else
  ok "CPQL cut defaults off (\$226 ≤ \$250)"
fi

# Hidden version stamp — HTML on studio pages + chrome.js runtime.
for page in "$site/custom-analytics.html" "$site/lab.html" "$site/advanced-mds.html"; do
  if ! grep -q 'name="mcfly-version" content="v2"' "$page" || ! grep -q 'name="mcfly-build" content="pr-23"' "$page"; then
    die "$(basename "$page") missing hidden mcfly-version / mcfly-build"
  else
    ok "$(basename "$page") hidden version meta"
  fi
done
if ! grep -q 'mcfly-version' "$chrome" || ! grep -q 'pr-23' "$chrome"; then
  die "chrome.js missing hidden version stamp"
else
  ok "chrome.js hidden version stamp"
fi

# MDS is custom DS they keep — not a marketing-science flyer.
mds="$site/advanced-mds.html"
if ! grep -q '<h1[^>]*>A system you keep. $15–25K.</h1>' "$mds"; then
  die "advanced-mds H1 is not A system you keep. \$15–25K."
else
  ok "advanced-mds unique H1"
fi
if grep -Eiq 'cash desk|two books|Monday Close' "$mds"; then
  die "advanced-mds brands Monday / cash desk / two books"
else
  ok "advanced-mds Voice branding"
fi
for needle in '98,500' '99,950' '4.19' '412,400' '472,800' '−$1,450'; do
  if ! grep -q -- "$needle" "$mds"; then
    die "advanced-mds missing Northline identity $needle"
  fi
done
ok "advanced-mds Northline SAMPLE book"
foils='Domo|Looker|Tableau|Triple Whale|Northbeam|Recast|Nielsen|Meridian|Polar'
if grep -Eiq -- "$foils" "$mds"; then
  die "advanced-mds names a competitor foil"
else
  ok "advanced-mds names no competitor foils"
fi
if awk '/href="\/advanced-mds"/,/<\/a>/' "$ca" | grep -Eiq -- "$foils"; then
  die "custom-analytics MDS card names a competitor foil"
else
  ok "custom-analytics MDS card names no competitor foils"
fi
if grep -Eiq -- "$foils" "$site/index.html" && grep -Eiq 'Advanced MDS|advanced-mds' "$site/index.html"; then
  die "home MDS blurb names a competitor foil"
else
  ok "home has no named-foil MDS blurb"
fi
if ! grep -q 'signed-in' "$mds" || ! grep -q 'exec desk' "$mds"; then
  die "advanced-mds missing exec desk / signed-in portals"
else
  ok "advanced-mds exec desk + signed-in portals"
fi
if ! grep -q 'one module' "$mds" && ! grep -q 'not the product' "$mds"; then
  die "advanced-mds does not demote marketing measurement to one module"
else
  ok "advanced-mds marketing is one module"
fi
if ! grep -q 'beats the BI' "$mds" && ! grep -q 'already paid' "$mds"; then
  die "advanced-mds lost the hired-system-beats-BI/SaaS framing"
else
  ok "advanced-mds beats unnamed BI/SaaS they already paid for"
fi
if ! grep -q 'After we leave, they own' "$mds"; then
  die "advanced-mds does not lead with a system they own after we leave"
else
  ok "advanced-mds they-own-after-we-leave"
fi
if grep -Eiq 'we replaced Domo for' "$mds"; then
  die "advanced-mds invents a client replacement claim"
else
  ok "advanced-mds no invented client logos/claims"
fi
if ! grep -q 'href="/custom-analytics?package=mds#inquire"' "$mds"; then
  die "advanced-mds inquire CTA drifted"
else
  ok "advanced-mds inquire ?package=mds#inquire"
fi
if grep -q 'fetchpriority="high"' "$mds"; then
  die "advanced-mds atmosphere is still LCP (fetchpriority=high)"
else
  ok "advanced-mds atmosphere not LCP"
fi
if grep -q 'data-sci-mds' "$mds"; then
  die "advanced-mds still leads with the mix-widget flyer"
else
  ok "advanced-mds is not a mix-widget flyer"
fi

# MDS card on the hub is not ads/MMM-only.
if ! awk '/href="\/advanced-mds"/,/<\/a>/' "$ca" | grep -q 'signed-in'; then
  die "custom-analytics MDS card still ads/MMM-only"
else
  ok "custom-analytics MDS card is exec + portals"
fi

# SEO internals — SKU + monday-close link to /lab. monday-close noindex.
for page in "$site/spend-sales-audit.html" "$site/lead-gen-desk.html" "$site/advanced-mds.html" "$site/monday-close.html"; do
  if ! grep -q '>SAMPLE Northline week</a>' "$page"; then
    die "$(basename "$page") missing SAMPLE Northline week → /lab"
  else
    ok "$(basename "$page") SAMPLE Northline week link"
  fi
done
if ! grep -q 'content="noindex,follow"' "$site/monday-close.html"; then
  die "monday-close missing noindex,follow"
else
  ok "monday-close noindex,follow"
fi

# CONVERSION comments on inquire — do not require name= changes.
if ! grep -q 'CONVERSION: kill labels Monday' "$ca"; then
  die "custom-analytics inquire missing CONVERSION comments"
else
  ok "custom-analytics inquire CONVERSION comments"
fi

node --check "$site/assets/lab-desk.js"
node --check "$site/assets/sku-science.js"
node --check "$site/assets/chrome.js"
ok "lab-desk.js, sku-science.js, and chrome.js parse"

if [[ $fail -ne 0 ]]; then
  exit 1
fi
echo "SAMPLE lock passed."
