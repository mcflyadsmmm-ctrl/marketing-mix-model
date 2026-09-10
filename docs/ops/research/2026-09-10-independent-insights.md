# Independent research absorb — 2026-09-10

Three briefs landed the same day. **Price was one row.** The product argument is: Mcfly wins by compressing the export→Sheets/ChatGPT loop into a calm first viewport that works at $0 spend — not by adding more tiles, and not by selling spend-first on the listing while the desk is sales-first.

**SoT for this file:** `/Users/martysmithson/Downloads/mcfly_analytics_independent_product_research_2026-09-10.md` (Shopify Help + App Store pages, 10 Sep 2026). The other two briefs overlap; where they disagree, this file wins unless the founder overrides.

Board + rebuild plan still outrank this. No Challenge Gate item passed (pixels, extra scopes, price, attribution).

---

## A. Diagnosis (the actual thesis)

Mcfly is credible as a **merchant-facing order-intelligence desk**: sales quality, repeat buying, order economics, discount dependence, returns, channel mix — spend as an optional second layer.

The live listing still tells a different story: headline is ad spend next to sales; first screenshot is a three-year Total ROAS view; public demo/site still spend/ROAS-led. **A stranger with $0 spend can rationally conclude the $39 product is not useful yet**, even though Overview can be useful immediately.

Shopify already has a customizable Analytics Overview, reports, CSV export, and Sidekick. Mcfly cannot win with “more metrics.” It has to win by **compressing multiple native reports and common spreadsheet/AI questions into an opinionated first viewport that is easier to trust and revisit.**

Export→CSV→Sheets is documented. A Reddit thread shows a merchant using ChatGPT on a Shopify order CSV. The workflow is real. **How many merchants do it is unverifiable** — do not put a percentage in the listing.

---

## B. Ranked ideas — keep / already have / later / refuse

From the 22-row table (download file) plus overlapping rows from the other two briefs.

| Rank | Idea | Verdict |
|---:|---|---|
| 1 | Make “works at $0 spend” the explicit first-run promise | **Product lock. Not done on listing/demo.** Desk hero is sales; listing/site H1 still spend-first (P7). |
| 2 | Visible data-coverage sentence (what window, returns included) | **Partial.** Period rail + 60-day banners exist. Hero now prints calendar dates (repo). Fly `/pricing` still said January 2021 for sales — **fixed in repo, not live until deploy.** |
| 3 | Return / refund share | **Shipped** — Returns & edits $ + % of original checkout. |
| 4 / 11 | Discounted orders + discount $ | **Shipped** — share + typical $ off. |
| 5 | Second order within 30 days (% of eligible first-timers) | **Not shipped.** We have median days to second. The % checkpoint is the next retention tile if a real shop has enough repeats. |
| 6 | Top 10% of **customers** (sales concentration) | **Not shipped.** We have top 10% of **orders**. Different question. Opaque ids are enough. Later, small-store suppress. |
| 7 | Second-order value vs first-order value | **Not shipped.** Fits lock. Needs eligible-cohort rules. |
| 8 | Repeat-depth mix: 2nd vs 3rd+ | **Partial.** Repeat sales + buyers with one order. No 3+ split. |
| 9 | Typical sales **day** (median daily Total Sales) | **Not shipped.** We have typical **order**. Different. |
| 10 | Fees + tax + shipping as % of Total Sales | **Shipped.** |
| 12 | Source AOV as drill-in, not hero | **Mix shipped; AOV by source not.** Keep as drill-in only. |
| 13 | One “what to notice” sentence from order facts | **Not shipped.** Highest craft gap after first-viewport compression. Not an AI analyst. |
| 14 | Coverage badge on retention metrics | **Partial** (period / 60-day banners). Per-tile “too few repeats” not done. |
| 15 | Spend coverage as first-class state | **Shipped on Marketing/Spend** (`NUMBER_HONESTY`, recon). Must stay off the sales hero. |
| 16 | Recurring spend templates, no auto-sync | **Exists in spend write** (recurring). Do not turn into connectors. |
| 17 | CSV import row-level “what counted” | **Partial** on Spend import. Trust > new channels. |
| 18 | Store-currency correctness | **Conditional.** Do not prioritize until a non-USD shop is a real prospect. |
| 19 | Weekly recap: 5 facts + 1 decision (~90s) | **Not shipped as a ritual.** Share Overview exists; it still leads Total ROAS. Recap should be sales-first when spend is empty. |
| 20 | In-product review-readiness after a demonstrated win | **ReviewAsk exists.** Do not ask before they felt “I stopped exporting.” |
| 21 | No Total ROAS in the hero when spend is empty | **Shipped on Overview hero.** Must stay. Marketing section is the invitation. |
| 22 | “Store reporting / sales analytics” language first | **P7 listing.** Do not paste until Fly Overview matches. |

**Other briefs, same verdict:** overdue-for-a-second-order lists (email bait) — refuse. Pace-to-midnight / 4-hour prime density — later, not closed-day Overview. Multi-item basket % — we have mean units/order, not 2+ share. Full-price vs promo AOV — later. `/total-roas` MER-SEO — Search Console, not a new lander. Device/geolocation on listing — verify in Partner, do not widen scopes.

---

## C. Do not build (all three briefs, union)

Pixels / web pixels · MTA / path / view-through · “true ROAS” · Meta/Google OAuth · connector zoo · causal-lift / Compass · marketing-science suite · full-lifetime CRM / email profiles · `read_all_orders` as the product · AI analyst/Moby clone · COGS/P&L engine · inventory forecasting · GraphQL BI builder · ad-budget writeback · second pricing tier · Custom on home · greenfield rewrite · **overstuffed first viewport** · listing rewrite before the desk catches up.

---

## D. First-viewport spec (stranger, ~60 days, $0 spend, Sample off)

Five-second read. Visual goal: belongs beside Shopify Analytics, not a SaaS cockpit.

**Specified (download file):**

1. Header: Overview
2. Period: Last 60 days · Last 30 days · This month · Custom
3. Coverage: `Shopify orders · last 60 days available · returns included`
4. Hero: **Total Sales** + dollar + “Shopify sales for this window”
5. Four quiet cards: Orders · AOV · Sales from returning customers · Second order (median days)
6. **One sentence:** e.g. “Returning customers generated 42% of sales in this window.”
7. Spend: subordinate. `Spend not added · Overview works without spend · Add spend later for Total ROAS`
8. **Not above the fold:** 0× ROAS, spend chart, platform logos, CAC from absent spend, attribution sermon, CRM list

**Gap vs Fly Overview today:** hero is sales (good); calendar dates are in repo (not Fly until deploy). Below that is still a **tile wall** (period / buyers / timing), then LTV, Goals, explorer, then Marketing. Spec says **compress**, not add. Next desk craft: first viewport = hero + 4 cards + one sentence; the rest is “deeper on this page,” not competing for size.

Period rail today is MTD / Last month / QTD / YTD / Last 12 months — not “Last 60 days” as a named preset. 60-day is the **data** window, disclosed, not a fourth slicer unless we add it.

---

## E. Weekly ritual (craft to steal, not email)

~(90 seconds), no setup beyond opening the app:

1. Total Sales and orders
2. One “what to notice” sentence
3. Repeat / discount / return health
4. Open Spend only if spend was entered
5. Leave with one decision or “nothing unusual”

Steal from TW/Polar: one home, small hierarchy, freshness/coverage, reusable ritual. **Do not steal pixels, MTA, 50 dashboards, or alerts.**

Lifetimely / Repeat Customer Insights: named job, not bloated, human support. Better Reports / Report Pundit / Data Export: durability is **removing recurring spreadsheet labor**, not more connectors.

---

## F. Listing-later (P7 — do not paste)

After Fly Overview **is** the sales-first desk:

- Story: open one screen, understand the store without exporting. Spend = chapter two.
- Screenshots (3–6, 1600×900, actual UI): (1) Overview $0-spend, Total Sales hero, 60-day coverage, no ROAS; (2) repeat / second-order / discount / return; (3) explorer; (4) optional spend + Total ROAS; (5) Goals. No fake reviews (0).
- Strip live listing: “cash desk,” “till counted once,” spend-first title/meta.
- `/total-roas` MER-SEO: traffic question, not a new lander.

---

## G. Price (one row, not the thesis)

| Live 10 Sep 2026 | Fact |
|---|---|
| Listing | $39/month, 7-day trial, 0 reviews |
| mcflyads.com/pricing | $39 + 7-day. Also **MDS Made Easy $79 one-time** (misreadable). |
| Fly `/pricing` | $39 + 7-day. Also **“History back to January 2021”** (sales lie; spend floor). Repo copy fixed. |
| “Free while we launch → ~$79/mo” | **Not on those pages today.** Agent rule that still said ~$79 was fixed. |

$39 sits in the specialized analytics/reporting band (RCI $59+; reporting apps from ~$5–$40). Several comparables use **14-day** trials; ours is 7. No evidence that changing $39→$9 or $99 moves conversion by a known %. Do not add a second tier.

---

## H. Open questions (real shop — do not survey)

1. Which five questions get asked every week? Log requests, don’t invent.
2. Does first viewport produce “I get it” at $0 spend? Observe, don’t cheerlead.
3. Do returns / discounts / second-order / concentration cause a **decision**?
4. Does the 60-day boundary change buying? Measure trial behavior before `read_all_orders`.
5. What event precedes the first paid conversion?
6. Support pain: returns, guests, POS labels, timezone, currency, incomplete spend files.
7. In-app recap vs exported memo — usage, not a poll.

---

## I. Sources (download file)

Shopify Help (Analytics Overview, exports, sales/order/customer reports, Total Sales definition) · Shopify.dev (`read_orders` 60-day, scopes, App Design, empty states, listing screenshots 3–6 @ 1600×900, BFS) · live listing + Fly `/` `/pricing` `/demo` · Repeat Customer Insights, Lifetimely, TrueProfit, Better Reports, Report Pundit, Data Export IO, Easy Reports, Mipler · Triple Whale / Northbeam / Polar public pages · Community CSV→Sheets threads · Reddit ChatGPT-on-orders example.

**Limit:** no defensible % of merchants who paste CSVs into ChatGPT. Workflow evidenced; incidence not.
