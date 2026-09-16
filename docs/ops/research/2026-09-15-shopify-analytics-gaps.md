# Shopify Analytics gaps — 2026-09-15

**Lane:** Research. Read-only on `app/**`. Mcfly reviews stay **0**. Listing [https://apps.shopify.com/mcfly-analytics-public](https://apps.shopify.com/mcfly-analytics-public). $39 after 7-day.

**Job:** Native Analytics / Overview / Reports already exist. Mcfly cannot win with “more metrics.” It wins by compressing the questions merchants currently answer with **another report, a CSV, Sheets, or Sidekick** — at **$0 spend**, inside ~60 days of `read_orders`.

**Do not invent** a percentage of merchants who export. The workflow is documented; incidence is not.

**Status marks:** **Already on Fly 318** = visible in this working tree’s routes/components on 2026-09-15 (Fly 318 journal confirms ROAS chips + Allocation; Shopify five book routes exist here; not Admin smoke PASS). **Gap** = locked tab job incomplete vs uninstall risk. **Refuse** = extra scopes / pixels / CRM / P&L.

All URLs accessed **2026-09-15**.

---

## A. What Shopify already is (so we don’t lie)

Shopify Help (sales reports): **Average order value = (gross sales − discounts) / orders** — a **mean**, and it **excludes post-creation adjustments** (edits, exchanges, returns). **Total sales** = gross − discounts − sales reversals + taxes + duties + shipping + fees. Returns can make a day negative.

- Sales reports: [https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report)
- Finance / Total Sales: [https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/finances-report](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/finances-report)

Hour and weekday are **not missing**. The same sales reports let you **Group by** `hour of day` or `day of week`. They are **buried** behind Analytics → Reports → Group by — not a first-glance Overview card.

Customer reports exist: cohort analysis, predicted spend tier, RFM ([Customers reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/customers-reports) — Help Center 403 on fetch; URL is canonical). Overview’s **Returning customer rate** is still a **headcount rate**, which Shopify Staff published as a formula (below).

Public apps: **`read_orders` = last 60 days** unless Shopify approves **`read_all_orders`**. Official: [https://shopify.dev/docs/api/usage/access-scopes](https://shopify.dev/docs/api/usage/access-scopes). Changelog (2018, still the rule): [apps now need approval to read orders older than 60 days](https://shopify.dev/changelog/apps-now-need-shopify-approval-to-read-orders-older-than-60-days).

Admin **Orders → Export** can email a larger CSV ([Exporting orders](https://help.shopify.com/en/manual/orders/manage-orders/exporting-orders)). That is the merchant workaround. It is not the public-app API window. **Refuse** treating `read_all_orders` as the shipped product.

---

## B. Complaint map (native Analytics)

| # | Complaint in shop-owner English | Source | Maps to | Status |
| ---: | --- | --- | --- | --- |
| S1 | “Shopify shows **average** order. A few wholesale / huge tickets make AOV look healthy. I want the **middle** order on the front page, like AOV.” | Community, Sep 2023–Jan 2025, still unanswered as a native metric: [How can we calculate median order value in Shopify analytics?](https://community.shopify.com/t/how-can-we-calculate-median-order-value-in-shopify-analytics/254046). Follow-ups: “I searched and searched… this is a pretty basic metric”; “How would we calculate MOV if this isn’t released?” | **Orders** (hero = typical / median; average as hint). TAB_LOCK: not on Overview this pass. | **Already on Fly 318** Orders `periodHero` median + “Shopify Analytics uses the average.” **Gap:** Overview first viewport still shows typical order **and** Total ROAS/spend tiles — TAB_LOCK Overview is **three YoY sales cards only**. |
| S2 | “Returning customer **rate** is people, not dollars. 8% returning can still be half of sales.” | Shopify Staff Ivy_4, 22 May 2023: rate = returning **number** / (returning + first-time **number**). Example 90 / 1,070 = **8.41%**. [How is the Returning Customer Rate calculated?](https://community.shopify.com/t/how-is-the-returning-customer-rate-calculated-in-analytics/217973) | **Customers** (returning **$** hero). **Growth** (first-time **$**). | **Already on Fly 318** Customers hero + new vs returning bars; Growth first-time $. Copy on page contrasts headcount vs dollars. |
| S3 | “New + returning doesn’t add up to total customers. I don’t trust the panel.” | Community, [New VS Returning customer](https://community.shopify.com/t/new-vs-returning-customer/408807) — Shopify reply: a buyer can count in **both** in one month; “returning” may be **orders**, not unique people. | **Customers** / **Growth** must say **dollars in this window**, not a mystery rate. | **Already on Fly 318** dollar split. **Gap** if we ever paint Shopify’s headcount rate as our hero. |
| S4 | “First-time vs returning **sales** exists in Reports, but I still stare at Overview rate. On Basic I may not get the sales report. I export.” | Community, [How can I extract specific data from analytics reporting?](https://community.shopify.com/t/how-can-i-extract-specific-data-from-analytics-reporting/131388) — merchant wants weekly online sales + returning rate; Report Pundit reply: First-time vs returning **customer sales** is plan-gated (not Basic); “export the report.” Hover numbers broke on the dashboard: [Returning vs new customer report no longer shows numbers on hover](https://community.shopify.com/t/returning-vs-new-customer-report-no-longer-shows-numbers-on-hover/245945). | **Customers** | **Already on Fly 318** returning $ without a report hunt. Do not invent how many shops are on Basic. |
| S5 | “I need **hour-of-day / weekend** to staff and to compare today vs last year **up to now**. New Analytics comparison is **full day**, so I download a spreadsheet and do hours myself.” | Community, Kayleigh, 18 Jan 2025: [New analytics issues with comparisons](https://community.shopify.com/t/new-analytics-issues-with-comparisons/387984). Help Center: Group by hour of day / day of week lives on sales / AOV-over-time reports (buried). | **Orders** (weekend %, busiest weekday + breakdown, busiest hour + top hours, clickable weekday bars). | **Already on Fly 318** timing folded into Orders + `WeekdaySalesChart`. **Refuse** a 12th Timing tab. **Gap** if hour is only behind “Click for detail” with no weekday chart. |
| S6 | “Plus retailer: I still export CSV for **items per order / average item price** — basic retail math.” | Community, [Native calculated metrics in ShopifyQL](https://community.shopify.com/t/feature-request-native-calculated-metrics-in-shopifyql-analytics-retail-fundamentals-missing/639503/2). Staff: ShopifyQL can do it **in exploration**; the ask was that it wasn’t obvious. | **Orders** (items per order, 2+ item share). | **Already on Fly 318** `meanUnitCount` + multi-unit share. **Refuse** ShopifyQL BI builder. |
| S7 | “AOV hides discount vs full-price tickets and the fat tail of huge orders.” | Same median thread; operator writeups that mean ≠ typical (cite as secondary: [VideoWise AOV guide](https://videowise.com/conversion-optimization/shopify-average-order-value-report-a-strategic-operator-guide) — not a merchant 1-star). | **Orders** (p25–p75 band, full vs discounted typical, biggest 10% of **orders**). **Customers** (top 10% of **customers** — different). | **Already on Fly 318** in `ShopifyBookSection` period/buyers rows. |
| S8 | “I export Orders CSV, dump it in Sheets, then ask ChatGPT/Claude. Shopify reports are isolated; one question needs several files.” | Workflow evidenced, **not counted**: [Coupler.io ChatGPT+Shopify](https://blog.coupler.io/how-to-connect-shopify-to-chatgpt/); [r/shopify: ChatGPT/Claude can analyze exported CSV](https://www.reddit.com/r/shopify/comments/1mvgiyn/ai_tool_or_analysist_for_ecommerce/); [r/SaaS: store owners export CSV but rarely analyze it](https://www.reddit.com/r/SaaS/comments/1rn02o9/built-a-small-tool-to-turn-shopify-order-csvs/); [r/dropshipping: pasted years of order tags into Claude](https://www.reddit.com/r/dropshipping/comments/1sxyp30/i_pasted_3_years_of_shopify_order_tags_customer/). Help Center documents CSV export. Independent brief already: do **not** put a % in the listing. | Shopify five compressing the loop. **Refuse** ChatGPT-in-app / AI analyst. | **Gap** = first viewport still a tile wall (independent insights 2026-09-10). **Refuse** paste-CSV-into-LLM as a feature. |
| S9 | “Sidekick told me I had 3 sales in a month; it was 2,463. Then it apologized and did it again. I pull the data myself.” / “It said we had no sales last week. Wrong.” | Reddit [Be extremely careful with Sidekick](https://www.reddit.com/r/shopify/comments/1m4169l/be_extremely_careful_with_sidekick/) (YoY month hallucinated); [Thoughts on Sidekick?](https://www.reddit.com/r/shopify/comments/1pk1xcd/thoughts_on_sidekick/) (false “no sales”). Independent test: wrong periods, 887% when sales were down — [Tante-E Sidekick test](https://tante-e.com/en/blogs/tante-e-blog/shopify-sidekick-test). | **Overview** YoY cards with honest missing last year. **Refuse** Sidekick clone. | **Already on Fly 318** `OVERVIEW_YOY_MISSING` — not $0. **Refuse** AI analyst. **Gap** if Overview still buries the three YoY cards under ROAS. |
| S10 | “I can’t get **lifetime** value from Overview. Cohort / RFM / predicted spend are another report (or another app).” | Help Center customer reports (cohorts, predicted spend, RFM). Lifetimely/RCI exist because the **90-day order LTV** is not a calm hero. RCI 5-star: “the only way we can easily track customer repeat rates by annual / quarterly cohorts” ([RCI listing](https://apps.shopify.com/repeat-customer-insights)). | **LTV** (first 90 / 30 / 365 from **orders**). **Growth** (days to second, 2nd in 30 days). | **Already on Fly 318** `/app/ltv` + Growth rows. **Gap:** 60-day install cannot honestly show first-**year** LTV — must say **not on file**, not $0 (`historyLimited` already in `app.ltv.tsx`). |
| S11 | Public apps only see ~**60 days** of orders. Year charts, 365-day LTV, and “vs last year” lie if we paint missing as zero. Merchants can still **export** older orders from Admin. | [shopify.dev access scopes](https://shopify.dev/docs/api/usage/access-scopes); export help above. | **Overview** YoY · **YoY** · **LTV** · coverage line on Shopify five. | **Already on Fly 318** coverage line `Shopify orders · last ~60 days available · returns included`; YoY missing string; LTV emptyReason `history_limited`. **Refuse** silent `read_all_orders`. **Gap** if YTD card looks like a full year of this shop’s life. |
| S12 | “Retail fundamentals still mean a CSV” (calculated columns). ShopifyQL can do it if you know exploration. | Same ShopifyQL thread as S6. | **Orders** rows, not a query builder. | **Refuse** GraphQL BI. |

---

## C. Retention moat vs native Analytics (the Shopify five)

These five are the **uninstall defense** if they are impressive at $0 spend. Spend six cannot substitute.

| Tab | Native pain it compresses | Must not become |
| --- | --- | --- |
| **Overview** | “Am I up or down vs last year?” without Sidekick or a compare that is full-day-only. | A Total ROAS cockpit. TAB_LOCK: **three YoY sales cards**. Current tree still shows Total Sales + **blank ROAS + Ad spend** (`OverviewFirstViewport`) — **spend-wall Gap**. |
| **Customers** | Overview **rate** vs dollars; plan-gated returning-sales report. | Headcount rate, Klaviyo lists. |
| **Growth** | “Who came back / days to second / 2nd in 30 days” — usually CSV or a retention app. | Email subscribe counts, ads. |
| **Orders** | Median vs mean; discounts; weekend/hour buried in Group by. | Spend, ROAS, a 12th Timing tab. |
| **LTV** | 30/90/365 not on Overview; cohort report is a different sport. | Predictive RFM, P&L, `read_all_orders` fake year. |

---

## D. Audit / refuse for Conductor (native)

**Audit (P0 uninstall):**

1. First open Overview with **$0 spend** — no ROAS/spend KPI competing with YoY sales (TAB_LOCK). Empty is not 0× **and** not a wall.
2. Every Shopify tab: 60-day coverage visible; missing last year / missing LTV-365 **not $0**.
3. Orders hero is **typical (median)** with average as the Shopify hint.
4. Customers hero is **returning dollars**, not rate.
5. Growth shows **first-time dollars** + second-order timing from order history.
6. LTV hero is first 90 days; Cash CAC only if spend exists.

**Refuse:** Sidekick competitor, ShopifyQL explorer, sessions/conversion, product/SKU reports, email CRM, `read_all_orders` as the listing promise, any “% of merchants export to Sheets” claim.

Sibling files: `2026-09-15-competitor-uninstall-signals.md` · `2026-09-15-tab-vs-complaints.md`.
