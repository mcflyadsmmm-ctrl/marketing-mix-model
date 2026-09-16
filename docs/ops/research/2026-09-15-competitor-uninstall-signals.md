# Competitor uninstall signals — 2026-09-15

**Lane:** Research. Read-only on `app/**`. No listing paste, no Fly, no invented Mcfly reviews.

**Job:** Tell Conductor **what to audit and refuse**. Founder fear: friction, disappointment, or inaccuracy — especially a **spend wall on first open** — causes uninstalls. Attribution suites get 1-stars for OAuth, pixels, GMV tax, and “numbers don’t match Shopify.” Mcfly’s bet is the opposite: Shopify-depth tabs must be impressive at **$0 spend**; Spend Upload is the later door.

**Religion (do not challenge here):** Total ROAS = Shopify Total Sales ÷ typed spend. Empty spend is not 0×. No pixels / MTA / OAuth zoo / Klaviyo. Public app `read_orders` ~60 days. Mcfly listing [https://apps.shopify.com/mcfly-analytics-public](https://apps.shopify.com/mcfly-analytics-public) · **reviews: 0** · $39 after 7-day. Do not claim Mcfly will make anyone cancel Triple Whale.

**Status marks**

| Mark | Meaning |
| --- | --- |
| **Already on Fly 318** | Visible in this working tree’s routes/components on 2026-09-15. Fly 318 journal (`docs/ops/journal/STATUS_20260915_fly318.md`) confirms certified Total ROAS windows + Allocation cut. Not Admin smoke PASS. |
| **Gap** | Complaint maps to a locked tab, but paint or first-10-seconds honesty is incomplete vs TAB_LOCK / uninstall risk. |
| **Refuse** | Out of religion. Do not build, do not list, do not audit as a feature. |

Tabs: Overview · Customers · Growth · Orders · LTV · Spend Upload · Total ROAS · Channel Allocation · YoY · CPA · Goals. Settings is Admin plumbing, not a 12th analysis tab.

All URLs accessed **2026-09-15**.

---

## A. What 1-stars actually say (shop-owner English)

Attribution suites are not failing because they lack another dashboard. They fail when **day one requires ad accounts / a pixel**, when **the number is not Shopify’s number**, when **the bill is a GMV tax**, or when **support cannot fix a broken connector**. Those are uninstall engines. Mcfly must not copy the engine.

### Triple Whale

Live Shopify listing (accessed 2026-09-15): [https://apps.shopify.com/triplewhale-1](https://apps.shopify.com/triplewhale-1) — **4.1 / 91 reviews**, **16% 1-star (15)**. Pricing on that page: Free, then Foundation **$219/month**, Automate **$749/month**. Feature bullets: Pixel, Compass (MMM + MTA + incrementality), Sonar, Klaviyo, Meta, Google Ads. **External charges may be billed separately from the Shopify invoice.**

| # | Complaint in shop-owner English | Source | Maps to | Status |
| ---: | --- | --- | --- | --- |
| TW1 | “I opened it for one day and the revenue includes VAT. That’s not how I count sales. Also I can’t reach support, and the AI help wants extra credits.” | Shopify App Store, Kove Footwear, 1 day using the app, on [triplewhale-1](https://apps.shopify.com/triplewhale-1) (fetched 2026-09-15) | **Total ROAS** (sales definition must match Shopify Total Sales) · support honesty on every tab | **Already on Fly 318** for Total Sales ÷ typed spend, never 0×. **Refuse** VAT-adjusted P&L as a product. **Gap** if Overview still leads with a blank Total ROAS tile. |
| TW2 | “Integrations are inconsistent, the AI tool crashes, support doesn’t help, so I go back to Meta, Shopify, Recharge.” | Trustpilot, Matt Huttner, 9 Feb 2026, [review 698a294cc7d3432a68883eb4](https://www.trustpilot.com/reviews/698a294cc7d3432a68883eb4) | **Refuse** connector zoo. Analog for Mcfly: if Shopify orders fail to load, they uninstall. | **Already on Fly 318** sales-error retry on Overview / LTV. **Refuse** Recharge/Meta OAuth. |
| TW3 | “Daily revenue is wrong, whole order blocks missing, marketplace orders show as conversions that never hit Shopify. Support is friendly and useless. Months of tickets.” | Trustpilot, XTRA FUEL, 9 Nov 2025, [review 6910c5dac0f413a9a5cc8adb](https://www.trustpilot.com/reviews/6910c5dac0f413a9a5cc8adb) | **Refuse** marketplace attribution. Analog: never invent orders Shopify didn’t send. | **Already on Fly 318** live-sales / truncated-today banners. **Refuse** Amazon/marketplace pixels. |
| TW4 | “The pixel is not Shopify. Expect a 10–18% gap vs native Shopify. Wait one customer journey (often 30–45 days) before trusting it. Price went up hard.” | Seller Stacked Triple Whale review 2026, [sellerstacked.co/blog/triple-whale-review](https://www.sellerstacked.co/blog/triple-whale-review) (accessed 2026-09-15) | **Refuse** pixels. **Spend Upload** is typed spend, not a 30-day learning pixel. | **Refuse** pixel. **Gap** if first open implies “connect ads to be useful.” |
| TW5 | Onboarding: connect shop → **install pixel** → **connect ad platforms via OAuth** → add UTMs. “Without the pixel we’ve lost visibility.” Blended ROAS is wrong if a channel is missing. | Triple Whale onboarding (Help Center / setup guides): [Onboarding Guide](https://kb.triplewhale.com/en/articles/5677051-onboarding-guide-account-setup), [Meta Ads Integration](https://kb.triplewhale.com/en/articles/9507673-meta-ads-integration), [MHI setup](https://mhigrowthengine.com/blog/triple-whale-dtc-setup/) (accessed 2026-09-15) | **Refuse** pixel + OAuth. Mcfly analog: **Spend Upload** must be optional, not a gate. | **Gap:** Overview still paints Total ROAS + Ad spend KPIs at $0 spend (`OverviewFirstViewport`). TAB_LOCK: Overview is three YoY **sales** cards; spend is not on that page. |
| TW6 | Meta OAuth “may disconnect” (password, expired auth, permissions). Reconnect; wait 30–60 minutes. | [Meta Ads Integration](https://kb.triplewhale.com/en/articles/9507673-meta-ads-integration) | **Refuse** OAuth. | **Refuse** |
| TW7 | Pixel is **not retroactive**; 5–7 day learning phase; UTMs required on ads. | [Triple Pixel explainer](https://www.triplewhale.com/blog/triple-pixel) (accessed 2026-09-15) | **Refuse** | **Refuse** |
| TW8 | Small shops: “UI is overload, full of bugs; if we didn’t have historical data locked in I would change.” | Shopify App Store, BioPower Pet, 2 Apr 2026, cited via [apps.shopify.com/reviews/2147338](https://apps.shopify.com/reviews/2147338) | **Overview** / Shopify five must be a calm desk, not a SaaS cockpit. | **Gap** vs TAB_LOCK compression (Overview still a KPI wall + chart + YoY). |

**Conductor refuse from Triple Whale:** pixels, Moby/AI analyst, Compass/MTA/incrementality, ad-account OAuth, Klaviyo, GMV/usage add-ons, “wait weeks for the number.” **Audit:** first viewport must not look like TW onboarding (pixel + ads) with a blank ROAS.

### Polar Analytics

Live Shopify listing (accessed 2026-09-15): [https://apps.shopify.com/polar-analytics](https://apps.shopify.com/polar-analytics) — **4.9 / 117 reviews**, **3% 1-star (3)**. Listing price: **Core from $750/month, based on online GMV**. Copy: 45+ connectors, P&L, Klaviyo abandoner recovery, **server-side pixel**, Meta/Google/TikTok/Amazon/Klaviyo.

Shopify’s lowest-rated sort still led with 5-stars on fetch; 1-star **bodies** cited from aggregators + Trustpilot.

| # | Complaint in shop-owner English | Source | Maps to | Status |
| ---: | --- | --- | --- | --- |
| PO1 | “I installed, tried to log in with Gmail, it said private emails aren’t allowed, so I can’t use it at all.” ~5 minutes on the app. | AppNavigator 1-star, Minseart, 25 Mar 2025, [appnavigator.io/app/polar-analytics/reviews](https://appnavigator.io/app/polar-analytics/reviews/) | First-session **login/OAuth wall**. Mcfly analog: Sample vs Live confusion, or spend required before sales paint. | **Refuse** extra logins. **Audit** Settings Sample \| Live and cold Overview. |
| PO2 | “Shopify install price was not the sales price. $750+ and they still don’t have a basic YoY revenue line chart. Inventory ×6 across six shops. Support says it’s fixed; it isn’t. I have to chase them.” | Trustpilot, Maja, 7 Nov 2025, [review 690da52c91938d8e1b9286b7](https://www.trustpilot.com/reviews/690da52c91938d8e1b9286b7) | **YoY** (sales YoY is the Overview job). **Refuse** inventory/P&L. Flat **$39** is the pricing contrast — do not GMV-tax. | **Already on Fly 318** Overview YoY cards + `/app/yoy`. **Refuse** inventory connectors. **Gap** if YoY paints last year as $0. |
| PO3 | Vendor docs: numbers often **won’t match Shopify Home**. Compare to reports/CSV, not the homepage. Refund date vs order date. Polar is “analytics,” Shopify is “operational.” Integrity tests tolerate **1.5% orders / 5% sales**. | [Polar discrepancy guide](https://intercom.help/polar-app/en/articles/6728881-troubleshooting-data-discrepancies-between-shopify-and-polar) (updated 10 Jul 2026); [Data Integrity Reports](https://intercom.help/polar-app/en/articles/15399439-data-integrity-reports); [Shopify connector](https://intercom.help/polar-app/en/articles/11657755-shopify) (OAuth + up to 24h first sync) | **Overview** / **Orders** must be Shopify Total Sales, not a second definition. | **Already on Fly 318** Total Sales clocks. **Refuse** “analytics vs operational” second books. |
| PO4 | GMV tax: Core **$750/mo** under $5M GMV, rising with revenue for the same feature set (competitor comparison page). | Polar listing; [Lifetimely vs Polar pricing](https://useamp.com/alternatives/lifetimely-vs-polar-analytics/) (accessed 2026-09-15) | **Refuse** GMV pricing. Mcfly stays $39/store/month. | **Refuse** |
| PO5 | Product is connectors + pixel + Klaviyo journeys + P&L. That’s the listing. | [polar-analytics listing](https://apps.shopify.com/polar-analytics) | **Refuse** all of it as Mcfly scope. | **Refuse** |

**Conductor refuse from Polar:** $750 GMV tax, 45 connectors, pixel, Klaviyo, P&L, inventory, 24h “wait for sync” as the first experience. **Steal the complaint, not the product:** merchants still export to Sheets until one Shopify-native screen is faster (Colorful Standard 5-star even says they left a slow Sheets setup — that is Polar’s win, not ours to copy with connectors).

### Northbeam

Northbeam is not a $39 Shopify app. Public 1-star pile is on G2/industry writeups; vendor docs are the cleaner signal.

| # | Complaint in shop-owner English | Source | Maps to | Status |
| ---: | --- | --- | --- | --- |
| NB1 | **Vendor:** “Northbeam and Shopify reports will rarely match exactly, and that’s expected.” Compare to **Orders export**, not Analytics. Gift cards, test orders, refunds dated differently. Default Northbeam revenue does not deduct refunds; Shopify Total Sales does. | [Northbeam: Why doesn’t Northbeam match my Shopify reporting](https://docs.northbeam.io/docs/why-doesnt-northbeam-match-my-shopify-reporting) (accessed 2026-09-15) | **Overview** / **Total ROAS** numerator = Shopify Total Sales (returns included). Never a second “true revenue.” | **Already on Fly 318** Total Sales + returns clocks. **Refuse** Northbeam-style formula pickers. |
| NB2 | POS orders off by default; Amazon and other sources inflate “Total Revenue” vs Shopify. | Same Northbeam doc | **Orders** Online / POS / Shop mix from Shopify `source_name`. **Refuse** Amazon connectors. | **Already on Fly 318** source mix on Orders. **Refuse** extra revenue sources. |
| NB3 | Onboarding needs a pixel, UTM hygiene, first-party piping. Sub-$5M brands get dashboards of their implementation gaps. Cost often $1k–2.5k+/mo, annual contracts. | [D2C Times Northbeam piece](https://d2c-times.com/how-northbeam-became-dtcs-most-debated-attribution-platform-2/); [WiserReview Northbeam alternatives 2026](https://wiserreview.com/blog/northbeam-alternatives/) (accessed 2026-09-15) | **Refuse** | **Refuse** |
| NB4 | Reddit: “We’ve been running side-by-side tracking and **no two dashboards agree on anything.** Which is closest to actual Shopify revenue?” | [r/ShopifyAttribution](https://www.reddit.com/r/ShopifyAttribution/comments/1o30kg7/triple_whale_vs_northbeam_vs_hyros_whos_getting/) (10 Oct 2025) | Mcfly answer is **match Shopify**, not “least wrong attribution.” | **Refuse** MTA bake-off. **Audit** that Mcfly never disagrees with Shopify Total Sales for the same window. |

**Conductor refuse from Northbeam:** MTA, pixels, POS-optional ingestion, multi-source “Total Revenue,” formula customization that silently drops refunds.

### Lifetimely (and similar LTV/P&L apps)

Live listing (accessed 2026-09-15): [https://apps.shopify.com/lifetimely-lifetime-value-and-profit-analytics](https://apps.shopify.com/lifetimely-lifetime-value-and-profit-analytics) — **4.9 / 537**, **2% 1-star (10)**. Most 5-stars praise LTV + human support. 1-stars and exit writeups are the uninstall signal.

| # | Complaint in shop-owner English | Source | Maps to | Status |
| ---: | --- | --- | --- | --- |
| LT1 | “I wanted 90-day LTV and payback without a spreadsheet. Native Shopify made me export.” (5-star cluster, still a native gap) | Lifetimely listing reviews; Pacas on Repeat Customer Insights: “stay on top of LTV. Easy to export” [RCI listing](https://apps.shopify.com/repeat-customer-insights) | **LTV** | **Already on Fly 318** `/app/ltv` first 90 / 30 / 365 from orders. **Gap** if 60-day window is not obvious and first-year looks empty-as-zero. |
| LT2 | “Support is slow, prices don’t load, €150/mo is too much — I switched while waiting.” | AppNavigator 1-star, Sellsbydanchic, 23 May 2025, [review 1741069](https://appnavigator.io/app/lifetimely-lifetime-value-and-profit-analytics/reviews/1741069) | Support + simplicity. Mcfly $39. **Refuse** becoming a P&L suite to “cover everything.” | **Refuse** P&L. **Audit** LTV empty states. |
| LT3 | “Amazon add-on is as expensive as Shopify and buggy for months after they said it was fixed.” | Taranker 1-star filter, [Lifetimely 1-stars](https://taranker.com/shopify-lifetimely-lifetime-value-and-profit-analytics-app-customer-reviews?filter-by=1) | **Refuse** Amazon. | **Refuse** |
| LT4 | Order-volume tax: BFCM spike auto-upgrades the month; no opt-out. High-order low-AOV shops overpay. | [Saras Lifetimely pricing 2026](https://www.sarasanalytics.com/blog/lifetimely-pricing) (accessed 2026-09-15) | **Refuse** usage/GMV/order-count pricing. | **Refuse** (keep flat $39) |
| LT5 | Exit reason in competitor content: brands leave LTV-only apps for **contribution margin / COGS / ad-platform P&L**, not because LTV was wrong. | [Saras Lifetimely alternatives](https://www.sarasanalytics.com/blog/lifetimely-alternatives) | **Refuse** COGS P&L as the product. Optional margin in Settings already feeds LTV “kept after margin” — do not turn LTV into TrueProfit. | **Refuse** P&L engine. **Already on Fly 318** optional Cash CAC **only if spend is typed**. |

Repeat Customer Insights is the **named-job** craft to steal (cohorts, LTV, human support, $59+), not Klaviyo sync. Developer even published “omg who will buy such an expensive tool?” ([Little Stream](https://www.littlestreamsoftware.com/articles/omg-who-will-buy-such-an-expensive-tool/)). Mcfly’s $39 is below that band; the retention bet is **Shopify-native depth at $0 spend**, not RFM→Klaviyo.

---

## B. Cross-suite uninstall pattern → Mcfly analog

| Competitor pattern | Why they uninstall | Mcfly analog (audit) | Status |
| --- | --- | --- | --- |
| Pixel / OAuth / ad accounts on day one | App is a brick until ads are connected | **Spend wall on Overview** (ROAS/spend tiles at $0) | **Gap** vs TAB_LOCK |
| Numbers ≠ Shopify | “I don’t trust this” | Empty as 0×, last year as $0, LTV $0 inside 60-day | **Already on Fly 318** honesty strings exist; **audit** they paint on every Shopify tab |
| GMV / order-volume tax | Bill jumps when they grow | Do not add a second tier | **Refuse** |
| Connector breakage | Support tickets, then uninstall | Do not add connectors | **Refuse** |
| AI analyst wrong | Sidekick-class distrust | No Moby clone | **Refuse** |
| Weak Shopify-native depth | “I still open Analytics + Sheets” | Shopify five must beat Overview+Reports for typical order, returning $, second-order, hour/weekend, 90-day LTV | See sibling `2026-09-15-shopify-analytics-gaps.md` |
| Historical data lock-in | Too expensive to leave | Mcfly has **0 reviews / no lock-in story**. First week must work without spend or they never start. | **Audit** trial, not ads |

---

## C. Must-not-chase list (Refuse)

Do **not** build, list, or “just add a connector” for:

1. **Pixels / web pixels / Triple Pixel / Polar server-side pixel / Northbeam pixel**
2. **MTA / path / view-through / Compass / incrementality / “true ROAS”**
3. **Meta / Google / TikTok / Amazon OAuth** (spend is typed or CSV)
4. **Klaviyo, email CRM, overdue-to-email lists, abandoner recovery**
5. **P&L / COGS engine / inventory / multi-store warehouse**
6. **`read_all_orders` as the product** (60-day honesty stays; longer history is a Challenge Gate, not a silent scope)
7. **AI analyst / Moby clone / Sidekick competitor**
8. **Platform CPA / Ads Manager CPA** (CPA tab is cash = typed spend ÷ Shopify buyers)
9. **Sessions, conversion rate, SKU/product BI, GraphQL report builder**
10. **GMV-priced or order-count-priced second plan**
11. **Claiming Mcfly replaces Triple Whale / Polar / Northbeam**

---

## D. What to steal (craft only)

- One home that works before connectors (Polar/TW ritual — **without** their stack).
- Named job + human support (Lifetimely / Repeat Customer Insights).
- Removing the **export → Sheets** loop for the five Shopify questions (Better Reports / Data Export category) — not adding more exports.

Sibling files: `2026-09-15-shopify-analytics-gaps.md` (native complaints) · `2026-09-15-tab-vs-complaints.md` (11-tab uninstall matrix).
