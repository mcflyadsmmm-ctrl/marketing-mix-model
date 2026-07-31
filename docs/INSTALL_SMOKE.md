# Install smoke — demcflyads (human, ~5 min)

**Goal:** Prove D1+D2 ritual on hosted Fly (no `shopify app dev`).  
**Host:** https://mcfly-analytics.fly.dev  
**Partner:** https://dev.shopify.com/dashboard/227535001/apps/403721814017 (Public App Store app)  
**Admin apps:** https://admin.shopify.com/store/devmcflyads/apps  

## Before you start

1. Stop any `shopify app dev` tunnel.  
2. Open Mcfly Analytics from Admin (not the bare Fly URL alone).  
3. **Demo → Turn sample desk OFF** before judging live till numbers.

## Ritual

1. **Settings** — set profit margin (e.g. 35%; what you keep after product costs) → save via contextual save bar → see break-even update.  
2. **Spend** — Download blank template → fill a few days with real daily spend that lines up to days where Shopify has orders (include **Other** if needed) → Import.  
3. **Total ROAS** — confirm sales are pulling from Shopify automatically (`read_orders`) and Total ROAS ≈ Shopify sales ÷ imported spend for the same period.  
4. **Explorer** — confirm bars reflect the uploaded CSV channel mix and the Total ROAS dots reflect that bucket’s live Shopify sales ÷ spend.  
5. **Customer Lifetime Value** — open the LTV tab; cohorts should fill from Shopify order backfill, or show an honest backfilling / history-limited state.  
6. **Allocation** — recommendation when spend > 0.

## Reply in Cursor

**`install works`** — or paste the error / screenshot.

Agent will then continue App Store assets / Billing stub per [`BILLING_TIERS.md`](./BILLING_TIERS.md).
