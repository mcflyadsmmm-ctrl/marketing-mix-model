# App Store listing — Mcfly Analytics

This is the source of truth for public Shopify App Store copy. Paste the fields
exactly as written.

## Truth locks

- Lead with Shopify sales and order insights. Spend is optional.
- Spend can be typed or imported by CSV.
- **Total ROAS = Shopify Total Sales ÷ spend for the same period.**
- Mcfly does not use pixels, MTA, path credit, or ad-platform-attributed sales.
- Harbor Home Co is clearly labeled **SAMPLE** data:
  **$82,068 sales ÷ $23,414 spend = 3.51×**.
- One plan only: **Mcfly Analytics**. **7-day free trial, then $39/month.**
- `read_all_orders` is live in scopes (with `read_orders` + `read_customers`) so multi-year order history can backfill once Partner-approved tokens grant it.
- Do not add reviews, ratings, customer quotes, or install counts.

## Partner Dashboard paste blocks

### Title / app name

```text
Mcfly Analytics
```

### Subtitle (54 characters)

```text
Deeper Shopify sales numbers beyond standard Analytics
```

### App introduction (95 characters)

```text
See Shopify sales, customer mix, goals, and LTV first. Add spend only when you want Total ROAS.
```

### Description (472 characters)

```text
Mcfly starts with deeper Shopify order numbers: Total Sales after returns, orders, AOV, new vs returning sales, goals, and cohort LTV. Explore sales without entering spend. To calculate Total ROAS, type spend or import a daily CSV: Shopify Total Sales ÷ spend for the same period. Optional margin adds break-even. Harbor Home Co SAMPLE: $82,068 sales ÷ $23,414 spend = 3.51×; sample data is not your store. No pixels, MTA, or path credit. 7-day free trial, then $39/month.
```

### Feature bullets (all under 80 characters)

Paste one line per feature field, in this order:

```text
Explore Shopify Total Sales after returns, orders, and AOV
Compare new vs returning sales, goals, period pace, and cohort LTV
Add spend only when needed: type it or import a daily CSV
Total ROAS = Shopify Total Sales ÷ spend for the same period
Optional margin adds break-even — 7-day trial, then $39/month
```

### Category

Select:

```text
Marketing and conversion → Marketing analytics
```

If that exact taxonomy is unavailable, select the closest **Marketing
analytics** category. Do not use Advertising, Attribution, Store design, or a
sales-channel category.

### Category notes / rationale

```text
Sales-first Shopify order analytics with optional merchant-entered or CSV spend. Total ROAS is blended Shopify Total Sales ÷ spend; Mcfly does not provide attribution, pixels, MTA, ad delivery, or ad-platform OAuth.
```

### Pricing

| Partner field | Paste / select |
| --- | --- |
| Plan name | `Mcfly Analytics` |
| Trial | `7 days` |
| Recurring price | `$39 USD every 30 days` |
| Number of plans | `1` |
| External charges | `No` |

Merchant-facing pricing sentence:

```text
7-day free trial, then $39/month.
```

Do not use **Free**, **Pro**, or a second plan name.

### Search terms

Paste as separate terms if Partner provides individual fields:

```text
Shopify sales analytics
customer sales
cohort LTV
Total ROAS
break-even ROAS
```

### Works with

Leave blank. Mcfly is an embedded Shopify Admin app and does not ship a
Checkout UI extension or claim ad-platform partnerships.

## Supporting Partner fields

| Field | Value |
| --- | --- |
| Primary language | English |
| Support email | `mcflyadsmmm@gmail.com` |
| Website | `https://mcflyads.com` |
| Privacy policy | `https://mcflyads.com/privacy` |
| Support | `https://mcflyads.com/support` |
| FAQ | `https://mcflyads.com/faq` |
| Terms | `https://mcflyads.com/terms` |
| App URL | `https://mcfly-analytics.fly.dev` |
| Demo store | Leave blank |

The App URL remains the Fly app URL. Do not replace it with the marketing site.

## Media copy lock

Any listing media that shows sample data must use:

```text
Harbor Home Co · SAMPLE preview · not your store
$82,068 Shopify sales
$23,414 entered spend
3.51× Total ROAS
```

Do not upload media with stale 4.41×, 4.42×, or 4.45× sample values. Do not use
Free/Pro pricing screenshots. See [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md).

## Reviewer note

```text
Mcfly is useful before a merchant enters spend: Shopify order data powers Total Sales after returns, orders, AOV, new vs returning sales, goals, and cohort LTV. Spend is optional and can be typed or imported by daily CSV. When spend is present, Total ROAS is Shopify Total Sales ÷ spend for the same period. An optional contribution margin adds break-even. Mcfly does not use pixels, MTA, path credit, or ad-platform-attributed sales. Harbor Home Co is clearly labeled SAMPLE preview data and is not the merchant's store data. One plan: Mcfly Analytics. 7-day free trial, then $39/month.
```
