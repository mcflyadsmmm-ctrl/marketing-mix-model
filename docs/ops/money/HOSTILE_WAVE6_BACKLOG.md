# Hostile Wave 6 backlog (from Claude review)

**Source:** Claude hostile Wave 4–5 review (2026-09-08).  
**Fixed + shipped path:** SAMPLE Share Overview mailto stamp (`ab11f70` → bundle into next Fly).

## Still open (fix-only lanes — exclusive files)

| # | Risk | Severity | Suggested exclusive files |
| --- | --- | --- | --- |
| 1 | Spend coverage counts SAMPLE days as live “up to date” | Severe honesty | `app.spend.tsx` coverage loader path |
| 2 | Overview cold-empty unreachable; nav always bounces cold → Spend | Moderate UX | `app._index.tsx` redirect vs empty |
| 3 | ReviewAsk samples App Bridge `reviews` once — silent miss | Severe for review flywheel | `ReviewAsk.tsx` |
| 4 | ReviewAsk not gated on `periodExceedsFactWindow` | Mild | `app._index.tsx` `decideReviewAsk` |
| 5 | SAMPLE primary CTA → `/app/demo` vs `use-real` data-mode | Moderate | `first-session-path.ts` |

Do not invent reviews. Ads stay NO.
