# App aesthetic rebuild — Admin first screens

**Lane:** Research · APP AESTHETIC (revamp Wave R)  
**Date:** 2026-09-22  
**Only output:** this file. No product code, no Fly, no invented reviews.  
**Ship tree:** `marketing-mix-model/`  
**Live demo checked:** https://mcfly-analytics.fly.dev/demo (SAMPLE Snowdevil, 2026-09-22)  
**Listing:** https://apps.shopify.com/mcfly-analytics-public · **reviews: 0**  
**Religion:** Total ROAS = Shopify Total Sales ÷ entered spend; empty spend = **—** never 0×; no pixels / MTA / ad OAuth. Overview must earn $39 at **$0 spend**.  
**PCD L2:** Pending — design the **order-book desk**, not a screen that only works if ShopifyQL matches Analytics.  
**Supersedes:** `REVAMP_SPEC.md` aesthetic paragraph that said “keep white KPI cards.” Founder rejected that look.

**Overview hero sentence (target):**  
*This month is $108,666 — up 12% vs the same days last year.*

---

## Competitor composition steal (not features)

Looked at Lifetimely / Amp P&L, Peel dashboards, Polar ecommerce dashboards, Shopify Analytics overview, and TrueProfit’s 2025 dashboard refresh ($39-class profit desk craft). Steal **composition**, refuse their attribution / connector religion.

| Source | Composition to steal | Refuse |
| --- | --- | --- |
| **Lifetimely** | One morning command number; everything else is subordinate; dense but ranked | Profit Agent, OAuth costs, P&L OS, order-volume tax |
| **TrueProfit** | ≤5 metrics pinned at the top; one performance chart owns visual weight; controls stay in a thin rail | Net-profit / COGS hero as Mcfly’s job; ad-per-order theater |
| **Shopify Analytics** | Period + compare as the primary gesture; metric cards are tools, not wallpaper | Customizable card soup, sessions/CR as first fold, Sidekick |
| **Polar** | Named view, not infinite widgets; operator “one home” calm | Warehouse soup, GMV tax, pixel + MTA |
| **Peel** | Retention story with a clear lead metric | Magic Dash / purple share chrome, subscription-platform gravity |
| **Keel (craft only)** | Morning glance: few big numbers, almost no prose | Ad OAuth as day-one wall |

**Mcfly wedge (from `03-COMPETITORS_AND_NICHE.md`):** $39 Shopify-only morning desk — deeper than native on the order book, honest when spend is empty, calmer than Lifetimely–Peel–Polar.

---

## 1. What the first folds actually render (cite files)

### Overview — `/app` and `/demo`

**Routes:** `app/app/routes/app._index.tsx`, `app/app/routes/demo._index.tsx`  
**First lane:** `DeskLane` (`app/app/components/DeskLane.tsx`) with label from `OVERVIEW_FIRST_LANE_LABEL` (“Shopify Total Sales · Typical order, returning $, weekends, typical day”).  
**Viewport:** `OverviewFirstViewport` (`app/app/components/OverviewFirstViewport.tsx`) + `OverviewYoyCards` (`app/app/components/OverviewYoyCards.tsx`) + `OverviewSalesChart` still inside the same first `DeskLane` on home.

**Live `/demo` first fold (verified):**

1. SAMPLE / Install chrome + yellow sample banner  
2. Pill tabs + “On this page” jump links (YoY glance / Chart / Mix close / YoY year)  
3. Serif page title **Overview** + orange context (`Snowdevil · Month to date · Sample data`)  
4. Lane chrome: **LOOK HERE FIRST** + long instructional label  
5. Operator greeting paragraph (prose)  
6. Soft white KPI farm:
   - Large **Shopify Total Sales** tile (~$108,666) with multi-line definition  
   - Four equal soft peeks: Typical order · Returning $ · Weekend % · Typical day  
   - Cash-window row: Yesterday · This week · This month to date  
   - Handoff peeks: Days to second · New-buyer worth · Month close  
7. Three YoY soft cards (month / quarter / year) with green “Up” badges  
8. Right column often empty; stray trust/coverage lines float in whitespace  
9. Below the fold (still “page soup”): sales explorer, mix/close, order-history forecast, four shareable cards, weekday depth, year board  

**CSS that locks the rejected look:** `.mcfly-score--soft .mcfly-kpi--soft` and `.mcfly-yoy__card--soft` in `app/app/styles/mcfly-desk.css` — pale mix-of-accent white tiles, 14px radius, equal padding, mid-size values (`clamp(1.15rem…1.45rem)`). Soft mode was explicitly “flat tiles, not thin KPI stacks” — still a **card grid**.

**Code note:** Local `OverviewFirstViewport` marks Typical order as `mcfly-kpi--hero` PeekCard and does not itself render the Total Sales / Yesterday–Week–MTD tiles seen on Fly. Treat **live `/demo`** as the merchant-facing first fold; ship tree UI must match or replace that density, not defend a thinner local snapshot.

### Orders — `/app/orders`, `/demo/orders`

**Routes:** `app/app/routes/app.orders.tsx`, `app/app/routes/demo.orders.tsx`  
**First fold:** long `mcfly-book__lede` contrast sentence → `DeskLane` (`ORDERS_FIRST_LANE_LABEL`) → `OrdersFirstViewport` (`app/app/components/OrdersFirstViewport.tsx`):

- Greeting prose  
- Soft hero article (`mcfly-orders-hero--soft`): Typical (median) ticket + definition + `OrdersTicketBand`  
- Soft KPI grid of lead peeks from `buildOrdersLeadPeeks` (`app/app/lib/orders-first-viewport.ts`): full-price vs discounted median, 2+ items %, items/order  

Next lanes (still competing for first scroll on laptop): `OrdersScoreboard`, intelligence, weekday/hour charts.

### Customers — `/app/customers`, `/demo/customers`

**Routes:** `app/app/routes/app.customers.tsx`, `app/app/routes/demo.customers.tsx`  
**First fold:** contrast lede → `DeskLane` (`CUSTOMERS_FIRST_LANE_LABEL`) → `CustomersFirstViewport` (`app/app/components/CustomersFirstViewport.tsx`):

- Greeting prose  
- Soft hero (`mcfly-customers-hero--soft`): Returning dollars (or New dollars) + definition  
- Soft peek grid from `buildCustomersLeadPeeks` (`app/app/lib/customers-first-viewport.ts`): new $, $/buyer peeks  

Same first lane then stacks `CustomerMixChart` + `CustomersScoreboard` — first fold already multiplies surfaces before LTV/Growth.

### Spend — `/app/spend`

**Route:** `app/app/routes/app.spend.tsx`  
**First fold:** `DeskLane` “Sales, spend, and Total ROAS” → soft book section with **three equal soft KPI cells** (Sales · Spend · Total ROAS) + lede that teaches the formula. Empty spend paints **—** and opens Add-day + paste panels immediately under the trio (correct product; noisy page).

### Goals — `/app/goals`

**Route:** `app/app/routes/app.goals.tsx`  
**First fold:** year rail + chips → `OrderHistoryGoalsBoard` + `OrderHistoryForecast` **above** the soft book hero (Shopify Total Sales) → then `SalesGoalGauges`. Habit board and forecast compete with the sales hero before MTD/QTD/YTD gauges appear.

---

## 2. Why it fails (aesthetic + product)

Not “needs polish.” Specific failures:

1. **Equal-weight white card farm.** Soft tiles share size, border, and type scale. The merchant cannot feel which number is the product. TrueProfit pins five; Lifetimely leads with one P&L; Mcfly paints **ten+** soft tiles before the YoY story lands.

2. **Instructional chrome is the UI.** “LOOK HERE FIRST,” multi-clause lane labels, Analytics-contrast ledes, formula footnotes inside every tile, Signal/Evidence/Next strips, sample banners, jump-nav — the desk apologizes instead of deciding. Paid software shows the number; docs explain later.

3. **Hero identity is wrong for JTBD #1.** From `02-COMPLAINTS_AND_JOBS.md`, the money job is **morning cash YoY** (am I up vs last year?). Live Overview leads with a Total Sales definition card and median peeks; the three YoY cards sit **below** the peek farm. The thing merchants would pay for is demoted.

4. **Overview tries to be every tab.** Days-to-second, LTV worth, month close, weekend mix, typical day, shareables, mix forecast, year board — all on one scroll. That is Peel/Polar dashboard soup at $39 with none of their connector payoff. Orders/Customers/Spend lose their jobs because Overview already previewed them as soft tiles.

5. **Whitespace without hierarchy.** Soft cards hug the left; the right half of a large Admin iframe is empty or holds orphan trust lines. Composition reads unfinished, not “calm.”

6. **Type scale is report-sized, not product-sized.** Soft KPI values ~1.15–1.45rem cannot compete with Shopify Admin chrome. A $39 desk needs a **display** cash number (~2.5–3.5rem) and quiet meta — not twelve medium numbers.

7. **$0-spend usefulness is buried under teaching.** Religion is correct (no fake ROAS on Overview), but the first fold still spends attention on coverage essays and SAMPLE doors. At $0 spend the board should feel *finished*: YoY + order-book quality, not “wait until you upload spend.”

8. **Soft aesthetic = generic SaaS tiles.** Pale blue-white rounded rectangles with gray line icons are the default “analytics app” skin. Founder rejection of “keep white KPI cards” is a product call: this look cannot sell against Lifetimely’s command center or Shopify’s free Overview.

---

## 3. Rebuild — Overview first screen

### Job

Open Admin → know **am I up or down vs last year (same window)** from Shopify Total Sales, then see **one** order-book quality signal — without spend, pixels, or QL parity.

### Layout (desktop Admin ~1000px content)

```
[shop · period · freshness]     ← one quiet meta row (no SAMPLE novel)
────────────────────────────────
THIS MONTH                    ↑ 12% vs LY
$108,666
same days last year $96,947

Returning $65,722 (70%)  ·  Typical order $602  ·  Weekend 24%
────────────────────────────────
[ open sales chart — last 30d vs typical day line ]
```

- **One composition**, not a dashboard of cards.  
- **No white KPI grid.** Numbers sit on the page plane (paper/ink), not in soft tiles.  
- **Hero number:** MTD Shopify Total Sales (or selected certified window) as display type.  
- **Hero delta:** YoY % + prior dollars on the same optical line as the hero (Lifetimely/TrueProfit pinned-metric craft).  
- **Support strip:** three *inline* facts max — Returning $, Typical (median) order, Weekend %. Not buttons. Not icons-in-boxes. Drill on click/tap still allowed via text links to Orders/Customers.  
- **Visual weight:** open sales chart immediately under the strip (TrueProfit performance chart role). Chart is the second beat, not the tenth.  
- **Absent from first fold:** spend, Total ROAS, MER, CPA, days-to-second, LTV, month-close projection, shareable PNG theater, weekday bars, year board, mix forecast essays, “LOOK HERE FIRST,” Analytics contrast ledes, jump-nav to mid-page anchors.

### Type scale

| Role | Size | Face |
| --- | --- | --- |
| Hero $ | clamp(2.6rem, 5vw, 3.4rem) | Display/serif already in desk — ink black |
| YoY delta | ~1.1–1.25rem | Sans, green/red only on the delta word/number |
| Support strip | ~0.95–1.05rem values | Sans; labels smaller, muted |
| Meta row | ~0.8rem | Muted; one SAMPLE chip max when sample |

### Atmosphere

Reject flat pale-blue card field. Use a single quiet paper field (warm off-white or cool stone — pick one, ship one), hairline rules, and sky accent **only** on period controls / positive delta. No purple SaaS glow. No floating badges on the hero.

### $0 spend / pending

- Sales pending → hero is **—** with “Closed days still loading — not $0.” Support strip uses **—**, not zeros.  
- No spend → nothing about ROAS appears. Overview stays useful.  
- Missing prior year → delta is **—** / “Last year not on file,” never +∞% from a fake $0 prior.

### Overview hero sentence (canonical)

**This month is $108,666 — up 12% vs the same days last year.**

Support line (optional, one breath): *Returning buyers carry $65,722 · typical order $602.*

---

## 4. Rebuild — other tabs (first fold only)

### Orders

**Hero:** Typical order (median) as display $.  
**Subline:** Shopify average $X (mean) — contrast without a pamphlet.  
**One visual:** ticket band or full-price vs discounted median as a split bar (not three soft cards).  
**Absent:** clock scoreboard, hour chart, intelligence walls — those start below the fold.  
**Files:** `OrdersFirstViewport.tsx`, `orders-first-viewport.ts`, soft hero CSS; stop stacking Scoreboard into the first optical fold.

### Customers

**Hero:** Returning dollars as display $.  
**Subline:** New $Y · returning share Z%.  
**One visual:** new vs returning horizontal split (already partially exist as `mcfly-split` — promote it; kill soft peek grid).  
**Absent:** RFM, whales, LTV windows, growth habit charts on first fold. Link “New-buyer worth →” as text into `#ltv`.  
**Files:** `CustomersFirstViewport.tsx`, `customers-first-viewport.ts`; pull MixChart/Scoreboard out of first-lane fold competition.

### Spend

**Hero:** Total ROAS as display (e.g. `3.57×`) **or** em dash when empty.  
**Equation line under hero:** `$108,666 ÷ $30,400 = 3.57×` (written-out religion) — only when spend > 0.  
**Pair:** Sales and Spend as secondary inline figures, not equal soft KPI triplets.  
**Empty:** giant **—** + one CTA (“Add yesterday’s spend”) — no dual finding strips + paste + add-day all fighting. Paste/add collapse under a single primary action.  
**Absent from first fold:** CertifiedScoreboard chips, explorer, CPA, mix.  
**Files:** first lane block in `app.spend.tsx` (~Sales/Spend/ROAS glance), `SpendFindingStrip` usage, soft book KPI CSS.

### Goals

**Hero:** MTD actual vs plan (or YTD if that’s the operator default) — one gauge or one big “72% of plan” with dollars under.  
**Subline:** Order-history next-month estimate as quiet text, not a second hero board above sales.  
**Reorder:** Sales/plan hero first; habit board + forecast below the fold.  
**Empty spend:** no ROAS/spend ceiling on first fold; sales plan still works.  
**Files:** `app.goals.tsx` first main stack; `SalesGoalGauges`, demote `OrderHistoryGoalsBoard` / forecast above hero.

---

## 5. Mobile ~390px — what must survive

Admin embedded width is often phone-like. First screen must remain one decision:

| Survive | Drop / push below |
| --- | --- |
| Meta: shop · period | Jump-nav (“On this page”) |
| Hero $ + YoY delta | Soft card grids |
| One support line (Returning $ · Typical order) | Third support metric if cramped |
| Chart peek (spark / 7–14 bars) or “Open chart” | Mix, shareables, year board, forecast, weekday |
| One SAMPLE chip if sample | Yellow essay banners stacked with install chrome |

Touch: hero and support line are tappable drills; do not require hunting 12 equal buttons.

---

## 6. Component / file touch list — SINGLE publish

One Desk aesthetic ship (one PR / one Fly), not 40 micro-PRs. Site is out of scope here (see `07-SITE_AESTHETIC_REBUILD.md` if present).

### Must change

| Area | Paths |
| --- | --- |
| Overview route composition | `app/app/routes/app._index.tsx`, `app/app/routes/demo._index.tsx` |
| Overview first viewport | `app/app/components/OverviewFirstViewport.tsx`, `app/app/lib/overview-first-viewport.ts` (+ tests) |
| YoY glance presentation | `app/app/components/OverviewYoyCards.tsx`, `app/app/lib/overview-yoy.ts` — fold into hero delta, not a third soft row |
| Chart as second beat | `app/app/components/OverviewSalesChart.tsx` (placement/CSS only; no feature densify) |
| Lane chrome | `app/app/components/DeskLane.tsx`, `app/app/lib/desk-lane.ts` — kill “LOOK HERE FIRST” theater on Overview |
| Orders first fold | `OrdersFirstViewport.tsx`, `app/app/lib/orders-first-viewport.ts`, `app/app/routes/app.orders.tsx`, `demo.orders.tsx` |
| Customers first fold | `CustomersFirstViewport.tsx`, `app/app/lib/customers-first-viewport.ts`, `app/app/routes/app.customers.tsx`, `demo.customers.tsx` |
| Spend first fold | `app/app/routes/app.spend.tsx` (first `DeskLane` only) |
| Goals first fold | `app/app/routes/app.goals.tsx` (reorder + soft hero CSS) |
| Soft skin kill / replace | `app/app/styles/mcfly-desk.css` — retire `.mcfly-kpi--soft` / `.mcfly-*-hero--soft` as the default scoreboard language; add ink/paper hero utilities |

### Shared chrome (same publish if it leaks into first fold)

- `DeskBookPage.tsx` — shorten/remove first-fold ledes on Orders/Customers  
- `SampleDeskBanner.tsx` — one chip, not a yellow essay when possible  
- `ShareableInsightCards.tsx` — move below fold / out of Overview first scroll  

### Explicitly not in this publish

- New LTV panels, RFM, Product→LTV densify  
- Pixel / MTA / OAuth / P&L  
- ShopifyQL parity claims while PCD L2 pending  
- Chart easing micro-PRs, icon packs, purple themes  
- Listing Submit, ads, invented reviews  

### Publish bar

Stranger on `/demo` Overview first screen: reads the **hero sentence** without scrolling; sees **no** soft white KPI grid; Spend/ROAS absent; empty spend elsewhere still **—**.

---

## 7. Refuse list

| Refuse | Why |
| --- | --- |
| **Pixels / MTA / “true ROAS” / ad OAuth** | Religion; day-one uninstall engine |
| **Purple SaaS chrome / glow / gradient glass** | Generic AI-dashboard look; fights paper/ink desk |
| **White soft KPI card grids as the system** | Founder-rejected; equal weight; cannot sell at $39 |
| **Dashboard soup** (10+ metrics before one decision) | Polar/Peel without their depth; Overview steals every tab |
| **Fake zeros** ($0 sales, 0× ROAS, $0 prior YoY) | Honesty; uninstall research |
| **Sessions / conversion rate / Sidekick clone** | Native already owns; hallucination risk |
| **QL-matched day totals as the only useful Overview** | PCD L2 pending — order book must stand alone |
| **Spend / Total ROAS on Overview first fold** | Spend is chapter two; Overview must work at $0 spend |
| **Invented reviews / install counts** | Workspace rule |

---

## Decision for Conductor

Accept this file as the Admin aesthetic SoT for the next Desk publish. Do **not** implement `REVAMP_SPEC.md` “keep white KPI cards.” Site aesthetic is a sibling doc; Desk ships the Overview hero sentence above.
