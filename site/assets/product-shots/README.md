# Product shots — Snowdevil SAMPLE desk

Real UI captures from [`https://mcflyads.com/demo`](https://mcflyads.com/demo) (`#dd-desk`). Not marketing KPI wells. Not fabricated logos/reviews.

## SAMPLE lock

| Metric | Value |
| --- | --- |
| Shop | Snowdevil |
| Entered spend | $19,023 |
| Shopify sales | $68,457 |
| Total ROAS | 3.60× |
| Break-even | 2.50× @ 40% |

## Files

| File | Subject |
| --- | --- |
| `01-overview.png` | Overview — full desk still (source) |
| `02-total-roas.png` | Spend optional panel — Ad spend / Total ROAS / Break-even |
| `03-goals.png` | Goals tab — month sales + optional Total ROAS |
| `04-customers-ltv.png` | Returning dollars + Orders / 90-day LTV compact |
| `hero-core.png` | v27 hero — 6 complete scoreboard cards, no sliced YoY |
| `hero-core-phone.png` | v27 390 crop — sales + typical + returning, closed bottoms |
| `row-roas.png` | Feature row — Spend optional $19,023 / 3.60× / 2.50× |
| `row-goals.png` | Feature row — Goals tab SAMPLE |
| `row-yoy.png` | Feature row — complete This month / quarter / year |
| `row-shopify.png` | Feature row — typical / returning / LTV peek |
| `micro-yoy.png` | Proof tile — one YoY card |
| `micro-typical.png` | Typical order / returning dollars cluster |
| `micro-spend.png` | Spend optional MER strip |
| `micro-roas.png` | Isolated 3.60× Total ROAS well |
| `micro-goals.png` | Goals numbers, no tab rail |
| `micro-ltv.png` | Orders / weekend / days to second / 90-day LTV |

Capture settings: viewport **1440×900**, `deviceScaleFactor` **2** (≈2× PNG). See `manifest.json` for byte sizes + timestamp.

## Recapture

```bash
# one-time
npm i -D playwright && npx playwright install chromium

# from marketing-mix-model/
node site/scripts/capture-demo-product-shots.mjs
# or
./site/scripts/capture-demo-product-shots.sh

# local site server
DEMO_URL=http://127.0.0.1:8788/demo node site/scripts/capture-demo-product-shots.mjs
```

Site Homepage / Demo chrome lanes consume these paths. Capture lane does not edit `index.html` / `mcfly.css` / `demo.html`.
