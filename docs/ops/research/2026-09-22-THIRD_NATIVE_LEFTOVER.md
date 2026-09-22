# v38 native-Analytics leftover hunt (harsher pass)

**Lane:** Research only. Do not cook live HTML. Do not merge. Do not deploy Pages or Fly. Do not execute ShopifyQL-wait. Do not unpark Live. Do not change the locked home H1.

**Probed:** 2026-09-22T22:32–22:36Z. Live HTML, not git notes.

| Origin | Stamp |
| --- | --- |
| Apex | https://mcflyads.com · `mcfly-version` **v38** · `mcfly-build` `craft-steal-v38` · Pages **dfb9f017** (journal `STATUS_20260922_site_v38_shipped.md`) |
| Fly wrap | https://mcfly-analytics.fly.dev `/` · same v38 HTML (32272 bytes, same H1) · Fly **441** |
| Pages crawled | `/` `/product` `/faq` `/pricing` `/about` `/demo` `/support` `/terms` `/privacy` · `assets/mcfly/chrome.js` · `/llms.txt` · `/llms-full.txt` |

**v38 already cooked (keep):** uniqueness FAQ + home details answer now say “Typical order is the leftover” and name ShopifyQL returning sales $, Reports Group-by weekday, native RFM days since last order, customer cohort reports, Overview monthly targets, Grow+ Dashboards vs Reports. Product H1 is **“Median ticket. Not Shopify AOV.”** Below-fold home body is mostly honest. This hunt is the surfaces that still *fill* the locked slogan with native-already-ships metrics.

**Keep as uniqueness (still true in 2026 Help / ShopifyQL):**

1. **Median ticket.** ShopifyQL `sales` ships `average_order_value` as a **mean** (`Average order value = (gross sales - discounts) / orders`). Schema has **no** `median_order_value`. Analytics fields “median” rows are fulfillment timing (median days order→ship), not ticket. Community MOV thread remains the gap.
2. **Optional spend Total ROAS** = Shopify Total Sales ÷ typed spend; empty = —. Not platform ROAS.
3. **Copy / Save PNG without a Slack bot.** Polar-class digest auto-send is not Mcfly.

**Do not recook:** locked home H1 `Deeper Shopify numbers Analytics does not show.` · SAMPLE `$19,023` / `$68,457` / `3.60×` · Polar `$750` / refuse `$1,020` · empty spend `—` · reviews **0** · `$39` / 7-day.

**Method:** `curl` live HTML. Shopify Help + ShopifyQL schema fetched 2026-09-22. Rank = still *sells* as “Analytics does not show” after v38 FAQ cook, weighted by SERP / first viewport / every-page chrome.

---

## Native already ships (so leftover uniqueness is a lie)

| Claim still sold as a hole | Native 2026 surface | Citation |
| --- | --- | --- |
| Returning **dollars** (vs Overview rate) | ShopifyQL `total_sales_returning` / `total_sales_first_time`; `GROUP BY new_or_returning_customer`; `FROM sales SHOW total_sales …` | [sales schema](https://shopify.dev/docs/api/shopifyql/latest/schemas/sales_revenue/sales) |
| Returning-customer **rate** (headcount) | Overview / fields: `returning customers / customers` | [Analytics fields](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/analytics-fields) |
| Weekend / weekday mix | Sales + AOV-over-time **Group by** `day of week` (and `hour of day`); ShopifyQL `GROUP BY day_of_week` | [Sales reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report) · [GROUP BY](https://shopify.dev/docs/api/shopifyql/latest/syntax/group-by) |
| Days since last order / recency | RFM table default **Average days since last order**; ShopifyQL `days_since_last_order` | [Customers reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports) · [customers schema](https://shopify.dev/docs/api/shopifyql/latest/schemas/customers/customers) |
| LTV / cohorts | **Customer cohort analysis** (amount spent per customer, retention, net/gross sales, projections); predicted spend tier | same Customers reports Help |
| YoY / this range vs last year | Overview + Reports **Compare to** previous year | [Time ranges](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/using-reports/time-ranges) |
| Monthly sales plan / targets | **Create target** (default period = current month) + **Add to dashboard** gauge on Analytics overview | [Metric targets](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/overview-dashboard/targets) |
| Staff share without full Admin | Grow+ **Dashboards** = Overview + Live view; **Reports** = every report, not one report; Basic = 0 staff seats | [Store permissions](https://help.shopify.com/en/manual/your-account/users/roles/permissions/store-permissions) |
| “Ask Analytics in English” | Sidekick on sales reports + customer reports (RFM, new vs returning). Not a Mcfly hole. | Sales reports Help; Customers reports Help Sidekick callout |
| Mean AOV | `average_order_value` — keep contrasting **median**, not “AOV missing” | sales schema |

ShopifyQL sales schema fetched 2026-09-22: **0** hits for `median` / `median_order_value`. Keep median.

---

## Ranked P0s (cook one-liners for parent harvest)

### P0-1 — Home meta / OG / Twitter still sell returning $ and weekends as the Analytics gap

**Why P0:** Crawlers and shares never see the cooked FAQ. They see the locked slogan *filled with native metrics*.

Live `/` quotes:

> `<meta name="description" content="Deeper Shopify numbers Analytics does not show. Typical order is the median, not AOV. Returning dollars, not the returning-customer rate. Spend optional. Total ROAS = Shopify sales ÷ entered spend; empty = —. 7-day trial, then $39/store/mo." />`

> `<meta property="og:description" content="Deeper Shopify numbers Analytics does not show. Typical order, returning dollars, weekends — spend optional. 7-day trial, then $39/store/mo." />`

> `<meta name="twitter:description" content="Deeper Shopify numbers Analytics does not show. Typical order, returning dollars — spend optional. 7-day trial, then $39/store/mo." />`

**Native:** Overview rate is headcount (`returning customers / customers`). Returning **sales $** is ShopifyQL `total_sales_returning` and `GROUP BY new_or_returning_customer`. Weekends are Reports Group by `day of week`.

**Cook one-liner:** Keep locked H1. Rewrite the three descriptions to leftover median + optional Total ROAS / empty —. Drop “returning dollars, not the returning-customer rate” and drop weekends from the uniqueness fill.

---

### P0-2 — Home hero kicker + lede still triad uniqueness under the locked H1

First viewport (locked H1 stays):

> `<p class="kicker">Typical order · returning dollars · spend optional</p>`

> `<h1 … id="hero-h">Deeper Shopify numbers Analytics does not show.</h1>`  ← **locked, do not cook**

> `<p class="lede lede--tight">Median ticket, returning dollars, weekends — from orders you already have. Spend optional. No pixel.</p>`

Hero glance still equal-weights a native weekday rollup:

> `<span class="dd-kpi__label">Weekend mix</span>` / `$` `23%` / `Of this window`

Below-fold is already honest (“Typical order is the leftover median. Returning dollars sit next to ShopifyQL returning sales $.”). The billboard still teaches the old triad.

**Cook one-liner:** Kicker → `Median ticket · spend optional`. Lede → leftover median; name native weekday grouping + ShopifyQL returning sales $ as packaging. Weekend KPI sublabel → `Sat+Sun of Reports Group-by weekday`, not a third uniqueness card.

---

### P0-3 — FAQ lede, meta, Twitter, and close CTA still run the uniqueness slogan + weekends/LTV bundle

Live `/faq` (`mcfly-version` v38):

> `<meta name="description" content="Deeper Shopify numbers Analytics does not show. Typical order, returning dollars, weekends, LTV. …">`

> `<meta name="twitter:description" content="Deeper Shopify numbers Analytics does not show. Typical order, returning dollars, LTV. …">`

> `<p>Deeper Shopify numbers Analytics does not show. Typical order, returning dollars, weekends, LTV — spend is optional. …</p>`

> `<p class="lede-soft">Same Shopify numbers Analytics does not show. Full Snowdevil SAMPLE on /demo …</p>`

JSON-LD uniqueness **question title** still frames a hole (answer body was cooked — keep the answer):

> `"name": "What does Mcfly show that Analytics does not?"`

OG description still: “Typical order, returning dollars, weekends, LTV — spend optional.”

**Cook one-liner:** FAQ lede/meta/twitter/close → leftover is median; returning $/weekday/LTV named as native. Optionally retitle the Q to “What is still leftover vs native Analytics?” Keep the cooked answer text. Close CTA must not say “Same Shopify numbers Analytics does not show.”

---

### P0-4 — About H1 is an unlocked copy of the locked home slogan, then a uniqueness bundle lede

`/about` H1 is **not** in the home-H1 lock.

> `<h1 … id="about-h">Deeper Shopify numbers Analytics does not show.</h1>`

> `Mcfly Ads builds Mcfly Analytics — typical order, returning dollars, weekends, days to second, LTV from the orders you already have.`

Days-to-second ≠ RFM recency, but native already ships **Average days since last order** and ShopifyQL `days_since_last_order`. LTV is native **Customer cohort analysis**. Selling the bundle as the About headline is leftover.

Desk cards under About already name Group-by weekday, ShopifyQL returning sales $, native RFM, Overview targets. Headline undoes them.

**Cook one-liner:** About H1 → match product leftover (`Median ticket. Not Shopify AOV.`). Lede drops weekends / days-to-second / LTV as the uniqueness list.

---

### P0-5 — Footer chrome.js uniqueness slogan on every page

Live `https://mcflyads.com/assets/mcfly/chrome.js`:

> `© Mcfly Ads. Mcfly Analytics — deeper Shopify numbers Analytics does not show. 7-day trial, then $39/store/mo.`

Injected on `/pricing` `/product` `/faq` `/about` `/demo` `/support` after the v38 FAQ cook. Every page re-sells the hole.

**Cook one-liner:** Footer → leftover median (Analytics still has no median ticket) + `$39` after 7-day. Do not change home H1.

---

### P0-6 — Product table + product meta still sell returning $ vs rate and LTV vs cohorts as the “what it is not”

Product H1 is already leftover-correct. The table and meta are not.

Live `/product` meta:

> `Overview, Orders, and Customers first — typical order, returning dollars, weekends, days to second, LTV.`

Table:

> Returning dollars · `$45,409 · 66% of this window` · **Not the returning-customer rate**

> 90-day LTV · `$890 observed orders` · **Not a predicted cohort model**

Customers-tab body already says ShopifyQL returning sales $, native RFM, “Mcfly LTV 30/90/365 is observed orders, **not a native hole**.” The table still teaches Overview-rate and “cohorts are ours.”

Native: Help Customer cohort analysis metrics include amount spent per customer, retention, net/gross sales, **and projections**. RFM lists average days since last order. ShopifyQL `total_sales_returning`.

**Cook one-liner:** Returning row → “Sits next to ShopifyQL `total_sales_returning` — not a missing report.” LTV row → “Observed 30/90/365 on this desk, next to native Customer cohort analysis.” Meta → median leftover, not the weekends/LTV list.

---

### P0-7 — Pricing “in the fee” / chapter one still lists weekends, LTV, days-to-second as the $0-spend product

Live `/pricing`:

> In the fee: `Typical order, returning dollars, weekends, LTV 30/90/365`

> Chapter one: `Typical order, returning dollars, weekends, LTV 30/90/365, days-to-second.`

Pricing already names Reports Group-by weekday, RCI from $59, and Overview monthly targets on Goals. The fee list still sells native metrics as what you pay $39 for.

**Cook one-liner:** In the fee / chapter one → leftover median ticket; native returning sales $ and weekday grouping named as packaging; optional Total ROAS; copy/PNG. Do not list weekends/LTV/days-to-second as the hole you buy.

---

### P0-8 — `/llms.txt` and `/llms-full.txt` still teach crawlers the uniqueness slogan + returning $ vs rate

Live `https://mcflyads.com/llms.txt`:

> `deeper Shopify numbers Analytics does not show.`

Live `https://mcflyads.com/llms-full.txt`:

> `Typical order is the median, not Shopify’s AOV. Returning dollars, not the returning-customer rate.`

> `Mcfly packages median ticket, returning dollars, and month/quarter/year on one Admin board at $39.`

Second sentence already admits Overview YoY + Group by day of week. First sentence still sells returning $ as the gap. AI crawlers will quote the lie.

**Cook one-liner:** llms leftover = median (no native `median_order_value`). Name ShopifyQL `total_sales_returning` / Group-by weekday as native. Keep $39 / 7-day / no pixel.

---

### P0-9 — FAQ / JSON-LD still identify Mcfly as “median + returning dollars + three-range YoY”

Cooked uniqueness **answer** is honest. Adjacent identity is not.

> `"name": "Is this Repeat Customer Insights?"`  
> `"text": "… Mcfly is one Admin desk: median ticket, returning dollars, and month/quarter/year on the same board."`

Three-range YoY is packaging (home already says so). Returning dollars is native ShopifyQL. Median is the leftover.

Home Slack paste still proves uniqueness with the Overview-rate contrast:

> `Typical order is $631 — the middle order, not Shopify's average. Returning buyers carry 66% of sales ($45,409) — dollars, not headcount.`

Teaching vs Overview **rate** is fine if meta/lede stop calling it the Analytics hole. As currently paired with P0-1/P0-2, it still sells the hole.

**Cook one-liner:** RCI answer → leftover is median; returning $ is native ShopifyQL; YoY is packaging; RCI from $59 remains the closer LTV/RFM/tagging app. Slack paste can keep median vs mean; drop “dollars, not headcount” as the uniqueness punch, or add “ShopifyQL can already show returning sales $.”

---

### P0-10 — Demo / product JSON-LD / pricing schema still lead with returning dollars as the product

Live `/demo` meta (SAMPLE locks stay `$68,457` / `$19,023` / `3.60×`):

> `Typical order, returning dollars, and five analysis tabs on SAMPLE Snowdevil`

Live `/product` SoftwareApplication JSON-LD:

> `Median ticket and returning dollars on one Admin board.`

Live `/pricing` schema:

> `Median ticket and returning dollars on one board.`

**Cook one-liner:** Schema/demo meta → median leftover + optional spend / copy-PNG. Returning dollars named as sitting next to native ShopifyQL, not as the second uniqueness noun.

---

## Not P0 (already cooked, or keep)

| Surface | Status |
| --- | --- |
| Locked home H1 | Keep. Do not recook. |
| Home uniqueness `<details>` answer | Honest leftover + native named. Keep. |
| FAQ uniqueness **answer body** + JSON-LD answer text | Honest. Keep. Retitle the Q (P0-3). |
| Product H1 `Median ticket. Not Shopify AOV.` | Keep. |
| Goals vs Overview monthly targets | Home / pricing / about already: “Native already pins monthly sales targets on Overview.” Keep. |
| Grow+ Dashboards vs Reports | Home / FAQ already name Dashboards = Overview + Live view; Reports = every report. Keep. |
| Polar `$750` / refuse `$1,020` · reviews 0 · empty `—` · `$39`/7-day · SAMPLE board | Keep. |
| Copy/PNG · never posts to Slack | Keep uniqueness. |
| Mean AOV vs median | Keep. No native median ticket. |
| Sidekick | Live site barely claims vs Sidekick. Help: Sidekick answers sales + RFM questions. Do not add a “Sidekick cannot” uniqueness line. |

**P1 (same leftover, lower rank):** `/demo` visible lede still “Typical order, returning dollars, then five tabs” (meta is P0-10). Support paste help still “typical order, returning dollars” as the share ritual — fine as a paste recipe, not as Analytics-gap. Product “Weekend mix / Not sessions or visitors” is true and does not claim weekday grouping is missing.

---

## Shopify quotes (harvest footnotes)

**Mean AOV, not median** — [sales schema](https://shopify.dev/docs/api/shopifyql/latest/schemas/sales_revenue/sales):

> Average order value = (gross sales - discounts) / orders

No `median_order_value` in that schema (fetched 2026-09-22).

**Returning sales $** — same schema:

> `total_sales_returning` — The full amount spent by customers who had bought from you before…

> `new_or_returning_customer` — Values are New and Returning. Filter or group to compare acquisition against repeat business.

Example already in schema: `FROM sales SHOW net_sales, orders, … GROUP BY … new_or_returning_customer`.

**Weekday grouping** — [Sales reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report):

> You can click Group by to select the time unit … hour, day, week, month, quarter, year, **hour of day, day of week**, or month of year.

ShopifyQL: `GROUP BY day_of_week` (0 = Monday … 6 = Sunday).

**RFM recency** — [Customers reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports):

> For each RFM group, the report's data table lists … **Average days since last order**

ShopifyQL customers: `days_since_last_order` — “Number of days since the customer's last order.”

**Cohorts / LTV-shaped native** — same Help:

> The Customer cohort analysis report displays data about your customer acquisition and retention.

> Metric menu … number of customers, customer retention rate, gross sales, net sales, or average order value … Amount spent per customer … Show projections.

**Overview targets** — [Setting targets](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/overview-dashboard/targets):

> you might set a target of $50,000 USD in gross sales for March

> The default is the current month.

> Activate … Add to dashboard … target gauge … Analytics overview dashboard.

**Dashboards vs Reports** — [Store permissions](https://help.shopify.com/en/manual/your-account/users/roles/permissions/store-permissions):

> Dashboards — Overview and Live view pages.

> Reports — view and create reports … You can't specify which reports users can access.

**Sidekick** — Sales reports Help:

> ask Sidekick … "Why did my sales drop this week compared with last week? Break it down by channel, product, and traffic source."

Customers reports Help:

> Sidekick can answer questions about your customer data, including new and returning customers … RFM groups, and predicted spend tiers, but not cohort projections.

**Returning-customer rate (headcount, still on Overview)** — [Analytics fields](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/analytics-fields):

> Returning customer rate … Formula: returning customers / customers

That contrast is real vs the Overview **rate card**. It is not “Analytics cannot show returning sales $.”

---

## Parent harvest

Research only. Parent cooks the P0 one-liners. Do not ship this branch as site HTML. Do not touch locked home H1, SAMPLE board, Polar, empty —, reviews 0, or `$39`/7-day.
