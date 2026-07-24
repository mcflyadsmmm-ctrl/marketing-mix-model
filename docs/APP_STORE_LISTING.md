# App Store listing draft — Mcfly Analytics

Paste into Partner listing when Distribution = **Shopify App Store**.  
**Pricing:** Free. **Religion:** cash MER = Shopify sales ÷ ad spend — never pixels / MTA / “true ROAS.”

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
| **Tagline** (≤80 chars) | Cash MER for Shopify — sales ÷ spend, break-even, one allocation call |
| **Category** | Marketing → Marketing analytics / Advertising (pick closest) |
| **Primary language** | English |
| **Pricing** | **Free** (design-partner launch). Do not claim paid features until Shopify Billing ships. Site “~$79 later” is future — listing must stay Free. |

**Tagline why:** leads with the job (cash MER), states the formula without ROAS theater, and previews the Monday outcome (break-even + allocation). Character count ~72.

---

## Short description (~150 chars)

```text
Cash MER for Shopify: sales ÷ ad spend, break-even MER, and one allocation call. Free. No platform ROAS theater.
```

**Why it converts:** benefit + formula in one breath; Free removes price friction; “no ROAS theater” positions without promising attribution science Shopify will reject.

---

## Long description (paste)

```text
Mcfly Analytics is the cash desk for Shopify operators who are tired of optimizing platform ROAS.

Ad platforms over-claim. Multi-touch “truth” is mostly theater. Mcfly measures only money out on ads versus money Shopify recorded as sales in the same period — then helps you allocate against break-even MER.

WHAT YOU GET
• Shopify sales in (Admin API, period you choose)
• Ad spend out — upload one daily CSV or type totals manually
  CSV template columns: Day, Meta, Google, Microsoft, TikTok, Affiliate, Email, Other
  (long format date / channel / amount also works; sales columns ignored)
• Cash MER = Shopify sales ÷ ad spend
• Break-even MER from your contribution margin
• Channel mix + one auditable allocation recommendation
• Embedded in Shopify Admin — no second login, no “type your .myshopify.com” form

WHAT WE REFUSE
• Path attribution / MTA / view-through credit
• Pixel causality / “true ROAS” claims
• Fake “driven revenue” that doesn’t match the till
• Triple Whale–style feature sprawl dressed as science

WHO IT’S FOR
Shopify brands that want a Monday ritual: did spend clear break-even against the bank account?

PRICING
Free on the App Store now. Paid flat pricing later via Shopify Billing — not a GMV-scaled suite tax.

Learn more: https://mcflyads.com
```

**Why it converts:** outcome first → formula clarity → concrete CSV (incl. **Other**) → refuse block that builds trust with operators → Free removes the “what’s this cost?” bounce.

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
| 2 | Cash MER definition | Sales ÷ spend — the only formula we use | Sales, spend, MER row clearly labeled |
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
| Privacy policy | https://mcflyads.com/privacy — discloses order totals, new/returning count method, spend CSV, no CRM. |

---

## Reviewer notes (paste into submission)

```text
Test store: devmcflyads.myshopify.com
Test account: mcflyadsmmm@gmail.com

Pricing: Free. No in-app paid gates. No Shopify Billing charges yet.

IMPORTANT — Demo sample desk must be OFF before you judge live metrics.
(Demo → Turn sample desk OFF. Shot mode is for screenshots only.)

Smoke test:
1. Install Mcfly Analytics from the listing (or Partner test install)
2. Settings → set contribution margin to 35% → confirm break-even MER updates
3. Spend → download CSV template → fill a few days including Other → Import
   (or paste long format: date,channel,amount)
4. Cash MER → confirm cash MER = Shopify sales ÷ spend
   Also confirm orders / new / returning / AOV for the selected period
5. Allocation → confirm a recommendation when spend > 0

App is embedded in Admin. No public “type your .myshopify.com” install form.
App URL: https://mcfly-analytics.fly.dev
Compliance webhooks: https://mcfly-analytics.fly.dev/webhooks/compliance
Uninstall deletes sessions + shop data.
Support: https://mcflyads.com/support
Privacy: https://mcflyads.com/privacy

Protected customer data:
- read_orders: sum order totals/counts for cash MER / AOV
- read_customers: opaque customer id + numberOfOrders only (new vs returning)
- No name / email / phone / address queried or stored. No CRM.
Order history via Admin API is subject to Shopify’s standard access window (~60 days)
unless read_all_orders is later approved — demo with recent orders / MTD.
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
