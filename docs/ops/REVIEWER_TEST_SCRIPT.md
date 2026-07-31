# App Store reviewer test script — Mcfly Analytics (cold path)

**Paste into Partner App Store “testing instructions.”** Reviewer has never seen the product.  
**Listing Pricing:** Free · **Religion:** Total ROAS = sales ÷ spend — no pixels.

---

## Setup (2 minutes)

1. Install **Mcfly Analytics** from the review install link (or Partner test install).
2. Open the app from Shopify Admin → Apps.
3. If you see a **SAMPLE / demo desk** banner, note it — for live review prefer turning SAMPLE off if the UI offers it; otherwise use SAMPLE numbers only as labeled.

---

## Path A — Trusted Total ROAS in under 10 minutes

### 1. Margin / break-even

1. Go to **Settings** (or onboarding margin step if shown).
2. Set contribution margin to **35%** (or any value 20–50%).
3. Save. Break-even Total ROAS should show ≈ **1 ÷ margin** (e.g. 35% → ~2.86×).

### 2. Enter spend (Free path)

1. Go to **Spend**.
2. Use **CSV paste** or upload for **Meta + Google** for a recent period (or use provided SAMPLE / template).
3. Confirm coverage / platforms show spend &gt; 0 for the period.
4. Do **not** expect Meta/Google OAuth for day-one review — paste-first is intentional.

### 3. Desk / Total ROAS

1. Go to **Home** / desk (app index).
2. Confirm **Total ROAS = sales ÷ spend** for the selected period (Shopify sales in numerator).
3. Confirm break-even line or status (above / below) is visible.
4. Confirm no pixel setup, no path-attribution model picker.

### 4. Monday Close (ritual)

1. Go to **Close** (`/app/close` or nav **Close**).
2. Walk: exceptions → lock period → variance → decision (hold / reduce / step-test) → CSV export if offered.
3. Confirm copy states this is **average portfolio efficiency**, not marginal channel “true ROAS.”

### 5. Uninstall hygiene (optional smoke)

1. Uninstall app from Admin.
2. Reinstall if needed for further tests — no storefront theme “ghost” scripts expected (Admin-only desk).

---

## Empty / edge states to expect (not bugs)

| State | Expected |
| --- | --- |
| Zero spend | Honest empty / paste CTA — not fabricated ROAS |
| API sales error | Error banner — not silent mock sales as live |
| SAMPLE on | Banner unmistakable SAMPLE |

---

## What we refuse (do not flag as missing)

- Tracking pixels / CAPI setup  
- Multi-touch / path attribution  
- Connector zoo beyond Meta+Google Free paste  
- Public “type your .myshopify.com” install on marketing site  

---

## Support

Privacy / PCD: Level 1 — opaque customer ids + order counts as needed; see https://mcflyads.com/privacy  
Human: https://mcflyads.com/support  
