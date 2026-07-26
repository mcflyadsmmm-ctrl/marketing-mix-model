# App Store listing draft — Mcfly Analytics

Paste into Partner listing when Distribution = **Shopify App Store**.  
**Pricing:** Free. **Religion:** cash MER = Shopify sales ÷ ad spend — never pixels / MTA / “true ROAS.”  
**Voice:** calm operator desk — specific, factual, premium. No suite science theater. No forever-free.  
**First submit lock:** Free-only listing. Defer Lifetimely-class **LTV / customer CRM** and paid Billing. Minimal `read_customers` (opaque id + `numberOfOrders`) is OK for new/returning — not deep LTV. Tier path: [`BILLING_TIERS.md`](./BILLING_TIERS.md). Positioning thesis: [`VALUE_THESIS.md`](./VALUE_THESIS.md).

Partner listing URLs (already live):

| Field | URL |
| --- | --- |
| Website | https://mcflyads.com |
| Privacy | https://mcflyads.com/privacy |
| Support | https://mcflyads.com/support |
| Terms | https://mcflyads.com/terms |
| App URL (current) | https://mcfly-analytics.fly.dev |

(`.html` URLs 308 to the same pages — prefer extensionless canonicals in Partner fields.)

**Human runbook:** [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) · shots [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md)

---

## Listing basics

| Field | Draft |
| --- | --- |
| **App name** | Mcfly Analytics |
| **Tagline** (≤80 chars) | Cash MER desk — Shopify sales ÷ spend, break-even, one Monday call |
| **Category** | Marketing → Marketing analytics / Advertising (pick closest) |
| **Primary language** | English |
| **Pricing** | **Free** (design-partner launch). Do not claim paid features until Shopify Billing ships. Site “~$79 later” is future — listing must stay Free. |

**Tagline why:** “desk” signals ritual, not a suite; formula is explicit; Monday call = break-even + allocation without ROAS theater. ~68 chars.

---

## Explicitly deferred for first Free submit (do not expand scopes)

| Defer | Why |
| --- | --- |
| Lifetimely-class **LTV / cohort CRM** | Hard PCD + review friction; not cash-desk religion |
| Live Meta / Google Ads OAuth | Not required for Free CSV desk; App Review delay |
| Shopify Billing / paid plans | Listing stays **Free** until Billing API ships — see [`BILLING_TIERS.md`](./BILLING_TIERS.md) |
| `read_all_orders` / customer PII fields | Never for v1; sales totals + opaque id + `numberOfOrders` only |

---

## Partner Dashboard fields (paste checklist)

Complete these in Partner **App listing** before Submit. Do **not** invent connectors or “Works with Meta/Google” until live OAuth ships.

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
| **Search keywords** | cash MER, marketing efficiency ratio, break-even MER, Shopify ad spend | No “attribution,” “pixel,” “ROAS truth” |
| **Demo store** | Leave blank for v1 | Optional post-submit; sample desk is in-app only |
| **App icon** | `docs/listing-assets/mcfly-app-icon-1200.png` | 1200×1200, **M-only** ribbon |
| **Screenshots** | 5 PNGs per [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md) | Unique compositions (4.4.4) |

**Pre-flight:** Distribution = **Shopify App Store** · PCD submitted · live Pages published so trust URLs match Free + PCD (see [`REJECT_RISK_AUDIT.md`](./REJECT_RISK_AUDIT.md)).

---

## First 10 minutes (time to first trusted MER)

Merchants (and reviewers) should reach a **trusted cash MER** in under ten minutes without auto-sync theater. Paste this block into listing long description and reviewer notes.

```text
FIRST 10 MINUTES (no pixels, no ad OAuth required)
1. Install Mcfly Analytics from the Shopify App Store (Free) — opens embedded in Admin
2. Settings → set contribution margin % → save → break-even MER updates live
3. Spend → download CSV template → enter a few days (include Other) → Import
   (or type channel totals manually)
4. Cash MER → confirm Shopify sales ÷ ad spend; check orders / new / returning / AOV
5. Allocation → one cut / shift / hold call when spend > 0

Demo sample desk is for listing screenshots only — turn OFF before judging live metrics.
```

**Listing honesty:** We do **not** promise Meta/Google auto-sync on v1. CSV + manual entry is the spine. Optional pipes later only if they stay honest pipes — never a connector zoo.

---

## Short description (~150 chars)

```text
Cash MER desk for Shopify: sales ÷ spend, break-even from margin, one allocation call. Free. No ROAS theater.
```

**Why it converts:** desk + formula in one breath; Free removes price friction; “no ROAS theater” positions without promising attribution science Shopify will reject. ~108 chars.

---

## Long description (paste)

```text
Mcfly Analytics is the cash desk for Shopify operators who run spend against the till — not against platform ROAS.

Every Monday: did ad spend clear break-even against what Shopify actually recorded? Ad platforms over-claim. Multi-touch “truth” is mostly theater. Mcfly measures only money out on ads versus money Shopify recorded as sales in the same period — then one clear allocation call against break-even MER.

THE DESK
• Shopify sales in (Admin API — MTD / QTD / YTD, or the period you choose)
• Ad spend out — daily CSV or manual totals (v1; no Meta/Google OAuth required)
  Template: Day, Meta, Google, Microsoft, TikTok, Affiliate, Email, Other
  (long format date / channel / amount also works; sales columns ignored)
• Cash MER = Shopify sales ÷ ad spend
• Break-even MER from your contribution margin %
• Channel mix + one rules-based allocation recommendation (inputs visible)
• Orders / new / returning / AOV for the same period (opaque customer id + numberOfOrders only — no CRM)
• Embedded in Shopify Admin — no second login, no public “type your .myshopify.com” form

WHAT WE DO NOT SHIP
• Path attribution / MTA / view-through credit
• Pixel causality or “true ROAS”
• Fake “driven revenue” that doesn’t match the till
• Suite sprawl dressed as proprietary science

WHO IT’S FOR
Shopify brands that want a trusted cash MER in under ten minutes and a Monday ritual that stays honest when Ads Manager disagrees with the bank.

PRICING
Free on the App Store now. Flat paid pricing later via Shopify Billing (~$79/store/mo target) — announced before anything charges. Not a GMV-scaled suite tax. Not forever-free marketing.

Learn more: https://mcflyads.com
```

**Why it converts:** Monday job first → formula → concrete CSV (incl. **Other**) → compliance-safe new/returning honesty → refuse block that earns operator trust → Free + flat-later removes both “what’s this cost?” and forever-free bait.

---

## Feature bullets (listing UI — paste in order)

1. Cash MER = Shopify sales ÷ ad spend (MTD / QTD / YTD)  
2. Daily spend CSV — Meta, Google, Microsoft, TikTok, Affiliate, Email, **Other** + manual entry  
3. Break-even MER from your contribution margin %  
4. One rules-based allocation call with visible inputs  
5. GDPR webhooks + clean uninstall — no customer CRM  

**Why this order:** formula → how spend gets in (incl. Other) → break-even → decision → trust/compliance.

---

## Screenshots (after install — real Admin UI)

Capture from **embedded Admin** on `devmcflyads` (not the marketing site). Target ~1600×900 PNG.  
Shot order + captions: [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md).

| # | Screen | Caption (≤80) | What to show |
| --- | --- | --- | --- |
| 1 | Cash MER scoreboard | Cash MER vs break-even — one glance | Hero MER + sales/spend + status chip |
| 2 | Cash MER definition | Sales ÷ spend — the only formula we use | **Crop to “Sales ÷ spend” panel** — not the hero KPI grid (see visual pack) |
| 3 | Spend CSV | Upload daily spend — all channels + Other | Template download + column cards + import |
| 4 | Allocation | One clear cut / shift / hold call | Recommendation + efficiency bars |
| 5 | Settings | Lock break-even from your margin % | Margin input + live break-even preview |

**App icon:** upload `docs/listing-assets/mcfly-app-icon-1200.png` (1200×1200, **M-only** — no wordmark).

---

## Protected Customer Data (PCD) — answer honestly

| Question theme | Answer |
| --- | --- |
| Why `read_orders`? | Sum Shopify order **totals** and **order counts** for cash MER / AOV. |
| Why `read_customers`? | On each order, read only opaque customer `id` + `numberOfOrders` to classify new vs returning customers for the period. No CRM. |
| Customer name/email/address? | **No** — we never request name, email, phone, or address fields. |
| Stored PII? | **No customer CRM.** New/returning counts are computed per request and not stored as a customer database. We store shop domain, OAuth session, settings (margin), spend entries, MER snapshots. |
| CSV upload contents? | Merchant-supplied **ad-spend aggregates only**. Wide template: Day + Meta/Google/Microsoft/TikTok/Affiliate/Email/**Other**; long `date,channel,amount` also works. Sales columns ignored. No customer data. |
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
Open Demo → Turn sample desk OFF before judging Cash MER / Allocation.
(?shot=1 hides the SAMPLE banner for screenshots only — numbers stay sample until OFF.)

SMOKE TEST (CSV-first; no Meta/Google OAuth)
1. Install Mcfly Analytics (App Store or Partner test install) — embedded Admin
2. Settings → contribution margin 35% → save → break-even MER updates
3. Spend → download CSV template → fill a few days (include Other) → Import
   (or paste long format: date,channel,amount — sales columns ignored)
4. Cash MER → cash MER = Shopify sales ÷ ad spend for the period
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

PROTECTED CUSTOMER DATA (minimal)
- read_orders: sum order totals + counts for cash MER / AOV
- read_customers: opaque customer id + numberOfOrders only (new vs returning)
- Never query or store name, email, phone, or address. No customer CRM / LTV suite.
Order history uses Shopify’s standard Admin access window (~60 days) — demo with recent orders / MTD.
```

---

## Before you click Submit

- [x] `curl https://mcfly-analytics.fly.dev/health` → ok + db up
- [x] Compliance webhook rejects bad HMAC (401)
- [x] App code set to `AppDistribution.AppStore`; toml URLs locked; `automatically_update_urls_on_dev = false`
- [ ] Partner Dashboard: Distribution → **Shopify App Store** (**human**)
- [ ] PCD questionnaire submitted (**human**) — paste §PCD above
- [ ] Publish Cloudflare Pages so live `/support` `/pricing` `/privacy` match Free + PCD (**human** — before review)
- [ ] Install on `devmcflyads`; smoke test above; sample desk **OFF** (**human**)
- [ ] Screenshots + M-only icon uploaded (**human**)
- [ ] Pricing marked **Free**
- [ ] Reviewer notes pasted
- [ ] Submit for review (**human**)

Do **not** chase Built for Shopify until ~50 paid-plan installs + 5 reviews.
