# Tab vs complaints — 2026-09-15

**Lane:** Research. One matrix for Conductor: **11 analysis tabs × uninstall risk if that tab is weak.** Settings is not a 12th analysis tab (`docs/plans/2026-09-15-TAB_LOCK.md`).

**Religion:** Total ROAS = sales ÷ typed spend; empty is not 0×. No pixels/MTA/OAuth/Klaviyo. ~60-day Shopify order window. Mcfly reviews **0**. Listing [https://apps.shopify.com/mcfly-analytics-public](https://apps.shopify.com/mcfly-analytics-public). $39 after 7-day. Do not claim merchants will cancel Triple Whale. Do not invent export percentages.

**Status in this tree (2026-09-15, read-only):** routes exist for all 11 (`app._index.tsx`, `app.customers.tsx`, `app.growth.tsx`, `app.orders.tsx`, `app.ltv.tsx`, `app.spend.tsx`, `app.roas.tsx`, `app.allocation.tsx`, `app.yoy.tsx`, `app.cpa.tsx`, `app.goals.tsx`). Nav: `DESK_PRIMARY_NAV` in `app/app/lib/desk-nav.ts`. Fly 318 journal = certified ROAS windows + Allocation cut — **not** Admin smoke PASS.

**Marks:** **Already on Fly 318** / **Gap** / **Refuse** (see sibling files for citations).

---

## Ranked uninstall complaints (top 10)

Use this order when the next lane audits tabs. Citations live in the sibling research files.

| Rank | Complaint (shop-owner English) | If we fail it | Tab to audit | Mark |
| ---: | --- | --- | --- | --- |
| 1 | “I opened it and it wanted **spend / ads / a blank ROAS** before it was useful.” | First-session uninstall. Same motion as TW pixel + Polar login walls. | **Overview** must work at $0 spend. **Spend Upload** is the later door — not the lock. | **Gap:** `OverviewFirstViewport` still paints Total ROAS + Ad spend KPIs (em dash, not 0×) + “Spend Upload →”. TAB_LOCK: three YoY **sales** cards only. |
| 2 | “The number is **not Shopify’s number**” (or last year / LTV painted as $0). | Instant distrust. TW VAT-in-revenue 1-star; Northbeam/Polar **vendor docs** say Analytics won’t match. | Overview · Orders · YoY · LTV · Total ROAS | **Already on Fly 318** Total Sales clocks, `OVERVIEW_YOY_MISSING`, LTV `historyLimited`. **Audit** they actually paint. |
| 3 | “Shopify’s **average** isn’t my typical order.” | They keep Analytics + CSV. | **Orders** | **Already on Fly 318** median hero. **Gap** if Overview still competing with Orders for that job (lock says typical order is **not** Overview). |
| 4 | “Returning **rate** looks tiny; I needed **dollars**.” | “This is just Shopify with extra clicks.” | **Customers** | **Already on Fly 318** returning $ hero. |
| 5 | “I still can’t see **who comes back** (days to 2nd, 2nd in 30 days) without a spreadsheet.” | They install Lifetimely/RCI — or uninstall us. | **Growth** | **Already on Fly 318** Growth rows. **Refuse** Klaviyo. |
| 6 | “**LTV** isn’t on Overview, and a 60-day app showing $0 first-year is a lie.” | Disappointment uninstall. | **LTV** | **Already on Fly 318** 90-day hero + honest 60-day empty. **Gap** if 365 looks like a real year on a fresh install. |
| 7 | “Weekend / hour is buried; compare-to-last-year is **full day** so I export.” | Ritual stays in Sheets. | **Orders** | **Already on Fly 318** timing + weekday chart. |
| 8 | “Sidekick / AI **lied** about sales. I won’t trust another analyst.” | Any Moby-like sentence that disagrees with Shopify. | **Overview** (YoY cards, no AI). **Refuse** analyst. | **Refuse** AI. **Already on Fly 318** YoY missing ≠ $0. |
| 9 | “Spend/ROAS is a **cockpit** until I connect Meta.” | Spend six feel like TW. Empty CPA = $0 is a lie. | **Spend Upload** · **Total ROAS** · **CPA** · **Channel Allocation** | **Already on Fly 318** empty not 0× / not $0 CPA. **Gap** if Spend Upload still dumps analysis (TAB_LOCK: input only). |
| 10 | “The bill is a **GMV tax** / connectors broke / support vanished.” | They churn attribution suites. Mcfly $39 is the contrast — **don’t chase their stack.** | Support + pricing. **Refuse** GMV, OAuth, pixels. | **Refuse** |

---

## 11 tabs × uninstall risk if that tab is weak

| Tab | Job (TAB_LOCK) | If this tab is weak, uninstall looks like | Native / competitor complaint it must answer | Must not chase (Refuse) | Status now |
| --- | --- | --- | --- | --- | --- |
| **1. Overview** `/app` | One glance: am I up or down vs last year. **Three YoY sales cards** (MTD / QTD / YTD). Coverage line. Missing last year ≠ $0. | “This is an ads app.” Blank ROAS on first open. Sidekick-level wrong YoY. Tile wall = I bounce to Analytics. | Sidekick false YoY / “no sales” ([r/shopify Sidekick](https://www.reddit.com/r/shopify/comments/1m4169l/be_extremely_careful_with_sidekick/)); Polar 1-star missing YoY chart ([Trustpilot Maja](https://www.trustpilot.com/reviews/690da52c91938d8e1b9286b7)); TW day-one pixel+ads ([TW onboarding](https://kb.triplewhale.com/en/articles/5677051-onboarding-guide-account-setup)). | Pixels, ROAS hero, spend chart, explorer, 0×. | **Gap (P0 spend wall).** YoY cards + coverage strings **Already on Fly 318**. First viewport still Total Sales **plus** ROAS/spend KPIs + PeriodControl + chart — contradicts lock. |
| **2. Customers** `/app/customers` | Who already buys — **dollars**, not headcount. | “It’s just returning-customer rate.” | Staff formula is headcount ([community 217973](https://community.shopify.com/t/how-is-the-returning-customer-rate-calculated-in-analytics/217973)); plan-gated sales report + export ([community 131388](https://community.shopify.com/t/how-can-i-extract-specific-data-from-analytics-reporting/131388)). | Klaviyo lists, CRM, overdue-to-email. | **Already on Fly 318** returning $ hero, new vs returning bars, guests, top 10% customers, one-order buyers. |
| **3. Growth** `/app/growth` | New dollars and who came back. | “I still need Repeat Customer Insights / a CSV for second-order.” | CSV→ChatGPT / Sheets loop ([r/shopify 1mvgiyn](https://www.reddit.com/r/shopify/comments/1mvgiyn/ai_tool_or_analysist_for_ecommerce/)); RCI exists to track cohorts/LTV ([RCI listing](https://apps.shopify.com/repeat-customer-insights)). | Email/SMS, ads, subscribe counts. | **Already on Fly 318** first-time $ hero, days to 2nd, 2nd in 30d, 2nd vs 3rd+, 2nd vs 1st $, first-order-month bars. |
| **4. Orders** `/app/orders` | Typical (median) order + when/where it lands. | “AOV still lies; I export for median, discounts, hour, weekend.” | Median request 2023–2025 ([community 254046](https://community.shopify.com/t/how-can-we-calculate-median-order-value-in-shopify-analytics/254046)); hour compare → spreadsheet ([community 387984](https://community.shopify.com/t/new-analytics-issues-with-comparisons/387984)); Help Center AOV is a **mean** ([sales-report](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report)). | Spend, ROAS, a Timing tab, SKU reports. | **Already on Fly 318** median hero, clocks, discount/basket/returns, weekend/hour/POS mix, weekday chart. |
| **5. LTV** `/app/ltv` | What a new buyer is worth over 30 / 90 / 365 **from orders**. | “$0 LTV” on a 60-day pull, or a P&L app upsell. | Lifetimely exists because native LTV isn’t a hero; 1-stars are price/support/Amazon ([Lifetimely listing](https://apps.shopify.com/lifetimely-lifetime-value-and-profit-analytics), [1-star 1741069](https://appnavigator.io/app/lifetimely-lifetime-value-and-profit-analytics/reviews/1741069)). 60-day API ([shopify.dev scopes](https://shopify.dev/docs/api/usage/access-scopes)). | Predictive RFM, COGS P&L, `read_all_orders`, Klaviyo. Cash CAC **only if spend typed**. | **Already on Fly 318** 90-day hero, 30/365, honest `history_limited`. **Gap** if 365 is implied complete. |
| **6. Spend Upload** `/app/spend` | Get spend on file. **Input only.** Honest empty: sales already here; empty ≠ 0×. | “I have to OAuth Meta to continue” **or** the form is a cockpit and they never type a day. | TW/Polar/Northbeam day-one ad accounts + pixel; Polar 5-minute Gmail wall ([AppNavigator Polar](https://appnavigator.io/app/polar-analytics/reviews/)). | Pixels, Ads Manager login, explorer, mix pie. | **Already on Fly 318** doors + CSV + recurring + empty copy. **Gap** vs lock if analysis (explorer/mix) still lives here (`app.spend.tsx` is still a large page). |
| **7. Total ROAS** `/app/roas` | Sales next to spend + explorer. Empty = blank, never 0×. | 0× ROAS; or numbers ≠ Shopify (VAT, no refunds). | TW Kove Footwear VAT-in-revenue 1-star ([triplewhale-1](https://apps.shopify.com/triplewhale-1)); Northbeam default revenue **doesn’t deduct refunds** vs Shopify Total Sales ([Northbeam doc](https://docs.northbeam.io/docs/why-doesnt-northbeam-match-my-shopify-reporting)). | Platform ROAS, MTA, pixels. | **Already on Fly 318** certified chips, empty dash, explorer. **Audit** not remounted on Overview. |
| **8. Channel Allocation** `/app/allocation` | Where typed dollars went + daily cap. | Fake channel ROAS from pixels; or empty mix looks like $0 spend share. | Polar/TW connector mix vs Shopify session attribution. | Platform attribution, Klaviyo, click allocation. | **Already on Fly 318** mix/plan (Fly 318 journal: 20% cut). Honest empty required. |
| **9. YoY** `/app/yoy` | This year vs last for **sales and spend** (ROAS columns only when spend exists). | Last year painted $0 inside 60-day; Polar-class “no YoY line.” | Polar Trustpilot YoY gap; Shopify compare = full day ([387984](https://community.shopify.com/t/new-analytics-issues-with-comparisons/387984)). | Duplicate Overview three cards; explorer. | **Already on Fly 318** `/app/yoy` + `OVERVIEW_YOY_MISSING`. **Audit** 60-day same-window note. |
| **10. CPA** `/app/cpa` | Cash CPA/CAC from **typed spend**, not Ads Manager. | $0 CPA with no spend; or “doesn’t match Meta CPA.” | Northbeam/TW platform CPA disagreement ([r/ShopifyAttribution](https://www.reddit.com/r/ShopifyAttribution/comments/1o30kg7/triple_whale_vs_northbeam_vs_hyros_whos_getting/)). | Pixels, platform CPA, Klaviyo. | **Already on Fly 318** add-spend lede; dashes when empty (`keepDash`). **Audit** those dashes don’t look like “the product is broken.” |
| **11. Goals** `/app/goals` | Sales plan vs actual. Target Total ROAS lives in Settings. | Goals demand spend/margin before a sales plan; or AI targets. | Native Analytics is this period’s sales, not a plan. | SpendExplorer, ad-budget writeback. | **Already on Fly 318** gauges + year board. Must work as **sales vs plan** at $0 spend. |

---

## Shopify five = retention moat

If these five are weak, spend features will not save the trial:

1. **Overview** — YoY sales, no spend wall  
2. **Customers** — returning **dollars**  
3. **Growth** — new dollars + second-order timing  
4. **Orders** — typical ticket + buried timing  
5. **LTV** — 90-day order value with 60-day honesty  

Spend six (Upload → Total ROAS → Allocation → YoY → CPA → Goals) are **chapter two**. They uninstall people when they **block** chapter one, or when they **lie** (0×, $0 CPA, last year $0).

---

## Refuse list (do not audit as features)

Pixels · MTA/Compass/incrementality · Meta/Google/TikTok/Amazon OAuth · Klaviyo/email CRM · P&L/COGS/inventory · `read_all_orders` as the product · AI analyst/Moby/Sidekick clone · platform CPA · sessions/conversion/SKU BI · GMV or order-count pricing · claiming we replace Triple Whale.

---

## Files in this wave

- `docs/ops/research/2026-09-15-competitor-uninstall-signals.md`
- `docs/ops/research/2026-09-15-shopify-analytics-gaps.md`
- `docs/ops/research/2026-09-15-tab-vs-complaints.md` (this file)

Next (not this lane): tab-uninstall **audit after Desk returns** (`docs/plans/2026-09-15-uninstall-retention.md` Task 2). Research does not edit `app/**`.
