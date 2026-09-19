# Religion challenge — pricing — 2026-09-18

**Verdict: REJECT a price change.** Keep flat **$39/store/month** after a **7-day** trial. Founder has not accepted a change.
**Price architecture:** one Shopify managed plan at $39. Do not add a lower entry, a second history plan, or an order cliff.
**Not a price change:** cut paid Live history from 5 years to **24 months** (`DESK_HISTORY_YEARS_BACK`). YoY plus 365-day LTV do not need five years. Trial stays 90 days.
**Margin on $39** (labeled model below; not a measured invoice): **99.6% at 100 paid stores, 99.97% at 2,000**, if each store is a 1,500 order/month stress case on a 24-month book. Contribution after Fly: about **$3,885 of $3,900** at 100, about **$77,975 of $78,000** at 2,000.
**Undercut holds at $39.** A 100–1,500 order/month store pays less than Lifetimely’s first paid tiers ($49 up to 500 orders, $149 up to 3,000), Triple Whale Foundation’s listing floor ($219), and Polar’s published BI ($625) / Core-from ($750) under $5M GMV. A whale does not blow up the current Fly shape under the labeled byte assumption.
**$39 stops covering one store’s storage only at an absurd order rate** (about 4 million orders/month for 69 months at 1 KB/order). Not a fleet-size problem.
**Cursor does not change Partner pricing.** Marty must accept before any price edit. This file does not edit the app, `fly.toml`, the listing, or the site.

Reviews stay **0**. No install count. No revenue. No conversion rate sold as fact.

---

## What was verified in this repo

Fetched and read 2026-09-18. Not assumed from a prior chat.

| Fact | Where | What it says |
| --- | --- | --- |
| Trial Live slice | `app/app/lib/live-ingest-depth.ts` | `TRIAL_LIVE_SLICE_DAYS = 90`. Unpaid never exceeds ~90 days. Paid path returns `paidWindowDays`. Comment: flat $39, price does not rise with sales, no GMV cliffs. |
| Paid history constant | `app/app/lib/desk-history.ts` | `DESK_HISTORY_YEARS_BACK = 5`. Floor is 1 January of (UTC year − 5). On 2026-09-18 that is **2021-01-01**, about **69 months**, not a tidy 60. |
| What the desk actually needs | `app/app/lib/yoy-workspace.ts`, `app/app/routes/app.ltv.tsx` | YoY is a 12-month board vs last year (missing last year is an em dash, not $0). LTV build is 30 → 90 → 365. That job fits in **24 months**. Five years is extra backfill, not an extra answer. |
| Live ceiling today | `desk-history.ts` caption | Copy still says Shopify orders on this install cover about **60 days** (`read_orders`). `read_all_orders` is in `fly.toml` `SCOPES`, and `docs/APP_STORE_LISTING.md` still says that scope is not live until Partner approves. Deep history cost below is **if** that scope is approved and paid shops backfill. It is not a measured disk. |
| Billing | `docs/BILLING_TIERS.md` | One managed plan. 7-day trial, then $39. **Feature gates are forbidden.** Nothing in git can change Partner pricing. |
| Fly shape | `fly.toml` | `primary_region = "iad"`. App: shared, 2 CPUs, 2 GB, `auto_stop_machines = "off"`, `min_machines_running = 1`. Worker: shared, 1 CPU, 512 MB. Comment claims headroom for 10 concurrent desks. That concurrency cap is **not measured**. |
| Formula | `live-ingest-depth.ts` header; religion lock | Total ROAS = Shopify sales ÷ spend the merchant typed. Empty spend is an em dash, not 0×. No pixels, MTA, ad OAuth, or automatic order/GMV cliffs. |

---

## Competitor prices (fetched 2026-09-18)

Dollars below were on the page at fetch. Higher bands that did not render are marked gated. Nothing here is filled in from memory.

### Lifetimely (order-volume tax — the thing not to copy)

| Plan | Orders / month | Price | What the paid tier includes |
| --- | --- | --- | --- |
| Free | Up to 50 | $0 | Daily P&L, customer behavior, custom reports, predictive LTV, benchmarks, product insights, sales forecast. No Profit Agent. |
| S | Up to 500 | **$49** | All features: Profit Agent, MCP, unlimited users, unlimited integrations, 24/7 support, daily P&L, LTV, CAC/payback, attribution, journey. Amazon add-on **+$75**. |
| M | Up to 3,000 | **$149** | Same feature set. |
| L | Up to 7,000 | **$299** | Same feature set. |
| XL | Up to 15,000 | **$499** | Same feature set. Human page: dedicated account manager. |
| XXL | Up to 25,000 | **$749** | Same feature set. Human page: Platinum support. |
| Unlimited | 25,000+ | **$999** | Demo, not a self-serve trial. |

Sources, both fetched 2026-09-18:

- Canonical ladder, last updated **2026-09-15**: https://useamp.com/pricing.md
- Human slider (this fetch landed on M at $149; FAQ states XL $499, XXL $749, Unlimited $999): https://useamp.com/pricing
- Shopify listing confirmed Free, **S $49 / 500 orders**, **$149 / 3,000**, **$299 / 7,000**, Amazon +$75, 14-day trial. The listing fetch did not print XL / XXL / Unlimited: https://apps.shopify.com/lifetimely-lifetime-value-and-profit-analytics

Paid plans are the same desk at a higher order cap. Their own FAQ says they will not instantly raise the bill on one spike; they move you after two months over the cap. That is still an order tax. Mcfly’s uninstall note already refuses it (`docs/ops/research/2026-09-15-competitor-uninstall-signals.md`, LT4 and refuse item 10). This fetch does not overturn that.

### Triple Whale (GMV tax + pixel / MTA)

| Plan | Price seen | Includes |
| --- | --- | --- |
| Free | $0 | 10 users, ad/Amazon/email/SMS integrations, **12-month lookback**, first- and last-click, Triple Pixel, post-purchase survey. |
| Foundation | **$219/month** or $2,190/year (listing floor) | Listing: subscription data, multi-touch attribution, creative/product analytics, Sonar, cohorts, custom dashboards, SQL, Moby. |
| Automate | **$749/month** or $7,490/year (listing floor) | Moby automations, specialists, creative generation, benchmarks, autonomous actions. |
| Enterprise | Custom | Official page: brands at **$20M+ annual GMV**. No dollar on this fetch. |

Sources, fetched 2026-09-18:

- Listing (external charges may be billed outside Shopify): https://apps.shopify.com/triplewhale-1
- Official pricing (default slider showed $219 and $749): https://www.triplewhale.com/pricing

The official page says price is **annual GMV × package**, paid plans are **12-month** subscriptions, and the bill moves up as GMV grows. **Other GMV-band dollars did not render on this fetch.** They are gated behind the slider. Third-party grids are not used here. Do not treat $219 as the price a $5M brand pays. It is the floor the listing prints.

### Polar (GMV tax + warehouse stack)

Calculator default **under $5M annual GMV**, fetched 2026-09-18 at https://pricing.polaranalytics.ai/ :

| Module | Price on that default | Includes |
| --- | --- | --- |
| Full Platform | **$750/month** (page says was $720) | BI, attribution, MCP, CDP (Klaviyo / CAPI), pixel. |
| Business Intelligence only | **$625/month** (was $510) | BI, custom dashboards, AI analyst / MCP. |
| Polar MCP only | **$500/month** (was $408) | MCP only. Not a desk. |
| Klaviyo Enricher only | **$390/month** | Klaviyo audiences. Not a desk. |
| Ultimate / incrementality | No dollar | Page says **$10M+ GMV only**. Gated. |

Shopify listing, same day: **Core from $750/month**, “pricing based on online GMV,” unlimited users, unlimited history, unlimited connectors, Klaviyo audiences, advertising signals, Polar MCP. External charges may be billed outside Shopify. https://apps.shopify.com/polar-analytics

**Bands above $5M did not render.** Not invented.

### Shopify Analytics (the $0 alternative)

No separate app fee. Reports ship with the store plan.

- Basic: “access to all reports,” including custom reports with data explorations. Fetched 2026-09-18: https://help.shopify.com/en/manual/intro-to-shopify/pricing-plans/plans-features/basic-shopify-plan
- Starter, Grow, Advanced, and Plus also include reports, with a different report list per plan. Those help pages were retrieved the same day. The old reports manual URL returned **403** and is not cited for a price.

Shopify’s price is the store plan, not an analytics add-on. Mcfly at $39 does **not** undercut $0. It has to be worth YoY, returning dollars, and optional cash ROAS on one desk. That is a product test, not a price cut.

---

## Buyer vs whale

**Mcfly buyer (this brief):** a growing store at about **100–1,500 orders/month** who wants year-over-year sales, a typical order, returning dollars, and cash ROAS only if they type spend. They are shopping the first *paid* Lifetimely tier, not a warehouse.

At that band, today:

- 100–500 orders: Lifetimely **S $49**. Mcfly **$39**. Difference **$10/month**. No jump at order 501.
- 501–1,500 orders: Lifetimely **M $149**. Mcfly **$39**. Difference **$110/month**.
- Triple Whale’s cheapest *serious* paid plan starts at **$219** on the listing, and is a pixel / MTA product. Free TW exists; $39 does not undercut free.
- Polar’s cheapest published analytics module under $5M is **BI at $625**. Core listing floor **$750**.

**Whale who will not leave:** a Plus / enterprise brand whose job is pixels, MTA, Klaviyo, P&L, inventory, and many connectors. Polar and Triple Whale are built for that job. A flat $39 does not recruit them, and should not be designed as if it will.

**Published skew, labeled:**

- **Shopify filing (fact):** year ended 31 Dec 2025, most merchants are on Basic and Grow, and **most GMV comes from Plus and enterprise**. No single merchant was more than 5% of Shopify revenue. https://www.sec.gov/Archives/edgar/data/1594805/000159480526000007/shop-20251231.htm (fetched 2026-09-18). Shopify does **not** publish a median store revenue in that passage. This brief does not invent one.
- **ECDB (third-party estimate, not a filing):** in 2025 the top **1%** of merchants drove **51%** of Shopify GMV, and almost 90% of merchants (called small businesses) accounted for under 14% of GMV. https://ecdb.com/blog/shopify-s-influence-on-global-e-commerce-is-growing/5181 — seen via search 2026-09-18, not re-fetched as a full page. Use it only as “GMV is concentrated.” Do not use it as Mcfly’s customer mix.

Mcfly’s paid base, if it exists later, will look like the many smaller stores, not the 1% GMV core. Pricing for the 1% (order cliffs, GMV steps) taxes the buyer we can actually win and still does not win the whale.

---

## Cost model

### Assumptions (all labeled)

1. **Compute is the public iad row, always on, one app machine + one worker**, until someone adds machines. Fetched 2026-09-18 from https://fly.io/docs/about/pricing/ . The docs render a matrix per region. The **1.000×** matrix matches Ashburn’s published base (shared-cpu-1x 256 MB at $1.94 on https://fly.io/pricing/ ). `fly.toml` is `iad`.
   - App shared-cpu-2x, 2 GB: **$11.39/month**
   - Worker shared-cpu-1x, 512 MB: **$3.19/month**
   - **Flat compute = $14.58/month**
   - The $11.83 / $3.32 pair **is** on that same docs page, on the first matrix (about 3.8% higher: shared-cpu-1x 256 MB shows $2.02). That is not the iad row. Using $15.15 instead of $14.58 changes nothing below.
2. **Storage is not a measured Postgres bill.** Managed Postgres plan dollars are a link on that page (`/docs/mpg`), not a number in this fetch. **Not claimed.**
3. **Volume list price, used only as a planning ceiling:** **$0.15 per GB per month** of provisioned capacity (same Fly page). Real Postgres will not be packed at 100% of useful bytes. This is an envelope.
4. **1 KB per order is not measured.** `OrderFact` is an opaque id, amount, date, source, units — a small row. 1 KB is already loose for the row itself and still ignores indexes. A **100× stress (100 KB/order)** is shown so the conclusion is not hostage to 1 KB. 1 KB here means 1,024 bytes.
5. **Order rate for the fleet tables is a stress, not a mix.** Every paid store is assumed at **1,500 orders/month** (top of the named buyer band). A whale column uses **25,000 orders/month** (Lifetimely Unlimited threshold). Neither is a forecast of who will install.
6. **Windows:** 90-day policy ≈ 3 months. 24-month policy = 24 months of rows; daily catch-up is how the book stays current, not a second copy. 5-year policy = the code floor, **69 months** as of 2026-09-18.
7. **Shopify API is not a Fly line.** Admin GraphQL is throttled, not invoiced per call on the public app. Backfill depth is queue risk. `read_all_orders` may still be unapproved, in which case the live book stays ~60 days and these storage rows do not happen.
8. **Ignored, on purpose:** ads, support labor, Shopify’s app revenue share and processing fee. Shopify’s own page says billing is subject to a **2.9%** processing fee and 0% revenue share on the first $1M lifetime gross from 1 Jan 2025, then 15% (https://shopify.dev/docs/apps/launch/distribution/revenue-share, seen 2026-09-18). At $39 that processing fee is about **$1.13/store/month** if it applies. It does not change the verdict. It is **not** in the percentages below.
9. **Reviews = 0.** No trial-to-paid rate is used. Any such rate would be a scenario. None is required, because the cost side does not force a price move.

### Storage math

GB ≈ (orders/month × months × stores × 1 KB) / 1,048,576.  
Dollars ≈ GB × $0.15.

**Named buyer, 1,500 orders/month, 1 KB (planning):**

| Policy | Per store | 100 stores | 500 stores | 2,000 stores |
| --- | ---: | ---: | ---: | ---: |
| 90-day | 0.0043 GB · $0.0006 | $0.06 | $0.32 | $1.29 |
| 24-month + daily catch-up | 0.034 GB · $0.005 | $0.51 | $2.57 | $10.30 |
| 5-year code window (69 months) | 0.099 GB · $0.015 | $1.48 | $7.40 | $29.61 |

**Same stores at 100 KB/order (100× stress, still not measured):** multiply the storage dollars by 100. At 2,000 stores and 69 months that is about **$2,961/month** of volume against **$78,000** of $39 revenue. Still not a crisis. The three history policies do not separate on dollars at this buyer. They separate on **how many orders the queue must walk once**.

### Gross margin on $39

Definition: `(N × $39 − $14.58 compute − labeled volume) / (N × $39)`.  
Revenue: 100 × $39 = **$3,900**; 500 × $39 = **$19,500**; 2,000 × $39 = **$78,000**.

| Policy | 100 stores | 500 stores | 2,000 stores |
| --- | ---: | ---: | ---: |
| 90-day | 99.62% | 99.92% | 99.98% |
| 24-month | **99.61%** | 99.91% | **99.97%** |
| 5-year (69 months) | 99.59% | 99.89% | 99.94% |

Contribution after Fly, 24-month policy, 1,500 orders/month, 1 KB:

- **100 stores:** $3,900 − $14.58 − $0.51 ≈ **$3,885**
- **2,000 stores:** $78,000 − $14.58 − $10.30 ≈ **$77,975**

One paid store covers the always-on machines ($39 > $14.58). Below that, the machines are a fixed burn with **zero** paid stores. That is not a scale cliff.

### Where $39 stops covering incremental cost

Incremental cost of the next store is **storage**. Compute is already paid.

At 1 KB, 69 months, $0.15/GB, storage eats the whole $39 only above about **4.0 million orders/month** (260 GB on that one store). Lifetimely’s top published self-serve cap is 25,000. **The count is absurd.** There is no realistic store-count of 100–1,500 order shops where $39 fails.

Sensitivity, still labeled, not measured:

| If a stored order is… | 25,000 orders/month × 69 months | vs $39 |
| --- | ---: | --- |
| 1 KB | $0.25 | Fine |
| 100 KB | $24.68 | Fine |
| ~150 KB | ~$37 | Still under |
| ~160 KB | ~$39.50 | Crosses, one whale, full code window |

A 24-month cap at 100 KB and 25,000 orders/month is about **$8.58**, not $24.68. Capping history is the whale control. An order cliff is not.

**Pathological scenario, not a forecast:** 2,000 stores, every one at 25,000 orders/month, 100 KB/order, 69 months. Volume ≈ $49,000 against $78,000 revenue. Margin falls to the mid-30%s **only** if Mcfly’s entire base is Lifetimely-Unlimited whales **and** rows are 100× the planning assumption **and** we keep five years. That base is the whale who will not install this app. Even then, 24 months cuts that storage by 24/69.

**Compute growth** is unmeasured. The toml comment says the current app VM is sized for about 10 concurrent desks. Scenario, not a fact: one extra $11.39 app machine per 10 concurrent sessions. One hundred extra machines is about $1,139/month against $78,000. Still not where $39 breaks. The whale risk is the **backfill queue**, not the machine bill.

---

## Score the four architectures

### 1. Keep $39 forever — choose this

Already undercuts every serious paid tier in the table for a 100–1,500 order store, with one plan and no feature gate (`docs/BILLING_TIERS.md`). Margin at 100 and at 2,000 is the table above. No evidence in this repo that $39 is why reviews are 0. Cutting price without a measured funnel gives away dollars we cannot show we would get back.

### 2. Lower entry, same desk — reject

The only lower dollar worth scoring is **$29** (still $20 under Lifetimely S, $120 under Lifetimely M). It is the same product. It does not fix the $0 Shopify alternative. It does not recruit the whale. There is no labeled-as-fact conversion lift to pay for a 26% cut. **$19** fails the same test harder. Not recommended.

### 3. Two flat plans (24-month desk vs optional older history) — reject

Older history is not the cost. A second plan would be a **feature gate**, which billing docs forbid. The buyer’s job (YoY + 365 LTV) is the 24-month book, so the expensive plan would sell a window the desk does not need. No auto-upgrade does not make a useless second SKU smart. Ship 24 months as the one paid book. Do not price it apart.

### 4. Order cliffs — reject

Uninstall research (2026-09-15) already refuses order-count and GMV pricing. This price fetch confirms the tax is real (Lifetimely $49 → $149 at 501 orders; Triple Whale and Polar step with GMV) and does not show merchants asking to be taxed. A growing store is exactly who gets moved up. Mcfly’s contrast is that order 501 and order 1,500 are still $39.

---

## Tests

**Undercut, at the recommended price ($39), for ~100–1,500 orders/month:**

| Their cheapest serious paid tier | Their price | Mcfly | Mcfly cheaper? |
| --- | ---: | ---: | --- |
| Lifetimely S (≤500 orders) | $49 | $39 | Yes, by $10 |
| Lifetimely M (501–3,000) | $149 | $39 | Yes, by $110 |
| Triple Whale Foundation listing floor | $219 | $39 | Yes. Their real GMV band may be higher. Not fully visible. |
| Polar BI only, under $5M | $625 | $39 | Yes |
| Polar Core / Full Platform, under $5M | $750 | $39 | Yes |

Does **not** undercut: Shopify reports at $0, Lifetimely Free (≤50 orders), Triple Whale Free. Those buyers are not the 100–1,500 order job, or they are not paying anyone.

**Whale vs Fly:** one 25,000 order/month store on the current 69-month window is about $0.25/month of volume at 1 KB, or about $25 at 100 KB. The flat machines stay $14.58 until concurrency forces another VM. Neither blows up $39. The 5-year **backfill** can clog the queue. That is why history should be 24 months, not why price should rise.

**Profitability:** contribution after Fly incremental cost is positive at 100 and at 2,000 under every history policy in the named-buyer stress. See the margin table. Ads ignored. Reviews remain 0.

---

## Recommendation

**REJECT the price change. Keep $39 after a 7-day trial.**

Do this instead, and do not call it pricing: set paid history to **24 months**. Leave trial at 90 days. Leave the formula, the pixel ban, and the one-plan rule alone.

### What would falsify this

- A **measured** byte size per `OrderFact` (not 1 KB) times a real whale, on a 24-month book, above ~$39/month of storage. The 1 KB model says that takes on the order of a hundred-plus KB per order **and** tens of thousands of orders per month **and** a long window. Not seen.
- Lifetimely’s first paid tier (today $49) moving **under $39** on https://useamp.com/pricing.md or the Shopify listing.
- A funnel paste Marty actually provides, showing $39 — not the empty desk, not the 60-day honesty — is why trials do not pay. Until that exists, a lower price is a guess. This brief does not invent that rate.
- Marty accepting a different religion in writing. Until then the lock stands.

**Cursor does not change Partner pricing.** Plans live only in the Partner Dashboard. Marty must accept before anyone edits a price. This challenge is not that acceptance.
