# Worker prompt — tab uninstall audit (spawn ONLY after Desk + Research return)

Do **not** spawn while [Desk busy-shop backfill](4fe554f8-6c7b-4df0-acb4-cc3a64d803ff) holds `app/app/lib/order-facts*` / job-queue / CashTrustBanners, or while [Competitor uninstall research](242489d2-f50f-4f08-aa7c-a87e917a3958) holds `docs/ops/research/2026-09-15-*.md`.

Work from: `/Users/martysmithson/Documents/MCFLY ANALYTICS APP/marketing-mix-model` on `cursor/spend-trust-recurring`.

You are the **tab uninstall audit** lane. Super-critical. Founder fear: any friction, disappointment, inaccuracy, or a **spend wall on first open** causes uninstalls. This is a big 11-tab app — **one weak tab is enough**.

## Read first

- `docs/LIVING_BOARD.md`
- `docs/plans/2026-09-15-TAB_LOCK.md`
- `docs/ops/research/2026-09-15-competitor-uninstall-signals.md`
- `docs/ops/research/2026-09-15-shopify-analytics-gaps.md`
- `docs/ops/research/2026-09-15-tab-vs-complaints.md`
- `docs/plans/2026-09-15-uninstall-retention.md`

If the three research files are missing, **stop** and return blocked — do not invent complaints.

## Laws

- Listing https://apps.shopify.com/mcfly-analytics-public · 7-day then **$39** · Mcfly reviews **0** (never invent).
- Total ROAS = Shopify Total Sales ÷ entered spend. Empty spend is **—** not 0×.
- Never paint pending / truncated / ~60-day-missing sales as **$0**.
- No pixels, MTA, OAuth, Klaviyo, `read_all_orders`, 12th tab, fly deploy, commit, `git add -A`.
- Cursor does not Partner Submit.

## First-session path you must walk in the code

Merchant installs → opens Admin with **zero typed spend** → Overview, Customers, Growth, Orders, LTV must each feel **deeper than Shopify Analytics** in the first minutes → only then is Spend Upload the easy door (type a day / CSV / recurring) → Total ROAS, Allocation, CPA.

If any Shopify-five page greets with “add spend to see anything useful,” that is **P0 uninstall**.

## Do

Read-only the live routes + their section components (do not edit `app/**`):

`app._index.tsx` · `app.customers.tsx` · `app.growth.tsx` · `app.orders.tsx` · `app.ltv.tsx` · `app.spend.tsx` (and spend upload components) · `app.roas.tsx` · `app.allocation.tsx` · `app.yoy.tsx` · `app.cpa.tsx` · `app.goals.tsx` · `app.settings.tsx` · `app.tsx` nav · `OverviewFirstViewport` · `OverviewYoyCards` · `OverviewSalesChart` · `ShopifyBookSection` · `CertifiedScoreboard` · `SpendExplorer` · `CashTrustBanners` · `mcfly-desk.css` enough to judge density vs three-thin-stats.

Score **every** analysis tab + Settings **1–5** on:

1. First 10 seconds (is the job obvious?)
2. Useful at **$0 spend** (Shopify five must be 4–5 or P0)
3. Accuracy / honesty (—, 60-day, truncated, SAMPLE vs Live)
4. Depth vs the native Shopify report it replaces (typical/median, returning **dollars**, weekend, LTV 30/90/365, YoY)
5. Click-for-detail / charts / icon chips — unimpressive = fail
6. Next action (without a spend wall on Shopify five)

For each tab write: what paints · what is missing vs TAB_LOCK · spend wall Y/N · lie risk (0× / $0 / sealed incomplete) · P0 / P1 / later / Refuse.

## Write only

`docs/ops/research/2026-09-15-tab-uninstall-audit.md`

## Return to Conductor

- Ranked P0 uninstall list (max 7)
- Which Shopify five tabs are the retention moat vs native Analytics
- Whether Spend Upload easiness is the door-uninstall (or not yet)
- Files written
