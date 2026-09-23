# Craft S (v49) Spend — outside critic

**Branch:** `cursor/craft-spend-v49` (post-HOLD fix) vs `origin/cursor/spend-trust-recurring`  
**Plan:** `APP_CRAFT_PLAN.md` Ship S · `CRAFT_S_SPEND_NOTES.md` · `.cursor/skills/mcfly-app-craft/SKILL.md`  
**Verdict:** **SHIP** — P0 panel-fold fixed; demo empty compare strip removed; explorer aria-label cleaned.

## Checks

| Bar | Result |
| --- | --- |
| First fold = Total ROAS hero + compare + explorer | PASS on `/app/spend`; demo omits compare until SAMPLE prior deltas exist |
| Mix / CPA / depth folded; `?panel=mix\|cpa` opens fold | PASS — `defaultOpen={shotMode \|\| spendPanel === "mix" \|\| spendPanel === "cpa"}` |
| Empty spend = —, not 0× | PASS |
| No `s-section className` | PASS |
| Native `section` + `h3` | PASS |
| Product locks | PASS |
| `npm test` | PASS after test string updates |

## Fixed in this pass

1. Depth fold opens for `?panel=mix` / `?panel=cpa` (Cash CPA / allocation deep links).
2. Demo no longer renders a blank "Prior period not on file" compare strip.
3. `#mcfly-explorer` aria-label → "Spend explorer".

No merge/deploy by critic.
