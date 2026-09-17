# Launch readiness — profitable Shopify app launch (2026-09-16)

**Lane:** Research / Ops. **Docs only.** This file changes **no `app/**` desk UI** (other Ultra cooks own the tabs). Read-only on the desk.

**App:** Mcfly Analytics · handle `mcfly-analytics-public` · ID `403721814017` · client `bbaee078…`
**Listing:** https://apps.shopify.com/mcfly-analytics-public
**App URL:** https://mcfly-analytics.fly.dev (never mcflyads.com)
**Price:** 7-day free trial → **$39**/store/month. **Reviews: 0** — do not invent counts.
**Freeze:** Snowdevil SAMPLE-only (`MCFLY_SAMPLE_ONLY=true`); Live parked until Marty unparks. See [`../../plans/2026-09-16-snowdevil-sample-only.md`](../../plans/2026-09-16-snowdevil-sample-only.md).

**Job of this file:** one checklist for "can we take a paid install and keep it, honestly." It marks what is **DONE (in repo)**, what is **HUMAN (Marty must do in Partner / Admin / DNS)**, and what we **REFUSE**. It does not claim Shopify will approve. App Review can still reject; Partner Submit and live Admin smoke are HUMAN.

**Not a Submit.** Cursor/Grok never Submit and never Partner. No Fly deploy from this lane.

---

## 0. Legend

- **DONE** — evidenced in this repo's source/config/tests on 2026-09-16.
- **HUMAN** — Partner Dashboard, Admin session, MFA, DNS, or ads; agents cannot do it.
- **REFUSE** — out of scope on purpose; adding it breaks honesty or trust.

Status is repo-source evidence, not a live-host PASS. Where a live host must be re-checked, it is called out.

---

## 1. Listing (App Store copy + assets)

| Item | State | Evidence / where |
| --- | --- | --- |
| Sales-first paste aligned to the Overview scoreboard | **DONE (draft)** | [`../LISTING_REBUILD_DRAFT.md`](../LISTING_REBUILD_DRAFT.md) + full pack [`../LISTING_LIVE_PASTE.md`](../LISTING_LIVE_PASTE.md) §§2–6. Leads YoY / typical order / returning dollars / weekend — **not** spend-led. |
| Tagline / short / long / features carry **no plan price** (4.2.3) | **DONE (paste)** / **HUMAN (Partner form still spend-led + $39 in a bullet)** | Paste blocks are clean. Live listing fetch 2026-09-15 still leads spend and still has **$39 in a feature bullet** — HUMAN must overwrite with the pack. See [`../LISTING_LIVE_PASTE.md`](../LISTING_LIVE_PASTE.md) header. |
| No stats / "first / best / only" / testimonials (4.3.3, 4.3.6–7) | **DONE** | Listing test rejects quantified-outcome claims and superlatives; captions cleaned. [`../../APP_STORE_REQUIREMENT_MATRIX.md`](../../APP_STORE_REQUIREMENT_MATRIX.md) §4. |
| Screenshots recaptured from the live scoreboard, SAMPLE labeled | **HUMAN** | Marty recapture Overview → Customers → Orders → LTV → Total ROAS from the current desk. Do **not** upload `04-free-pro-pricing.png`, `05-spend-csv.png`, or `05-HOLD-marketing-site…png`. [`../LISTING_LIVE_PASTE.md`](../LISTING_LIVE_PASTE.md) §§8–9. |
| Icon M-only, no Shopify trademark misuse (4.4.3) | **DONE (asset)** | `docs/listing-assets/mcfly-app-icon-1200.png`. |
| Category = Marketing analytics; **Works with = blank**; "Merchant must have online store" **unchecked** (4.3.1) | **HUMAN** | Partner picks; checklist in [`../LISTING_LIVE_PASTE.md`](../LISTING_LIVE_PASTE.md) §1. |

---

## 2. Privacy / data (PCD + scopes)

| Item | State | Evidence |
| --- | --- | --- |
| Scopes stay minimal | **DONE** | `app/shopify.app.toml` → `read_orders,read_customers` only. |
| No `read_all_orders` (3.2.1) | **DONE / REFUSE** | Both public TOMLs pinned; `read_all_orders` rejected. The ~60-day public-app order window is honored, not faked. [`2026-09-15-shopify-analytics-gaps.md`](./2026-09-15-shopify-analytics-gaps.md) §A, S11. Live Fly scopes still need HUMAN confirm. |
| PCD Level 1 — opaque customer fields only (2.2.1) | **DONE (guard)** / **HUMAN (PCD declaration)** | Source guard limits customer selection to opaque `id` + `numberOfOrders`; no name/email/phone/address. Partner PCD Level 1 is HUMAN (`pcd done`). |
| Privacy / Terms pages live on Fly (1.1.4) | **DONE (Fly URLs)** / **HUMAN (mcflyads.com trust pages publish)** | App URL / Privacy / Support / Terms stay Fly. mcflyads.com trust-page publish is `main`-only HUMAN. See [`../SUPPORT_MX.md`](../SUPPORT_MX.md). |
| Privacy JSON export in-app | **DONE** | Settings → Privacy JSON exports (per [`../../plans/2026-09-15-CURRENT_DESK_LAYOUT.md`](../../plans/2026-09-15-CURRENT_DESK_LAYOUT.md) §8). |

---

## 3. Support

| Item | State | Evidence |
| --- | --- | --- |
| Support email that a merchant can reach today | **DONE** | `mcflyadsmmm@gmail.com` — primary inbound; on listing, Fly `/support`, `/app`. [`../SUPPORT_MX.md`](../SUPPORT_MX.md). |
| `support@mcflyads.com` brand inbox | **HUMAN (MX not done)** | Namecheap → Cloudflare MX is HUMAN. Do not advertise `support@` as working until a test message is proven. |
| Emergency developer contact (4.5.6) | **HUMAN** | Partner account settings (`emergency contact done`). |
| 1-star = a support ticket, not an ads trigger | **DONE (policy)** | Answer the merchant; do not buy ads to drown a review. [`../SUPPORT_MX.md`](../SUPPORT_MX.md) §1-star watch. |

---

## 4. Billing (trial → $39, one plan)

| Item | State | Evidence |
| --- | --- | --- |
| Shopify Managed / App Pricing, plan change without reinstall (1.2.x) | **DONE (code)** | Managed Pricing code path; no Stripe/PayPal app-subscription indicators (`app-store-requirement-verify.test.ts`). |
| **One** plan: `Mcfly Analytics`, **$39 USD / 30 days**, **7-day free trial**; **no Free plan** | **HUMAN** | Partner Pricing must show one plan and delete Free. Last warned **Free + Pro $39** on 2026-08-26. [`../LISTING_LIVE_PASTE.md`](../LISTING_LIVE_PASTE.md) §7; [`../../APP_STORE_REQUIREMENT_MATRIX.md`](../../APP_STORE_REQUIREMENT_MATRIX.md) 4.2.1. |
| In-app trial CTA exits to top frame, returns to Admin (2.2.2, 2.1.1) | **DONE (code)** / **HUMAN (deployed click)** | `billing-exit.server.ts` / `billing-navigate.ts` / `ProUpgradeButton.tsx` preserve `open(_, "_top")` + GET `/app/billing` bounce. Reviewer must still click Upgrade. |
| `$39` only in Partner Pricing (+ reviewer notes), never in copy/images (4.2.2–4.2.3) | **DONE (paste)** / **HUMAN (form + shots)** | Paste + captions clean; do not upload pricing PNGs. |
| Nothing is feature-gated → a Free tier would contradict the desk | **DONE (design)** | Whole desk works at $0 spend; a Free plan implies a gate that does not exist. [`../FOUNDER_DO_NOW.md`](../FOUNDER_DO_NOW.md) §6. |

---

## 5. SAMPLE honesty (App Store 1.1.4)

| Item | State | Evidence |
| --- | --- | --- |
| SAMPLE chip / watermark always on during the freeze | **DONE (plan + code lane)** | Snowdevil SAMPLE-only freeze; SAMPLE DATA watermark stays while `MCFLY_SAMPLE_ONLY` is true. [`../../plans/2026-09-16-snowdevil-sample-only.md`](../../plans/2026-09-16-snowdevil-sample-only.md). |
| Snowdevil dollars never presented as `devmcflyads` live orders | **DONE (policy)** | SAMPLE = Shopify's Snowdevil generated shop (board AOV, winter peak, Meta+Google). Same formula; never real-store numbers. |
| Empty spend is **—**, never `0.00×`; pending sales are not $0 | **DONE (formula law)** | Total ROAS = sales ÷ entered spend; em dash for empty. [`../LISTING_LIVE_PASTE.md`](../LISTING_LIVE_PASTE.md) §4; scoreboard note in [`../LISTING_REBUILD_DRAFT.md`](../LISTING_REBUILD_DRAFT.md). |
| **SAMPLE OFF on the review store** for the live App Review pass | **HUMAN** | Reviewer must see Live data on `devmcflyads`. [`../../APP_STORE_REQUIREMENT_MATRIX.md`](../../APP_STORE_REQUIREMENT_MATRIX.md) 2.1.4 + Submit gate. (Freeze parks Live in-product; unparking is HUMAN — set `MCFLY_SAMPLE_ONLY=false`.) |

> Tension to flag for Marty: the SAMPLE-only freeze intentionally keeps Live parked, but App Review 2.1.4 wants the reviewer on **Live data**. These cannot both be true at Submit time. Unparking Live (HUMAN) must happen before the live review pass; do not Submit while frozen to Sample.

---

## 6. Mobile Admin

| Item | State | Evidence |
| --- | --- | --- |
| Desk paints in the Shopify mobile Admin (phone width) | **DONE (fixtures + tests)** | `app/app/lib/desk-phone-fixture.html`, `desk-phone-pending-fixture.html`, and `desk-phone-layout.test.ts` lock phone layout; `site-demo-phone.test.ts` covers the public phone demo. (Existing app tests — this lane does not edit them.) |
| Phone chrome = brand + hamburger; Snowdevil typical order sized right | **DONE (plan lane)** | Phone fixture is Snowdevil (typical order ~$600), not Harbor $92. [`../../plans/2026-09-16-snowdevil-sample-only.md`](../../plans/2026-09-16-snowdevil-sample-only.md) Task 3. |
| Live mobile Admin smoke (open app on a phone, no clipped cards) | **HUMAN** | Reviewer/founder pass on a phone-width Admin session; not testable from this shell. |

---

## 7. Scopes we have (confirm, don't grow)

- **Have:** `read_orders`, `read_customers` (`app/shopify.app.toml`).
- **Rationale:** the whole Shopify-five moat (Overview YoY, typical order, returning dollars, weekend, LTV) is built from order + customer history at $0 spend within the ~60-day public window. Spend is merchant-entered, not scoped. See [`2026-09-15-shopify-analytics-gaps.md`](./2026-09-15-shopify-analytics-gaps.md) §C.
- **Do not add:** `read_all_orders`, product/inventory, checkout, themes, marketing/pixel scopes. Adding scope is an uninstall/trust risk and a new review surface.

---

## 8. Refuse list (do not add for launch)

From research + trust law. Adding any of these breaks the honesty pitch or the minimal-scope promise:

- **No pixels / view-through / multi-touch attribution / "true ROAS."** Total ROAS is sales ÷ entered spend only. [`2026-09-15-shopify-analytics-gaps.md`](./2026-09-15-shopify-analytics-gaps.md) §D; [`../LISTING_LIVE_PASTE.md`](../LISTING_LIVE_PASTE.md) "WHAT WE NEVER DO".
- **No `read_all_orders` as the shipped promise** — honor the ~60-day window; missing last year / 365-day LTV say "not on file," never $0. (§2, §7 above; gaps S10–S11.)
- **No Sidekick/AI-analyst clone, no ChatGPT-in-app, no ShopifyQL BI builder.** (gaps S8–S9, S12.)
- **No email/CRM/Klaviyo, no sessions/conversion, no product/SKU or P&L reports.** (gaps §C "Must not become".)
- **No 12th "Timing" tab** — weekend/hour folds into Orders. (gaps S5.)
- **No inventing** review counts (reviews = **0**), visit/install %, or "% of merchants export." [`../money/FUNNEL_WEEKLY.md`](../money/FUNNEL_WEEKLY.md).
- **No App Store ads** until the four gates are green (Admin smoke PASS, ≥3 honest reviews, one organic funnel week, P0 desk on Fly). [`../money/APP_STORE_ADS.md`](../money/APP_STORE_ADS.md).
- **No Submit / Partner / Fly** from any agent lane.

---

## 9. What Marty must still do (HUMAN only)

Ordered for a profitable, honest launch. Full click order: [`../LISTING_LIVE_PASTE.md`](../LISTING_LIVE_PASTE.md), [`../FOUNDER_DO_NOW.md`](../FOUNDER_DO_NOW.md), [`../../APP_STORE_REQUIREMENT_MATRIX.md`](../../APP_STORE_REQUIREMENT_MATRIX.md) "Human Submit gate".

1. **Partner Pricing:** one plan `Mcfly Analytics`, $39 / 30 days, 7-day trial; **delete the Free plan**; confirm the picker shows exactly one plan.
2. **Listing body:** overwrite the spend-led live tagline/short/long/features/keywords with the sales-first pack ([`../LISTING_LIVE_PASTE.md`](../LISTING_LIVE_PASTE.md) §§2–6); remove the `$39` feature bullet.
3. **Screenshots + hero:** recapture from the current scoreboard (Overview → Customers → Orders → LTV → Total ROAS), SAMPLE labeled; do not upload the three banned PNGs.
4. **Trust pages:** publish the working-tree `site/` Privacy/Support/Terms to mcflyads.com (Pages is `main`); keep App URL/Privacy/Support/Terms on Fly.
5. **PCD Level 1**, **emergency contact**, **Distribution → App Store** in Partner.
6. **Unpark Live for the review pass:** set `MCFLY_SAMPLE_ONLY=false` on Fly and turn SAMPLE **OFF** on the review store so App Review sees Live data (§5 tension).
7. **Live Admin + mobile smoke:** install on `devmcflyads`, one live spend day, click **Start 7-day trial** → top-frame plans (no "refused to connect"), and open the app on a phone-width Admin.
8. **Support:** monitor `mcflyadsmmm@gmail.com` and listing reviews; MX cutover to `support@mcflyads.com` is optional/later.
9. **Submit** (HUMAN). Then: **one organic funnel week** in [`../money/FUNNEL_WEEKLY.md`](../money/FUNNEL_WEEKLY.md) and **≥3 honest reviews** before any ads ([`../money/APP_STORE_ADS.md`](../money/APP_STORE_ADS.md)).

---

## Cited research (existing, in `docs/ops/research/`)

- [`2026-09-15-shopify-analytics-gaps.md`](./2026-09-15-shopify-analytics-gaps.md) — scopes/60-day window, the Shopify-five moat, refuse list.
- [`2026-09-15-competitor-uninstall-signals.md`](./2026-09-15-competitor-uninstall-signals.md) — why installs churn.
- [`2026-09-15-tab-uninstall-audit.md`](./2026-09-15-tab-uninstall-audit.md) · [`2026-09-15-tab-vs-complaints.md`](./2026-09-15-tab-vs-complaints.md) — per-tab retention pressure.
- [`2026-09-10-independent-insights.md`](./2026-09-10-independent-insights.md) · [`2026-09-10-world-class-punch.md`](./2026-09-10-world-class-punch.md) — listing/first-viewport honesty.

**Reviews = 0.** Do not invent counts, install numbers, or funnel percentages anywhere in this launch.
