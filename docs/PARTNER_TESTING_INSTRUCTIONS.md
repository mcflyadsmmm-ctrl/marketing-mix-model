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
- One plan, whole desk: Overview, Spend, Allocation, Customer LTV, Goals,
  Advanced, Settings. Nothing is feature-gated.
- 7-day full-access trial, then $39/store/mo. Settings → Start 7-day trial.
  Shopify App Pricing opens in the TOP Admin frame (development stores: $0 test
  charge is OK). Approve → return to the app.
- Uninstall in Admin stops the next 30-day cycle (1.2.3).

Desk modes are the only views: Sample data | Live data. Sample data is example
numbers. Live data is this shop’s Shopify sales plus the spend you upload.
Billing is not a desk mode.

Install on the App Review store. Do not wait for a Mcfly username/password
screen — it does not exist.

PRICING
Shopify App Pricing — one plan, $39/store/mo flat after a 7-day trial.
Start 7-day trial / Manage plan MUST open Shopify’s plan picker in the TOP
Admin frame (never inside the app iframe).

CRITICAL — DESK MODE
Switch the top toggle to Live data before judging this shop’s Total ROAS.

SMOKE (matches the 2026-08-24 review path)
1. Install Mcfly Analytics. App opens on Overview (Total ROAS).
   On a brand-new store a banner explains Shopify sales are still loading
   (0 of N days). That is expected, not a 404. Total ROAS deliberately shows
   “—.——” rather than 0× until at least one closed sales day lands. Continue.
2. Go to Settings → Your plan.
3. Click Start 7-day trial. Shopify’s plan selection MUST replace the Admin app
   frame in the TOP window.
   FAIL if you see “admin.shopify.com refused to connect” inside the iframe.
   FAIL if the app is bricked until reload.
   PASS if the Shopify-hosted plan picker opens.
4. Approve (dev stores: $0 test charge is OK) → return to the app. The whole
   desk was already available during the trial; nothing unlocks or locks.
5. Spend → three doors: (a) Add spend — choose channel, amount, and When;
   preview the daily amount, then click the action button such as “Save
   Billboard $400 for Aug 26”; (b) paste or upload an Ads Manager CSV; (c) Fill
   many days — choose channels + dates and download that daily template. Then
   Overview shows Total ROAS = Shopify Total Sales ÷ ad spend.
6. First-session check: enter yesterday’s Meta spend and a $400 billboard for
   the same date, then compare against yesterday’s Shopify sales. Days with no
   spend row read $0.

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
- [ ] Submit fixes from Partner Dashboard
