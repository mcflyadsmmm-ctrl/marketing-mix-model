# Resubmission plan — freeze the desk, close human gates

**Date:** 2026-08-27  
**This file is the SoT.** Older runbooks contradict each other. If they disagree with this page, ignore them.

**Product lock (do not reopen):** Mcfly Analytics is a Shopify Admin **spend desk**. Hero: *See ad spend next to sales, day by day.* Views are **Sample data | Live data** only. Pricing: **7-day full-access trial, then $39/store/mo**, whole desk, no feature gate. Uninstall stops the next charge. No pixels / MTA / “true ROAS.” No Meta/Google OAuth. Plan picker opens in the **top** Admin window.

**Do not start another code sweep** unless Admin smoke on `devmcflyads` fails.

---

## Why slow down now

The last month of work already fixed the reject causes and the 2026-08-26 Admin bugs (Billboard vs Other, zero-size spend button, false 0.00× while sales load, Free-vs-Pro copy in the app). More agent PRs will not get the app approved. Shopify App Review and Partner Dashboard will.

Two documents will **reject you again** if followed:

| File | Harm |
| --- | --- |
| [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) | Still says **Pricing must be Free**. That is false. |
| [`SUBMIT_READY_SCORECARD.md`](./SUBMIT_READY_SCORECARD.md) | July 28 “first Free submit” scorecard. Ignore the %. |

Use [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md) for paste copy and [`PARTNER_TESTING_INSTRUCTIONS.md`](./PARTNER_TESTING_INSTRUCTIONS.md) for the testing form. Use this file for **order of operations**.

---

## What is already true (2026-08-27)

| Surface | Status |
| --- | --- |
| Git | Branch `cursor/desk-honesty-first-session-84ce` · SHA **`a47d6e5`** · [PR 19](https://github.com/mcflyadsmmm-ctrl/marketing-mix-model/pull/19) |
| Fly app | `mcfly-analytics` · **v166** · image `deployment-01M10J1A0YF1ZN3TJ5XCR6YSQH` · IAD |
| Health | `https://mcfly-analytics.fly.dev/health` → `ok`, `db: up` |
| Trust pages on Fly | `/` `/pricing` `/support` `/privacy` `/terms` **200**, one plan ($39 after 7-day trial), no “Install free” |
| mcflyads.com | Home + `/pricing` already match that pitch (not the old waitlist). **Still do not set App URL to mcflyads.com.** |
| In-app billing | Managed Pricing + `_top` exit (2.1.1). Testing paste ready (4.5.4 / 4.5.5). |
| Partner pricing page | **Unknown / likely still Free + Pro $39** as of 2026-08-26 smoke. Git cannot delete plans. |

Partner app (Public, not Custom):  
https://dev.shopify.com/dashboard/227535001/apps/403721814017  
Admin smoke store: https://admin.shopify.com/store/devmcflyads/apps/mcfly-analytics-public/app  
App URL must stay: **https://mcfly-analytics.fly.dev**

---

## Sequence (stop after each phase until it is done)

### Phase 0 — Freeze + hygiene (agent done; founder 5 min)

1. **No new product features** until Phase 2 smoke is green.
2. **Rotate the Fly API token** that was pasted into chat. Create a new deploy token in your own terminal; do not paste it into git or Cursor chat again. Prefer GitHub Actions secret `FLY_API_TOKEN` for future deploys.
3. Merge or keep PR 19 as the freeze SHA. Do not stack “honesty” PRs on top.

### Phase 1 — Partner Dashboard (human only; this is the real work)

Open **Mcfly Analytics Public** `403721814017` (never Custom `400772497409`).

1. **Distribution** = Shopify App Store (if not already).
2. **Pricing** = Shopify App Pricing · **one** plan · **$39 USD / 30 days** · **7-day free trial**. **Delete the Free plan.** A Free plan next to $39 is a **1.1.4** mismatch with the app, listing, and testing instructions.
3. **App testing information** from [`PARTNER_TESTING_INSTRUCTIONS.md`](./PARTNER_TESTING_INSTRUCTIONS.md): Username/Password **empty**, checkbox **“My app doesn't require an account to use it” ON**, paste the `APP_STORE_PASTE:testing` block.
4. **Listing URLs** (reviewers click these):

   | Field | Value |
   | --- | --- |
   | App URL | `https://mcfly-analytics.fly.dev` |
   | Website | `https://mcfly-analytics.fly.dev` |
   | Privacy | `https://mcfly-analytics.fly.dev/privacy` |
   | Support | `https://mcfly-analytics.fly.dev/support` |
   | Terms | `https://mcfly-analytics.fly.dev/terms` |

5. **Works with** = blank. **Online store required** = unchecked.
6. **PCD Level 1 only** (protected customer data; leave name/email/phone/address unchecked). Paste from listing §PCD.
7. **Emergency contact** email + phone (monitored; allowlist `noreply@shopify.com`).
8. Confirm app handle is `mcfly-analytics-public` (matches `SHOPIFY_APP_HANDLE`).

Reply in Cursor when a step is done: `plans set` · `pcd done` · `emergency contact done` · `testing form done`.

### Phase 2 — One Admin smoke (human; do not skip)

On **`devmcflyads`**, Live data, after Phase 1 plans exist:

1. Overview: if sales still loading, Total ROAS is **—.——**, not **0.00×**.
2. Spend three doors: **Download Template and Upload** first; **Upload an Ads Manager CSV**; **Add one bill**. Confirm the primary template defaults to Jan 1 of year−5 through yesterday, then smoke Billboard + $400 + One day + yesterday in the helper.
3. Type **Billboard** (or similar) → Overview mix and Spend both show that name, not “Other.”
4. Settings → **Start 7-day trial** → Shopify plan picker in the **top** Admin window. Fail if “refused to connect” inside the iframe.
5. Toggle **Sample data | Live data**. Never Practice / Free / Pro as a view.
6. After smoke: leave the review store on **Live data**.

If any of 1–5 fail, **then** a targeted agent fix is allowed. If they pass, do not open a new PR.

### Phase 3 — Listing package (human; blocks Submit)

Merchant-facing listing fields **must not include $39** (App Store 4.2.2 / 4.2.3). Put price only in Partner Pricing + reviewer notes.

1. Paste name / tagline / short / long / 5 feature bullets from [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md).
2. Recapture **five unique ~1600×900 Admin shots** per [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md). July PNGs are **not in git** and captions still say “Practice.” Do **not** upload `04-free-pro-pricing.png` or marketing-site captures.
3. Icon: `docs/listing-assets/mcfly-app-icon-1200.png`.
4. Short screencast: install → Start trial (`_top`) → type one spend line → Overview sales ÷ spend.
5. Run Partner **automated checks**. Fix failures before Submit.

### Phase 4 — mcflyads.com (improve, but not on the review path)

**For this resubmit:** reviewers should use **Fly** trust URLs (Phase 1). That already matches the live desk.

**mcflyads.com is already close:** home and `/pricing` say 7-day then $39. Optional later (after Submit, or a quiet evening — not a blocker):

- Leftover Free/Pro voice on satellite pages: `site/about.html`, `site/mds-made-easy/import-export.html`, `site/vs/profit-trackers.html`.
- Keep Cloudflare Pages `site/` in sync with Fly (same `site/` folder). Do not make mcflyads.com the **App URL**.
- Do not add a shop-domain harvest form.

### Phase 5 — Submit and wait

1. Recheck: one paid plan, testing checkbox ON, Live data on the test store, App URL = Fly.
2. Submit from Partner.
3. **Do not expand scope while under review.** PCD cannot be re-requested mid-review.

---

## Explicitly out of scope until after approval

- Another hostile “fleet audit”
- Meta / Google Ads OAuth or App Review
- Level 2 PCD (name/email/phone/address)
- `read_all_orders`
- Checkout “Works with”
- Feature-gating LTV/Goals behind Pro
- Changing price or adding a Free plan “for conversion”

---

## Agent vs human (so we stop looping)

| Agent may do | Human must do |
| --- | --- |
| Deploy a **targeted** smoke-fail fix | Partner Pricing / PCD / listing / Submit |
| Recapture guidance, listing paste | Admin screenshots + screencast |
| Keep Fly healthy | Rotate tokens; Cloudflare login if Pages drifts |
| Nothing else | Phase 2 click-through on `devmcflyads` |

---

## Definition of done for resubmit

Not “more tests.” These five:

1. Partner shows **one** $39 plan with 7-day trial (no Free).
2. Testing form checkbox **on**, instructions pasted.
3. `devmcflyads` smoke 1–5 green on **Fly v166+**.
4. Listing copy + 5 Admin shots + icon + screencast uploaded; automated checks green.
5. Click **Submit**.
