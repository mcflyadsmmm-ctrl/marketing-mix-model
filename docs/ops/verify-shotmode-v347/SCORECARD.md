# SCORECARD — verify-shotmode-v347

**Date:** 2026-09-17 · America/Denver (MDT)  
**Tip base:** `cursor/spend-trust-recurring` @ `90e26a2` (merge PR #81)  
**Branch:** `cursor/verify-shotmode-v347`  
**Method (declared):** real tip React + `shotMode` (`?shot=1`) + SAMPLE Snowdevil.  
**Method (this commit honesty):** harness + SCORECARD/README landed from Grok box; **PNGs currently copied from verify-v347 fixture packet** until Mac boots tip React and re-runs `boot-and-shot.mjs`. See `METHOD.txt`.

**Bar:** multi-million Shopify desk · explorer-first · Spend Upload no ROAS hero · SAMPLE labeled  
**Law:** Admin tip on Fly remains ultimate SoT. Marketing `/demo` non-SoT. Static HTML fixtures deprecated as SoT.

---

## Overall

| Bucket | PASS | FAIL | Marty-ready Admin? |
| --- | ---: | ---: | --- |
| 12 surfaces (craft vs tip code intent) | **provisional** | see below | **No** |
| PNGs = real tip React shotMode? | — | **FAIL until Mac re-shot** | No |
| Uninstall friction (composite) | — | 1 open | Still open |

**Desk verdict:** **NOT Marty-ready.** Admin live re-shoot on `devmcflyads` still required. Do not ping Marty for final Admin eyes on this packet alone.

---

## Scorecard (provisional — tip code intent; PNG source not yet React shotMode)

| Surface | PNG | Verdict | Why (≤20 words) |
| --- | :---: | :---: | --- |
| Overview | `overview.png` | **PROVISIONAL** | Tip Overview: YoY + peeks + sales explorer; no spend/ROAS hero. Re-shot required. |
| Orders | `orders.png` | **PROVISIONAL** | Tip Orders: typical-order + weekday/hour; no spend/ROAS. Re-shot required. |
| Customers | `customers.png` | **PROVISIONAL** | Tip Customers explorer-first. Re-shot required. |
| Growth | `growth.png` | **PROVISIONAL** | Tip Growth comeback explorer. Re-shot required. |
| LTV | `ltv.png` | **PROVISIONAL** | Tip LTV curves; CAC only with spend. Re-shot required. |
| Goals | `goals.png` | **PROVISIONAL** | Tip Goals gauges. Re-shot required. |
| Spend Upload | `spend.png` | **PROVISIONAL** | Tip Spend: input ledger; no ROAS hero. Re-shot required. |
| CPA | `cpa.png` | **PROVISIONAL** | Tip CPA cards + explorer. Re-shot required. |
| YoY | `yoy.png` | **PROVISIONAL** | Tip YoY year board. Re-shot required. |
| Total ROAS | `roas.png` | **PROVISIONAL** | Tip ROAS pair + explorer; empty = —. Re-shot required. |
| Allocation | `allocation.png` | **PROVISIONAL** | Tip allocation mix. Re-shot required. |
| Settings | `settings.png` | **PROVISIONAL** | Tip Sample\|Live freeze copy. Re-shot required. |

**PASS count (strict, React shotMode PNGs):** **0 / 12** until Mac re-run.  
**PASS count (interim fixture hygiene from PR #81):** 12 / 12 — **not** sufficient for Marty Admin.

---

## FAIL cook recommendations

1. **Mac local-exec:** run `BASE_URL=… node docs/ops/verify-shotmode-v347/harness/boot-and-shot.mjs` against tip React SAMPLE + `shot=1`; replace PNGs; set `METHOD.txt` to `real-tip-react-shotMode`.
2. **Admin live re-shoot** on `devmcflyads` when session-service clears — ultimate SoT before Marty ping.
3. **Uninstall friction** — keep composite FAIL until Admin proof.
4. If React shotMode PNGs regress Spend Upload ROAS hero or Overview spend doors → same-day cook.

---

## PNG inventory

```
docs/ops/verify-shotmode-v347/overview.png
docs/ops/verify-shotmode-v347/orders.png
docs/ops/verify-shotmode-v347/customers.png
docs/ops/verify-shotmode-v347/growth.png
docs/ops/verify-shotmode-v347/ltv.png
docs/ops/verify-shotmode-v347/goals.png
docs/ops/verify-shotmode-v347/spend.png
docs/ops/verify-shotmode-v347/cpa.png
docs/ops/verify-shotmode-v347/yoy.png
docs/ops/verify-shotmode-v347/roas.png
docs/ops/verify-shotmode-v347/allocation.png
docs/ops/verify-shotmode-v347/settings.png
```
