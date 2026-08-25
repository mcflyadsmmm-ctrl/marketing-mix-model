# Fix 19 listing issues — paste sheet (Mcfly Analytics Public)

App: https://dev.shopify.com/dashboard/227535001/apps/403721814017  
Work top → bottom. Save after each section.

---

## 1. Basic app information

| Field | Paste / select |
| --- | --- |
| **App name** | `Mcfly Analytics` |
| **App category** | Marketing → **Marketing analytics** (or Advertising if analytics missing) |
| **Languages** | English only |

---

## 2. App store listing content

### App introduction (short description ≤~150)
```text
Advanced Marketing Data Science Made Easy: Total ROAS (Total Sales ÷ spend), break-even, Goals, Allocation. No pixels.
```

### App details (long description)
Paste from `docs/APP_STORE_LISTING.md` → **Long description (paste)** block (starts with “Shopify Analytics shows sales”).

### Features (5 bullets, in order)
```text
Total ROAS = Shopify Total Sales ÷ ad spend for any period — the ratio Shopify Analytics does not give
Spend CSV: Meta + Google + custom Other · mix in dollars and percent · paid plan unlocks named channels
Break-even Total ROAS from your profit margin %
Spend Allocation + Goals pace on the default plan; lock / finance CSV + full Goals on the paid plan
GDPR webhooks + clean uninstall — no customer CRM · no pixels / MTA
```

### Feature media / Screenshots
Upload from `docs/listing-assets/shots/` **in order**:

| # | File | Caption |
| --- | --- | --- |
| 1 | `01-total-roas-vs-breakeven.png` | Total ROAS vs break-even — one glance |
| 2 | `02-explorer-sales-div-spend.png` | Channel mix vs Total ROAS — sales ÷ spend |
| 3 | `03-margin-breakeven.png` | Lock break-even from your margin % |
| 4 | Recapture `/app/allocation?period=y3&shot=1` → `04-allocation-call.png` | One clear cut / shift / hold call |
| 5 | **Still need** Admin `/app/spend?shot=1` | Select platforms → export daily → combine |

**Do not upload** `04-free-pro-pricing.png` (plan prices in the image — 4.2.2) or `05-HOLD-marketing-site-do-not-upload.png`  
Icon (already uploaded): `docs/listing-assets/mcfly-app-icon-1200.png`

### Support
| Field | Value |
| --- | --- |
| Support URL | `https://mcflyads.com/support` |
| Support email | `mcflyadsmmm@gmail.com` |

### Resources
| Field | Value |
| --- | --- |
| Website | `https://mcflyads.com` |
| Privacy | `https://mcflyads.com/privacy` |
| Terms | `https://mcflyads.com/terms` |
| App URL (app setup, not marketing) | `https://mcfly-analytics.fly.dev` |

---

## 3. Pricing details

| Field | Value |
| --- | --- |
| **Pricing plans** | **Shopify App Pricing: Free + Pro $39/store/mo** |
| Paid plans / Billing | **On** — Managed Pricing. Must match in-app Upgrade. |
| External charges | **No** |
| Works with / Sales channel requirements | **None / blank** — not a sales channel. Do **not** require Online Store (4.3.1). |

---

## 4. App discovery content

### App card subtitle (tagline ≤80)
```text
Advanced Marketing Data Science Made Easy: Total ROAS (Total Sales ÷ spend), break-even
```

### App store search terms
```text
Total ROAS, marketing efficiency ratio, Break-even Total ROAS, Shopify ad spend
```
Ban: attribution, pixel, true ROAS, MTA.

---

## 5. Install requirements

| Field | Value |
| --- | --- |
| **Sales Channel requirements** | **None** / not applicable — Mcfly is an **embedded Admin app**, not a sales channel |
| Capabilities | **Embedded** only (already guided) |

---

## 6. Contact information

| Field | Value |
| --- | --- |
| **Merchant review email** | `mcflyadsmmm@gmail.com` |
| **App submission email** | `mcflyadsmmm@gmail.com` |

---

## 7. App testing information

Paste **only** [`PARTNER_TESTING_INSTRUCTIONS.md`](./PARTNER_TESTING_INSTRUCTIONS.md). Do not use the old “Billing Off” block.

### Test account (Partner form)

| Field | Value |
| --- | --- |
| Username | *empty* |
| Password | *empty* |
| **My app doesn't require an account to use it** | **Checked** |

### Testing instructions

Paste the `APP_STORE_PASTE:testing` block from [`PARTNER_TESTING_INSTRUCTIONS.md`](./PARTNER_TESTING_INSTRUCTIONS.md) (starts with `TEST ACCOUNT (App Store 4.5.4 / 4.5.5)`).

### Screencast URL
Record a short Loom: install → Spend → **Upgrade to Pro** (top-frame plans, no iframe refuse) → CSV import → Overview Total ROAS. English or English subtitles (4.5.3).

---

## After save
Reply: `listing filled` + anything still red (especially screencast / shot 5 / sales channel).
