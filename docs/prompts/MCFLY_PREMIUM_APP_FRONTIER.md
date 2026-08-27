# Mcfly premium-app frontier prompt

Use this prompt for whole-desk product work after the Shopify resubmission gates
are closed. It is a **decision system**, not permission to add random charts.

## Mission

Make Mcfly Analytics feel unquestionably worth $39/store/month by turning exact
daily spend plus Shopify sales into a desk merchants can inspect, understand,
and act on without attribution theater.

Primary job:

> See ad spend next to sales, day by day.

The app wins when a merchant can:

1. Upload exact spend without an ad-account integration.
2. Understand where the budget went.
3. Drill from a period decision into the days and channels behind it.
4. Reproduce every number from Shopify sales plus their spend file.

## Locked product truth

- Views: **Sample data | Live data** only.
- One plan: 7-day full-access trial, then $39/store/month.
- No Free/Pro feature matrix.
- Total ROAS = Shopify Total Sales ÷ spend added by the merchant.
- No pixels, MTA, path credit, “true ROAS,” or causal channel ROAS.
- No Meta/Google OAuth inside Mcfly.
- Named offline spend (Billboard, Radio, Agency retainer) is first-class.
- Empty spend is $0; unattributed spend is never dropped.
- History begins Jan 1 of year−5.
- The Shopify plan picker opens in the top Admin frame.

## Global experience architecture

Every tab must answer four questions in this order:

1. **What period and data mode am I looking at?**
2. **What is the primary number or job on this tab?**
3. **What evidence produced it?**
4. **What should I do next?**

Every chart must have:

- A plain-English title.
- The exact date range.
- A visible formula or metric definition.
- Day/week/month/quarter drill-down where it adds meaning.
- Honest empty/loading/error states.
- A link to the source workflow (usually Upload Spend).

Do not add a chart merely because data exists. Add it only if it reduces a
merchant decision to fewer questions.

## Navigation

1. Overview
2. Upload Spend
3. Goals
4. Spend Allocation
5. LTV / Acquisition
6. Advanced
7. Settings

`Upload Spend` is the route `/app/spend`. Metric labels may still say “Spend.”

## Upload Spend

This is the product’s checkout-quality input flow.

### Primary first door: Download Template and Upload

- Default: **All history**, Jan 1 of year−5 through yesterday.
- Merchant picks the channels they use.
- Download a blank daily CSV.
- Fill one amount per channel per day.
- Upload the same file in the same panel.
- Preview day count, channel names, total, and date range before writing.
- Confirm replacements when day + channel already has non-zero spend.

### Helpers

2. Upload an Ads Manager CSV.
3. Add one bill and spread it across one day, 7 days, calendar month,
   quarter, half year, year, or a custom inclusive range.

Keep the shared Spend Explorer below entry. It shows the uploaded evidence next
to Shopify sales.

### Optional automation copy

At the bottom:

> Want a more automated routine? A merchant-paid tool such as SyncWith,
> Coupler, or Supermetrics can pull daily platform spend into the Mcfly
> template. Export the CSV and upload it here.

Then say why Mcfly keeps the file visible:

> Ad APIs and OAuth connections break—tokens expire, account access changes,
> and platform reports arrive late. A visible daily file can be inspected,
> corrected, and reproduced.

Never claim a partnership or “Works with” integration. Mcfly never receives
those tools’ OAuth tokens.

## Overview

One dominant decision:

- Total ROAS vs break-even.
- Sales, spend, and formula directly under it.
- Suppress 0.00× while sales are still loading.
- Explorer tied to the selected period.
- Click any channel/day to see evidence, not invented attribution.
- Links to Upload Spend, Spend Allocation, and LTV for deeper work.

## Spend Allocation

Answer:

1. Where did budget go this period?
2. Which windows coincided with the strongest Total ROAS?
3. How is recent pace changing?
4. What daily evidence sits behind the recommendation?

Required sections:

- Period snapshot.
- Spend-share mix (explicitly not channel ROAS).
- Shared Spend Explorer with route-local drill-down controls.
- Best windows and rolling pace.
- Rules-based shift suggestion only when sales/spend trust gates pass.

Reuse `SpendExplorer` and `buildSpendExplorerSeries`; never fork chart math.
Loader reads must remain facts-only and bounded. If performance degrades, fetch
one superset sales/spend window and slice in memory instead of querying twice.

## Goals

- Year target and implied spend ceiling.
- MTD/QTD/YTD pace.
- Drill into the days creating the gap.
- Never turn missing prior-year data into a false negative comparison.

## LTV / Acquisition

- Cash CAC, LTV·90d, and LTV:CAC.
- Cohort drill-down with coverage/backfill status.
- Opaque customer IDs only; no email CRM.
- Explain “average, not causal” once.

## Advanced

- Optional formulas only.
- Each module states its decision use and assumptions.
- No second scoreboard and no causal channel claims.
- Link back to the primary tab that supplies each input.

## Settings

- Total ROAS target.
- Contribution margin and live break-even preview.
- Sample data controls.
- Billing.
- Privacy/data-use summary.
- Contextual save bar and clear saved state.

## Technical rules

- React Router server loaders remain authenticated.
- Imports stay at module top.
- Exhaustive switches use a `never` default.
- Shared math lives in pure libraries with tests.
- Charts reuse one typed view contract.
- No unbounded Shopify GraphQL query.
- Sales-day facts and spend queries have explicit windows.
- No new dependencies without a demonstrated need.
- Native submit controls have at least a 44×44 CSS-pixel target.
- Preserve shop timezone semantics.

## Work loop

For each tab:

1. Read route, loader, pure math, tests, and CSS.
2. State the merchant decision in one sentence.
3. Inventory every number and its source.
4. Remove duplicate or decorative information.
5. Add the smallest useful drill-down.
6. Prove loading, empty, partial, error, Sample, and Live states.
7. Run source tests, full tests, typecheck, build, compliance, and browser smoke.
8. Deploy only after the gate passes.

## Acceptance standard

- A new merchant uploads five years of daily spend without support.
- A returning merchant updates yesterday in under 30 seconds.
- Every tab exposes the evidence behind its primary claim.
- Billboard remains Billboard everywhere.
- Allocation drill-down stays on `/app/allocation`.
- No tab invents data while Shopify sales are loading.
- No page says Free/Pro/Practice.
- No “Works with SyncWith” claim.
- The desk remains useful when every third-party ad API is unavailable.
