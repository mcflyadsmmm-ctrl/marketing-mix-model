# Customers marquee — why it didn't dominate Admin QA (2026-09-17)

**Tip:** `cursor/spend-trust-recurring` @ db46d14 (accuracy #71 merged).
**Founder call:** Customers felt lazy — a stack of KPI cards, not an interactive,
beautiful, explorer-first tab. Enterprise bar: multi-million-dollar Shopify
operators must love this tab.

## What QA actually saw

The five deep charts (`CustomerMixChart`, `CustomerRetentionBoard`,
`CustomerValueBands`, `CustomerWhaleTable`, `CustomerConcentrationChart`) were
**present and wired**, but they never led the frame. Root causes, in order of
blame:

1. **Ordering buried the marquee.** `app/app/routes/app.customers.tsx` rendered
   `CustomersScoreboard` first — a full soft card (returning-share gauge + a
   six-tile grid + three mix bars). The interactive `CustomerMixChart` came
   *second*. So the above-the-fold screenshot always led with a KPI card wall;
   the marquee sat below the fold and read as "one more card."

2. **The pending gate deleted it.** The route wrapped the chart in
   `{!metrics.salesPending ? <CustomerMixChart/> : null}`. During the pending
   window (common in QA of a fresh/rehydrating shop) the marquee vanished
   entirely, leaving only card walls (`CustomersScoreboard` + `ShopifyBookSection`).

3. **Empty states were bare, not designed.** `CustomerMixChart` returned a plain
   text note when `analytics.mixWeekly.length < 2`, and `analytics.available`
   (`identifiedBuyers > 0`) gated Retention / ValueBands / Whale to bare "—" and
   short notes. On a fresh live shop those branches fire, so new-install QA saw
   sentences where a chart should be. (Confirmed *not* a data bug for SAMPLE:
   `seedSampleOrderFacts` seeds ~90 days of identified buyers, so SAMPLE QA does
   populate every chart — the failure was layout + empty-state craft, not data.)

4. **Craft gap vs the merged Overview explorer.** The old marquee was a static
   chart with axis text baked into the SVG (type shrinks with the viewBox on a
   390–430px Admin iframe), no dark floating tooltip, no KPI strip, no grain or
   controls. Next to the far richer Overview sales explorer (PR #70) it looked
   unfinished — so even when visible it didn't *dominate*.

## Fix shipped in this PR

- **Explorer-first order.** The marquee now renders **above** the scoreboard and
  is never hidden on pending — it owns the top of the tab.
- **Overview-grade craft reused.** `CustomerMixChart` now wears the same scaffold
  as `OverviewSalesChart`: serif masthead + lede, a live readout, a KPI strip, an
  aspect-boxed plot with **crisp HTML axis overlays** (no viewBox-shrinking text),
  a **dark floating tooltip** that rides the hovered column, a guide line, and a
  dollar-weighted average-share rail. Stacked first-time + returning $ bars on the
  left axis, returning-share line on the right axis.
- **Weekly / Monthly grain toggle** powered by pure, unit-tested bucketing
  (`bucketMixWeeks` + `mixSummary` in `customers-analytics.ts`).
- **Designed guest-empty.** `weeks < 2` (or pending) now paints a *ghosted*
  marquee — faint placeholder columns + a dotted share rail + honest copy
  ("…not $0 / not zero. Snowdevil SAMPLE fills this in…") — never a bare em dash.
- **Premium grain wash** over the marquee (a faint fractal-noise film) so the
  dense chart reads crafted, not flat.

## Guardrails held

Order-history only. Zero spend / ROAS / CPA / Email on the whole tab (the
`customers-page.test.ts` spend/ROAS ban still passes across every Customers file).
SAMPLE stays labeled; nothing is faked to `$0` or `0%`.

## Verify

- `app/app/lib/customers-page.test.ts` — marquee leads the order; explorer
  scaffold (serif, stats, tooltip, axis overlays); grain toggle; designed empty;
  grain wash in CSS.
- `app/app/lib/customers-analytics.test.ts` — `bucketMixWeeks` / `mixSummary`
  conserve dollars across grains and stay honest on empty.
- Full app suite green (1232 tests); typecheck + build clean.
