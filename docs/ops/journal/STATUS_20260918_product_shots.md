# STATUS — product shots capture · 2026-09-18

**Lane:** Site Capture  
**Source:** https://mcflyads.com/demo `#dd-desk`  
**Tool:** Playwright Chromium · viewport 1440×900 · `deviceScaleFactor` 2  
**SAMPLE lock:** Snowdevil · spend **$19,023** · sales **$68,457** · Total ROAS **3.60×** · BE **2.50×** @ 40%  
**Did not touch:** `index.html`, `mcfly.css`, `demo.html`, `app/**`, Fly, Pages, commit

## Result: PASS

| Path | Bytes | Dim (px @2×) | Subject |
| --- | ---: | --- | --- |
| `site/assets/product-shots/01-overview.png` | 329,617 | 2208×1800 | Overview YoY + KPI row + Shopify-five |
| `site/assets/product-shots/02-total-roas.png` | 286,028 | 2208×1594 | Spend optional · Ad spend / Total ROAS / BE |
| `site/assets/product-shots/03-goals.png` | 133,938 | 2208×822 | Goals tab chrome + sales / ROAS / BE |
| `site/assets/product-shots/04-customers-ltv.png` | 294,791 | 2208×1650 | Returning dollars + 90-day LTV row |

All four PNGs **≥ 80KB**. Real desk UI (tables/KPI rows/nav), not homepage marketing wells.

## Artifacts

- `site/assets/product-shots/README.md`
- `site/assets/product-shots/manifest.json`
- `site/scripts/capture-demo-product-shots.mjs`
- `site/scripts/capture-demo-product-shots.sh`

## Recapture

```bash
npx playwright install chromium   # once if missing
node site/scripts/capture-demo-product-shots.mjs
```

## Handoff

Site Homepage v23 / Demo chrome can mount these four paths. Capture lane idle.
