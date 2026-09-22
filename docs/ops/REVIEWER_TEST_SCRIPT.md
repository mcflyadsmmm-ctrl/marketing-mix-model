# App Store reviewer test script — Mcfly Analytics (cold path)

**Do not paste this file into Partner.** Live 4.5.4 paste is [`PARTNER_TESTING_INSTRUCTIONS.md`](../PARTNER_TESTING_INSTRUCTIONS.md).  
**Listing Pricing:** Shopify App Pricing — **one plan**, $39/store/mo after a 7-day trial. Trial is **90 days** of order history. Paid is up to **24 months**. Never “full-access.” **Religion:** Total ROAS = sales ÷ spend you entered — empty = —. No pixels.  
**No Monday Close / no Meta–Google OAuth** — spend is typed or CSV.

---

## Setup (2 minutes)

1. Install **Mcfly Analytics** from the review install link (or Partner test install).
2. Open the app from Shopify Admin → Apps.
3. **Live must be unparked** before this smoke. A **SAMPLE** chip means the Snowdevil example book — not this shop. There is no Sample | Live toggle in Settings. Public SAMPLE is https://mcflyads.com/demo.

---

## Path A — Shopify-depth desk, then optional Total ROAS

### 1. Overview (zero spend)

1. App opens on **Overview**.
2. First glance is three YoY sales cards: This month / This quarter / This year vs last year. Missing last year is an em dash, never `$0`.
3. Typical order and the sales chart load. Spend is optional. Empty Total ROAS is not painted as `0×`.

### 2. Orders and Customers (zero spend)

1. **Orders** — weekend share, busiest weekday, typical ticket.
2. **Customers** — returning dollars. Growth and LTV are chips on this page, not top tabs.
3. First year on LTV is an em dash when a year is not on file.

### 3. Settings / billing (2.1.1)

1. **Settings → Your plan.**
2. Copy names **90 closed days** unpaid vs **24 months** paid, **$39** after 7 days, one plan.
3. **Start 7-day trial** must open Shopify’s plan picker in the **top** Admin frame.
4. FAIL if you see `admin.shopify.com refused to connect` inside the iframe.

### 4. Optional spend / Total ROAS

1. **Spend** — type one day or paste CSV. Do **not** expect Meta/Google OAuth.
2. Total ROAS = Shopify Total Sales ÷ entered spend. Empty spend is an em dash, never `0×`.
3. Mix and CPA live on Spend. Goals is its own tab.

### 5. Uninstall hygiene (optional smoke)

1. Uninstall app from Admin.
2. Reinstall if needed — Admin-only desk; no storefront theme scripts expected.

---

## Empty / edge states to expect (not bugs)

| State | Expected |
| --- | --- |
| Zero spend | Honest empty / em dash Total ROAS — never `0×` |
| Missing last year | Em dash / not on file — never `$0` |
| Trial book | 90 closed days of order rows, not 24 months |
| API sales error | Error banner — not silent mock sales as live |
| SAMPLE chip | Example book, not this shop |
| Trial vs paid tabs | Same five analysis tabs plus Settings. Depth differs (90 vs 24), not a hidden LTV paywall |

---

## What we refuse (do not flag as missing)

- Tracking pixels / CAPI setup  
- Multi-touch / path attribution  
- Meta/Google spend OAuth or connector zoo  
- Public “type your .myshopify.com” install on marketing site  
- Eleven analysis tabs, Harbor SAMPLE, or a Sample | Live toggle in Settings  
- Monday Close lock ritual (removed — Overview instead)

---

## Support

Privacy / PCD: Level 1 — opaque customer ids + order counts as needed; see https://mcfly-analytics.fly.dev/privacy  
Human: https://mcfly-analytics.fly.dev/support  
