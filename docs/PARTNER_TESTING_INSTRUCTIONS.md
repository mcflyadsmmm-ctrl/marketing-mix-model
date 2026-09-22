# Partner Dashboard — App testing information (4.5.4 / 4.5.5)

**Why this file exists:** Shopify paused Mcfly Analytics (ref **127166**, 2026-08-24) for:

1. **2.1.1** — the plan CTA loaded `admin.shopify.com` inside the app iframe (`refused to connect`).
2. **4.5.4 / 4.5.5** — [Test account form](https://screenshot.click/12-40-wvht7-gytqd.png) had **empty Username / Password** and **“My app doesn't require an account to use it” unchecked**.

Human pastes the blocks below into Partner → App listing → **App testing information**, then Submit.  
**Do not commit real passwords. Do not paste `<PASTE…>` placeholders into Partner.**

SoT for listing copy: [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md) · billing: [`BILLING_TIERS.md`](./BILLING_TIERS.md)

**Human before Submit:** Live must be unparked (`docs/ops/LIVE_UNPARK_CHECKLIST.md`). A parked Fly install paints labeled SAMPLE, not the review shop. Cursor does not flip the kill switch. mcflyads.com Pages must match Fly (trial is **90 days** of orders, paid is **24 months**) before Website = `https://mcflyads.com`.

---

## Partner form — fill exactly this (4.5.4 screenshot)

Mcfly is an **embedded Admin app**. There is **no Mcfly username, password, SSO, or second signup**. After install, Shopify session tokens are the login. App Review already installed on their own store (`mcfly-2.myshopify.com` in the reject tape) without a Mcfly account.

| Partner field | Value to enter |
| --- | --- |
| **Username** | Leave **empty** |
| **Password** | Leave **empty** |
| **“My app doesn't require an account to use it.”** | **CHECK THIS** |
| **Testing instructions** | Paste the **entire** block in the next section (this is where 4.5.4 wants credentials stated) |

That combination is the valid 4.5.4 / 4.5.5 path for an app that does not have its own login:

- **4.5.4** — account credentials are written into the testing instructions (`Username: none` / `Password: none` + how to get the complete feature set).
- **4.5.5** — applies **if** the app requires login. Mcfly does not. Do **not** invent a staff password to fill the form; stale / 2FA / Google SSO credentials fail 4.5.5.

**Do not** submit with the checkbox **unchecked** and Username/Password blank. That is the pause.

**Do not** put a 2FA store-owner password in Username/Password. That also fails 4.5.5.

---

## Testing instructions (paste into the instructions field)

<!-- APP_STORE_PASTE:testing -->
```text
TEST ACCOUNT (App Store 4.5.4 / 4.5.5)
Username: none
Password: none
Check “My app doesn't require an account to use it.”

Mcfly Analytics is embedded in Shopify Admin. After install, the Shopify Admin
session is the only login. There is no Mcfly signup, no Google SSO, no second
password, and no in-app account to create.

How to reach the complete feature set (4.5.5)
- One plan, whole desk — five analysis tabs plus Settings: Overview, Orders,
  Customers, Spend, Goals, Settings. Growth and LTV are Customers chips.
  Nothing is feature-gated.
- 7-day trial, then $39/store/mo. Trial stores 90 days of order history.
  Paid stores go up to 24 months. Settings → Start 7-day trial.
  Shopify App Pricing opens in the TOP Admin frame (development stores: $0 test
  charge is OK). Approve → return to the app.
- Uninstall in Admin stops the next 30-day cycle (1.2.3).

Admin is this shop’s Live data when Live is unparked. A SAMPLE chip means the
Snowdevil example book — not this shop. SAMPLE lives on
https://mcflyads.com/demo. There is no Sample | Live
toggle in Settings. Do not judge this shop from SAMPLE numbers.

Install on the App Review store. Do not wait for a Mcfly username/password
screen — it does not exist.

PRICING
Shopify App Pricing — one plan, $39/store/mo flat after a 7-day trial.
Start 7-day trial / Manage plan MUST open Shopify’s plan picker in the TOP
Admin frame (never inside the app iframe).

CRITICAL — SAMPLE vs Live data
PASS if the desk shows this shop’s Shopify orders (Live data) and is not
labeled SAMPLE.
FAIL if you must hunt a Sample | Live toggle, or if unlabeled SAMPLE dollars
are presented as this shop.
If you see a SAMPLE chip during App Review, stop — that is the example book.

SMOKE (Fly v433 — current production; Live must be unparked before Submit)
1. Install Mcfly Analytics. App opens on Overview. FAIL if the first
   things you see are blank Total ROAS or Ad spend tiles.
   PASS if the first glance is three YoY sales cards: This month /
   This quarter / This year vs last year. Missing last year is an em dash
   with “not on file” — never last year as $0.
   Trial last-year cells stay honest on a 90-day book. Spend is optional.
   On a brand-new store a banner explains Shopify sales are still loading
   (0 of N days). That is expected, not a 404. Continue.
2. Confirm the desk is this shop’s Live data (not SAMPLE). FAIL if you
   must hunt a Sample | Live toggle.
3. Go to Settings → Your plan.
4. Click Start 7-day trial. Shopify’s plan selection MUST replace the Admin app
   frame in the TOP window.
   FAIL if you see “admin.shopify.com refused to connect” inside the iframe.
   FAIL if the app is bricked until reload.
   PASS if the Shopify-hosted plan picker opens.
5. Approve (dev stores: $0 test charge is OK) → return to the app. Tabs are
   not feature-gated. Trial ingest is 90 closed days of order rows. Paid is
   up to 24 months. Five analysis tabs plus Settings: Overview, Orders,
   Customers, Spend, Goals, Settings. Growth and LTV are Customers chips.
6. Open Orders and Customers with no spend entered — returning dollars,
   days to a second order, weekend share, and 30 / 90-day value still load.
   First year on LTV is an em dash when a year is not on file — not a fake
   complete year, not $0 LTV.
   Then open Spend. Three ways to add spend:
   (a) Download Template and Upload; (b) upload an existing Ads Manager CSV;
   (c) Add one bill — choose channel, amount, and When, then save.
   After one typed spend day exists, open Total ROAS — Sales | Spend | Total
   ROAS (Shopify Total Sales ÷ entered spend). Empty spend is an em dash,
   never 0×. Mix, CPA, ledger, and dual-close sit on Spend. Goals is its
   own tab. Overview still leads with the three YoY sales cards.
7. First-session check: Overview is useful with $0 spend. Then enter
   yesterday’s Meta spend and a $400 billboard for the same date on Spend,
   open Total ROAS, and compare against yesterday’s Shopify sales.
   Empty spend on Total ROAS is an em dash, never 0×.

SAMPLE SPEND CSV (paste into Spend → import)
date,channel,amount
2026-08-20,Meta Ads,110
2026-08-20,Google Ads,80
2026-08-21,Meta Ads,100
2026-08-21,Google Ads,90

App URL: https://mcfly-analytics.fly.dev
Support: https://mcfly-analytics.fly.dev/support
Privacy: https://mcfly-analytics.fly.dev/privacy
Emergency contact: mcflyadsmmm@gmail.com
```
<!-- /APP_STORE_PASTE:testing -->

---

## After paste (human)

- [ ] Username **empty**, Password **empty**
- [ ] **“My app doesn't require an account to use it”** is **checked**
- [ ] Testing instructions pasted (block above) — includes the TEST ACCOUNT lines
- [ ] No `<PASTE…>` / expired / 2FA password in the form
- [ ] Partner Pricing = **Shopify App Pricing · ONE plan, $39/store/mo, 7-day free trial**
      — **remove the Free plan.** See [`BILLING_TIERS.md`](./BILLING_TIERS.md).
- [ ] Embedded smoke on an unpaid install: Settings → **Start 7-day trial** → top-frame plans
- [ ] Live unparked on Fly so App Review sees this shop, not SAMPLE
- [ ] Submit from Partner Dashboard (human). Cursor does not Submit.

## Admin smoke Result (paste back to Conductor)

```text
Fly v433 Live smoke (unparked)
Overview first glance: PASS / FAIL
Blank ROAS or Ad spend on first open: YES / NO
Orders / Customers at $0 spend: PASS / FAIL
LTV First year is — (not a fake year): PASS / FAIL / n/a
Empty spend Total ROAS is em dash never 0×: PASS / FAIL
Trial is 90 days / paid is 24 months (not full-access): PASS / FAIL
Trial CTA top-frame: PASS / FAIL / skipped
SAMPLE chip off on the review shop: PASS / FAIL
Notes:
```
