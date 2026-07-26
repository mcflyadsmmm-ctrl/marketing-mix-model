# Billing tiers — after Free App Store smoke (deferred)

**Status:** Documented plan only. **Do not** ship Shopify Billing charges on the first Free listing.  
**Religion:** cash MER desk — not GMV tax, not LTV CRM on day one.

## When to ship each tier

| Tier | Ship when | Includes | Explicitly out |
| --- | --- | --- | --- |
| **Free / Desk** | **Now → first App Store submit** | CSV multi-platform spend template (+ Other), Shopify sales totals, cash MER (sales ÷ spend), break-even from margin, rules-based allocation, Demo sample for shots | Live Meta/Google OAuth, deep customer LTV, connector zoo, paid gates |
| **Pro (~$79 flat / store / mo)** | After design-partner smoke (`install works`) + Shopify Billing API stubbed/live | Longer history, freshness/recon banners, richer allocation detail, export | GMV / order-volume tax |
| **Scale (later)** | Revenue-pulled only | Multi-store, deeper analysis | Full customer CRM / Lifetimely-class LTV — needs harder PCD; **not** first listing |

## First-submit lock

1. Partner listing **Pricing = Free**  
2. No in-app Billing charges (`isTest` irrelevant until Billing exists)  
3. Site may say “~$79 later via Billing” — listing must stay Free  
4. `read_customers` stays **minimal** (opaque `id` + `numberOfOrders`) — not LTV scopes  
5. After Marty replies **`install works`**, agent may start Billing stub work — not before

## Evidence pointers

- Listing Free: [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md)  
- Submit runbook: [`SUBMIT_NOW.md`](./SUBMIT_NOW.md)  
- Competitor wedge: [`COMPETITORS.md`](./COMPETITORS.md)
