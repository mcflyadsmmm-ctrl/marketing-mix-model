# Wave 7B — optional target Total ROAS

**Owner:** Claude Desk lane  
**Outcome:** A merchant may set or clear a target Total ROAS in Settings. Overview then shows the selected-period actual against that target without turning an incomplete period into a performance verdict.

## Source and current baseline

- Product math stays **Total ROAS = Shopify Total Sales ÷ entered ad spend**.
- `docs/MER_APPS_SCRIPT_DIGEST.md` supplies only the useful pattern: an optional operating target rail and explicit closed-day honesty.
- The existing margin path is the implementation model: retain a numeric default internally, but do not present it as merchant-confirmed until an explicit confirmation timestamp exists.
- `Settings.targetMer` and the Overview `TotalRoasGauge` already exist. This wave hardens their semantics; it does not add a second goal system.
- Break-even remains separate: target Total ROAS is an operator goal; break-even comes only from confirmed contribution margin.

## Product contract

### 1. Optional target persistence

Add `Settings.targetMerConfirmedAt DateTime?`.

- Keep `Settings.targetMer Float @default(3.0)` non-null so existing allocation, pacing, Goals, and sample calculations do not receive a nullable rail.
- A live merchant target is **configured** only when `targetMerConfirmedAt != null`.
- Saving a valid target greater than zero writes `targetMer` and sets `targetMerConfirmedAt = now`.
- Saving the target field blank clears only `targetMerConfirmedAt`; it does not overwrite the last numeric value and does not change margin.
- A later valid save re-enables the target.
- Saving a target from Goals also sets `targetMerConfirmedAt`; Settings and Goals remain one setting.
- SAMPLE always exposes the locked sample target as configured. It must remain stamped SAMPLE and must never mutate the merchant setting.
- Migration safety: add the nullable column, then backfill existing `Settings` rows with `updatedAt`. This preserves already-visible targets for installed shops. New settings rows begin unconfirmed, and merchants can clear an inherited target in Settings.

Do not make `targetMer` nullable and do not use `0` or `NaN` as an “off” sentinel.

### 2. Settings behavior

Change the target input from required to optional, following the controlled-input/reset pattern already used by margin.

Field:

- Label: `Target Total ROAS (optional)`
- Hint: `Your operating goal — for example, 4.0 means $4 in Shopify Total Sales per $1 of ad spend. Leave blank to show actual only.`
- `type="number"`, `step="0.1"`, `min="0.1"`, decimal input mode.
- Confirmed target loads as its saved value; unconfirmed target loads blank.
- Discard/reset restores the loader state for both target and margin.

Validation:

- Blank is valid and means “clear target.”
- Nonblank, nonnumeric, zero, or negative input returns an inline error and performs no update.
- A valid target and optional margin save remain one atomic Prisma update.

Success copy:

- Set: `Target Total ROAS saved · 4.00×.`
- Cleared: `Target cleared. Overview will show actual Total ROAS without a goal rail.`
- If margin was also saved, the success banner may include the break-even result, but it must not imply target and break-even are the same number.

Replace `Target required · margin optional` with `Target optional · margin optional`.

### 3. Overview actual-versus-target rail

`DashboardMetrics` keeps numeric `targetMer` and adds `targetMerConfirmed: boolean`. It is true for SAMPLE or an explicit live confirmation.

Pass `targetMer={metrics.targetMerConfirmed ? metrics.targetMer : null}` to `TotalRoasGauge`.

The gauge accepts `number | null`:

- With a target, render the target tick/number and a plain-language line: `Actual 3.51× vs target 4.00×`.
- Without a target, render actual Total ROAS with no target tick and neutral tone. Show `No target set · add one in Settings.`
- The accessible name must describe actual, target when present, and comparison trust state.
- Never color actual green/red merely because a hidden default target exists.
- Keep the existing “not platform ROAS” definition.

The comparison may say above/below target only when all are true:

1. actual Total ROAS is available and not hidden as an untrusted zero;
2. the target is configured;
3. `periodTrust.trusted` is true.

When any trust gate fails, retain the actual number if existing honesty rules allow it, but use neutral styling and suppress above/below language.

### 4. Closed-day honesty copy

Place one short line beside the rail; do not add another banner.

| State | Exact copy |
| --- | --- |
| Target configured and period trusted | `Closed-day sales and spend are complete. Today can still move.` |
| Target configured and period not trusted | `Target call paused — closed-day sales or spend is incomplete.` |
| No target configured | `Closed days are the trust check. Today can still move.` |

“Trusted” here reuses `resolvePeriodTrust`; do not create a looser coverage rule. The displayed actual remains the existing selected-period Total ROAS. The copy explicitly prevents merchants from treating an open day as final; this wave does not create a second closed-day KPI.

## Exact files Claude may touch

1. `app/prisma/schema.prisma` — add `targetMerConfirmedAt`.
2. `app/prisma/migrations/20260909050000_target_mer_confirmed/migration.sql` — nullable column plus existing-row backfill.
3. `app/app/lib/target-mer.ts` — pure optional-input parser and comparison-state resolver.
4. `app/app/lib/target-mer.test.ts` — parser and trusted/untrusted comparison tests.
5. `app/app/lib/mer-dashboard.server.ts` — expose `targetMerConfirmed`; SAMPLE override stays read-only.
6. `app/app/routes/app.settings.tsx` — optional controlled field, atomic set/clear action, reset, errors, and success copy.
7. `app/app/routes/app.goals.tsx` — a successful target save also confirms the shared target.
8. `app/app/components/TotalRoasGauge.tsx` — nullable target, explicit actual-vs-target text, neutral untrusted/no-target states, accessible name.
9. `app/app/routes/app._index.tsx` — pass configured target and period-trust state into the gauge.
10. `app/app/lib/cash-desk-ux.test.ts` — static wiring guard for optional target and closed-day copy.

No other file is in scope. If TypeScript proves another file must change, stop and report the exact compile error before widening the lane.

## Acceptance tests

### Unit

`target-mer.test.ts` must prove:

1. blank input parses to a valid clear operation;
2. whitespace-only input parses to clear;
3. `4` and `4.0` parse to `4`;
4. text, zero, negatives, `Infinity`, and `NaN` are rejected;
5. configured + trusted + actual above target resolves to an above state;
6. configured + trusted + actual below target resolves to a below state;
7. configured + untrusted resolves neutral and contains no above/below verdict;
8. no target resolves neutral and requests Settings;
9. missing actual resolves unavailable, never above/below.

### Route and persistence

1. New `Settings` row: target input is blank and Overview has no target tick.
2. Save `4.0`: database retains `targetMer = 4.0`, stamps `targetMerConfirmedAt`, and Overview reads `Actual … vs target 4.00×`.
3. Clear the field: database clears only `targetMerConfirmedAt`; margin fields and their confirmation timestamp are unchanged.
4. Invalid target: action returns an inline error and neither target nor margin is partially updated.
5. Save target from Goals: Settings reloads with that target confirmed.
6. SAMPLE: sample target remains visible and clearly SAMPLE; entering/leaving SAMPLE does not alter the live merchant target.

### Honesty and accessibility

1. Trusted covered period: direction styling and above/below wording are allowed; closed-day-complete copy is present.
2. Missing spend day or incomplete sales facts: target marker may remain visible, but tone is neutral and the exact paused copy is present.
3. Untrusted hidden-zero path: no `0.00× vs target`, no green/red verdict, and existing sales-loading honesty remains intact.
4. No target: actual is still visible, no target marker is rendered, and keyboard users can reach the Settings link.
5. Gauge accessible name includes the actual and target only when configured; untrusted state is announced as paused.

### Commands

Run from `app/`:

```bash
npx prisma validate
npx prisma generate
npm test -- --run app/app/lib/target-mer.test.ts app/app/lib/cash-desk-ux.test.ts app/app/lib/desk-honesty-labels.test.ts
npm run typecheck
npm run build
```

Then run from repository root:

```bash
bash scripts/agent-ship-gate.sh
```

## Hard refusals

- No Domo, Apps Script runtime, Google Sheet, Meta, Google Ads, Klaviyo, or other OAuth/connectors.
- No pixels, MTA, path credit, view-through, “true ROAS,” or platform-attributed claims.
- No new Monday Close surface.
- No new review, install, or merchant-count claims.
- No pricing, billing, listing, site, Fly deploy, Partner Dashboard, or App Store changes.

## Definition of done

- [ ] Optional target can be set, cleared, and restored without affecting margin.
- [ ] Settings and Goals write the same confirmed target.
- [ ] Overview shows actual versus target only when configured.
- [ ] Untrusted periods never receive an above/below target verdict.
- [ ] Closed-day honesty copy matches the state matrix exactly.
- [ ] SAMPLE cannot mutate live target settings.
- [ ] Migration preserves installed-shop behavior and leaves new shops unconfirmed.
- [ ] Prisma validation, focused tests, typecheck, build, and repository ship gate pass.
- [ ] Diff contains only the files listed above and no Domo/OAuth/review-count additions.
