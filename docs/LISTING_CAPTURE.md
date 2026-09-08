# App Store listing capture — Partner screenshots

**Religion unchanged:** Total ROAS = Shopify sales ÷ spend. No pixels / MTA.

Use **listing-capture mode** so Admin shots look like the live product desk — no yellow SAMPLE banner, no Sample | Real toggle, no SAMPLE corner badge. Metrics may still be SAMPLE numbers (filled desk). Merchant SAMPLE honesty is unchanged when this mode is **off**.

## Turn it on

Append **`?listing=1`** to any desk route (aliases: `?shot=1`, `?capture=1`).

Most reliable: Demo → **Listing shots** links (in-app navigation keeps the flag).  
`sessionStorage` re-attaches `listing=1` if Shopify Admin drops the query on iframe hops.

## Turn it off (required before review / live merchants)

Open any desk URL with **`?listing=0`**, or Demo → **Exit listing capture**.

Leave SAMPLE **OFF** on the review store after you finish shots.

## Five Partner shots (~1600×900)

Crop the **embedded app body only** — no Admin left nav, no DEV-store chrome, no OS menubar, no URL bar. Letterbox to **1600×900**.

Load SAMPLE first if you need filled numbers: Demo → **Load 3-year sample desk** → **Turn sample desk ON** → then open these URLs.

| # | Shot | App path (paste after the Admin app handle) | Frame |
| --- | --- | --- | --- |
| 1 | **Overview** | `/app?period=mtd&listing=1` | Total ROAS vs break-even + KPI board |
| 2 | **Spend** | `/app/spend?listing=1` | Platforms → export daily → combine |
| 3 | **Goals** | `/app/goals?listing=1` | Sales goals / pace board |
| 4 | **LTV / customers** | `/app/ltv?period=mtd&listing=1` | Acquisition + cohort / LTV desk |
| 5 | **Allocation** | `/app/allocation?period=mtd&listing=1` | Mix + portfolio Total ROAS call |

Admin example (dev store):

```text
https://admin.shopify.com/store/devmcflyads/apps/<app-handle>/app?period=mtd&listing=1
https://admin.shopify.com/store/devmcflyads/apps/<app-handle>/app/spend?listing=1
https://admin.shopify.com/store/devmcflyads/apps/<app-handle>/app/goals?listing=1
https://admin.shopify.com/store/devmcflyads/apps/<app-handle>/app/ltv?period=mtd&listing=1
https://admin.shopify.com/store/devmcflyads/apps/<app-handle>/app/allocation?period=mtd&listing=1
```

After Fly deploy, the same paths work on `https://mcfly-analytics.fly.dev` inside Admin (do not screenshot the bare Fly origin).

## Filled Live instead of SAMPLE

1. SAMPLE **OFF** (`Real store` / Demo → turn preview off).
2. Confirm margin on Settings.
3. Upload real (or review-store) spend CSV on Spend.
4. Open the five URLs above — listing-capture still hides empty-state / first-session chrome.
5. If tiles are empty, use SAMPLE for filled metrics (this mode does not relabel them as live).

## Honesty

| Mode | What merchants see |
| --- | --- |
| SAMPLE on, listing-capture **off** | Yellow SAMPLE preview banner + ` · SAMPLE` ctx — required honesty |
| SAMPLE on, listing-capture **on** | Product desk chrome only. Numbers may be SAMPLE. No yellow bar. |
| SAMPLE off | Live (or empty) desk. Listing-capture only hides setup chrome. |

Do **not** Partner Submit from this note. Captions: [`listing-assets/shots/CAPTIONS.md`](./listing-assets/shots/CAPTIONS.md). Visual pack: [`LISTING_VISUAL_PACK.md`](./LISTING_VISUAL_PACK.md).
