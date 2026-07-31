# W3 Home craft — Cash MER / Total ROAS (2026-07-29)

**Lane:** App · Cash MER Home only  
**Files:** `app/app/routes/app._index.tsx` · Cash MER classes in `app/app/styles/mcfly-desk.css`  
**Deploy:** No Fly this tick — parent deploys after ship-gate  
**Religion:** Total ROAS = sales ÷ spend; no pixels / MTA / TW clones

## What changed (meaningful)

1. **Decision strip restored** — Apps Script `renderOverviewDecision_` parity: one Fraunces sentence vs break-even / target + safe-spend headroom; tone border (ok / warn / bad); CTAs → **Spend** or **Lock period** (Close), not Allocation theater on Home.
2. **First-viewport hierarchy** — When SAMPLE is **off** and the till is live-ready: sticky rail → decision → KPI board → trust banners (coverage / recon / below-BE). Trust no longer buries the KPI story. SAMPLE strip only renders when SAMPLE is **on**.
3. **Cold empty TTFV** — Margin missing → one primary **Adjust Profit Margin**; spend missing → one primary **Add Spend**; both missing → Settings first with quiet “Next: Add Spend” link. No competing secondary button pairs.

## Merchant feels different

- Opens Home and immediately sees **what to do** (protect rail / cut before lock / finish spend trust) plus the next ritual click.
- Live desk: Total ROAS KPIs land in the first viewport without a wall of banners above them.
- Fresh install: one obvious next step toward trusted Total ROAS in &lt;10 minutes.

## Apps Script parity scorecard (dimensions touched)

| Dimension | Score | Notes |
| --- | ---: | --- |
| Fonts (Fraunces + Source Sans 3) | **5** | Takeaway on `--mcfly-display` (Fraunces); body Source Sans |
| Token match (bg/ink/accent/shadow) | **5** | Accent / truth / warn / lie left-border tones; existing desk tokens |
| Decision strip present + useful | **5** | Restored; vs BE/target + headroom; Spend / Close verbs |
| 4-up KPI grid + delta lines | **4** | Existing Sales · Spend · Total ROAS board kept (not rewritten); EOM tile still deferred to control math inside decision copy / Explore |
| Sticky context rail | **5** | Untouched pattern; net/gross chip only when scoreboard ready |
| Segmented periods | **5** | Shared `PeriodControl` |
| Panel heads Fraunces | **4** | Not in this pass |
| Control pacing visual | **3** | Not re-ported this tick (gap: pacing panel still off Home) |
| Channel Cut/Hold/Shift badges | **3** | Intentionally not on Home CTAs (Close/Spend only) |
| Religion (no theater) | **5** | Cash sentence only; SAMPLE chrome gated |
| Listing shot readability | **4** | Decision stays in shot; action buttons hidden in `?shot=1` |
| **Mean (touched)** | **~4.4** | Pass (≥4.0). Gaps: EOM 4th KPI tile, pacing panel, channel badges on Home |

## Gaps / next tick (optional)

- Restore optional 4th **EOM projected MER** tile if listing composition wants classic 4-up again.
- Soften duplicate below-BE signal (decision tone + `CashTrustBanners`) if banners feel loud after hierarchy move.
- SAMPLE strip CSS now lives in `mcfly-desk.css` (was missing for `.mcfly-sample-strip`).

## Gate

```bash
bash scripts/agent-ship-gate.sh
```

Parent: deploy only after gate PASS + standing grant.
