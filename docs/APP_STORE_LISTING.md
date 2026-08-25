# App Store listing draft — Mcfly Analytics

Paste into Partner listing when Distribution = **Shopify App Store**.  
**Pricing:** Shopify App Pricing — **Free** (default) + **Pro $39/store/mo**. **Product:** exact spend from every platform (including billboards) next to Shopify sales, LTV Shopify Analytics does not compute, and a Goals board. Sales ÷ spend is a board number — never pixels / MTA / “true ROAS.”  
**Voice:** calm operator desk — specific, factual. No anti-pixel sermon. No forever-free.  
**Resubmit lock (2026-08-24):** Billing is live (`MCFLY_BILLING=1`). Partner Pricing **must** be Free + Pro $39 — never claim Free-only / “no charges.” Defer email CRM / Level 2 PCD. Minimal `read_customers` (opaque id + `numberOfOrders`) is OK. **Till LTV** (opaque cohorts) is Level 1 Pro — see [`PCD_AND_LTV.md`](./PCD_AND_LTV.md). Tier path: [`BILLING_TIERS.md`](./BILLING_TIERS.md). Positioning: [`STRATEGY.md`](../STRATEGY.md).

## Paste-ready short + long (Free + Pro — copy final)

**Status (2026-08-25):** Tagline, short, long, and feature bullets match STRATEGY. **4.2.2 / 4.2.3:** merchant-facing listing paste (short / long / features / captions / images) must **not** include plan prices. Put **$39** only in Partner **Pricing details** and in reviewer testing notes. Default plan = every named platform plus typed extras (billboards). Paid plan = Customer LTV + full-year Goals board.

Human still must: confirm ASO checklist below, upload icon + shots (**no pricing in images**), set Partner **Pricing = Shopify App Pricing (Free + Pro $39)**, paste **App testing information** from [`PARTNER_TESTING_INSTRUCTIONS.md`](./PARTNER_TESTING_INSTRUCTIONS.md) (check “My app doesn't require an account to use it”), then Submit.

## ASO checklist (before paste) — human only

Leave these unchecked until a human verifies in Partner. Agents do **not** flip these boxes.

- [ ] **Keywords only:** `ad spend`, `Shopify analytics`, `LTV`, `ROAS`, `billboards`, `marketing goals` — never attribution / pixel / true ROAS bait
- [ ] **Short description** ≤ ~150 chars; lead with spend next to Shopify (billboards included) — **no plan prices** (4.2.3)
- [ ] **Long description** opens on Shopify’s gap (no ad/offline cost, no LTV next to spend); **no $ /mo in this field**
- [ ] **Sales channel requirements:** do **not** check “Merchant must have online store” — this app is Admin-only (4.3.1)
- [ ] **Trust URLs** on the Fly origin: `https://mcfly-analytics.fly.dev/privacy` `/support` `/terms` (never App URL = mcflyads.com; Pages is still waitlist copy)
- [ ] **PCD copy** still: opaque customer id + `numberOfOrders` only — no CRM / name / email
- [ ] **Works with:** leave blank (no Checkout UI extension) — never Meta/Google/SyncWith; Checkout only if you later ship a real Checkout surface
- [ ] Screenshots + M-only icon per [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md)

Partner listing URLs for **this resubmit** (mcflyads.com Pages is still waitlist copy — do not send reviewers there until Cloudflare is published):

| Field | URL |
| --- | --- |
| Website | https://mcfly-analytics.fly.dev |
| Privacy | https://mcfly-analytics.fly.dev/privacy |
| Support | https://mcfly-analytics.fly.dev/support |
| Terms | https://mcfly-analytics.fly.dev/terms |
| App URL | https://mcfly-analytics.fly.dev |

App URL and Website may share the Fly host. Never set App URL to mcflyads.com.

**Human runbook:** [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) · shots [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md) · requirement matrix [`APP_STORE_REQUIREMENT_MATRIX.md`](./APP_STORE_REQUIREMENT_MATRIX.md) · scorecard [`SUBMIT_READY_SCORECARD.md`](./SUBMIT_READY_SCORECARD.md)

---

## Listing basics

| Field | Draft |
| --- | --- |
| **App name** | Mcfly Analytics |
| **Tagline** (≤80 chars) | All your ad spend — even billboards — next to Shopify |
| **Category** | Marketing → Marketing analytics / Advertising (pick closest) — spend next to Shopify metrics, LTV, and goals |
| **Primary language** | English |
| **Pricing** | **Shopify App Pricing: Free + Pro $39/store/mo** — see [`BILLING_TIERS.md`](./BILLING_TIERS.md). In-app Upgrade/Manage plan must match Partner plans. Do **not** mark listing Free-only while Upgrade CTAs charge. |

**Tagline why (53 chars):** Billboards prove this is not another Meta-OAuth clone. Formula and paid-plan details live in short/long, not squeezed into 80.

---

## Explicitly deferred for first Free submit (do not expand scopes)

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
1. App name / email / language / category / Pricing **Shopify App Pricing Free + Pro $39** / **Works with = blank** (no Checkout UI extension; never Meta/Google/SyncWith)  
2. Website + Privacy / Support / Terms URLs (Fly origin table above — not stale mcflyads.com Pages)  
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
| **Category** | Marketing → **Marketing analytics** (or closest: Advertising) | Position as **cash close / spend affordability** — not “Store design” or profit-suite sprawl |
| **Pricing** | **Shopify App Pricing: Free + Pro $39** | Must match in-app Upgrade. No **External charges**. Default plan = every named platform + extras; paid plan = LTV + full Goals |
| **Works with** | **Leave blank** | No Checkout UI extension today — do **not** claim Checkout. Never Meta/Google/TikTok/SyncWith logos. Add Checkout later only if a real Checkout surface ships. |
| **Online Store required?** | **No — leave unchecked** | Admin-only desk. Do not select “Merchant must have online store” (4.3.1). |
| **Website** | https://mcfly-analytics.fly.dev | Same host as App URL until mcflyads.com Pages is republished |
| **Privacy policy URL** | https://mcfly-analytics.fly.dev/privacy | PCD Level 1 scopes; no waitlist |
| **Support URL** | https://mcfly-analytics.fly.dev/support | App Store install steps; no shop-domain form |
| **Terms URL** | https://mcfly-analytics.fly.dev/terms | Free + Pro $39; Utah law |
| **App URL** | https://mcfly-analytics.fly.dev | Never mcflyads.com |
| **Search keywords** | ad spend, Shopify analytics, LTV, ROAS, billboards, marketing goals | ASO spine only — ban “attribution,” “pixel,” “true ROAS,” “MTA” |
| **Demo store** | Leave blank for v1 | Optional post-submit; sample desk is in-app only |
| **App icon** | `docs/listing-assets/mcfly-app-icon-1200.png` | 1200×1200, **M-only** ribbon |
| **Screenshots** | 5 PNGs per [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md) | Unique compositions (4.4.4) |

**Pre-flight:** Distribution = **Shopify App Store** · PCD submitted · curl **Fly** `/privacy` `/support` `/terms` (do **not** send reviewers to stale mcflyads.com Pages).

---

## First 10 minutes (reviewer notes only — do not paste into listing body)

Merchants (and reviewers) should reach a trusted Total ROAS after Settings → Spend → Overview, without auto-sync theater. **Do not paste dollar amounts into the public listing.** Reviewer notes may include the $39 plan so App Review can test billing.

```text
FIRST STEPS (no required pixel; default plan = every named platform + typed extras)
1. Install Mcfly Analytics from the Shopify App Store — opens embedded in Admin
2. Settings → optional profit margin % → save → Break-even Total ROAS locks (1 ÷ margin)
3. Spend → Add spend: amount + date + channel (or type Billboards — I-15) → Save
   CSV remains for many days / Ads Manager export.
   Optional automation: Spend → Automate → Mcfly pipe template → SyncWith / Coupler /
   Supermetrics / Coefficient (you pay those tools) → CSV → Paste / Import.
   Not a “Works with” partnership.
   Customer LTV and the full Goals board = paid plan (Shopify App Pricing — see Pricing details).
4. Overview → confirm Total ROAS = Shopify Total Sales ÷ ad spend for any period;
   check freshness chip, channel mix %, Goals pace, Email Overview (mailto)
5. Spend Allocation → quarters / pie / rolling 7·14·28 affordability call

Demo sample desk is for listing screenshots / paid-plan preview only — turn OFF before judging live metrics.
```

**Listing honesty:** Default plan = every named platform plus extras like billboards (type or CSV). **Optional automation** = merchant-paid SyncWith-class tools filling a Mcfly template (no fake Works-with). **Paid plan (price only in Partner Pricing details):** Customer LTV / Acquisition and the full-year Goals board. We do not require a pixel. We do not replace Ads Manager attribution.

---

## Short description (~150 chars; Shopify often caps ~150)

<!-- APP_STORE_PASTE:short -->
```text
Add spend from Meta, Google, TikTok, or billboards. See it next to Shopify sales, LTV, and goals — numbers Shopify Analytics does not combine.
```
<!-- /APP_STORE_PASTE:short -->

**Why:** Shopify gap in one breath + billboards (not a Meta clone) + LTV/goals. Plan prices live in Partner Pricing details only (4.2.3).

---

## Long description (paste)

<!-- APP_STORE_PASTE:long -->
```text
Shopify Analytics shows sales. It does not ingest Meta, Google, TikTok, or billboard cost, and it does not compute LTV next to that spend.

Mcfly Analytics is the Admin app where you add exact spend from every platform — even billboards — and see it beside Shopify sales for the same dates. Total ROAS = Shopify Total Sales ÷ the spend you added. It is not platform ROAS, not net profit, and not which ad to scale. The paid plan unlocks customer LTV/payback and a full-year Goals board.

WHAT YOU GET
• Add spend: type one day (amount + date + channel, or a named extra like billboards) or upload a CSV for many days
• Every named platform plus extras on the default plan — TikTok, Amazon, email, radio, billboards
• Total ROAS = Shopify Total Sales ÷ spend for any period (MTD / QTD / YTD / custom)
• Break-even Total ROAS from optional profit margin
• Spend Allocation — quarters, pie, rolling 7 / 14 / 28
• Goals — this period vs your Total ROAS goal; full-year board on the paid plan
• LTV / Acquisition — Cash CAC, cohort LTV, LTV:CAC on the paid plan
• Email Overview — opens your mail app with this period’s cards (mailto; Mcfly never sends mail)

THE DESK
• Shopify Total Sales in (Admin API — action basis; Net Sales optional view)
• Ad spend out — upload, paste, or type extras. Optional automation: SyncWith / Coupler / Supermetrics / Coefficient (you pay them) → Mcfly template → CSV import — not a Works with partnership
• Total ROAS (action) = Shopify Total Sales ÷ ad spend
• Channel mix in dollars and percent
• Freshness chip plus Update spend throughout Overview
• Orders / new / returning / AOV for the same period (opaque customer id + numberOfOrders only — no CRM)
• Embedded in Shopify Admin — no second login, no public type-your-shop form

WHAT WE DO NOT SHIP
• Path attribution / MTA / view-through credit
• A required pixel or “true ROAS”
• Fake driven revenue that does not match the till
• Full COGS / Amazon P&L (not a profit suite)

WHO IT’S FOR
Shopify operators who need every dollar out — including offline — next to Shopify metrics, plus LTV and goals Shopify Analytics does not combine.

Plan prices are in the Pricing details section of this listing — not here. Upgrade and Manage plan run through Shopify App Pricing in Admin.

Learn more: https://mcfly-analytics.fly.dev
Privacy: https://mcfly-analytics.fly.dev/privacy · Support: https://mcfly-analytics.fly.dev/support
App URL: https://mcfly-analytics.fly.dev
```
<!-- /APP_STORE_PASTE:long -->

**Why it converts:** Shopify gap in line one → billboards as proof → paid plan is LTV + Goals (not hidden channels).

---

## Feature bullets (listing UI — paste in order)

<!-- APP_STORE_PASTE:features -->
```text
Add spend from every platform — even billboards — next to Shopify sales
Total ROAS = Shopify Total Sales ÷ spend you added — not platform ROAS
Break-even from optional profit margin · Spend Allocation
Customer LTV and payback Shopify Analytics does not compute (paid plan)
Full-year Goals board on the paid plan · Email Overview (mailto)
```
<!-- /APP_STORE_PASTE:features -->

**Why this order:** Spend in (billboards) → formula → break-even/allocation → paid LTV → paid Goals. No plan prices in this field (4.2.3).

---

## Screenshots (after install — real Admin UI)

Capture from **embedded Admin** on `devmcflyads` (not the marketing site). Target ~1600×900 PNG.  
Shot order + captions: [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md).

| # | Screen | Caption (≤80) | What to show |
| --- | --- | --- | --- |
| 1 | Overview | Shopify sales next to the spend you added | Hero Total ROAS + sales/spend |
| 2 | Formula | Sales ÷ spend — the formula this desk uses | Equation panel, period MTD |
| 3 | Add spend | Add a billboard or any platform in one field | Amount + date + channel / typed extra |
| 4 | LTV | LTV and payback Shopify Analytics does not show | Cohort windows labeled vs period CAC |
| 5 | Goals | Full-year Goals board next to this period | PeriodControl + year board |

**App icon:** upload `docs/listing-assets/mcfly-app-icon-1200.png` (1200×1200, **M-only** — no wordmark).

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

**App testing information (4.5.4 / 4.5.5):** paste [`PARTNER_TESTING_INSTRUCTIONS.md`](./PARTNER_TESTING_INSTRUCTIONS.md). Partner form: Username/Password **empty**, **check** “My app doesn't require an account to use it.” Do **not** paste `<PASTE…>` passwords. Reviewers reach Pro via Spend → **Upgrade to Pro** (no Mcfly login).

The testing-instructions textarea must include the TEST ACCOUNT block (Username: none / Password: none). That is what 4.5.4 asked for in [the pause screenshot](https://screenshot.click/12-40-wvht7-gytqd.png). Do **not** paste the public listing long description into that field.

PCD answers stay in **§ Protected Customer Data** above — different Partner form.

---

## Before you click Submit

- [x] `curl https://mcfly-analytics.fly.dev/health` → ok + db up
- [x] Compliance webhook rejects bad HMAC (401)
- [x] App code set to `AppDistribution.AppStore`; toml URLs locked; `automatically_update_urls_on_dev = false`
- [ ] Partner Dashboard: Distribution → **Shopify App Store** (**human**)
- [ ] PCD questionnaire submitted (**human**) — paste §PCD above
- [x] Publish Cloudflare Pages so live `/support` `/pricing` `/privacy` match Free + PCD — **verified 2026-07-26** (spot-check 200s before Submit)
- [ ] Install on `devmcflyads`; smoke test above; sample desk **OFF** (**human**)
- [ ] Screenshots + M-only icon uploaded (**human**)
- [ ] Pricing = **Shopify App Pricing Free + Pro $39** (never Free-only while Upgrade is live)
- [ ] App testing information: Username/Password **empty**, **check** “My app doesn't require an account to use it”, paste TEST ACCOUNT block from [`PARTNER_TESTING_INSTRUCTIONS.md`](./PARTNER_TESTING_INSTRUCTIONS.md)
- [ ] Embedded Admin smoke: Spend → Upgrade to Pro → top-frame plans (no “refused to connect”)
- [ ] Submit for review (**human**)

Do **not** chase Built for Shopify until ~50 paid-plan installs + 5 reviews.
