# Aesthetic v44 — outside critic (Opus)

**Reviewed:** 2026-09-22 ~21:10 America/Denver
**Branch:** `cursor/aesthetic-v44` @ `bab4e34` vs `origin/cursor/spend-trust-recurring` @ `a47be4f`
**Diff:** 24 files, +743 / −246 (desk CSS + first-fold TSX + tests; site CSS + 4 HTML; plan docs)
**Working tree:** clean

## Verdict: **Ship**

No blockers. The branch does what `AESTHETIC_PLAN.md` asks, in spirit and in the letter where checkable from source. It does not change product locks, scopes, or pricing.

## Done bars (plan §0 / §4)

| Bar | Result | Evidence |
| --- | --- | --- |
| One display hero per fold (Overview) | Pass | `mcfly-overview-first-beat` wraps `OverviewFirstViewport` + `OverviewYoyCards` as one two-column beat. The chart moves to a second beat below a hairline rule (`mcfly-overview-chart-beat`). The separate "Same days last year" `DeskLane` is gone. |
| Overview YoY is not a soft card farm | Pass | `mcfly-yoy--soft` / `mcfly-well--scoreboard` replaced by `mcfly-yoy--plane`. Inside the first beat, cards are hairline rows with no border, radius, or background, in one column. The lede is hidden there. MTD/QTD/YTD = 3 support facts (≤3). |
| Orders first fold without the soft peek farm | Pass | `PeekCard` grid (`mcfly-orders-under` / `mcfly-kpi--peek`) removed from `OrdersFirstViewport`. Median hero + `OrdersTicketBand` remain. The hero is flattened by CSS (no card chrome, `clamp(2.6rem, 5vw, 3.4rem)`). |
| Customers first fold | Pass (CSS only) | No `--soft` classes in `CustomersFirstViewport.tsx`. The hero is flattened by the same CSS rule as Orders. |
| Spend: Total ROAS display or giant — | Pass | The three soft `mcfly-book__kpi--soft` tiles are replaced by `mcfly-spend-plane`. Total ROAS is the display value (Fraunces, 2.6–3.4rem). Empty shows `—` in the muted colour (`data-empty`). Sales · Spend are shown inline as secondary. |
| Overview panel chips empty | Pass | `DESK_PANEL_RAIL_BY_ADMIN_PATH["/app"] = []`. The test asserts `deskPanelChipsForPath("/app")` and `("/demo")` are `[]`. Orders/Customers chips unchanged. |
| No "Look here first" on Overview | Pass | `rg` finds none in the Overview components or routes. |
| Site v44 stamp | Pass | `mcfly-version` = `v44` and `mcfly-build` = `aesthetic-light-sky-v44` on index/pricing/demo/about. The duplicate `mcfly-build` meta is removed. All `?v=` keys are bumped to `20260922v44`. |
| Site home first viewport | Pass | `is-mono` is dropped from `<body>`. `hero--v44` replaces the stacked v23/v25/v31 classes. The mono SAMPLE figcaption is removed, but SAMPLE stays inside the frame (`ov-still__sample` chip + `aria-label`). One product frame. Locked H1 is present (`Spend next to real Shopify sales` ×4). |
| Pricing | Pass | The mono `honest-line` apology strip is removed. One plan card with a 2px radius and no shadow. The trial/$39/uninstall copy still appears in the meta description and plan. |
| Tokens | Pass | `--sky #0284c7`, `--sky-soft #eef6fb`, `--sky-ink #0369a1`, `--mute #5f6b78` are added. Sky is used only for focus, kicker, SAMPLE chip and brand span. No dark mode, glow, or purple. |

## Locks (must not regress)

| Lock | Result |
| --- | --- |
| From orders | Unchanged (not touched; site still says `From orders`) |
| Snowdevil $68,457 | Unchanged on site hero still. Demo data is not touched. |
| Empty spend `—` | Held. `roasValue === "—"` renders muted; never 0×. |
| `SCOPES` | `read_orders,read_customers,read_all_orders`. `fly.toml` is not in the diff. |
| `MCFLY_SAMPLE_ONLY` | `"true"`. Not in the diff. |
| No `read_reports` | Held |
| Overview first fold, no "Shopify Total Sales" | Held. The only hit is a pre-existing code comment in `app._index.tsx:554` and it does not render. |
| Prisma / billing / sales-facts | Not in the diff |
| Invented reviews / install counts | None |

## Tests

- `cd app && npx vitest run`: **169 files / 2004 tests pass.**
- `tsc --noEmit`: 27 errors, **identical count on the base `a47be4f`**. This is existing type debt (e.g. `orderBookDepth` on `OverviewDepthPeeks`, Orders/Customers first-viewport props). None of it is introduced by v44 and it does not block this ship. Worth one later cleanup.

## Non-blocking notes (do not re-open craft for these)

1. **Spend empty state: first-run guidance is probably dead code.** The `emptyLiveSpend` block used to render the "Empty spend is not a certified $0 … Type yesterday — that $X/day continues … No ad-account login." helper and the `spendUploadEmptyFinding()` strip above the add panel. Both are removed from that block. The only remaining copy lives in the `!emptyLiveSpend` lane, and there `strangerEmpty` (which implies no spend) is probably always false. A brand-new merchant now sees `—` + `HONEST_MER_LINE` + the add panel, without the "$X/day continues / no ad login" reassurance. The religion still holds, but the onboarding line is lost. **Suggested one-line follow-up:** put the stranger sentence back as a `mcfly-spend-plane__hint` when `strangerEmpty`.
2. **Two add CTAs when spend is empty.** The plane's "Upload spend" link points to `#mcfly-spend-add`, which sits directly below. This is harmless, but the plan said one primary CTA. Consider hiding the link when `emptyLiveSpend` (the panel is the CTA).
3. **The Overview hero and the MTD YoY row say the same thing.** The hero is "This month vs last year" and the right column's first row is MTD YoY. This is intended ("YoY on the same beat"), but if the browser pass shows it echoing, drop MTD from the first-beat column only.
4. **Two-column first beat breakpoint is `52rem`.** Embedded Admin at ~1000–1100px will be two columns. Take one screenshot in the Conductor browser pass to confirm the hero $ still dominates and the YoY column does not crowd it.
5. `buildOrdersLeadPeeks` is now used only by tests. Leave it or delete it later.
6. The `embed === "yoy"` demo path still renders no YoY cards. This is unchanged from base (the old lane was also behind `embed ? null`), so it is not a regression.

## Smoke (Conductor, after merge + Pages + Fly)

```bash
git rev-list --left-right --count HEAD...origin/cursor/spend-trust-recurring   # 0 0 after merge

# site
curl -s https://mcflyads.com/ | rg -o 'mcfly-version" content="v44'
curl -s https://mcflyads.com/ | rg -o 'aesthetic-light-sky-v44'
curl -s https://mcflyads.com/ | rg -c "Spend next to real Shopify sales"      # ≥1
curl -s https://mcflyads.com/ | rg -c 'ov-still__sample">SAMPLE'                # 1
curl -s https://mcflyads.com/ | rg -n "Click for detail|still says ad spend|is-mono"   # none
curl -s https://mcflyads.com/pricing | rg -c "honest-line"                      # 0
curl -s https://mcflyads.com/pricing | rg -o 'mcfly-version" content="v44'

# desk
curl -s -o /dev/null -w "%{http_code}\n" https://mcfly-analytics.fly.dev/health   # 200
curl -s https://mcfly-analytics.fly.dev/demo > /tmp/demo.html
rg -c "From orders" /tmp/demo.html                  # ≥1
rg -c 'This month is \$68,457' /tmp/demo.html        # ≥1
rg -c -F "Shopify Total Sales" /tmp/demo.html       # 0
rg -c "Look here first" /tmp/demo.html              # 0
rg -c "mcfly-overview-first-beat" /tmp/demo.html    # 1
rg -c "mcfly-yoy--soft" /tmp/demo.html              # 0
rg -c "mcfly-kpi--soft" /tmp/demo.html              # 0 preferred; residual below fold OK if documented

# config drift
~/.fly/bin/flyctl config show -a mcfly-analytics | rg "SCOPES|MCFLY_SAMPLE_ONLY"
# expect read_orders,read_customers,read_all_orders · "true"
```

**Browser (once):** `/demo` Overview fold at ~1100px and ~390px, plus the home hero on desktop and mobile. Only re-open if the hero $ is not the dominant object on the fold.

Not deployed or merged by the critic. No reviews invented.
