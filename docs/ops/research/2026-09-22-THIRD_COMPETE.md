# Third compete — live listing vs mcflyads.com v36 (hostile)

**Date:** 2026-09-22T22:15Z (curl + JSON-LD, not memory)  
**Role:** competitor-listing auditor  
**Live site:** https://mcflyads.com · `mcfly-version` **v36** · `mcfly-build` `craft-steal-v36` · Pages **8ddad52e** (board) · locked H1 unchanged  
**Fly marketing `/`:** https://mcfly-analytics.fly.dev · **same HTML as mcflyads.com** (31572 bytes, identical) · `/health` 200 `mcfly-analytics` db up · app **v439**  
**Mcfly listing:** https://apps.shopify.com/mcfly-analytics-public — **still spend-first**. Reviews **0**. Do not invent stars or install counts. Partner Save is **#192**, not this cook.  
**Parent:** PR **#191** (`cursor/site-world-class-5bc6`) harvests leftover P0s. This file is research only. No Pages/Fly deploy. No Partner Submit. No ShopifyQL-wait. Locked home H1 stays.

Fetch method: HTTP 200 HTML + `<script type="application/ld+json">` `aggregateRating` for stars/counts. Visible pricing cards for ladders/trials. Polar **$1,020** is **absent** from the listing HTML (0 hits for `$1,020` / `1020`). Never treat it as listing.

---

## Ranked leftovers (price / star / ladder)

### P0 — false number on live HTML (cook this)

**TrueProfit stars/count.** Live home still prints the previous fetch `5.0 (880)`. Listing **today** is **4.9 (898)**.

| Surface | URL | Quote |
| --- | --- | --- |
| Listing JSON-LD | https://apps.shopify.com/trueprofit | `"name": "TP: True Profit Analytics", "aggregateRating": { "ratingValue": 4.9, "ratingCount": 898 }` |
| Listing visible | same | `Pricing From $35/month. Free trial available.` · `Rating 4.9 (898)` |
| Live site | https://mcflyads.com `#where-sits` | `Lifetimely 4.9 (538) · TrueProfit listing 5.0 (880)` |
| Live Fly `/` | https://mcfly-analytics.fly.dev | **same string** (marketing HTML = Pages v36) |
| `/pricing` | https://mcflyads.com/pricing | **does not print TrueProfit stars** (PASS) |
| `/faq` | https://mcflyads.com/faq | **does not print TrueProfit stars** (PASS) |

Repo pin: `site/index.html` reviews cell. Honesty test `site-honesty-v35.test.ts` already forbids `$0.30/order` / `$0.3 per extra order` on pricing.html; it does **not** pin TrueProfit stars, so v36 shipped the stale 5.0/880.

User note matches the swing: last cook used **5.0/880**; older fetch was **4.9/898**; **today is 4.9/898 again**. Do not keep 880.

**Smallest cook (parent #191):** one string on home, plus a pin so it cannot regress.

```
site/index.html  (Listing reviews row, P&L / exports cell)
- Lifetimely 4.9 (538) · TrueProfit listing 5.0 (880)
+ Lifetimely 4.9 (538) · TrueProfit listing 4.9 (898)

app/app/lib/site-honesty-v35.test.ts  (same TrueProfit it)
+ expect(index).toContain("TrueProfit listing 4.9 (898)");
+ expect(index).not.toContain("5.0 (880)");
```

Do not touch locked H1. Do not write `$0.30` / `$0.3 per extra order` on `pricing.html`.

---

### P0 listing leftover — Marty Partner Save #192 (do not site-cook)

Mcfly App Store card is still spend-first. Site already **discloses** this. Cursor does not Submit.

| Surface | URL | Quote |
| --- | --- | --- |
| Listing `<title>` / og:title | https://apps.shopify.com/mcfly-analytics-public | `Mcfly Analytics - Ad spend next to store sales — Total ROAS +... \| Shopify App Store` |
| Listing hero | same | `See every ad dollar next to Sales. Total ROAS, LTV, and deep customer insights on one desk.` |
| Listing body | same | `Mcfly Analytics is the cash desk for that gap. Enter spend by day or CSV, then read Total ROAS as store sales ÷ spend you added` |
| Listing pricing | same | `Pricing $39/month. Free trial available.` · `Rating 0.0 (0 Reviews)` · plan `Mcfly Analytics $39 / month` · `7-day free trial, then $39/month` |
| JSON-LD | same | `"name": "Mcfly Analytics"` — **no** `aggregateRating` (0 reviews) |
| Live home | https://mcflyads.com | `The live App Store card still leads with ad spend next to store sales. This site leads with Overview → Orders → Customers.` |
| Live home | https://mcflyads.com | `Reviews 0` · `we do not invent a 4.9` |
| Live pricing | https://mcflyads.com/pricing | same spend-first disclosure · `Reviews 0 · listing live · we do not invent a 4.9` |

Reviews **0**. Do not invent install counts (listing prints none).

---

### P1 — ladder leftover (true SKU, not the full listing)

**Lifetimely** listing today is **FREE + S $49 / 500 + M $149 / 3,000 + L $299 / 7,000**, Amazon +$75, 14-day on paid. Live compete tables print **only** `$149/mo at 3,000 orders` as the fee, next to everyone else’s **from**-price.

| Surface | URL | Quote |
| --- | --- | --- |
| Listing header | https://apps.shopify.com/lifetimely-lifetime-value-and-profit-analytics | `Pricing Free plan available. Free trial available.` · `Rating 4.9 (538)` |
| Listing JSON-LD | same | `"ratingValue": 4.9, "ratingCount": 538` |
| Listing plans | same | `FREE Free` · `S $49 / month Up to 500 Orders / Month` · `M $149 / month Up to 3,000 Orders / Month` · `L $299 / month Up to 7,000 Orders / Month` · each paid plan `Add Amazon data for $75 / Month` · `14-day free trial` |
| Live home fee cell | https://mcflyads.com `#where-sits` | `Lifetimely $149/mo at 3,000 orders. TrueProfit from $35/mo plus per-order. Better Reports from $19.90.` |
| Live home FAQ | https://mcflyads.com `#faq-home` | `Lifetimely lists $149/mo at 3,000 orders.` |
| Live pricing table | https://mcflyads.com/pricing | `Lifetimely $149/mo at 3,000 orders. TrueProfit from $35/mo at 300 orders, then extra-order fees.` |

`$149 at 3,000` is **true**. Hiding **Free** and **$49 at 500** next to Mcfly **$39** is the hostile leftover. Stars **4.9 (538)** MATCH live (Sep 15 notes had 537).

**Smallest P1 add if parent wants it in the same cook** (optional, not required to kill the P0 star lie):

```
Lifetimely: Free; $49 at 500 orders; $149 at 3,000; $299 at 7,000.
```

Keep that in the sits-note / tax-footnote if the screenshot table overflows. Do not drop `$149 at 3,000` — just stop presenting it as the only rung.

---

### P1-minor — “Foundation from $219”

Triple Whale listing **Foundation is $219 / month**, not a “from.” Home already says `Foundation $219`. Pricing table still says `Foundation from $219/mo`.

| Surface | URL | Quote |
| --- | --- | --- |
| Listing | https://apps.shopify.com/triplewhale-1 | `Foundation $219 / month or $2,190/year and save 17%` · tab `aria-label="Foundation "` · `Automate $749 / month` · `Free Free` · `Rating 4.1 (91)` |
| JSON-LD | same | `"ratingValue": 4.1, "ratingCount": 91` |
| Live home | https://mcflyads.com | `Triple Whale listing: Free / Foundation $219 / Automate $749.` **MATCH** |
| Live pricing table | https://mcflyads.com/pricing | `Triple Whale listing: Free; Foundation from $219/mo; Automate $749/mo.` **loose “from”** |

Smallest: delete the word `from` on the pricing table (`Foundation $219/mo`).

TW listing leftover on **their** card, not ours: Foundation bullets say `Everything in Starter, plus` while the cheap plan is named **Free**. Do not copy “Starter.”

No 14-day trial on the TW listing. Header is `Free plan available`. External charges billed separately. Live site does not invent a TW trial. PASS.

---

## What MATCHES today (do not “fix”)

| Competitor | Listing today | Live mcflyads.com /pricing /faq |
| --- | --- | --- |
| Polar | Visible `Pricing $750/month` · `Rating 4.9 (117)` · plan `Core Plan, from $750 / month` · `Pricing based on online GMV.` · JSON-LD 4.9 / 117 · **no** `$1,020` · **no** free trial on listing | `Polar’s App Store list price starts at $750/mo, GMV-based.` · `Polar 4.9 (117)` · `We do not invent Polar $1,020.` |
| Triple Whale | Free / Foundation **$219** / Automate **$749** · 4.1 (91) | Home + FAQ + sits-note print that ladder. |
| TrueProfit **price** | Header `From $35/month. Free trial available.` · Basic `$35 / month` · `300 orders/month` · `$0.3 per extra order. Maximum surcharge $300.` · then Advanced $60 / Ultimate $100 / Enterprise $200 | Home: `TrueProfit from $35/mo plus per-order.` Pricing: `TrueProfit from $35/mo at 300 orders, then extra-order fees.` **No `$0.30` / `$0.3 per extra order` on pricing.html.** KEEP THIS WORDING. |
| RCI | Header `From $59/month. Free trial available.` · Entrepreneur **$59** · Growth **$99** · Peak **$249** · `14-day free trial` each · JSON-LD **5.0 / 14** | `Repeat Customer Insights from $59 (Growth $99, Peak $249).` · `5.0 (14)` |
| Better Reports | Header `From $19.90/month. Free trial available.` · Basic **$19.90** · Grow $39.90 · Advanced $149.90 · Plus $299.90 · 14-day · JSON-LD **5.0 / 1199** (`Rating 5.0 (1,199)`) | `Better Reports from $19.90` — from-price MATCH. Does not cite BR stars (not a leftover). |
| Mcfly reviews | `0.0 (0 Reviews)` · `No reviews yet` | `Reviews 0` · `We do not invent a 4.9` MATCH |
| Polar $1,020 | **0 hits** on listing HTML | Live **refuses** it by name. KEEP. |

TrueProfit listing **does** print `$0.3 per extra order` (not `$0.30`). Lock stands: **never copy that rate onto pricing.html** — keep `extra-order fees` / `plus per-order`.

Polar listing has **no trial** in the plan card (`free trial` visible count 0). Related-app footers may say “Free to install”; that is not Polar’s plan.

---

## Share-as-product vs Mcfly copy/PNG

Mcfly **listing** does not offer Slack/email share. Live site is honest that Mcfly never posts:

- https://mcflyads.com — `You copy or Save PNG. Mcfly never posts to Slack, never sends mail, and does not write to a project board.`
- https://mcflyads.com — paste well: `Mcfly never posts to Slack — you copy. Polar would call this a weekly digest and send it. Mcfly does not`
- https://mcflyads.com/pricing — `Mcfly never posts to Slack or mail.` · share row: `You copy or Save PNG. Mcfly never posts.` vs `Slack channel / AI in Slack` vs `Email digest / Slack answers`
- https://mcflyads.com/faq — `You copy or Save PNG. Mcfly does not email or Slack.`

Competitor **listings** vs **their marketing sites** (do not mix):

| App | App Store listing today | Marketing site (not listing) |
| --- | --- | --- |
| Polar | **Slack string: 0 hits.** Categories include report scheduling / notifications. | https://polaranalytics.com — `Executive summary to Slack` · `Polar Operator` / `Turn trusted data into action, directly in Slack.` · `Agency client reporting to Gmail` |
| Lifetimely | **Slack string: 0 hits.** | https://www.lifetimely.io FAQ — `Teams can ask store-specific questions in Slack` · `Scheduled reports can also be delivered to Slack or email.` |
| RCI | Listing: `Schedule email reports for your whole team so everyone is up-to-date with your store's growth opportunities.` | (not required) |
| Better Reports | Listing: `Scheduled reports are automatically sent via email or to Google Sheets.` | (not required) |
| TrueProfit | Listing Advanced: `Customize Email Report` | (not required) |
| Triple Whale | Listing Slack: 0 hits. Automations run “on schedule.” | triplewhale.com historically egress-blocked; not used as listing. |
| Mcfly | Copy/PNG only. No bot, no digest send. | Live copy matches. |

So: Polar/Lifetimely **Slack as a product** is **their website**, not their App Store listing. Home “Polar would call this a weekly digest and send it” is Polar-site-true, listing-absent. Not a price/star P0. Do not cite Slack as “listing copy.”

---

## Full listing snapshot (2026-09-22T22:15Z)

### Polar — https://apps.shopify.com/polar-analytics

- Title: `Polar: AI‑Analytics Platform - Analytics that unify your data, track LTV, and grow revenue`
- From: **$750/month** · `Core Plan, from $750 / month` · `Pricing based on online GMV. Discounts available for annual terms.`
- Features named: BI, Klaviyo Audiences, Advertising Signals, Polar MCP, unlimited users/history/connectors
- Trial: **none** on listing
- Stars: **4.9 (117)** JSON-LD
- `$1,020`: **not on listing**

### Triple Whale — https://apps.shopify.com/triplewhale-1

- Header: `Pricing Free plan available` · `Rating 4.1 (91)`
- Free · Foundation **$219 / month** (or $2,190/year) · Automate **$749 / month** (or $7,490/year)
- External charges may be billed separately
- Trial: **no 14-day** on listing (Free plan is the door)
- Stars: **4.1 (91)** JSON-LD

### Lifetimely — https://apps.shopify.com/lifetimely-lifetime-value-and-profit-analytics

- Header: `Free plan available. Free trial available.` · `Rating 4.9 (538)`
- FREE · S **$49** / 500 orders · M **$149** / 3,000 · L **$299** / 7,000 · Amazon +$75 · 14-day on paid
- Stars: **4.9 (538)** JSON-LD

### TrueProfit — https://apps.shopify.com/trueprofit

- Header: `From $35/month. Free trial available.` · `Rating 4.9 (898)`
- Basic **$35** · 300 orders/month · **`$0.3 per extra order. Maximum surcharge $300.`** · 14-day
- Advanced $60 / 600 · $0.2 extra · cap $500
- Ultimate $100 / 1500 · $0.1 extra · cap $700
- Enterprise $200 / 3500 · $0.07 extra · cap $1000
- Stars: **4.9 (898)** JSON-LD — **not** 5.0 / 880
- Related-app footer may show other apps at 5.0; that is not TrueProfit’s aggregateRating

### Repeat Customer Insights — https://apps.shopify.com/repeat-customer-insights

- Header: `From $59/month. Free trial available.` · `Rating 5.0 (14)`
- Entrepreneur **$59** · Growth **$99** · Peak **$249** · 14-day each
- Share: schedule **email reports**; tags / Klaviyo
- Stars: **5.0 (14)** JSON-LD

### Better Reports — https://apps.shopify.com/betterreports

- Header: `From $19.90/month. Free trial available.` · `Rating 5.0 (1,199)`
- Basic **$19.90** (Shopify Basic) · Grow **$39.90** · Advanced **$149.90** · Plus **$299.90** · 14-day
- Share: email or Google Sheets schedule
- Stars: **5.0 (1199)** JSON-LD

### Mcfly — https://apps.shopify.com/mcfly-analytics-public

- Title leftover: **Ad spend next to store sales**
- **$39/month** · 7-day trial · **0.0 (0 Reviews)**
- Spend-first body (cash desk / Total ROAS / enter spend)

---

## Live site quotes that stay honest

https://mcflyads.com locked H1:

> Deeper Shopify numbers Analytics does not show.

https://mcflyads.com sits-note (keep Polar refusal + spend-first disclosure):

> Polar’s App Store list price starts at $750/mo. We do not invent Polar $1,020. Mcfly reviews: 0. The live App Store card still leads with ad spend next to store sales.

https://mcflyads.com/pricing tax footnote:

> TrueProfit from $35/mo at 300 orders (apps.shopify.com/trueprofit).

https://mcflyads.com/faq:

> Reviews: 0. Listing live. We do not invent a 4.9.

---

## Smallest cook (copy for parent #191)

1. **Must:** `site/index.html` `TrueProfit listing 5.0 (880)` → `TrueProfit listing 4.9 (898)`.
2. **Must-pin:** honesty test asserts `4.9 (898)` and forbids `5.0 (880)`.
3. **Optional same PR:** Lifetimely fee/footnote names Free / $49@500 / $149@3,000 / $299@7,000; pricing table `Foundation $219/mo` (drop “from”).
4. **Do not:** change home H1; write `$0.3` on pricing.html; invent Polar $1,020; invent Mcfly stars; Fly/Pages deploy; Partner Submit; execute ShopifyQL-wait.

`/pricing` and `/faq` have **no** TrueProfit star leftover. Fly `/` will follow Pages when parent ships the home string — today it still lies `5.0 (880)` because it is the same v36 HTML.
