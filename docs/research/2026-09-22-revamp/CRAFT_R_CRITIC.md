# Craft R (v46) — Outside critic

**Branch:** `cursor/craft-v46` @ `f2dd043` (first review @ `6fe8eb8`) vs `origin/cursor/spend-trust-recurring`
**Plan:** `APP_CRAFT_PLAN.md` § Ship R · `CRAFT_R_NOTES.md`
**Verdict:** **SHIP** (re-check @ `f2dd043`; B1 fixed)

## Re-check @ f2dd043

| Check | Result |
| --- | --- |
| No `<s-section` in `OverviewYoyCards` / `OverviewSalesChart` | PASS: native `<section className=… aria-label=…>` in all 3 YoY branches and on the chart root |
| Visible headings | PASS: `<h3 className="mcfly-yoy__h">Vs last year</h3>` (new compact muted caps style) and chart `<h3>` with `OVERVIEW_CHART_CAPTION` |
| Tests guard the regression | PASS: both suites now assert `not.toContain("<s-section")` |
| `npm test` | PASS: 169 files, 2004 tests |
| CSS parses | PASS |
| From orders / no `read_reports` / no Total Sales first fold | PASS (unchanged: label `"From orders"`, scopes `read_orders,read_customers,read_all_orders` in all three tomls, `label="Total Sales"` absent) |
| Fix scope | Only the 2 components, 2 tests, a 9-line CSS addition, and this doc |

**Before publish (Conductor, not blocking Ship):** screenshot the first 2 viewports of `/demo` at 1280×720 and check that the compact YoY list and chart well render styled (N3 below). The critic did not take this screenshot. The chart `<h3>` reuses `mcfly-chart__serif`, which has no global rule, only one scoped to `.mcfly-cust-mix`. It will inherit well heading styles, so eyeball its size in that screenshot.

---

## Original review @ 6fe8eb8: HOLD

## Checks

| Check | Result |
| --- | --- |
| Lane order: hero → YoY → chart in `rank="first"` | PASS (`app._index.tsx` 912–983; demo mirrors) |
| Mix + shareables folded `rank="more"`, `defaultOpen={shotMode}` | PASS (both routes; hash deep-link still opens folds via `DeskLane`) |
| First-fold copy: no essay ledes | PASS: chart lede + pace bars gone, coverage line and YoY pending text are screen-reader-only, chart masthead = range label |
| From orders label | PASS (`OVERVIEW_FROM_ORDERS_LABEL = "From orders"`, still on hero) |
| No `read_reports` | PASS (all three tomls: `read_orders,read_customers,read_all_orders`) |
| No Shopify Total Sales on first fold | PASS (test asserts `label="Total Sales"` absent) |
| SAMPLE_ONLY / sample banner | Unchanged by diff |
| CSS parses | PASS (postcss parse of `mcfly-desk.css`) |
| `npm test` | PASS: 169 files, 2004 tests |
| Visual: YoY list + chart actually styled | **FAIL**, see B1 |

## Blocker

**B1: `<s-section className=…>` drops every class on React 18.**
The app runs `react@^18.3.1`. React 18 passes props on custom elements through as literal attributes, so it does not map `className` to `class`. Verified:

```
renderToString(<s-section className="a b" heading="H" id="x">)
→ <s-section className="a b" heading="H" id="x">
```

The browser stores that as an attribute named `classname`, so no class selector matches. The effect on the first fold:

- `OverviewYoyCards` (all 3 branches) loses `mcfly-desk-anchor mcfly-yoy mcfly-yoy--glance mcfly-yoy--plane mcfly-yoy--metrics`. The new compact-list CSS (`.mcfly-yoy--metrics …`, about 60 lines) is dead code, and existing plane/glance rules stop applying.
- `OverviewSalesChart` loses `mcfly-well mcfly-well--scoreboard mcfly-chart mcfly-chart--sales`. That rule family has about 100 lines in `mcfly-desk.css`, so the chart well and masthead render unstyled.
- No repo code loads `polaris.js`: `root.tsx` loads only `app-bridge.js`, and it skips even that on public `/demo`. So `heading="Vs last year"` / `heading={OVERVIEW_CHART_CAPTION}` render **no visible title**. The old `<h3>` chart caption and both `aria-label`s were removed, so both sections also lose their accessible names.
- No other `s-*` element in the repo uses `className`, so nothing in the codebase supports this pattern.

The tests pass because they assert the string `<s-section` exists in the source. They lock in the bug instead of catching it.

**Fix (Composer, same files):**
1. Change the 3 YoY returns and the chart root back to `<section className=… aria-label=…>`.
2. Add one small visible heading to each, for example `<h3 className="mcfly-yoy__h">Vs last year</h3>` and keep the chart `<h3>` with `OVERVIEW_CHART_CAPTION`. Style them compact (no serif) so the "no essay" bar holds.
3. Flip the tests from `toContain("<s-section")` to `not.toContain("<s-section")` in `OverviewYoyCards` / `OverviewSalesChart`, and assert that `mcfly-yoy--metrics` sits on a `<section`.
4. Take a `/demo` screenshot of the first 2 viewports to confirm the compact YoY list and chart well render.

## Non-blocking

- N1: The YoY `id={OVERVIEW_YOY_GLANCE_ID}` still resolves, since `id` passes through. It loses `mcfly-desk-anchor` scroll-margin until B1 is fixed.
- N2: `sameDatesSentence` is now screen-reader-only. That's fine: the hero meta already shows "same days last year $X" in visible text.
- N3: The `rank="first"` lane now holds hero + YoY + chart. On a short Admin iframe (<760px) the chart may start below scroll 2. After the fix, check the screenshot at 1280×720.

## Re-Ship bar

B1 fixed · `npm test` green · `/demo` first-2-viewport screenshot shows the styled compact YoY list and the chart well with visible headings. Then Ship with no further review.

Do not merge or deploy from this critic.
