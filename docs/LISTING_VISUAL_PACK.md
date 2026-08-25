# Listing visual pack — convert installs (Free Submit)

**Copy SoT:** [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md)  
**Designer playbook:** [`CURSOR_DESIGNER_PLAYBOOK.md`](./CURSOR_DESIGNER_PLAYBOOK.md)  
**Human clicks:** [`SUBMIT_NOW.md`](./SUBMIT_NOW.md)

---

## Conversion thesis (craft, not TW clones)

Premium analytics listings win when:

1. **Shot 1 = outcome** — Shopify sales next to the spend you added
2. **Shot 2 = definition** — sales ÷ spend labeled so merchants “get it” in 2 seconds
3. **Shot 3 = how data gets in** — **Add spend** one field (billboard / typed extra), not a CSV sermon
4. **Shot 4 = LTV** — payback Shopify Analytics does not compute
5. **Shot 5 = Goals** — year board worth the paid plan
6. **Polaris-native**, clean KPI density — never dashboard soup
7. **3–6 unique** ~1600×900 shots; no browser chrome; no near-duplicates (4.4.4 / 4.4.5)
8. **Realistic data** — empty states kill installs

Refuse for shots: marketing-site captures, pixel/ROAS theater UI, TW-clone clutter.

---

## Demo data for shots (built in)

1. Open app → **Demo** tab  
2. Click **Load 3-year sample desk** (matched sales + spend)  
3. Click **Turn sample desk ON**  
4. Capture with shot mode (hides sample banner): add `shot=1` to the URL  
5. **After uploads:** Demo → **Turn sample desk OFF** (required before live smoke / reviewer)

---

## Capture session on `devmcflyads`

Exact Admin capture script for the five listing PNGs. **No marketing-site captures. No browser chrome.**

### Admin capture script (copy / follow in order)

Store: **`devmcflyads`** (Admin slug). App: **Mcfly Analytics** (embedded iframe only).

```text
A. OPEN
   1. https://admin.shopify.com/store/devmcflyads/apps
   2. Open Mcfly Analytics (stay inside Admin iframe — not mcflyads.com)

B. SAMPLE DESK ON (required for filled shots)
   3. Address bar → paste app path /app/demo  (Demo is NOT in primary nav — intentional)
      Full: https://admin.shopify.com/store/devmcflyads/apps/<app-handle>/app/demo
      Or from Cash MER empty foot: “Load the sample desk”
   4. Click Load 3-year sample desk
   5. Click Turn sample desk ON
   6. Confirm yellow SAMPLE banner appears on Cash MER (proof sample is live)

C. SHOT MODE + CAPTURE (hide SAMPLE banner; metrics stay sample)
   Tooling: macOS Screenshot → Capture Selected Portion, or CleanShot.
   Crop ~1600×900 of the APP BODY only (no Admin left nav, no OS menubar, no URL bar).

   Shot 1 — outcome
     Navigate: /app?period=y3&shot=1
     Frame: decision strip + 4-up KPI grid; period “3 yr” visible; sales next to spend
     Exclude: equation panel
     Save: docs/listing-assets/shots/01-cash-mer-vs-breakeven.png
     Caption: Shopify sales next to the spend you added

   Shot 2 — definition (MUST look unlike shot 1 — 4.4.4)
     Navigate: /app?period=mtd&shot=1
     Frame: ONLY mcfly-panel--eq (Sales ÷ spend rows)
     Exclude: hero MER tile + decision strip
     Period tab must show MTD (not 3 yr)
     Save: docs/listing-assets/shots/02-sales-div-spend.png
     Caption: Sales ÷ spend — the formula this desk uses
     QA: side-by-side vs shot 1 — if same big MER position, re-crop

   Shot 3 — Add spend (billboard / typed extra)
     Navigate: /app/spend?shot=1
     Frame: **Add spend** card (`#mcfly-spend-add`) — amount + date + channel; Billboards chip on
     Exclude: collapsed CSV details if they crowd the crop
     Save: docs/listing-assets/shots/03-spend-csv.png
     Caption: Add a billboard or any platform in one field

   Shot 4 — LTV
     Navigate: /app/ltv?period=mtd&shot=1
     Frame: cohort LTV tiles + caption that 30/90/365d ≠ period Cash CAC
     Save: docs/listing-assets/shots/04-allocation-call.png
     Caption: LTV and payback Shopify Analytics does not show

   Shot 5 — Goals
     Navigate: /app/goals?period=mtd&shot=1
     Frame: PeriodControl + this period vs goal + year board (Practice ON is OK for filled board)
     Save: docs/listing-assets/shots/05-margin-breakeven.png
     Caption: Full-year Goals board next to this period

D. SAMPLE OFF (mandatory before smoke / reviewer)
   7. /app/demo → Turn sample desk OFF
   8. Cash MER should no longer show SAMPLE banner

E. ICON
   Partner App icon: docs/listing-assets/mcfly-app-icon-1200.png
   (1200×1200, M-only ribbon — not the Mcfly Ads wordmark)
```

### Path cheat-sheet

| # | App path + query | Save as |
| --- | --- | --- |
| 1 | `/app?period=y3&shot=1` | `docs/listing-assets/shots/01-cash-mer-vs-breakeven.png` |
| 2 | `/app?period=mtd&shot=1` | `docs/listing-assets/shots/02-sales-div-spend.png` |
| 3 | `/app/spend?shot=1` | `docs/listing-assets/shots/03-spend-csv.png` |
| 4 | `/app/ltv?period=mtd&shot=1` | `docs/listing-assets/shots/04-allocation-call.png` |
| 5 | `/app/goals?period=mtd&shot=1` | `docs/listing-assets/shots/05-margin-breakeven.png` |

---

## Assets in repo

| File | Use |
| --- | --- |
| `docs/listing-assets/mcfly-app-icon-1200.png` | Partner **App icon** — ribbon **M** only (not the Mcfly Ads wordmark) |
| `docs/listing-assets/mcfly-ads-lockup-source.png` | Full lockup source (M + Mcfly Ads) — marketing only |
| `docs/listing-assets/shots/` | Listing screenshot PNGs — **founder pack 2026-07-28** (see `shots/CAPTIONS.md`) |
| Brand mark sizes | `site/assets/brand/mcfly-m.png` (+ 32/64/128/256) |

### Founder pack status (2026-07-28)

| # | File | Status |
| --- | --- | --- |
| 1 | `01-total-roas-vs-breakeven.png` | **Ready** — KPI board (Sales / Spend / Total ROAS) |
| 2 | `02-explorer-sales-div-spend.png` | **Ready** — Explorer (sales ÷ spend + channel mix) |
| 3 | `03-margin-breakeven.png` | **Ready** — Break-even lock from margin |
| 4 | `04-free-pro-pricing.png` | **DO NOT UPLOAD** — plan prices in the image violate 4.2.2. Use Allocation / Spend UI instead. |
| 5 | `05-spend-csv.png` | **DO NOT UPLOAD** until recaptured — July mock still says other platforms are on Pro (1.1.4). Recapture Goals or Add spend from live Admin. |

Captions + upload order: [`listing-assets/shots/CAPTIONS.md`](./listing-assets/shots/CAPTIONS.md).

---

## Screenshot story — order = conversion funnel

Capture from **embedded Admin** iframe only. Crop to ~**1600×900**. No browser chrome, no OS menubar.

| # | Caption (paste under shot) | URL path | Show this |
| --- | --- | --- | --- |
| 1 | Shopify sales next to the spend you added | `/app?period=y3&shot=1` | **Outcome frame:** KPI tiles (sales, spend, Total ROAS). Period **3 yr** visible in shot mode. |
| 2 | Sales ÷ spend — the formula this desk uses | `/app?period=mtd&shot=1` | **Definition frame:** `Sales ÷ spend` rows. Period **MTD**. Must look unlike shot 1 for 4.4.4. |
| 3 | Add a billboard or any platform in one field | `/app/spend?shot=1` | **Add spend** card: amount + date + channel / Billboards chip |
| 4 | LTV and payback Shopify Analytics does not show | `/app/ltv?period=mtd&shot=1` | Cohort LTV + caption that windows ≠ period Cash CAC |
| 5 | Full-year Goals board next to this period | `/app/goals?period=mtd&shot=1` | PeriodControl + year board |

**Why this order converts:** outcome → trust the math → prove billboard/offline in one field → LTV is why they pay → Goals board is why they pay. Recapture live Admin; existing founder-pack PNGs may still show the old CSV/allocation story until retaken.

### Shot 1 vs shot 2 — 4.4.4 uniqueness (mandatory)

Shopify rejects **near-duplicate** screenshots. These are **different compositions**, not a period swap on the same crop.

| | Shot 1 | Shot 2 |
| --- | --- | --- |
| **Merchant question** | “Am I above break-even?” | “What is cash MER, exactly?” |
| **DOM focus** | Decision strip + 4-up KPI grid | Equation panel (`Sales ÷ spend` rows: total sales, ÷ spend, = MER) |
| **Period tab** | **3 yr** | **MTD** (proves period control without cloning shot 1) |
| **Must NOT appear** | — | Hero MER tile dominating frame; same crop as shot 1 |
| **Caption proves** | Break-even vs MER at a glance | Formula honesty — sales ÷ spend, not platform ROAS |

After capture, side-by-side the PNGs: if both show the big MER number in the same position, re-crop shot 2 to the equation panel only.

**Upload runbook:** icon + filenames + sample OFF → [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) §D.

### Caption hygiene

- Lead with the merchant win (“Cash MER vs break-even”), not the screen name  
- Never say attribution, pixel, or “true revenue”
- Never put plan prices ($ / mo) in captions or in the PNG (4.2.2)
- Never use “the first”, “the best”, or “the only” (4.3.3 / 4.3.4)
- Keep each caption unique (Shopify rejects near-duplicate shots + captions)

---

## Still human-only

1. Distribution → Shopify App Store  
2. PCD questionnaire  
3. Install smoke with sample **OFF**  
4. Upload icon + 5 shots · Pricing **Free** · paste reviewer notes  
5. Publish Pages trust URLs · Submit  
