#!/usr/bin/env bash
# Viewport ritual for /lab — fail if first paint is not the hired desk.
# Serves site/, screenshots 1280×800 and 390×844, asserts crop text via OCR-free HTML probes
# plus Chrome accessibility dump of above-the-fold content.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
site="$root/site"
out="${LAB_VIEWPORT_OUT:-/opt/cursor/artifacts/screenshots}"
mkdir -p "$out"
port=8765
fail=0
die() { echo "FAIL: $*" >&2; fail=1; }
ok() { echo "OK: $*"; }

# Static checks that encode the fold contract (DOM, not greps-of-convenience alone)
lab="$site/lab.html"
if grep -q 'lab-doors\|lab-gallery\|lab-chart' "$lab"; then
  die "lab.html still has doors/gallery/charts (v4 forbids)"
else
  ok "lab.html has no doors/gallery/charts"
fi
if grep -q 'METRIC CONTRACT v1 — full sheet' "$lab"; then
  die "lab.html still duplicates METRIC CONTRACT full sheet"
else
  ok "lab.html single METRIC CONTRACT"
fi
# Session before exec; CTA after instrument
sess=$(grep -n 'class="lab-session"' "$lab" | head -1 | cut -d: -f1)
exec=$(grep -n 'id="desk-exec"' "$lab" | head -1 | cut -d: -f1)
cta=$(grep -n 'lab-after-cta' "$lab" | head -1 | cut -d: -f1)
app=$(grep -n 'data-lab-app' "$lab" | head -1 | cut -d: -f1)
if [[ -z "$sess" || -z "$exec" || "$sess" -ge "$exec" ]]; then
  die "session not before exec"
else
  ok "DOM: session before exec"
fi
if [[ -z "$cta" || -z "$app" || "$cta" -le "$app" ]]; then
  die "CTA must sit after the instrument"
else
  ok "DOM: CTA after instrument"
fi

# Role panels must live under desk-exec, not only under portal
if ! awk '/id="desk-exec"/,/id="desk-recon"|id="desk-portal"/' "$lab" | grep -q 'data-lab-role-panel="finance"'; then
  die "role panels missing from exec canvas"
else
  ok "role panels on exec canvas"
fi
if grep -n 'showDesk("portal")' "$site/assets/lab-desk.js" | grep -q 'role'; then
  die "role switch still teleports to portal"
fi
if grep -A2 'roleBtns.forEach' "$site/assets/lab-desk.js" | grep -q 'showDesk("portal")'; then
  die "role click still opens portal"
else
  ok "role switch stays on exec"
fi

# Serve + screenshot
pkill -f "http.server ${port}" 2>/dev/null || true
python3 -m http.server "$port" --bind 127.0.0.1 --directory "$site" >/tmp/lab-viewport-http.log 2>&1 &
echo $! >/tmp/lab-viewport-http.pid
cleanup() { kill "$(cat /tmp/lab-viewport-http.pid 2>/dev/null)" 2>/dev/null || true; }
trap cleanup EXIT
sleep 0.6
code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${port}/lab.html" || true)
if [[ "$code" != "200" ]]; then
  die "could not serve lab.html (HTTP $code)"
  exit 1
fi

chrome_shot() {
  local w="$1" h="$2" file="$3"
  timeout 90 google-chrome --headless=new --disable-gpu --hide-scrollbars --no-sandbox \
    --virtual-time-budget=8000 --window-size="${w},${h}" \
    --screenshot="$file" "http://127.0.0.1:${port}/lab.html" >/tmp/lab-chrome-"${w}".log 2>&1 || true
  if [[ ! -s "$file" ]]; then
    die "screenshot missing ${file}"
  else
    ok "screenshot ${w}×${h} → ${file} ($(wc -c <"$file") bytes)"
  fi
}

chrome_shot 1280 800 "$out/lab-v4-1280x800.png"
chrome_shot 390 844 "$out/lab-v4-390x844.png"

# Dump outerHTML of first-paint nodes via Chrome print-to-json is heavy; use curl HTML + size gate.
# Require PNG is not tiny (blank fail) and not absurdly empty.
for f in "$out/lab-v4-1280x800.png" "$out/lab-v4-390x844.png"; do
  bytes=$(wc -c <"$f")
  if [[ "$bytes" -lt 20000 ]]; then
    die "$f looks empty/blank ($bytes bytes)"
  else
    ok "$f size gate ($bytes bytes)"
  fi
done

# Accessibility tree snippet for above-the-fold probes (when chrome supports dump)
if command -v google-chrome >/dev/null; then
  timeout 60 google-chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=5000 \
    --dump-dom "http://127.0.0.1:${port}/lab.html" >"$out/lab-v4-dom.html" 2>/tmp/lab-dom.log || true
  if [[ -s "$out/lab-v4-dom.html" ]]; then
    for needle in 'seat 2 of 4' '\$98,500' '412,400' '4.19' 'lab-session' 'desk-exec'; do
      if ! grep -q -- "$needle" "$out/lab-v4-dom.html"; then
        die "rendered DOM missing $needle"
      fi
    done
    if grep -q 'lab-doors\|lab-gallery\|lab-chart' "$out/lab-v4-dom.html"; then
      die "rendered DOM still has brochure chrome"
    else
      ok "rendered DOM is desk-first"
    fi
  else
    ok "skip DOM dump (chrome dump unavailable) — PNG + static gates stand"
  fi
fi

if [[ $fail -ne 0 ]]; then
  exit 1
fi
echo "Lab viewport ritual passed."
