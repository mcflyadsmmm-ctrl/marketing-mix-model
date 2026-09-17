# Written accuracy audit — dense Fly pack v336 — 2026-09-17

**Lane:** kill-risk #0 (wrong numbers = uninstall). Read-mostly on `app/**`.
**Target:** branch `cursor/spend-trust-recurring` @ tip `f580ccb` (PR #70 merged: Overview chart craft on top of LTV depth pack #68 + Orders Black Clover).
**Path audited:** order-history / **SAMPLE Snowdevil** desk (Live parked behind `MCFLY_SAMPLE_ONLY`).
**Scope guard:** did **not** redesign any tab. Allowed action taken: **tests only** — one new regression lock (Overview payload spend never reaches a rendered prop). No formula/honesty code was changed because none of the audited behaviors had a real bug.
**No Fly. No Partner.** Cursor does not deploy or Submit.

**Method:** static read of the depth engines, format/honesty helpers, loaders, routes, and dense components; cross-checked against the SAMPLE↔Live source split and the refuse list in [`docs/ops/CRAFT_UNLOCK.md`](./CRAFT_UNLOCK.md); plus the full app + package vitest suites (Prisma generated, `@mcfly/mer-core|mer-engine|api-contract` built). Extends the PR #64-era audit ([`research/2026-09-16-sample-math-audit.md`](./research/2026-09-16-sample-math-audit.md)) to the new Overview / Orders / Customers / LTV depth.

---

## Overall verdict: **PASS**

**23 / 23 checks PASS. Blockers: none.** One **NON-BLOCKER** observation is logged (§6.1) — a dead `spend` field in the Overview loader payload that is never rendered; a new test now locks that it can never reach the chart.

---

## Scoreboard

| # | Area | Criterion | Verdict |
| ---: | --- | --- | :---: |
| 1 | Overview | Sales explorer — sales total, AOV = sales÷orders (null on 0 orders), cumulative sweep, vs-typical/vs-prior null when unknown | **PASS** |
| 2 | Overview | YoY cards — missing last year renders **—**, never $0; delta/pct blank when prior absent | **PASS** |
| 3 | Overview | Typical vs mean labeled (median rail vs average tick); axis money honesty | **PASS** |
| 4 | Orders | Intelligence aggregate — AOV, new-vs-returning $ share, discount depth = Σ\|disc\|÷gross | **PASS** |
| 5 | Orders | AOV tiers — nice-rounded bands, ≥8 orders floor, order/sales shares sum to 1 | **PASS** |
| 6 | Orders | Weekly ledger + vs-prior delta guarded on zero prior | **PASS** |
| 7 | Orders | Frequency distribution excludes guests | **PASS** |
| 8 | Orders | Ticket band / clock bar — shares sum to 1, null unless known | **PASS** |
| 9 | Customers | Returning **$** (not headcount rate), split null when unknown | **PASS** |
| 10 | Customers | Repurchase clock p25/median/p75, win-back = typical+15, Save-now = 1-order past win-back | **PASS** |
| 11 | Customers | Spend bands (customers + revenue), whale (5+ orders) recency, days-to-2nd withheld past window | **PASS** |
| 12 | Customers | New-vs-returning weekly mix — guests always first-time; dollar-weighted rail | **PASS** |
| 13 | LTV | Cohort spend-build curves — cumulative $/customer, fully-elapsed months only, monotonic | **PASS** |
| 14 | LTV | Retention heat — M0 = 100%, un-elapsed cells **null** (—), never fake 0% | **PASS** |
| 15 | LTV | Path LTV (first→second product) — ≥5 buyers, day90 only counts matured, live titles drop out | **PASS** |
| 16 | LTV | AOV / basket first-order tiers — repeat %, lifetime, 90-day value; ≥8 buyers | **PASS** |
| 17 | LTV | Whale recency — top decile by lifetime, ≥20 buyers, salesShare∈[0,1], recency buckets | **PASS** |
| 18 | Trust | SAMPLE ↔ Live cannot contaminate — source-scoped reads, `MCFLY_SAMPLE_ONLY` freeze, SAMPLE status chip | **PASS** |
| 19 | Trust | Empty-vs-zero honesty — missing spend/unknowns render **—**, not $0 | **PASS** |
| 20 | Trust | Shopify-sourced fields — Total Sales / order counts / AOV match desk claims; no invented ROAS | **PASS** |
| 21 | Trust | Refuse list — zero spend/ROAS/MER/upload on Overview | **PASS** |
| 22 | Trust | Refuse list — no pixels / MTA / true ROAS / Email·Klaviyo CRM on the Shopify five | **PASS** |
| 23 | Trust | $39 / 7-day claims not contradicted in-app; one plan (no Free) | **PASS** |

---

## 1. Overview sales explorer — PASS

- **AOV** is order-honest: `overviewAov(sales, orders)` returns `null` when `orders <= 0` or inputs non-finite — never `sales/0`.

```146:155:app/app/lib/overview-sales-chart.ts
export function overviewAov(
  sales: number,
  orders: number,
): number | null {
  if (!Number.isFinite(sales) || !Number.isFinite(orders) || orders <= 0) {
    return null;
  }
  return sales / orders;
}
```

- **Cumulative** is a plain running sum (`overviewCumulative`, `:168`). **Typical** is a true median, `null` on empty (`overviewMedian`, `:173`). **Vs-typical** returns `null` when typical is unknown/≤0 (`overviewVsTypical`, `:187`), so a bar never invents a "+$0 vs typical."
- **Vs-prior** is divide-by-zero safe: `overviewDeltaPct` returns `null` when `prior <= 0` (`:392`), so the KPI strip blanks instead of painting `+∞%`. In the chart, prior is only trusted with ≥60% of the range's days present (`OverviewSalesChart.tsx:257`).
- The chart docstring is explicit that it is **order dollars + order counts only — no ad cost, no efficiency ratios, no spend overlay** (`OverviewSalesChart.tsx:94`), and the drill copy says "Grain and range live on the chart — **never spend**" (`:561`).
- Verified by `overview-sales-chart.test.ts` (14) + `overview-first-viewport.test.ts` (19).

## 2. Overview YoY cards — PASS

- Missing last-year window is honest: `buildOverviewYoyCards` sets `missingPrior` and forces `delta = null`, `yoySalesPct = null` when `priorSales == null` (`overview-yoy.ts:154`); the copy is "Same days last year not on file yet … **not $0**" (`OVERVIEW_YOY_MISSING`, `:14`). Pending sales use `OVERVIEW_YOY_PENDING` "still loading — not $0" (`:18`).
- Zone/pct helpers return `null`/blank on empty prior (`overviewYoyZoneLabel :114`, `overviewYoyDeltaPct :132`).

## 3. Typical vs mean, axis honesty — PASS

- Orders hero leads with **median** ticket and captions the **mean** separately: "Average order {mean} — Shopify Analytics uses the average" (`orders-scoreboard.ts:164`). Ticket band marks p25/median(Typical)/p75 + a right-skew **Average** tick (`:404`).
- Axis money is currency-honest: `overviewCompactMoney` paints **—** for missing/invalid shop currency, never a silent USD (`overview-sales-chart.ts:272`), mirroring `formatCurrency` (`mer-format.ts:5`).

## 4–8. Orders intelligence — PASS

- **AOV** null-guarded and **discount depth** is `Σ|discount| ÷ gross`, `gross = sales + Σ|discount|`:

```139:148:app/app/lib/orders-intelligence.ts
  return {
    orders,
    sales,
    aov: orders > 0 ? sales / orders : null,
    newOrders,
    returningOrders,
    newSalesShare: sales > 0 ? newSales / sales : null,
    discountDepth: gross > 0 ? discountTotal / gross : null,
  };
```

- **New vs returning** is by first identified order per customer; **guests never count as returning** (guest keys skipped, `:122`, `:357`).
- **AOV tiers** need ≥8 orders (else `[]`), bands are nice-rounded on the p5–p95 spread, and `orderShare`/`salesShare` divide by the true totals so they sum to 1 (`buildOrdersAovTiers :266`, shares `:300`).
- **Weekly ledger** is Monday-start with AOV, discount depth, and an orders vs-prior-week delta that is `null` on the first week / zero prior (`buildOrdersWeeklyRows :322`, `ordersIntelDelta :170`).
- **Ticket band** is `null` until 5 orders and **clock bar** returns `null` unless both gross and net are known, with `product + shiptax + returns = gross` (shares sum to 1) (`orders-scoreboard.ts:404`, `:451`).
- Verified by `orders-intelligence.test.ts` (10) + `orders-scoreboard.test.ts` (23).

## 9–12. Customers — PASS

- **Returning is dollars, not a rate.** Hero uses `customersReturningDollars` (dollars or **—**, never headcount) with the standing contrast "Shopify Analytics Overview shows a returning-customer rate — headcount. This tab is returning dollars…" (`customers-scoreboard.ts:14`, `:46`). Split is `null` when unknown/guest-only (`customerDollarSplit :64`).
- **Repurchase clock** = p25 / median / p75 of first→second gaps (≥5 gaps required); **win-back day** = `median + 15`; **Save-now** counts one-order buyers already past the win-back day:

```337:348:app/app/lib/customers-analytics.ts
  const typical = enoughGaps ? medianOf(gaps) : null;
  const winBackDay = typical != null ? Math.round(typical) + 15 : null;

  let saveNowOneOrder = 0;
  if (winBackDay != null) {
    for (const rec of byCustomer.values()) {
      if (rec.times.length !== 1) continue;
      const daysSince = (windowEndMs - rec.times[0]!) / DAY_MS;
      if (daysSince > winBackDay) saveNowOneOrder += 1;
    }
  }
```

- **Spend bands** carry customers **and** revenue per band (`spendBands :269`); **whale** = 5+ orders (`WHALE_MIN_ORDERS :152`) bucketed by days-since-last (`:220`). Days-to-2nd and whale-recency buckets **past the observed window are withheld**, with a `truncatedAt` marker (`:277`, `:326`) — never faked to a year we cannot see.
- **Weekly mix** marks an order returning only when it lands after the buyer's first on file; **guests are always first-time** (`:298`); dollar-weighted `mixReturningShareAvg` is `null` on no dollars (`:324`).
- Cadence shares gate on eligibility: `everRepeatShare`/`thirdPlusShare` need ≥8 buyers; `within30/60Share` need ≥8 eligible (`:350`). Verified by `customers-analytics.test.ts` (11) + `customers-scoreboard.test.ts` (13) + `growth-comeback.test.ts` (7).

## 13–17. LTV depth — PASS

- **Cohort curves** plot cumulative dollars per customer, only for month offsets that have **fully elapsed** as of `asOf` (`lastFull = min(maxOffset, elapsed - 1)`), running sum ÷ member count — monotonic, honest-short, never a sealed $0 tail:

```215:229:app/app/lib/ltv-depth.ts
    const elapsed = monthsSince(monthStartUtc(cohortMonth), asOf);
    const lastFull = Math.min(maxOffset, elapsed - 1);
    if (lastFull < CURVE_MIN_POINTS - 1) continue;
    const points: CohortCurvePoint[] = [];
    let running = 0;
    for (let k = 0; k <= lastFull; k += 1) {
      let windowSum = 0;
      for (const c of members) windowSum += c.spendByOffset.get(k) ?? 0;
      running += windowSum;
      const cumPerCustomer = running / members.length;
      points.push({ offset: k, cumPerCustomer });
      if (cumPerCustomer > maxValue) maxValue = cumPerCustomer;
    }
```

- **Retention heat**: M0 is `1` (100%) by definition; any offset beyond `elapsed - 1` is `null` (renders **—**), so the young bottom-right stays blank, never 0% (`retentionHeat :283`).
- **Path LTV** needs ≥5 buyers per first→second product journey; `day90Ltv` only averages buyers whose first order has had a full 90 days (`day90N`) so it is not diluted by immature customers; sorted by buyers then lifetime (`pathLtv :323`).
- **AOV / basket tiers** bucket the **first** order size → repeat %, lifetime net, and matured 90-day value, ≥8 buyers per band (`aovTiers :453`, `basketTiers :475`, `summarizeTier :414`).
- **Whale recency** takes the top decile by lifetime dollars, requires ≥20 identified buyers, and reports `salesShare = whaleLifetime / totalLifetime ∈ [0,1]`, `activeShare`, median recency, and buckets (`whaleRecency :536`).
- **Live titles drop out honestly:** the loader maps live OrderFacts with `product: null`, so `productsKnown` is false and product journeys are empty rather than guessed:

```50:62:app/app/lib/ltv-depth-page.server.ts
  const orders: DepthOrder[] = [];
  for (const row of rows) {
    if (!row.customerKey || row.customerKey === ORDER_FACT_GUEST_KEY) continue;
    orders.push({
      customerKey: row.customerKey,
      orderedAt: row.orderedAt,
      amount: Number.isFinite(row.amount) ? row.amount : 0,
      units: row.unitCount != null && row.unitCount > 0 ? row.unitCount : 1,
      // Live OrderFacts store units only — never SKU or title (Level 1).
      product: null,
    });
  }
```

- Contribution LTV = cohort avg revenue × margin, `null` when either is unknown; its caption refuses to imply cohort windows and this-period spend share one slicer, or "true ROAS" / email CRM (`contrib-ltv.ts:33`, `ltvWindowCaption :55`). Verified by `ltv-depth.test.ts` (12) + `ltv-depth-sample.test.ts` (8) + `ltv-depth-route.test.ts` (10) + `contrib-ltv.test.ts` (5).

## 18. SAMPLE ↔ Live cannot contaminate — PASS

- **Source-scoped storage.** Sample spend rows carry `source: "sample"`; live reads exclude them; every SAMPLE wipe deletes only `source: "sample"` (`sample-desk.server.ts:141`, `:212`, `:456`). Order/Cohort depth is split by `OrderFact.source` — `"shopify_order_v1"` for live, `"sample"` for the Snowdevil book — and each recompute/read is source-pinned; the writer throws on any other source:

```415:418:app/app/lib/order-facts.server.ts
  if (source !== ORDER_FACT_SOURCE && source !== "sample") {
    throw new Error(`OrderFact source must be ${ORDER_FACT_SOURCE} or sample`);
  }
```

- **Freeze while Live is parked.** `MCFLY_SAMPLE_ONLY=true|1` forces Sample on and no-ops every "use-real" / "hide-sample-preview" / disable path (`isSampleOnlyFreeze :18`, `getSampleDeskEnabled :23`, `applySampleDeskIntent :99`, `setSampleDeskEnabled :71`). LTV depth reads the deterministic Snowdevil generator on SAMPLE and real `ORDER_FACT_SOURCE` rows on Live — never mixed (`ltv-depth-page.server.ts:38`).
- **SAMPLE is labeled, not silent.** With Sample on, `DataModeBar` renders a `role="status"` SAMPLE strip ("Live is parked until launch" under the freeze) and Overview stamps a **SAMPLE** trust chip (`DataModeBar.tsx:24`, `app._index.tsx:615`). Snowdevil dollars are example data, never presented as this shop's live orders. Locked by `sample-desk-enable.test.ts`, `demo-sample-desk.test.ts`, `sample-live-handoff.test.ts`.

## 19. Empty-vs-zero honesty — PASS

- `formatCurrency` / `formatMoneyOrDash` paint **—** for `null`/`NaN`/invalid currency (`mer-format.ts:5`, `:21`); `formatMer(null) = "—"` (`:39`).
- Missing spend never becomes `0×`: `formatTotalRoasEquation` returns `null` unless `spend > 0`, and holds the ratio (spend-saved-sales-loading) when sales are pending (`number-honesty.ts:60`). The honesty corpus says "Empty spend is not 0× Total ROAS" and "unknown is not $0, so Total ROAS waits instead of showing 0×" (`:35`, `:42`).
- Every depth helper withholds rather than fakes: medians/tiers/shares return `null`/`[]`/drop 0% rows below their evidence floors (cited throughout §1–§17).

## 20. Shopify-sourced fields — PASS

- Order counts, Total Sales (after returns), and AOV all derive from Shopify order rows in the window; AOV is `sales ÷ orders` at every layer (Overview `overviewAov`, Orders `aggregateOrderRows.aov`, hero median vs mean). No pixel/session/path-credit or "true ROAS" value is computed anywhere on the Shopify five — the engine floor even refuses a ratio without entered spend:

```77:83:packages/mer-engine/src/index.ts
export function computeMer(sales: number, spend: number): number | null {
  if (!Number.isFinite(sales) || !Number.isFinite(spend) || spend <= 0) {
    return null;
  }
  const mer = sales / spend;
  return Number.isFinite(mer) ? mer : null;
}
```

- Refusals are stated as refusals, not claims: "This number is from Shopify orders in this window — not a platform pixel" (`OrdersScoreboard.tsx:52`, `ShopifyBookSection.tsx:134`), "Online vs POS — not which ad sent them" (`orders-scoreboard.ts:325`). Guarded by `desk-claims-guard.test.ts`.

## 21. Overview refuse list — PASS

- The Overview loader passes `totalSpend: 0, mer: null` into the share text and mounts **no** `MarketingSnapSection` / `SpendExplorer`; the chart receives a **sales-only** projection:

```483:485:app/app/routes/app._index.tsx
    totalSales: totalSalesDisplay,
    totalSpend: 0,
    mer: null,
```

- `overview-first-viewport.test.ts` scans a corpus (viewport + lib + route + chart + YoY + phone fixtures) and bans `Spend Upload`, `Total ROAS`, `Edit spend`, `Spend is optional`, `QuietSpendDoor`, plus `mcfly-chart__spend-line`, `formatMer`, `0.00×`, `totalRoas`, `hasSpend`.
- **New lock added this audit** (see §6.1): the route hands the chart `salesDays.map(({ dateKey, sales }) => ({ dateKey, sales }))` and never `days={salesDays}`, so the payload's per-day `spend` can never reach a rendered prop.

## 22. No pixels / CRM on the Shopify five — PASS

- `pixel` / `multi-touch` / `true ROAS` appear **only** as refusals (privacy page, `number-honesty.ts:3`, `mer-trust.ts:3`, `ltv-depth.ts:9`), locked by `desk-claims-guard.test.ts` and `number-honesty.test.ts`. Email/`Klaviyo`/`Mailchimp` appear **only** on the Spend import pages as a **cash-cost** channel label — explicitly "note plan + usage cash for the period (**not attributed revenue**)" (`spend-export-guides.ts:311`) — never as a CRM or attribution source on Overview/Orders/Customers/Growth/LTV. Growth/Customers/LTV copy repeatedly says "order history … not an email list" (`growth-comeback.ts:139`, `CustomersScoreboard.tsx:52`).

## 23. Pricing claims not contradicted — PASS

- One plan, `$39`, `EVERY_30_DAYS`, `trialDays: 7`, locked by test:

```40:42:app/app/lib/billing-flag.test.ts
    expect(PRO_PLAN.amount).toBe(39);
    expect(PRO_PLAN.interval).toBe("EVERY_30_DAYS");
    expect(PRO_PLAN.trialDays).toBe(7);
```

- In-app copy matches: "$39 per store / month after the 7-day trial" (`billing.server.ts:188`). No Free plan is offered (single `PRO_PLAN`). Matches [`docs/BILLING_TIERS.md`].

---

## 6.1 Non-blocker observation (logged, not a FAIL)

The Overview loader builds `spendByDay` and includes a per-day `spend` value in the serialized `salesDays` payload (`app/app/routes/app._index.tsx:255`, `:370`). **It is never rendered** — the chart is fed a sales-only projection (`:664`) and no component reads the `spend` field — so it is **not** a labeling/honesty failure (it is the merchant's own spend, never painted as a fake $0 or a ROAS). It is untidy and a latent trap: a future edit that passed the raw `salesDays` to a chart could leak spend onto Overview.

**Action taken (test-only, no behavior change):** added a regression lock in `overview-first-viewport.test.ts` asserting the route projects the chart's days to `{ dateKey, sales }` and never passes `days={salesDays}`. Removing the dead field from the payload is a safe follow-up for the Overview owner but is out of this read-mostly audit's scope.

---

## Fix shipped

| File | Change | Why |
| --- | --- | --- |
| `app/app/lib/overview-first-viewport.test.ts` | +1 test: Overview route feeds the chart a sales-only projection; `days={salesDays}` banned | Lock the §6.1 invariant so the dead payload `spend` can never reach a rendered Overview prop |

No engine, helper, loader, or component formula/honesty code was changed — none of the 23 audited behaviors had a real bug.

## Verification

- `cd app && npx vitest run` → **120 files, 1224 tests pass** (was 1223; +1 from the lock) after `prisma generate` + building the three TS packages.
- Critical-formula subset (`overview-sales-chart`, `overview-yoy`, `orders-intelligence`, `orders-scoreboard`, `customers-analytics`, `customers-scoreboard`, `growth-comeback`, `ltv-depth`, `ltv-depth-sample`, `ltv-depth-route`, `contrib-ltv`, `number-honesty`, `mer-format`, `snowdevil-math-smoke`, `overview-first-viewport`) → **156 → 157 tests pass**.
- `npm run test --workspace=@mcfly/mer-core --workspace=@mcfly/mer-engine` → **41 + 16 pass** (MER floor `computeMer(_, ≤0) = null`).

## Not touched (other cooks)

Overview / Orders / Customers / Growth / LTV **UI** — audited for math, labels, and refuse-list only; no redesign, no Fly, no Partner.
