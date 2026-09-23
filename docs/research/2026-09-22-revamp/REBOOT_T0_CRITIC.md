# REBOOT T0 critic — Ship

**SHA:** `f3a3e0d` · **PR:** #211 · **Date:** 2026-09-23

## Verdict: **Ship**

| Gate | Result |
| --- | --- |
| One pending surface on Home (`singlePendingSurface` + `homePendingBannerMessage`) | Pass |
| Banned merchant phrases absent from banner/YoY copy (tests assert) | Pass |
| Pending $0 → hero —; chart/YoY gated by `showOverviewChartBeat` | Pass |
| SAMPLE path unchanged when data exists | Pass (first-viewport tests) |
| SAMPLE_ONLY / no read_reports / religion / From orders | Untouched |
| Focused vitest (54) | Pass |

**Not in scope:** T1 three-tab IA · Live Admin screenshot (Marty) · Fly until Conductor merge.

**HOLD none.** Server comments may still mention `read_reports` / crawl — merchant strings do not.
