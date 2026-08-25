# Easy Add Spend fleet

**Branch:** `cursor/easy-add-spend-2ae5` (base: `cursor/resubmit-pause-email-2ae5`)  
**Job:** Spend is the highest-friction path. It must replace ad-API complexity with **daily spend in**, as far back as the merchant can go, plus **day / week / month** comparison on this tab.

## Product lock

- Daily spend only. No pixels, MTA, “true ROAS,” Meta/Google OAuth.
- Every named platform + typed extras (billboards) on Free. Pro is LTV + full Goals — do not gate channels.
- Practice | Your store: never mix CSV into Practice. Upgrade stays outside `<Form>` (`open(_, "_top")`).
- Imports at top of file. Exhaustive `switch` with `never`. No `$` in listing copy (not this PR).

## Why the current tab hurts

| Friction | Today |
| --- | --- |
| History | Blank template is **14 days**. Missing-day download caps at **62** dates in the URL. Coverage strip is **28 days**. Footnote already says backdate to the 4-year sales window. |
| CSV | Buried in `<details>` (“Many days or Ads Manager export”). Three nested steps + platform checkboxes. |
| Drill-down | `SpendExplorer` (Day / Week / Month / Quarter) lives on **Overview only**. Spend shows a period mix list, not comparison. |
| One-day add | Amount + date + channel is the right proud path — keep it. Do not make merchants CSV for yesterday’s invoice. |

## Three lanes (no shared files)

### Lane A — History CSV engine (isolated)

**Own:** `app/app/lib/spend-csv.ts`, `app/app/lib/spend-csv.test.ts`, `app/app/routes/app.spend.template.tsx`  
**Do not edit:** `app.spend.tsx`, `SpendExplorer.tsx`

Ship:

1. Date-range blank templates (not trailing-14 only):
   - Query: `from=YYYY-MM-DD&to=YYYY-MM-DD`
   - Query: `span=30d|90d|ytd|12m` (closed days through yesterday, clamped to `salesDayFactWindowStartUtc`)
2. `buildSelectedPlatformTemplateCsv` accepts `{ from, to }` (or `span`) in addition to `dayCount`.
3. Raise `dates=` cap from 62 to a sane year-sized cap **or** prefer `from`/`to` so a 365-day URL is not required.
4. Keep Ads Manager / wide / long parse working. Prefer more tolerant daily exports over new formats.
5. Tests for range enumeration, span clamp, selected-platform range, and template loader query params.

Suggested helpers (names can vary, keep them exported):

```ts
export type SpendTemplateSpan = "30d" | "90d" | "ytd" | "12m";
export function spendTemplateDateRange(opts: {
  span?: SpendTemplateSpan | string | null;
  from?: string | null;
  to?: string | null;
  now?: Date;
  floorKey?: string;
}): { fromKey: string; toKey: string; dates: string[] };
```

### Lane B — Day / week / month comparison (isolated)

**Own:** `app/app/lib/spend-explorer.ts`, `app/app/lib/spend-explorer.test.ts`, `app/app/components/SpendExplorer.tsx`  
**Do not edit:** `app.spend.tsx` (optional props only — Overview must keep working)

Ship:

1. Prior-period comparison for the selected granularity (this week vs last week, this month vs last month, this day vs prior day).
2. Compact layout flag (`variant="spend"` or similar) so Spend can embed the explorer without Overview chrome soup.
3. Comparison is spend + sales ÷ spend (Total ROAS), never platform ROAS.
4. Tests for prior-window math. Optional props default off so Overview is unchanged until it opts in.

### Lane C — Spend tab composition (orchestrator)

**Own:** `app/app/routes/app.spend.tsx`, `app/app/styles/mcfly-desk.css`, spend-page tests if any

Ship:

1. **Fill history** is first-class (not inside nested `<details>`): paste/upload + range chips (30d / 90d / YTD / 12m) hitting Lane A URLs.
2. Keep **Add one day** prominent (yesterday’s invoice / billboard).
3. Embed Lane B explorer (until B lands, embed current `SpendExplorer` with default range **90d**).
4. Coverage through yesterday for the selected backfill span, not only 28 days.
5. Do not nest Upgrade / Practice CTAs inside the Add spend `<Form>`.

## Merge order

A ∥ B first (no file overlap) → C wires URLs + explorer comparison → ship-gate → Fly.

**Status (2026-08-25):** Lane A merged (`spend-template-range` + `span`/`from`/`to` on the template route). Lane B comparison + compact explorer is on this branch. Lane C: Fill history is first-class (30d / 90d / YTD / 12m blanks), coverage is 90 days, SpendExplorer is embedded on `/app/spend` with `compare`.

## Out of scope

Pixels, connectors, listing paste, Partner Submit, hiding channels behind Pro.
