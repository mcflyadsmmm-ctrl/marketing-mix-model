# App Store listing draft — Mcfly Analytics

Use when submitting public listing (after Fly health + first install work).  
**App Store registration:** paid ✅  

Partner listing URLs (already live):

| Field | URL |
| --- | --- |
| Website | https://mcflyads.com |
| Privacy | https://mcflyads.com/privacy |
| Support | https://mcflyads.com/support |
| Terms | https://mcflyads.com/terms |
| App URL (current) | https://mcfly-analytics.fly.dev |

(`.html` URLs 308 to the same pages — prefer extensionless canonicals in Partner fields.)

**Runbook:** [`SUBMIT_TOMORROW.md`](./SUBMIT_TOMORROW.md)

---

## Listing basics

| Field | Draft |
| --- | --- |
| **App name** | Mcfly Analytics |
| **Tagline** (≤80 chars) | Cash MER for Shopify — spend vs sales, not attribution theater |
| **Category** | Marketing → Marketing analytics / Advertising (pick closest) |
| **Primary language** | English |
| **Pricing** | **Free** (design-partner launch). Do not claim paid features until Shopify Billing ships. Site “~$79 later” is future — listing must stay Free. |

---

## Short description (~150 chars)

```text
Stop optimizing platform ROAS. Mcfly shows cash MER: Shopify sales ÷ ad spend, break-even MER, and one allocation call.
```

## Long description (draft)

```text
Mcfly Analytics is a cash desk for Shopify operators.

Ad platforms over-claim conversions. Multi-touch “truth” is mostly theater. Mcfly measures only money spent on ads versus money Shopify recorded as sales in the same period — then helps you allocate against break-even MER.

WHAT YOU GET
• Shopify sales in (Admin API, period you choose)
• Ad spend out — upload one daily CSV (template: Day, Meta, Google, Microsoft, TikTok, Affiliate, Email, Other — or long date/channel/amount) or type totals manually
• Cash MER = sales ÷ spend
• Break-even MER from your contribution margin
• Channel mix + one auditable allocation recommendation
• Embedded in Shopify Admin — no second login

WHAT WE REFUSE
• Path attribution / MTA / view-through credit
• Pixel causality cosplay
• Fake “driven revenue” that doesn’t match the till

WHO IT’S FOR
Shopify brands that want a Monday ritual: did spend clear break-even against the bank account?

Free while we launch. Paid flat pricing later via Shopify Billing — not GMV-scaled suite tax.

Learn more: https://mcflyads.com
```

---

## Feature bullets (listing UI)

1. Cash MER dashboard (MTD / QTD / YTD)  
2. Daily spend CSV upload — multi-platform template (Meta, Google, Microsoft, TikTok, Affiliate, Email, Other) + manual entry fallback  
3. Break-even MER from margin %  
4. Rules-based allocation card with visible inputs  
5. GDPR webhooks + clean uninstall  

---

## Screenshots to capture (after install — real Admin UI)

Capture from **embedded Admin** on `devmcflyads` (not marketing site). Target ~1600×900 PNG.  
See also [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md).

| # | Screen | Caption | What to show |
| --- | --- | --- | --- |
| 1 | Cash MER scoreboard | See cash MER vs break-even | Hero MER + sales/spend + status chip |
| 2 | Customer mix KPIs | Track orders, new & returning | Orders / new / returning / AOV row |
| 3 | Spend CSV | Upload daily spend in one CSV | Template download + column cards + import |
| 4 | Settings | Lock break-even from margin | Margin + live break-even preview |
| 5 | Allocation | Get one clear allocation call | Cut/shift/hold + efficiency bars |

**App icon:** upload `docs/listing-assets/mcfly-app-icon-1200.png` (1200×1200).

Optional marketing: claims-vs-cash on https://mcflyads.com

---

## Protected Customer Data (PCD) — answer honestly

| Question theme | Answer |
| --- | --- |
| Why `read_orders`? | Sum Shopify order **totals** and **order counts** for cash MER / AOV. |
| Why `read_customers`? | On each order, read only opaque customer `id` + `numberOfOrders` to classify new vs returning customers for the period. No CRM. |
| Customer name/email/address? | **No** — we never request name, email, phone, or address fields. |
| Stored PII? | **No customer CRM.** New/returning counts are computed per request and not stored as a customer database. We store shop domain, OAuth session, settings (margin), spend entries, MER snapshots. |
| CSV upload contents? | Merchant-supplied **ad-spend aggregates only**. Wide template: Day + Meta/Google/Microsoft/TikTok/Affiliate/Email/Other; long `date,channel,amount` also works. Sales columns ignored. No customer data. |
| Retention | Shop data deleted on uninstall and on `shop/redact`. |
| Data request / redact | Compliance webhook at `/webhooks/compliance` returns 200; nothing to export for customer topics (no customer records stored). |
| Encryption / access | HTTPS in transit (Fly); DB only on our host; access limited to app runtime credentials. |
| Privacy policy | https://mcflyads.com/privacy — discloses order totals, new/returning count method, spend CSV, no CRM. |

---

## Reviewer notes (paste into submission)

```text
Test store: devmcflyads.myshopify.com
Test account: mcflyadsmmm@gmail.com

Pricing: Free. No in-app paid gates. No Shopify Billing charges yet.

Smoke test:
1. Install Mcfly Analytics from the App Store listing (or Partner test install)
2. Settings → set contribution margin to 35%
3. Spend → download the CSV template → fill a few days (Meta/Google/…) → Import
   (or paste long format: date,channel,amount)
4. Dashboard → confirm cash MER = Shopify sales ÷ spend, plus orders / new / returning
5. Allocation → confirm a recommendation when spend > 0

App is embedded. No shop-domain install form.
Compliance webhooks: https://mcfly-analytics.fly.dev/webhooks/compliance
Uninstall deletes sessions + shop data.
Support: https://mcflyads.com/support
Privacy: https://mcflyads.com/privacy

Protected customer data: read_orders used to sum order totals/counts and classify new vs returning
customers (customer id + numberOfOrders only). No name/email/address queried or stored.
Order history via Admin API is subject to Shopify’s standard access window (~60 days)
unless read_all_orders is later approved — demo with recent orders / MTD.
```

---

## Before you click Submit

- [x] `curl https://mcfly-analytics.fly.dev/health` → ok + db up
- [x] Compliance webhook rejects bad HMAC (401) — probe with fake `X-Shopify-Hmac-Sha256`; empty body alone may 400
- [x] App code set to `AppDistribution.AppStore`; toml URLs locked; `automatically_update_urls_on_dev = false`
- [ ] Partner Dashboard: Distribution → **Shopify App Store** (**human**)
- [ ] PCD questionnaire submitted (**human**)
- [x] `npx shopify app deploy --allow-updates` → `mcfly-analytics-7` (re-run after Partner distribution flip if Shopify requires)
- [ ] Install on devmcflyads; smoke test above (**human**)
- [ ] Screenshots uploaded (**human**)
- [ ] Pricing marked **Free**
- [ ] Reviewer notes pasted
- [x] Hosted app redeployed with AppStore dist + AOV (Fly `deployment-01KY6MSP…`; Shopify version `mcfly-analytics-7`)

Do **not** chase Built for Shopify until ~50 paid-plan installs + 5 reviews.
