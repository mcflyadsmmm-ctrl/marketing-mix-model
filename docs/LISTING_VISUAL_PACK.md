# Listing visual pack — convert installs (Free Submit)

**Copy SoT:** [`APP_STORE_LISTING.md`](./APP_STORE_LISTING.md)  
**Designer playbook:** [`CURSOR_DESIGNER_PLAYBOOK.md`](./CURSOR_DESIGNER_PLAYBOOK.md)  
**Human clicks:** [`SUBMIT_NOW.md`](./SUBMIT_NOW.md)

---

## Conversion thesis (craft, not TW clones)

Premium analytics listings win when:

1. **Shot 1 = outcome** — big cash MER vs break-even (not Settings, not empty CSV)
2. **Shot 2 = definition** — sales ÷ spend labeled so merchants “get it” in 2 seconds
3. **Shot 3 = how data gets in** — CSV with all channels including **Other**
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

## Assets in repo

| File | Use |
| --- | --- |
| `docs/listing-assets/mcfly-app-icon-1200.png` | Partner **App icon** — ribbon **M** only (not the Mcfly Ads wordmark) |
| `docs/listing-assets/mcfly-ads-lockup-source.png` | Full lockup source (M + Mcfly Ads) — marketing only |
| Brand mark sizes | `site/assets/brand/mcfly-m.png` (+ 32/64/128/256) |

---

## Screenshot story — order = conversion funnel

Capture from **embedded Admin** iframe only. Crop to ~**1600×900**. No browser chrome, no OS menubar.

| # | Caption (paste under shot) | URL path | Show this |
| --- | --- | --- | --- |
| 1 | Cash MER vs break-even — one glance | `/app?period=y3&shot=1` | Hero MER + sales/spend + status vs break-even |
| 2 | Sales ÷ spend — the only formula we use | `/app?period=ytd&shot=1` | Same desk, YTD — MER definition readable |
| 3 | Upload daily spend — all channels + Other | `/app/spend?shot=1` | Template + Meta…Email/**Other** + import |
| 4 | One clear cut / shift / hold call | `/app/allocation?period=y3&shot=1` | Recommendation + efficiency bars |
| 5 | Lock break-even from your margin % | `/app/settings?shot=1` | Margin input + live break-even preview |

**Why this order converts:** outcome → trust the math → prove spend ingest (Other included) → Monday decision → “I can set this up.” Settings last so the gallery doesn’t open on a form.

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
