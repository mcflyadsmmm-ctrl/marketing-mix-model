# App Store listing draft — Mcfly Analytics

Paste into Partner listing when Distribution = **Shopify App Store**.  
**Pricing:** Free. **Religion:** Total ROAS = Shopify sales ÷ ad spend — never pixels / MTA / path / “true ROAS.”  
**Voice:** calm operator desk — specific, factual, premium. No suite science theater. No forever-free.  
**First submit lock:** Free-only listing. Defer email CRM / Level 2 PCD. Minimal `read_customers` (opaque id + `numberOfOrders`) is OK. **Till LTV** (opaque cohorts) is post-launch Level 1 — see [`PCD_AND_LTV.md`](./PCD_AND_LTV.md). Tier path: [`BILLING_TIERS.md`](./BILLING_TIERS.md). Positioning: [`VALUE_THESIS.md`](./VALUE_THESIS.md).

## Paste-ready short + long (Free submit — copy final)

**Status (2026-07-26 freeze):** Short description, long description, feature bullets, tagline, reviewer notes, and PCD answers in this file are **final for first Free submit**. Paste as-is into Partner; do not rewrite for “true ROAS,” LTV CRM, or Meta/Google logos.

Human still must: confirm ASO checklist below, upload icon + shots, set Pricing **Free**, then Submit.

## ASO checklist (before paste) — human only

Leave these unchecked until a human verifies in Partner. Agents do **not** flip these boxes.

- [ ] **Keywords only:** `Total ROAS`, `Total ROAS`, `marketing efficiency ratio`, `Break-even Total ROAS`, `Shopify ad spend` — never attribution / pixel / true ROAS bait
- [ ] **Short description** ≤ ~150 chars; lead with Advanced Marketing Data Science / Total ROAS + Free
- [ ] **Long description** opens on Monday ritual + sales ÷ spend; Free now; refuse block intact
- [ ] **Trust URLs** extensionless: `/privacy` `/support` `/terms` on mcflyads.com (never App URL = marketing site)
- [ ] **PCD copy** still: opaque customer id + `numberOfOrders` only — no CRM / name / email
- [ ] **Works with:** Checkout only until live OAuth; no Meta/Google logos
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
| **Tagline** (≤80 chars) | Advanced Marketing Data Science — Total ROAS (sales ÷ spend), break-even |
| **Category** | Marketing → Marketing analytics / Advertising (pick closest) |
| **Primary language** | English |
| **Pricing** | **Free** (design-partner launch). Do not claim paid features until Shopify Billing ships. Site “~$79 later” is future — listing must stay Free. |

**Tagline why (~67 chars):** MDS category + formula explicit; break-even = Monday desk — no ROAS theater.

---

## Explicitly deferred for first Free submit (do not expand scopes)

| Defer | Why |
| --- | --- |
| Lifetimely-class **email CRM / Level 2 PCD** | Harder review; till LTV does not need it — [`PCD_AND_LTV.md`](./PCD_AND_LTV.md) |
| Live Meta / Google Ads OAuth | Not required for Free CSV desk; App Review delay |
| Shopify Billing / paid plans | Listing stays **Free** until Billing API ships — see [`BILLING_TIERS.md`](./BILLING_TIERS.md) |
| `read_all_orders` (deep history) | **Declare in TOML**; Partner must approve before multi-year till LTV clears `historyLimited` — see [`PCD_AND_LTV.md`](./PCD_AND_LTV.md). Still **no** Level 2 PII fields. |
| Customer PII fields (name/email/phone/address) | Never for v1; opaque id + `numberOfOrders` + OrderFact amounts/dates only |

---

## Partner Dashboard fields (paste checklist)

Complete these in Partner **App listing** before Submit. Do **not** invent connectors or “Works with Meta/Google” until live OAuth ships.

**Paste order (human, ~15 min once shots exist):**
1. App name / email / language / category / Pricing **Free** / Works with **Checkout** only  
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
| **Category** | Marketing → **Marketing analytics** (or closest: Advertising) | Not “Store design” or profit-suite sprawl |
| **Pricing** | **Free** | No Shopify Billing charges in app yet; no **External charges** while Free |
| **Works with** | **Checkout** only (honest minimum) | Do **not** list Meta/Google/TikTok logos — CSV-first spend, no pixel |
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
FIRST 10 MINUTES (no pixels, no ad OAuth required)
1. Install Mcfly Analytics from the Shopify App Store (Free) — opens embedded in Admin
2. Settings → set contribution margin % → save → Break-even Total ROAS updates live
3. Spend → select platforms you advertise on → export daily CSV from each (or use Mcfly template) → Import / combine
   (Meta, Google, Microsoft, TikTok, Pinterest, Snapchat, Reddit, X, LinkedIn, Amazon, Apple Search, Affiliate, Email, Other — no ad OAuth)
4. Total ROAS → confirm Shopify sales ÷ ad spend; check orders / new / returning / AOV
5. Allocation → one cut / shift / hold call when spend > 0

Demo sample desk is for listing screenshots only — turn OFF before judging live metrics.
```

**Listing honesty:** We do **not** promise Meta/Google auto-sync on v1. CSV + manual entry is the spine. Optional pipes later only if they stay honest pipes — never a connector zoo.

---

## Short description (~150 chars; Shopify often caps ~150)

```text
Advanced Marketing Data Science for Shopify: Total ROAS (sales ÷ spend), break-even, one Monday call. Free. No pixels.
```

**Why (~115 chars):** MDS + formula + Free; ends on refuse without baiting “true ROAS” search.

---

## Long description (paste)

```text
Every Monday: did ad spend clear break-even against what Shopify recorded as sales?

Mcfly Analytics is the cash desk — Shopify sales ÷ ad spend for the same period, Break-even Total ROAS from your contribution margin, then one clear allocation call. Free on the App Store now. Ad platforms over-claim; multi-touch “truth” is mostly theater. We measure money out on ads versus money in on the till.

THE DESK
• Shopify sales in (Admin API — MTD / QTD / YTD, or the period you choose)
• Ad spend out — select platforms → export daily CSV from each → Mcfly combines (no ad OAuth)
  Platforms: Meta, Google, Microsoft, TikTok, Pinterest, Snapchat, Reddit, X, LinkedIn, Amazon, Apple Search, Affiliate, Email, Other
  Per-platform export guides in-app; wide template (Day + channel columns) or long date,channel,amount
  (sales columns ignored — Shopify is the till)
• Total ROAS = Shopify sales ÷ ad spend
• Break-even Total ROAS from your contribution margin %
• Channel mix + one rules-based allocation recommendation (inputs visible)
• Orders / new / returning / AOV for the same period (opaque customer id + numberOfOrders only — no CRM)
• Embedded in Shopify Admin — no second login, no public “type your .myshopify.com” form

WHAT WE DO NOT SHIP
• Path attribution / MTA / view-through credit
• Pixels or “true ROAS”
• Fake “driven revenue” that doesn’t match the till
• Suite sprawl dressed as proprietary science

WHO IT’S FOR
Shopify brands that want a trusted Total ROAS in under ten minutes and a Monday ritual that stays honest when Ads Manager disagrees with the bank.

PRICING
Free on the App Store now. Flat paid pricing later via Shopify Billing (~$79/store/mo target) — announced before anything charges. Not a GMV-scaled suite tax. Not forever-free marketing.

Learn more: https://mcflyads.com
Privacy: https://mcflyads.com/privacy · Support: https://mcflyads.com/support
```

**Why it converts:** Monday + sales÷spend in the first two lines → Free early → CSV honesty → refuse → flat-later (no forever-free bait).

---

## Feature bullets (listing UI — paste in order)

1. Total ROAS = Shopify sales ÷ ad spend (MTD / QTD / YTD)  
2. Multi-platform spend CSV — select Meta, Google, Microsoft, TikTok, Pinterest, Snapchat, Reddit, X, LinkedIn, Amazon, Apple Search, Affiliate, Email, **Other** → export daily → combine (no ad OAuth)  
3. Break-even Total ROAS from your contribution margin %  
4. One rules-based allocation call with visible inputs  
5. GDPR webhooks + clean uninstall — no customer CRM  

**Why this order:** formula → multi-platform CSV combine (incl. Affiliate + Other) → break-even → decision → trust/compliance.

---

## Screenshots (after install — real Admin UI)

Capture from **embedded Admin** on `devmcflyads` (not the marketing site). Target ~1600×900 PNG.  
Shot order + captions: [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md).

| # | Screen | Caption (≤80) | What to show |
| --- | --- | --- | --- |
| 1 | Total ROAS scoreboard | Total ROAS vs break-even — one glance | Hero Total ROAS + sales/spend + status chip |
| 2 | Total ROAS definition | Sales ÷ spend — the only formula we use | **Crop to “Sales ÷ spend” panel** — not the hero KPI grid (see visual pack) |
| 3 | Spend CSV | Select platforms → export daily → combine | Platform checkboxes + export guides + combine import + **Other** column |
| 4 | Allocation | One clear cut / shift / hold call | Recommendation + efficiency bars |
| 5 | Settings | Lock break-even from your margin % | Margin input + live break-even preview |

**App icon:** upload `docs/listing-assets/mcfly-app-icon-1200.png` (1200×1200, **M-only** — no wordmark).

---

## Protected Customer Data (PCD) — answer honestly

**Full plain-English guide:** [`PCD_AND_LTV.md`](./PCD_AND_LTV.md) (Level 1 vs 2, till LTV, post-launch expansion).

**First submit:** request **Level 1 only**. Leave name / address / email / phone **unchecked**.

| Shopify level | Meaning | Mcfly first submit |
| --- | --- | --- |
| **Level 1** | Customer/order data **excluding** name, address, phone, email | **Request this** (orders + opaque customer id need it) |
| **Level 2** | Level 1 **plus** name / address / phone / email | **Do not request** — not needed for Total ROAS or till LTV |

| Question theme | Answer |
| --- | --- |
| Why `read_orders`? | Sum Shopify order **totals** and **order counts** for Total ROAS / AOV. |
| Why `read_customers`? | On each order, read only opaque customer `id` + `numberOfOrders` to classify new vs returning customers for the period. No CRM. |
| Customer name/email/address? | **No** — we never request name, email, phone, or address fields (Level 2). |
| Stored PII? | **No customer CRM.** New/returning counts are aggregates, not a customer database. We store shop domain, OAuth session, settings (margin), spend entries, Total ROAS / sales-day facts, and OrderFact/CohortFact (opaque customerKey + amounts/dates only). |
| Till LTV? | Opaque id + order amounts/dates → CohortFact (30/90/365). Still Level 1. `read_all_orders` unlocks history beyond ~60 days (Partner approval; paste block in [`PCD_AND_LTV.md`](./PCD_AND_LTV.md)). Not Level 2. |
| CSV upload contents? | Merchant-supplied **ad-spend aggregates only**. Wide template: Day + Meta/Google/Microsoft/TikTok/Pinterest/Snapchat/Reddit/X/LinkedIn/Amazon/Apple Search/Affiliate/Email/**Other**; long `date,channel,amount` also works. Sales columns ignored. No customer data. |
| Retention | Shop data deleted on uninstall and on `shop/redact`. |
| Data request / redact | Compliance webhook at `/webhooks/compliance` returns 200; nothing to export for customer topics (no customer records stored). |
| Encryption / access | HTTPS in transit (Fly); DB only on our host; access limited to app runtime credentials. |
| Privacy policy | https://mcflyads.com/privacy — discloses `read_orders` + minimal `read_customers` (opaque id + `numberOfOrders`), spend CSV, no CRM; GDPR topics have nothing to export for customers. |

---

## Reviewer notes (paste into submission)

```text
Test store: devmcflyads.myshopify.com
Test account: mcflyadsmmm@gmail.com

PRICING
Free listing. No in-app paid gates. No Shopify Billing API charges.
No external charges.

CRITICAL — SAMPLE DESK MUST BE OFF FOR LIVE SMOKE
Open Demo → Turn sample desk OFF before judging Total ROAS / Allocation.
(?shot=1 hides the SAMPLE banner for screenshots only — numbers stay sample until OFF.)

SMOKE TEST (CSV-first; no Meta/Google OAuth)
1. Install Mcfly Analytics (App Store or Partner test install) — embedded Admin
2. Settings → contribution margin 35% → save → Break-even Total ROAS updates
3. Spend → select platforms → export daily CSV from each (or Mcfly template) → Import / combine
   (Meta…Reddit, Affiliate, Email, Other — no ad OAuth; long date,channel,amount also works)
4. Total ROAS → Total ROAS = Shopify sales ÷ ad spend for the period
   Confirm orders / new / returning / AOV (new vs returning uses opaque customer id + numberOfOrders only)
5. Allocation → one cut/shift/hold recommendation when spend > 0

First 10 minutes: same five steps. v1 spend path is CSV or manual entry.

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
- Never query or store name, email, phone, or address. No customer CRM.
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
