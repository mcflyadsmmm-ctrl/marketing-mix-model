# Enterprise craft holes — 2026-09-22

**Tip read:** Fly v409 / `f0fa935` (merge of #143). App tree is that commit. `cursor/spend-trust-recurring` at `711ffa8` only stamps the scoreboard after it.
**Verdict:** v409 is not an enterprise desk. A multi-million-dollar operator notices the holes below in week one.
**Locks held:** painted five tabs, flat $39, Live PARKED, no invented metrics. This file does not patch `app/`, deploy, or merge.
**Out of scope:** COGS, pixels, MTA, a sixth tab, sessions. Morning habit (`docs/ops/SCOREBOARD.md`) already owns the first-open sentence. This note does not re-specify that cook.

## Top 5 sentences a merchant would say

1. On my phone I cannot read this month’s sales, and last year’s dollars are gone.
2. The page says 24 months of orders are already here. The crawler keeps 90 closed days until the shop is paid.
3. I opened Overview to see the period. The biggest figures are a typical order and yesterday’s bar.
4. I tapped Depth to see who the dollars sit with. The list stayed shut.
5. The demo names the first product. My shop says the names are coming. The stored orders never have them.

## Why “enterprise-ready” is the wrong reading

A believer would point at `docs/plans/2026-09-19-MILLION_DOLLAR_TABS.md` (five tabs, unique money in the first or second lane, phone at ~390px) or at `docs/ops/SCOREBOARD.md` (morning habit is the only cook left). Both files describe a desk this tip does not ship.

The million-dollar plan says the first fold answers “am I up or down vs last year,” and that a phone still shows the number. `app/app/styles/mcfly-desk.css` hides last year under 36rem and squeezes this year’s dollars into a third of the row. The scoreboard’s remaining cook is one morning sentence. It does not open the closed depth lane, does not make the trial banner match the 90-day crawl, and does not stop SAMPLE from inventing a catalog Live cannot store.

Empty spend already paints `—`, and a deleted day stays `$0`. Those passes are real. They do not make the week-one desk enterprise.

## Ranked holes

Ranked by what a $1M+ operator notices in week one. Each line is a file and the behavior on this tip.

### 1. On my phone I cannot read this month’s sales, and last year’s dollars are gone.

**File:** `app/app/styles/mcfly-desk.css` (glance rules near the `max-width: 36rem` block, the always-on `white-space: nowrap` on `.mcfly-yoy--glance .mcfly-yoy__v`, and the later `@media (max-width: 430px)` block under the enterprise fold). Cards: `app/app/components/OverviewYoyCards.tsx`.

**Today:** Overview’s year-over-year glance is three buttons: this month, this quarter, this year, each with this year’s dollars, a percent, and a “LY” line (`mcfly-yoy__prior`). At `max-width: 36rem` the glance becomes a nowrap flex row. Each card is `max-width: calc(33.333% - 0.24rem) !important` and `width: 0 !important`. `.mcfly-yoy__prior`, `.mcfly-yoy__zone`, and `.mcfly-yoy__range` are `display: none`. The dollar is `white-space: nowrap`. `.mcfly-desk-anchor` is `overflow-x: hidden`. A later 430px rule inside `.mcfly-scoreboard--overview` raises that dollar to `clamp(1.55rem, 7.5vw, 2rem)` and does not put last year back. A month in the hundreds of thousands no longer fits in a third of a ~390px iframe, and the comparison dollars are not in the card.

**HOLD.** Stack the three windows on a narrow iframe and keep last year’s dollars on the card. Same Shopify Total Sales. No new metric.

### 2. The page says 24 months of orders are already here. The crawler keeps 90 closed days until the shop is paid.

**File:** `app/app/components/UnlockFullHistoryBanner.tsx` (mounted from `app/app/routes/app.customers.tsx` when `liveHistoryLocked`). The flag is `app/app/lib/desk-customers-stack.server.ts`: Live, billing on, not paid. The crawl is `app/app/lib/live-unpark.ts` (`LIVE_UNPAID_INGEST_DAYS = 90`) and `app/app/lib/live-ingest-depth.ts` (`resolveLiveIngestWindowDays` returns the minimum of that cap and the Shopify window). `app/app/lib/uninstall-friction.test.ts` requires the banner to contain “24 months of orders” and rejects “~90 days”.

**Today:** The banner copy is “24 months of orders are already on this desk. Trial and paid use the same book.” Unpaid Live ingest stops at 90 closed days. Paid keeps the Shopify-visible window, then the 24-month order-row cap. SAMPLE Snowdevil is a full book, so the demo YoY and first-year LTV look finished. A trial Live shop gets a 90-day slice and a sentence that says the long book is already loaded. Last year on Overview and a first-year LTV then stay empty for a reason the banner does not say. Live stays PARKED; the disagreement is already in the tip.

**HOLD.** The sentence has to match the 90-day unpaid slice. Flat $39 stays one plan. This note does not unpark Live and does not add a history SKU.

### 3. I opened Overview to see the period. The biggest figures are a typical order and yesterday’s bar.

**File:** `app/app/components/OverviewFirstViewport.tsx` (first `PeekCard` is `hero`, label typical order). `app/app/lib/overview-first-viewport.ts` (`OVERVIEW_FIRST_LANE_LABEL` is “Typical order, returning $, weekends, typical day”). `app/app/components/OverviewSalesChart.tsx`: `activeIndex` is the hover, or `points.length - 1` when nothing is hovered, and `.mcfly-chart__hero` prints that bucket. The range total is a smaller stat labeled “Sales”.

**Today:** A stranger’s first full-width number is the median ticket. The chart’s full-width number is the last day (or last week/month bucket), compared with a typical day. Period Shopify Total Sales sits in the YoY glance under those peeks, and on a phone that glance is hole 1. The first lane does not answer “what did this period sell?”

**HOLD.** Put the period total where the eye lands, and keep yesterday as the chart readout under it. Still Shopify Total Sales. Morning habit can still add a sentence later; this is the number itself.

### 4. I tapped Depth to see who the dollars sit with. The list stayed shut.

**File:** `app/app/routes/app.customers.tsx` — `DeskLane` “Who the dollars sit with” is `fold` with `defaultOpen={shotMode || panel === "depth"}`. Inside: retention, whale watch, RFM, value bands, whale table, concentration, and `CustomersLtvDepth` (flagship, product board, curves, heat, tiers, paths, whale recency). `app/app/components/DeskLane.tsx` stores `open` in `useState(fold ? defaultOpen : true)` and never updates it when `defaultOpen` changes. `app/app/lib/desk-panel-rail.ts` ships a Depth chip (`panel` `depth`). Customers has no scroll effect for that panel. `app/app/routes/app._index.tsx` folds “More order detail” the same way (`defaultOpen={shotMode}` only), which is the only Overview mount of `WeekdaySalesChart`.

**Today:** A normal open leaves the depth body `hidden`. Landing on `?panel=depth` opens it once. Tapping the Depth chip after the page is mounted highlights the chip and leaves the body shut, and nothing scrolls to `#mcfly-depth`. Shot mode (`?shot=1`) is the path that shows the boards to a camera. A stranger never sees whales, concentration, or the flagship pack. The weekday chart on Overview is the same pattern: closed unless the shot flag is on. Orders still has an open timing chart, so the weekday picture exists on another tab; the depth pack does not.

**HOLD.** The chip has to open the lane it names. Morning habit already owns the Overview sentence (“who to save”). Do not turn this hole into that cook. Do not add a tab.

### 5. The demo names the first product. My shop says the names are coming. The stored orders never have them.

**File:** `app/prisma/schema.prisma` `OrderFact.unitCount` — “units only, never SKU/title.” `app/app/lib/order-facts.server.ts` writes `unitCount` from `currentSubtotalLineItemsQuantity` and does not write a title. `app/app/lib/ltv-depth-page.server.ts` sets `product: null` on every live row. `app/app/lib/ltv-first-product.ts` `FIRST_PRODUCT_TITLES_COPY` says names “wait for titled line items already in scope.” `app/app/components/LtvFirstProductDrivers.tsx` is on the open LTV lane (`CustomersLtvWindows` in `app/app/components/CustomersLtvSection.tsx`). `app/app/lib/ltv-depth-sample.ts` `snowdevilProductForAmount` assigns a catalog name from the ticket size, and the SAMPLE book stores that string.

**Today:** SAMPLE paints a first-product board (goggles, wax, boards) because the generator invented titles. Live paints an empty that promises titles will arrive with the orders already in scope. They will not. `LtvProductBoard` in the folded depth pack hits the same empty. Units are on the row. Names are not.

**HOLD.** Say the book does not store product names. Keep the empty. Do not invent a catalog from units, and do not add a line-item scope in this note.

### 6. Customer payback prints a day count. The curve starts at $0 on the order day and uses the shop’s old average, not this month’s buyers.

**File:** `app/app/lib/cash-payback.ts` — anchors begin `{ day: 0, revenue: 0 }`, then day 30 / 90 / 365 averages, and the function returns a rounded day. `app/app/lib/cpa-desk.server.ts` builds one `paybackBase` from `buildTillLtvSummary` (shop order-history averages) and passes that same base into both This month and Last 28. `app/app/components/CpaPaybackDesk.tsx` labels the stat “Customer payback” and prints `` `${payback.paybackDays}d` ``. The subline says “interpolated vs first-90 average — not a recovery date.” `app/app/routes/app.spend.tsx` repeats the day count in the save banner.

**Today:** Cash CAC for the window is entered spend ÷ new buyers in that window. The dollars it is “paid back” against are the shop’s historical first-30 / first-90 / first-year averages, shared by both windows. The interpolation treats day 0 as $0 even though the first order’s revenue is already inside the day-30 average, so the day count is stretched across the first month. The hedge is under the number. The number is what gets read as a recovery date.

**HOLD** for the label and the day-0 anchor: show the anchors, or stop printing a day count. **REFUSE** a causal or ads-manager payback. No pixel, no MTA.

### 7. I tapped Add spend to record today. The form stayed inside a closed fold.

**File:** `app/app/routes/app.spend.tsx`. `emptyLiveSpend` is `!hasSpend && !sampleDesk.enabled && !shotMode`. When that is false (SAMPLE, or any shop with spend on file), add-a-day, coverage, and the ledger sit in a `DeskLane` with `fold` and `defaultOpen={shotMode || Boolean(editing) || spendPanel === "spend-add"}`. `app/app/components/SpendMixSection.tsx` `useSpendPanelScroll` maps `roas`, `mix`, `cpa`, and `explorer` only. `spend-add` returns null. `DeskLane` does not react to a later `defaultOpen`.

**Today:** An empty Live shop gets the paste box on the first lane. A shop that already has spend — the $1M case, and SAMPLE — gets a first lane of Sales / Spend / Total ROAS, and the add form is behind a closed disclosure. The “Add spend” chip sets `?panel=spend-add`, highlights itself, does not scroll, and does not open the fold after the page has mounted. Coverage and the recent ledger use the same closed `HashDetails` (`defaultOpen={false}`, ledger only when `editing`).

**HOLD.** The chip should open the lane that holds the form. No new spend metric.

### 8. The demo answered “what’s my profit?” The app Goals page is a sales plan.

**File:** `app/app/routes/demo.goals.tsx` computes `calculateBreakEvenMer(data.marginPct)` and prints “At {n}% profit margin” next to break-even Total ROAS. `app/app/routes/app.goals.tsx` leads with `OrderHistoryGoalsBoard` and sales-vs-plan gauges; break-even is a spend-row caption when spend exists, not a profit statement. `app/app/components/CustomersLtvSection.tsx` sets `showMarginKept = marginConfirmed || useSampleDesk`, and when that is true and spend exists it paints “Kept after margin” as first-90 revenue times `marginPct` (“After {pct} margin.”). SAMPLE forces that row on. Live paints it only after a Settings confirm.

**Today:** Public `/demo/goals` is a margin card. Admin Goals is a year plan. SAMPLE Customers answers contribution from a sample margin percent. A stranger who saw the demo asks for profit. The live book has no cost of goods.

**REFUSE** a COGS board, a P&L, or a margin hero. The hole is that SAMPLE and the public Goals demo already speak profit. Stop that sentence. Do not replace it with an invented cost.

### 9. Orders’ “when and where” is on the page. Overview’s weekday chart is not, unless the shot flag is on.

**File:** `app/app/routes/app._index.tsx` — `DeskLane` “More order detail”, `fold`, `defaultOpen={shotMode}`, wrapping `OverviewDepthPeeks` and `WeekdaySalesChart`. The Overview panel rail (`app/app/lib/desk-panel-rail.ts`) has YoY glance, Chart, Mix close, and YoY year. It has no chip for that fold. `app/app/routes/app.orders.tsx` mounts `OrdersTimingChart` in an open “Weekday and hour” lane. `app/app/routes/demo.orders.tsx` mounts the timing chart and omits `OrdersIntelligence` and `OrdersFrequencyChart`, which the Admin Orders page mounts when the book has them.

**Today:** A stranger on Overview never sees the seven-day chart. A stranger on public `/demo/orders` never sees the order-intelligence block the Admin page shows under the clock. SAMPLE and Live disagree on that block even when the underlying Snowdevil book could fill it.

**HOLD.** Open the Overview weekday chart or point the first lane at Orders. Mount the same Orders stack on `/demo/orders`. No new series.

## Already honest (do not “fix” these into new numbers)

- Empty spend is `—`, never `0×`. A deleted day stays `$0`. `app/app/routes/app.spend.tsx`.
- Pending sales copy says “not $0” on Overview, Orders, Customers, and Goals.
- Live `OrderFact` rows stay units-only. That empty is hole 5’s HOLD, not a license to fake a product board.
- Cash CPA is entered spend ÷ Shopify buyers, and the contrast line says so. The leak is the payback day count in hole 6, not the CPA definition.
- Five analysis tabs stay five. `app/app/lib/desk-nav.ts`.

## What this file is not

Not a morning-habit spec. Not a Fly. Not an app patch. Not COGS, pixels, MTA, sessions, or a sixth tab. Not a Live unpark.
