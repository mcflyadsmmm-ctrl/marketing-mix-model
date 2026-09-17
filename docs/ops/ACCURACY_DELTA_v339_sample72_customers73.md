# Written accuracy delta — Fly v339 (SAMPLE #72 + Customers #73) — 2026-09-17

**Lane:** kill-risk #0 (wrong numbers = uninstall). Read-mostly on `app/**`.
**Prior:** [`ACCURACY_AUDIT_DENSE_v336.md`](./ACCURACY_AUDIT_DENSE_v336.md) — **23/23 PASS** @ `f580ccb` (PR #70 on top of LTV #68 + Orders Black Clover).
**Target:** branch `cursor/spend-trust-recurring` @ tip `17028c3` (merge of Customers #73 on top of SAMPLE #72). This delta is the accuracy read after those two PRs — not a re-audit of every v336 cell.
**Path audited:** SAMPLE Snowdevil book + Customers marquee (mix grain / pending / empty-vs-zero / spend-ROAS ban). Spot-check: Overview still never paints spend/ROAS; LTV / Orders formulas were **not** touched by #72/#73 and still match the v336 locks.
**Scope guard:** did **not** redesign any tab. Allowed action taken: **one real formula fix** (weekly mix `total` after rounding — see §Fix) plus tests-only regression locks. No Fly. No Partner.

**Method:** static read of `demo-sample-desk.server.ts`, `sample-desk.server.ts`, `order-facts.server.ts` (`buildSampleOrderFactRows`), `customers-analytics.ts` (`bucketMixWeeks` / `mixSummary` / mix weekly), `CustomerMixChart.tsx`, `app.customers.tsx`, Overview sales-chart guards + `app._index.tsx` projection; plus focused vitest (Snowdevil depth, customers analytics/page, Overview spend ban, LTV/Orders honesty suites). Extends v336; does not reopen the refuse-list / pricing cells unless a #72/#73 edit could have broken them.

---

## Overall verdict: **PASS**

**18 / 18 delta checks PASS. Blockers: none.** One **FIX** shipped (§Fix) — a $1-per-week rounding drift on the #73 marquee tooltip/drill (`first-time + returning ≠ total` when both sides had .5-ish cents). One **NON-BLOCKER** from v336 §6.1 is still true (Overview payload still carries a dead per-day `spend` that never reaches a rendered prop). One **NON-BLOCKER** observation is new (§Notes): Customers scoreboard and the marquee read different windows/sources by design.

---

## Scoreboard (delta only)

| # | Area | Criterion | Verdict |
| ---: | --- | --- | :---: |
| D1 | SAMPLE | Book is 730 UTC days through today; first day on/before prior-year Jan 1 | **PASS** |
| D2 | SAMPLE | Overview MTD / QTD / YTD have real prior-year dollars at quarter + year boundaries | **PASS** |
| D3 | SAMPLE | `guestOrders` / `guestNetSales` on every generated day; guests ⊂ orders; ≥1 identified new | **PASS** |
| D4 | SAMPLE | Headcount: `new + returning + guest = orderCount` | **PASS** |
| D5 | SAMPLE | Dollars: `newCustomerNetSales + returning + guestNetSales = sales` (1¢) | **PASS** |
| D6 | SAMPLE | OrderFacts: guests carried from the book; `lifetimeOrders` null on guests; multi-order + whale | **PASS** |
| D7 | SAMPLE | Synthesized order amounts conserve each day's till (capped days still sum to `sales`) | **PASS** |
| D8 | SAMPLE | Spend on file every day; cash MER in 3.1–4.0× (not 4.4× theater); active channels only | **PASS** |
| D9 | SAMPLE | Reseed when `dayCount < 730` **or** no day with `guestOrders > 0` | **PASS** |
| D10 | Customers | `bucketMixWeeks` week = 1:1; month conserves new $ + returning $ | **PASS** |
| D11 | Customers | `mixSummary` window totals + dollar-weighted share; empty → `null` share, not 0% | **PASS** |
| D12 | Customers | Mix weekly: rounded first-time + returning **=** week total (cents lock) | **PASS** |
| D13 | Customers | Pending honesty — marquee never hidden; copy is "still loading — not $0" | **PASS** |
| D14 | Customers | Empty-vs-zero — `weeks < 2` is a ghost frame ("not zero"), never a painted $0 mix | **PASS** |
| D15 | Customers | Zero spend / ROAS / CPA / `0.00×` on the whole Customers tab | **PASS** |
| D16 | Customers | Guests are always first-time on the mix rail (never returning) | **PASS** |
| D17 | Overview | Chart days are sales (+ orders); payload `spend` never reaches a rendered prop; no ROAS hero | **PASS** |
| D18 | LTV / Orders | #72/#73 did not touch these files; existing honesty suites still green | **PASS** |

---

## SAMPLE #72 — 730-day book, guests, OrderFacts, spend, reseed

### D1–D2. Two-year book so YoY is never a missing prior year — PASS

`SAMPLE_BOOK_DAYS = 730`. `buildThreeYearSampleDesk` walks UTC days from `today − 729` through today. At year-end (`2026-12-31`) the first row is on/before `2025-01-01`, so YTD YoY is a full prior year — the 400-day book left QTD/YTD prior windows partial (the #72 reason). Locked at five boundary `now` dates (year start, Q1 end, Q3 start, mid-quarter, year end) in `sample-snowdevil-depth.test.ts`.

### D3–D5. Guest columns + new/returning/guest reconciliation — PASS

Per day:

- `guestOrders = min(orderCount − 1, round(orderCount × 0.12))` — never eats the last identified buyer.
- `guestNetSales = round(sales × guestOrders / orderCount)`.
- Identified split into new vs returning; `newCustomerNetSales` is a share of **identified** dollars only (guest $ stays out of the new/returning hero, matching `SalesResult`).
- Headcount: `newCustomers + returningCustomers + guestOrders === orderCount`.
- Dollars: `returningCustomerNetSales = max(0, totalSales − newCustomerNetSales − guestNetSales)` in `fetchSampleSales`, so new + returning + guest reconstructs the till.

Book-level guest share lands in a believable DTC tail (≫ 0, ≪ majority). Guest $ < 25% of till.

### D6–D7. Multi-order OrderFacts + guest carry — PASS

`buildSampleOrderFactRows` is pure. Guests are scaled onto the per-day cap (12) so the tail survives; identified buyers keep `lifetimeOrders`; guests stay `ORDER_FACT_GUEST_KEY` with `lifetimeOrders = null`. The 90-day window (`SAMPLE_ORDER_FACT_WINDOW_DAYS`) produces repeaters + at least one whale and feeds `buildCustomerAnalytics` / `computeCohortRollups`. `splitSalesVaried` preserves each day's till in cents (locked: summed OrderFact amounts `toBeCloseTo` that day's `sales`).

The 90-day OrderFact window vs the 730-day sales book is **intentional** (compact seed for Customers / LTV depth). It is not a missing-guest or missing-YoY hole — YoY reads `SampleSalesDay`, not OrderFacts.

### D8. Spend on file — PASS

Every generated day has paid spend on the active four (`meta` / `google` / `email` / `other`). Book MER ∈ (3.1, 4.0). SAMPLE spend stays on `SpendEntry` `source: "sample"` with the UTC-noon stamp. Overview still does not render it (D17).

### D9. Reseed when the parked book is short or guest-less — PASS

```463:481:app/app/lib/sample-desk.server.ts
export async function sampleDeskNeedsSeed(shopId: string): Promise<boolean> {
  // ...
  if (dayCount === 0) return true;
  if (dayCount < SAMPLE_BOOK_DAYS) return true;
  if (!guestProbe) return true;
  // Harbor leftover note / midnight stamp still force a rewrite.
}
```

A 400-day pre-#72 book, or a 730-day book with `guestOrders` still defaulted to 0, rewrites. The leftover-Harbor test that used `days = 400` as the "healthy" fixture was stale after #72 (it would have asserted "no reseed" on a short book). Updated to `SAMPLE_BOOK_DAYS` plus two new locks (short book / missing guests).

Source split is unchanged: SAMPLE wipe deletes `source: "sample"` only; `OrderFact` writer still throws on any source other than `shopify_order_v1` or `sample`.

---

## Customers #73 — marquee mix, pending, empty-vs-zero, spend ban

### D10–D12. Dollar conservation across grain — PASS

`bucketMixWeeks(weeks, "week")` is 1:1. Month grain groups by UTC month of the week's Monday and **re-sums** `newDollars` / `returningDollars` (no independent re-round of `total`). `mixSummary` is `Σ new + Σ returning`; `returningShareAvg` is `null` on empty (never 0%).

**Fix:** mix weekly used to `Math.round` new, returning, **and** `new+returning` independently. Two $10.40 sides became "$10 + $10 = $21" on the #73 tooltip/drill (`$ret of $total = share`). `total` is now `round(new) + round(ret)` and share is `returning / total` on those painted dollars. Cents fixture locks it.

### D13–D14. Pending + empty-vs-zero — PASS

The route always mounts `<CustomerMixChart … salesPending={metrics.salesPending} />` — never `{!salesPending ? <CustomerMixChart/> : null}` (the #73 diagnosis: pending deleted the marquee). `weeks.length < 2` paints `MixEmptyFrame`: pending copy is "Weekly returning dollars are still loading — **not $0**"; empty copy is "Needs at least two weeks … **not zero**." Ghost bars are `aria-hidden`. `sharePct(null)` is **—**. `emptyCustomerAnalytics()` keeps `available: false` and null clocks.

### D15–D16. No spend/ROAS; guests never returning — PASS

`customers-page.test.ts` scans the route, scoreboard, retention, value bands, whale table, mix chart, charts, analytics lib + loader, and scoreboard lib: no `Total ROAS`, `Spend Upload`, `Cash CAC`, `SpendExplorer`, `/app/spend`, `0.00×`. Mix construction:

```321:325:app/app/lib/customers-analytics.ts
    const isReturning =
      r.customerKey !== RETENTION_GUEST_KEY &&
      ms(r.orderedAt) > (firstByCustomer.get(r.customerKey) ?? Number.POSITIVE_INFINITY);
```

Guests always land in `newDollars`. Drill copy: "Order dollars only — no spend, no pixel."

---

## Spot-checks (untouched by #72/#73, still honest)

### D17. Overview still never renders spend/ROAS — PASS

`OverviewSalesChart` docstring is still order dollars + counts only. The route projects either `{ dateKey, sales, orders }` (explorer days) or `{ dateKey, sales }` (fallback) — never `days={salesDays}`. The v336 lock still holds. `overview-first-viewport.test.ts` still bans Spend Upload / Total ROAS / `mcfly-chart__spend-line` / `formatMer` / `0.00×` / `hasSpend` on the first viewport.

v336 §6.1 **non-blocker** still applies: the loader serializes per-day `spend` on `salesDays` and nothing reads it on Overview.

### D18. LTV / Orders formulas — PASS

`git diff e6776bd^..17028c3` is empty for `ltv*`, `orders*`, `overview*`, `Overview*`, `app._index.tsx`, `app.orders.tsx`, `app.ltv.tsx`. Re-ran `orders-intelligence`, `orders-scoreboard`, `ltv-depth`, `ltv-depth-sample`, `overview-sales-chart`, `customers-scoreboard`, `number-honesty`, `shopify-native-stats` — all green. AOV still null on 0 orders; LTV heat still nulls un-elapsed cells; guests still excluded from Orders frequency / identified splits.

---

## Notes (non-blockers)

1. **Two Customers number paths (by design).** Scoreboard / `ShopifyBookSection` use the **period** `SampleSalesDay` / live sales split. The marquee + retention/value/whale boards use a trailing **90-day OrderFact** window (`CUSTOMERS_ANALYTICS_WINDOW_DAYS`). SAMPLE OrderFacts are synthesized (68% new-share + whale bias), not a replay of the day's `newCustomers` counts. They must not be compared as if they shared one slicer. Both paths exclude guests from "returning."
2. **Overview dead `spend` field** — still the v336 §6.1 latent trap. Out of scope for this delta (no Overview owner change requested).

---

## Fix shipped

| File | Change | Why |
| --- | --- | --- |
| `app/app/lib/customers-analytics.ts` | Mix weekly `total` / share computed from rounded parts | Kill-risk #0 on the #73 marquee: tooltip/drill could show `$10 + $10 = $21` |
| `app/app/lib/customers-analytics.test.ts` | Cents conservation lock | The whole-dollar fixture could not see the drift |
| `app/app/lib/sample-desk-enable.test.ts` | Harbor fixture uses 730 days; locks short-book + missing-guest reseed | #72's `dayCount < 730` / `guestProbe` were untested; the old 400-day "healthy" fixture contradicted the new contract |
| `app/app/lib/sample-snowdevil-depth.test.ts` | Till-dollar conservation + per-day OrderFact amount sum | Lock D5 / D7 so a future seed edit cannot leak guest $ or break the till |

No UI redesign. No engine / LTV / Orders / Overview formula changes.

---

## Verification

- `cd app && npx vitest run` (focused):
  - `sample-snowdevil-depth` + `demo-sample-desk` + `sample-desk-enable`
  - `customers-analytics` + `customers-page`
  - `overview-first-viewport`
  - `orders-intelligence` + `orders-scoreboard` + `ltv-depth` + `ltv-depth-sample` + `overview-sales-chart` + `customers-scoreboard` + `number-honesty` + `shopify-native-stats`
- **14 files, 179 tests pass** (after prisma generate).
- New locks: mix cents conservation; SAMPLE till-dollar conservation; OrderFact amount conservation; reseed on `dayCount < 730`; reseed when guests missing.

## Not touched

Overview / Orders / Customers / Growth / LTV **UI** — audited for math, labels, and refuse-list only. No Fly deploy. No Partner Submit. Cursor merges/deploys separately.
