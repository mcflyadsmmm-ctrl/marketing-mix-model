# Rebuild spec — one publish (2026-09-22)

**Implement this file only.** `REVAMP_SPEC.md` is superseded. Do not Partner Submit. Do not invent reviews or install counts. Do not `fly deploy` from a worker. Reviews, blank FUNNEL, and ads OFF are not gates.

**Sources:** `05` through `12` in this folder. Where they conflict, this file wins.

## Conflict this file resolves

`06` wants the Overview hero to be **Shopify Total Sales** year over year. `11` and `12` say Analytics Total / Net / Gross and ShopifyQL New/Returning stay an em dash until PCD Level 2. Level 2 is **pending**.

**Lock:** The first screen’s dollar hero is **orders on file**, labeled **From orders**, never “matches Analytics” and never a `SalesDayFact` sum. Analytics day clocks stay **—** until Level 2. Empty is **—**, never `$0` and never `0×`.

## What a stranger must feel

Open the site or the Admin Overview and see one morning number: this period versus the same days last year, from orders, plus three facts. Spend is a later chapter. Nobody is apologized to in the first viewport.

## App — Overview first screen (Desk)

Job: am I up or down versus last year, and is the book healthy, before any spend is typed.

### Composition (one plane, not a card grid)

```
[shop · period · freshness]          one meta row; SAMPLE is a small chip on /demo only
────────────────────────────────
THIS MONTH                         ↑ 12% vs last year
$X
same days last year $Y
From orders

Returning $A · Typical order $B · Weekend C%
────────────────────────────────
[orders-by-day chart, last 30 days, caption "Orders"]
```

Canonical sentence the hero must be readable as, with live numbers:

**This month is $X — up N% vs the same days last year.**

### Formulas (OrderFact only — do not write these into SalesDayFact)

- **Hero $X:** sum of order amounts in the selected window (same amount the desk already treats as order value after returns, if that field exists).
- **Prior $Y and delta:** the same window shifted one year. If that prior window has no orders on file, delta is **—** and the line is “Last year not on file.” Never +∞% off a fake $0 prior.
- **Returning $:** sum of amounts on orders after that customer’s first order on file. Guests are never returning. This is **not** ShopifyQL New/Returning.
- **Typical order:** median order amount in the window.
- **Weekend:** weekend amount ÷ window amount when enough days exist; otherwise **—**.

Chart series is the same order-book day sums for display. Caption **Orders**. Do not upsert those sums as `shopifyql_sales_day_v1` or leave legacy zero `SalesDayFact` rows looking certified.

### Must disappear from the Overview first fold

Spend, Total ROAS, MER, CPA, “Look here first,” Analytics-contrast essays, “Live is parked until launch,” click-for-detail homework, the white soft KPI grid, and any blanking of median / returning / weekend because `salesPending` or SalesDayFact coverage is empty.

If the order book for the window is actually empty, the hero is **—** and the line is “Orders still loading — not $0.”

### Other tabs (first fold only, same publish)

- **Orders:** hero is typical (median) order, mean as a quiet foil. Days to second and 2+ items share may sit under that hero. Do not lead with a scoreboard.
- **Customers:** hero is returning dollars versus new dollars from the order book.
- **Spend:** unchanged religion. Total ROAS = sales ÷ entered spend only when spend &gt; 0; otherwise **—**. Not on Overview.
- **Goals:** do not let a second board sit above the sales figure. If time is short, leave Goals below the fold rather than inventing a new Goals product.

### Desk refuse

Pixels, sessions, conversion, “true ROAS,” “matches Shopify Analytics,” order-sum fallback **into** `SalesDayFact`, and painting poisoned zero day-facts as a complete sales year.

## Site — first screen (Site)

Headline (locked): **Spend next to real Shopify sales.**

Subhead (locked): **Median ticket and returning dollars from orders you already have. Type spend later for Total ROAS — empty stays —.**

No ShopifyQL in that subhead. No “Analytics does not show.”

### Hero composition

- Wordmark **Mcfly Analytics** reads as the brand, not a tiny nav token.
- One primary **Install** to `https://apps.shopify.com/mcfly-analytics-public`. One ghost **Try the demo**.
- One price line: **7-day trial, then $39/store/mo.**
- One framed still of the new Overview composition (this month vs last year, returning, typical order, weekend). It is not the current interactive KPI collage and it does not say “Click for detail.”
- SAMPLE is a small label on that frame. Use figures already in the Snowdevil sample fixture. Do not invent a new revenue number, and do not present sample dollars as a live merchant.

### Not in the hero

Reviews 0, “App Store card still says ad spend,” competitor prices, monospace proof chips (`REVIEWS 0`, `NO PIXEL`), FAQ links, em-dash theology, “Live is parked until launch.”

### Rest of the home, still one publish

- A plain sentence row, not status chips: no pixel and no ad login; trial includes 90 days of order history and paid includes up to 24 months; $39 after 7 days and uninstall stops the charge.
- A short “before you type a dollar” section: Overview, Orders, Customers.
- A short Total ROAS section: Shopify sales ÷ spend you entered; empty is —; not a pixel.
- Price close: one plan, $39, install. No competitor table on the home page.
- Reviews 0, listing lag, and “not Analytics day totals” move to FAQ or the footer, once each.

Pricing page: one plan, $39, 7-day trial, 90-day trial history vs 24 months once paid. It must not read as an internal memo (“screenshot this”).

Demo page: SAMPLE is a frame around a real desk, not an apology that the product is parked.

## Listing (Marty only — not this code publish)

Chosen tagline to paste later, when Marty clicks Save:

`Shopify Analytics skips YoY, typical order, returning dollars, and LTV`

Workers do not open Partner Dashboard and do not upload shots.

## Publish bar

1. `/demo` Overview first screen reads as the sentence above, from orders, with no soft KPI grid and no spend tile.
2. Homepage first screen is the locked headline, one Install, one price line, and a still of that desk — no Reviews 0 sticker.
3. Neither surface says the live app is parked, claims ShopifyQL parity, or shows empty spend as `0×`.

## Lanes

| Lane | Owns | Must not |
| --- | --- | --- |
| Desk | `marketing-mix-model/app/app/**` | `site/**`, Fly deploy, Partner |
| Site | `marketing-mix-model/site/**` | `app/**`, Partner, `wrangler --branch` |
