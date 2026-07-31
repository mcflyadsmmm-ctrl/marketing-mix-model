# Listing visual pack — convert installs (Free Submit)

**Copy SoT:** [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md)  
**Designer playbook:** [`CURSOR_DESIGNER_PLAYBOOK.md`](./CURSOR_DESIGNER_PLAYBOOK.md)  
**Human clicks:** [`SUBMIT_NOW.md`](./SUBMIT_NOW.md)

---

## Conversion thesis (craft, not TW clones)

Premium analytics listings win when:

1. **Shot 1 = outcome** — big cash MER vs break-even (not Settings, not empty CSV)
2. **Shot 2 = definition** — sales ÷ spend labeled so merchants “get it” in 2 seconds
3. **Shot 3 = how data gets in** — select platforms → export daily → combine; **Other** column visible
4. **Shot 4 = decision** — one allocation call (cut / shift / hold)
5. **Shot 5 = setup** — margin → break-even (proof it’s not black-box)
6. **Polaris-native**, Lifetimely-clean KPI density — never dashboard soup
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
     Frame: decision strip + 4-up KPI grid; period “3 yr” visible
     Exclude: equation panel
     Save: docs/listing-assets/shots/01-cash-mer-vs-breakeven.png
     Caption: Cash MER vs break-even — one glance

   Shot 2 — definition (MUST look unlike shot 1 — 4.4.4)
     Navigate: /app?period=mtd&shot=1
     Frame: ONLY mcfly-panel--eq (Sales ÷ spend rows)
     Exclude: hero MER tile + decision strip
     Period tab must show MTD (not 3 yr)
     Save: docs/listing-assets/shots/02-sales-div-spend.png
     Caption: Sales ÷ spend — the only formula we use
     QA: side-by-side vs shot 1 — if same big MER position, re-crop

   Shot 3 — spend ingest (export → combine)
     Navigate: /app/spend?shot=1
     Frame: platform checkboxes + export guides + combine/import UI; **Other** column visible
     Prefer: selected platforms (Meta…Reddit) + “Combine uploads” or wide template ending in Other
     Fallback: wide template column cards + import if combine UI does not fit crop
     Save: docs/listing-assets/shots/03-spend-csv.png
     Caption: Select platforms → export daily → combine

   Shot 4 — Monday call
     Navigate: /app/allocation?period=y3&shot=1
     Frame: recommendation takeaway + efficiency / channel bars
     Save: docs/listing-assets/shots/04-allocation-call.png
     Caption: One clear cut / shift / hold call

   Shot 5 — setup proof
     Navigate: /app/settings?shot=1
     Frame: margin % + live break-even preview (lock instrument)
     Save: docs/listing-assets/shots/05-margin-breakeven.png
     Caption: Lock break-even from your margin %

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
| 4 | `/app/allocation?period=y3&shot=1` | `docs/listing-assets/shots/04-allocation-call.png` |
| 5 | `/app/settings?shot=1` | `docs/listing-assets/shots/05-margin-breakeven.png` |

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
| 4 | `04-free-pro-pricing.png` | **Ready** — Free vs Pro honesty |
| 5 | `05-spend-csv.png` | **Ready (mock)** — platforms + combine + Other; SAMPLE labeled. Re-capture live Admin when session available (`docs/ops/SHOT5_20260729.md`). HOLD stays do-not-upload. |

Captions + upload order: [`listing-assets/shots/CAPTIONS.md`](./listing-assets/shots/CAPTIONS.md).

---

## Screenshot story — order = conversion funnel

Capture from **embedded Admin** iframe only. Crop to ~**1600×900**. No browser chrome, no OS menubar.

| # | Caption (paste under shot) | URL path | Show this |
| --- | --- | --- | --- |
| 1 | Total ROAS vs break-even — one glance | `/app?period=y3&shot=1` | **Outcome frame:** crop `mcfly-pacing` gauge + KPI tiles (Total ROAS + break-even chip). Period **3 yr** visible in shot mode. |
| 2 | Sales ÷ spend — the only formula we use | `/app?period=mtd&shot=1` | **Definition frame:** `MonthlyPacing` sales/spend bars or explorer sales line + spend mix. Period **MTD**. Must look unlike shot 1 for 4.4.4. |
| 3 | Select platforms → export daily → combine | `/app/spend?shot=1` | Platform checkboxes + export guides + combine/import; **Other** column visible (fallback: wide template + import) |
| 4 | One clear cut / shift / hold call | `/app/allocation?period=y3&shot=1` | Recommendation + efficiency bars |
| 5 | Lock break-even from your margin % | `/app/settings?shot=1` | Margin input + live break-even preview |

**Why this order converts:** outcome → trust the math → prove multi-platform export/combine (Other included) → Monday decision → “I can set this up.” Settings last so the gallery doesn’t open on a form.

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
- Never say ROAS, attribution, pixel, or “true revenue”  
- Keep each caption unique (Shopify rejects near-duplicate shots + captions)

---

## Still human-only

1. Distribution → Shopify App Store  
2. PCD questionnaire  
3. Install smoke with sample **OFF**  
4. Upload icon + 5 shots · Pricing **Free** · paste reviewer notes  
5. Publish Pages trust URLs · Submit  
