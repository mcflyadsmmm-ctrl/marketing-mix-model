# Religion challenge — orders past 24 months — 2026-09-18

**Verdict: OVERKILL for Mcfly’s current desk.** Order rows older than 24 months do not change YoY, typical order, or 365-day LTV. **REJECT** storing them. Keep flat **$39**. Founder has not accepted a price change.
**Cohort past 365, computed inside Mcfly:** those rows are required only when the first order sits before the 24-month floor (a 2022 customer’s later repurchase, or a matured window longer than the book). A just-finished 365, and an 18-month LTV on a recent cohort, still fit in 24 months of orders.
**Market:** that longer cohort is not what big stores are paying for. Shopify already shows it. Lifetimely, Triple Whale, and Polar sell P&L, predictive LTV, pixels, and ad data. None of the cited reviews ask for every historical order.
**Aggregates past 2 years stay allowed.** One sales total per day is not an order row. This file does not edit the app, `fly.toml`, the listing, or the site. Cursor does not change Partner pricing.

Reviews stay **0**. No install count. No revenue. No conversion rate.

---

## What the current desk actually uses

Read in this repo. Not a new product.

| Number on the desk | Needs each order? | Needs orders older than 24 months? |
| --- | --- | --- |
| YoY (12 months vs the prior 12) | No. Daily sales totals. | No. |
| 365 LTV (30 → 90 → 365) | Yes, inside the window. | No. A customer acquired 24 months ago has already finished a 365-day window inside that book. |
| Typical order (median) on the period the merchant is looking at | Yes. A day total ÷ order count is an average, not a median. | Only if that period is 2022. The current job is the recent book, not a 2022 archive. |

`SalesDayFact` is one row per shop-local day, source `shopify_order_current_total_v1`, built by reading orders (`app/app/lib/sales-facts.server.ts`). Keeping those day rows past two years does not require keeping `OrderFact`. Trial ingest is 90 days (`TRIAL_LIVE_SLICE_DAYS`). Paid history in code is still `DESK_HISTORY_YEARS_BACK = 5`. The pricing brief the same day already said YoY plus 365 LTV fit in 24 months. This brief does not reopen price.

---

## 1. What Shopify already gives a big store

Fetched 2026-09-18 unless noted. Shopify’s price is the store plan, not an analytics app. The Basic plan page, fetched the same day in `RELIGION_CHALLENGE_PRICING_20260918.md`, says Basic includes access to all reports: https://help.shopify.com/en/manual/intro-to-shopify/pricing-plans/plans-features/basic-shopify-plan

### Free as a report (no second copy of each order)

| Job | Shopify report | What it is |
| --- | --- | --- |
| Sales years back | Total sales over time | Order count and total sales. Group by hour, day, week, month, quarter, or year. Compare date ranges. https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report |
| Average ticket in 2022 | Average order value over time | A **mean**: (gross sales − discounts) / orders. Same group-by and date compare. Same page. Not a median. |
| Did 2022 buyers come back? | Customer cohort analysis | Cohorts by first-order month. Repeat purchases over the **weeks, months, or quarters** after that first order. Cell detail includes total sales, **average** order value, orders per customer, and **amount spent per customer**. https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports |

Shopify’s own cohort help uses a **June 2022** cohort and a **February 2022** customer who repeats in month 0, month 4, and month 7. That is past a 24-month lookback from 2026-09-18, and it is a report Shopify ships, not an app warehouse. Projections on “amount spent per customer” use the **previous 24 months** of that store’s data, and the toggle hides if those 24 months are not there. Same page.

This pass did not get a Shopify sentence that says “reports never expire.” The time-range help page timed out. A Dec 2024 community thread says a custom range, including 2023 and earlier, works by scrolling the calendar: https://community.shopify.com/t/is-it-truly-not-possible-to-see-my-2023-and-earlier-shopify-sales-data/382913/1 — merchant confirmation, not an SLA.

### What still needs each order

| Question | Daily sales total | Each order |
| --- | --- | --- |
| What did we sell in 2022? | Enough. Shopify’s sales-over-time report, or a `SalesDayFact` row per day. | Not required. |
| Median ticket in 2022 | Not enough. Sum ÷ count is the average Shopify already prints. | Required: each 2022 order amount. Shopify has no median report. Community thread, still the gap as of the 2026-09-15 audit: https://community.shopify.com/t/how-can-we-calculate-median-order-value-in-shopify-analytics/254046 |
| Did *this* 2022 customer buy again in 2025? | Not enough. A cohort cell is a group. | Required: an opaque customer id plus order dates from 2022 forward. |
| Cohort LTV past 365 for a cohort that started inside the last 24 months | Not enough for a per-customer build. | Required, but the orders are still inside 24 months. |
| Same number for a June 2022 cohort, computed by Mcfly | Not enough. | Required. Shopify’s cohort report already shows the group version. |

A median for the period on screen is a real gap versus Shopify. A 2022 median is the same math on an old year. It is not a reason to keep every order forever, and it is not a new Monday number if the desk the merchant opens is this year’s YoY.

---

## 2. What the paid apps say they are for

Pricing and help pages fetched 2026-09-18. Review bodies below are from `docs/ops/research/2026-09-15-competitor-uninstall-signals.md` (fetched 2026-09-15), not re-scraped today. No review in that file asks for every historical order. This brief does not add reviews.

### Lifetimely — P&L, predictive LTV, journey. Orders are the pipe.

Pricing page, last updated 2026-09-15: https://useamp.com/pricing.md

Paid plans are the same desk at a higher **orders-per-month** cap ($49 / 500 through $999 at 25,000+). Included language is daily profit and loss, predictive LTV, customer behavior, attribution (ad spend, ROAS, CPC), customer journey (repurchase rate, time between orders), CAC and payback. The page does not sell “unlimited order history” as the feature. The meter is this month’s order count.

Their sync doc does say the first connect **pulls all historical orders**, and that those orders are the foundation for the LTV report, customer retention, and product journeys: https://help.useamp.com/article/1047-how-long-does-it-take-sync-order-and-product-data-from-shopify-to-lifetimely (last updated 3 Apr 2026). That is how they build cohorts. It is not a merchant saying the stored row is the product.

Reviews cited 2026-09-15, none of them “keep every old order”:

- Support and price, not history: https://appnavigator.io/app/lifetimely-lifetime-value-and-profit-analytics/reviews/1741069
- Exit writeup: brands leave LTV-only tools for contribution margin, COGS, and ad-platform P&L: https://www.sarasanalytics.com/blog/lifetimely-alternatives

### Triple Whale — pixel, MTA, and a 12-month lookback

Pricing page fetched 2026-09-18: https://www.triplewhale.com/pricing

Founders Dash (free) prints **“12-months of historical data.”** The Free plan prints **“12 Month Lookback”** plus Triple Pixel, first- and last-click, and channel tracking. Paid sections on the same fetch also print “12-months of historical data” and sell multi-touch attribution via Triple Pixel, cohorts, and SQL — not an all-time order archive. Price is annual GMV × package. Other GMV-band dollars stay gated, same limit as the pricing brief.

Reviews cited 2026-09-15 are about VAT in the revenue number, broken integrations, a pixel that is not Shopify, and price. The one history line is lock-in, not a feature request: BioPower Pet, “if we didn’t have historical data locked in I would change,” https://apps.shopify.com/reviews/2147338 — they stay because leaving is painful, not because they need 2019’s order rows inside another app.

### Polar — warehouse, pixel, GMV price. Not “every order” on this fetch.

Calculator, default under $5M GMV, fetched 2026-09-18: https://pricing.polaranalytics.ai/

- Business Intelligence only: **$625/month**
- Full platform (BI, attribution, MCP, Klaviyo / CAPI, pixel): **$750/month**
- Included line: “Smart warehouse with commerce semantic layer.” **Snowflake Access is marked for GMV $5M+**, not every plan.
- Ultimate / incrementality: **$10M+ GMV**, no dollar on this fetch.

This calculator does **not** say “every historical order.” The Shopify listing, fetched the same day for the pricing brief, did say unlimited history, unlimited connectors, and advertising signals: https://apps.shopify.com/polar-analytics — not re-opened in this pass. Treat “unlimited history” as listing copy from that brief, beside a pixel and a GMV price, not as proof that order rows are the love.

Review cited 2026-09-15: a merchant paying $750+ still missing a basic YoY revenue chart, plus inventory pain: https://www.trustpilot.com/reviews/690da52c91938d8e1b9286b7

---

## Verdict for Marty

**REJECT order rows older than 24 months. Keep $39.**

They are overkill for the desk Mcfly has: year-over-year sales, a typical order, and 365-day LTV. Sales totals past two years can stay as one row per day. A cohort product that looks past 365 days needs those old order rows only for cohorts born before the 24-month floor, and Shopify’s cohort report already answers the group version of that question, including a 2022 example. The apps big stores pay for are selling profit, prediction, and ads. Copying their order sync without copying those jobs does not make a $500k/month store open Mcfly on Monday.

### What would falsify this

- The desk gains a number that is false without a specific order older than 24 months, and Shopify’s cohort report does not already show it. A 2022 **median** is the honest candidate. It is still not YoY, and it is not why Lifetimely’s price ladder exists.
- A fetched review, not a paraphrase, where a merchant says they paid because the app kept every historical order and the P&L / pixel / cohort was incidental. Not in the 2026-09-15 set. Not invented here.
- Marty accepting a different religion in writing. Until then the lock stands: flat $39, no pixels, no MTA, no ad OAuth, no automatic order cliffs.
