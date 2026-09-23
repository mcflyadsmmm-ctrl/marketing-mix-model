# Phase D critic (re-Ship): `cursor/rebuild-v43` @ 5e865cc vs `origin/cursor/spend-trust-recurring` @ 92a278b

Opus pass, 2026-09-22 ~20:50 MT. The prior HOLD at efc78be named three blockers: B1 (redirect loop), B1b (`__manifest` 301) and B2 (Shopify Total Sales on `/demo`). This pass checked them against the code, the pure helper, and a **local production build served by `scripts/serve-with-site.mjs` on :3999**. Nothing is deployed or merged.

## 1. Verdict: **Ship**

All three blockers are closed. Evidence is below. **Conductor may merge PR #204, then deploy Pages and Fly from spend-trust-recurring.**

## 2. Blockers: none

**B1 (closed).** The `serve-with-site.mjs` middleware (lines 165–181) now runs in this order: `isShopifyAppPath`, `isFlyTrustPath`, `/assets/`, `shouldSkipMarketingSite` (302 to `/app`), then the marketing 301. `shouldSkipMarketingSite` (`shopify-app-path.mjs:152–157`) only returns true for embedded query or iframe requests, and those only reach it after app paths have already passed through. Local curl results:
- `/app` 200 (no loop). `/demo` 200. `/demo/orders` 200. `/privacy`, `/support` and `/terms` all 200.
- `/?shop=example.myshopify.com&host=abc` gives 302 to `/app?shop=…&host=…`. `/` with `Sec-Fetch-Dest: iframe` gives 302 to `/app`.
- `/` and `/pricing` give 301 to `https://mcflyads.com/…`.
- `/health` passes straight through to the route. Locally it returned **503** only because no database is attached (`health.tsx` runs `SELECT 1`). It does not redirect. On Fly it must be 200.

**B1b (closed).** `isShopifyAppPath` now includes `/__manifest` (line 42). Locally, `/__manifest?p=%2Fdemo%2Forders&version=x` returns **204**, the same as live today. `flyRouteDecision` returns `next` for every app, trust and asset path, `app302` for `/` with shop/host, embedded or iframe, and `marketing301` for `/`, `/pricing` and `/faq`.

**B2 (closed).** On the locally rendered `/demo` HTML (481 KB):
- 0 matches: `Shopify Total Sales`, `Look here first`, `Live is parked`, `Click for detail`, `108,666`
- 1 match: `From orders`, `This month is $68,457`, `Orders YTD`
- `OVERVIEW_PENDING_IN_TOTAL_SALES` and `OVERVIEW_SHOP_NOT_COMPANY` are no longer referenced by `OverviewFirstViewport.tsx`. They survive only in `book-coverage-honesty.test.ts`.

**Config (unchanged).** `SCOPES = "read_orders,read_customers,read_all_orders"` is set in `fly.toml:17` and in all three `shopify.app*.toml`. There is no `read_reports`. `MCFLY_SAMPLE_ONLY = "true"` (`fly.toml:23`).

**Tests.** The four targeted files (fly-trust-pages, shopify-app-path, public-sample-demo, book-coverage-honesty) pass, 37 tests. The Conductor reports the full suite at 2004 passing.

## 3. Non-blocking notes

- **Done-bar item 3 is only partly met: the sub-nav chips "YoY glance" and "Mix close" still render above the hero on `/demo`.** They come from `DeskPanelRail` (`DeskTopTabs.tsx:64`, `desk-panel-rail.ts:17–22`). This is not a regression, because live Fly shows the same rail today. It is plan item D3 ("Kill dual nav"), which is still open. Next Desk lane fix: drop the `/app` entry in `DESK_PANEL_RAIL_BY_ADMIN_PATH`, or skip `<DeskPanelRail />` on Overview, and update `desk-nav.test.ts:126/211`. The smoke curl below expects **1** for each until then.
- **The plan §6 `0×` curl gives a false positive.** A literal `rg -F "0×"` matches `3.60×` in the YoY year board. A regex for a bare `0×` (not preceded by a digit, `.` or `,`) finds **0**. Use the corrected check below.
- **`flyRouteDecision` duplicates the middleware order instead of being called by it.** Today they match, but they can drift. Next time `serve-with-site.mjs` is edited, have the middleware switch on `flyRouteDecision(req.path, req.query, req.headers)`.
- **Must-fix before Live is unparked:** with L2 still pending, Live Total ROAS sales read as pending because every SalesDayFact is now uncertified. The numerator must come from the order book until L2. This doesn't matter while SAMPLE_ONLY is true.
- **FAQ wording** ("Shopify Total Sales ÷ ad spend") still conflicts with the Spend wording ("Shopify sales ÷ entered spend"). Worth a later tidy.
- **Site v43 spot-check.** The stamp is v43 and `Spend next to real Shopify sales` appears on index. There is no "trial includes 24 months" on index, pricing or faq. The pricing 90-day/24-month line is present. `docs/APP_STORE_LISTING.md` uses "90 closed days / up to 24 months", which is consistent.

## 4. Smoke curls the Conductor must pass

**Post-merge, pre-deploy**

```bash
cd "/Users/martysmithson/Documents/MCFLY ANALYTICS APP/marketing-mix-model"
git fetch -q origin && git rev-list --left-right --count HEAD...origin/cursor/spend-trust-recurring   # 0 0 on spend-trust-recurring
rg -n "read_reports" app/shopify.app.toml app/shopify.app.public.toml app/shopify.app.custom.toml fly.toml   # none
```

**Post-deploy (Pages + Fly from the same commit)**

```bash
~/.fly/bin/flyctl releases -a mcfly-analytics | head -3                                             # new vNNN > v445
curl -s -o /dev/null -w "%{http_code}\n" https://mcfly-analytics.fly.dev/health                     # 200 (not 302, not 503)

# site
curl -s https://mcflyads.com/ | rg -o 'mcfly-version" content="v4[3-9]'                              # v43+
curl -s https://mcflyads.com/ | rg -c "Spend next to real Shopify sales"                            # ≥1
curl -s https://mcflyads.com/ | rg -c 'apps.shopify.com/mcfly-analytics-public'                     # ≥1
curl -s https://mcflyads.com/ | rg -c '\$68,457'                                                     # ≥1
curl -s https://mcflyads.com/ | rg -n 'still says ad spend|Click for detail|108,666|Live is parked' # none
for p in / /pricing /faq /demo; do curl -s "https://mcflyads.com$p" | rg -n -i "trial includes 24 months"; done   # none
curl -s https://mcflyads.com/pricing | rg -c "Trial includes 90 days of order history; paid includes up to 24 months"   # ≥1

# Fly front door
curl -sI https://mcfly-analytics.fly.dev/ | rg -i "^(HTTP|location)"                 # 301 → https://mcflyads.com/
curl -sI https://mcfly-analytics.fly.dev/pricing | rg -i "^location"                 # https://mcflyads.com/pricing
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://mcfly-analytics.fly.dev/?shop=example.myshopify.com&host=abc"   # 302 → …/app?shop=…
for p in /privacy /support /terms /demo /demo/orders /health; do curl -s -o /dev/null -w "$p %{http_code}\n" "https://mcfly-analytics.fly.dev$p"; done   # all 200
curl -s -o /dev/null -w "/app %{http_code} %{redirect_url}\n" https://mcfly-analytics.fly.dev/app   # NOT 302 → …/app (B1)
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://mcfly-analytics.fly.dev/__manifest?p=%2Fdemo%2Forders&version=x"   # 204, no mcflyads.com (B1b)

# /demo first screen
curl -s https://mcfly-analytics.fly.dev/demo > /tmp/demo.html
rg -c "From orders" /tmp/demo.html                  # ≥1
rg -c 'This month is \$68,457' /tmp/demo.html       # ≥1
for s in "Look here first" "Live is parked" "Shopify Total Sales" "Click for detail" "108,666"; do printf "%s: " "$s"; rg -c -F "$s" /tmp/demo.html || echo 0; done   # all 0 (B2)
rg -c -P '(?<![0-9.,])0×' /tmp/demo.html || echo 0  # 0 (bare 0×; plain -F "0×" false-hits 3.60×)
for s in "Mix close" "YoY glance"; do printf "%s: " "$s"; rg -c -F "$s" /tmp/demo.html || echo 0; done   # 1 each = rail chip only (D3 follow-up); >1 = regression

# config did not drift
~/.fly/bin/flyctl config show -a mcfly-analytics | rg -n "SCOPES|MCFLY_SAMPLE_ONLY"   # no read_reports; SAMPLE_ONLY "true"

# sitemap has no redirect sources
curl -s https://mcflyads.com/sitemap.xml | rg -o '<loc>[^<]+' | sed 's/<loc>//' | while read u; do curl -s -o /dev/null -w "%{http_code} $u\n" "$u"; done | rg -v "^200"   # none
```

**Manual check before restamping the board.** Open the app from a dev store's Admin and click Overview, then Orders, then Spend. Each tab must navigate client-side with no reload loop and no error boundary. That proves `/__manifest` and `/app.data` work inside the iframe.
