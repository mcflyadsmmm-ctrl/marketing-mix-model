# Submit handoff — founder one-pager

**SoT app:** [Mcfly Analytics Public](https://dev.shopify.com/dashboard/227535001/apps/403721814017) — not Custom `400772497409`  
**SoT runbook:** [`../SUBMIT_NOW.md`](../SUBMIT_NOW.md) (follow in order)  
**Reviewer paste:** [`../PARTNER_TESTING_INSTRUCTIONS.md`](../PARTNER_TESTING_INSTRUCTIONS.md) — **only** that `APP_STORE_PASTE:testing` block. Do **not** paste [`REVIEWER_TEST_SCRIPT.md`](./REVIEWER_TEST_SCRIPT.md).  
**Listing copy + URLs:** [`../APP_STORE_LISTING.md`](../APP_STORE_LISTING.md)

**Live (agent):** Fly `https://mcfly-analytics.fly.dev` · health `/health`. Trust URLs are **on Fly** (`/support` `/privacy` `/terms` `/pricing`) until mcflyads.com Pages is republished. SAMPLE OFF on the review store.

---

## Hard rules (reject if wrong)

| Field | Must be |
| --- | --- |
| **App URL** | `https://mcfly-analytics.fly.dev` — **not** mcflyads.com |
| **Website / Privacy / Support / Terms** | `https://mcfly-analytics.fly.dev` · `/privacy` · `/support` · `/terms` (full URLs in [`../APP_STORE_LISTING.md`](../APP_STORE_LISTING.md)) — **not** live mcflyads.com |
| **Pricing** | **Shopify App Pricing: Free + Pro $39** (must match Upgrade) |
| **Works with** | **Blank** (no Checkout / Meta / Google) |
| **Testing form** | Username/Password **empty**, **check** “My app doesn't require an account to use it” |
| **SAMPLE desk** | **OFF** on the review store |

---

## Assets

| Asset | Path |
| --- | --- |
| Icon | `docs/listing-assets/mcfly-app-icon-1200.png` |
| Shot 1 | `docs/listing-assets/shots/01-total-roas-vs-breakeven.png` — Total ROAS vs break-even — one glance |
| Shot 2 | `docs/listing-assets/shots/02-explorer-sales-div-spend.png` — Channel mix vs Total ROAS — sales ÷ spend |
| Shot 3 | `docs/listing-assets/shots/03-margin-breakeven.png` — Lock break-even from your margin % |
| Shot 4 | Recapture Allocation — see [`../LISTING_VISUAL_PACK.md`](../LISTING_VISUAL_PACK.md) |
| Shot 5 | Recapture Spend — `/app/spend?shot=1` |
| **Do not upload** | `04-free-pro-pricing.png` (4.2.2 prices in image) · `05-HOLD-marketing-site-do-not-upload.png` |

Captions: [`../listing-assets/shots/CAPTIONS.md`](../listing-assets/shots/CAPTIONS.md)

---

## Reply phrases (log in Cursor)

| Step | Reply |
| --- | --- |
| Distribution → App Store | `distribution done` |
| PCD Level 1 only | `pcd done` |
| Emergency contact | `emergency contact done` |
| Trust pages OK | `pages live` |
| Install smoke (SAMPLE OFF) | `install works` |
| Assets uploaded | `assets uploaded` |
| Submitted | `submitted` |

---

## Agent blockers for you

1. **Partner clicks** — MFA / listing URLs / Pricing / testing checkbox / Spend → Upgrade smoke / Submit are human-only.  
2. Optional: Wrangler-publish `site/` so mcflyads.com matches (not required if Partner uses Fly URLs).  
3. Prefer re-capture shot 5 from live Admin `/app/spend?shot=1` if mock looks off.
