# Billing tiers — Free Meta/Google → Pro $39 at launch

**Status:** Entitlements shipped (`app/app/lib/entitlements.server.ts`). **Charges OFF** until `MCFLY_BILLING=1` + design-partner smoke + announce.  
**Religion:** cash Total ROAS desk — not GMV tax, not email CRM on day one. Domination bar: [`MASTER_PLAN.md`](./MASTER_PLAN.md) §1.  
**Founder lock (2026-07-29):** Pro **$39/store/mo** at Billing launch; may raise later for new subscribers.  
**PCD + LTV path:** [`PCD_AND_LTV.md`](./PCD_AND_LTV.md)  
**Partner evidence:** [`DESIGN_PARTNER_SMOKE.md`](./DESIGN_PARTNER_SMOKE.md)

## Product matrix (SoT)

| | **Free** | **Pro ($39 flat / store / mo at launch)** |
| --- | --- | --- |
| Spend channels | **Meta + Google + custom Other** (name influencers/podcasts/agency; CSV + Connections later) | **Named platforms** (TikTok, Microsoft, Amazon, …) + richer Mix / Explorer |
| Core desk | Total Sales ÷ spend, profit margin / break-even, basic allocation for Meta+Google | Same + richer Mix / Explorer / Close history |
| LTV + PCD L1 advanced | **Teaser only** (SAMPLE preview or locked panel + upgrade CTA) | Customer LTV (opaque cohorts), order-fact depth |
| Goals / Close | Total ROAS goal + Share Overview | 12-month plan, YoY fill, Share Overview (merchant emails themselves) |
| Demo | Full SAMPLE desk shows Pro capability | Live shop data under Pro |

**Override:** `MCFLY_PRO_SHOPS=shop1.myshopify.com,shop2.myshopify.com` grants Pro without Billing (design partners / QA).

## When to ship charges

| Gate | Rule |
| --- | --- |
| Partner listing **Pricing** | Stays **Free** until founder announces Pro (or freemium Free+$39 when Billing is live) |
| In-app feature gates | **On now** (Free = Meta+Google+custom Other; named platforms + LTV = Pro) |
| Shopify Billing charges | Only when `MCFLY_BILLING=1` + announce |

## LTV vs PCD (do not confuse)

| Feature | PCD needed | Tier |
| --- | --- | --- |
| New vs returning (today) | Level 1 | Free |
| **Customer LTV** (cohort revenue from opaque ids) | Level 1 (+ later `read_all_orders` for multi-year) | **Pro** (SAMPLE preview on Free) |
| Email/name customer CRM LTV | Level 2 | Optional Scale only — refuse for v1 |

## Funnel

1. Public `/demo` — full Pro SAMPLE  
2. Install Free — paste Meta/Google spend or Connections MOCK sync  
3. See Total ROAS vs Ads Manager — easy aha  
4. Upgrade Pro **$39** — unlock LTV + all channels + advanced Goals/Close  

## First-submit lock

1. Partner listing **Pricing = Free**  
2. No in-app Billing charges until announce  
3. Site may say “Pro $39” with feature matrix — listing stays Free until Billing ships  
4. PCD = **Level 1 only** — see [`PCD_AND_LTV.md`](./PCD_AND_LTV.md)  
5. After Marty replies **`install works`**, wire Billing GraphQL — not before  

## Evidence pointers

- Listing Free: [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md)  
- Submit runbook: [`SUBMIT_NOW.md`](./SUBMIT_NOW.md)  
- Scaffold: `billing-flag.server.ts` (`PRO_PLAN.amount = 39`), `billing.server.ts`, `entitlements.ts`  
- Competitor wedge: [`COMPETITORS.md`](./COMPETITORS.md)
