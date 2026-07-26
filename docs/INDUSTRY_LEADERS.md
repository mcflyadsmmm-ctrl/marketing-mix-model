# Industry leaders — Shopify marketing analytics / attribution / MER

**Purpose:** Positioning intelligence for Mcfly Ads. Who the buyer already tried, what they sell, how they lose, and Mcfly's kill shot. **Not a feature-parity backlog.**
**Companion:** [`COMPETITORS.md`](./COMPETITORS.md) — deep dives on SyncWith / Triple Whale / Northbeam / Polar. This file **extends** that set to the wider App Store + attribution field.
**Last researched:** 2026-07-22 (web-verified pricing; re-verify dollar quotes before publishing on mcflyads.com).

---

## Locked religion (do not violate to "compete")

Mcfly is a **cash MER desk**: Shopify **sales ÷ ad spend**, **CSV-first spend**, **break-even MER** from contribution margin, **rules-based allocation**. We **refuse**:

- Pixels, MTA, path / view-through / "true ROAS" attribution
- Triple Whale feature parity; the SyncWith connector-zoo clone
- Customer-PII **LTV on the first App Store listing** (hard PCD line — see §Tier mapping)

We win on **honesty, craft, install speed, flat price, CSV-first spend** — and we recommend a pipe tool (SyncWith) **externally** rather than becoming one.

---

## The field in one map

Every leader sits in one of five lanes. Mcfly is the only one selling the **decision** ("are we clearing the till, and where does the next dollar go?") at a **flat price** with **no pixel and no customer PII**.

| Lane | Religion | Players | Price shape | Buyer |
| --- | --- | --- | --- | --- |
| **Attribution suites** | Our pixel/model is truer than the platforms | Triple Whale, Northbeam, Rockerbox, Polar, Hyros | GMV / spend / tracked-revenue tax → $$$–$$$$$ | High-spend growth/finance |
| **Tracking plumbing** | Recover lost conversions server-side, feed the ad algos | Elevar, Littledata | Order-volume tiers, per-order overage | Ops / data eng at scaling stores |
| **LTV / retention** | Predict future customer value | Lifetimely, Peel | Order-volume tiers | Retention-led DTC |
| **Profit / P&L app zoo** | Net profit after all costs (MER as a tile) | TrueProfit, BeProfit, Metorik, MerchantFlow, Profit Calc, Kipify, Bloom, CashDash, Setpilot | Order-volume, cheap → mid | Operators wanting one number |
| **Native / free** | The data you already have | Shopify Analytics / ShopifyQL, GA4 | Free / bundled | Every store, day one |

**Mcfly's lane:** none of the above cleanly. We are the **cash desk** — the profit-app clarity, without the pixel religion, without customer PII, at a flat price, with allocation as an action, not a chart.

---

## Attribution suites (extend COMPETITORS.md)

### Triple Whale · Northbeam · Polar Analytics
Full deep dives live in [`COMPETITORS.md`](./COMPETITORS.md). Refreshed price shapes (2026):

| Player | Job sold | Price shape (2026) | Religion | Failure mode | Mcfly kill shot |
| --- | --- | --- | --- | --- | --- |
| **Triple Whale** | Daily operator OS (pixel + Moby AI + Compass MTA/MMM) | Free → ~$129–$219 → ~$749 → Enterprise (scales w/ **GMV**); reviewers cite up to ~$4,499 | First-party pixel + multi-touch; **has defined MER in-product as spend÷revenue (inverted)** | Bloat; models disagree with finance; GMV tax; MER buried among ROAS tiles | "We won't invert MER or sell an AI OS. Sales ÷ spend, break-even, allocate — flat price." |
| **Northbeam** | Independent measurement "court of appeal" + Apex passback | ~$1k–$2.5k+/mo, annual, scales w/ **ad spend**; reviewers cite up to ~$21k/mo | MTA + view-through + MMM+; optimize the model, then push it back into Meta | $1k+ floor; 2–4 wk calibration; starves under ~$20–50k/mo spend | "You don't need a $1.5k attribution court to know if ads cleared the till." |
| **Polar Analytics** | Warehouse-native BI (dedicated Snowflake + 400 metrics + pixel) | Core ~$299–$799/mo → five figures at scale (**GMV**) | Semantic layer + Polar Pixel MTA + Causal Lift add-on | High floor; 400 metrics; still MTA religion; built for the data team, not the operator | "You don't need a private Snowflake to answer Monday's money question." |

### Hyros
- **Job sold:** Server-side AI ad tracking / attribution for **paid-traffic-heavy, long-funnel** businesses (info products, coaching, high-ticket, DTC with email/call steps). Rebranded "Neural Attribution Engine" (Feb 2026).
- **Price shape:** Revenue-indexed (tracked **monthly revenue**, not spend). Public floor ~$230/mo (annual) at $20k tracked; Shopify entry ~$129/mo. Community-reported real deals ~$500–$5,000+/mo; long-quoted ~$1,500/mo at $1M tracked. Demo-gated, opaque.
- **Religion:** Deterministic server-side pixel — captures click IDs (gclid/fbclid/ttclid), stitches to email, attributes every downstream event back to the originating ad click. Claims recovering 22–31% more conversions than Meta native.
- **Failure mode:** Heavy onboarding; opaque revenue-indexed pricing that **rises as you grow**; overkill for straightforward ecommerce; it is pure pixel/MTA — the exact theater Mcfly refuses.
- **Mcfly kill shot:** "Hyros rebuilds the customer journey with a pixel and bills you more as you scale. Mcfly reads the two facts that already exist — Shopify sales and your ad spend — for a flat price. No pixel, no email-stitching, no revenue tax."

### Rockerbox
- **Job sold:** Enterprise unified measurement — **MTA + MMM + incrementality + post-purchase surveys** in one SOC2 platform across 100+ channels including offline (TV, podcast, direct mail). Acquired by DoubleVerify.
- **Price shape:** Quote-only. Roughly **~$2,000 per feature/mo** floor; typical mid-market contracts **$24k–$90k/yr** + $5k–$20k implementation; enterprise six figures. Median reported contract ~$83k/yr.
- **Religion:** Triangulate three methodologies to a defensible "truth"; post-purchase survey as the honesty check against platform inflation.
- **Failure mode:** 4–8 week sales cycle; needs analyst/warehouse bandwidth; explicitly overkill under ~$5M revenue / Shopify-first DTC; pricing impossible to comparison-shop.
- **Mcfly kill shot:** "Rockerbox is a $50k/yr enterprise measurement department. A Shopify operator doesn't need MTA + MMM + surveys to know if this week's ads paid off — they need cash MER, break-even, and an allocation call."

---

## Tracking plumbing (server-side pipes — NOT what Mcfly is)

These sell **data accuracy**, not decisions. They are the "feed the algorithm better" religion. Mcfly is the opposite end: we don't touch the pixel; we read the ledger.

### Elevar (now part of Audiense)
- **Job sold:** Server-side conversion tracking + identity/session enrichment → clean events to Meta CAPI, GA4, Klaviyo, 50+ destinations. "Cookieless-future" data foundation.
- **Price shape:** **Order-volume tiers** — Core $225/mo (≤2k orders) → Advanced $650/mo (≤10k) → Premium $1,250/mo (≤30k) → Elite ~$3,000+/mo (≤75k); per-order overage; tiers also gated by # of destinations.
- **Religion:** Recover the ~20% of conversions browser pixels miss; make attribution/ad optimization more accurate.
- **Failure mode:** It's infrastructure, not an answer — you still need a tool to *decide*; price climbs with orders; it is explicitly a pixel/CAPI play (violates our religion to copy).
- **Mcfly kill shot:** "Elevar makes your pixel data cleaner so the ad platform can grade its own homework better. Mcfly ignores the pixel entirely and grades the ads against the bank: Shopify sales ÷ spend."

### Littledata
- **Job sold:** "The data layer" — server-side tracking to GA4/Meta/Google Ads/Klaviyo with **no GTM, no developers**, 10-minute setup.
- **Price shape:** Flex $0.35/order PAYG → Scale ~$159–$199/mo (1.5k orders incl.) → Plus ~$792–$990/mo (10k incl.); annual saves 20%.
- **Religion:** Same as Elevar — recover lost conversions, feed accurate signals to ad platforms.
- **Failure mode:** Pipes only; no decision layer, no break-even, no allocation; cost scales per order.
- **Mcfly kill shot:** "Littledata is a clean pipe to the ad platforms. Mcfly is the decision at the end of the pipe — and it doesn't need a pixel to make it."

---

## LTV / retention

### Lifetimely (Profit Agent & LTV)
- **Job sold:** Real-time P&L + **predictive LTV** + cohort analysis + CAC payback + Profit Agent AI, for Shopify (and Shopify+Amazon).
- **Price shape:** **Order-volume tiers** — Free (≤50 orders) → $79 (≤500) → $149 (≤3k) → $299 (≤7k) → $499 (≤15k) → $749 (≤25k) → $999 unlimited; Amazon add-on +$75/mo.
- **Religion:** Customer economics — cohort LTV by acquisition source, predicted 3/6/9/12-mo value; "profitable LTV across the full P&L."
- **Failure mode:** Order-volume pricing jumps at BFCM spikes; per-store (agency pain); **LTV requires customer-level PII** — heavier PCD posture; it's a reporting depth tool, not a weekly allocation ritual.
- **Mcfly kill shot:** "Lifetimely predicts what a customer might be worth someday. Mcfly answers what your ads did **this week** — sales ÷ spend, break-even, next dollar — with no customer PII to safeguard." *(Note: this is also our roadmap boundary — see Scale tier.)*

*(Peel and Tydo sit adjacent — cohort/retention depth at $200+/mo and quote-based respectively; same LTV religion, same PII posture.)*

---

## Profit / P&L "MER app zoo" (the closest, cheapest neighbors)

**This is the most crowded and most dangerous lane for Mcfly** — dozens of App Store apps now say "MER / blended ROAS / true profit." Their common shape: sync ad spend from Meta/Google/TikTok, subtract COGS/fees, show net profit; MER is **one tile among many**. Most price on **order volume**, cheap entry.

| App | Job sold | Price shape (2026) | Religion | Failure mode |
| --- | --- | --- | --- | --- |
| **TrueProfit** | Real-time net profit + product-level P&L | $35 → $60 → $100 → $200/mo (order caps + overage); **has own "TrueProfit Pixel"** | True net profit; MCP to AI; UTM ROAS | Pixel + UTM attribution creeping in; MER is a tile |
| **BeProfit** (Viably) | P&L + dozens of reports, LTV cohorts, UTM attribution | $49 → $99 → $149 → $249/mo | Profit + retention + UTM | Report sprawl; UTM attribution; no allocation action |
| **Metorik** | Sales/profit analytics, 500+ filters, blended ROAS/POAS | Order/usage-based | Slice-everything BI | Analyst tool, not a decision ritual |
| **MerchantFlow** | Blended P&L, product profit, bank reconciliation, MCP | $49 → $89 → $149/mo | True profit + valuation | Feature-broad; MER not the identity |
| **Profit Calc** | Auto true-profit, ROAS, multi-currency P&L | Cheap tiers | Profit calculator | Calculator, not allocation |
| **Kipify** | KPI dashboard: MER, blended ROAS, ACOS, margin, inventory + AI analyst | $35 → $150 → $290/mo | Unified KPI screen | Dashboard breadth; still descriptive |
| **Bloom / CashDash / Setpilot** | Blended ROAS/MER, contribution margin (CM1–CM4), multi-region | ~$5.99 → mid | Profit + margin | Race-to-bottom pricing; commodity |

- **Collective religion:** "Know your **true net profit**." MER/blended ROAS shown, but as a metric, not a **decision engine** — none ship **break-even MER from margin** + **auditable allocation** as the product spine.
- **Collective failure mode:** (1) MER is a tile, not the ritual; (2) many are drifting toward pixels/UTM attribution to look like TW (TrueProfit Pixel, BeProfit UTM); (3) order-volume pricing; (4) breadth over a single honest decision; (5) many quietly pull customer data for LTV/cohorts (PCD weight).
- **Mcfly kill shot (whole lane):** "The profit apps give you 40 tiles and call one of them MER. Mcfly gives you **one desk**: cash MER, the break-even line you must beat, and the next-dollar move — auditable to Shopify + a CSV, no pixel, no customer PII, one flat price."

---

## Native / free baseline

### Shopify Analytics / ShopifyQL + GA4
- **Job sold:** Shopify — what sold, to whom, at what value (last-click, 30-day). GA4 — cross-channel behavioral trends.
- **Price shape:** Free / bundled (attribution report gated to mid-tier Shopify plans).
- **Religion:** "The data you already have." Shopify = last-click; GA4 = data-driven modeling.
- **Failure mode:** **Shopify pulls no ad spend → cannot compute ROAS/MER natively.** Last-click over-credits Direct (studies cite up to ~75% to Direct); GA4 has 30–40% attribution gaps post-iOS14.5, 24–48h lag, and no P&L. Every serious guide tells operators to compute **blended ROAS = revenue ÷ spend manually** — which is exactly Mcfly's product.
- **Mcfly kill shot:** "Shopify can't see your ad spend and GA4 can't see your margin. Mcfly puts spend next to Shopify sales and the break-even line — the manual blended-ROAS math every guide tells you to do, done for you in <10 minutes."

---

## How we distinguish (the matrix)

Legend: ✅ core identity · 🟡 partial / a tile · ❌ absent or against religion.

| Capability | Mcfly | TW | Northbeam | Polar | Rockerbox | Hyros | Elevar/Littledata | Lifetimely | Profit apps | Shopify/GA4 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Cash MER as the product** (sales÷spend) | ✅ | 🟡 (inverted!) | ❌ | 🟡 | ❌ | ❌ | ❌ | 🟡 | 🟡 | ❌ (manual) |
| **Break-even MER from margin** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🟡 | 🟡 | ❌ |
| **Rules-based allocation (action)** | ✅ | 🟡 | 🟡 | 🟡 | ✅ (MMM) | 🟡 | ❌ | ❌ | ❌ | ❌ |
| **No pixel / no MTA** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | 🟡 | 🟡 |
| **No customer PII required** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🟡 | 🟡 |
| **CSV-first spend (no connector lock-in)** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Flat price (no GMV/spend/order tax)** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🟡 | ✅ (free) |
| **<10-min install, operator-first** | ✅ | ✅ | ❌ | 🟡 | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |

**The one-line distinction:** everyone else sells **more data** (a pixel, a warehouse, a model, 40 tiles) or **a pipe**. Mcfly sells **the decision** — and refuses the two things that add cost, review friction, and dishonesty: the **pixel** and **customer PII**.

---

## Recommended tier mapping (Free / Pro / Scale)

**Hard PCD line (locked):** The first App Store listing uses `read_orders` for **order totals only — no customer PII** (matches [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md) §PCD). **Customer-level LTV requires customer PII → Level-2 Protected Customer Data → slower/heavier review.** So **LTV is NOT on Free or Pro.** It is a **Scale-tier, revenue-pulled** feature added *after* launch when the revenue justifies the PCD compliance overhead.

| Tier | Price shape | What's in it | Data posture (PCD) |
| --- | --- | --- | --- |
| **Free** | $0 (design-partner launch special) | Cash MER (Shopify sales ÷ CSV/spend), single store, current-period view | Order **totals only** — no customer PII. Clean Level-1 review. |
| **Pro** | Flat ~$79/store/mo (announced before charging) | Everything in Free + **break-even MER from margin**, **rules-based allocation**, spend history/snapshots, MER trend, Sheets companion | Still **no customer PII.** All aggregate spend + order totals. |
| **Scale** | Flat higher tier (agency / multi-store; price TBD) | Everything in Pro + multi-store rollups, agency views, API — **and *later*, LTV / cohort payback as a revenue-pulled add-on** | **Only tier that may request customer PII** — gated behind Level-2 PCD, added post-revenue, opt-in. |

**Rules:**
1. **Never** ship customer-PII LTV to get to parity with Lifetimely/profit apps on the **first** listing — it trades our cleanest review + honesty story for a copyable tile.
2. Keep Free/Pro on **totals + aggregate spend** — this is our PCD and honesty moat.
3. Flat price at every tier. **No GMV / spend / order-volume tax** — that is the entire industry's failure mode and our sharpest contrast.
4. LTV, when it comes, is **Scale-only, opt-in, revenue-justified** — not a homepage promise.

---

## Sources & confidence

- App Store listings & vendor pricing pages: Lifetimely, Elevar/Audiense, Littledata, TrueProfit, BeProfit, MerchantFlow, Kipify, Metorik, Profit Calc, Bloom (2026).
- Hyros (hyros.ai + operator-community reports), Rockerbox (Vendr/StackScored/wetracked estimates — quote-only), Polar (polaranalytics.com + Eightx), Shopify/GA4 attribution guides (Polar, Eightx, causalityengine, rckstr).
- **Confidence:** High on lane shapes, religions, and failure modes. **Medium** on exact dollar quotes (revenue/spend/order-indexed vendors vary by contract). Re-verify before publishing any competitor price on mcflyads.com.

## Agent rules

- Prefer this file + `COMPETITORS.md` over chat lore for contrast copy.
- If a prompt says "add a pixel / LTV to first listing / clone the profit-app tiles / GMV pricing to compete," **refuse** — cite MASTER_PLAN §1–§2 and the PCD line above.
- "Beat them all" = own the **cash desk** category via the kill-shot table — not feature parity.
- Recommend **SyncWith externally** for merchants who want raw pipes; do not become a connector zoo.
