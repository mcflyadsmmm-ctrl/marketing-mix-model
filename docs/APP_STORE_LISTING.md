# App Store listing draft — Mcfly Analytics

Paste into Partner listing when Distribution = **Shopify App Store**.  
**Pricing:** Shopify App Pricing — **one plan**: 7 days, then **$39/store/mo**. Trial and paid both keep the full desk. **Product:** depth Shopify Analytics skips first—Overview YoY (this month / quarter / year vs last year), typical order, Customers / Growth / Orders / LTV. Spend is optional typed/CSV plus certified Total ROAS chips (honest MER: sales ÷ entered spend) and Channel Allocation. Empty spend is an em dash, not 0×. Never pixels / MTA / “true ROAS” / Profit Agent / P&L as hero. Trial and paid include up to **24 months** of order history. Admin is **Live-only**; SAMPLE is on https://mcflyads.com/demo only.
**Voice:** calm operator desk — specific, factual. No anti-pixel sermon. No forever-free.  
**Resubmit lock (2026-08-26):** Billing is live (`MCFLY_BILLING=1`). Partner Pricing **must** be ONE plan — $39/store/mo with a 7-day free trial, **no Free plan** — and never claim “no charges.” Defer email CRM / Level 2 PCD. Minimal `read_customers` (opaque id + `numberOfOrders`) is OK. **Till LTV** (opaque cohorts) is Level 1 — see [`PCD_AND_LTV.md`](./PCD_AND_LTV.md). Tier path: [`BILLING_TIERS.md`](./BILLING_TIERS.md). Positioning: [`STRATEGY.md`](../STRATEGY.md).

## Paste-ready short + long (one paid plan — copy final)

**Status (2026-09-22):** Listing is **live** at https://apps.shopify.com/mcfly-analytics-public (handle `mcfly-analytics-public`, **reviews: 0**). Tagline, short, long, and feature bullets below are the **sales-first paste Marty should Save** (Shopify five first at zero spend; optional Total ROAS = honest MER; trial and paid share up to 24 months; Live Admin + SAMPLE on `/demo` only). Spot-check the live mcflyads.com version before Save. Cursor does not Submit. **4.2.2 / 4.2.3:** merchant-facing listing paste (short / long / features / captions / images) must **not** include plan prices. Put **$39** only in Partner **Pricing details** and in reviewer testing notes. One plan covers the whole desk — Home, Customers, Spend, and Settings. Goals is one saved target. Nothing is feature-gated. **Website** = `https://mcflyads.com`. **App URL / Privacy / Support / Terms** stay on Fly `https://mcfly-analytics.fly.dev`. Never App URL = mcflyads.com. Human paste pack: [`ops/LISTING_LIVE_PASTE.md`](./ops/LISTING_LIVE_PASTE.md).

Human still must: confirm ASO checklist below, upload icon + **Live Admin** shots (**no pricing in images**, no `/demo` SAMPLE as live product), set Partner **Pricing = Shopify App Pricing (one plan, $39/store/mo, 7-day free trial — no Free plan)**; rename plan **Pro** → **Mcfly Analytics**; paste **App testing information** from [`PARTNER_TESTING_INSTRUCTIONS.md`](./PARTNER_TESTING_INSTRUCTIONS.md) (check “My app doesn't require an account to use it”) if Shopify opens a listing re-review. **Save** in Partner. Cursor does not Submit.

## ASO checklist (before paste) — human only

Leave these unchecked until a human verifies in Partner. Agents do **not** flip these boxes.

- [ ] **Keywords only:** `shopify analytics`, `typical order`, `customer LTV`, `sales reports`, `ROAS` — never attribution / pixel / true ROAS / Profit Agent / P&L bait
- [ ] **Short description** ≤ ~150 chars; lead with depth Shopify Analytics skips and make spend optional — **no plan prices** (4.2.3)
- [ ] **Long description** opens on Overview (this month vs same days last year, typical order, returning dollars); Total ROAS is chapter two as honest MER; trial and paid share up to 24 months (not ~60d primary); Live Admin + SAMPLE on `/demo`; **no $ /mo in this field**
- [ ] **Sales channel requirements:** do **not** check “Merchant must have online store” — this app is Admin-only (4.3.1)
- [ ] **Trust URLs** stay on Fly: `https://mcfly-analytics.fly.dev/privacy` `/support` `/terms`. Never App URL = mcflyads.com. **Website** = `https://mcflyads.com`. Spot-check the live mcflyads.com version before Save.
- [ ] **PCD copy** still: opaque customer id + `numberOfOrders` only — no CRM / name / email
- [ ] **Works with:** leave blank (no Checkout UI extension) — never Meta/Google/SyncWith; Checkout only if you later ship a real Checkout surface
- [ ] Screenshots + M-only icon per [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md) — **Live Admin only**

Partner listing URLs (live listing `mcfly-analytics-public`). **Privacy / Support / Terms / App URL** stay on Fly. Partner **Website** field is `https://mcflyads.com`. Spot-check the live mcflyads.com version before Save. Never App URL = mcflyads.com.

| Field | URL |
| --- | --- |
| Website | https://mcflyads.com |
| Privacy | https://mcfly-analytics.fly.dev/privacy |
| Support | https://mcfly-analytics.fly.dev/support |
| Terms | https://mcfly-analytics.fly.dev/terms |
| App URL | https://mcfly-analytics.fly.dev |

Never set App URL to mcflyads.com.

**Human runbook:** [`ops/LISTING_LIVE_PASTE.md`](./ops/LISTING_LIVE_PASTE.md) · shots [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md) · requirement matrix [`APP_STORE_REQUIREMENT_MATRIX.md`](./APP_STORE_REQUIREMENT_MATRIX.md) · scorecard [`SUBMIT_READY_SCORECARD.md`](./SUBMIT_READY_SCORECARD.md)

---

## Listing basics

| Field | Draft |
| --- | --- |
| **App name** | Mcfly Analytics |
| **Tagline** (≤80 chars) | See three **Marty picks** options below |
| **Category** | Marketing → Marketing analytics / Advertising (pick closest) — orders-first Overview; spend optional |
| **Primary language** | English |
| **Pricing** | **Shopify App Pricing: one plan, $39/store/mo after a 7-day free trial** — see [`BILLING_TIERS.md`](./BILLING_TIERS.md). In-app Start trial / Manage plan must match Partner plans. Do **not** list a Free plan — the app has no feature gate to justify one. |

**Tagline options (≤80 chars — Marty picks one):**

1. **Marty picks:** Shopify Analytics skips YoY, typical order, returning dollars, and LTV  
2. **Marty picks:** This month vs last year, typical order, returning dollars — from orders  
3. **Marty picks:** Your Shopify orders as a morning number. Spend next to sales, flat $39  

**Tagline why:** Option 1 keeps the current line. Options 2–3 lead with the first screen without claiming what Shopify Analytics lacks. Spend / Total ROAS stays in short + long as optional.

---

## Explicitly deferred for first resubmit (do not expand scopes)

| Defer | Why |
| --- | --- |
| Lifetimely-class **email CRM / Level 2 PCD** | Harder review; till LTV does not need it — [`PCD_AND_LTV.md`](./PCD_AND_LTV.md) |
| Live Meta / Google Ads OAuth | **Retired** — CSV + optional merchant-paid pipes; see [`RETIRED_SURFACES.md`](./RETIRED_SURFACES.md) |
| `read_all_orders` (deep history) | **Not in live SCOPES** until Partner approves — omit from TOML/Fly until approved. Reviewer notes must not imply the scope is granted. See [`PCD_AND_LTV.md`](./PCD_AND_LTV.md). Still **no** Level 2 PII fields. |
| Customer PII fields (name/email/phone/address) | Never for v1; opaque id + `numberOfOrders` + OrderFact amounts/dates only |

---

## Partner Dashboard fields (paste checklist)

Complete these in Partner **App listing** before Submit. **Works with = blank** (no Checkout UI extension — do not claim Checkout). Never invent Meta/Google/SyncWith logos. Listing copy must not imply OAuth is “never.”

**Paste order (human, ~15 min once shots exist):**
1. App name / email / language / category / Pricing **Shopify App Pricing · one plan $39 + 7-day trial** / **Works with = blank** (no Checkout UI extension; never Meta/Google/SyncWith)  
2. Website = mcflyads.com + Privacy / Support / Terms URLs = Fly origin table above (never App URL = mcflyads.com)
3. App URL = `https://mcfly-analytics.fly.dev` (never mcflyads.com)  
4. Search keywords from table below (ban attribution / pixel / true ROAS / MTA)  
5. App icon = `docs/listing-assets/mcfly-app-icon-1200.png`  
6. Five screenshots + captions from [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md)  
7. Short description → long description → feature bullets → reviewer notes (sections below)  
8. PCD Level 1 only (§PCD + [`PCD_AND_LTV.md`](./PCD_AND_LTV.md)) · Distribution = Shopify App Store · Submit

| Field | Set to | Notes |
| --- | --- | --- |
| **App name** | Mcfly Analytics | Must match embedded app + trust pages |
| **Developer / support email** | mcflyadsmmm@gmail.com | Same as reviewer notes |
| **Primary language** | English | No fake multi-language until translated |
| **Category** | Marketing → **Marketing analytics** (or closest: Advertising) | Position as Shopify Analytics depth with optional spend—not “Store design” or profit-suite sprawl |
| **Pricing** | **Shopify App Pricing: one plan, $39, 7-day trial** | Must match the in-app Start trial CTA. No **External charges**. One plan = the whole desk: every named platform + extras, LTV, full Goals. No Free plan. |
| **Works with** | **Leave blank** | No Checkout UI extension today — do **not** claim Checkout. Never Meta/Google/TikTok/SyncWith logos. Add Checkout later only if a real Checkout surface ships. |
| **Online Store required?** | **No — leave unchecked** | Admin-only desk. Do not select “Merchant must have online store” (4.3.1). |
| **Website** | https://mcflyads.com | Never App URL = mcflyads.com. Privacy / Support / Terms stay Fly. |
| **Privacy policy URL** | https://mcfly-analytics.fly.dev/privacy | PCD Level 1 scopes; no waitlist |
| **Support URL** | https://mcfly-analytics.fly.dev/support | App Store install steps; no shop-domain form |
| **Terms URL** | https://mcfly-analytics.fly.dev/terms | One plan, $39 after a 7-day trial; Utah law |
| **App URL** | https://mcfly-analytics.fly.dev | Never mcflyads.com |
| **Search keywords** | shopify analytics, typical order, customer LTV, sales reports, ROAS | ASO spine only — ban “attribution,” “pixel,” “true ROAS,” “MTA,” Profit Agent, P&L, Triple Whale |
| **Demo store** | Leave blank for v1 | Optional post-submit; sample desk is in-app only |
| **App icon** | `docs/listing-assets/mcfly-app-icon-1200.png` | 1200×1200, **M-only** ribbon |
| **Screenshots** | 5 PNGs per [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md) | Unique compositions (4.4.4) |

**Pre-flight:** Distribution = **Shopify App Store** · PCD submitted · curl **Fly** `/privacy` `/support` `/terms` (do **not** send reviewers to stale mcflyads.com Pages).

---

## First 10 minutes (reviewer notes only — do not paste into listing body)

Merchants (and reviewers) should get Shopify-depth sales immediately, before adding spend. Spend Upload and Total ROAS can then show typed spend, certified windows, and Channel Allocation without auto-sync theater. **Do not paste dollar amounts into the public listing.** Reviewer notes may include the $39 plan so App Review can test billing.

```text
FIRST STEPS (Shopify-depth tabs work before spend; no required pixel)
1. Install Mcfly Analytics from the Shopify App Store — opens embedded in Admin
2. Overview → this month / quarter / year vs last year, typical order, chart.
   Trial and paid include up to 24 months of order history.
   Never invent last year as zero while history is still loading.
3. Open Customers, Growth, Orders, and LTV (work at zero spend). Then Goals.
4. Admin is Live-only (your store orders). Labeled SAMPLE walkthrough is on
   https://mcflyads.com/demo — not inside Admin.
   Optional: Spend Upload → type one daily spend entry or upload a spend file
   CSV remains for many days / Ads Manager export.
   Optional automation: Spend Upload → Mcfly template → SyncWith / Coupler /
   Supermetrics / Coefficient (you pay those tools) → CSV → Paste / Import.
   Not a “Works with” partnership.
   The whole desk ships on the same plan (trial and paid).
5. Total ROAS → honest MER (Shopify Total Sales ÷ spend you entered). Certified
   windows Yesterday / last N / this month / quarter / year. At goal vs the
   Settings target. Empty spend is an em dash, not 0×. Ledger and dual-close
   sit on that page. Channel Allocation is mix + spend left at goal.
```

**Listing honesty:** The demo that opens uses Meta, Google, Email, and Other. Type another name if you buy somewhere else. Trial and paid both keep the full desk — nothing is feature-gated. Goals is one saved target, not a field on Settings. We do not require a pixel. We do not claim attributed campaign ROAS, platform overlap, Profit Agent, or a P&L suite. We do not replace Ads Manager numbers.

---

## Short description (~150 chars; Shopify often caps ~150)

<!-- APP_STORE_PASTE:short -->
```text
Shopify Analytics skips YoY, typical order, returning dollars, weekends, and 30/90/365 LTV. Add spend later for Meta, Google, Email, or Other.
```
<!-- /APP_STORE_PASTE:short -->

**Why:** Depth Shopify Analytics skips first; spend optional. The demo uses Meta, Google, Email, and Other. Plan prices live in Partner Pricing details only (4.2.3).

---

## Long description (paste)

<!-- APP_STORE_PASTE:long -->
```text
Overview opens on this month versus the same days last year from your Shopify orders — plus typical order and returning dollars, with this quarter and this year on the same screen and a sales chart.

Customers, Growth, Orders, and LTV work with no spend: days to a second order, weekend share, and new-buyer value at 30 / 90 / 365 days. Trial and paid both keep the full desk, up to 24 months of orders. Admin opens on your live store orders. Never invent last year as zero while history is still loading. The public demo is Sample shop at https://mcflyads.com/demo — it is not inside Admin.

Spend is optional. Type or CSV daily spend when you want Total ROAS—the honest MER: Shopify Total Sales ÷ the marketing spend you entered. Empty spend is an em dash, not 0×. The demo that opens uses Meta, Google, Email, and Other. Type another name if you buy somewhere else. Total ROAS is not platform ROAS, not attributed campaign ROAS, not net profit, and not a claim about which ad caused a sale. Mcfly does not use pixels, multi-touch attribution, “true ROAS,” Profit Agent theater, or a P&L suite. Mcfly does not show which platforms claimed the same purchase.

WHAT YOU GET
• Overview — this month / quarter / year vs last year, typical order, and a sales chart
• Customers — returning dollars, guest checkouts, and repeat depth
• Growth — days to a second order and who came back
• Orders — order range, discounts, returns, sources, weekend share, busiest weekday
• LTV — new-buyer value at 30 / 90 / 365 days
• Spend Upload — typed or CSV daily spend for Meta, Google, Email, or Other
• Total ROAS — honest MER (sales ÷ entered spend). Empty spend is an em dash, not 0×
• YoY — this month vs last month vs last year, plus last 7
• CPA — cash cost per customer when spend exists
• Goals — one saved target. Settings does not ask for it
• Total ROAS = Shopify Total Sales ÷ spend you entered

WHAT WE NEVER DO
• Pixels, view-through, or multi-touch attribution
• Claim “true ROAS,” platform ROAS, or attributed campaign ROAS
• Treating empty spend as 0× Total ROAS
• Profit Agent theater or a multi-channel P&L as the install reason

Learn more: https://mcflyads.com
Privacy: https://mcfly-analytics.fly.dev/privacy · Support: https://mcfly-analytics.fly.dev/support
App URL: https://mcfly-analytics.fly.dev
```
<!-- /APP_STORE_PASTE:long -->

**Why it converts:** Shopify Analytics gap in line one → Overview YoY + Shopify-depth tabs → optional spend as honest MER (Total ROAS), not attributed campaign ROAS. Prices stay in Partner Pricing details only.

---

## Feature bullets (listing UI — paste in order)

<!-- APP_STORE_PASTE:features -->
```text
This month vs the same days last year from orders — typical order and returning dollars
Returning dollars, guest checkouts, and days to a second order with no spend
Weekend share, busiest weekday, and the range where most Shopify orders land
New-buyer value at 30 / 90 / 365 days. One target is saved on Goals, not Settings
Optional typed spend for Meta, Google, Email, or Other — Total ROAS is honest MER (sales ÷ spend you added), not platform ROAS
```
<!-- /APP_STORE_PASTE:features -->

**Why this order:** Overview YoY → Customers / Growth → Orders → LTV and Goals → optional Total ROAS as honest MER. No plan prices, “one plan,” or “free trial” in this field (4.2.3).

---

## Screenshots (after install — real Admin UI)

Capture from **embedded Admin** on `devmcflyads` (not the marketing site). Target ~1600×900 PNG.  
Shot order + captions: [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md).

| # | Screen | Caption (≤80) | What to show |
| --- | --- | --- | --- |
| 1 | Overview YoY | See this month, quarter, and year vs last year plus typical order | This month / quarter / year vs last year + typical order + chart |
| 2 | Customers | Follow returning dollars and guest checkouts with no spend required | Returning dollars, guest checkouts (works at zero spend) |
| 3 | Orders | See weekend share, busiest weekday, and the range most orders land | Weekend mix, busiest weekday, most-orders range |
| 4 | LTV | Follow new-buyer value at 30, 90, and 365 days from Shopify orders | 30 / 90 / 365-day new-buyer value |
| 5 | Total ROAS chips | Total ROAS is honest MER—At goal vs target; empty spend is an em dash | Certified windows; em dash when spend is empty |

**App icon:** upload `docs/listing-assets/mcfly-app-icon-1200.png` (1200×1200, **M-only** — no wordmark).

**Feature Image 1 (header media):** **Marty recapture** Live Admin Overview YoY (current production Fly) and overwrite `docs/listing-assets/feature-media-1600x900.png`. Show this month / quarter / year vs last year, typical order, and the sales chart. Admin is Live-only — do not use https://mcflyads.com/demo SAMPLE for the live listing hero. Do not upload the old formula-only / three-year Total ROAS image or sample ROAS stats (`4.42x`, `Above break-even 2.86x`). Shots were **not** recaptured for this pack.

---

## Protected Customer Data (PCD) — answer honestly

**Full plain-English guide:** [`PCD_AND_LTV.md`](./PCD_AND_LTV.md) (Level 1 vs 2, till LTV, post-launch expansion).

**First submit:** request **Level 1 only**. Leave name / address / email / phone **unchecked**.

| Shopify level | Meaning | Mcfly first submit |
| --- | --- | --- |
| **Level 1** | Customer/order data **excluding** name, address, phone, email | **Request this** (orders + opaque customer id need it) |
| **Level 2** | Level 1 **plus** name / address / phone / email | **Do not request** — not needed for Total ROAS or till LTV |

### Partner PCD COPY-PASTE (Level 1 only) — use this block

**Click path:** Partner Dashboard → [Mcfly Analytics Public](https://dev.shopify.com/dashboard/227535001/apps/403721814017) → **Distribution** = Shopify App Store (required first) → **API access** → **Protected customer data** → **Request access** → check **Protected customer data** only → leave name / address / email / phone **unchecked** → paste answers below → save.

```text
=== CHECKBOXES ===
☑ Protected customer data (Level 1)
☐ Customer name
☐ Customer address
☐ Customer email
☐ Customer phone
(Do NOT check any Level 2 field.)

=== WHY WE NEED PROTECTED CUSTOMER DATA ===
Mcfly Analytics is a cash Total ROAS desk: Shopify Total Sales ÷ ad spend, break-even Total ROAS from profit margin, and rules-based spend affordability. We need Level 1 order/customer data to sum order totals and counts for Total ROAS / AOV, and to classify new vs returning customers for the same period. We never request or store customer name, email, phone, or address. We do not build a customer CRM or run marketing outreach.

=== HOW WE USE read_orders ===
Sum Shopify order totals (Total Sales for Monday actions; Net Sales optional view) and order counts for Total ROAS and AOV over merchant-selected periods (MTD / QTD / YTD / custom).

=== HOW WE USE read_customers ===
On each order we read only the opaque customer id and numberOfOrders to classify that order’s buyer as new vs returning for the period. No name, email, phone, or address. No CRM profiles.

=== HOW WE USE read_all_orders (when approved) ===
Deep till history beyond ~60 days for OrderFact backfill and till LTV cohorts (opaque customerKey + amounts/dates only). Still Level 1 — never Level 2 PII fields. Without it, history is limited and cohorts underclaim.

=== DATA WE STORE ===
• Shop domain + OAuth sessions (staff Session may include staff email / firstName / lastName from Shopify Admin login — merchant staff, not customers)
• Settings (margin %, targets), merchant-entered ad spend aggregates, Total ROAS / sales-day facts
• OrderFact / CohortFact: opaque customerKey + order amounts/dates only — no CRM
• ComplianceDataExport: temporary Level-1 opaque order package for customers/data_request (order ids, amounts, dates, customerKey). Auto-purged after 60 days; erased earlier on customers/redact, shop/redact, or uninstall
• Support contact only when voluntarily emailed (mcflyadsmmm@gmail.com)

=== DATA WE DO NOT COLLECT ===
Customer name, email, phone, address. No pixels. No path attribution. No customer marketing lists.

=== CSV / SPEND PIPE ===
Merchant-supplied ad-spend aggregates only (CSV / Sheets). Optional SyncWith / Coupler / Supermetrics / Coefficient are merchant-chosen processors the merchant pays — Mcfly only receives the imported spend file. Not a “Works with” partnership.

=== RETENTION / REDACT ===
App data kept while installed. Uninstall and shop/redact delete shop record, sessions, spend, OrderFacts, CohortFacts, ComplianceDataExport packages, and related rows. customers/redact deletes matching OrderFacts (+ orders_to_redact), erases that customer’s ComplianceDataExport, and recomputes CohortFacts. ComplianceDataExport TTL = 60 days.

=== ENCRYPTION / ACCESS ===
HTTPS in transit (Fly.io). Database on our host only. Access limited to app runtime credentials and operators with production access. Privacy policy: https://mcfly-analytics.fly.dev/privacy

=== PRIVACY POLICY URL ===
https://mcfly-analytics.fly.dev/privacy
```

| Question theme | Answer |
| --- | --- |
| Why `read_orders`? | Sum Shopify order **totals** (Total Sales for actions; Net Sales optional view) and **order counts** for Total ROAS / AOV. |
| Why `read_customers`? | On each order, read only opaque customer `id` + `numberOfOrders` to classify new vs returning customers for the period. No CRM. |
| Customer name/email/address? | **No** — we never request name, email, phone, or address fields (Level 2). |
| Stored PII? | **No customer CRM.** Staff Session may hold staff email/name from Shopify login. New/returning counts are aggregates. We store shop domain, OAuth session, settings (margin), spend entries, Total ROAS / sales-day facts, OrderFact/CohortFact (opaque customerKey + amounts/dates), and temporary ComplianceDataExport (60-day TTL). |
| Till LTV? | Opaque id + order amounts/dates → CohortFact (30/90/365). Still Level 1. `read_all_orders` unlocks history beyond ~60 days (Partner approval; paste block in [`PCD_AND_LTV.md`](./PCD_AND_LTV.md)). Not Level 2. |
| CSV upload contents? | Merchant-supplied **ad-spend aggregates only**. Day + any named platform (+ custom extras). Long `date,channel,amount` also works. Sales columns ignored. No customer data. Optional SyncWith-class tools are merchant processors. |
| Retention | Shop data deleted on uninstall and on `shop/redact`. Level-1 `ComplianceDataExport` packages auto-purge after **60 days** and are erased earlier on `customers/redact`, `shop/redact`, and uninstall. |
| Data request / redact | Compliance webhook at `/webhooks/compliance` returns 200. `customers/data_request` stores a Level-1 opaque order package (order ids, amounts, dates, customerKey — no name/email/phone). `customers/redact` deletes matching OrderFacts (+ `orders_to_redact`), erases that package, and recomputes CohortFacts. Logs: shop + topic + counts only (no amount dumps). |
| Encryption / access | HTTPS in transit (Fly); DB only on our host; access limited to app runtime credentials. |
| Privacy policy | https://mcfly-analytics.fly.dev/privacy — discloses staff Session fields, `read_orders` + minimal `read_customers`, ComplianceDataExport 60-day TTL, merchant-chosen SyncWith-class processors, support email; GDPR topics fulfill Level-1 opaque order packages only. |

---

## Reviewer notes (paste into submission)

**App testing information (4.5.4 / 4.5.5):** paste [`PARTNER_TESTING_INSTRUCTIONS.md`](./PARTNER_TESTING_INSTRUCTIONS.md). Partner form: Username/Password **empty**, **check** “My app doesn't require an account to use it.” Do **not** paste `<PASTE…>` passwords. Reviewers start billing via Settings → **Start 7-day trial** (no Mcfly login). The whole desk is already available during the trial.

The testing-instructions textarea must include the TEST ACCOUNT block (Username: none / Password: none). That is what 4.5.4 asked for in [the pause screenshot](https://screenshot.click/12-40-wvht7-gytqd.png). Do **not** paste the public listing long description into that field.

PCD answers stay in **§ Protected Customer Data** above — different Partner form.

---

## Before you click Submit

- [x] `curl https://mcfly-analytics.fly.dev/health` → ok + db up
- [x] Compliance webhook rejects bad HMAC (401)
- [x] App code set to `AppDistribution.AppStore`; toml URLs locked; `automatically_update_urls_on_dev = false`
- [ ] Partner Dashboard: Distribution → **Shopify App Store** (**human**)
- [ ] PCD questionnaire submitted (**human**) — paste §PCD above
- [x] Publish Cloudflare Pages so live `/support` `/pricing` `/privacy` match the one-plan copy + PCD — **verified 2026-07-26** (spot-check 200s before Submit)
- [ ] Install on `devmcflyads`; smoke test above; sample desk **OFF** (**human**)
- [ ] Screenshots + M-only icon uploaded (**human**)
- [ ] Pricing = **Shopify App Pricing · ONE plan, $39/store/mo, 7-day free trial** — **delete the Free plan** (as of the 2026-08-26 smoke the live page still showed Free + Pro)
- [ ] App testing information: Username/Password **empty**, **check** “My app doesn't require an account to use it”, paste TEST ACCOUNT block from [`PARTNER_TESTING_INSTRUCTIONS.md`](./PARTNER_TESTING_INSTRUCTIONS.md)
- [ ] Embedded Admin smoke: Settings → Start 7-day trial → top-frame plans (no “refused to connect”)
- [ ] Submit for review (**human**)

Do **not** chase Built for Shopify until ~50 paid-plan installs + 5 reviews.
