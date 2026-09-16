# Partner Dashboard — App testing information (4.5.4 / 4.5.5)

**Why this file exists:** Shopify paused Mcfly Analytics (ref **127166**, 2026-08-24) for:

1. **2.1.1** — the plan CTA loaded `admin.shopify.com` inside the app iframe (`refused to connect`).
2. **4.5.4 / 4.5.5** — [Test account form](https://screenshot.click/12-40-wvht7-gytqd.png) had **empty Username / Password** and **“My app doesn't require an account to use it” unchecked**.

Human pastes the blocks below into Partner → App listing → **App testing information**, then Submit.  
**Do not commit real passwords. Do not paste `<PASTE…>` placeholders into Partner.**

SoT for listing copy: [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md) · billing: [`BILLING_TIERS.md`](./BILLING_TIERS.md)

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

- **4.5.4** — account credentials are written into the testing instructions (`Username: none` / `Password: none` + how to get full access).
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
- One plan, whole desk — eleven analysis tabs plus Settings: Overview,
  Customers, Growth, Orders, LTV, Spend Upload, Total ROAS, Channel
  Allocation, YoY, CPA, Goals, Settings. Nothing is feature-gated.
- 7-day full-access trial, then $39/store/mo. Settings → Start 7-day trial.
  Shopify App Pricing opens in the TOP Admin frame (development stores: $0 test
  charge is OK). Approve → return to the app.
- Uninstall in Admin stops the next 30-day cycle (1.2.3).

Desk modes live in Settings, not a top toggle: Sample data | Live data.
Sample data is Harbor example numbers. Live data is this shop’s Shopify
sales plus the spend you entered. Billing is not a desk mode.

Install on the App Review store. Do not wait for a Mcfly username/password
screen — it does not exist.

PRICING
Shopify App Pricing — one plan, $39/store/mo flat after a 7-day trial.
Start 7-day trial / Manage plan MUST open Shopify’s plan picker in the TOP
Admin frame (never inside the app iframe).

CRITICAL — DESK MODE
Open Settings → Sample data. Click “Switch to Live data now” before judging
this shop. There is no top Sample | Live toggle.
Click “Switch to Sample data now” only to smoke Harbor example numbers.
Optional: “Live data only — hide Sample data”.

SMOKE (Fly 320 — SAMPLE Result PASSed 2026-09-15; do not ship Fly 321 for craft)
1. Install Mcfly Analytics. App opens on Overview. FAIL if the first
   things you see are blank Total ROAS or Ad spend tiles, or a peer
   “Spend Upload →” next to Open Orders.
   PASS if the first glance is three YoY sales cards: This month /
   This quarter / This year vs last year. Last year is an em dash with
   “Shopify shares about 60 days…” — never last year as $0.
   Then: What to notice, Total Sales + typical order (no ROAS tile at
   $0 spend), compact row, sales chart. No period chips in the top
   chrome. Spend is optional. Hashes such as #mcfly-mix still open
   Overview without throwing. On a brand-new store a banner explains
   Shopify sales are still loading (0 of N days). That is expected,
   not a 404. Continue.
2. Go to Settings → Sample data. Click “Switch to Live data now”. Confirm
   the page says Live data. FAIL if you must hunt a top Sample | Live toggle.
3. Go to Settings → Your plan.
4. Click Start 7-day trial. Shopify’s plan selection MUST replace the Admin app
   frame in the TOP window.
   FAIL if you see “admin.shopify.com refused to connect” inside the iframe.
   FAIL if the app is bricked until reload.
   PASS if the Shopify-hosted plan picker opens.
5. Approve (dev stores: $0 test charge is OK) → return to the app. The whole
   desk was already available during the trial; nothing unlocks or locks.
   Eleven analysis tabs plus Settings: Overview, Customers, Growth, Orders,
   LTV, Spend Upload, Total ROAS, Channel Allocation, YoY, CPA, Goals,
   Settings.
6. Open Customers, Growth, Orders, and LTV with no spend entered — returning
   dollars, days to a second order, weekend share, and 30 / 90-day value
   still load. First year on LTV is an em dash when Shopify only shared
   ~60 days — not a fake complete year, not $0 LTV.
   Then open Spend Upload. Three ways to add spend:
   (a) Download Template and Upload — choose channels, default All history
   (Jan 1 of year−5 through yesterday), download, fill daily spend, and
   upload the same file; (b) upload an existing Ads Manager CSV; (c) Add one
   bill — choose channel, amount, and When, preview the daily amount, then
   click an action such as “Save Billboard $400 for Aug 26.”
   After one typed spend day exists, open Total ROAS — Sales | Spend | Total
   ROAS (Shopify Total Sales ÷ entered spend, closed days only). Certified
   windows (Yesterday, last N days, this month / quarter / year) paint At
   goal / Below goal vs the Settings target; empty spend is an em dash,
   never 0×. Click a chip or chart mark for the formula. Dual-close,
   this-month pacing, compare, every-day ledger, and last-7 / last-28 intel
   sit on the same page. Channel Allocation holds mix, spend left at goal,
   and a 20% lighter-channel cut. YoY, CPA, and Goals are separate tabs.
   Overview still leads with the three YoY sales cards (no Compare, Ledger,
   Channels, or Plan subtabs). Hashes such as #mcfly-mix still open Overview
   without throwing.
7. First-session check: Overview is useful with $0 spend. Then enter
   yesterday’s Meta spend and a $400 billboard for the same date on Spend
   Upload, open Total ROAS, and compare against yesterday’s Shopify sales.
   Days with no spend row read $0 on Spend Upload.

SAMPLE SPEND CSV (paste into Spend Upload → import)
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
- [ ] Submit fixes from Partner Dashboard

## Admin smoke Result (paste back to Conductor)

```text
Fly 320 SAMPLE smoke
Overview first glance: PASS / FAIL
Blank ROAS or Ad spend on first open: YES / NO
Customers / Growth / Orders / LTV at $0 spend: PASS / FAIL
LTV First year is — (not a fake year): PASS / FAIL / n/a
One live spend day → Total ROAS em dash never 0×: PASS / FAIL
Trial CTA top-frame: PASS / FAIL / skipped
Notes:
```

