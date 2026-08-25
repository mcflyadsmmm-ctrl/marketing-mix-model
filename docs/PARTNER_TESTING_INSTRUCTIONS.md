# Partner Dashboard — App testing information (paste pack)

**Why this file exists:** Shopify paused Mcfly Analytics (ref **127166**, 2026-08-24) for:

1. **2.1.1** — Spend → **Upgrade to Pro** loaded `admin.shopify.com` inside the app iframe (`refused to connect`). Code fix is in this branch; reviewers will re-click that exact button.
2. **4.5.4 / 4.5.5** — [Test account](https://screenshot.click/12-40-wvht7-gytqd.png) was empty with “My app doesn't require an account to use it” **unchecked**.

Human pastes this into Partner → App listing → **App testing information**, then Submit. Do **not** commit real passwords.

SoT: [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md) · billing: [`BILLING_TIERS.md`](./BILLING_TIERS.md)

---

## Test account (the form in Shopify’s 4.5.4 screenshot)

Mcfly is an **embedded Admin app**. After install, Shopify session tokens are the login. Reviewers already installed on their own store (`mcfly-2.myshopify.com` in the reject screencast) without a second Mcfly account.

**Do this:**

1. **Check** **“My app doesn't require an account to use it.”**
2. Do **not** leave the checkbox unchecked with blank Username / Password — that is exactly 4.5.4 / 4.5.5.
3. Do **not** give a Google SSO or 2FA-only account.

### Optional extra staff account (only if you want them on *our* demo store)

If you also want reviewers to open `devmcflyads.myshopify.com` with spend already loaded:

| Field | Paste |
| --- | --- |
| Username | `mcflyadsmmm@gmail.com` |
| Password | *(current staff password — rotate if it has ever been in chat/email)* |
| Account description | `Shopify Admin staff on devmcflyads — full Apps + Billing access so you can install Mcfly, import spend, and open Upgrade to Pro. No second Mcfly login. No 2FA on this staff account.` |

If the checkbox is checked, you can skip this optional account.

---

## Testing instructions (paste into the instructions field)

```text
APP: Mcfly Analytics (embedded). No second login — use the Shopify Admin session after install.
PRICING: Shopify App Pricing — Free (default) + Pro $39/store/mo flat. In-app Upgrade / Manage plan MUST open Shopify’s plan picker in the TOP Admin frame (never inside the app iframe).

CRITICAL — SAMPLE DESK
Open Demo → turn SAMPLE desk OFF before judging live Total ROAS.

SMOKE (matches the 2026-08-24 review path)
1. Install Mcfly Analytics. App opens on Overview (Total ROAS).
   A banner “Sales still syncing — expected after install” is normal on a new store
   (0 of N days). It is not a 404. Continue.
2. Click Spend in the app nav.
3. Click Upgrade to Pro (blue primary). Shopify’s Free/Pro plan selection MUST
   replace the Admin app frame in the TOP window.
   FAIL if you see “admin.shopify.com refused to connect” inside the iframe.
   FAIL if the app is bricked until reload.
   PASS if the Shopify-hosted plan picker opens and the merchant can pick Free or Pro.
4. Select Pro (dev stores: $0 test charge is OK) → approve → return to the app.
   Named channels / LTV unlock. Settings → Manage plan → switch back to Free
   without reinstalling (requirement 1.2.3).
5. Spend: Meta + Google (+ custom Other) → paste/import a daily CSV → Overview
   shows Total ROAS = Shopify Total Sales ÷ ad spend.

App URL: https://mcfly-analytics.fly.dev
Support: https://mcflyads.com/support
Privacy: https://mcflyads.com/privacy
```

---

## After paste (human)

- [ ] Checkbox **checked** (or staff username/password/description filled and working)
- [ ] Testing instructions pasted (block above)
- [ ] Partner Pricing = **Shopify App Pricing · Free + Pro $39** (must match in-app $39 — not $19/$49 leftovers)
- [ ] Embedded smoke on a **non-Pro** install: Spend → Upgrade to Pro → top-frame plans (no refused-to-connect)
- [ ] Submit fixes from Partner Dashboard
