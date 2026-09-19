# Status — Demo Product Chrome (2026-09-18)

## Lane
Demo Product Chrome · exclusive `site/demo.html`, `site/assets/demo-desk.css` (js untouched)

## Goal
Elevate `/demo` first-fold so a screenshot could sit next to Lifetimely / Amp product panels.

## What shipped
- Tight marketing hero so the desk enters the shot faster (float KPI strip + howto removed from above desk).
- Overview first fold = dark hybrid **scoreboard well**: SAMPLE pill, Total Sales hero (cyan), typical + returning tiles, then spend / Total ROAS / BE MER row.
- YoY + Shopify-five compact as dark wells under the scoreboard.
- Admin-like tab chrome (segmented Polaris-light pills on light desk shell).
- Well tokens aligned to `docs/ops/MCFLY_WELL_TOKENS.md` (`--dd-well-*`).
- Phone 390 stack OK; interactivity kept (period / nav / KPI drawers).
- SAMPLE math **unchanged**: $19,023 · $68,457 · 3.60× · BE 2.50×.

## Gate
| Check | Result |
| --- | --- |
| Grep Snowdevil SAMPLE strings | **PASS** — `$19,023`, `$68,457`, `3.60×`, `2.50×` in `demo.html` + js header |
| Screenshot 1440 desk | `docs/ops/journal/shots/demo_chrome_1440.png` (+ `_vp`) |
| Screenshot 390 desk | `docs/ops/journal/shots/demo_chrome_390.png` (+ `_vp`) |
| vs Lifetimely density | **PASS** |

### Lifetimely density verdict — **PASS**
- Dark scoreboard wells + hero KPI dominance read as product UI Amp would photograph, not marketing copy cards.
- Tab + SAMPLE chrome matches Admin hybrid craft.
- Still no Amp-style LTV heatmap / chart collage (religion: Total ROAS scoreboard, no attribution theater). Density bar for this lane: enterprise scoreboard first fold — met.

## MUST NOT (held)
index.html · mcfly.css · app/** · SAMPLE math · AI theater · commit / Fly / Pages

## Files
- `site/demo.html` (cache `demo-desk.css?v=20260918v23`)
- `site/assets/demo-desk.css`
- `docs/ops/journal/STATUS_20260918_demo_chrome.md`
- shots under `docs/ops/journal/shots/`
