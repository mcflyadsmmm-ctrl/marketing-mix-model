# Snowdevil SAMPLE math + honesty audit — 2026-09-16

**Lane:** kill-risk #0 (wrong numbers). Read-mostly on `app/**`. Branch `cursor/spend-trust-recurring` (audited on top; PR from `cursor/sample-math-audit-28d7`).
**Scope guard:** Did **not** redesign Overview / Orders / Customers / Growth / LTV UI (other cooks own those). Allowed action taken: **tests only** (hardened one regression lock). No formula/honesty bug was found that needed a code fix.
**No Fly.** Cursor does not deploy or Partner-submit.

**Method:** static read of `lib/*.server.ts`, format helpers, routes, and components; plus **empirical** exercise of the SAMPLE generator (`buildThreeYearSampleDesk`) across a full year of `now` dates; plus the full app + package vitest suites with Prisma generated and workspace packages built.

**Verdict: 7 / 7 PASS.** The desk math and honesty hold. One regression **lock** (not the math) was thin — the MTD-MER smoke test pinned a single hard-coded date — so it is hardened here.

---

## Scoreboard

| # | Criterion | Verdict | One-line proof |
| ---: | --- | :---: | --- |
| 1 | Total ROAS = sales ÷ entered spend; empty is **—** not `0.00×` | **PASS** | `computeMer` returns `null` for spend ≤ 0; `formatMer(null) = "—"`; ROAS/Spend gate on `hasSpend` |
| 2 | No SAMPLE / Live contamination | **PASS** | Sample spend `source="sample"` + UTC-noon stamp; live reads `NOT source=sample`; every loader splits `sampleOnly` vs `excludeSample` |
| 3 | Empty vs zero honesty | **PASS** | "Empty spend is not 0×", "no spend entered, not a certified $0", "deleted day stays $0", salesPending "unknown is not $0" |
| 4 | AOV / typical = median vs mean labeled correctly | **PASS** | Typical order = median with sub "Average order … Shopify Analytics uses the average"; Average row = mean with "Typical (median) …" |
| 5 | Returning **$** vs rate | **PASS** | Customers hero "Sales from returning customers" / "dollars, not headcount" vs Shopify "returning-customer rate (headcount)" |
| 6 | Overview shows **zero** spend doors (regression lock) | **PASS** | Overview passes `totalSpend: 0`, `mer: null`; no `MarketingSnapSection`; test bans Spend/ROAS copy |
| 7 | MTD MER ~3.1–4.0 on SAMPLE | **PASS** | Empirically 3.381–3.793 across every day of a full year; lock hardened to walk 36 month-day checkpoints |

---

## 1. Total ROAS = sales ÷ entered spend; empty is — not 0.00× — PASS

- Engine floor: `computeMer(sales, spend)` returns `null` when `spend <= 0` or inputs non-finite (`packages/mer-engine/src/index.ts:77`). `formatMer(null)` → `"—"` (`app/app/lib/mer-format.ts:39`).
- Total ROAS page paints the ratio **only** when spend is on file: `roasValue = hasSpend && !salesPending && mer != null ? formatMer(mer)+"×" : "—"` (`app/app/routes/app.roas.tsx:246`). Same guard in `MarketingSnapSection` (`app/app/components/MarketingSnapSection.tsx:57`).
- Equation builder refuses to paint a ratio without spend: `formatTotalRoasEquation` returns `null` when `!(spend > 0)` (`app/app/lib/number-honesty.ts:68`).
- Pending sales (spend in, closed sales not landed) hold the ratio instead of dividing by unknown: `mer = salesPending ? null : computeMer(...)` (`app/app/lib/mer-dashboard.server.ts:1196`), with copy "unknown is not $0, so Total ROAS waits instead of showing 0×" (`number-honesty.ts:43`).
- Guarded across the codebase by ~20 `not.toContain("0.00×")` assertions (marketing-spend-room, overview-first-viewport, cash-close, mer-control, number-honesty, easy-add-spend, shopify-book-visible, desk-phone-layout, snowdevil-math-smoke, …).

## 2. No SAMPLE / Live contamination — PASS

- Sample spend rows carry `source: "sample"` and a **UTC-noon** period stamp so they never collide with live CSV rows (UTC-midnight) on the `SpendEntry @@unique(...)` key (`app/app/lib/demo-sample-desk.server.ts:198`, `sample-desk.server.ts:305`).
- Every spend read is source-scoped: `useSampleDesk ? { sampleOnly } : { excludeSample }` → `source: "sample"` vs `NOT: { source: "sample" }` (`mer-dashboard.server.ts:1094`, `loadSpendEntries`, `getSpendPeriodCoverage`, `buildDailyRowsForWindow`).
- Sales are source-split too: sample desk uses `fetchSampleSales` (SampleSalesDay); live uses `loadDeskSalesForPeriod` (SalesDayFact). OrderFact/CohortFact depth is split by `source` ("sample" vs `shopify_order_v1`) — `loadOrderDepthRows`, `recomputeCohortFacts`, `getCohortFacts` (`order-facts.server.ts`).
- Re-seed self-heals a stale/contaminating book: `sampleDeskNeedsSeed` returns true if the spend note ≠ `sample:snowdevil-1` or the stamp is not UTC-noon (`sample-desk.server.ts:432`).
- `resolveHonestSales` zeroes mock sales when sample desk is OFF so fabricated revenue can't reach live Cash MER (`mer-trust.ts:203`).
- SAMPLE OrderFacts are derived from the same SampleSalesDay book (daily sales split across order count), so Orders/Customers depth is internally consistent with the sales book — no cross-book drift (`order-facts.server.ts:1166`).

## 3. Empty vs zero honesty — PASS

- Spend page: "Empty spend is not a certified $0 — add a day. A deleted day stays $0. Empty spend is never 0×" (`app/app/routes/app.spend.tsx:618`); empty Live status "No spend entered, not a certified $0".
- `formatMoneyOrDash(null|NaN)` → `"—"` (`mer-format.ts:21`); unknown/invalid shop currency → `"—"`, never a silent USD `$` (`mer-format.ts:5`).
- `salesPending` vs genuine `$0`: unknown sales withhold KPIs ("Still loading — not $0") while complete-coverage $0 stays honest (`sales-pending.ts`, `overviewGreetingPending`).
- Depth stats withhold rather than fake a 0 (e.g. `medianDailySales` null until 5 days with sales; `weekendSalesShare` null until 5 days; shares that round to 0% are omitted) (`shopify-depth-stats.ts`, `ShopifyBookSection.hasShare`).

## 4. AOV / typical (median vs mean) labeled correctly — PASS

- `medianOf` / `percentileOf` are true order-statistics (`shopify-depth-stats.ts:171`). `medianAov` = middle order; `meanAov` = mean; both returned separately.
- Orders/Customers hero: **Typical order = median**, sub "Average order {mean} — Shopify Analytics uses the average" (`ShopifyBookSection.periodHero:223`). Companion row "Average order" = mean, sub "Typical (median) {median} — Shopify Analytics uses the average" (`periodRows:369`).
- Overview peek: labels the card "Median" when median exists, and only falls back to the "AOV" label with "Average order value when median is not available yet" (`OverviewFirstViewport.tsx:104`, `:214`). Overview also passes a distinct `meanAov` alongside `typicalOrder` (`app._index.tsx:602`).
- Route lede is explicit: "the typical order (median) vs the average" (`app.orders.tsx:97`).

## 5. Returning $ vs rate — PASS

- `shopifyNativePeriodStats` computes `returningSales` (dollars) and `returningSalesShare = returning / (new + returning)` — never a headcount rate (`shopify-native-stats.ts:92`).
- Customers page hero "Returning dollars", ShareBars "New vs returning dollars", detail "Shopify Analytics Overview uses a returning-customer rate (headcount)" (`app.customers.tsx:15,110`). Buyers hero "dollars, not headcount" (`ShopifyBookSection.buyersHero:246`).
- Overview "Returning" peek shows dollars with foot "Dollars, not headcount." and share as a secondary "% of sales" (`OverviewFirstViewport.tsx:234`). `overviewReturningCompactDollars` returns dollars-or-null, never a count (locked by test).
- SAMPLE returning $ is consistent: `returningCustomerNetSales = max(0, totalSales − newCustomerNetSales)` (`sample-desk.server.ts:384`), and `new + returning = total`, so the share is `returning/total`.

## 6. Overview shows zero spend doors — PASS (regression lock present)

- Overview loader never loads spend into the hero: `formatOverviewShareText({ totalSpend: 0, mer: null, breakEvenMer: null })` (`app._index.tsx:448`); no ROAS/Total-ROAS tile is rendered.
- Overview does **not** mount `MarketingSnapSection`; it renders YoY cards → order peeks → sales chart only.
- Locked by `overview-first-viewport.test.ts`: "never paints spend, upload, or ROAS copy on Overview" bans `Spend Upload`, `Total ROAS`, `Edit spend`, `Spend is optional`, `QuietSpendDoor`, and asserts `not.toContain("<MarketingSnapSection")` / `not.toContain("<SpendExplorer")` (`overview-first-viewport.test.ts:141,226`). Matches CRAFT_UNLOCK "zero spend/ROAS on Overview".

## 7. MTD MER ~3.1–4.0 on SAMPLE — PASS (lock hardened)

Empirical run of `buildThreeYearSampleDesk({ targetMer: 3.5 })` across **400 consecutive `now` dates**:

| Measure | Result |
| --- | --- |
| MTD MER range (every day of a full year) | **3.381 – 3.793** (always inside 3.1–4.0) |
| Single-day MER range | 3.366 – 3.804 |
| MTD AOV range | $505 – $687 (Snowdevil board territory) |
| Zero-spend days in the 400-day book | **0** |
| Extreme-MER days (>4.5 or <2.8) | **0** |
| Whole-book MER | 3.581 (target 3.5) |

Daily spend = `sales / 3.5 × (0.92…1.04)`, so daily MER = `3.5 / (0.92…1.04)` ≈ 3.36–3.80; the last-channel remainder is `max(0, totalSpend − allocated)`, so per-day spend is preserved and never silently zeroed in practice (`demo-sample-desk.server.ts:141,168`).

**Gap found (lock, not math):** `snowdevil-math-smoke.test.ts` only asserted the MTD band for one hard-coded date (`2026-09-16`). A future generator tweak (season factor, spend jitter) could push another month's MTD out of band while that single-date test stayed green. **Fix:** added two locks — one walks 36 month-day checkpoints (every month × day 1/15/28) asserting MTD MER ∈ (3.1, 4.0) and AOV ∈ ($400, $900); one asserts every book day carries spend and stays in-band, with whole-book MER ∈ (3.3, 3.8). Test-only; no formula changed.

---

## Fix shipped

| File | Change | Why |
| --- | --- | --- |
| `app/app/lib/snowdevil-math-smoke.test.ts` | +2 tests: multi-date MTD-MER lock + per-day spend/MER band lock | Criterion 7's regression lock was a single date; harden it so seasonal drift can't slip through |

No `lib/*.server.ts` or format-helper formula/honesty change was required — none of the 7 audited behaviors had a real bug.

## Not touched (other cooks)

Overview / Orders / Customers / Growth / LTV **UI** — audited for math/labels only, no redesign.

## Verification

- `cd app && npx vitest run` → **110 files, 1090 tests pass** (was 1088; +2 from the hardening) after `prisma generate` + building `@mcfly/mer-core|mer-engine|api-contract`.
- `npm run test --workspace=@mcfly/mer-core --workspace=@mcfly/mer-engine` → 41 + 16 pass.
- Environment note for the next agent: fresh clone needs `npm install`, `cd app && npx prisma generate`, and `npm run build` for the three TS packages before `app` vitest is green (unrelated to this audit).
