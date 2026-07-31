# W3 — Monday Close craft (2026-07-29)

**Lane:** App · Monday Close ritual  
**Own:** `app/app/routes/app.close.tsx` + Close-related CSS in `mcfly-desk.css`  
**Religion:** Cash desk · Polaris owns Close (no Fraunces sky-paper wrap)  
**Deploy:** No Fly deploy this tick

---

## Merchant feeling

Monday Close should feel like a **short finance ritual**, not a dashboard:

1. See where you are on the rail (Exceptions → Lock → Variance → Decision → CSV)
2. Know **exactly why Lock is off** (SAMPLE / margin / spend / Pro)
3. Pick one illustrative Monday move knowing **average ≠ marginal**
4. Lock on phone without hunting for the button

---

## What shipped

| Area | Change |
| --- | --- |
| Ritual rail | Labeled “Ritual”; numbered chips with → connectors; plain-text flow line; jump links to section anchors; status strip with Now + first disabled reason |
| Lock disabled | Unified `lockDisabledReasons()` list on Lock + Decision; CTAs to Demo / Settings / Spend / Pro |
| Decision honesty | Standing `DECISION_HONESTY` callout; reduce hint appends “Average ≠ marginal ROAS”; takeaway + radio hints stay illustrative |
| Variance | Tile grid (Sales / Spend / Total ROAS) for locked + preview deltas |
| Mobile | Horizontal-scroll ritual; larger decision taps; full-width cut inputs + presets; sticky Lock bar with safe-area |
| Polaris density | Chrome-only (`mcfly-desk--chrome`); metrics/variance tiles; no sky-paper / Fraunces scoreboard |

---

## Close craft scorecard (1–5)

| Dimension | Score | Notes |
| --- | ---: | --- |
| Ritual clarity | **5** | Rail + → + flow string + section IDs + Now status |
| Decision honesty | **5** | Illustrative + average ≠ marginal on standing copy + reduce |
| Mobile | **4.5** | Sticky Lock + scroll rail + 44px-ish taps; embedded Admin iframe still human-smoke |
| Polaris density | **4.5** | Polaris sections/banners/forms; calm tiles; no Fraunces wrap |
| Religion | **5** | Cash MER / not true ROAS; refuse path credit; SAMPLE fail-closed |
| **Mean** | **4.8** | ≥ 4.5 — ship craft bar met |

### Gaps (not blocking)

- Embedded Admin smoke on real device for sticky Lock vs App Bridge chrome
- `cash-close.ts` reduce hint still omits “average ≠ marginal” in the lib string (UI appends it on Close)

---

## Files

- `app/app/routes/app.close.tsx`
- `app/app/styles/mcfly-desk.css` (`.mcfly-close-*` only)
- `docs/ops/W3_CLOSE_CRAFT_20260729.md`

---

## Human gates

- Design-partner Monday Close smoke (margin → spend → Close → Lock → CSV)
- No Partner Submit / Fly deploy from this tick
