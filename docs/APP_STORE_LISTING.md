# App Store listing draft — Mcfly Analytics

Paste into Partner listing when Distribution = **Shopify App Store**.  
**Pricing:** Free. **Religion:** Total ROAS (action) = **Shopify Total Sales ÷ ad spend** (any period); Net Sales optional view; never pixels / MTA / path / “true ROAS.” **Category:** marketing cash close / spend affordability control — coexists with attribution suites.  
**Voice:** calm operator desk — specific, factual, premium. No suite science theater. No forever-free.  
**First submit lock:** Free-only listing. Defer email CRM / Level 2 PCD. Minimal `read_customers` (opaque id + `numberOfOrders`) is OK. **Till LTV** (opaque cohorts) is Level 1 Pro — see [`PCD_AND_LTV.md`](./PCD_AND_LTV.md). Tier path: [`BILLING_TIERS.md`](./BILLING_TIERS.md). Positioning: [`VALUE_THESIS.md`](./VALUE_THESIS.md).

## Paste-ready short + long (Free submit — copy final)

**Status (2026-07-31 built-desk relock):** Tagline, short, long, feature bullets, reviewer notes match the shipped desk — Free = Meta + Google + custom Other; Pro teaser ($39) for named channels + LTV + full Goals board; listing Pricing stays Free; no “no paid gates” claim. Paste as-is into Partner; do not rewrite for “true ROAS,” LTV CRM, or Meta/Google logos.

Human still must: confirm ASO checklist below, upload icon + shots, set Pricing **Free**, then Submit.

## ASO checklist (before paste) — human only

Leave these unchecked until a human verifies in Partner. Agents do **not** flip these boxes.

- [ ] **Keywords only:** `Total ROAS`, `marketing efficiency ratio`, `Break-even Total ROAS`, `Shopify ad spend` — never attribution / pixel / true ROAS bait
- [ ] **Short description** ≤ ~150 chars; lead with Advanced Marketing Data Science Made Easy + Free
- [ ] **Long description** opens on Total Sales ÷ spend desk Shopify Analytics does not give; Free now; refuse block intact
- [ ] **Trust URLs** extensionless: `/privacy` `/support` `/terms` on mcflyads.com (never App URL = marketing site)
- [ ] **PCD copy** still: opaque customer id + `numberOfOrders` only — no CRM / name / email
- [ ] **Works with:** leave blank (no Checkout UI extension) — never Meta/Google/SyncWith; Checkout only if you later ship a real Checkout surface
- [ ] Screenshots + M-only icon per [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md)

Partner listing URLs (already live — Free + PCD voice on Pages; **verify HTTP 200 before Submit**):

| Field | URL |
| --- | --- |
| Website | https://mcflyads.com |
| Privacy | https://mcflyads.com/privacy |
| Support | https://mcflyads.com/support |
| Terms | https://mcflyads.com/terms |
| App URL (current) | https://mcfly-analytics.fly.dev |

(`.html` URLs 308 to the same pages — prefer extensionless canonicals in Partner fields.)

**Trust URL note:** Live mcflyads.com privacy / support / terms / pricing ship Free + PCD wording (Pages lag closed 2026-07-26). Spot-check each URL returns 200 and copy still matches this file before clicking Submit.

**Human runbook:** [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) · shots [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md) · scorecard [`SUBMIT_READY_SCORECARD.md`](./SUBMIT_READY_SCORECARD.md)

---

## Listing basics

| Field | Draft |
| --- | --- |
| **App name** | Mcfly Analytics |
| **Tagline** (≤80 chars) | Advanced Marketing Data Science Made Easy |
| **Category** | Marketing → Marketing analytics / Advertising (pick closest) — position as **marketing cash close / spend affordability control** |
| **Primary language** | English |
| **Pricing** | **Free** (design-partner launch). Listing Pricing stays Free until Billing is announced. Site may say Pro $39 with Free=Meta+Google+Other matrix — see [`BILLING_TIERS.md`](./BILLING_TIERS.md). Soft/hard feature gates in-app are OK; do not claim “no paid gates.” |

**Tagline why (45 chars):** Category promise first — MDS made easy; formula and Free live in short/long, not squeezed into 80.

---

## Explicitly deferred for first Free submit (do not expand scopes)

| Defer | Why |
| --- | --- |
| Lifetimely-class **email CRM / Level 2 PCD** | Harder review; till LTV does not need it — [`PCD_AND_LTV.md`](./PCD_AND_LTV.md) |
| Live Meta / Google Ads OAuth | **Retired** — CSV + optional merchant-paid pipes; see [`RETIRED_SURFACES.md`](./RETIRED_SURFACES.md) |
| Shopify Billing / paid plans | Listing stays **Free** until Billing API ships — see [`BILLING_TIERS.md`](./BILLING_TIERS.md) |
| `read_all_orders` (deep history) | **Declare in TOML**; Partner must approve before multi-year till LTV clears `historyLimited` — see [`PCD_AND_LTV.md`](./PCD_AND_LTV.md). Still **no** Level 2 PII fields. |
| Customer PII fields (name/email/phone/address) | Never for v1; opaque id + `numberOfOrders` + OrderFact amounts/dates only |

---

## Partner Dashboard fields (paste checklist)

Complete these in Partner **App listing** before Submit. **Works with = blank** (no Checkout UI extension — do not claim Checkout). Never invent Meta/Google/SyncWith logos. Listing copy must not imply OAuth is “never.”

**Paste order (human, ~15 min once shots exist):**
1. App name / email / language / category / Pricing **Free** / **Works with = blank** (no Checkout UI extension; never Meta/Google/SyncWith)  
2. Website + Privacy / Support / Terms URLs (extensionless mcflyads.com)  
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
| **Pricing** | **Free** | No Shopify Billing charges until announced; freemium feature gates OK (Free=Meta+Google+Other). No **External charges** while Free |
| **Works with** | **Leave blank** | No Checkout UI extension today — do **not** claim Checkout. Never Meta/Google/TikTok/SyncWith logos. Add Checkout later only if a real Checkout surface ships. |
| **Website** | https://mcflyads.com | |
| **Privacy policy URL** | https://mcflyads.com/privacy | Extensionless; local copy includes PCD scopes |
| **Support URL** | https://mcflyads.com/support | App Store install steps; no shop-domain form |
| **Terms URL** | https://mcflyads.com/terms | |
| **App URL** | https://mcfly-analytics.fly.dev | Never mcflyads.com |
| **Search keywords** | Total ROAS, marketing efficiency ratio, Break-even Total ROAS, Shopify ad spend | ASO spine only — ban “attribution,” “pixel,” “true ROAS,” “MTA” |
| **Demo store** | Leave blank for v1 | Optional post-submit; sample desk is in-app only |
| **App icon** | `docs/listing-assets/mcfly-app-icon-1200.png` | 1200×1200, **M-only** ribbon |
| **Screenshots** | 5 PNGs per [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md) | Unique compositions (4.4.4) |

**Pre-flight:** Distribution = **Shopify App Store** · PCD submitted · trust URLs still Free + PCD on live curl ([`REJECT_RISK_AUDIT.md`](./REJECT_RISK_AUDIT.md)).

---

## First 10 minutes (time to first trusted Total ROAS)

Merchants (and reviewers) should reach a **trusted Total ROAS** in under ten minutes without auto-sync theater. Paste this block into listing long description and reviewer notes.

```text
FIRST 10 MINUTES (no pixels; Free = Meta + Google + custom Other CSV)
1. Install Mcfly Analytics from the Shopify App Store (Free) — opens embedded in Admin
2. Settings → optional profit margin % → save → Break-even Total ROAS locks (1 ÷ margin)
3. Spend → Meta + Google (+ custom Other) → export daily CSV / paste → Import
   Optional automation: Spend → Automate → Mcfly pipe template → SyncWith / Coupler /
   Supermetrics / Coefficient (you pay those tools) → CSV → Paste / Import.
   Not a “Works with” partnership. Named platforms (TikTok, Microsoft, Amazon, …),
   Customer LTV, and the full Goals board = Pro ($39 when Billing announced).
4. Overview → confirm Total ROAS = Shopify Total Sales ÷ ad spend for any period;
   check freshness chip, channel mix %, Goals pace, Email Overview (mailto)
5. Spend Allocation → quarters / pie / rolling 7·14·28 affordability call on Free channels

Demo sample desk is for listing screenshots / Pro preview only — turn OFF before judging live metrics.
```

**Listing honesty:** Free = Meta + Google + custom Other CSV. **Optional automation** = merchant-paid SyncWith-class tools filling a Mcfly template (no fake Works-with). **Pro teaser** ($39): named channels, Customer LTV / Acquisition, full-year Goals board — listing Pricing stays Free until Billing announced. Soft/hard feature gates in-app are honest freemium — do not claim “no paid gates.” Still refuse connector zoo / pixels. Coexists with attribution suites.

---

## Short description (~150 chars; Shopify often caps ~150)

```text
Advanced Marketing Data Science Made Easy: Total ROAS (Total Sales ÷ spend), break-even, Goals, Allocation. Free. No pixels.
```

**Why (~128 chars):** Tagline phrase first + formula Shopify Analytics lacks + Free + refuse — no “true ROAS” bait.

---

## Long description (paste)

```text
Shopify Analytics shows sales. It does not show Total ROAS = Shopify Total Sales ÷ your ad spend for any period — with break-even, channel mix, Goals, and Allocation in one Admin desk.

Mcfly Analytics is Advanced Marketing Data Science Made Easy: marketing cash close / spend affordability control. Money out on ads versus money in on the till. Coexists with attribution suites — we do not rip-and-replace path decks. Ad platforms over-claim; multi-touch “truth” is mostly theater.

WHAT SHOPIFY ANALYTICS DOES NOT GIVE YOU
• Total ROAS = Shopify Total Sales ÷ ad spend (MTD / QTD / YTD / custom — any period you choose)
• Break-even Total ROAS from your profit margin %
• Spend by channel via CSV — mix in $ and %
• Spend Allocation — quarters, pie, rolling 7 / 14 / 28
• Goals — MTD / QTD / YTD pace + monthly board (full-year board on Pro)
• LTV / Acquisition — Cash CAC, cohort LTV, LTV:CAC (Pro)
• Email Overview — opens your mail app with this period’s cards (mailto; Mcfly never sends mail)

THE DESK
• Shopify Total Sales in (Admin API — action basis; Net Sales optional view)
• Ad spend out — Free: Meta + Google + custom Other (name influencers / podcasts / agency) via CSV paste / export combine
  Optional automation: SyncWith / Coupler / Supermetrics / Coefficient (you pay them) → Mcfly pipe template → CSV import — not a “Works with” partnership
  Pro ($39 when Billing announced): every named platform (TikTok, Microsoft, Amazon, Pinterest, Email, Affiliate, …), Customer LTV / Acquisition, full-year Goals board + YoY fill
  Per-platform export guides in-app (sales columns ignored — Shopify is the till)
• Total ROAS (action) = Shopify Total Sales ÷ ad spend
• Break-even Total ROAS from your profit margin %
• Channel mix + rules-based Spend Allocation on Free channels — portfolio affordability, not fake channel ROAS
• Freshness chip (“Last refreshed”) + Update spend throughout Overview
• Orders / new / returning / AOV for the same period (opaque customer id + numberOfOrders only — no CRM)
• Embedded in Shopify Admin — no second login, no public “type your .myshopify.com” form

WHAT WE DO NOT SHIP
• Path attribution / MTA / view-through credit
• Pixels or “true ROAS”
• Fake “driven revenue” that doesn’t match the till
• Spend-share allocation theater or fake channel ROAS
• Suite sprawl dressed as proprietary science

WHO IT’S FOR
Shopify brands that want a trusted Total ROAS in under ten minutes and a Monday cash-close ritual that stays honest when Ads Manager disagrees with the bank — alongside (not instead of) attribution suites.

PRICING
Free on the App Store now (Meta + Google + custom Other CSV desk). Listing Pricing stays Free — no Shopify Billing charges until announced. Soft/hard Pro feature gates may appear in-app (named channels, LTV, full Goals board); that is honest freemium, not a Billing charge. Target Pro $39/store/mo flat via Shopify Billing — announced before anything charges. Not a GMV-scaled suite tax. Not forever-free marketing.

Learn more: https://mcflyads.com
Privacy: https://mcflyads.com/privacy · Support: https://mcflyads.com/support
App URL: https://mcfly-analytics.fly.dev
```

**Why it converts:** Shopify gap in line one → MDS Made Easy → concrete desk Shopify Analytics lacks → Free Meta+Google+Other → honest Pro $39 teaser → refuse pixels/MTA.

---

## Feature bullets (listing UI — paste in order)

1. Total ROAS = Shopify Total Sales ÷ ad spend for any period — the ratio Shopify Analytics does not give  
2. Break-even Total ROAS from your profit margin %  
3. Free spend CSV: Meta + Google + custom Other · mix in $/% · Pro unlocks every named channel  
4. Spend Allocation (quarters, pie, rolling 7/14/28) + Goals MTD/QTD/YTD (+ full board on Pro)  
5. LTV/Acquisition on Pro (Cash CAC · cohort LTV · LTV:CAC) · Email Overview (mailto) · no pixels / MTA  

**Why this order:** Shopify gap → break-even → Free honesty → Allocation/Goals → Pro LTV + trust.

---

## Screenshots (after install — real Admin UI)

Capture from **embedded Admin** on `devmcflyads` (not the marketing site). Target ~1600×900 PNG.  
Shot order + captions: [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md).

| # | Screen | Caption (≤80) | What to show |
| --- | --- | --- | --- |
| 1 | Total ROAS scoreboard | Total ROAS = Total Sales ÷ spend | Hero Total ROAS + sales/spend + freshness chip |
| 2 | Explorer / mix | Channel mix $/% Shopify Analytics lacks | Explorer stacked mix + Update spend bar |
| 3 | Spend CSV | Meta + Google + Other → paste / combine | Free channels + export guides + combine import |
| 4 | Allocation | Quarters · pie · rolling 7/14/28 | Recommendation + mix visuals |
| 5 | Goals / Settings | Goals pace + break-even from margin | MTD/QTD/YTD gauges or margin → BE preview |

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
• Waitlist/support contact only when voluntarily submitted (mcflyadsmmm@gmail.com / mcflyads.com/support)

=== DATA WE DO NOT COLLECT ===
Customer name, email, phone, address. No pixels. No path attribution. No customer marketing lists.

=== CSV / SPEND PIPE ===
Merchant-supplied ad-spend aggregates only (CSV / Sheets). Optional SyncWith / Coupler / Supermetrics / Coefficient are merchant-chosen processors the merchant pays — Mcfly only receives the imported spend file. Not a “Works with” partnership.

=== RETENTION / REDACT ===
App data kept while installed. Uninstall and shop/redact delete shop record, sessions, spend, OrderFacts, CohortFacts, ComplianceDataExport packages, and related rows. customers/redact deletes matching OrderFacts (+ orders_to_redact), erases that customer’s ComplianceDataExport, and recomputes CohortFacts. ComplianceDataExport TTL = 60 days.

=== ENCRYPTION / ACCESS ===
HTTPS in transit (Fly.io). Database on our host only. Access limited to app runtime credentials and operators with production access. Privacy policy: https://mcflyads.com/privacy

=== PRIVACY POLICY URL ===
https://mcflyads.com/privacy
```

| Question theme | Answer |
| --- | --- |
| Why `read_orders`? | Sum Shopify order **totals** (Total Sales for actions; Net Sales optional view) and **order counts** for Total ROAS / AOV. |
| Why `read_customers`? | On each order, read only opaque customer `id` + `numberOfOrders` to classify new vs returning customers for the period. No CRM. |
| Customer name/email/address? | **No** — we never request name, email, phone, or address fields (Level 2). |
| Stored PII? | **No customer CRM.** Staff Session may hold staff email/name from Shopify login. New/returning counts are aggregates. We store shop domain, OAuth session, settings (margin), spend entries, Total ROAS / sales-day facts, OrderFact/CohortFact (opaque customerKey + amounts/dates), and temporary ComplianceDataExport (60-day TTL). |
| Till LTV? | Opaque id + order amounts/dates → CohortFact (30/90/365). Still Level 1. `read_all_orders` unlocks history beyond ~60 days (Partner approval; paste block in [`PCD_AND_LTV.md`](./PCD_AND_LTV.md)). Not Level 2. |
| CSV upload contents? | Merchant-supplied **ad-spend aggregates only**. Free default: Day + Meta + Google (+ custom Other). Pro wide: Day + Meta/Google/Microsoft/TikTok/…/named platforms. Long `date,channel,amount` also works. Sales columns ignored. No customer data. Optional SyncWith-class tools are merchant processors. |
| Retention | Shop data deleted on uninstall and on `shop/redact`. Level-1 `ComplianceDataExport` packages auto-purge after **60 days** and are erased earlier on `customers/redact`, `shop/redact`, and uninstall. |
| Data request / redact | Compliance webhook at `/webhooks/compliance` returns 200. `customers/data_request` stores a Level-1 opaque order package (order ids, amounts, dates, customerKey — no name/email/phone). `customers/redact` deletes matching OrderFacts (+ `orders_to_redact`), erases that package, and recomputes CohortFacts. Logs: shop + topic + counts only (no amount dumps). |
| Encryption / access | HTTPS in transit (Fly); DB only on our host; access limited to app runtime credentials. |
| Privacy policy | https://mcflyads.com/privacy — discloses staff Session fields, `read_orders` + minimal `read_customers`, ComplianceDataExport 60-day TTL, merchant-chosen SyncWith-class processors, waitlist/support contact; GDPR topics fulfill Level-1 opaque order packages only. |

---

## Reviewer notes (paste into submission)

```text
Test store: devmcflyads.myshopify.com
Test account: mcflyadsmmm@gmail.com

PRICING
Free listing (Partner Pricing = Free). No Shopify Billing API charges until announced.
Honest freemium: Free = Meta + Google + custom Other spend; Pro soft/hard gates may lock
named channels, Customer LTV / Acquisition, and the full Goals board — that is not a
Billing charge yet. Target Pro $39/store/mo flat when Billing ships. No external charges.

CRITICAL — SAMPLE DESK MUST BE OFF FOR LIVE SMOKE
Open Demo → Turn sample desk OFF before judging Total ROAS / Allocation.
(?shot=1 hides the SAMPLE banner for screenshots only — numbers stay sample until OFF.)

SMOKE TEST (CSV-first Free path = Meta + Google + Other)
1. Install Mcfly Analytics (App Store or Partner test install) — embedded Admin
2. Settings → optional profit margin 35% → save → Break-even Total ROAS locks
3. Spend → Meta + Google (+ Other) → export / paste daily CSV → Import
   Optional: Spend → Automate → pipe template → SyncWith/Coupler/etc. (merchant-paid) → CSV import
4. Overview → Total ROAS = Shopify Total Sales ÷ ad spend for the period
   Confirm freshness chip, Update spend links, channel mix, Email Overview (mailto)
   Confirm orders / new / returning / AOV (opaque customer id + numberOfOrders only)
5. Spend Allocation → quarters / pie / rolling windows when Free-channel spend > 0
   Goals → MTD / QTD / YTD pace on Free

First 10 minutes: Settings → Spend → Overview → Allocation. Free spend = Meta + Google + Other CSV; Automate is optional (merchant-paid SyncWith-class tools → Mcfly template — not a Works-with claim). Pro teaser optional later.

TECHNICAL
App URL: https://mcfly-analytics.fly.dev (not mcflyads.com)
Embedded in Admin. No public “type your .myshopify.com” install form.
Compliance: https://mcfly-analytics.fly.dev/webhooks/compliance
Uninstall deletes sessions + shop data.
Support: https://mcflyads.com/support
Privacy: https://mcflyads.com/privacy

PROTECTED CUSTOMER DATA (Level 1 only — no Level 2 PII fields)
- read_orders: sum order totals + counts for Total ROAS / AOV
- read_customers: opaque customer id + numberOfOrders only (new vs returning)
- read_all_orders: deep till history for OrderFact / till LTV cohorts (no PII)
- Never query or store customer name, email, phone, or address. No customer CRM.
- Staff Session may include staff email/name from Shopify Admin login (not customers).
- ComplianceDataExport (data_request packages) TTL 60 days; erased on redact/uninstall.
- Till LTV stays Level 1: opaque cohorts from order amounts/dates — not email CRM.
Without read_all_orders, order history is ~60 days — demo with recent orders / MTD.
```

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
- [ ] Pricing marked **Free**
- [ ] Reviewer notes pasted
- [ ] Submit for review (**human**)

Do **not** chase Built for Shopify until ~50 paid-plan installs + 5 reviews.
