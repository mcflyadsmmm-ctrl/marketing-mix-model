# Bulletproof first-session + Pro no-brainer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: execute **sequentially on this branch**. Do **not** spawn parallel agents that share one worktree. Product SoT: [`STRATEGY.md`](../../../STRATEGY.md). Design: [`docs/superpowers/specs/2026-08-26-bulletproof-pro-nobrainer-design.md`](../specs/2026-08-26-bulletproof-pro-nobrainer-design.md). Shopify: `.cursor/skills/mcfly-shopify-compliance/SKILL.md`.

**Goal:** Stop silent wrong spend, empty-after-pay LTV, dual clocks, and marketing/product lies so the first session and the first Pro charge are trustworthy.

**Architecture:** Pure parser guards in `spend-csv.ts`; LTV empty-reason + backfill progress in till/order-facts; Overview explorer tied to the scoreboard period; marketing copy aligned to entitlements. No pixels, no Partner Submit.

**Tech Stack:** React Router 7 embedded Admin app, Vitest, Prisma `OrderBackfillState`, Shopify App Pricing Free + Pro $39, Fly `mcfly-analytics`.

## Global Constraints

- App URL stays `https://mcfly-analytics.fly.dev`.
- Listing paste must **not** include `$` / `$39`.
- Upgrade must leave the embed (`_top`). Never load `admin.shopify.com` in the iframe (2.1.1).
- No pixels, MTA, “true ROAS,” anti-pixel sermons, or competitor name-calling in merchant chrome.
- PCD Level 1 only. Free = all `SPEND_CHANNELS` + typed extras. Pro = LTV + full Goals only.
- In-app: Practice | Your store. Partner paste may still say `SAMPLE desk OFF`.
- Do not hide Goals/Allocation/LTV/Advanced on `cashReady`.
- Standing Fly grant: after `SKIP_HEALTH=1 bash scripts/agent-ship-gate.sh` PASS, `fly deploy -a mcfly-analytics --yes`.
- Imports at top of files. Exhaustive `switch` on unions uses `never`.
- Parallel implementers must not share this worktree.

---

## Files

| File | Responsibility |
| --- | --- |
| `app/app/lib/spend-csv.ts` | Channel synonyms, date-span refuse, delimiter detect, `parseForceChannel` |
| `app/app/lib/spend-csv.test.ts` | Parser corpus for P0.1–P0.3 + P1.1 |
| `app/app/routes/app.spend.tsx` | All-channel force picker; sync submit; server allowlist |
| `app/app/lib/easy-add-spend-tab.test.ts` | Source-assert forceChannel not Meta/Google-only |
| `app/app/lib/till-ltv.server.ts` | Empty reason: backfilling before history_limited |
| `app/app/lib/till-ltv.test.ts` | Empty-reason cases |
| `app/app/lib/order-facts.server.ts` | `historyLimited` default false; `getOrderBackfillProgress` |
| `app/prisma/schema.prisma` + migration | `OrderBackfillState.historyLimited` default false |
| `app/app/routes/app.ltv.tsx` | Progress copy; drop “Free shows…”; margin default label; `maxDays` 7 |
| `app/app/lib/ltv-sales-spine.test.ts` | Copy contracts |
| `app/app/routes/app._index.tsx` | Explorer tied to scoreboard; gate OrderFact kick on `canUseLtv` |
| `app/app/lib/spend-explorer.ts` | `explorerQueryMatchingScoreboard` |
| `app/app/components/PeriodControl.tsx` | Last month / Last 12 months labels |
| `app/app/lib/desk-period-labels.test.ts` | Label + Overview default contracts |
| `site/index.html`, `site/support.html`, `site/demo.html`, `site/assets/chrome.js` | Wave B brand / Goals-Pro / Practice |
| `app/app/routes/support.tsx` | Wave B inbox order |

## Fleet rule

Parent implements **one task at a time** on `cursor/bulletproof-desk-plan-2ae5`. Do not dispatch implementer subagents against this worktree.

---

### Task 1: Parser — Account/Network are not channels

**Files:**
- Modify: `app/app/lib/spend-csv.ts`
- Test: `app/app/lib/spend-csv.test.ts`

**Interfaces:**
- Consumes: `parseSpendCsv(text, options?)`
- Produces: long-format only when the channel column is `channel` or `platform` (not Account name / Network / source / medium)

- [ ] **Step 1: Write the failing tests**

```ts
describe("account / network are not channel columns", () => {
  it("does not silently map Day,Account name,Amount spent to Other", () => {
    const csv = `Day,Account name,Amount spent
2026-07-01,ACME Brand,100`;
    const unforced = parseSpendCsv(csv);
    expect(unforced.rows).toEqual([]);
    expect(unforced.errors[0]).toMatch(/single-platform export/i);
    const forced = parseSpendCsv(csv, { forceChannel: "meta" });
    expect(forced.errors).toEqual([]);
    expect(aggregateSpendRows(forced.rows)).toEqual([
      { date: "2026-07-01", channel: "meta", amount: 100 },
    ]);
  });

  it("does not silently map Day,Network,Cost to Other", () => {
    const csv = `Day,Network,Cost
2026-07-01,Search,50`;
    const unforced = parseSpendCsv(csv);
    expect(unforced.rows).toEqual([]);
    expect(unforced.errors[0]).toMatch(/single-platform export/i);
  });

  it("still parses date,channel,amount long format", () => {
    const csv = `date,channel,amount
2026-07-01,meta,80`;
    const { rows, errors } = parseSpendCsv(csv);
    expect(errors).toEqual([]);
    expect(rows[0]?.channel).toBe("meta");
    expect(rows[0]?.amount).toBe(80);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npx vitest run app/lib/spend-csv.test.ts -t "account / network"`

Expected: FAIL — rows land on `other` with empty errors.

- [ ] **Step 3: Write minimal implementation**

In `HEADER_SYNONYMS.channel`, keep only `"channel"` and `"platform"`. Remove `"source"`, `"medium"`, `"network"`, `"account"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npx vitest run app/lib/spend-csv.test.ts`

Expected: PASS (full file).

- [ ] **Step 5: Commit**

```bash
git add app/app/lib/spend-csv.ts app/app/lib/spend-csv.test.ts
git commit -m "fix: stop mapping Account/Network CSV columns to Other"
```

---

### Task 2: Parser — refuse date-span rows

**Files:**
- Modify: `app/app/lib/spend-csv.ts`
- Test: `app/app/lib/spend-csv.test.ts`

**Interfaces:**
- Produces: `looksLikeDateSpan(raw: string): boolean`
- Produces: errors containing `Day breakdown` or `Divide a bill` when Reporting starts ≠ Reporting ends or a cell is `YYYY-MM-DD - YYYY-MM-DD`
- Produces: **zero rows written** when any span error exists (existing persist path already fail-closes on errors)

- [ ] **Step 1: Write the failing tests**

```ts
describe("date-span exports refuse to lump onto day one", () => {
  it("refuses Reporting starts ≠ Reporting ends", () => {
    const csv = `Reporting starts,Reporting ends,Amount spent
2026-07-01,2026-07-31,5000`;
    const { rows, errors } = parseSpendCsv(csv, { forceChannel: "meta" });
    expect(rows).toEqual([]);
    expect(errors[0]).toMatch(/Day breakdown|Divide a bill|not a day/i);
  });

  it("refuses a single cell date range", () => {
    const csv = `Day,Amount spent
2026-07-01 - 2026-07-31,5000`;
    const { rows, errors } = parseSpendCsv(csv, { forceChannel: "google" });
    expect(rows).toEqual([]);
    expect(errors[0]).toMatch(/Day breakdown|Divide a bill|date range/i);
  });

  it("still accepts Reporting starts === Reporting ends", () => {
    const csv = `Reporting starts,Reporting ends,Cost (Account currency)
2026-07-01,2026-07-01,288.10`;
    const { rows, errors } = parseSpendCsv(csv, { forceChannel: "google" });
    expect(errors).toEqual([]);
    expect(aggregateSpendRows(rows)).toEqual([
      { date: "2026-07-01", channel: "google", amount: 288.1 },
    ]);
  });
});
```

- [ ] **Step 2:** `cd app && npx vitest run app/lib/spend-csv.test.ts -t "date-span"` — Expected: FAIL (5000 on 2026-07-01).

- [ ] **Step 3: Implement**

Add `looksLikeDateSpan`. Find a Reporting ends / End date column ≠ `dateCol`. In long / forced / wide loops, if span → `pushError` and **do not push a row**. Same-day starts/ends remain valid.

`classifyCsvError`: bucket `day breakdown` / `not a day` / `date range` as `"Date range instead of days"`.

- [ ] **Step 4:** Full `spend-csv.test.ts` PASS.

- [ ] **Step 5:** Commit `fix: refuse Ads Manager range CSVs that lump onto one day`

---

### Task 3: Parser — semicolon/tab delimiter + parseForceChannel

**Files:**
- Modify: `app/app/lib/spend-csv.ts`
- Test: `app/app/lib/spend-csv.test.ts`

**Interfaces:**
- Produces: `parseForceChannel(raw: string | null | undefined): CsvChannel | undefined` — true iff `SPEND_CHANNELS` member
- Produces: `detectCsvDelimiter` used inside `parseSpendCsv` so `Day;Amount spent` parses like comma CSV

- [ ] **Step 1: Tests**

```ts
it("parses semicolon Day;Amount spent with forceChannel", () => {
  const csv = `Day;Amount spent
2026-07-01;100`;
  const { rows, errors } = parseSpendCsv(csv, { forceChannel: "tiktok" });
  expect(errors).toEqual([]);
  expect(aggregateSpendRows(rows)).toEqual([
    { date: "2026-07-01", channel: "tiktok", amount: 100 },
  ]);
});

it("parseForceChannel accepts every SPEND_CHANNELS member and rejects junk", () => {
  for (const ch of SPEND_CHANNELS) {
    expect(parseForceChannel(ch)).toBe(ch);
  }
  expect(parseForceChannel("meta ")).toBe("meta");
  expect(parseForceChannel("facebook")).toBeUndefined();
  expect(parseForceChannel("")).toBeUndefined();
});
```

EU decimal `12,50` stays null (existing test). After semicolon split, amount `12,50` still fail-closes.

- [ ] **Step 2:** FAIL on “Missing a Day/date column”.

- [ ] **Step 3:** `splitCsvLine(line, delimiter = ",")`; detect delimiter from header (unquoted `;` or `\t` count > comma). Thread delimiter through parse loops. Export `parseForceChannel`.

- [ ] **Step 4–5:** PASS + commit `fix: parse semicolon CSVs and accept any forceChannel`

---

### Task 4: Spend UI — all-channel force picker, sync submit

**Files:**
- Modify: `app/app/routes/app.spend.tsx`
- Test: `app/app/lib/easy-add-spend-tab.test.ts`

**Interfaces:**
- Consumes: `parseForceChannel` from `spend-csv.ts`
- Produces: hidden `forceChannel` set and `requestSubmit()` on the CSV form **without** `setTimeout`

- [ ] **Step 1: Source-assert tests in `easy-add-spend-tab.test.ts`**

```ts
it("force-channel allowlist is every SPEND_CHANNELS member, not Meta/Google only", () => {
  expect(spend).toContain("parseForceChannel");
  expect(spend).not.toMatch(
    /forceRaw === "meta" \|\| forceRaw === "google"/,
  );
  expect(spend).toContain("requestSubmit");
  expect(spend).not.toMatch(/setTimeout\(\s*\(\)\s*=>\s*\{[\s\S]*mcfly-spend-csv-submit/);
  expect(spend).toMatch(/This looks like a single-platform/);
  expect(spend).toContain("SPEND_CHANNELS");
});
```

- [ ] **Step 2:** FAIL.

- [ ] **Step 3:** Replace server allowlist with `parseForceChannel`. State type `"" | CsvChannel`. CSV `<Form id="mcfly-spend-csv-form">`. On needsForceChannel, render a `<select>` of `SPEND_CHANNELS` (labels from `SPEND_CHANNEL_LABELS`) plus “Import as this platform” that writes the hidden input and `requestSubmit()`. Keep Meta/Google as the first two options (most common).

- [ ] **Step 4–5:** PASS + commit `fix: let merchants force any spend channel on native CSVs`

---

### Task 5: LTV empty reason + backfill progress

**Files:**
- Modify: `app/app/lib/till-ltv.server.ts`
- Modify: `app/app/lib/order-facts.server.ts`
- Modify: `app/prisma/schema.prisma`
- Create: `app/prisma/migrations/20260826090000_order_backfill_history_limited_default/migration.sql`
- Modify: `app/app/routes/app.ltv.tsx`
- Modify: `app/app/routes/app._index.tsx`
- Test: `app/app/lib/till-ltv.test.ts`
- Test: `app/app/lib/ltv-sales-spine.test.ts`

**Interfaces:**
- Produces: `summarizeTillLtvFromCohorts` emptyReason `backfilling` when no cohorts, even if `historyLimited: true`
- Produces: `history_limited` only when `historyLimited && options.limitedWindowExhausted === true`
- Produces: `getOrderBackfillHistoryLimited` → `state?.historyLimited ?? false`
- Produces: `ensureBackfillState` create `{ historyLimited: false }`
- Produces: `getOrderBackfillProgress(shopId, { ianaTimezone, now? })` → `{ completeDays, windowDays, remainingDays, historyLimited, status } | null`
- Produces: LTV copy keeps `Orders still syncing — not $0 LTV` and adds `Ingested {completeDays} of {windowDays} closed days`
- Produces: LTV must **not** contain `Free shows the available window`
- Produces: LTV kick `maxDays: 7` (use `ORDER_FACT_MAX_DAYS_PER_RUN`)
- Produces: Overview OrderFact kick only when `canUseLtv`

- [ ] **Step 1: Failing tests**

```ts
it("empty cohorts prefer backfilling over history_limited", () => {
  const summary = summarizeTillLtvFromCohorts([], {
    totalSpend: 1000,
    newCustomers: 10,
    historyLimited: true,
    ianaTimezone: "America/Denver",
  });
  expect(summary.available).toBe(false);
  expect(summary.emptyReason).toBe("backfilling");
  expect(summary.historyLimited).toBe(true);
});

it("history_limited only when the limited window is exhausted", () => {
  const summary = summarizeTillLtvFromCohorts([], {
    totalSpend: 1000,
    newCustomers: 10,
    historyLimited: true,
    limitedWindowExhausted: true,
    ianaTimezone: "America/Denver",
  });
  expect(summary.emptyReason).toBe("history_limited");
});
```

`ltv-sales-spine.test.ts`: keep `Orders still syncing — not $0 LTV`; add `not.toContain("Free shows")`; add `getOrderBackfillProgress` / `Ingested`; add `ORDER_FACT_MAX_DAYS_PER_RUN`.

Overview source-assert: `runOrderFactsBackfill` is inside `canUseLtv` (or `entitlements.canUseLtv`).

- [ ] **Step 2:** FAIL.

- [ ] **Step 3: Implement** as specified. Prisma:

```sql
ALTER TABLE "OrderBackfillState" ALTER COLUMN "historyLimited" SET DEFAULT false;
```

`history_limited` merchant copy: `Order history from Shopify is limited on this shop (~60 days). Cohorts only cover that window — not $0 LTV.`

When `emptyReason === "backfilling"` and progress is non-null:

`Orders still syncing — not $0 LTV. Ingested ${completeDays} of ${windowDays} closed days. Refresh this page.`

- [ ] **Step 4–5:** PASS + commit `fix: show LTV syncing progress instead of a fake empty Free window`

---

### Task 6: One clock + period labels + default margin honesty

**Files:**
- Modify: `app/app/lib/spend-explorer.ts`
- Modify: `app/app/routes/app._index.tsx`
- Modify: `app/app/components/PeriodControl.tsx`
- Modify: `app/app/routes/app.ltv.tsx`
- Create: `app/app/lib/desk-period-labels.test.ts`
- Test: `app/app/lib/spend-explorer.test.ts`

**Interfaces:**
- Produces: `explorerQueryMatchingScoreboard(preset, period, timeZone?): { range: ExplorerRange; from: string | null; to: string | null }`
  - `ytd` → `{ range: "YTD", from: null, to: null }`
  - `l12m` → `{ range: "1y", from: null, to: null }`
  - `y3` → `{ range: "All", from: null, to: null }`
  - `mtd` | `lm` | `qtd` → `{ range: "custom", from: shop-local start key, to: shop-local end key }`
- Produces: Overview uses that helper **only when** `url.searchParams.get("exRange")` is null
- Produces: PeriodControl labels `Last month` and `Last 12 months` (not `LM` / `L12M`); keep `MTD` `QTD` `YTD`
- Produces: LTV contrib line uses `default {pct} until you confirm in Settings` when `!marginConfirmed`

- [ ] **Step 1: Tests**

```ts
it("MTD scoreboard maps explorer to custom month keys in shop TZ", () => {
  const period = resolvePeriod("mtd", new Date("2026-08-15T18:00:00.000Z"), "UTC");
  const q = explorerQueryMatchingScoreboard("mtd", period, "UTC");
  expect(q.range).toBe("custom");
  expect(q.from).toBe("2026-08-01");
  expect(q.to).toBe("2026-08-15");
});
```

Source-assert `PeriodControl.tsx` contains `Last month` and `Last 12 months` and does not contain `label: "LM"`.

Source-assert `app._index.tsx` contains `explorerQueryMatchingScoreboard` and does **not** contain `exRange") || "14d"`.

Source-assert LTV contains `until you confirm in Settings`.

- [ ] **Step 2–5:** FAIL → implement → PASS → commit `fix: tie Overview chart to the scoreboard period`

Pass `marginConfirmed` from LTV loader via `marginIsConfirmed(settings)`. Keep `formatPercent(metrics.marginPct)` for the test.

---

### Task 7: Wave A verification

- [ ] `cd app && npx vitest run app/lib/spend-csv.test.ts app/lib/till-ltv.test.ts app/lib/ltv-sales-spine.test.ts app/lib/easy-add-spend-tab.test.ts app/lib/spend-explorer.test.ts app/lib/desk-period-labels.test.ts app/lib/desk-honesty-labels.test.ts`
- [ ] `SKIP_HEALTH=1 bash scripts/agent-ship-gate.sh`
- [ ] Push + PR against `cursor/pro-nobrainer-clarity-2ae5`
- [ ] Fly deploy after PASS; curl health

---

## Wave B — Marketing match (after Wave A ships)

**Files:** `site/index.html`, `site/support.html`, `site/demo.html`, `site/product.html`, `site/faq.html`, `site/pricing.html`, `site/assets/chrome.js`, `app/app/routes/support.tsx`, `app/app/lib/site-go-live.test.ts`, `app/app/lib/fly-trust-pages.test.ts`, `app/app/lib/landing.test.ts`

- Homepage 03: **Email Overview (Free)**; year **Goals (Pro)**; keep LTV Pro.
- Product og/jsonld `name`: Mcfly Analytics on app pages. Do **not** rewrite Custom Data Solutions / MDS pages to drop Mcfly Ads (agency line).
- `/demo` and homepage chip: **Practice**, not Sample desk. Keep `SAMPLE / Practice` on Fly Support if `fly-trust-pages.test.ts` requires it.
- Support inboxes: Gmail first, then invites, same order on site + Fly.
- Tests: site-go-live still forbids waitlist/Meta-only Free lies; add assert homepage does not title “Goals + Email” as if both were Free.

Commit: `fix: align marketing with Practice, Analytics name, and Goals as Pro`

---

## Wave C — Ghost intents + Advanced first line

**Files:** `app/app/routes/app.spend.tsx`, `app/app/lib/spend-csv.ts`, `app/app/components/CashTrustBanners.tsx`, `app/app/routes/app.advanced.tsx`, `app/app/components/SampleDeskBanner.tsx`, `app/app/routes/app.spend.template.tsx`

- Either wire `declare-recon` on Spend (period total + dates matching desk period) **or** delete the action and Advanced “No Ads Manager total” copy.
- Either restore combine UI **or** delete `handleCsvCombine` + `csv-combine` intent. Do not leave a POST with no control.
- `buildSheetsImportGuide`: wire into Spend how-to **or** un-export and drop its unit test.
- Advanced lede: `Optional. Add spend on Spend first — this page is extra math, not a second scoreboard.`
- Success import summary: skipped totals/zeros count.
- Template loader: drop dead Free Meta+Google branch.

---

## Wave D — Currency, Goals YoY, guests, cohort TZ

**Files:** `app/app/lib/mer-format.ts` call sites on desk, `app/app/routes/app.goals.tsx`, `app/app/lib/sales-goals.server.ts`, `app/app/lib/order-facts.server.ts`, `app/app/lib/sales-facts.server.ts`, `app/app/components/ProValuePreview.tsx`

- `formatCurrency(amount, shop.currencyCode)` on Overview/Spend/LTV/Goals/Allocation.
- Disable Grow 10% YoY when `priorYearSales === 0`; no success toast.
- `parseGoalsYear(..., now, deskTz)`.
- Cohort month from shop-local first-order date.
- Desk spine `guestOrders` from facts; disclose guests excluded from LTV.
- Free Pro teaser: do not show a worked Cash CAC from `newCustomers: 0`.

---

## Wave E — Settings privacy, Email Overview, EU amounts UX

- Settings: one sentence “We store order ids and amounts, not customer email.” Keep Level-1 details collapsed.
- Share button: `Email this overview`.
- Amount error for `looksLikeEuDecimal`: `Use 12.50 (dot decimal), not 12,50.`
- Ambiguous `05/06/2026`: fail-closed, ask for YYYY-MM-DD.
- Do not add `trialDays` without founder ask.

---

## Later findings (append here — hunt loop)

| Date | ID | Finding | Wave |
| --- | --- | --- | --- |
| 2026-08-26 | — | Inventory in the design spec is the starting set. Re-run Hunt method after each wave. | — |

---

## Self-review

- Spec P0.1–P0.6 → Tasks 1–6.
- Spec P1.1 → Task 3; P1.6–P1.7–P1.8 → Task 6 + Wave B; P1.13 → Task 5.
- No TBD / implement later without a wave and files.
- `parseForceChannel` name is used in Tasks 3 and 4.
- `limitedWindowExhausted` is the only new summarize option besides existing `historyLimited`.
