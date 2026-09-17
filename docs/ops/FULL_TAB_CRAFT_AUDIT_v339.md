# Full tab craft audit — Fly v339

**Date:** 2026-09-17 · America/Denver  
**Tip:** `cursor/spend-trust-recurring` @ `17028c3` (PR #73 Customers marquee merged on top of SAMPLE #72)  
**Live:** Fly v339 · SAMPLE Snowdevil · Live parked (`MCFLY_SAMPLE_ONLY=true`)  
**Bar:** multi-million Shopify stores ($5M–$50M+) · Black Clover desk craft · no uninstall friction  
**SoT:** [`research/black-clover-depth/`](./research/black-clover-depth/) · [`CRAFT_UNLOCK.md`](./CRAFT_UNLOCK.md) · [`../plans/2026-09-15-TAB_LOCK.md`](../plans/2026-09-15-TAB_LOCK.md)

**This packet is craft, not accuracy.** Math/honesty already has a written pack ([`ACCURACY_AUDIT_DENSE_v336.md`](./ACCURACY_AUDIT_DENSE_v336.md)). This file re-judges **every tab** against the founder desk bar. **Customers #73 and SAMPLE #72 are not auto-PASS.**

**Method:** static read of routes, components, loaders, SAMPLE generators, empty/first-run/settings. No Fly Admin login. No deploy. No formula changes. No fixes in this PR.

**Explicit refuse check (desk analysis tabs):** no pixels / MTA / “true ROAS” / Email·Klaviyo product tab. Email Cost in the spend CSV is cash input, not a Klaviyo surface.

---

## Overall

| Bucket | PASS | FAIL | Ready for one final-review? |
| --- | ---: | ---: | --- |
| **11 analysis tabs** | **6** | **5** | **No** |
| Settings / first-run / empties | 1 | 0 | Plumbing only |
| Uninstall friction (dedicated) | 0 | 1 | **No** |

**Desk verdict: FAIL.** Marty does not get a final-review packet until the five FAIL tabs (and the uninstall composite) clear. Do not drip.

PASS: Overview · Orders · LTV · Goals · Total ROAS · Channel Allocation  
FAIL: Customers · Growth · Spend Upload · YoY · CPA  
Settings plumbing: PASS · Uninstall friction: FAIL · Nav chrome: PASS (clutter note)

---

## Scorecard (one line each)

| Surface | Verdict | Why (≤20 words) |
| --- | :---: | --- |
| 1. Overview `/app` | **PASS** | YoY spine, sales peeks, open explorer (grain + dark tip); zero spend/ROAS hero. |
| 2. Orders `/app/orders` | **PASS** | Typical-order + clock + intelligence; weekday/hour chart with grain and tooltip. |
| 3. Customers `/app/customers` | **FAIL** | #73 marquee leads, then six-tile wall + duplicate buyers catalog — not one spine. |
| 4. Growth `/app/growth` | **FAIL** | Book hero + fact grid first; comeback chart is thin hrows, not an explorer. |
| 5. LTV `/app/ltv` | **PASS** | First-90 hero, 30/90/365 honesty, SAMPLE depth pack; CAC only when spend typed. |
| 6. Goals `/app/goals` | **PASS** | MTD/QTD/YTD gauges, year dropdown, Grow 10%, monthly board open; no explorer. |
| 7a. Spend Upload `/app/spend` | **FAIL** | Input job, but SAMPLE still mounts Sales\|Spend\|ROAS + mix (`MarketingSnapSection`). |
| 7b. Total ROAS `/app/roas` | **PASS** | Sales/spend/ROAS pair, `—` not 0×, dual-close, pacing, on-chart SpendExplorer. |
| 7c. Channel Allocation `/app/allocation` | **PASS** | Mix table + pie + plan windows + best/rolling; SAMPLE banner; busy but operator-dense. |
| 7d. YoY `/app/yoy` | **FAIL** | Operating cards + fact grids only — no 12-month board, no channel vs LY, no bars. |
| 7e. CPA `/app/cpa` | **FAIL** | Scoreboard sibling of Overview is a short `BookFactGrid`; period lives in chrome. |
| 8. Settings / first-run / empties | **PASS** | Targets, Sample\|Live freeze, honest empties, SAMPLE labeled in chrome. |
| Uninstall friction | **FAIL** | First Overview win is ≤10 min; second click (CPA / Upload / YoY) can still kill. |
| Nav chrome (note) | **PASS** | Scoreboard \| Retain \| Spend plan grouped; dual `<s-app-nav>` is phone clutter. |

---

## 1. Overview `/app` — **PASS**

Shopify-order scoreboard only. Three YoY cards (`OverviewYoyCards`) then dense peeks (`OverviewFirstViewport`) then an open sales explorer (`OverviewSalesChart`: Day/Week/Month/Quarter + range presets, HTML axis overlays, dark tooltip). No Total ROAS / Ad spend / Spend Upload hero. SAMPLE chip + `SampleDeskBanner`. `showPeriod` is not in Overview chrome.

**Gaps (not FAIL):** loader still serializes unused `spend` on sales days; `mcfly-desk--live-ready` is spend-gated in CSS; weekday chart after peeks is redundant. Do not cook these before FAIL tabs.

Evidence: `app/app/routes/app._index.tsx` (~L564–711), `OverviewSalesChart.tsx` (~L39–101).

---

## 2. Orders `/app/orders` — **PASS**

Typical-order story, sales clock, `OrdersIntelligence`, then `OrdersTimingChart` (Weekday \| Hour on the chart, dark `mcfly-chart__tip`). Frequency chart when the book is deep enough. `showPeriod={false}`. Zero spend/ROAS in the route. SAMPLE door copy on the scoreboard (`SAMPLE_ORDERS_DOOR`).

Evidence: `app/app/routes/app.orders.tsx` (~L90–122), `OrdersTimingChart.tsx` (~L106–171).

---

## 3. Customers `/app/customers` — **FAIL**

**#73 is a real partial win, not the bar.** `CustomerMixChart` now leads (Overview-grade dual-axis, HTML overlays, ghost empty). Immediately under it: returning-share gauge + **six identical tiles** + mix bars (`CustomersScoreboard`), then retention / bands / whales / concentration, then a **second** buyers catalog (`ShopifyBookSection` `groups={["buyers"]}`) that repeats new $, guests, one-order, top 10%, orders/buyer (biggest orders only appear in that dump).

Fails: “not a lazy KPI-card wall” (the wall is still there, just below the marquee) and “not boring identical stacks.” Does not feel like one Black Clover “What-to-do Customers” desk.

**Do not mark PASS because #73 merged.**

Evidence: `app/app/routes/app.customers.tsx` (~L110–158), `CustomersScoreboard.tsx` (~L188–268), `ShopifyBookSection.tsx` (~L519–556).

---

## 4. Growth `/app/growth` — **FAIL**

Present. Job is new dollars + who came back. Page leads with `ShopifyBookSection` (first-time $ hero + `BookFactGrid`) and only then `GrowthComebackChart` — horizontal share rows, no axis overlays, no grain, no dark tooltip, **null if fewer than two bars**. First-order-month bars are last.

Fails: “explorer / charts lead where the job needs them.” TAB_LOCK rows exist; craft does not. No Klaviyo/email product (lede correctly refuses email lists).

Evidence: `app/app/routes/app.growth.tsx` (~L158–198), `GrowthComebackChart.tsx` (~L31–74).

---

## 5. LTV `/app/ltv` — **PASS**

First-90 hero, 30 / 90 / 365 build with `historyLimited` suppressing a fake first year, SAMPLE banner, depth pack (curves, retention heat, paths, whales) on Snowdevil. Cash CAC / economics only when spend is typed. TAB_LOCK “chart: none v1” is exceeded, not violated.

**Gap (not FAIL):** live ~60-day shops see an honest thin pack. SAMPLE is the craft canvas and it is dense.

Evidence: `app/app/routes/app.ltv.tsx` (~L388–473).

---

## 6. Goals `/app/goals` — **PASS**

Sales vs plan, MTD · QTD · YTD `SalesGoalGauges`, year dropdown on the page, Grow 10% + extra %, monthly board in `<details open>` (open by default). No SpendExplorer, no Upload forms. Empty spend stays honest (`—`, not fake MER). SAMPLE banner.

**Gap (not FAIL):** period spend/ROAS tiles appear when spend exists (extra, not the job).

Evidence: `app/app/routes/app.goals.tsx` (~L630–834).

---

## 7a. Spend Upload `/app/spend` — **FAIL**

Doors, add-a-day, daily amount, import/CSV, coverage, recent ledger, and “empty spend is never 0×” are right. **TAB_LOCK §6 is input-only — no Total ROAS hero, no mix, no chart.** On SAMPLE (and any shop that is not stranger-empty Live), the route still mounts `MarketingSnapSection` (Sales \| Spend \| Total ROAS + channel mix). `strangerEmpty` is `isEmpty && !sampleDesk.enabled` — Snowdevil never takes the lean path.

This is spend-hero confusion on the first Spend plan click.

Evidence: `app/app/routes/app.spend.tsx` (~L499, L617–642), `MarketingSnapSection.tsx`.

---

## 7b. Total ROAS `/app/roas` — **PASS**

Pair + visible formula, ROAS `—` until spend, dual-close, monthly pacing, intel room, `SpendExplorer` with range / grain / compare **on the chart**. Explorer is not on Upload or Overview.

Evidence: `app/app/routes/app.roas.tsx` (~L246–391).

---

## 7c. Channel Allocation `/app/allocation` — **PASS**

Period snapshot, pie + channel list, `SpendMixPlan` windows (This month / Last 7 / This quarter) with vs-LM/LY, best/rolling grain, SAMPLE banner, empty spend `—`. Two mix UIs (pie vs table) are busy, not thin.

Evidence: `app/app/routes/app.allocation.tsx` (~L460–604, L738–858), `SpendMixPlan.tsx`.

---

## 7d. YoY `/app/yoy` — **FAIL**

TAB_LOCK §9: compare table **and** a 12-month board (actual · prior · YoY %) **and** channel vs last year; optional monthly bars; missing last year = 60-day honesty, not $0. Honesty is present (`OVERVIEW_YOY_MISSING`). Depth is not: four operating cards + two `BookFactGrid`s + footer. Loader only builds `operatingMonthRows` + `last7VsPrior7`. No monthly board. No channel vs LY. No chart.

Feels like Overview’s YoY cards stretched into a stub Spend plan page.

Evidence: `app/app/routes/app.yoy.tsx` (whole file, ~L40–329), `app/app/lib/yoy-workspace.ts`.

---

## 7e. CPA `/app/cpa` — **FAIL**

Religion is correct: cash CPA / CAC from typed spend, `—` never $0 CPA, links to LTV + Upload. Craft is a pamphlet. Default `DeskBookPage` `showPeriod={true}` puts the clock in chrome (TAB_LOCK: This month / Last 28 **on the cards**). Three-tile `BookFactGrid` sits in **Scoreboard** next to Overview — the worst possible neighbor for a thin page.

On SAMPLE, spend is seeded so the tiles fill; they still look demo-thin versus the Overview explorer the merchant just left.

Evidence: `app/app/routes/app.cpa.tsx` (~L47–149), `DeskBookPage.tsx` (~L14, L80–82), `desk-nav.ts` (~L132–150).

---

## 8. Settings / first-run / empties — **PASS**

`/app/settings` is plumbing: target Total ROAS, optional margin, billing, Sample \| Live. `MCFLY_SAMPLE_ONLY` freeze copy (“Live is parked until launch”). SAMPLE dollars do not transfer. Global `DataModeBar` labels SAMPLE on every analysis page. Overview first viewport is sales-only. Empty vs zero on audited spend surfaces is `—`, not `0.00×`. SAMPLE seed (`ensureSampleBookThroughToday`) fills Snowdevil sales + spend so SAMPLE empties are not broken.

**Not a Settings FAIL:** save CTA can nudge Spend Upload when live spend is missing — correct on Settings, not on Overview.

Evidence: `app/app/routes/app.settings.tsx` (~L355–456), `DataModeBar.tsx`, `fly.toml` `MCFLY_SAMPLE_ONLY=true`, `sample-desk.server.ts`.

---

## Uninstall friction — **FAIL**

| Check | Verdict |
| --- | :---: |
| Time-to-first-win ≤10 min on SAMPLE | **PASS (judgment)** — Overview paints YoY + peeks + sales chart immediately; no spend required. |
| Sales desk first | **PASS** — home is Shopify scoreboard, not an ads wall. |
| SAMPLE labeled | **PASS** — `DataModeBar` + per-tab banners/ledes on Overview, Customers, Growth, Orders, LTV, Goals, Allocation, Spend. |
| Empty vs zero honesty | **PASS** on audited surfaces. |
| No broken SAMPLE empties | **PASS** — Snowdevil book reseeds through today (#72 is real here; still not an auto-PASS for the desk). |
| No spend-hero confusion | **FAIL** — Upload still paints ROAS + mix on SAMPLE. |
| No second-click pamphlet | **FAIL** — Scoreboard CPA and Spend plan YoY under-deliver vs Overview. |

**TTFW judgment:** a merchant who stays on Overview gets a keep-worthy SAMPLE desk in well under 10 minutes. A merchant who uses the grouped rail the way Black Clover taught them (Scoreboard → CPA, or Spend plan → Upload / YoY) can still bounce. That is uninstall friction. **#72 SAMPLE seed does not clear this.**

Stale note: [`research/2026-09-15-tab-uninstall-audit.md`](./research/2026-09-15-tab-uninstall-audit.md) still describes an Overview Total ROAS + Ad spend first viewport. **That Overview P0 is gone in this tree.** Re-judged independently.

---

## Nav chrome (note) — **PASS**

Grouped iframe rail matches Black Clover SCOREBOARD \| RETAIN \| SPEND PLAN (`DeskTopTabs.tsx`, `desk-nav.ts`). Settings stays out of the 11. Period chips are off Overview / Shopify-five book pages (CPA excepted — that is a CPA FAIL).

**Clutter:** full 11-link `<s-app-nav>` still mounts beside the grouped pills (`app.tsx` ~L146–162). Phone Admin iframe (~390px) pays for two sitemaps. CPA under Scoreboard matches the Black Clover map and is zero-spend-safe; it makes the thin CPA page more dangerous.

---

## FAILs ranked by uninstall-kill risk

Same-day ETAs are **cook buckets for a later PR**, not work in this packet. Times are **Thu 9/17 America/Denver**.

| Rank | Surface | Kill | Why they bounce | Cook (later) | ETA |
| ---: | --- | :---: | --- | --- | --- |
| 1 | **CPA** | **High** | One Scoreboard click off a dense Overview into a three-tile pamphlet. | On-card This month / Last 28; hide the grid until spend; payback vs 90-day LTV as a real desk, not a second `BookFactGrid`. | **noon** |
| 2 | **Spend Upload** | **High** | SAMPLE tour hits ROAS + mix on the input tab — “which tab is Total ROAS?” | Delete `MarketingSnapSection` from `/app/spend`. Keep doors, forms, coverage, ledger, post-save link to `/app/roas`. | **noon** (parallel with CPA) |
| 3 | **YoY** | **High** | Spend plan promises a year workspace; they get four cards. | 12-month board (sales always; spend/ROAS columns when typed) + channel vs LY from mix compare; optional monthly bars; keep 60-day missing ≠ $0. | **3pm** |
| 4 | **Growth** | **Med** | Retain “who came back” is a book dump Shopify already resembles. | Comeback explorer first (Overview-grade scaffold); demote `BookFactGrid` to drill; designed empty when bars < 2. | **6pm** |
| 5 | **Customers** | **Med** | #73 fixed the fold; scroll is still tile wall + repeated catalog. | One spine: marquee + returning hero. Fold/cut `ShopifyBookSection` buyers on this route; compress six tiles; biggest-orders into the scoreboard; one retention chart owns “when they come back.” | **9pm** |

Uninstall composite clears only when ranks 1–3 ship; 4–5 are the Retain “stop early” pattern the founder called over.

---

## Re-judge: #72 SAMPLE and #73 Customers

| Prior win | What actually shipped | This audit |
| --- | --- | --- |
| **#72 SAMPLE** | Reseed when the book is short of 730d or guests are missing; Snowdevil labeled; Live parked. | **Not auto-PASS.** SAMPLE canvas is strong on Overview / Orders / LTV. It also **lights up** the Upload ROAS snap and makes thin CPA/YoY look “full” without being a desk. |
| **#73 Customers** | Explorer-first new-vs-returning marquee above the fold. | **FAIL.** Marquee is the right lead. The tab is still two jobs stacked (scoreboard wall + book catalog) after that lead. |

---

## What this PR did / did not do

- **Did:** write this scorecard only.
- **Did not:** redesign, implement, change formulas, deploy Fly, open Admin, merge.

**Next cook order (not this PR):** CPA + Spend Upload (noon) → YoY (3pm) → Growth (6pm) → Customers spine (9pm). Then one final-review packet — no drip.
