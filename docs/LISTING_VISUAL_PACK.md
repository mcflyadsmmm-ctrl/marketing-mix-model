# Listing visual pack — convert installs

**Copy SoT:** [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md)  
**Designer playbook:** [`CURSOR_DESIGNER_PLAYBOOK.md`](./CURSOR_DESIGNER_PLAYBOOK.md)  
**Human clicks:** [`SUBMIT_NOW.md`](./SUBMIT_NOW.md)

**Recapture lock (2026-08-26):** Human must recapture all listing shots. Old Free/Pro screenshots are **stale**. Show **Sample data | Live data** chrome, Spend **three doors**, history label *Daily spend by channel, back to January 2021*. Never Free vs Pro plan shots. Never put $39 in PNGs or captions (4.2.2).

---

## Conversion thesis (craft, not TW clones)

Premium analytics listings win when:

1. **Shot 1 = outcome** — Shopify sales next to the spend you added (hero: see ad spend next to sales, day by day)
2. **Shot 2 = definition** — sales ÷ spend labeled so merchants “get it” in 2 seconds
3. **Shot 3 = how data gets in** — Spend three doors (template / type period / Ads Manager CSV), not a CSV sermon alone
4. **Shot 4 = LTV** — payback Shopify Analytics does not compute (whole desk — not a gated upsell frame)
5. **Shot 5 = Goals** — year board on the same desk
6. **Polaris-native**, clean KPI density — never dashboard soup
7. **3–6 unique** ~1600×900 shots; no browser chrome; no near-duplicates (4.4.4 / 4.4.5)
8. **Realistic data** — empty states kill installs

Refuse for shots: marketing-site captures, pixel/ROAS theater UI, TW-clone clutter, Free vs Pro pricing UI.

---

## Demo data for shots (built in)

1. Open app → use **Sample data | Live data** at the top  
2. Switch to **Sample data** (example numbers) for filled shots  
3. Capture with shot mode: add `shot=1` to the URL  
4. **After uploads:** switch to **Live data** before live smoke / reviewer

---

## Capture session on `devmcflyads`

Exact Admin capture script for the five listing PNGs. **No marketing-site captures. No browser chrome.**

### Admin capture script (copy / follow in order)

Store: **`devmcflyads`** (Admin slug). App: **Mcfly Analytics** (embedded iframe only).

```text
A. OPEN
   1. https://admin.shopify.com/store/devmcflyads/apps
   2. Open Mcfly Analytics (stay inside Admin iframe — not mcflyads.com)

B. SAMPLE DATA ON (required for filled shots)
   3. Confirm Sample data | Live data toggle at the top of the desk
   4. Switch to Sample data (example numbers)
   5. Confirm Sample data label is visible (proof example numbers are live)
   Optional Demo path if needed:
      https://admin.shopify.com/store/devmcflyads/apps/<app-handle>/app/demo

C. SHOT MODE + CAPTURE (hide mode chrome where shot=1 does; metrics stay sample)
   Tooling: macOS Screenshot → Capture Selected Portion, or CleanShot.
   Crop ~1600×900 of the APP BODY only (no Admin left nav, no OS menubar, no URL bar).

   Shot 1 — outcome
     Navigate: /app?period=y3&shot=1
     Frame: decision strip + 4-up KPI grid; sales next to spend; Sample|Live chrome ok if subtle
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

   Shot 3 — Spend three doors
     Navigate: /app/spend?shot=1
     Frame: Spend doors — pick channels → template; type channel + amount + period;
            Ads Manager CSV. Show Billboards / typed extra if visible.
     Exclude: collapsed noise that crowds the crop
     Save: docs/listing-assets/shots/03-spend-csv.png
     Caption: Three Spend doors — template, type, or Ads Manager CSV
     Also show / crop caption-friendly: Daily spend by channel, back to January 2021

   Shot 4 — LTV
     Navigate: /app/ltv?period=mtd&shot=1
     Frame: cohort LTV tiles + caption that 30/90/365d ≠ period Cash CAC
     Save: docs/listing-assets/shots/04-allocation-call.png
     Caption: LTV and payback Shopify Analytics does not show

   Shot 5 — Goals
     Navigate: /app/goals?period=mtd&shot=1
     Frame: PeriodControl + this period vs goal + year board (Sample data OK for filled board)
     Save: docs/listing-assets/shots/05-margin-breakeven.png
     Caption: Full-year Goals board next to this period

D. LIVE DATA (mandatory before smoke / reviewer)
   7. Toggle Sample data | Live data → Live data
   8. Cash MER should no longer show example-numbers banner

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
| `docs/listing-assets/shots/` | Listing screenshot PNGs — **recapture required 2026-08-26** |
| Brand mark sizes | `site/assets/brand/mcfly-m.png` (+ 32/64/128/256) |

### Founder pack status (2026-08-26)

| # | File | Status |
| --- | --- | --- |
| 1 | `01-total-roas-vs-breakeven.png` | **RECAPTURE** — Sample \| Live chrome; spend next to sales |
| 2 | `02-explorer-sales-div-spend.png` | **RECAPTURE** — formula frame |
| 3 | `03-margin-breakeven.png` | **RECAPTURE** or replace with Goals/Spend doors as ordered above |
| 4 | `04-free-pro-pricing.png` | **DO NOT UPLOAD** — plan prices in the image violate 4.2.2. Free vs Pro is dead. |
| 5 | `05-spend-csv.png` | **DO NOT UPLOAD** until recaptured — show Spend three doors + 5-year history label |

Captions + upload order: [`listing-assets/shots/CAPTIONS.md`](./listing-assets/shots/CAPTIONS.md).

---

## Screenshot story — order = conversion funnel

Capture from **embedded Admin** iframe only. Crop to ~**1600×900**. No browser chrome, no OS menubar.

| # | Caption (paste under shot) | URL path | Show this |
| --- | --- | --- | --- |
| 1 | Shopify sales next to the spend you added | `/app?period=y3&shot=1` | **Outcome frame:** KPI tiles (sales, spend, Total ROAS). Sample \| Live chrome. |
| 2 | Sales ÷ spend — the formula this desk uses | `/app?period=mtd&shot=1` | **Definition frame:** `Sales ÷ spend` rows. Period **MTD**. Must look unlike shot 1 for 4.4.4. |
| 3 | Three Spend doors — template, type, or Ads Manager CSV | `/app/spend?shot=1` | Spend three doors + history label *Daily spend by channel, back to January 2021* |
| 4 | LTV and payback Shopify Analytics does not show | `/app/ltv?period=mtd&shot=1` | Cohort LTV + caption that windows ≠ period Cash CAC |
| 5 | Full-year Goals board next to this period | `/app/goals?period=mtd&shot=1` | PeriodControl + year board |

**Why this order converts:** outcome → trust the math → prove Spend doors (incl. billboards) → LTV → Goals. Recapture live Admin; existing founder-pack PNGs may still show Free/Pro or SAMPLE desk OFF chrome.

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

**Upload runbook:** icon + filenames + Live data → [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) §D.

### Caption hygiene

- Lead with the merchant win (“Cash MER vs break-even”), not the screen name  
- Never say attribution, pixel, or “true revenue”
- Never put plan prices ($ / mo) in captions or in the PNG (4.2.2)
- Never use “the first”, “the best”, or “the only” (4.3.3 / 4.3.4)
- Keep each caption unique (Shopify rejects near-duplicate shots + captions)

---

## Still human-only

1. Distribution → Shopify App Store  
2. PCD questionnaire (Level 1 only; no `write_pixels`)  
3. Install smoke with **Live data**  
4. Upload icon + 5 recaptured shots · Pricing **one $39 plan + 7-day trial** (delete Free) · paste reviewer notes  
5. Confirm Fly trust URLs · human Submit when ready (do **not** ask the agent to Submit)  
