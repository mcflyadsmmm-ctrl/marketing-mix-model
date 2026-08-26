# App Store reviewer test script — Mcfly Analytics (cold path)

**Do not paste this file into Partner.** Live 4.5.4 paste is [`PARTNER_TESTING_INSTRUCTIONS.md`](../PARTNER_TESTING_INSTRUCTIONS.md).  
**Listing Pricing:** Shopify App Pricing — **one plan**, $39/store/mo after a 7-day full-access trial. **Religion:** Total ROAS = sales ÷ spend — no pixels.  
**No Monday Close / no Meta–Google OAuth** — spend is CSV; Share Overview is mailto on Home.

---

## Setup (2 minutes)

1. Install **Mcfly Analytics** from the review install link (or Partner test install).
2. Open the app from Shopify Admin → Apps.
3. If you see a **SAMPLE / demo desk** banner, turn **SAMPLE / Real store → Real store** before judging live till numbers. SAMPLE is optional practice only and stays labeled.

---

## Path A — Trusted Total ROAS in under 10 minutes

### 1. Margin / break-even

1. Go to **Settings**.
2. Set contribution margin to **35%** (or any value 20–50%).
3. Save (contextual save bar). Break-even Total ROAS should show ≈ **1 ÷ margin** (e.g. 35% → ~2.86×).

### 2. Enter spend (Free path)

1. Go to **Spend**.
2. Use **CSV paste** or upload for **Meta + Google** for a recent period (template download is fine).
3. Confirm coverage / platforms show spend &gt; 0 for the period.
4. Do **not** expect Meta/Google OAuth — CSV-first is intentional.

### 3. Desk / Total ROAS

1. Go to **Overview** (Home).
2. Confirm **Total ROAS = Shopify sales ÷ spend** for the selected period.
3. Confirm break-even line or status (above / below) is visible.
4. Optional: **Email** / Share Overview opens a mailto with period cards (Mcfly does not send mail).
5. Confirm no pixel setup, no path-attribution model picker.

### 4. Spend Allocation

1. Go to **Spend Allocation**.
2. Confirm a portfolio affordability recommendation when spend &gt; 0.
3. Confirm copy is average portfolio efficiency — not channel “true ROAS.”

### 5. Uninstall hygiene (optional smoke)

1. Uninstall app from Admin.
2. Reinstall if needed — Admin-only desk; no storefront theme scripts expected.

---

## Empty / edge states to expect (not bugs)

| State | Expected |
| --- | --- |
| Zero spend | Honest empty / paste CTA — not fabricated ROAS |
| API sales error | Error banner — not silent mock sales as live |
| SAMPLE on | Banner unmistakable SAMPLE |
| Trial vs paid | Identical desk — nothing unlocks or locks. Billing is not a view |

---

## What we refuse (do not flag as missing)

- Tracking pixels / CAPI setup  
- Multi-touch / path attribution  
- Meta/Google spend OAuth or connector zoo  
- Public “type your .myshopify.com” install on marketing site  
- Monday Close lock ritual (removed — Overview + Share instead)

---

## Support

Privacy / PCD: Level 1 — opaque customer ids + order counts as needed; see https://mcfly-analytics.fly.dev/privacy  
Human: https://mcfly-analytics.fly.dev/support  
