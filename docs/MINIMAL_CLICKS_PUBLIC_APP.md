# Minimal clicks — App Store on Public app (SoT)

**You only click.** Repo SoT is **Mcfly Analytics Public**. Custom app is archived (no Billing).  
Live cutover checklist: [`ops/FOUNDER_DO_NOW.md`](./ops/FOUNDER_DO_NOW.md)

| | Legacy Custom (do not Submit) | **SoT (App Store + Billing)** |
| --- | --- | --- |
| Name | Mcfly Analytics | **Mcfly Analytics Public** (rename in Partner if you want) |
| Client ID | `88c56d21…` | **`bbaee078a5ab871aea1cc99a9e01cabd`** |
| Dashboard | …/apps/400772497409 | **https://dev.shopify.com/dashboard/227535001/apps/403721814017** |
| Toml | `shopify.app.custom.toml` | **`shopify.app.toml`** |

Agent done: toml pointed at Public · docs updated. **Still needs:** Public Client secret on Fly + reinstall.

---

## YOUR CLICKS (do in order — reply after each)

### Click 1 — Open the NEW app
https://dev.shopify.com/dashboard/227535001/apps/403721814017  

Reply: `on public app`

### Click 2 — Public distribution (the whole point)
1. Left nav → **Distribution**  
2. **Choose distribution** (or equivalent) → **Public** / **Shopify App Store**  
3. Confirm  

Reply: `distribution public`  
If you only see Custom again, stop and say so.

### Click 3 — PCD Level 1
1. **API access** → **Protected customer data** → Request  
2. Check **Protected customer data** only  
3. Leave name / address / email / phone **unchecked**  
4. Paste from `docs/APP_STORE_LISTING.md` § Partner PCD COPY-PASTE  
5. Save  

Reply: `pcd done`

### Click 4 — read_all_orders (optional same session)
API access → request **Read all orders only** — paste justification from chat (till LTV / 90–365d).  
Skip subscriptions / payment / checkout items.

Reply: `read_all_orders done` (or `skipped`)

### Click 5 — Tell agent “redeploy webhooks”
After PCD, reply: `redeploy public`  
Agent will CLI-deploy order + compliance webhooks + `read_all_orders` if approved.

### Click 6 — API secret → Fly (human secrets)
1. NEW app → **Settings** / **Credentials** → copy **Client secret**  
2. Reply in Cursor: `secret ready` (do **not** paste the secret in chat if avoidable — or paste once in a private note)  
3. Agent will guide: `fly secrets set SHOPIFY_API_KEY=… SHOPIFY_API_SECRET=… -a mcfly-analytics`  
   (or you run it) — **required** before OAuth on the public app works on Fly.

### Click 7 — Listing media + copy (Partner listing on NEW app)
Upload from Finder (already opened earlier):
- Icon: `docs/listing-assets/mcfly-app-icon-1200.png`  
- Shots 01–04 in `docs/listing-assets/shots/`  
- Shot 05 still need Spend crop  

Paste listing text from `docs/APP_STORE_LISTING.md`  
Pricing **Free** · Works with **blank** · App URL `https://mcfly-analytics.fly.dev`

### Click 8 — Submit
Automated checks → **Submit for review**

Reply: `submitted`

---

## Do not

- Submit on the **old** Custom app (`400772497409`)  
- Upload `05-HOLD-marketing-site-…`  
- Check Level 2 PCD fields  
- Set App URL to mcflyads.com  
- Enable paid Billing yet
