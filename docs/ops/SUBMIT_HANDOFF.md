# Submit handoff — founder one-pager

**SoT app:** [Mcfly Analytics Public](https://dev.shopify.com/dashboard/227535001/apps/403721814017) — not Custom `400772497409`  
**SoT runbook:** [`../SUBMIT_NOW.md`](../SUBMIT_NOW.md) (follow in order)  
**Reviewer paste:** [`../PARTNER_TESTING_INSTRUCTIONS.md`](../PARTNER_TESTING_INSTRUCTIONS.md) — **only** that `APP_STORE_PASTE:testing` block. Do **not** paste [`REVIEWER_TEST_SCRIPT.md`](./REVIEWER_TEST_SCRIPT.md).  
**Listing copy + URLs:** [`../APP_STORE_LISTING.md`](../APP_STORE_LISTING.md)

**Live (agent):** Fly `https://mcfly-analytics.fly.dev` · health `/health`. That origin serves the marketing `site/` (home, Support, Privacy, Terms, Pricing) plus the embedded app. Use **Live data** on the review store.

**Do not click Submit** — human only when the checklist is green.

---

## Hard rules (reject if wrong)

| Field | Must be |
| --- | --- |
| **App URL** | `https://mcfly-analytics.fly.dev` — **not** mcflyads.com |
| **Website / Privacy / Support / Terms / Pricing** | `https://mcfly-analytics.fly.dev` · `/privacy` · `/support` · `/terms` · `/pricing` — Fly only |
| **Pricing** | **Shopify App Pricing: one plan $39/store/mo + 7-day trial** — **delete leftover Free** |
| **Works with** | **Blank** (no Checkout / Meta / Google) |
| **Testing form** | Username/Password **empty**, **check** “My app doesn't require an account to use it” |
| **Desk mode** | **Live data** on the review store (Sample data = example numbers only) |
| **2.1.1 smoke** | Settings → **Start 7-day trial** → plan picker `_top` |

---

## Assets

| Asset | Path |
| --- | --- |
| Icon | `docs/listing-assets/mcfly-app-icon-1200.png` |
| Shot 1–5 | **Recapture** per [`../LISTING_VISUAL_PACK.md`](../LISTING_VISUAL_PACK.md) — Sample \| Live chrome, Spend three doors, 5-year history label |
| **Do not upload** | `04-free-pro-pricing.png` (4.2.2 prices; Free vs Pro dead) · `05-HOLD-marketing-site-do-not-upload.png` · stale Free/Pro or SAMPLE-desk-OFF shots |

Captions: [`../listing-assets/shots/CAPTIONS.md`](../listing-assets/shots/CAPTIONS.md)

---

## Reply phrases (log in Cursor)

| Step | Reply |
| --- | --- |
| Distribution → App Store | `distribution done` |
| PCD Level 1 only | `pcd done` |
| Emergency contact | `emergency contact done` |
| Trust pages OK (Fly) | `pages live` |
| Install smoke (Live data) | `install works` |
| Assets uploaded | `assets uploaded` |
| Submitted | `submitted` (human only) |

---

## Agent blockers for you

1. **Partner clicks** — MFA / listing URLs / Pricing / testing checkbox / Settings → Start 7-day trial smoke / **Submit** are human-only. Do **not** ask the agent to Submit.  
2. Recapture listing shots from Admin (`LISTING_VISUAL_PACK.md`) — old Free/Pro PNGs are stale.  
3. Partner Pricing: delete Free; one **Mcfly Analytics** plan at $39 + 7-day trial.
