# Friction autopsy — R3 (uninstall / TTFV / honesty killers)

**Lane:** R3 research · read-only code audit of `redesign/enterprise-desk` · 2026-09-08
**Religion:** Total ROAS = Shopify Total Sales after returns ÷ entered ad spend. No pixels / MTA / connector zoo.
**Money frame:** 7-day trial → **$39**/store/month. Reviews are **0**. App Store Ads stay **NO**.
**Companions:** [`../UNINSTALL_RISKS.md`](../UNINSTALL_RISKS.md) · [`../ops/money/HOSTILE_WAVE6_BACKLOG.md`](../ops/money/HOSTILE_WAVE6_BACKLOG.md) · [`../ops/money/SMOKE_APP_STORE_ADS.md`](../ops/money/SMOKE_APP_STORE_ADS.md) · [`../REJECT_RISK_AUDIT.md`](../REJECT_RISK_AUDIT.md) · [`../ops/money/WAVE7C_EXPORT_LEDGER_SPEC.md`](../ops/money/WAVE7C_EXPORT_LEDGER_SPEC.md)

**Supersedes the 2026-09-09 draft of this file (`c271ac9`).** That draft's ranking was built from the backlog documents; this pass re-read the code. Four of its rows are now stamped **CLOSED** with file evidence in §3 (SAMPLE days in live coverage, ReviewAsk one-shot, ReviewAsk vs `periodExceedsFactWindow`, Spend-empty Pro wall). Its two strongest original findings — **spend entry tax** and **auto-sync expectation** — are carried forward here as FA and FB, and its TTFV table is preserved in §2.5.

This file proposes lanes. It does not implement code and does not claim a smoke PASS, a review, or an install count.

---

## 0. Verdict

The desk's *honesty engine* is now strong: the Overview gauge, CashVerdict, period trust, and the shipped closed-day ledger all fail closed. The remaining love-killers are **reachability, tone, and the manual-entry ask** — not lies, with one exception (an unconfirmed `3.00×` target still colors the Spend Explorer).

Four things kill week-1 love before a merchant ever disputes a number:

1. A cold merchant **cannot reach Overview** from the nav — every `/app` click bounces to Spend.
2. **Typing spend is the entire product ask**, and it recurs forever. Nothing else on this list matters if that ask feels heavier than the merchant's existing Monday sheet.
3. The desk greets a merchant's **first typed spend day with a red critical banner** counting 27 holes.
4. The **trial runs on calendar days while trust runs on closed-day coverage**, so a merchant can pay before the desk has ever shown a trusted multiple.

Nothing here asks for a pixel, an attribution model, a connector, or an ad dollar.

### Scoring key

`score = uninstall risk (1–5) × frequency (1–5)`, max 25.

| Religion fit | Meaning |
| --- | --- |
| **Keep** | Friction is the honest product. Change copy at most. |
| **Fix** | Real love-killer, fixable inside religion. |
| **Refuse** | Would require attribution theater, a connector, a guilt modal, or a fake number. Do not build. |

---

## 1. Top 10 love-killers (ranked)

Ranked by score; ties broken by uninstall risk, then by how early the friction lands in the merchant's session.

| Rank | ID | Friction | Uninstall | Freq | Score | Fit |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **F3** | Trial clock (calendar) vs trust clock (closed days) never reconciled on the desk | 5 | 4 | **20** | Fix |
| 2 | **F1** | Cold nav bounce — Overview unreachable before the first spend row | 4 | 5 | **20** | Fix |
| 3 | **FA** | Spend entry tax — typing/importing spend is the standing ask, and it competes with the merchant's existing sheet | 4 | 5 | **20** | Fix UX · **Refuse** OAuth |
| 4 | **F2** | First typed day is answered by a `critical` red 27-hole coverage banner | 4 | 5 | **20** | Fix |
| 5 | **F4** | Unconfirmed `3.00×` target draws a rail and red/green day dots in Spend Explorer | 4 | 4 | **16** | Fix |
| 6 | **FB** | Auto-sync expectation — suite muscle memory reads CSV-first as "not working properly" | 4 | 4 | **16** | Fix copy · **Keep** CSV |
| 7 | **F5** | Period ledger export stays blocked all month after one missing spend day | 3 | 5 | **15** | Fix |
| 8 | **F8** | ReviewAsk compound gate means the review flywheel may never start | 2 | 5 | **10** | Fix |
| 9 | **F6** | Goals prints "Total ROAS goal 3.00×" and builds the year board on the unconfirmed default | 3 | 3 | **9** | Fix |
| 10 | **F7** | Deep-history grant is a top-level Shopify permission prompt at the lowest-trust moment | 3 | 3 | **9** | Keep + copy |

Below the cut, still open: **F9** (SAMPLE-off CTA → `/app/demo` instead of the Real-store data-mode write, 2 × 3 = 6) and **F10** (retired `Close` / `Connections` redirects drop `stay`, 2 × 2 = 4). Both are cheap; §4 folds them into existing lanes rather than spending a lane.

---

## 2. Autopsy detail

### F1 — Cold nav bounce: Overview is unreachable before the first spend row · 4 × 5 = 20 · **Fix**

`firstOpenRedirect` fires on **every** `/app` load, not just the first one. The only escapes are `?stay=1`, SAMPLE, and `?shot=1`.

```108:125:mcfly-analytics/app/app/lib/install-stickiness.ts
export function firstOpenRedirect(input: FirstOpenRedirectInput): string | null {
  if (input.shotMode || input.useSampleDesk) return null;
  if (input.pathname !== "/app") return null;
  const params = searchParams(input.search);
  if (params.get("stay") === "1") return null;

  const step = resolveActivationStep(input);
  switch (step) {
    case "spend":
      return withParams("/app/spend", input.search, { activate: "1" });
```

The desk nav ships a bare `/app` href, so the "Overview" tab is a no-op for a cold merchant:

```26:29:mcfly-analytics/app/app/lib/desk-nav.ts
export const DESK_NAV_ITEMS: readonly DeskNavItem[] = [
  { id: "overview", href: "/app", label: "Overview", later: false },
  { id: "spend", href: "/app/spend", label: "Spend", later: false },
```

Spend's own CTA does pass `?stay=1` (`app.spend.tsx` ~1494, ~1510), so the cold empty exists — it is just only reachable from one button. A merchant who clicks the *nav* concludes the Overview tab is broken. `HOSTILE_WAVE6_BACKLOG.md` #2 is still open, and this is the single friction most likely to read as "not working properly" on the Partner uninstall form.

**Why it is worse than the backlog says:** the whole cold-empty ritual (`resolveFirstSessionPath` → `showColdEmpty` → the 4-step guide) is dead code from the nav's point of view. We built the good empty and then made it unreachable.

### F2 — The first typed spend day is answered by a red critical banner · 4 × 5 = 20 · **Fix**

Coverage is judged over a 28-day strip through yesterday. A merchant who follows our own instruction ("type one day, no file") lands on 1 filled / 27 missing and gets a `critical` banner:

```1429:1441:mcfly-analytics/app/app/routes/app.spend.tsx
        {!isEmpty && !shotMode && !daySavedCopy && holeCount > 0 ? (
          <s-banner tone="critical" heading={coverageImpact.heading}>
            <s-paragraph>{coverageImpact.body}</s-paragraph>
```

`UNINSTALL_RISKS.md` row 5 ("incomplete spend → harsh Close lock") was marked *SHIPPED honesty; soften CTA later*. The Close lock retired; the harshness moved here. Honest ≠ `critical`. A merchant who just did exactly what we asked should get a progress read, not a red alarm. `critical` is correct only when the merchant is *acting on* an incomplete number (verdict / export), never on first save.

### F3 — Trial clock vs trust clock · 5 × 4 = 20 · **Fix**

Pricing is a 7-day trial then $39 (`billing.server.ts` header line). Trust is closed-day: `resolvePeriodTrust`, `SalesFactsCoverage.complete`, `spendCoverage.daysWithSpend === daysInPeriod`, plus "today can still move." A merchant who installs mid-month, types two days, and waits will hit day 7 with an untrusted MTD and no idea whether the product works. Nothing on the desk says *what will be true by the time you are charged*.

Highest uninstall weight in this file: it maps directly onto Partner's **"Too expensive"** and **"Not using app now"**, and it is the reason a trial can convert to churn instead of $39.

Religion-safe fix is state + copy only: name the closed days already trusted, name what is missing, and say plainly that yesterday is the last day that can be final. **Refuse** anything that changes billing, extends a trial silently, or shows a projected multiple as trusted.

### FA — Spend entry tax · 4 × 5 = 20 · **Fix UX · Refuse OAuth**

Carried forward from the prior draft, which ranked this first. It is the only friction on this list that never ends: Shopify sales are automatic, so **entering ad spend is the merchant's entire recurring job**. Every week the merchant re-decides whether Mcfly is easier than the sheet they already have.

The onboarding path is right — `spendEmptyTeach` leads with "Type one day — no file needed" and demotes the template to secondary (`install-stickiness.ts` 137–177), with no Pro wall. The unresolved part is the *steady state*: coverage is judged across a 28-day strip and the ledger export demands every closed day, so the honest ask is "keep 28+ days filled, forever, by hand." That is a heavier standing commitment than the first-run copy implies.

This is the friction most likely to be misread as a request for connectors. **Refuse** Meta/Google/TikTok OAuth, connector marketplace, and auto-sync claims — the CSV-first spend source is the product and the compliance position (`REJECT_RISK_AUDIT.md`: "CSV-first Free = Meta + Google" is green, and no positive "Works with Meta" claim exists in copy). The lane is entry ergonomics only: fewer keystrokes per day, obvious multi-day paste, obvious backdating, and copy that sets the standing expectation honestly up front.

### FB — Auto-sync expectation · 4 × 4 = 16 · **Fix copy · Keep CSV**

Also carried forward. `UNINSTALL_RISKS.md` maps Partner's **"Not satisfied with features"** to "expected auto-sync / TW attribution," and its row 4 (CSV vs auto-sync expectation) is still marked **PARTIAL**. A merchant arriving with Triple Whale or SyncWith muscle memory can read a CSV-first desk as broken rather than as a deliberate refusal, then file "Not working properly" on uninstall.

The product copy already refuses attribution theater (`CASH_NOT_ATTRIBUTION`, `PRODUCT_NOUN.definition`), so this is an **expectation-setting** gap, not a code defect. It splits across lanes: the desk-side half is Spend empty and coverage copy (Desk); the listing/FAQ half — where the expectation is actually formed, before install — belongs to the **Listing lane**, not Desk. Say plainly and early that Shopify sales are automatic and ad spend is entered, and that this is why the number is a multiple you can hand-check rather than an attribution guess.

### F4 — An unconfirmed `3.00×` target still colors the Spend Explorer · 4 × 4 = 16 · **Fix**

This is the Wave 7B caveat, and it is real. `Settings.targetMer` defaults to `3.0` with `targetMerConfirmedAt` null:

```74:78:mcfly-analytics/app/prisma/schema.prisma
  targetMer                   Float     @default(3.0)
  /// Set when the merchant confirms a target via Settings or Goals. Null = no
  /// operating target — Overview shows actual Total ROAS with no goal rail.
  targetMerConfirmedAt        DateTime?
```

The Overview **gauge is correctly gated**:

```917:924:mcfly-analytics/app/app/routes/app._index.tsx
                    <TotalRoasGauge
                      mer={trustedHero.mer}
                      targetMer={
                        metrics.targetMerConfirmed ? metrics.targetMer : null
                      }
```

The **chart on the same page is not**. `app._index.tsx` passes the raw number into the explorer series (line ~388) and into the view (line ~408):

```381:408:mcfly-analytics/app/app/routes/app._index.tsx
  const explorerSeries = await buildSpendExplorerSeries(shop.id, {
    ...
    targetMer: metrics.targetMer,
  ...
    targetMer: explorerSeries.targetMer,
```

`SpendExplorer` then draws a labeled rail whenever the number is positive, and tones every day dot against it:

```694:711:mcfly-analytics/app/app/components/SpendExplorer.tsx
                  {targetMer > 0 && merCeil > 0 ? (
                    ...
                        Target {formatMer(targetMer)}×
```

```312:312:mcfly-analytics/app/app/components/SpendExplorer.tsx
      tone: merToneBand(b.mer, targetMer),
```

`merToneBand` returns `"down"` below `rail × 0.85` (`mer-format.ts` 45–53), so a merchant who never set a goal sees **red days under 2.55×** and a rail reading `Target 3.00×`. That is a machine-authored money judgment, which is exactly what `SMOKE_APP_STORE_ADS.md` forbids ("Facts still loading / backfilling is OK. Fake money judgment is not."). `targetMerConfirmed` already exists on `metrics` — the gate is one boolean away from the chart.

### F5 — Period ledger export blocked all month by one missing spend day · 3 × 5 = 15 · **Fix**

Wave 7C is landing in the working tree (`period-ledger.ts`, `.server.ts`, tests, `app.period-ledger[.]csv.tsx` untracked; `app._index.tsx` and `app.spend.tsx` modified). The gates are correct and honest:

```255:275:mcfly-analytics/app/app/lib/period-ledger.ts
  if (args.useSampleDesk) {
    return { ...base, ready: false, blockedCopy: PERIOD_LEDGER_BLOCK_COPY.sample };
  }
  ...
  if (!args.spendReady) {
    return { ...base, ready: false, blockedCopy: PERIOD_LEDGER_BLOCK_COPY.spend };
  }
```

The friction is the interaction with our own onboarding. `spendReady` requires `daysWithSpend === daysInPeriod` for the selected period, and we teach "type one day." So the newly advertised **Export period ledger (.csv)** control is disabled for essentially every merchant in their first month, on both Overview and Spend. A visible disabled promise is a specific kind of love-killer: it reads as a paywall even though it is honesty.

**Do not loosen the CSV gate** — a missing closed day must never serialize as `0.00`. The lane is entry-point UX: name the missing days, link straight to filling them, and consider offering the export for a period the merchant *does* fully cover (e.g. an explicit covered-range preset) rather than only refusing the one they picked.

### F6 — Goals prints an unconfirmed goal · 3 × 3 = 9 · **Fix**

Same leak class as F4, one page over. Goals reads `settings.targetMer` with no confirmation check — into the year board, the loader payload, and a visible chip:

```171:197:mcfly-analytics/app/app/routes/app.goals.tsx
    settings.targetMer,
  ...
    targetMer: settings.targetMer,
```

```553:555:mcfly-analytics/app/app/routes/app.goals.tsx
                  <span className="mcfly-ctx__asof">
                    {PRODUCT_NOUN.totalRoasGoal} {formatMer(targetMer)}×
                  </span>
```

Lower frequency than F4 only because Goals is a `later: true` nav item. Writes are clean — both Settings and Goals stamp `targetMerConfirmedAt` on save (`app.goals.tsx` 241, `app.settings.tsx` 192/196). Read paths are the whole problem.

### F7 — Deep-history grant asks for permissions at the lowest-trust moment · 3 × 3 = 9 · **Keep + copy**

`resolveDeepHistoryHonesty` is honest and correctly labels `missing_scope_wide` vs `backfilling`, and copy already refuses "permanently empty" (`deep-history-honesty.ts` 20–29). But `showGrantCta` sends a merchant who has not yet seen one trusted number into a top-level Shopify reauth prompt. Some merchants read a permission escalation from an unproven app as a reason to uninstall instead of grant.

**Keep the honesty.** The lane is ordering and copy: prove one trusted MTD number first, put "Open MTD" ahead of "Update permissions in Shopify" until a trusted multiple exists, and keep saying order ids and amounts only, no email CRM. **Refuse** any framing that implies deeper history buys attribution.

### F8 — ReviewAsk gate is now correct and may therefore never fire · 2 × 5 = 10 · **Fix (ordering, not loosening)**

Both hostile findings here are **closed**. The component polls for App Bridge instead of sampling once:

```93:102:mcfly-analytics/app/app/components/ReviewAsk.tsx
    if (!readyNow) {
      const deadline = Date.now() + API_POLL_MAX_MS;
      pollTimer = window.setInterval(() => {
        if (reviewsApiReady()) {
```

…and the server decision now takes `factsIncomplete` plus a `historyLimited` that includes `periodExceedsFactWindow`:

```495:500:mcfly-analytics/app/app/routes/app._index.tsx
      historyLimited:
        !useSampleDesk &&
        (Boolean(salesFactsCoverageForBanner?.periodExceedsFactWindow) ||
          (!scopesIncludeReadAllOrders(session.scope) &&
            periodMayExceedShopifyOrderWindow(range))),
      factsIncomplete: factsIncompleteForHonesty,
```

The residual risk is compound: SAMPLE off **and** trusted MER **and** ≥24h install **and** ≥60s dwell **and** scoreboard ready **and** facts complete **and** not history-limited **and** Reviews API attached **and** not dismissed. Layer F1/F2/F3 on top and the realistic number of merchants who ever see the ask is very small. Reviews stay honestly **0** — that is correct — but with zero social proof the listing cannot convert, which is the gate that keeps ads at **NO**.

This does not cause uninstalls (risk 2), so it ranks 6th by score. Treat it as a **flywheel** item, not a churn item: fix F1–F3 first so eligibility is actually attainable, then confirm the ask is reachable on a desk that legitimately qualifies. **Refuse** loosening any gate, asking on SAMPLE, auto-modals, or incentives.

### F9 — SAMPLE-off CTA points at the Demo page · 2 × 3 = 6 · **Fix**

`HOSTILE_WAVE6_BACKLOG.md` #5, still open:

```220:225:mcfly-analytics/app/app/lib/first-session-path.ts
  if (path.viewing === "sample") {
    return {
      href: "/app/demo",
      label: PRODUCT_NOUN.samplePreviewOffReviewTitle,
    };
  }
```

The label promises "turn SAMPLE off"; the href opens a Demo page instead of performing the Real-store data-mode write that `app.data-mode.tsx` owns. `UNINSTALL_RISKS.md` DoD item 5 explicitly requires SAMPLE-block copy to point at the **Real store**, not the Demo tab. Low frequency (SAMPLE-only path) but it is the exact moment a merchant is trying to become a paying user.

### F10 — Retired redirects drop the escape hatch · 2 × 2 = 4 · **Fix**

`app.close.tsx` preserves `period` but not `stay`, so a bookmarked Close on a cold desk lands on `/app` and then bounces to Spend. `app.connections.tsx` redirects to `/app/spend` with no params at all. Cheap; bundle into the F1 lane rather than spending a lane on it.

### 2.5 TTFV autopsy (the "<10 min" claim)

Preserved from the prior draft, with the friction column re-checked against code. Smoke SoT is `SMOKE_APP_STORE_ADS.md`, whose **Result is blank** — Fly is stamped **v201** (Wave 7C period ledger) but only Marty's Admin run can stamp PASS.

| Step | Ideal | Friction today | ID |
| --- | --- | --- | --- |
| Install → Real mode | Land on a live desk | SAMPLE/Real confusion; SAMPLE-off CTA opens Demo instead of writing Real | F9 |
| Margin confirm | Settings, optional | Clear after 7B — margin is honestly optional and only unlocks break-even | — |
| Add spend | One typed row, no file | The standing ask, not just the first one | FA, FB |
| See trusted Total ROAS | Overview | Nav cannot reach Overview cold; red coverage banner on the first save | F1, F2 |
| Trust the multiple | Closed-day honesty | Unconfirmed `3.00×` tones the chart; trial ends before coverage does | F4, F3 |
| Export for finance | Period ledger CSV | Shipped and honest, but disabled all month on one missing day | F5 |
| Ask for review | Only after real value | Gate is now correct, and therefore rarely satisfiable | F8 |

---

## 3. Closed since the hostile wave — do not re-litigate

| Source row | Status | Evidence |
| --- | --- | --- |
| Hostile #1 — spend coverage counts SAMPLE days as live "up to date" | **CLOSED** | `app.spend.tsx` 263 `loadSpendDayCoverage(shop.id, false)`; `includesSample ? {} : { source: { not: "sample" } }` (194–210); `getSpendPeriodCoverage(..., { excludeSample: true })` (273) |
| Hostile #3 — ReviewAsk samples App Bridge `reviews` once | **CLOSED** | `ReviewAsk.tsx` 90–102 polls to `2 × REVIEW_MIN_SESSION_MS` |
| Hostile #4 — ReviewAsk not gated on `periodExceedsFactWindow` | **CLOSED** | `app._index.tsx` 495–500 |
| Uninstall #3 — empty Spend leads with $39 Pro primary | **CLOSED** | `spendEmptyTeach` primary = "Type one day", secondary = blank template; no Pro wall |
| Overview gauge colored by hidden default target | **CLOSED** (gauge only) | `app._index.tsx` 919–920; chart is F4 |
| SAMPLE stamp coverage | **CLOSED** | `SampleDeskBanner` on Overview / Spend / Settings / Goals / Allocation / LTV / Advanced; `Close` + `Connections` are retired redirects with no UI; `DataModeBar` hidden when `?shot=1` (`app.tsx` 91) |
| Uninstall purge webhook | **CLOSED** | `webhooks.app.uninstalled.tsx` (per matrix row 11) |

**Not code, still blocking:** `SMOKE_APP_STORE_ADS.md` **Record → Result is blank**. Curl listing `200` + health `{"ok":true}` is not a smoke PASS. `REJECT_RISK_AUDIT.md` human gates A–E remain human. **App Store Ads stay NO** — no smoke PASS, no honest reviews, no organic week in `FUNNEL_WEEKLY.md`.

---

## 4. Proposed Desk fix lanes (exclusive files — not implemented here)

Conductor rule: **max four** concurrent lanes, exclusive files, no `fly deploy` by workers. Ranked by score.

**Sequencing constraint:** Wave 7C landed while this audit was running (`period-ledger*` + `app.period-ledger[.]csv.tsx` are in `HEAD`, Fly stamped **v201**), so `app._index.tsx` and `app.spend.tsx` are free again. They are still the contended files here: **D1 owns `app._index.tsx`, D2 owns `app.spend.tsx`, and the two cannot run in parallel with each other's route.** D3 needs two lines inside `app._index.tsx` — it must take that handoff from D1 rather than edit the route concurrently.

### D1 · Cold path reachability — kills F1, F9, F10

| | |
| --- | --- |
| **Owns** | `app/app/lib/install-stickiness.ts` · `app/app/lib/install-stickiness.test.ts` · `app/app/lib/first-session-path.ts` · `app/app/lib/first-session-path.test.ts` · `app/app/routes/app._index.tsx` · `app/app/routes/app.close.tsx` · `app/app/routes/app.connections.tsx` |
| **Outcome** | The nav "Overview" tab reaches the cold empty. The activation nudge stops being an infinite redirect. The SAMPLE-off CTA performs the Real-store write instead of opening Demo. |
| **Shape** | Either make the bounce genuinely first-open-only, or drop the bounce and let the existing cold empty own `/app` with its single Add-spend CTA. Retired redirects carry `stay` (and `period`). Point `firstSessionPrimaryAction`'s SAMPLE branch at the existing `app.data-mode.tsx` Real-store path — do not invent a second toggle. |
| **Must not** | Touch `app.spend.tsx`, `desk-nav.ts` labels, `app.data-mode.tsx` itself, Pages, Fly, listing, or billing. Do not hide nav tabs — that already tested as "felt broken." |
| **DoD** | Cold desk: nav Overview renders `showColdEmpty` with one primary CTA; no redirect loop; `?activate=1` still works from Spend; SAMPLE and `?shot=1` unchanged; SAMPLE CTA label matches what it actually does; `install-stickiness.test.ts` covers repeat `/app` loads. |

### D2 · Spend tone and entry ergonomics — kills F2, FA (desk half), F5 entry point; softens FB

| | |
| --- | --- |
| **Owns** | `app/app/routes/app.spend.tsx` · `app/app/lib/cash-desk-copy.ts` · `app/app/lib/cash-desk-copy.test.ts` |
| **Outcome** | The first saved day reads as progress. Incomplete coverage stays honest without an alarm. The blocked export names the missing days and links to filling them. The standing "keep days filled" expectation is stated once, plainly, instead of implied by a red banner. |
| **Shape** | Reserve `tone="critical"` for acting on an incomplete number; use an informational tone for "1 of 28 days filled." Reduce keystrokes per day and make multi-day paste and backdating obvious on the page a merchant returns to weekly. Keep the exact `PERIOD_LEDGER_BLOCK_COPY` strings as authoritative. |
| **Must not** | Change `loadSpendDayCoverage(shop.id, false)`, `excludeSample`, the ledger CSV gates, or any coverage math. No Pro wall on empty. **No connector, OAuth, or auto-sync copy** — FA is not a connector request. Listing/FAQ half of FB belongs to the Listing lane. |
| **DoD** | One typed day → non-critical progress line; holes still enumerated with dates; SAMPLE block copy still points at Real store; export control still disabled with exact blocked copy; no new spend source in the diff. |

### D3 · Unconfirmed-target honesty — kills F4, F6

| | |
| --- | --- |
| **Owns** | `app/app/components/SpendExplorer.tsx` · `app/app/lib/spend-explorer.ts` · `app/app/lib/spend-explorer.test.ts` · `app/app/routes/app.goals.tsx` · `app/app/lib/target-mer.test.ts` |
| **Outcome** | No rail, no target label, and no red/green day tone unless `targetMerConfirmed` (or SAMPLE) is true. Goals stops printing a goal nobody set. |
| **Shape** | Carry `targetMerConfirmed` (already on `metrics`) into the explorer view as a nullable target, exactly like `TotalRoasGauge` does. Unconfirmed → neutral tone, break-even rail only. Keep `settings.targetMer` numeric for allocation/pacing internals — the contract in `target-mer.ts` 1–10 is correct; only the read surfaces leak. |
| **Must not** | Write to `Settings`, prompt for a target on Overview, change break-even math, or touch the gauge. Do not delete the numeric default. |
| **Blocked on** | A handoff from D1 for the two lines in `app._index.tsx` (~388, ~408) that pass `targetMer` into the series and the view. Report the exact line rather than widening the lane. |
| **DoD** | Fresh install (never confirmed a target) shows no `Target 3.00×` text anywhere and no red day dots; after Settings save, rail and tones return; SAMPLE keeps its locked `4.4×` rail; tests assert the unconfirmed case. |

### D4 · Trial-vs-trust honesty — kills F3, softens F7

| | |
| --- | --- |
| **Owns** | `app/app/lib/period-trust.ts` · `app/app/lib/period-trust.test.ts` · `app/app/components/PeriodTrustNote.tsx` · `app/app/lib/deep-history-honesty.ts` · `app/app/lib/deep-history-honesty.test.ts` |
| **Outcome** | A merchant can read, in one line, how many closed days are trusted, what is missing, and that yesterday is the last day that can be final — before the trial ends. The permission ask stops jumping the queue. |
| **Shape** | Pure copy + state on existing trust primitives. Order the deep-history CTA behind "Open MTD" until a trusted multiple exists. |
| **Must not** | Read, change, or display billing state; extend a trial; project a multiple as trusted; imply deeper history buys attribution; touch `billing.server.ts`, `app.billing.tsx`, `app.settings.tsx`, or pricing copy. No countdown-pressure or guilt framing. |
| **DoD** | Trust note names trusted closed days and missing days for the selected period; no billing import in the diff; grant CTA demoted pre-trust; copy still refuses "permanently empty." |

### Not a Desk lane

- **FB, listing half** — the auto-sync expectation is formed **before install**, on the listing and FAQ. That belongs to the **Listing lane** (`docs/APP_STORE_LISTING.md` + compliance skill), not Desk. Do not let a Desk worker edit listing copy.
- **F11 `MonthlyPacing.tsx`** — carries the same unconfirmed-target leak (`target {formatMer(targetMer)}`, target tick at 102) but is **not rendered by any route**. Score 1 × 1 = 1. Fix only if it is ever mounted; otherwise it belongs in a retired-surfaces decision, not a Desk wave.
- **Margin-optional break-even absence** — `showMarginNudge` already handles it and CashVerdict withholds break-even honestly. **Keep.**
- **Smoke PASS, Partner gates, listing submit, ads** — human. `SMOKE_APP_STORE_ADS.md` Result stays blank until Marty's Admin run. No worker deploys Fly.

### Refuse list (asked for by churn, forbidden by religion)

Pixels · MTA / path credit / view-through · platform-attributed sales · Meta/Google/TikTok connectors · SyncWith-style connector zoo · uninstall guilt modals · red upgrade CTAs · "true ROAS" · auto-sync claims · CSV-sourced sales · SAMPLE money in a live export · projected multiples presented as trusted · invented reviews, install counts, or listing URLs · any App Store Ads spend.

---

## 5. Feeds

Ranked rows here feed `LOVE_SCORECARD.md` (synthesis) and `SHIP_BACKLOG_FROM_LOVE.md` (exclusive-file waves). **P0 candidates: F3, F1, FA, F2, F4** — lanes D1, D2, D3, D4 cover them.

Nothing in this file is shipped, committed, or deployed by this lane. Reviews remain **0**. App Store Ads remain **NO**.
