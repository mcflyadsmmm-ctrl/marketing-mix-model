# App Store listing draft — Mcfly Analytics

Use when submitting public listing (after Fly health + first install work).  
**App Store registration:** paid ✅  

Partner listing URLs (already live):

| Field | URL |
| --- | --- |
| Website | https://mcflyads.com |
| Privacy | https://mcflyads.com/privacy.html |
| Support | https://mcflyads.com/support.html |
| Terms | https://mcflyads.com/terms.html |
| App URL (current) | https://mcfly-analytics.fly.dev |

---

## Listing basics

| Field | Draft |
| --- | --- |
| **App name** | Mcfly Analytics |
| **Tagline** (≤80 chars) | Cash MER for Shopify — spend vs sales, not attribution theater |
| **Category** | Marketing → Marketing analytics / Advertising (pick closest) |
| **Primary language** | English |
| **Pricing** | Free during design-partner launch → ~$79/mo later (update when Billing ships) |

---

## Short description (~150 chars)

```text
Stop optimizing platform ROAS. Mcfly shows cash MER: ad spend out ÷ Shopify sales in, break-even MER, and one allocation call.
```

## Long description (draft)

```text
Mcfly Analytics is a cash desk for Shopify operators.

Ad platforms over-claim conversions. Multi-touch “truth” is mostly theater. Mcfly measures only money spent on ads versus money Shopify recorded as sales in the same period — then helps you allocate against break-even MER.

WHAT YOU GET
• Shopify sales in (Admin API, period you choose)
• Ad spend out (manual entry day one; Meta/Google pipes next)
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

Free for design partners while we launch. Paid flat pricing later — not GMV-scaled suite tax.

Learn more: https://mcflyads.com
```

---

## Feature bullets (listing UI)

1. Cash MER dashboard (MTD / QTD / YTD)  
2. Manual Meta / Google / Other spend entry  
3. Break-even MER from margin %  
4. Rules-based allocation card with visible inputs  
5. GDPR webhooks + clean uninstall  

---

## Screenshots to capture (after install)

1. Dashboard — sales, spend, MER, break-even  
2. Spend entry form with channel rows  
3. Settings — margin + target MER  
4. Allocation detail — cut/shift/hold actions  
5. (Optional) Claims-vs-cash demo on mcflyads.com for marketing  

Save as 1600×900 (or Shopify’s current required size) PNG.

---

## Reviewer notes (paste into submission)

```text
Test store: [your-dev-store].myshopify.com
Test account: [collaborator or staff email]

Smoke test:
1. Install Mcfly Analytics
2. Settings → set contribution margin to 35%
3. Spend → add Meta spend for current month
4. Dashboard → confirm MER = Shopify sales ÷ spend
5. Allocation → confirm recommendation appears when spend > 0

App is embedded. No shop-domain install form. Compliance webhooks at /webhooks/compliance.
Support: https://mcflyads.com/support.html
Privacy: https://mcflyads.com/privacy.html
```

---

## Before you click Submit

- [ ] `curl https://mcfly-analytics.fly.dev/health` → ok  
- [ ] `npx shopify app deploy --force`  
- [ ] Install on paid or development store; smoke test above  
- [ ] Screenshots uploaded  
- [ ] Pricing / free launch wording matches reality  
- [ ] Shopify Billing ready **or** listing clearly free/design-partner only  

Do **not** chase Built for Shopify until ~50 paid-plan installs + 5 reviews.
