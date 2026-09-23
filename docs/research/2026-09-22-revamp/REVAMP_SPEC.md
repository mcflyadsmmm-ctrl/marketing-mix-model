# Mcfly revamp spec — 2026-09-22

**SUPERSEDED.** This file is a cleanup list, not the revamp. Founder rejected it: the live app and site are not good enough, and this spec mostly defends them (compress copy, don’t densify, keep the current look). Do not implement it. Next spec is written only after waves 2–3.

**Phase S v1.** Sources: `01`–`04`. Conductor judgment was too kind.  
**Goal:** One published step-change that beats ~400 micro-PRs. Not another densify wave.

**Publish bar:** a stranger on the App Store and on mcflyads.com sees the same product: Shopify sales depth at **$0 spend**, spend optional and honest, no Analytics-parity lie while PCD L2 is pending.

## White space

Mcfly owns the **$39 Shopify-only morning desk**: deeper than native Analytics on the order book (median, weekend mix, opaque LTV), honest when spend is empty, calmer than Lifetimely / Peel / Polar, without becoming an attribution suite.

## Aesthetic (one paragraph each)

**App.** Operator white KPI cards, calm type, sky only on period controls. Overview is sales YoY + typical order + an open sales chart — **no** spend or ROAS on that first fold. Orders lead with median and weekend. Customers lead with returning dollars and LTV. Spend is last: formula visible, empty spend is **—**. Density is a morning scoreboard, not a SaaS cockpit.

**Site.** Paper/sky, ribbon M, black **Install**, outline **Try the demo**. First fold is one job, one SAMPLE desk, price, two CTAs. Caveats, Reviews 0, and competitor prices sit below the fold. No monospace status stickers in the hero. No ShopifyQL-as-live claim until L2 is approved.

## Eight ships (this revamp only)

| # | Ship | Why it beats another micro-PR | L2? | Who |
| ---: | --- | --- | --- | --- |
| 1 | **Certified sales facts only.** Read paths ignore legacy `shopify_order_current_total_v1` zeros. Finish the uncommitted overwrite so gaps refill when QL works. | Stops Live painting a hollow book as complete | Filter ships now. Correct totals wait on L2 | Desk |
| 2 | **$0-spend first fold from the order book.** When day totals are blocked, Overview still shows median, weekend mix, returning dollars, YoY structure. Sales clocks that need ShopifyQL stay **—**, labeled, not $0. | The job merchants keep the app for, without a pixel or QL | No | Desk |
| 3 | **Site first fold.** Compress hero to job + one desk + Install/Demo. Move Reviews 0 and the “listing still says ad spend” chip below the fold (or drop the chip after Marty Saves). | Install path stops teaching doubt | No | Site |
| 4 | **One history sentence everywhere.** Billing truth: trial Live ingest **90 closed days**; paid order rows **up to 24 months**. Site, FAQ, pricing, and listing paste must match `docs/BILLING_TIERS.md`. Listing paste that says “trial includes 24 months” is wrong. | Day-1 trust; kills 90 vs 24mo split | No | Site + paste pack |
| 5 | **De-QL the public promise.** Site must not say Live returning dollars “sit next to ShopifyQL” as if QL is running. Say order-book now; Analytics-aligned day totals when reports access is approved. | Stops the overpromise the audit found on v42 | No | Site |
| 6 | **Spend stays the door, not the greeting.** Empty spend is **—**. Total ROAS formula on Spend. No blank 0.00× on Overview. Do not add a new Spend panel. | Matches uninstall research: spend walls kill day 0 | No | Desk (verify, don’t densify) |
| 7 | **Sales-first listing pack, ready to Save.** Align `LISTING_LIVE_PASTE.md` to ships 2–5 (sales-first, 90-day trial / 24-month paid, no QL parity, reviews 0). Gallery note: five Live Admin shots, Overview YoY first, zero spend in the crop — not `/demo` SAMPLE. Cursor does not Submit or upload shots. | App Store is the install path; site and card currently fight | No | Conductor docs; Marty Save + shots |
| 8 | **Restamp SoT after publish.** Living Board + workspace `EXECUTION.md` to the Fly version and site version that actually shipped, plus this spec’s open gates. | Stops the next chat shipping against v30/Fly 396 while live is v42/Fly 445 | No | Conductor |

## Explicit refuse (do not build in Phase P)

- Pixels, MTA, Meta/Google OAuth, “true ROAS,” sessions, conversion rate
- ShopifyQL / Analytics day-total **parity claims** while PCD L2 is pending
- New LTV panels, shareable-card packs, Product→LTV densify, chart easing, CSS sweeps
- GMV or order-volume pricing, a Free plan, a second paid tier
- Invented reviews, install counts, or FUNNEL numbers
- Ads ON
- Partner Submit (Marty Save only)
- Restarting research or a fifth parallel lane

## Publish definition of done

1. Fly `/health` 200 after the desk deploy that includes ships 1, 2, and 6.
2. https://mcflyads.com first fold matches ships 3 and 5; history sentence matches ship 4.
3. `/demo` still SAMPLE; it is not presented as the merchant’s shop.
4. Listing paste file matches ships 4, 5, and 7. Live App Store card changes only after Marty Saves.
5. No page claims ShopifyQL parity.
6. Board and EXECUTION name the versions just deployed.
7. Reviews stay **0** until the founder’s outreach earns them.

## Phase P lanes (after this spec is accepted)

| Lane | Model | Owns | Must not |
| --- | --- | --- | --- |
| Desk | `composer-2.5-fast` for edits; Conductor (Grok 4.7) for honesty calls | `app/app/**` ships 1, 2, 6 + tests | `site/**`, Fly deploy, listing Submit |
| Site | `composer-2.5-fast` | `site/**` ships 3, 4, 5 | `app/**` TSX, `wrangler --branch` |
| Conductor | This chat | Merge, Fly from `marketing-mix-model/` on `cursor/spend-trust-recurring`, Pages from a non-git temp copy, ship 7–8, live curls | Org-chart fleet, Job Search, trading |

## Marty taps (not agent blockers)

1. PCD L2 fields when Shopify approves them — then one backfill, not a new research wave.
2. Partner **Save** of the updated listing paste (and delete Free / rename Pro if still present). Recapture five Live Admin shots with Overview YoY first — not SAMPLE `/demo` stills.
3. Optional Admin Result on `devmcflyads`: Overview at $0 spend shows order-book depth; sales clocks are **—** if QL is denied; Spend is not 0.00×.

## Not in this revamp

Competitor “Today’s read” rebuilds, shareables, and site aesthetic micro-passes beyond the first-fold compress. Those are the next publish only if this one is live and a merchant stays.
