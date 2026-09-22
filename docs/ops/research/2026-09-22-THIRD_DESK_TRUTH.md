# Third desk truth — live v38 HTML vs today’s App Store listings

**Date:** 2026-09-22T22:36Z  
**Lane:** research only. This branch does not cook `site/**`. Does not merge. Does not deploy. Does not execute ShopifyQL-wait. Does not unpark Live. Parent cooks leftover cells.

**Live stamp:** `https://mcflyads.com` `mcfly-version` **v38** (Pages). `https://mcfly-analytics.fly.dev/` is the same v38 HTML (TrueProfit 4.9 (898), Lifetimely 4.9 (538), Polar $1,020 plant). Suite landers 301 `/`.

**Method:** `curl` + App Store HTML (JSON-LD `aggregateRating.ratingCount` + visible Pricing cards) on 2026-09-22T22:32–22:36Z. Public listing pages only. Polar calculator / useamp.com / triplewhale.com pricing sliders were **not** opened. Polar **$1,020** is not on the listing — do not treat it as a from-price.

**Pages probed:** `/` `/pricing` `/faq` `/about` `/product` `/demo` `/support` `/privacy` `/terms`. Competitor dollars and stars live only on `/` and `/pricing` (plus `/faq` `/about` `/product` from-prices for RCI / Better Reports). Support / privacy / terms: no competitor cells.

---

## Leftover P0 list (parent cooks)

v38 already matches today’s listing **from-prices, review counts, and the printed TW / Lifetimely / RCI ladders**. One live cell still names a dollar the listing does not print.

| # | Cell | Live v38 (quote) | Listing today (quote) | Cook |
| --- | --- | --- | --- | --- |
| **P0-1** | Home `#where-sits` footnote plants Polar **$1,020** | `Polar’s App Store list price starts at $750/mo. We do not invent Polar $1,020.` (`/` sits-note) | Polar listing: header `Pricing $750/month`. Card: `Core Plan, from $750 / month` · `Pricing based on online GMV.` JSON-LD rating 4.9 / count 117. **No `$1,020` anywhere in the listing HTML.** https://apps.shopify.com/polar-analytics | Delete `$1,020` from the sentence. Keep `$750`. Do not replace it with another GMV band. Same HTML is on fly.dev `/`. `/pricing` already has `Polar from $750` with no `$1,020`. |

**P0 leftover count: 1.** No leftover P0 on Triple Whale / TrueProfit / Lifetimely / Repeat Customer Insights / Better Reports **printed dollars or stars**. Those cells match today’s listing.

---

## What already matches (do not recook)

Quoted both sides. Stars = visible listing `(N)` = JSON-LD `ratingCount`.

| App | Listing today | Live v38 cell | Grade |
| --- | --- | --- | --- |
| **Triple Whale** https://apps.shopify.com/triplewhale-1 | Visible: `Rating 4.1 (91)`. Plans: `Free` · `Foundation $219 / month` (or `$2,190/year`) · `Automate $749 / month` (or `$7,490/year`). JSON-LD 4.1 / 91. `External charges may be billed by Triple Whale separately from your Shopify invoice.` | `/` Fee: `Triple Whale listing: Free / Foundation $219 / Automate $749.` Reviews: `Triple Whale 4.1 (91)`. FAQ: same ladder. | **MATCH** on ladder + stars. |
| **Polar** https://apps.shopify.com/polar-analytics | `Pricing $750/month`. `Core Plan, from $750 / month`. `Pricing based on online GMV.` `4.9 (117)`. JSON-LD 4.9 / 117. | `/` Fee: `Polar’s App Store list price starts at $750/mo, GMV-based.` Reviews: `Polar 4.9 (117)`. Pricing: `Polar lists from $750/mo, GMV-based.` | **MATCH** on from-price + stars. **P0** is only the `$1,020` plant in the `/` footnote (table above). |
| **TrueProfit** https://apps.shopify.com/trueprofit | Header: `From $35/month. Free trial available.` `Rating 4.9 (898)`. JSON-LD 4.9 / 898. Basic: `$35 / month` · `$0.3 per extra order. Maximum surcharge $300.` · `300 orders/month`. Then Advanced `$60` / 600 · Ultimate `$100` / 1500 · Enterprise `$200` / 3500. | `/` Fee: `TrueProfit from $35/mo plus per-order.` Reviews: `TrueProfit listing 4.9 (898)`. `/pricing` Fee: `TrueProfit from $35/mo at 300 orders, then extra-order fees.` | **MATCH** on from-price + 898. Ladder truncated → P1. |
| **Lifetimely** https://apps.shopify.com/lifetimely-lifetime-value-and-profit-analytics | `Rating 4.9 (538)`. JSON-LD 4.9 / 538. Listing-visible ladder: `Free` · `S $49 / month` `Up to 500 Orders / Month` · `M $149 / month` `Up to 3,000 Orders / Month` · `L $299 / month` `Up to 7,000 Orders / Month`. Amazon add-on `Add Amazon data for $75 / Month`. Header: `Free plan available. Free trial available.` XL/XXL/Unlimited **did not print** on this listing fetch — do not invent them from useamp.com. | `/` + `/pricing`: `Lifetimely listing: Free / $49 / $149 / $299. The $149 row is 3,000 orders.` Reviews: `Lifetimely 4.9 (538)`. | **MATCH** on listing-visible dollars + 538 + the 3,000-order cap on $149. Caps on $49 / $299 and Amazon +$75 omitted → P1. |
| **Repeat Customer Insights** https://apps.shopify.com/repeat-customer-insights | Header: `From $59/month. Free trial available.` `Rating 5.0 (14)`. JSON-LD 5.0 / 14. `Entrepreneur $59 / month` · `Growth $99 / month` · `Peak $249 / month`. | `/` Fee: `Repeat Customer Insights from $59 (Growth $99, Peak $249).` Reviews: `Repeat Customer Insights 5.0 (14)`. `/pricing` `/faq` `/about` `/product`: from `$59`. | **MATCH**. Entrepreneur name on $59 omitted → P1 nit. |
| **Better Reports** https://apps.shopify.com/betterreports | Header: `From $19.90/month. Free trial available.` `Rating 5.0 (1,199)`. JSON-LD 5.0 / 1199. `Basic $19.90 / month` `For stores currently on the Basic plan` · `Grow $39.90` · `Advanced $149.90` · `Plus $299.90` (Shopify plan-tied). | `/` Fee: `Better Reports from $19.90.` `/pricing` footnote + `/faq`: same from-price. **No review count cell.** | **MATCH** on from-price. Ladder + 1,199 omitted → P1. |
| **Mcfly (own listing, context)** https://apps.shopify.com/mcfly-analytics-public | `Pricing $39/month. Free trial available.` `Rating 0.0 (0 Reviews)`. `No reviews yet`. Spend-first card still live. | Site: `Reviews 0` / `Mcfly reviews: 0`. `$39` after 7-day. Discloses spend-first card. | **MATCH** on $39 and 0 reviews. 1.1.4 spend-vs-sales mismatch is already disclosed — not this probe’s P0. |

v38 journal already claimed TrueProfit **4.9 (898)** and Lifetimely **Free / $49 / $149 / $299**. This re-fetch confirms both are still the public listing today (Lifetimely count **538**, not the 2026-09-15 **537**).

---

## P1 leftovers (not wrong dollars; parent may cook)

| # | Cell | Live v38 (quote) | Listing today (quote) | Why P1 not P0 |
| --- | --- | --- | --- | --- |
| **P1-1** | `/pricing` Pixel/BI fee: TW “from $219” | `Triple Whale listing: Free; Foundation from $219/mo; Automate $749/mo.` | `Foundation $219 / month` — listing HTML has **no** `from $219`. Home table already prints `Foundation $219` without “from”. | Dollar is right. Hedge word is not on the TW listing (Polar *does* say `from $750`). Align pricing with home / listing: `Foundation $219`. |
| **P1-2** | TrueProfit ladder truncated | Home: `TrueProfit from $35/mo plus per-order.` Pricing: `from $35/mo at 300 orders, then extra-order fees.` | Full listing ladder: Basic **$35** / 300 / **$0.3** extra (cap $300) · Advanced **$60** / 600 / $0.2 · Ultimate **$100** / 1500 / $0.1 · Enterprise **$200** / 3500 / $0.07. | From-price $35 is true. Home omits the 300-order bucket that pricing already names. Do not invent rates if parent only patches home to match pricing. |
| **P1-3** | Lifetimely caps / Amazon | `Free / $49 / $149 / $299. The $149 row is 3,000 orders.` | `$49` = 500 orders · `$299` = 7,000 · Amazon **+$75/mo** on paid rows. | Printed dollars are listing dollars. Asymmetric cap (only $149 explained) is the leftover. |
| **P1-4** | Better Reports ladder + stars | From `$19.90` only. Reviews row quotes Lifetimely + TrueProfit in that column, not Better Reports. | From `$19.90` · Grow `$39.90` · Advanced `$149.90` · Plus `$299.90` · **5.0 (1,199)**. Plans are Shopify-plan-tied, not order-volume. | From-price is true. Reviews row is incomplete for an app the fee cell already names. |
| **P1-5** | TW / Polar external charges | Live presents `$219` / `$750` as the listing price. | Both listings: `External charges may be billed by [developer] separately from your Shopify invoice.` | Not a wrong from-price. Honesty footnote if parent touches the sits-note anyway. |
| **P1-6** | RCI $59 plan name | `from $59 (Growth $99, Peak $249)` | First paid row is named **Entrepreneur** `$59 / month`. | Dollars match. Name omitted. |
| **P1-7** | `/pricing` Reviews row | `Listing stars are theirs, not Mcfly’s` (no numbers) | Polar 4.9 (117) · TW 4.1 (91) · Lifetimely 4.9 (538) · TrueProfit 4.9 (898) — already on `/`. | Not a mismatch. Optional: copy home numbers, or leave unnamed. |

---

## Listing ladders (today, for the cook)

Do not paste Polar calculator bands. Do not paste Lifetimely XL/XXL/Unlimited (not on this listing fetch).

### Triple Whale — `triplewhale-1`

- Free  
- Foundation **$219 / month** (annual $2,190)  
- Automate **$749 / month** (annual $7,490)  
- Listing copy under Foundation says `Everything in Starter, plus:` while the plan tabs are Free / Foundation / Automate. That inconsistency is **theirs**. Do not invent a Starter dollar.  
- 4.1 (91)

### Polar — `polar-analytics`

- Core Plan, **from $750 / month**, GMV-based  
- **Not** $1,020  
- 4.9 (117)

### TrueProfit — `trueprofit`

- Basic **$35** · 300 orders · $0.3 extra (max $300)  
- Advanced **$60** · 600 · $0.2 (max $500)  
- Ultimate **$100** · 1500 · $0.1 (max $700)  
- Enterprise **$200** · 3500 · $0.07 (max $1000)  
- 4.9 (898) · 14-day trial on paid rows

### Lifetimely — `lifetimely-lifetime-value-and-profit-analytics`

- Free  
- S **$49** · 500 orders  
- M **$149** · 3,000 orders  
- L **$299** · 7,000 orders  
- Amazon +$75 on paid rows  
- 4.9 (538)

### Repeat Customer Insights — `repeat-customer-insights`

- Entrepreneur **$59**  
- Growth **$99**  
- Peak **$249**  
- 5.0 (14)

### Better Reports — `betterreports`

- Basic **$19.90** (Shopify Basic)  
- Grow **$39.90**  
- Advanced **$149.90**  
- Plus **$299.90**  
- 5.0 (1,199)

---

## Live quotes (v38 HTML)

Home comparison table (`/`):

> Polar’s App Store list price starts at $750/mo, GMV-based. Triple Whale listing: Free / Foundation $219 / Automate $749.

> Lifetimely listing: Free / $49 / $149 / $299. The $149 row is 3,000 orders. TrueProfit from $35/mo plus per-order. Better Reports from $19.90.

> Repeat Customer Insights from $59 (Growth $99, Peak $249).

> Polar 4.9 (117) · Triple Whale 4.1 (91)

> Lifetimely 4.9 (538) · TrueProfit listing 4.9 (898)

> Repeat Customer Insights 5.0 (14)

> Polar’s App Store list price starts at $750/mo. We do not invent Polar $1,020.

Pricing comparison table (`/pricing`):

> Polar lists from $750/mo, GMV-based. Triple Whale listing: Free; Foundation from $219/mo; Automate $749/mo.

> Lifetimely listing: Free / $49 / $149 / $299. The $149 row is 3,000 orders. TrueProfit from $35/mo at 300 orders, then extra-order fees.

> Polar from $750. Triple Whale listing: Free / Foundation $219 / Automate $749. … TrueProfit from $35/mo at 300 orders …

---

## Did not

- Cook HTML into the live site PR  
- Merge, Pages deploy, Fly wrap  
- ShopifyQL-wait  
- Unpark Live / change `MCFLY_SAMPLE_ONLY` / `MCFLY_LIVE_STAGE`  
- Partner Save  
- Invent Polar $1,020 as a listing from-price (it is not one; live still plants it)  
- Open Polar’s GMV calculator or Lifetimely’s marketing XL/XXL rows  

**Return to parent:** leftover P0 list = **P0-1 only** (Polar `$1,020` still on live `/` sits-note). Everything else in the six-app from-price / star / printed-ladder set matches today’s listings.
