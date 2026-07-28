# Billing tiers — after Free App Store smoke (deferred)

**Status:** Documented plan only. **Do not** ship Shopify Billing charges on the first Free listing.  
**Religion:** cash MER desk — not GMV tax, not email CRM on day one.  
**PCD + LTV path:** [`PCD_AND_LTV.md`](./PCD_AND_LTV.md)

## When to ship each tier

| Tier | Ship when | Includes | Explicitly out |
| --- | --- | --- | --- |
| **Free / Desk** | **Now → first App Store submit** | Multi-platform CSV, Bill → daily, Shopify sales, cash MER, break-even, allocation, Demo sample for shots | Live ad OAuth, Level 2 PII, connector zoo, paid gates |
| **Pro (~$79 flat / store / mo)** | After design-partner smoke (`install works`) + Billing API | Longer history, freshness/recon, richer allocation, **till LTV (opaque cohorts)** when facts lane is ready | GMV tax; email/name CRM |
| **Scale (later)** | Revenue-pulled only | Multi-store; optional deeper analysis | Lifetimely-class **email CRM** only if merchants pull it — needs **Level 2 PCD** + listing rewrite |

## LTV vs PCD (do not confuse)

| Feature | PCD needed | When |
| --- | --- | --- |
| New vs returning (today) | Level 1 | First submit |
| **Till LTV** (cohort revenue from opaque ids) | Level 1 (+ later `read_all_orders` for multi-year) | Post-approve / Pro |
| Email/name customer CRM LTV | Level 2 | Optional Scale only |

## First-submit lock

1. Partner listing **Pricing = Free**  
2. No in-app Billing charges  
3. Site may say “~$79 later via Billing” — listing must stay Free  
4. PCD = **Level 1 only** (opaque `id` + `numberOfOrders`) — see [`PCD_AND_LTV.md`](./PCD_AND_LTV.md)  
5. After Marty replies **`install works`**, agent may start Billing stub work — not before

## Evidence pointers

- Listing Free: [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md)  
- Submit runbook: [`SUBMIT_NOW.md`](./SUBMIT_NOW.md)  
- Competitor wedge: [`COMPETITORS.md`](./COMPETITORS.md)
