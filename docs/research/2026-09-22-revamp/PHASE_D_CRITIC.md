# Phase D critic — `cursor/rebuild-v43` @ efc78be vs `origin/cursor/spend-trust-recurring` @ 92a278b

Opus pass, 2026-09-22 ~20:40 MT. Branch is 5 ahead / 0 behind origin (fast-forward merge). Live at probe time: site **v42**, Fly **v445**. That's expected before the deploy, and nothing below is live yet.

## 1. Verdict: **HOLD**

The site, the listing honesty work, the Overview first screen, the config locks, and the sales-facts change all pass. **Do not deploy Fly** until B1 and B2 are fixed. B1 would take the Admin app and `/health` down. Pages could ship alone, but plan §4 wants both from one commit, so fix first and ship both.

## 2. Blockers (fix before Pages/Fly)

**B1. The new Fly middleware redirects every app path to `/app`, and `/app` redirects to itself forever.**
In `app/scripts/serve-with-site.mjs` (lines 165–180), `shouldSkipMarketingSite(req)` now runs *before* `isShopifyAppPath`. `shouldSkipMarketingSite` returns true for any app path (`shopify-app-path.mjs:137`). I ran the committed helpers and got:
- `/app` → 302 `/app` (a redirect loop inside Shopify Admin for every paying install)
- `/health` → 302 `/app`. Fly's health check uses `path = "/health"` (`fly.toml:46`), so the machine goes unhealthy or the deploy fails.
- `/demo`, `/demo/*`, `/auth/*`, `/webhooks` GET → 302 `/app`

Fix: put `if (isShopifyAppPath(req.path)) return next();` first, as the old code did, and only then the `shouldSkipMarketingSite` 302.

**B1b. `/__manifest` would be 301'd to mcflyads.com.**
React Router 7.18 uses lazy route discovery, and live Fly answers `/__manifest` today with 204. After this change, every in-app client navigation (`/app` tabs, `/demo` tabs) would fetch cross-origin and fail. Fix: keep `/__manifest` on Fly (for example, add it to `isShopifyAppPath` or add an explicit skip). Also add one **behavioral** test that runs the middleware or a pure `flyRouteDecision(path, query, headers)` over `/`, `/pricing`, `/app`, `/health`, `/demo`, `/__manifest`, `/privacy` and `/?shop=…`. The current `fly-trust-pages.test.ts` only checks that strings appear in the file, which is why this passed.

**B2. `/demo` HTML still contains "Shopify Total Sales", which fails done-bar item 3 and the §6 curl.**
- `OverviewFirstViewport.tsx:377–379` always renders a `hidden` `<p>` with `OVERVIEW_PENDING_IN_TOTAL_SALES` and `OVERVIEW_SHOP_NOT_COMPANY`. Both strings say "Shopify Total Sales" (`overview-first-viewport.ts:27–31`). Hidden text is still in the HTML, and it contradicts the **From orders** lock. Delete the paragraph.
- `demo._index.tsx:231` renders `OverviewYoyCards`, which prints `Shopify Total Sales YTD …` (`OverviewYoyCards.tsx:244`; same wording in `overview-yoy.ts:190`). Relabel it as order-book YTD, for example "Orders YTD $X — from orders on this shop."

After the fix, `curl …/demo | rg -c -F "Shopify Total Sales"` must be 0.

## 3. Non-blocking notes

- **Config is clean.** `SCOPES` is `read_orders,read_customers,read_all_orders` in `fly.toml` and in all three `shopify.app*.toml` files, with no `read_reports`. `MCFLY_SAMPLE_ONLY = "true"` is unchanged. `read_reports` appears in the diff only in docs and comments.
- **Site hero matches REBUILD_SPEC.** Locked headline and subhead, one Install button to the listing, a ghost "Try the demo", one price line, and a SAMPLE Snowdevil still ($68,457 / $69,891 / $631 / $45,409 / 23%). The "↓ 2%" is correct (−2.05%). There is no Reviews-0 sticker and no "Click for detail". The 90-day / 24-month wording is correct on index, pricing and faq. No sitemap URL is a `_redirects` source. The stamp is v43.
- **Sales-facts read path.** `isCertifiedSalesDayFact` now rejects every source except `shopifyql_sales_day_v1`. That is correct against "legacy zeros must not look certified", but with L2 pending, **every Live shop's SalesDayFact is uncertified**. As a result, `salesPending` stays true, the Spend-tab Total ROAS numerator will read as pending/— for Live, and "Orders still loading — not $0." can appear under a populated order hero. `overviewGreetingPending` does bail out when `orderCount > 0`, so the hero itself is fine. This doesn't matter while SAMPLE_ONLY is true. Before unparking Live, it is a **must-fix**: Total ROAS sales should come from the order book until L2. Backfill now also retries every legacy day on each run. Confirm the ShopifyQL ACCESS_DENIED path fails fast so it doesn't cost cron time.
- **`_index/route.tsx` redirect** to mcflyads.com is only a fallback, because the middleware wins first. It's fine.
- **Redirect caching.** Browsers cache a 301 no matter what `Cache-Control: max-age=300` says, so a rollback won't un-redirect `fly.dev/` for people who already hit it. That's acceptable. `/favicon.ico` and `/brand/*` from `app/public` now 301 to mcflyads.com. No app code references them, so that's fine.
- **FAQ** still says "Total ROAS = Shopify Total Sales ÷ ad spend" (meta and body). REBUILD_SPEC allows this on FAQ, but it conflicts with the Spend wording ("Shopify sales ÷ entered spend"). Worth a later tidy.
- **Other `/demo` strings.** "Look here first" is suppressed (`hint=""`), and "Mix close" and "YoY glance" live only in the rail chips. Still check them with the §6 curl, because the rendered HTML is the only proof.
- The six targeted test files pass (81 tests), but none of them would catch B1 or B2.

## 4. Smoke curls the Conductor must pass

**Pre-Fly (local, after the B1/B2 fix and `npm run build` in `app/`).** Start `node scripts/serve-with-site.mjs` on `PORT=3999`, then:

```bash
for p in / /pricing /app /health /demo /demo/orders /privacy /__manifest "/?shop=example.myshopify.com&host=abc"; do curl -s -o /dev/null -w "$p %{http_code} %{redirect_url}\n" "http://localhost:3999$p"; done
# expect: / and /pricing 301 → https://mcflyads.com/…; /health 200; /demo 200; /privacy 200;
#         /app NOT 302 → /app (200 or auth redirect); /__manifest NOT → mcflyads.com; /?shop=… 302 → /app?shop=…
curl -s http://localhost:3999/demo | rg -c -F "Shopify Total Sales"   # 0
```

**Post-deploy.** Every line of plan §6, plus the B1, B1b and B2 checks at the end:

```bash
cd "/Users/martysmithson/Documents/MCFLY ANALYTICS APP/marketing-mix-model"
git fetch -q origin && git rev-list --left-right --count HEAD...origin/cursor/spend-trust-recurring   # 0 0
~/.fly/bin/flyctl releases -a mcfly-analytics | head -3                                             # new vNNN > v445
curl -s -o /dev/null -w "%{http_code}\n" https://mcfly-analytics.fly.dev/health                     # 200 (not 302)

# site
curl -s https://mcflyads.com/ | rg -o 'mcfly-version" content="v4[3-9]'                              # v43+
curl -s https://mcflyads.com/ | rg -c "Spend next to real Shopify sales"                            # ≥1
curl -s https://mcflyads.com/ | rg -c 'apps.shopify.com/mcfly-analytics-public'                     # ≥1
curl -s https://mcflyads.com/ | rg -c '\$68,457'                                                     # ≥1
curl -s https://mcflyads.com/ | rg -n 'still says ad spend|Click for detail|108,666|Live is parked' # none
for p in / /pricing /faq /demo; do curl -s "https://mcflyads.com$p" | rg -n -i "trial includes 24 months"; done   # none
curl -s https://mcflyads.com/pricing | rg -c "Trial includes 90 days of order history; paid includes up to 24 months"   # ≥1

# Fly is the app, not the site
curl -sI https://mcfly-analytics.fly.dev/ | rg -i "^(HTTP|location)"                 # 301 → https://mcflyads.com/
curl -sI https://mcfly-analytics.fly.dev/pricing | rg -i "^location"                 # https://mcflyads.com/pricing
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://mcfly-analytics.fly.dev/?shop=example.myshopify.com&host=abc"   # 302 → /app?...
for p in /privacy /support /terms /demo /health; do curl -s -o /dev/null -w "$p %{http_code}\n" "https://mcfly-analytics.fly.dev$p"; done   # all 200
curl -s -o /dev/null -w "/app %{http_code} %{redirect_url}\n" https://mcfly-analytics.fly.dev/app   # NOT 302 → .../app (B1)
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://mcfly-analytics.fly.dev/__manifest?p=%2Fdemo%2Forders&version=x"   # not → mcflyads.com (B1b)

# /demo first screen
curl -s https://mcfly-analytics.fly.dev/demo > /tmp/demo.html
rg -c "From orders" /tmp/demo.html                  # ≥1
rg -c 'This month is \$68,457' /tmp/demo.html       # ≥1
for s in "Look here first" "Live is parked" "Mix close" "YoY glance" "Shopify Total Sales" "Click for detail" "0×" "108,666"; do printf "%s: " "$s"; rg -c -F "$s" /tmp/demo.html || echo 0; done   # all 0 (B2)

# config did not drift
~/.fly/bin/flyctl config show -a mcfly-analytics | rg -n "SCOPES|MCFLY_SAMPLE_ONLY"   # no read_reports; SAMPLE_ONLY "true"
rg -n "read_reports" app/shopify.app.toml app/shopify.app.public.toml app/shopify.app.custom.toml fly.toml   # none

# sitemap has no redirect sources
curl -s https://mcflyads.com/sitemap.xml | rg -o '<loc>[^<]+' | sed 's/<loc>//' | while read u; do curl -s -o /dev/null -w "%{http_code} $u\n" "$u"; done | rg -v "^200"   # none
```

After that, do one manual check before restamping the board: open the app from a dev store's Admin and click Overview → Orders → Spend. The tabs must navigate without a reload loop or an error boundary.
