# Enterprise visual gap — Mcfly vs Lifetimely (Amp)

**When:** 2026-09-18 · Conductor autopsy after v22  
**Live:** mcflyads.com **v22** · Fly **391** · Amp https://useamp.com/products/analytics/  
**Canvas:** `lifetimely-gap-diagnosis.canvas.tsx`

## Why the last run was poor

1. **Substituted CSS for product photography.** Claude’s brief said capture `/demo` tabs into framed screenshots. Playwright chromium was missing → agents invented 3 KPI wells. Amp’s hero is a *collage of real UI panels* (LTV heatmap, charts, report cards). Ours is a number stack.
2. **One-shot instead of two-pass.** Brief: structure → then “30% more premium.” We did one HTML rewrite + divider polish.
3. **No section screenshot gate.** Brief: build one section, screenshot 1440/390, compare Amp, fix. We shipped whole page, Pages, Fly.
4. **Stole copy pattern, not craft.** Signal/Evidence/Next became text cards beside mini-KPIs. Amp pairs each claim with a large product visual.
5. **Desk lane optimized honesty copy**, not 1600×900 Admin stills that beat Lifetimely’s scoreboard look.
6. **Conductor declared victory early** (lock pass + deploy) instead of holding the visual bar.

## Religion (unchanged)

Keep: H1, Install → `mcfly-analytics-public`, $39/7-day, empty=—, paper/sky, SAMPLE Snowdevil numbers, no fake logos/reviews, no Book Consult / Profit Agent / OAuth zoo.

Steal: Amp **density, framing, product-first storytelling, alternating rows, premium whitespace**.  
Refuse: Amp mint-on-black clone, AI-analyst pitch, fabricated GMV/store counts.

## Enterprise scorecard (current)

| Criterion | Grade | Note |
| --- | --- | --- |
| Hero product imagery | F | KPI wells ≠ desk |
| Alternating feature visuals | F | mini-KPI frames |
| /demo as product centerpiece | D | exists but not marketed as Amp-grade shot source |
| Admin Overview still readiness | D+ | wells landed; not Lifetimely-density |
| Facts / pricing honesty | A | keep |
| Religion compliance | A | keep |

## Fleet (≤4) — ship bar

| # | Lane | Exclusive | Done |
| --- | --- | --- | --- |
| 1 | Site Capture | `site/assets/product-shots/**`, capture script under `site/scripts/` | ≥4 SAMPLE PNGs @2× from /demo |
| 2 | Site Homepage v23 | `site/index.html`, `site/assets/mcfly/mcfly.css` | Real shots in hero + 3 rows; screenshot PASS |
| 3 | Demo chrome | `site/demo.html`, `site/assets/demo-desk.css`, `site/assets/demo-desk.js` | First fold = product Amp would shoot |
| 4 | Desk Admin fold | Overview + ROAS components + `mcfly-desk.css` wells only | 1600×900 Overview crop enterprise |

Conductor merges, sample-lock, Pages from temp, Fly after Desk+Site green. No invent reviews.
