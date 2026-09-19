# Listing visual pack — convert installs (one-plan resubmit)

**Copy SoT:** [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md)  
**Designer playbook:** [`CURSOR_DESIGNER_PLAYBOOK.md`](./CURSOR_DESIGNER_PLAYBOOK.md)  
**Human clicks:** [`RESUBMIT_PLAN.md`](./RESUBMIT_PLAN.md)

---

## Conversion thesis (craft, not TW clones)

Premium analytics listings win when:

1. **Shot 1 = Overview YoY** — this month / quarter / year vs last year, typical order, chart
2. **Shot 2 = Customers** — returning dollars and guest checkouts at $0 spend
3. **Shot 3 = Orders** — weekend share, busiest weekday, order range (Shopify-depth)
4. **Shot 4 = LTV** — 30 / 90 / 365-day new-buyer value
5. **Shot 5 = Total ROAS chips** — Yesterday / last N / this month / quarter / year; empty spend is an em dash
6. **Operator KPI cards** — white operator KPI cards on paper/sky; do not crop charcoal marketing collage. Crop the **cards**, not empty chrome. Tokens: [`ops/MCFLY_WELL_TOKENS.md`](./ops/MCFLY_WELL_TOKENS.md).
7. **3–6 unique** ~1600×900 shots; no browser chrome; no near-duplicates (4.4.4 / 4.4.5)
8. **Live evidence** — **Marty recapture** after Fly ships wells. Captions + crop focus updated 2026-09-18 in [`listing-assets/shots/CAPTIONS.md`](./listing-assets/shots/CAPTIONS.md). PNG pixels were **not** recaptured yet (Marty-only Admin).

Refuse for shots: marketing-site / `/demo` SAMPLE captures as live product, pixel/ROAS theater UI, TW-clone clutter, Profit Agent / P&L heroes.

**Visual PASS before upload:** white operator KPI cards on paper/sky readable at 1600×900; do not crop charcoal marketing collage; hero KPI dominates; empty = —; no spend on Overview shot.

---

## Data mode for shots

**Marty recapture:** hard-refresh the embedded app on Fly **331** (or current production). Admin is **Live-only** — there is no Sample|Live Settings door. Do **not** capture https://mcflyads.com/demo SAMPLE for App Store stills. The listing must show the product a merchant opens, including Total ROAS chips with empty spend as an em dash (not 0×).

---

## Capture session on `devmcflyads`

Exact Admin capture script for the five listing PNGs. **No marketing-site captures. No browser chrome.**

### Admin capture script (copy / follow in order)

Store: **`devmcflyads`** (Admin slug). App: **Mcfly Analytics** (embedded iframe only).

```text
A. OPEN
   1. https://admin.shopify.com/store/devmcflyads/apps
   2. Open Mcfly Analytics (stay inside Admin iframe — not mcflyads.com)

B. LIVE ADMIN (required)
   3. Confirm Admin shows live store orders (not the public /demo SAMPLE).
   4. No SAMPLE DATA watermark. Do not use mcflyads.com/demo for listing stills.

C. SHOT MODE + CAPTURE
   Tooling: macOS Screenshot → Capture Selected Portion, or CleanShot.
   Crop ~1600×900 of the APP BODY only (no Admin left nav, no OS menubar, no URL bar).

   Shot 1 — Overview YoY
     Navigate: /app?period=mtd&shot=1
     Frame: this month / quarter / year vs last year + typical-order KPIs + sales chart
     Exclude: Total ROAS chips (those are shot 5)
     Save: docs/listing-assets/shots/01-total-roas-vs-breakeven.png
     Caption: See this month, quarter, and year vs last year plus typical order

   Shot 2 — Customers
     Navigate: /app/customers?period=mtd&shot=1
     Frame: returning dollars + guest checkouts + repeat depth
     Save: docs/listing-assets/shots/02-explorer-sales-div-spend.png
     Caption: Follow returning dollars and guest checkouts with no spend required

   Shot 3 — Orders
     Navigate: /app/orders?period=mtd&shot=1
     Frame: weekend share + busiest weekday + most-orders range
     Save: docs/listing-assets/shots/03-margin-breakeven.png
     Caption: See weekend share, busiest weekday, and the range most orders land

   Shot 4 — LTV
     Navigate: /app/customers?period=mtd&shot=1&panel=ltv
     Frame: 30 / 90 / 365-day new-buyer value
     Save: docs/listing-assets/shots/04-allocation-call.png
     Caption: Follow new-buyer value at 30, 90, and 365 days from Shopify orders

   Shot 5 — Total ROAS chips
     Navigate: /app/spend?shot=1&panel=roas
     Frame: certified windows Yesterday / last N / this month / quarter / year
     Empty spend: em dash, never 0×. At goal / Below goal vs Settings target.
     Save: docs/listing-assets/shots/05-margin-breakeven.png
     Caption: Total ROAS is honest MER—At goal vs target; empty spend is an em dash

D. ICON
   Partner App icon: docs/listing-assets/mcfly-app-icon-1200.png
   (1200×1200, M-only ribbon — not the Mcfly Ads wordmark)
```

### Path cheat-sheet

| # | App path + query | Save as |
| --- | --- | --- |
| 1 | `/app?period=mtd&shot=1` | `docs/listing-assets/shots/01-total-roas-vs-breakeven.png` |
| 2 | `/app/customers?period=mtd&shot=1` | `docs/listing-assets/shots/02-explorer-sales-div-spend.png` |
| 3 | `/app/orders?period=mtd&shot=1` | `docs/listing-assets/shots/03-margin-breakeven.png` |
| 4 | `/app/customers?period=mtd&shot=1&panel=ltv` | `docs/listing-assets/shots/04-allocation-call.png` |
| 5 | `/app/spend?shot=1&panel=roas` | `docs/listing-assets/shots/05-margin-breakeven.png` |

---

## Assets in repo

| File | Use |
| --- | --- |
| `docs/listing-assets/mcfly-app-icon-1200.png` | Partner **App icon** — ribbon **M** only (not the Mcfly Ads wordmark) |
| `docs/listing-assets/mcfly-ads-lockup-source.png` | Full lockup source (M + Mcfly Ads) — marketing only |
| `docs/listing-assets/shots/` | Listing screenshot PNGs — **founder pack 2026-07-28**; **Marty recapture** for Fly 318 (see `shots/CAPTIONS.md`) |
| Brand mark sizes | `site/assets/brand/mcfly-m.png` (+ 32/64/128/256) |

### Founder pack status (2026-07-28) — still stale vs Fly 318

| # | File | Status |
| --- | --- | --- |
| 1 | `01-total-roas-vs-breakeven.png` | **Marty recapture** — replace Total ROAS / Fly 238 Overview with Fly 318 Live-data Overview YoY |
| 2 | `02-explorer-sales-div-spend.png` | **Marty recapture** — replace formula / Explorer / Buyers with Customers |
| 3 | `03-margin-breakeven.png` | **Marty recapture** — replace break-even / Timing with Orders |
| 4 | `04-free-pro-pricing.png` | **DO NOT UPLOAD** — plan prices in the image violate 4.2.2. Upload overwritten `04-allocation-call.png` (LTV) instead. |
| 5 | `05-spend-csv.png` | **DO NOT UPLOAD** — July mock says other platforms are on Pro (1.1.4). Upload overwritten `05-margin-breakeven.png` (Total ROAS chips) instead. |

Captions + upload order: [`listing-assets/shots/CAPTIONS.md`](./listing-assets/shots/CAPTIONS.md).

---

## Screenshot story — order = conversion funnel

Capture from **embedded Admin** iframe only. Crop to ~**1600×900**. No browser chrome, no OS menubar.

| # | Caption (paste under shot) | URL path | Show this |
| --- | --- | --- | --- |
| 1 | See this month, quarter, and year vs last year plus typical order | `/app?period=mtd&shot=1` | **Overview YoY:** this month / quarter / year vs last year, typical order, chart |
| 2 | Follow returning dollars and guest checkouts with no spend required | `/app/customers?period=mtd&shot=1` | **Customers:** returning dollars, guest checkouts (works at $0 spend) |
| 3 | See weekend share, busiest weekday, and the range most orders land | `/app/orders?period=mtd&shot=1` | **Orders:** weekend mix, busiest weekday, most-orders range |
| 4 | Follow new-buyer value at 30, 90, and 365 days from Shopify orders | `/app/customers?period=mtd&shot=1&panel=ltv` | **LTV:** 30 / 90 / 365-day new-buyer value |
| 5 | Certified Total ROAS chips—At goal vs target; empty spend is an em dash | `/app/spend?shot=1&panel=roas` | **Total ROAS chips:** certified windows; em dash when spend is empty |

**Why this order converts:** Shopify Analytics depth first → inspect customers → inspect orders → LTV → optional Total ROAS chips. Every capture must come from **Live Admin** after operator white cards ship. Crop **white operator KPI cards on paper/sky**; do not crop charcoal marketing collage (per CAPTIONS). **Marty recapture** — PNG pixels not yet done.

### Screenshot uniqueness (mandatory)

Shopify rejects **near-duplicate** screenshots. Each shot uses a different Fly 318 report and merchant question. Side-by-side all five before upload; if two crops could be mistaken for the same screen, reframe around that report’s hero and drill rows.

**Upload runbook:** icon + filenames + Live data on → [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) §D.

### Caption hygiene

- Lead with the merchant win, not only the screen name
- Never say attribution, pixel, or “true revenue”
- Never put plan prices ($ / mo) in captions or in the PNG (4.2.2)
- Never use “the first”, “the best”, or “the only” (4.3.3 / 4.3.4)
- Keep each caption unique (Shopify rejects near-duplicate shots + captions)

---

## Still human-only

1. Distribution → Shopify App Store  
2. PCD questionnaire  
3. Hard-refresh production Admin (Fly after wells ship); crop white operator KPI cards on paper/sky; do not crop charcoal marketing collage  
4. Upload icon + 5 shots · Pricing **one plan $39 + 7-day trial (no Free)** · paste reviewer notes  
5. Publish Pages trust URLs · Submit (Marty) 
