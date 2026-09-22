# Third desk truth — leftover uniqueness lies still on live v36

**Lane:** Hostile Shopify-native product audit. Research docs only.  
**Probed:** 2026-09-22 · apex `https://mcflyads.com` (not `*.pages.dev`) · `<meta name="mcfly-version" content="v36">` · Pages Direct Upload **8ddad52e** (board) · Fly **439** not driven.  
**Branch:** `cursor/third-desk-truth-research-61f8` · parent cook target **PR #191** `cursor/site-world-class-5bc6`.  
**Do not:** merge · Pages/Fly deploy · Partner Submit · invent Polar $1,020 / reviews / installs · execute ShopifyQL-wait · edit `LIVE_UNPAID_INGEST_DAYS` · edit Live `fly.toml` flags · change Home H1.

**Home H1 (locked, live):** `Deeper Shopify numbers Analytics does not show.`

**SAMPLE lock (live /):** Snowdevil **$19,023** / **$68,457** / **3.60×**. No Harbor / Northline $98,500 / 4.19× on `/`.

---

## Job

Find what live mcflyads.com **still claims as Mcfly uniqueness** that Shopify Analytics, Reports, ShopifyQL, Sidekick, or CSV export **already ships in 2026**. Rank leftover **P0s** the parent can cook into HTML. Do not rediscover already-admitted items as P0 **unless the live page still lies**.

---

## Already admitted (do not rediscover — unless live still sells them as uniqueness)

| Admitted | Live v36 status |
| --- | --- |
| Overview can compare this range to last year / previous period | **Named** on `/` `/product`. Still sold as leftover via “month, quarter, and year **on one board**.” → leftover P0-4. |
| AOV is mean; returning rate is headcount | **Named** on `/` FAQ + `/faq`. |
| Reports Group by hour / day of week | **Day of week named.** Hour not claimed as uniqueness on marketing spine. Weekend **% of this window** still in uniqueness FAQ → leftover P0-7. |
| 2026 Basic includes reports | Not contradicted. Custom explorations on **all plans**. |
| ShopifyQL `COMPARE TO previous_year` and returning sales $ (`total_sales_returning`) | Returning $ **named** as ShopifyQL. Still **listed first** in “what Analytics does not show.” → leftover P0-1 / P0-6. |
| Customer cohort analysis on Shopify plan+ | **Not named on live.** LTV 30/90/365 still uniqueness → leftover P0-5. |
| CSV export exists in Admin | `/faq`: “Shopify Admin can export Orders CSV; we don’t make you.” Honest. |
| Grow+ staff can be Dashboards/Reports only (not all-or-nothing Admin); Basic has no extra staff seats | Live still: “Shopify staff with Analytics see **every report, not one card**.” → leftover P0-3. |
| Native Overview can set start and end times | `/demo` names it. Honest. |
| Median ticket is the leftover **METRIC** (no native `median_order_value`). Weekend mix / returning $ as packaging are weaker claims | Median still true. Packaging still sold as uniqueness. |

---

## Verdict

v36 stopped the old Overview-compare / mean-AOV / weekday-Group-by / ShopifyQL-returning-$ **omissions**. It did **not** stop listing those native numbers inside “what Analytics does not show,” and it never named **2026 metric targets**, **Dashboards-only staff**, **ShopifyQL since-first-purchase dimensions**, or **pin-a-custom-exploration-to-Overview**.

**True leftover metric:** median ticket. ShopifyQL `sales` schema has `average_order_value` only. No `median_order_value`. Community median thread still unanswered as a native metric.

**Everything else in the uniqueness FAQ is native, CSV, Sidekick, or weaker packaging.**

---

## Ranked leftover P0s (cook these)

### P0-1 — Uniqueness FAQ still lists native numbers as “Analytics does not show”

**Live URLs + quotes**

- `https://mcflyads.com/faq` Q2 **What does Mcfly show that Analytics does not?**  
  > Typical order, **returning dollars, weekend mix, days-to-second, and LTV 30/90/365** from orders you already have. Overview’s AOV is the average; Overview’s returning number is a headcount rate. Shopify Reports can Group by day of week. ShopifyQL can show returning sales $. Repeat Customer Insights from $59 is the closer LTV and purchase-latency app.
- `https://mcflyads.com/` FAQ **What does this show that Shopify Analytics Overview does not?**  
  > Typical order (median, not AOV). Overview’s returning number is a headcount rate; ShopifyQL can show returning sales $. **Weekend mix as a % of this window — Reports can already Group by day of week. Days-to-second. LTV 30/90/365** from orders you already have. Overview can already compare one range to last year — Mcfly keeps month, quarter, and year on one board.

The question is uniqueness. Four of the five bullets are native (or native + 10-second math). The parenthetical admissions do not save a title that still names them as the gap.

**Native counters (fetched 2026-09-22)**

| Claim in the Q | Native 2026 |
| --- | --- |
| Returning dollars | ShopifyQL `total_sales_returning` / `total_sales_first_time`; `GROUP BY new_or_returning_customer`. [sales schema](https://shopify.dev/docs/api/shopifyql/latest/schemas/sales_revenue/sales). Custom exploration on **all plans** → pin card on Overview ([create explorations](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/custom-reports/create-custom-explorations); [customize Overview](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/overview-dashboard/customizing-overview-dashboard)). Sidekick writes the query. |
| Weekend mix % | Sales reports **Group by `day of week`**. [Sales reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report). ShopifyQL `GROUP BY day_of_week` / `TIMESERIES day_of_week`. Sat+Sun ÷ total is arithmetic, not a product. |
| LTV 30/90/365 | Customer cohort analysis: **amount spent per customer** by week/month/quarter after first order. [Customers reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports). ShopifyQL `weeks_since_first_purchase`, `months_since_first_purchase`, `amount_spent_per_customer`, `customer_cohort_month`. |
| Days-to-second | Not median first→second. Native **does** ship **average days since last order** (RFM report + ShopifyQL `days_since_last_order` on [customers schema](https://shopify.dev/docs/api/shopifyql/latest/schemas/customers/customers)). Cohort cells = repurchase in period N. RCI still closer for latency — already named. |
| Typical order / median | **Keep.** Mean AOV only. |

**Smallest HTML cook**

Rewrite both uniqueness answers to **one leftover metric + named native list**. Do not lead with returning $ / weekend / LTV.

```html
<p>Typical order — the median ticket. Shopify AOV is the mean; ShopifyQL has <code>average_order_value</code>, not median. Native already: Overview compare this range to last year; Reports Group by hour / day of week; ShopifyQL <code>total_sales_returning</code>; Customer cohort analysis (Shopify plan+) and <code>weeks_since_first_purchase</code>; metric targets for a monthly sales plan. Repeat Customer Insights from $59 is the closer LTV / latency / RFM app. Weekend mix and returning $ are packaging next to the median, not a native hole. Empty spend paints —.</p>
```

Do **not** change the locked H1. Change the FAQ that claims to explain it.

Also patch JSON-LD on `/faq` (`What does Mcfly show that Analytics does not?`) to the same sentence.

---

### P0-2 — Goals sold as a Mcfly “monthly sales plan” Analytics lacks

**Live URLs + quotes**

- `https://mcflyads.com/`  
  > **Goals next to the calendar.** **Monthly sales plan from Shopify orders.** Spend is optional — last chapter, not the greeting.
- `https://mcflyads.com/pricing`  
  > **Goals is the monthly sales plan from Shopify orders** — spend optional.
- `https://mcflyads.com/product` tab 5 / history table: Goals = sales vs the calendar.
- `https://mcflyads.com/about`  
  > Goals — Monthly sales plan from Shopify orders. Optional Total ROAS versus break-even when spend exists.

Live never says “Analytics has no sales goal.” It sells Goals as a Mcfly chapter whose job is the monthly Shopify sales plan. Native shipped that in Analytics.

**Native counters**

- Help: [Setting targets for metrics in your Shopify reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/overview-dashboard/targets). Metric + amount + **week / month / quarter / year / custom**. Gauge on Overview. **Target cards keep their own time period** (exempt from dashboard date range). Changelog [2026-04-27](https://changelog.shopify.com/posts/set-and-track-targets-in-shopify-analytics). Spring 2026 context: [Shopify blog](https://www.shopify.com/blog/analytics-spring-2026).
- ShopifyQL `COMPARE TO TARGETS` on the sales schema.

**Smallest HTML cook**

Name native targets. Keep Mcfly Goals as **optional spend / break-even vs the calendar**, not the sales plan hole.

Home Goals lede:

```html
<p>Native Analytics already pins monthly / quarterly / yearly sales <strong>targets</strong> on Overview. Mcfly Goals is the same calendar next to optional Total ROAS vs break-even when you typed spend — not a second sales-plan product.</p>
```

Pricing chapter-two line: replace “Goals is the monthly sales plan from Shopify orders” → “Native metric targets already are the monthly sales plan. Mcfly Goals adds optional Total ROAS vs break-even.”

---

### P0-3 — Staff uniqueness still false: “every report, not one card”

**Live URLs + quotes**

- `https://mcflyads.com/` FAQ **Can finance or an agency see this without a staff seat?**  
  > You copy or Save PNG. Mcfly never posts to Slack, never sends mail, and does not write to a project board. **Shopify staff with Analytics see every report, not one card.** Polar and Lifetimely send Slack or mail; we do not.
- `https://mcflyads.com/faq` same claim:  
  > You copy or Save PNG. Mcfly does not email or Slack. **Shopify staff with Analytics see every report, not one card.**

Admitted lock: Grow+ staff can be **Dashboards / Reports only**, not all-or-nothing Admin. Live still lies.

**Native counters**

- [Store permissions](https://help.shopify.com/en/manual/your-account/users/roles/permissions/store-permissions): **Dashboards** = Overview + Live view (sales on those pages). **Reports** = view and create reports; **“You can't specify which reports users can access.”**
- Dashboards-only staff do **not** see every report. They see the customized Overview (metric cards + **target cards** + custom-report cards).
- [User limits](https://help.shopify.com/en/manual/your-account/users/users-plan-requirements): **Basic = 0 extra staff seats.** Grow = 5.
- PNG/print: [Exporting reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/custom-reports/export-reports) (CSV/XML/JSONL/Parquet + print-to-PDF). Sidekick can export CSV.

The honest leftover vs native is **no auto Slack/mail** and **copy without a staff login**. Not “native cannot share one card.”

**Smallest HTML cook**

```html
<p>You copy or Save PNG. Mcfly never posts to Slack or mail. Grow+ staff can be Dashboards only (Overview + Live view), not full Admin. Reports permission is every report, not one report. Basic has no extra staff seats.</p>
```

Same on `/faq`.

---

### P0-4 — “Month, quarter, and year on one board” sold as the leftover Overview uniqueness

**Live URLs + quotes**

- `https://mcflyads.com/` under H1 cards:  
  > Shopify Overview can compare this range to last year. **Mcfly keeps this month, this quarter, and this year on one board — last year on the card.**
- Same page lede + roundup + uniqueness FAQ: “month, quarter, and year on one board.”
- `https://mcflyads.com/product` Overview step:  
  > This month, this quarter, and this year vs last year — KPI cards, a sales chart, and the YoY year board. Shopify Overview can compare this range to last year. **This tab keeps month, quarter, and year on one board.**

**Native counters**

- Overview date menu: presets include **period-to-date, quarterly periods**, custom start **and end times**, compare **Previous year / Previous period / Custom**. [Using the Analytics overview dashboard](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/overview-dashboard/using-the-overview-dashboard).
- Regular metric cards share one dashboard range (switching MTD → QTD → YTD is two clicks + Previous year). That is not a missing metric.
- **Target cards are exempt** from dashboard date range and already sit on one Overview with **month + quarter + year** periods. [Targets](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/overview-dashboard/targets).
- ShopifyQL `DURING this_month` / `this_quarter` / `this_year` `COMPARE TO previous_year`. [COMPARE TO](https://shopify.dev/docs/api/shopifyql/latest/syntax/compare-to).
- Custom reports pin to Overview as metric cards. [Customize Overview](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/overview-dashboard/customizing-overview-dashboard).

Simultaneous **three YoY sales deltas** without switching is packaging. After v36 named Overview compare, selling “one board” as the remaining uniqueness is the leftover lie.

**Smallest HTML cook**

Keep the three SAMPLE YoY cards (craft). Change the sentence that claims native cannot:

```html
<p>Shopify Overview compares one range to last year (Month to date, quarter, year, custom start/end). Metric <strong>targets</strong> for this month, this quarter, and this year already sit on that same Overview. Mcfly paints three YoY sales cards without switching — packaging, not a missing native metric.</p>
```

Roundup “What you get” cell: drop “month / quarter / year on one board” as the Mcfly differentiator. Leave **median ticket** + optional spend.

---

### P0-5 — LTV 30/90/365 still uniqueness; native cohort + ShopifyQL since-first-purchase never named

**Live URLs + quotes**

- `/faq` Q2 and `/` uniqueness FAQ: **LTV 30/90/365 from orders you already have** (listed as what Analytics does not show).
- `https://mcflyads.com/product` Customers: **LTV 30 / 90 / 365**.
- `https://mcflyads.com/pricing` in-the-fee: **LTV 30/90/365**.
- `https://mcflyads.com/about` Customers: **Returning dollars, LTV 30/90/365, days-to-second.**
- Home Customers tile: “Returning dollars and 90-day LTV. Days-to-second is on this board, **not a separate LTV app.**”

RCI-from-$59 is named. Native cohort / ShopifyQL LTV path is not.

**Native counters**

- [Customer cohort analysis](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports): heatmap + **amount spent per customer** over weeks/months/quarters after first order; cell detail includes total sales, AOV, amount spent per customer. Admitted lock: **Shopify plan+** for that default report. Projections: Advanced+ / 24 months ([changelog 2024-01-31](https://changelog.shopify.com/posts/new-predictive-spend-metrics-in-cohort-analysis)).
- 2026 Basic already has reports + **custom explorations** ([Basic plan](https://help.shopify.com/en/manual/intro-to-shopify/pricing-plans/plans-features/basic-shopify-plan); [create explorations](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/custom-reports/create-custom-explorations)).
- ShopifyQL sales dimensions: `weeks_since_first_purchase`, `months_since_first_purchase`, `quarters_since_first_purchase`, `customer_cohort_month`, metric `amount_spent_per_customer`. [sales schema](https://shopify.dev/docs/api/shopifyql/latest/schemas/sales_revenue/sales).
- ShopifyQL customers: `total_amount_spent` (lifetime). [customers schema](https://shopify.dev/docs/api/shopifyql/latest/schemas/customers/customers).
- Sidekick on customer reports (Help: RFM / predicted spend; not cohort projections).

Mcfly 90-day is an **observed-order average on this board**, not a native hole. Predicted cohort spend is native on Advanced+. RCI remains the closer LTV/latency/RFM **app**.

**Smallest HTML cook**

Uniqueness FAQ: delete “LTV 30/90/365” from the does-not-show list (covered by P0-1).  
Product / pricing / about: one clause —

```html
<p>Shopify plan+ already has Customer cohort analysis (amount spent per customer by week/month after first order). ShopifyQL can group <code>weeks_since_first_purchase</code>. Mcfly 30/90/365 is observed orders on this desk, not that report. Repeat Customer Insights from $59 is the closer LTV / RFM app.</p>
```

---

### P0-6 — Returning dollars still the roundup / hero uniqueness after ShopifyQL admission

**Live URLs + quotes**

- `/` kicker: **Typical order · returning dollars · spend optional**
- `/` roundup: “Mcfly is the $39 install when you want the **median ticket, returning dollars**, and month / quarter / year on one board”
- `/` comparison **What you get:** “Median ticket, **returning dollars**, month / quarter / year on one board.”
- `/product` H1: **Median ticket. Returning dollars. One board.** (H1 lock is **home** only; product H1 may move.)
- Meta description `/`: “Returning dollars, not the returning-customer rate.”

v36 correctly names ShopifyQL returning sales $ **in body copy**, then keeps returning $ as the install reason.

**Native counters**

- `SHOW total_sales_returning` / `total_sales_first_time` ([sales schema](https://shopify.dev/docs/api/shopifyql/latest/schemas/sales_revenue/sales)).
- New vs returning customers report (headcount) + exploration adding **total sales** + dimension **New or returning customer** ([analytics fields](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/analytics-fields)).
- Pin the saved exploration on Overview. Sidekick: “show returning sales this month.”

**Smallest HTML cook**

Keep returning $ on the SAMPLE desk (the number is real). Stop selling it as the native hole.

Roundup lede:

```html
<p>ShopifyQL already shows returning sales $ (<code>total_sales_returning</code>). Overview’s rate is still headcount. Mcfly is the $39 install for the <strong>median ticket</strong> on the same board as that mix — not because native cannot total returning dollars.</p>
```

Product H1 (not locked): `Median ticket. One board.` Sub: returning $ is ShopifyQL; we sit it next to typical order.

---

### P0-7 — Weekend mix % still uniqueness after Group-by admission

**Live URLs + quotes**

- `/` uniqueness FAQ: “**Weekend mix as a % of this window** — Reports can already Group by day of week.”
- `/` Orders tile: “Typical ticket (median) on this tab. **Weekend mix as % of this window.**”
- `/product` Orders: “Weekend mix as a % of this window on this tab — Shopify Reports can already Group by day of week.”
- `/pricing` proof: “Median ticket, returning dollars, **weekend mix as % of this window**, LTV — on one desk. Reports can Group by weekday.”
- `/about` Orders: same Group-by admission + mix as the Orders job.

This is the admitted **weaker packaging** claim still living inside the uniqueness question.

**Native counters**

- [Sales reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report): Group by **hour of day / day of week** on Total sales over time and AOV over time.
- ShopifyQL `day_of_week`, `hour_of_day` ([TIMESERIES](https://shopify.dev/docs/api/shopifyql/latest/syntax/timeseries); Help [ShopifyQL syntax](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/shopifyql-editor/shopifyql-syntax)).
- Export that report ([export](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/custom-reports/export-reports)) and sum Sat+Sun.

**Smallest HTML cook**

Covered by P0-1 FAQ rewrite. Orders one-liner:

```html
<p>Typical ticket (median) on this tab. Weekend mix is a % of this window — Reports already Group by day of week; this is the Sat+Sun rollup next to the median, not a missing report.</p>
```

---

### P0-8 — Days-to-second listed as Analytics-does-not-show (native repurchase clocks exist; median first→second does not)

**Live URLs + quotes**

- `/faq` Q2 list includes **days-to-second** as what Analytics does not show.
- `/` Customers: “**Days-to-second is on this board, not a separate LTV app.**”
- `/product` Customers: “Days-to-second is the median first→second gap on this board — Repeat Customer Insights from $59 is the closer purchase-latency / RFM app.”

RCI admission is good. “Analytics does not show” is not.

**Native counters**

- RFM customer analysis: **Average days since last order** per RFM group. [Customers reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports).
- ShopifyQL `FROM customers SHOW days_since_last_order`. [customers schema](https://shopify.dev/docs/api/shopifyql/latest/schemas/customers/customers).
- Cohort analysis: repurchase in month/week N after first order (not a median gap).
- **No** native Overview card for **median first→second interval**. That is a thinner leftover than median ticket, thicker than weekend %.

**Smallest HTML cook**

Drop days-to-second from the uniqueness FAQ list (P0-1). Product/Customers:

```html
<p>Median first→second gap is on this board. Native RFM already shows average days since last order. Repeat Customer Insights from $59 is the closer purchase-latency / RFM app.</p>
```

---

## Already honest on live v36 (do not recook as P0)

| Surface | Why it is not leftover uniqueness |
| --- | --- |
| `/demo` same-clock | “Native Overview can set start and end times.” |
| `/faq` CSV | “Shopify Admin can export Orders CSV; we don’t make you.” |
| Mean AOV vs median | Named on `/faq` “Is typical order the same as Shopify AOV?” |
| Overview compare this range | Named on `/` and `/product` |
| ShopifyQL returning sales $ | Named (but still listed as uniqueness — that listing is P0-1/6) |
| RCI from $59 closer LTV/latency | Named |
| Empty spend = — / Total ROAS = sales ÷ entered spend | Religion, not a native Analytics clone |
| No pixel / no MTA / no COGS hero | Honest refuse |
| Reviews 0 / Polar from $750 not $1,020 | Honest |
| SAMPLE Snowdevil $19,023 / $68,457 / 3.60× | Lock held |
| Home H1 exact string | Lock held |

---

## Keep as uniqueness (do not cook away)

1. **Median ticket** — Shopify Help AOV = `(gross sales − discounts) / orders` (mean). ShopifyQL `average_order_value` same formula. **No `median_order_value`.** Community: [How can we calculate median order value in Shopify analytics?](https://community.shopify.com/t/how-can-we-calculate-median-order-value-in-shopify-analytics/254046).
2. **Optional typed spend → Total ROAS = Shopify Total Sales ÷ entered spend; empty = —.** Native Analytics is not an all-platform spend desk. Refuse pixels / MTA / true ROAS / COGS-P&L hero.
3. **Copy / Save PNG without Slack or mail.** Native does not auto-post; Polar/Lifetimely do. Do not claim native cannot share a card (P0-3).

---

## Sidekick / CSV (P1, not P0 unless uniqueness FAQ stays)

Live does not name Sidekick. Native:

- Sales reports Help: ask Sidekick why sales dropped, break down by channel/product.
- Custom exploration: “What do you want to explore?” → Sidekick writes ShopifyQL ([create explorations](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/custom-reports/create-custom-explorations)).
- Sidekick exports CSV/XML/JSONL/Parquet ([export reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/custom-reports/export-reports)).

If parent wants a one-line harvest: uniqueness FAQ may add “Sidekick can write the ShopifyQL for returning sales $ and weekday mix.” Optional. Do not build a Sidekick clone.

---

## Cook map for PR #191 (smallest files)

| Rank | File | Change |
| ---: | --- | --- |
| P0-1 | `site/faq.html` uniqueness Q + JSON-LD | Median leftover; name native list; drop returning/weekend/LTV/days-to-second as the gap |
| P0-1 | `site/index.html` `#faq-home` uniqueness `<details>` | Same |
| P0-2 | `site/index.html` Goals band; `site/pricing.html` chapter two; `site/about.html` Goals; `site/product.html` Goals row | Native metric targets named |
| P0-3 | `site/index.html` + `site/faq.html` staff Q | Dashboards vs Reports; Basic 0 seats |
| P0-4 | `site/index.html` YoY lede + roundup “what you get”; `site/product.html` Overview step | Packaging, not missing compare |
| P0-5 | `site/product.html` Customers; `site/pricing.html` in-the-fee; `site/about.html` Customers | Name cohort + `weeks_since_first_purchase` |
| P0-6 | `site/index.html` roundup lede; optional `site/product.html` H1 | Returning $ = ShopifyQL; leftover = median |
| P0-7 | Orders one-liners `/` `/product` `/pricing` `/about` | Sat+Sun rollup next to median |
| P0-8 | Customers one-liners | RFM days-since-last vs median first→second |

**Do not:** touch Home H1 · SAMPLE dollars · $39/7-day · Polar $1,020 · review counts · Spend religion · Fly Live flags.

---

## Sources fetched (2026-09-22)

**Live apex (HTTP 200, `mcfly-version` v36):** `/` `/product` `/faq` `/pricing` `/demo` `/about`

**Shopify Help**

- https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/overview-dashboard/using-the-overview-dashboard
- https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/overview-dashboard/customizing-overview-dashboard
- https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/overview-dashboard/targets
- https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report
- https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports
- https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/custom-reports/create-custom-explorations
- https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/custom-reports/export-reports
- https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/shopifyql-editor/shopifyql-syntax
- https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/analytics-fields
- https://help.shopify.com/en/manual/your-account/users/roles/permissions/store-permissions
- https://help.shopify.com/en/manual/your-account/users/users-plan-requirements
- https://help.shopify.com/en/manual/intro-to-shopify/pricing-plans/plans-features/basic-shopify-plan

**ShopifyQL / changelog / blog**

- https://shopify.dev/docs/api/shopifyql/latest/schemas/sales_revenue/sales
- https://shopify.dev/docs/api/shopifyql/latest/schemas/customers/customers
- https://shopify.dev/docs/api/shopifyql/latest/syntax/compare-to
- https://shopify.dev/docs/api/shopifyql/latest/syntax/timeseries
- https://changelog.shopify.com/posts/set-and-track-targets-in-shopify-analytics
- https://www.shopify.com/blog/analytics-spring-2026

**Not found in ShopifyQL sales metrics (2026-07/latest dump):** `median`, `median_order_value`.

---

## What this lane did not do

No HTML cook on this branch. No merge. No Pages/Fly deploy. No Partner Submit. Parent harvests into PR #191.
