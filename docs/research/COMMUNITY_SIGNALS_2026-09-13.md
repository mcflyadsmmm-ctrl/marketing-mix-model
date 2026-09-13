# Community signals — natural flow pains (2026-09-13)

**Type:** Public merchant/operator language → Mcfly product moves.  
**Not** invented Mcfly reviews (still 0). **Not** a religion doc.

Sources this pass: Shopify Community / Dev forums (timezone + refund-date reporting), Weld “Sales over time” SQL guide, Triple Whale mismatch docs, GA4↔Shopify refund gap explainers, Meta↔Shopify ROAS reconciliation guides (Attribuly / Niblin / AdsX / Ad-Lab).

---

## What people keep complaining about

| Pain | Where it shows up | Easy Mcfly answer |
| --- | --- | --- |
| “My analytics app doesn’t match Shopify” | Forums, Weld, TW help | Day totals from **ShopifyQL `FROM sales`** — same grain as Admin Analytics |
| Refunds rewrite yesterday / wrong day | Shopify Community “refund by refund date”, TW Orders vs Refunds tables | Event-dated sales: refunds land on the **refund day**, not order day |
| Timezone drift on daily charts | GraphQL `createdAt` UTC vs shop IANA | Always bucket in **shop timezone**; never host UTC midnight |
| Gross vs net silent compare | Media-buyer skill docs, reconciliation sheets | Label Total vs Net; never compare gross to someone else’s net quietly |
| Ads Manager ROAS ≠ store sales | Reddit / agency blogs | Shopify revenue ÷ entered spend for blended ROAS; platforms over-claim |
| Young store = wall of empty charts | Desk UX pattern | Prefer filled charts; quiet empty note; Sales/Orders/AOV first |
| Suite bill climbs with GMV | TW alternative roundups | Flat **$39/store/mo** + trial — no invented install counts |

---

## Natural flow we optimize for

1. Open Overview → period numbers feel like Shopify.  
2. Sales day board → closed days match Analytics; today stays open.  
3. Refund/edit → day reseals without a spreadsheet autopsy.  
4. Customers → order history honesty while seals catch up.  
5. Spend later → reconcile platform claims to Shopify, not the other way around.

---

## Shipped against this bank (2026-09-13)

- Admin **spot-check** of closed days + repair enqueue  
- Spot-check / reconcile / backfill prefer **ShopifyQL Analytics day totals** (fallback: order crawl)  
- Spread sample (newest + oldest + mid) so MTD refunds can’t hide  
- Clear **OrderFact** day seals on sales mismatch  
- Quiet accuracy strip + decision takeaway on mismatch  
- Thin-store empty depth note  
- `refunds/create` subscribed (Partner `shopify app deploy` still required)  
- Multi-day dirty keys for refund/cancel event days  
- Open day excluded from closed aggregates / Goals pace; day-1 = Starting not Miss  
- Accuracy copy names **Total Sales (not Net)** so merchants don’t silent-compare  

---

## Still open (next accuracy slices)

- Partner register `refunds/create` via `shopify app deploy` (human gate)  
- One-row “platform claim vs Shopify” reconcile when spend is present  
- Keep mining App Store peer reviews weekly (quote only, never invent Mcfly social proof)
