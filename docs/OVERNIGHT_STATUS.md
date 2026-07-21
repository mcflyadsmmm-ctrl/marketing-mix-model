# Overnight status — Mcfly Analytics

**Last updated:** Shopify launch prep  
**Live site:** https://mcflyads.com  
**App Store walkthrough:** docs/SHOPIFY_LAUNCH.md

## Ready in repo (code)

- Marketing site: free launch, privacy/support App Store–ready
- Shopify app: GDPR compliance webhook, uninstall cleanup, no shop-domain install form, no mock sales, Truth MVP migration
- Human walkthrough for Partner → design partners → App Store approval

## Human gates (do these next)

1. partners.shopify.com → create app + development store  
2. `cd app && shopify auth login && shopify app config link`  
3. `shopify app dev` → install → enter spend → see MER  
4. Host app + Postgres → `shopify app deploy` → DNS `app.mcflyads.com`  
5. Invite design partners (free)  
6. Later: App Store listing + submit  

## Religion (locked)

Cash MER only. No pixels/MTA. Free launch → paid later via Shopify Billing.
