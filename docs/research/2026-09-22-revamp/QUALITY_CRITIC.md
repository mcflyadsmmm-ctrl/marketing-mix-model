# Quality critic — v45 (outside Ship/HOLD)

**Verdict: SHIP** (re-check 2026-09-22, 9:25 PM)
**Base SHA:** `be80745` on `cursor/quality-v45` plus the uncommitted B1 fix (`mcfly-desk.css`, −4 lines). Commit the fix before publishing; the shipped SHA is the commit that contains it.
**Tests:** `npm test` in `app/`: 169 files, **2004/2004 passed** after the fix.

## Re-check (B1 resolved)

- The four orphan lines after `.mcfly-overview-first-beat .mcfly-yoy__prior { … }` are deleted: `box-shadow`, `padding`, `border-top` and the stray `}`. `git diff` shows only those 4 deletions.
- esbuild parses `app/app/styles/mcfly-desk.css` with **no warnings** (it previously reported `css-syntax-error` at 21883).
- `.mcfly-overview-first-beat .mcfly-yoy__lede--quiet { display: none; }` now follows a closed rule, so browsers apply it again. The pending "reports scope" line and the empty-state lede stay hidden in the Overview first fold on both `/app` and `/demo`.

## Prior HOLD (be80745), for the record

**B1:** the new compact-row block was inserted into the middle of the old `.mcfly-yoy__card--plane` rule. The orphaned tail made browsers drop the next rule (`lede--quiet { display:none }`). That exposed "Waiting on reports scope / sales totals ingest — not $0." on the Overview first fold, which conflicts with the no-`read_reports` lock. **Fixed.**

## P0 check (code)

| # | Status | Evidence |
| --- | --- | --- |
| Q1 Site hero overlap | Fixed | `site/index.html` shows one `ov-still__meta-line` flex row: `From orders · same days last year $69,891`. Stamped v45. |
| Q2 Live-slice bars | Fixed | No `live-slice` or "Spend demo" left in `site/*.html`. One line: "Open the SAMPLE desk…" plus the pricing CTA. |
| Q3 Desk YoY essay + UP pills | Fixed | `Orders YTD`, `CopyYtdSales`, zone pills, `glancePct` and the analytics lede removed from the populated render. One `LY … · vs` line per card. The CSS now parses. |
| Q4 Desk hero meta | Fixed | `mcfly-overview-plane__meta` = `From orders · same days last year …` under the hero $. Coverage line muted. |
| Q5 Compact rows (P1) | Done | Borderless rows with a bottom rule. |

## Product locks

| Lock | Status |
| --- | --- |
| From orders label | Present on the site still and the desk hero. |
| $68,457 | `site/index.html:105`, unchanged. |
| No Shopify Total Sales on Overview first fold | Not found in `OverviewFirstViewport.tsx` or `site/index.html`. The test asserts it. |
| SAMPLE_ONLY | `fly.toml` `MCFLY_SAMPLE_ONLY = "true"`, untouched. |
| No `read_reports` | All `shopify.app*.toml` = `read_orders,read_customers,read_all_orders`. Reports-scope copy is hidden again. |

## Non-blocking nits (follow-up)

- `OverviewFirstViewport.tsx`: the `mcfly-overview-plane__value` line is over-indented.
- Tests repeat the `OVERVIEW_FROM_ORDERS_LABEL` assertion back to back in two places.
- Consider changing the `OVERVIEW_YOY_PENDING` copy so it doesn't say "reports scope" at all.
