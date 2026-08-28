# Founder — switch to Public app + launch (human only)

**SoT app:** **Mcfly Analytics Public** (rename in Partner to “Mcfly Analytics” if you want)  
**Dashboard:** https://dev.shopify.com/dashboard/227535001/apps/403721814017  
**Client ID:** `bbaee078a5ab871aea1cc99a9e01cabd`  
**Do not use** Custom app https://dev.shopify.com/dashboard/227535001/apps/400772497409 for Submit or Billing.

Repo `shopify.app.toml` + Fly + local `.env` are on the **Public** client (`bbaee078…`) with `MCFLY_APP_DISTRIBUTION=app_store` (2026-07-31). Health OK.

**Security:** Client secret was pasted in chat — rotate it in Partner Credentials after install works, then re-set Fly.

---

## 1–3. Done (agent)

- Toml → Public · Fly secrets set · `MCFLY_APP_DISTRIBUTION=app_store`

Still confirm in Partner:
1. Open https://dev.shopify.com/dashboard/227535001/apps/403721814017 → **`on public app`**
2. **Distribution** → Shopify App Store → **`distribution done`**

---

## 4. Reinstall on demcflyads

1. https://admin.shopify.com/store/devmcflyads/apps  
2. Remove old **Custom** Mcfly if present  
3. Install **Mcfly Analytics** / Public from Partner install link  
4. Real store → Settings → confirm app loads  

Reply: **`public install works`**

---

## 5. PCD + emergency + listing Submit (Public app only)

Same as before on **403721814017**:
- PCD Level 1 → **`pcd done`**
- Emergency contact → **`emergency contact done`**
- Trust pages → **`pages live`**
- Listing (one plan $39 + 7-day trial, no Free) + shots → **`assets uploaded`** → **`submitted`**  
  Full order: [`../RESUBMIT_PLAN.md`](../RESUBMIT_PLAN.md)

Copy: [`APP_STORE_LISTING.md`](../APP_STORE_LISTING.md)  
Reviewer script: [`REVIEWER_TEST_SCRIPT.md`](./REVIEWER_TEST_SCRIPT.md)

---

## 6. Billing = Shopify App Pricing (one plan, $39 + 7-day trial)

Your Public app uses **Shopify App Pricing** (not Billing API create-charge).

1. Partner → **Manage Shopify App Store listing** → **Pricing**
2. **One** plan: **$39 USD / 30 days** with a **7-day free trial**
3. **Delete the Free plan.** The app has no feature gate, so a Free tier
   contradicts the listing and the reviewer instructions. As of the 2026-08-26
   Admin smoke the live managed-pricing page still showed **Free + Pro $39** —
   this is the open item.
4. In-app **Start 7-day trial** opens Shopify's plan page in the top frame
5. After approve → Settings should show the plan as active

Reply: **`plans set`** then **`billing works`**

---

## Webhooks (after secret on Fly)

```bash
cd /Users/martysmithson/marketing-mix-model/app && npx shopify app deploy --allow-updates
```

Reply: **`webhooks registered`**
