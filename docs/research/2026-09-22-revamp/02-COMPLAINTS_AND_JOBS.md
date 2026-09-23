# Complaints + Jobs-to-Be-Done — 2026-09-22

**Lane:** Research COMPLAINTS + JTBD (revamp Wave R).  
**Only output:** this file. No product code, no Fly, no invented Mcfly social proof.  
**Mcfly listing:** [https://apps.shopify.com/mcfly-analytics-public](https://apps.shopify.com/mcfly-analytics-public) · **reviews: 0** · 7-day trial then **$39**/store/month.  
**Religion:** Total ROAS = Shopify Total Sales ÷ entered spend; empty spend = **—** not 0×; no pixels / MTA / ad OAuth.  
**PCD L2:** Pending — may note ShopifyQL desire; **do not** claim Analytics parity as shippable.  
**Reviews gate:** Founder owns 5-store outreach. Reviews are **not** a ship gate for this brief.

**Sources:** Fresh web pulls 2026-09-22 + prior lane docs under `docs/ops/research/` (esp. 2026-09-15 competitor uninstall / Shopify gaps / tab-vs-complaints / tab-uninstall-audit) and `docs/research/LIFETIMELY_ANALYTICS_STEAL_MAP_20260918.md`. Sibling pack: `README.md` in this folder.

---

## Executive summary

DTC Shopify merchants who buy ads do not pay $39 for “another Analytics.” They pay to **stop exporting**, to see **sales quality and repeat dollars** without a report hunt, and to put **typed spend next to Shopify sales** without pretending path credit is truth.

Native Shopify Analytics complaints cluster on **UX regression after the redesign**, **metrics that don’t match each other**, **buried / missing operator metrics** (median ticket, returning **dollars**, hour/weekend without a spreadsheet), and **distrust of Sidekick**. Competitor 1-stars and exit themes are not “needs more MTA” — they are **day-one setup walls** (pixel, OAuth, login), **numbers ≠ Shopify**, **GMV / order-volume tax**, **connector breakage**, and **support that cannot fix the number**.

Jobs that convert and retain at $39: (1) morning cash read — up/down vs last year from Shopify sales; (2) spend vs sales as honest Total ROAS / MER when spend is typed; (3) new vs returning **dollars** + early LTV / second-order timing from order history. Jobs Mcfly must **refuse** as claims: platform/true/path ROAS, pixel truth, ShopifyQL parity while L2 is pending.

Day-0 uninstall is won or lost in the **first 10 minutes**: a blank ROAS/spend cockpit before sales value, any lie that paints missing history as $0, or a product that looks like Triple Whale without the connectors. Keepers open the Shopify five at $0 spend, feel “I don’t need Sheets for this,” then type spend later.

---

## Complaint theme table

| Theme | Evidence links | Mcfly implication |
| --- | --- | --- |
| **Native Analytics redesigned / “useless for basic ops”** — can’t get product sales by date, visitors buried, “NO DATA,” bookkeeping broken | [r/shopify — What happened to Shopify analytics](https://www.reddit.com/r/shopify/comments/1i2jh0a/what_the_fuck_happened_to_shopify_analytics/); [r/shopify — report update / accountant breakdown](https://www.reddit.com/r/shopify/comments/1jahuwi/ever_since_the_report_update_i_cant_get_the_same/); [Community — Revert old Analytics](https://community.shopify.com/t/shopify-needs-to-revert-back-to-old-analytics/418200) | Win by **compressing** the 3–5 questions they still open Reports/CSV for — not by mirroring every native chart. Calm desk > “new Analytics clone.” |
| **Inconsistent / untrustworthy native numbers** (reports disagree; live view lies; tax vs Finances) | Same Community thread; [US tax report ≠ Finances Summary](https://community.shopify.com/t/new-united-states-sales-tax-report-does-not-match-finances-summary/282711) | One definition: **Shopify Total Sales** for windows we claim. Never a second “analytics revenue.” Tax/P&L county reports are **out of scope** (refuse). |
| **AOV is a mean; merchants want median / typical ticket on the front page** | [Community median order value 2023–2025](https://community.shopify.com/t/how-can-we-calculate-median-order-value-in-shopify-analytics/254046) (“pretty basic”; still unanswered as native); Shopify Help: AOV is a **mean** ([sales reports](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/sales-report)) | **Orders** owns typical (median) + “Shopify uses the average.” Do not bury under ROAS. |
| **Returning customer *rate* is headcount, not dollars** | [Staff Ivy_4 formula](https://community.shopify.com/t/how-is-the-returning-customer-rate-calculated-in-analytics/217973); [New vs Returning confusion](https://community.shopify.com/t/new-vs-returning-customer/408807); plan-gated sales report + export ([extract analytics](https://community.shopify.com/t/how-can-i-extract-specific-data-from-analytics-reporting/131388)) | **Customers** hero = returning **$**. Never sell Overview as “returning rate like Shopify.” |
| **Hour / weekend / same-hours YoY buried → spreadsheet** | [New analytics comparison issues](https://community.shopify.com/t/new-analytics-issues-with-comparisons/387984); Help: Group by hour/weekday exists but not Overview | Fold timing into **Orders**. Refuse a 12th Timing tab. |
| **Sidekick / AI analyst hallucinates sales** | [r/shopify Sidekick caution](https://www.reddit.com/r/shopify/comments/1m4169l/be_extremely_careful_with_sidekick/); [Thoughts on Sidekick](https://www.reddit.com/r/shopify/comments/1pk1xcd/thoughts_on_sidekick/); [Tante-E Sidekick test](https://tante-e.com/en/blogs/tante-e-blog/shopify-sidekick-test) | **Refuse** Moby/Sidekick clone. Honest YoY cards + coverage lines beat “AI said $0 sales.” |
| **Export → Sheets → ChatGPT loop** (workflow real; % unknown — do not invent) | [r/shopify AI on CSV](https://www.reddit.com/r/shopify/comments/1mvgiyn/ai_tool_or_analysist_for_ecommerce/); Coupler/Shopify→ChatGPT writeups; Admin [order export](https://help.shopify.com/en/manual/orders/manage-orders/exporting-orders) | Retention = remove the loop for Shopify five jobs. Refuse “paste CSV into LLM” as a feature. |
| **~60-day public-app order window** (year charts / “lifetime” lie if painted as full history) | [shopify.dev access scopes](https://shopify.dev/docs/api/usage/access-scopes); changelog: approval for >60 days | Always disclose coverage. Missing last year / LTV-365 = **not on file**, never $0. L2 PCD pending ≠ claim ShopifyQL year parity. |
| **Triple Whale: day-one pixel + OAuth; revenue definition fights; support/AI fail** | Listing [triplewhale-1](https://apps.shopify.com/triplewhale-1) (4.1 / ~91; ~16% 1-star as of 2026-09-15 research); Trustpilot [Matt Huttner](https://www.trustpilot.com/reviews/698a294cc7d3432a68883eb4), [XTRA FUEL](https://www.trustpilot.com/reviews/6910c5dac0f413a9a5cc8adb); [Seller Stacked pixel gap](https://www.sellerstacked.co/blog/triple-whale-review); [TW onboarding](https://kb.triplewhale.com/en/articles/5677051-onboarding-guide-account-setup); [r/analytics TW feedback](https://www.reddit.com/r/analytics/comments/18vgrea/feedback_on_triple_whale/); [r/PPC attribution swing](https://www.reddit.com/r/PPC/comments/1bj9fx9/triple_whale_attribution_issue/); [Meta 9x / GA4 / TW 0.6x](https://www.reddit.com/r/PPC/comments/1sr44si/meta_telling_me_9x_roas_ga4_shows_next_to_no/) | **Refuse** pixel/OAuth/MTA theater. Steal the **pain**: first open must work without ads. Own **cash Total ROAS** that matches Shopify sales when spend is typed. Never claim “cancel Triple Whale.” |
| **No two attribution dashboards agree** | [r/ShopifyAttribution TW vs Northbeam vs Hyros](https://www.reddit.com/r/ShopifyAttribution/comments/1o30kg7/triple_whale_vs_northbeam_vs_hyros_whos_getting/); [Northbeam: won’t match Shopify](https://docs.northbeam.io/docs/why-doesnt-northbeam-match-my-shopify-reporting) | Positioning: **match Shopify**, not “least wrong attribution.” |
| **Polar: GMV tax, pricing bait, sync lag, numbers ≠ Home, login wall** | Listing [polar-analytics](https://apps.shopify.com/polar-analytics) (~$750/mo Core by GMV); Trustpilot [Maja / pricing + YoY](https://www.trustpilot.com/reviews/690da52c91938d8e1b9286b7); [Polar discrepancy guide](https://intercom.help/polar-app/en/articles/6728881-troubleshooting-data-discrepancies-between-shopify-and-polar); AppNavigator Gmail wall (Minseart, cited in 2026-09-15 research); [Eightx Polar pricing](https://eightx.co/blog/compare/how-much-does-polar-analytics-cost) | Flat **$39** contrast. Steal “one home before connectors.” Refuse 45 connectors / pixel / GMV tax. Overview YoY sales is Polar’s missing “basic YoY line” complaint — own it. |
| **Lifetimely: price / support / Amazon add-on / order-volume tax** (product praised; exits are cost & complexity) | Listing [lifetimely…](https://apps.shopify.com/lifetimely-lifetime-value-and-profit-analytics) (~4.9 / 537; ~2% 1-star); [AppNavigator 1-stars](https://appnavigator.io/app/lifetimely-lifetime-value-and-profit-analytics/reviews/?rating=1); [Sellsbydanchic €150/support](https://appnavigator.io/app/lifetimely-lifetime-value-and-profit-analytics/reviews/1741069); [Saras Lifetimely pricing](https://www.sarasanalytics.com/blog/lifetimely-pricing); Amp cancel = uninstall + data wipe ([help](https://help.useamp.com/article/1126-cancelling-subscription)) | Steal **named LTV / cohort craft** + human support tone. Refuse P&L engine, Amazon, order-volume ladder. Ship **90-day order LTV** with 60-day honesty. |
| **Peel: sparse 1-stars on Shopify; trust/outage/pricing themes in secondary chatter** | Shopify [peel-insights reviews](https://apps.shopify.com/peel-insights/reviews) (38× 5-star, **0** 1-stars on fetch); [EcommRumble](https://ecommrumble.com/fighters/peel-insights) (TikTok Shop reconcile, outage+support dark); Zoftware: high price for large GMV | Do **not** invent Peel 1-star volume. Implication still holds: **number trust + uptime + price honesty**. Mcfly stays Shopify-order-native; refuse channel-pipe theater that can disagree with Shopify. |
| **MER / blended cash ROAS is how serious DTC judges spend** (not Meta ROAS) | [MHI MER guide](https://mhigrowthengine.com/blog/dtc-mer-guide/); [ROAS HACK MER playbook](https://roashack.com/blog/marketing-efficiency-ratio-playbook/); [AdSplicit weekly KPI](https://adsplicit.com/en/blog/weekly-kpi-dashboard-dtc-brands/); [r/DTCshopifybrandGrowth MER vs daily](https://www.reddit.com/r/DTCshopifybrandGrowth/comments/1oigo1z/what_metric_truly_drives_your_daily_budget_calls/) | Total ROAS = **MER-class** (sales ÷ entered spend). Copy must say **honest cash**, not “true ROAS” / path credit. Rolling windows > single-day noise. |

**Cross-suite uninstall engine (from 2026-09-15 competitor research, still valid):** pixel/OAuth day one → brick; numbers ≠ Shopify → distrust; GMV tax → churn; connectors break → support death spiral; AI wrong → Sidekick-class bounce. Mcfly must not copy the engine.

---

## JTBD ranked list

Ranked for **DTC Shopify merchants who buy ads** and might pay **$39** after trial. Fit = how well Mcfly religion + shipped direction can own the job (1 = refuse/weak, 5 = core wedge).

| Rank | Job (when / want / so that) | Why paid vs free native | Mcfly fit (1–5) |
| ---: | --- | --- | ---: |
| 1 | **Morning cash read** — When I open Admin in the morning, I want “am I up or down vs last year (same window)” from Shopify sales, so I know whether to panic or scale **without Sidekick or a compare that is full-day-only**. | Native Overview is this period’s sales + rate cards; YoY/same-hours compare and honesty are painful or AI-untrusted. | **5** — Overview three YoY sales cards; $0 spend. |
| 2 | **Spend next to sales (cash Total ROAS / MER)** — When I’ve typed (or CSV’d) what we spent, I want sales ÷ that spend over Yesterday / 7 / 28 / MTD, so Meta’s ROAS doesn’t run the P&L meeting. | Native has no spend ledger. Attribution suites sell path ROAS and disagree with Shopify. | **5** — religion core; empty = — not 0×. |
| 3 | **New vs returning dollars (+ who came back)** — When I plan acquisition vs retention spend, I want **$ from first-timers vs returning**, days to second, 2nd in 30 days — not an 8% headcount rate. | Native rate misleads; returning-sales report often plan-gated → export. | **5** — Customers + Growth. |
| 4 | **Typical order economics** — When AOV looks “healthy” from one wholesale ticket, I want median ticket, discount share, basket depth, weekend/hour — so staffing and promos aren’t lied to by the mean. | Median still missing natively (Community 254046); hour Group-by buried. | **5** — Orders. |
| 5 | **Early order LTV / payback intuition** — When I set CAC ceilings, I want first 30/90-day revenue from **orders on file**, so I don’t wait for a P&L suite. | Lifetimely/RCI/Peel exist because Overview isn’t an LTV desk; expensive or connector-heavy. | **4** — LTV 90-day hero; 365 limited by 60-day API (honesty required). |
| 6 | **Returns lag honesty** — When a day looks huge, I want returns/edits visible so I don’t celebrate gross that will reverse. | Native Total Sales includes reversals but operators still export; apps that ignore refunds lose trust (Northbeam default revenue note). | **4** — already in Orders/clocks religion; keep front-of-mind in copy. |
| 7 | **Typed channel mix / cash CPA** — When spend is on file, I want “where did we say the dollars went” and cash CPA — not Ads Manager CPA. | Platform CPA ≠ cash; allocation from pixels is theater. | **3** — chapter two after Shopify five; refuse platform CPA. |
| 8 | **Sales vs plan / goals** — When I have a monthly sales target, I want actual vs plan without a spreadsheet. | Native is descriptive, not a plan board. | **3** — Goals at $0 spend; ROAS target optional. |
| 9 | **Cohort / RFM / predictive LTV / subscription churn BI** | Peel/Lifetimely deep craft; merchants pay for specialist retention OS. | **2** — steal shallow second-order + 90-day LTV; refuse Peel-depth CRM. |
| 10 | **Path / MTA / “true ROAS” / incrementality** | Attribution theater buyers; high ASP tools. | **1** — **refuse** as claim and product. |
| 11 | **ShopifyQL / custom report builder parity** | Power users + agencies. | **1** until PCD L2 — research OK; **no ship claim**. |
| 12 | **Tax by county / multi-store inventory / Amazon P&L** | Compliance / ops edge cases in Community. | **1** — refuse. |

### Top 3 JTBD Mcfly should win

1. **Morning cash YoY sales read** (Overview at $0 spend).  
2. **Honest cash Total ROAS / MER** once spend is entered.  
3. **New vs returning dollars + early repeat timing** (Customers / Growth).

---

## Day-0 uninstall killers (ranked)

Same-day uninstall / bounce-to-Analytics. Grounded in competitor 1-stars + 2026-09-15 tab-uninstall audit of the desk.

| Rank | Killer | Why it kills in minutes | Counter-move |
| ---: | --- | --- | --- |
| 1 | **Spend / blank ROAS wall on first open** | Same motion as TW pixel + Polar login: “not useful until I connect ads.” Even em-dash ROAS on home reads as ads cockpit. | Overview = YoY **sales** first; Spend Upload is a later door, not equal CTA. |
| 2 | **Number is not Shopify’s (or missing painted as $0)** | Instant “I don’t trust this” — TW VAT-in-revenue, Northbeam/Polar discrepancy docs, Sidekick false $0. | Total Sales clocks; YoY missing ≠ $0; LTV-365 not a fake year; coverage line on every Shopify tab. |
| 3 | **Tile wall / SaaS cockpit density** | TW “UI overload” 1-star class; native already shows sales charts. | First viewport: one job, few numbers, one next link (Orders or Customers). |
| 4 | **Looks like attribution product without delivering attribution** | Listing/site scream “true ROAS” → uninstall when no pixel appears. | Copy: spend next to sales / cash Total ROAS; never path credit. |
| 5 | **“This year / First year” overclaim inside ~60 days** | Sidekick-class distrust when YTD or LTV-365 looks complete. | Same-window / history-limited copy on the card face. |
| 6 | **Returning shown as headcount rate on home** | “Just Shopify with extra clicks.” | Returning **$** on Customers; omit rate as home hero. |
| 7 | **Setup friction / second login / wait for sync** | Polar Gmail wall (~5 min uninstall); Polar 24h sync; TW learning pixel. | Live Shopify orders paint immediately; Sample labeled; no OAuth. |
| 8 | **Price surprise / GMV tax vibe** | Polar install price ≠ sales quote; Lifetimely order-volume surprises. | Flat $39 everywhere (site, listing, app). |
| 9 | **Empty CPA / ROAS looking “broken” ($0 or three dashes with no lede)** | Merchant thinks the product failed, not that spend is optional. | Honest empty lede + one CTA; never $0 CPA / 0× ROAS. |
| 10 | **AI sentence that disagrees with Shopify** | Sidekick scar tissue. | No analyst. Optional “what to notice” from order facts only. |

**Not day-0 killers (usually):** Spend Upload form density; Allocation polish; Goals Grow-10% needing last year; 11-tab nav *if* Overview greeting works.

---

## Copy / product do & don’t (revamp)

### MUST own (say and ship)

| Do | Why |
| --- | --- |
| **Spend next to sales** / **honest cash Total ROAS** = Shopify Total Sales ÷ **entered** spend | MER-class job merchants already use Sheets for. |
| **Works before you add spend** — sales desk first | Competitor day-one walls are the uninstall engine. |
| **Order LTV** (30/90 from orders on file) + second-order timing | Lifetimely/RCI named job without P&L tax. |
| **Returning dollars**, **typical (median) order**, returns included | Native gaps with durable Community evidence. |
| **~60-day order window** disclosed; missing ≠ $0 | Scope honesty > fake lifetime. |
| **Flat $39 / 7-day trial**; no GMV or order-count tax | Polar/Lifetimely exit theme. |
| **Match Shopify Total Sales** for the same window | Attribution suites lose on this. |

### NEVER claim (product or mcflyads.com)

| Don’t | Why |
| --- | --- |
| Pixels, Triple Pixel, server-side pixel, “install tracking” | TW/Polar onboarding; out of religion. |
| Path / multi-touch / view-through / incrementality / **true ROAS** / “real attribution” | Theater merchants already distrust; Reddit bake-offs never converge. |
| Platform ROAS / Meta CPA parity | Wrong denominator and window by design. |
| “Replace Triple Whale / Polar / Northbeam” | Different ASP and job; invites 1-star comparison on connectors we refuse. |
| ShopifyQL / full Analytics parity | **PCD L2 pending** — research only. |
| Invented Mcfly **reviews, install counts, GMV tracked** | Reviews = **0**; founder owns outreach. |
| “% of merchants export to Sheets” | Workflow real; incidence unverifiable. |
| AI analyst that answers sales questions | Sidekick scar tissue. |
| COGS/P&L/inventory/Amazon/Klaviyo as the product | Lifetimely/Polar gravity; not the $39 wedge. |
| `read_all_orders` / “full lifetime history” as shipped promise | Scope + Challenge Gate only. |

### First 10 minutes in-app (implication)

1. Install → Overview paints **YoY sales** (or calm sales hero) with coverage line — **no** ROAS/spend KPI competing.  
2. One click to **Orders** (median) or **Customers** (returning $) — merchant feels depth vs native.  
3. Quiet line: add spend later for Total ROAS; empty ≠ 0×.  
4. If they open LTV: 90-day hero; First year honest if limited.  
5. Only then Spend Upload → Total ROAS explorer.

### mcflyads.com copy (implication)

- Hero: brand + **Spend next to sales** / sales desk that works before spend — not a pixel screenshot.  
- Proof: formula clarity + Shopify Total Sales — **not** fake review widgets or install counts.  
- Contrast: flat $39 vs GMV tax / OAuth zoo — without naming “we beat TW attribution.”  
- Secondary: morning YoY, returning $, typical order, order LTV — then Total ROAS.  
- No ShopifyQL parity claim while L2 pending.

---

## Top 8 ship implications (product or site) — no code

1. **Overview greeting = sales YoY job, zero spend wall** — Demote/remove blank Total ROAS + Ad spend from first viewport; three YoY sales cards (or equivalent calm sales-first hero) win the morning JTBD.  
2. **Site + listing lead with “works at $0 spend” then Total ROAS** — Align mcflyads.com and App Store narrative with the desk ritual; stop screenshotting three-year ROAS as stranger #1.  
3. **Shopify five honesty pass** — Coverage + truncated/incomplete banners on Customers / Growth / Orders / LTV; never seal incomplete as “live year.”  
4. **LTV First-year / YTD copy discipline** — History-limited and same-window notes on the card face so day-0 doesn’t feel Sidekick-wrong.  
5. **Orders + Customers as the demo path** — Site/product tours should show median ticket and returning **dollars** before Spend Upload.  
6. **Total ROAS page owns MER ritual** — Certified windows + empty = —; teach rolling 7/28 in copy; never “true ROAS.”  
7. **Pricing contrast on site** — Flat $39 vs “from $750 GMV” / order-volume ladders — factual, no invented competitor review scores.  
8. **Explicit refuse list in revamp spec** — Pixels, MTA, OAuth, AI analyst, ShopifyQL parity (until L2), GMV pricing, claiming TW replacement — so Phase P does not “just add a connector.”

---

## Source index (primary + prior lane)

| Kind | Path / URL |
| --- | --- |
| Prior uninstall | `docs/ops/research/2026-09-15-competitor-uninstall-signals.md` |
| Prior native gaps | `docs/ops/research/2026-09-15-shopify-analytics-gaps.md` |
| Prior matrix | `docs/ops/research/2026-09-15-tab-vs-complaints.md` |
| Prior desk audit | `docs/ops/research/2026-09-15-tab-uninstall-audit.md` |
| Prior insights | `docs/ops/research/2026-09-10-independent-insights.md` |
| Lifetimely steal map | `docs/research/LIFETIMELY_ANALYTICS_STEAL_MAP_20260918.md` |
| Mcfly listing | https://apps.shopify.com/mcfly-analytics-public (reviews **0**) |

---

*End of COMPLAINTS + JTBD brief. Conductor synthesizes into `REVAMP_SPEC.md` after siblings `01`, `03`, `04` land.*
