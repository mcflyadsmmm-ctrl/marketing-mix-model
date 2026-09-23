# Quality rescue plan — site + desk (Marty screenshots 2026-09-22)

**Intent:** Live site/app feel 1/10 — overlapping hero still, wireframe “demo” KPI bars on home, desk YoY theater with redundant sentences. Niche is real; craft must stop apologizing and stop stacking equal cards.

**Thesis:** One honest number, one compare line, one support strip. Delete filler copy and fake nav. Steal Lifetimely calm density — not more prose.

## P0 (this ship — must fix before anything else)

| # | Surface | Fix |
| --- | --- | --- |
| Q1 | Site hero still | Prior + From orders must **never** overlap. One line: `From orders · same days last year $69,891`. Stamp **v45**. |
| Q2 | Site home price band | Kill `.live-slice { display:block }` white bars. Replace “Spend demo / ROAS demo…” with one calm line + Demo CTA. |
| Q3 | Desk Overview YoY | Remove `Orders YTD … — from orders` + Copy YTD under cards. Drop UP pills. Show **one** delta (not under $ and again in footer). Cut analytics lede when cards exist. |
| Q4 | Desk Overview plane | Prior + From orders as one quiet line under hero $ (match site). Coverage line stays muted, not a second essay. |

## P1 (same PR if cheap)

| # | Fix |
| --- | --- |
| Q5 | YoY plane: true compact rows (not tall green-border cards). Month/quarter/year as dense list. |
| Q6 | Pricing page: no competitor theater; one plan only (already mostly). |

## Out of scope this ship

Religion, scopes, SAMPLE_ONLY, full tab IA redesign, LTV/Goals depth, research fleet.

## Model routing

Conductor implements (P0 is mechanical CSS/HTML/TSX). Composer only if blocked. Opus Ship once before Pages+Fly.

## Done bar

```bash
# site still: source and prior not both absolute / not overlapping in markup
rg -n "ov-still__prior|ov-still__source" site/index.html site/assets/mcfly/mcfly.css
# live-slice not display:block bars
rg -n "display: block" site/assets/mcfly/mcfly.css | rg live-slice || echo "ok"
rg -n "Spend demo" site/index.html   # none
# desk
rg -n "Orders YTD" app/app/components/OverviewYoyCards.tsx   # none in render
rg -n "CopyYtdSales" app/app/components/OverviewYoyCards.tsx  # none
cd app && npx vitest run app/lib/overview-first-viewport.test.ts app/lib/book-coverage-honesty.test.ts app/lib/overview-yoy.test.ts
```

Then Pages `--branch main` + Fly + smoke.
