# Listing visual pack — convert installs ($39 · Mcfly Analytics)

**Copy SoT:** [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md)  
**Marty paste pack:** [`ops/LISTING_LIVE_PASTE.md`](./ops/LISTING_LIVE_PASTE.md)  
**URLs:** [`ops/PARTNER_LISTING_URLS.md`](./ops/PARTNER_LISTING_URLS.md)  
**Designer playbook:** [`CURSOR_DESIGNER_PLAYBOOK.md`](./CURSOR_DESIGNER_PLAYBOOK.md)  
**Human clicks:** [`SUBMIT_NOW.md`](./SUBMIT_NOW.md)

**Pricing lock:** one plan named **Mcfly Analytics** · **$39/mo · 7-day trial**. Not Free. Not Pro.  
**Reviews: 0** (do not invent). Agents do **not** Partner-Submit.

---

## Harbor SAMPLE lock (listing shots + site must match)

Live Harbor SAMPLE on mcflyads.com / in-app sample desk:

| Metric | Lock |
| --- | --- |
| Sales | **$82,068** |
| Spend | **$23,414** |
| Total ROAS | **3.51×** ($82,068 ÷ $23,414) |
| Break-even | **2.50×** @ 40% margin |
| Label | Harbor Home Co · **SAMPLE preview · not your store** |

**BAN:** stale **4.41×** / **4.42×** / **4.45×** callouts, CUSTOM DATA SCIENCE chrome, invented GMV, Free vs Pro pricing shots as uploadables.

If a local hero / feature PNG still shows **4.41×** or **4.42×**, **recapture** Overview on SAMPLE (Harbor lock) before upload — do not re-upload the stale file.

---

## Conversion thesis (craft, not TW clones)

Premium analytics listings win when:

1. **Shot 1 = outcome** — big Total ROAS vs break-even (not Settings, not empty CSV)
2. **Shot 2 = definition** — sales ÷ spend labeled so merchants “get it” in 2 seconds
3. **Shot 3 = how data gets in** — select platforms → export daily → combine; **Other** column visible
4. **Shot 4 = decision** — one allocation call (cut / shift / hold) **or** LTV/Acquisition (never Free vs Pro)
5. **Shot 5 = setup / Goals** — margin → break-even or Goals pace (proof it’s not black-box)
6. **Polaris-native**, Lifetimely-clean KPI density — never dashboard soup
7. **3–6 unique** ~1600×900 shots; no browser chrome; no near-duplicates (4.4.4 / 4.4.5)
8. **Realistic data** — empty states kill installs; SAMPLE numbers must show Harbor **3.51×** when SAMPLE is ON

Refuse for shots: marketing-site captures, pixel/ROAS theater UI, TW-clone clutter, Free/Pro/(paid) freemium UI.

---

## Demo data for shots (built in)

1. Open app → **Demo** tab  
2. Click **Load 3-year sample desk** (matched sales + spend — Harbor lock)  
3. Click **Turn sample desk ON**  
4. Confirm SAMPLE board shows **~$82,068** sales · **~$23,414** spend · **~3.51×** Total ROAS (not 4.41×)  
5. Capture with listing-capture mode (hides SAMPLE banner + demo chrome): add `listing=1` to the URL (`shot=1` still works). See [`LISTING_CAPTURE.md`](./LISTING_CAPTURE.md).  
6. **After uploads:** Demo → **Turn sample desk OFF** (required before live smoke / reviewer)

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
      Or from Overview empty foot: “Load the sample desk”
   4. Click Load 3-year sample desk
   5. Click Turn sample desk ON
   6. Confirm yellow SAMPLE banner + Harbor lock (~$82,068 / ~$23,414 / ~3.51×) — not 4.41×

C. SHOT MODE + CAPTURE (hide SAMPLE banner; metrics stay sample)
   Tooling: macOS Screenshot → Capture Selected Portion, or CleanShot.
   Crop ~1600×900 of the APP BODY only (no Admin left nav, no OS menubar, no URL bar).

   Shot 1 — outcome
     Navigate: /app?period=y3&shot=1
     Frame: decision strip + 4-up KPI grid; period “3 yr” visible
     Exclude: equation panel; any 4.41×/4.42× stale chrome
     Save: docs/listing-assets/shots/01-total-roas-vs-breakeven.png
     Caption: Total ROAS vs break-even — one glance

   Shot 2 — definition (MUST look unlike shot 1 — 4.4.4)
     Navigate: /app?period=mtd&shot=1
     Frame: ONLY formula / sales ÷ spend rows
     Exclude: hero Total ROAS tile + decision strip
     Period tab must show MTD (not 3 yr)
     Save: docs/listing-assets/shots/02-explorer-sales-div-spend.png
     Caption: Sales ÷ spend — the only formula we use
     QA: side-by-side vs shot 1 — if same big Total ROAS position, re-crop

   Shot 3 — spend ingest (export → combine)
     Navigate: /app/spend?shot=1
     Frame: platform checkboxes + export guides + combine/import UI; **Other** column visible
     Prefer: selected platforms (Meta…Reddit) + “Combine uploads” or wide template ending in Other
     Fallback: wide template column cards + import if combine UI does not fit crop
     BAN: any UI that says platforms are on Pro / Free
     Save: docs/listing-assets/shots/05-spend-csv.png  (or 03-spend-csv.png if renamed)
     Caption: Select platforms → export daily → combine

   Shot 4 — Monday call (NOT Free vs Pro)
     Navigate: /app/allocation?period=y3&shot=1
     Frame: recommendation takeaway + efficiency / channel bars
     Save: docs/listing-assets/shots/04-allocation-call.png  (do NOT upload 04-free-pro-pricing.png)
     Caption: One clear cut / shift / hold call

   Shot 5 — setup proof
     Navigate: /app/settings?shot=1
     Frame: margin % + live break-even preview (lock instrument)
     Save: docs/listing-assets/shots/03-margin-breakeven.png
     Caption: Lock break-even from your margin %

D. SAMPLE OFF (mandatory before smoke / reviewer)
   7. /app/demo → Turn sample desk OFF
   8. Overview should no longer show SAMPLE banner

E. ICON
   Partner App icon: docs/listing-assets/mcfly-app-icon-1200.png
   (1200×1200, M-only — refreshed for clarity; vector source `mcfly-app-icon.svg`)
```

### Path cheat-sheet

| # | App path + query | Save as |
| --- | --- | --- |
| 1 | `/app?period=y3&shot=1` | `docs/listing-assets/shots/01-total-roas-vs-breakeven.png` |
| 2 | `/app?period=mtd&shot=1` | `docs/listing-assets/shots/02-explorer-sales-div-spend.png` |
| 3 | `/app/spend?shot=1` | `docs/listing-assets/shots/05-spend-csv.png` |
| 4 | `/app/allocation?period=y3&shot=1` | `docs/listing-assets/shots/04-allocation-call.png` (new capture) |
| 5 | `/app/settings?shot=1` | `docs/listing-assets/shots/03-margin-breakeven.png` |

---

## Assets in repo

| File | Use |
| --- | --- |
| `docs/listing-assets/mcfly-app-icon-1200.png` | Partner **App icon** — crisp cyan **M** on navy (refreshed for clarity; not the Mcfly Ads wordmark) |
| `docs/listing-assets/mcfly-app-icon.svg` | Vector source for the Partner icon (`viewBox 0 0 64 64`) |
| `docs/listing-assets/mcfly-ads-lockup-source.png` | Full lockup source (M + Mcfly Ads) — marketing only |
| `docs/listing-assets/shots/` | Listing screenshot PNGs — **founder pack** (see `shots/CAPTIONS.md`) |
| Brand mark sizes | `site/assets/brand/mcfly-m.png` (+ 32/64/128/256) |

### Founder pack status

| # | File | Status |
| --- | --- | --- |
| 1 | `01-total-roas-vs-breakeven.png` | **Ready** — KPI board (Sales / Spend / Total ROAS). QA Harbor **3.51×** if SAMPLE ON. |
| 2 | `02-explorer-sales-div-spend.png` | **Ready** — Explorer (sales ÷ spend + channel mix) |
| 3 | `03-margin-breakeven.png` | **Ready** — Break-even lock from margin |
| 4 | `04-free-pro-pricing.png` | **DO NOT UPLOAD** — Free vs Pro freemium poison. Recapture Allocation or LTV instead. |
| 5 | `05-spend-csv.png` | **Ready (mock)** — platforms + combine + Other; SAMPLE labeled. Re-capture live Admin when session available. HOLD marketing-site PNG stays do-not-upload. |

Captions + upload order: [`listing-assets/shots/CAPTIONS.md`](./listing-assets/shots/CAPTIONS.md).

---

**Current Partner five (desk routes):** Overview / Spend / Goals / LTV / Allocation — exact URLs in [`LISTING_CAPTURE.md`](./LISTING_CAPTURE.md). The table below is the older conversion-funnel crop list (`shot=1`); prefer `listing=1` so the yellow SAMPLE bar stays off.

## Screenshot story — order = conversion funnel

Capture from **embedded Admin** iframe only. Crop to ~**1600×900**. No browser chrome, no OS menubar.

| # | Caption (paste under shot) | URL path | Show this |
| --- | --- | --- | --- |
| 1 | Total ROAS vs break-even — one glance | `/app?period=y3&shot=1` | **Outcome frame:** KPI tiles (Total ROAS + break-even). Harbor SAMPLE → **3.51×**. Period **3 yr** visible in shot mode. |
| 2 | Sales ÷ spend — the only formula we use | `/app?period=mtd&shot=1` | **Definition frame:** sales/spend bars or explorer. Period **MTD**. Must look unlike shot 1 for 4.4.4. |
| 3 | Select platforms → export daily → combine | `/app/spend?shot=1` | Platform checkboxes + export guides + combine/import; **Other** column visible — **no Free/Pro gates** |
| 4 | One clear cut / shift / hold call | `/app/allocation?period=y3&shot=1` | Recommendation + efficiency bars — **never** upload `04-free-pro-pricing.png` |
| 5 | Lock break-even from your margin % | `/app/settings?shot=1` | Margin input + live break-even preview |

**Why this order converts:** outcome → trust the math → prove multi-platform export/combine (Other included) → Monday decision → “I can set this up.” Settings last so the gallery doesn’t open on a form.

### Shot 1 vs shot 2 — 4.4.4 uniqueness (mandatory)

Shopify rejects **near-duplicate** screenshots. These are **different compositions**, not a period swap on the same crop.

| | Shot 1 | Shot 2 |
| --- | --- | --- |
| **Merchant question** | “Am I above break-even?” | “What is Total ROAS, exactly?” |
| **DOM focus** | Decision strip + 4-up KPI grid | Formula panel (`Sales ÷ spend` rows) |
| **Period tab** | **3 yr** | **MTD** (proves period control without cloning shot 1) |
| **Must NOT appear** | Stale **4.41×** / Free-Pro chrome | Hero Total ROAS tile dominating frame; same crop as shot 1 |
| **Caption proves** | Break-even vs Total ROAS at a glance | Formula honesty — sales ÷ spend, not platform ROAS |

After capture, side-by-side the PNGs: if both show the big Total ROAS number in the same position, re-crop shot 2 to the formula panel only. Confirm SAMPLE Total ROAS is **~3.51×**, not **4.41×**.

**Upload runbook:** icon + filenames + sample OFF → [`SUBMIT_NOW.md`](./SUBMIT_NOW.md) §D · paste pack [`ops/LISTING_LIVE_PASTE.md`](./ops/LISTING_LIVE_PASTE.md).

### Caption hygiene

- Lead with the merchant win (“Total ROAS vs break-even”), not the screen name  
- Prefer **Total ROAS** (religion). Never say attribution, pixel, “true ROAS,” or platform-phantom ROAS  
- Never say Free / Pro / (paid) / forever-free in captions  
- Keep each caption unique (Shopify rejects near-duplicate shots + captions)

---

## Still human-only

1. Distribution → Shopify App Store  
2. PCD questionnaire  
3. Install smoke with sample **OFF**  
4. Upload icon + 5 shots · Pricing plan name **Mcfly Analytics** · **$39 · 7-day trial** (delete Free; rename Pro) · paste reviewer notes  
5. Trust URLs → **mcflyads.com**; App URL → **Fly** · Save · Marty alone decides Submit  
