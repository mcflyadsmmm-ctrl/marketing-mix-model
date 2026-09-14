# Mcfly desk IA skeleton (expanded)

**Status:** implementing — v4 skeleton shipping (section chrome + Days/Orders/Cohorts ledgers in nav).  
**Craft bar:** Black Clover smoothness = *how* pages are composed.  
**Base bar:** Port BC Overview + Spend + Allocation craft/math first (`docs/BC_BASE_PARITY.md`).  
**Ambition bar:** Then beat BC with Shopify-native ledgers (Days / Orders / Customers / Cohorts / Products).

---

## Sequence (locked)

1. **Black Clover base** — Overview home restored; Spend + Allocation craft.  
2. **Shopify depth desks** — Sales story + Days/Orders/Customers/Cohorts **tables**.  
3. **Products** — after line-item ingest.  
4. **Craft polish** — scorecard ≥ 4.0 on a desk that’s already deep.

---

## The real gap (honest)

| Layer | Reality today |
| --- | --- |
| **Shopify can give us** | Orders (totals, discounts, shipping, tax, refunds, timestamps), customers (opaque id + order count), line items (SKU, product, qty, price), refunds as events, shop currency/TZ, ShopifyQL Analytics day totals |
| **We already store** | `SalesDayFact` (total/net/gross, orders, new/returning/guest), `OrderFact` (per-order amount, discount/shipping/tax/units when ingested), `CohortFact` (30/90/365), goals, spend |
| **We mostly show** | A **flat chart grid** on Sales / Customers / Goals — few true **ledgers** (day board, goal board). Order-level and buyer-level **tables** are underused. Line-item / product depth is mostly empty shells (`needs: line_items`) |

So the problem isn’t “too many tabs.” It’s:

1. **Composition** — charts dumped in a grid (feels messy vs Black Clover)  
2. **Under-surfacing** — we calculate more than we put on a desk as **tables you can scan**  
3. **Under-ingest** — products/SKUs/discount codes need the next ingest lane

**Fix:** more tabs **and** more tables — each tab still follows decision → KPIs → **one hero ledger** → named sections.

---

## Expanded top nav (proposed)

| # | Tab | Route | Hero object | Job in one line |
| --- | --- | --- | --- | --- |
| 1 | **Today** | `/app` or `/app/today` | Today strip + yesterday | What’s live right now (thin — not a second dashboard) |
| 2 | **Sales** | `/app/sales` | Period pulse + charts | How the period moved (rhythm, mix, change) |
| 3 | **Days** | `/app/days` | **Day ledger table** | Every closed day as a row you can trust |
| 4 | **Orders** | `/app/orders` | **Order ledger table** | Every order in the period (economics, not CRM) |
| 5 | **Customers** | `/app/customers` | **Buyer ledger + concentration** | Who repeats, who carries revenue |
| 6 | **Cohorts** | `/app/cohorts` (promote LTV) | **Cohort table** | First-order months → LTV 30/90/365 |
| 7 | **Products** | `/app/products` | **SKU / product table** | What sold — **Phase B** (needs line-item ingest) |
| 8 | **Goals** | `/app/goals` | **Goal board table** | Pace vs plan |
| 9 | **Spend** | `/app/spend` | **Spend entry table** | MER against Shopify sales |
| 10 | **Settings** | `/app/settings` | Forms | Margin, sample, exports, billing |

**Subnav (not top):** Allocation, Advanced under Spend.

If 10 top tabs feels heavy in Admin, **group** as:

- **Shopify:** Today · Sales · Days · Orders · Customers · Cohorts · Products  
- **Plan:** Goals  
- **Money in:** Spend  
- **Settings**

Same surfaces — chrome can nest later. Skeleton lists the **desks**, not the final Polaris nav widget.

---

## Global chrome (every Shopify desk)

1. Period (shared)  
2. One honesty line (open day / holes / Admin mismatch / backfill)  
3. Decision strip (one takeaway)  
4. KPI rail (3–4)  
5. **Hero ledger or hero chart**  
6. Named sections  
7. More / export  

---

# TAB — Today (thin)

**Job:** Live pulse without replacing Sales.

| Block | Type |
| --- | --- |
| Shop-local date + time | chrome |
| Today sales / orders (live, labeled open) | KPI |
| Yesterday closed (fact) | KPI |
| MTD pace vs goal (if goal set) | KPI |
| Link: “Open day ledger” → Days | action |
| Link: “Period sales” → Sales | action |

No chart wall. Optional — can stay redirect to Sales until we build it.

---

# TAB — Sales (charts / story)

**Job:** Explain the period. **Not** the full day spreadsheet (that’s Days).

### First screen

| # | Block | Type |
| --- | --- | --- |
| 1 | Period + honesty | chrome |
| 2 | Decision | callout |
| 3 | KPI: Sales · Orders · AOV · vs prior | kpi_row |
| 4 | Hero: Weekday rhythm **or** New vs returning share | chart |
| 5 | Strongest / softest day | callout |

### Section A — Rhythm

- Weekday rhythm (bars)  
- Weekend vs weekday (share)  
- New vs returning sales (share)  

### Section B — What changed

- What changed (callout)  
- Pace vs prior  
- Volatility  

### Section C — Order shape (More)

- AOV distribution, gross/net/total, refund haircut, discount/shipping/tax, guest vs logged-in, hour-of-day, day-of-month, streaks, etc.

---

# TAB — Days (**new primary table desk**)

**Job:** The Shopify day ledger merchants wish Analytics exported cleanly.

### Hero: Day ledger (table)

One row per **closed** shop-local day:

| Column | Source |
| --- | --- |
| Day | `SalesDayFact.day` |
| Total sales | `sales` |
| Net sales | `netSales` |
| Gross sales | `grossSales` |
| Orders | `orderCount` |
| AOV | sales / orders |
| New buyers | `newCustomers` |
| Returning buyers | `returningCustomers` |
| New $ / Returning $ | net splits |
| Guest orders | `guestOrders` |
| Fact as-of | `asOf` |
| Source | crawl vs Analytics when flagged |

### Under the table

- Strongest / softest callout  
- Export CSV  
- Spot-check status (matched / mismatch / skipped)  

This is where Black Clover “desk” energy lives: **a serious table**, not another sparkline.

---

# TAB — Orders (**new — unlock OrderFact**)

**Job:** Scan every order’s economics (Level-1 — opaque customer key, no PII).

### Hero: Order ledger (table)

| Column | Source |
| --- | --- |
| Order id (opaque / last-4 or Shopify id) | `shopifyOrderId` |
| Shop-local day | `shopLocalDate` |
| Ordered at | `orderedAt` |
| Total | `amount` |
| Discount | `discountTotal` |
| Shipping | `shippingTotal` |
| Tax | `taxTotal` |
| Units | `unitCount` |
| Customer key | `customerKey` (guest vs returning derived) |
| New / returning / guest | derived from history |
| Currency | `currency` |

### Filters

- Day range (period)  
- Guest only / returning only  
- Discounted only  
- High AOV  

### Section under table

- Discount dependency KPIs  
- Shipping / tax shares  
- Same-day multi-order buyers  
- Link into Customers for a buyer key  

**This is the biggest “we’re scratching the surface” unlock we can ship without new Shopify scopes** — data is largely already in `OrderFact`.

---

# TAB — Customers

**Job:** Buyer-level truth + repeat health.

### First screen

| # | Block |
| --- | --- |
| Decision + KPI rail | Returning share · 2nd-order 90d · median days to 2nd · top-decile share |
| Hero: **Buyer ledger table** (period or lifetime) | See columns below |
| Sibling chart: concentration bars | |

### Hero: Buyer ledger (table)

| Column | Notes |
| --- | --- |
| Customer key (opaque) | Never email/name at Level 1 |
| First order day | |
| Last order day | |
| Order count | |
| Lifetime sales | |
| Period sales | |
| AOV | |
| Days to 2nd | if any |
| Segment | one-and-done / repeat / whale (rule-based) |

### Section A — Repeat health (charts)

- 2nd-order 30/60/90  
- One-and-done  
- First vs subsequent $  

### Section B — More

- RFM-lite, lapsing, reactivation, whale board (or whale board = sorted buyer table)

---

# TAB — Cohorts (promote from buried LTV)

**Job:** First-order month quality and payback shape.

### Hero: Cohort table

| Column | Source |
| --- | --- |
| Cohort month | `CohortFact` |
| New buyers | |
| Revenue @ 30 / 90 / 365 | |
| Orders @ horizons | |
| LTV per buyer | |
| vs prior cohort | |

### Charts under

- Cohort LTV bars 30/90/365  
- Repeat lag curve  
- Cohort quality rank  

Needs `read_all_orders` honesty when window is deep — same gates as today.

---

# TAB — Products (**Phase B — new ingest**)

**Job:** What merchandise moved. **Not fakeable from OrderFact alone.**

Requires persisting line items (product id, variant, title optional Level-1?, qty, line sales).

### Hero: Product / variant table

| Column | Notes |
| --- | --- |
| Product / variant | |
| Units | |
| Sales | |
| Orders containing | |
| Refund units | when we ingest refunds at line level |
| Attach rate | |

### Charts

- Top products bars  
- Basket pairs (later)  
- Discounted vs full-price mix |

Until ingest ships: tab shows honest empty state — “Product depth unlocks after line-item sync” — not pretend zeros.

---

# TAB — Goals

Unchanged ambition: pace strip + **monthly goal board table** + YoY presets. No chart dump.

---

# TAB — Spend

Unchanged: coverage honesty + **spend entry table** + one mix chart. Allocation / Advanced under subnav.

---

# TAB — Settings

Margin, sample desk, currency/TZ, exports (day ledger, order ledger, cohort CSV), billing, deep-history grant CTA.

---

## What we can calculate **now** vs **next**

### Phase A — surface what we already have (tables first)

1. **Days** tab — full `SalesDayFact` ledger  
2. **Orders** tab — full `OrderFact` ledger + filters  
3. **Customers** — buyer rollup table from `OrderFact`  
4. **Cohorts** — promote cohort table to top nav  
5. Recompose **Sales** as the story/chart tab (not the only home for day rows)

### Phase B — extend Shopify ingest

1. Line items → **Products** tab  
2. Refund line events → refund-day product honesty  
3. Discount codes / channel (`sourceName`) if Level-1 / allowed fields allow  
4. ShopifyQL day totals when `read_reports` + PCD L2 approved  

### Phase C — craft pass

Shared section chrome, Fraunces/KPI density, motion — **after** ledgers exist so polish isn’t painted on a thin desk.

---

## Black Clover rule still holds

More tabs ≠ more chaos.

- Each tab has **one hero table or chart**  
- Charts explain the table; they don’t replace it  
- “More” holds the long tail  
- No decorative card grids  

---

## Questions for Marty (please answer bluntly)

1. **Nav size:** OK with ~8–10 desks (Today → Settings), or prefer grouped Shopify submenu?  
2. **Split Sales vs Days?** (Recommended: Sales = story, Days = ledger.)  
3. **Orders tab in Phase A?** (Recommended: yes — biggest unlock from data we already store.)  
4. **Products:** wait for line-item ingest, or hide tab until ready?  
5. **Today tab:** build thin pulse, or keep `/app` → Sales redirect?  
6. Any table columns you care about most on **Days** and **Orders**?

Once you mark those, we lock this file and implement **Days + Orders ledgers** before another chart-grid polish pass.


## Ship notes (2026-09-14)

- Top nav: Overview · Sales · Days · Orders · Customers · Cohorts · Goals · Upload Spend · Allocation · Settings.
- Sales/Customers use `DepthSectionedGrid` (named sections, not flat chart dump).
- Days/Orders/Cohorts are table-first ledgers from existing facts.
- Upload Spend remains entry-only; Allocation stays its own tab.
