---
name: mcfly-apps-script-craft
description: >-
  Port Black Clover MER Apps Script scoreboard craft into the Mcfly Shopify
  Cash MER desk. Use when the user mentions Apps Script, clasp, MER Dashboard,
  Fraunces, decision strip, KPI grid parity, or “make it look like the script.”
---

# Mcfly ← Apps Script craft

## First actions (required)

1. Read `docs/APPS_SCRIPT_CRAFT_SPEC.md`
2. Confirm source exists: `vendor/mer-apps-script/Stylesheet.html` (else `/tmp/mcfly-mer-script2/`)
3. If missing: stop and point human to `docs/APPS_SCRIPT_ACCESS.md` (`clasp login` / `clasp pull`)
4. Spawn **Fable or Opus** for `app._index.tsx` + desk CSS — do not Auto-vibe

## Apply checklist

- [ ] Google fonts: Fraunces + Source Sans 3 in `root.tsx` / desk CSS
- [ ] `:root` tokens match script (`--bg #e8f2fa`, accent `#0284c7`, one shadow)
- [ ] Topbar + uppercase micro definition + segmented periods
- [ ] Sticky context rail (as-of + MER vs target; quiet dots, not pill soup)
- [ ] Overview decision strip (left accent, Fraunces takeaway, Spend/Allocation actions)
- [ ] 4 KPI tiles with delta up/down/flat
- [ ] Channel panel with Fraunces head
- [ ] Scorecard mean ≥ 4.0 documented in reply
- [ ] `bash scripts/agent-ship-gate.sh`

## Never

Port LTV/Klaviyo/Trends/Domo/seeds. Invent pixels/MTA. Commit `vendor/mer-apps-script/`.
