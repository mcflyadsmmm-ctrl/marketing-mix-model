# SAMPLE desk — how to rip it out later

**Status:** temporary founder / listing preview. Not the product spine.

Live merchants should love Mcfly on **their** Shopify day facts. SAMPLE exists so
Marty can screenshot and click around when a store’s own history is thin.

## Kill switch (30 seconds)

In `app/app/lib/sample-desk-feature.ts`:

```ts
export const SAMPLE_DESK_FEATURE_ENABLED = false;
```

That forces SAMPLE off everywhere (`getSampleDeskEnabled` → false, seed/demo
routes refuse). No UI chrome, no sample reads.

## Full delete (when you’re sure)

1. Set the kill switch to `false`, ship, confirm nothing regresses.
2. Delete (or archive) these modules:
   - `app/app/lib/sample-desk-feature.ts`
   - `app/app/lib/sample-desk.server.ts`
   - `app/app/lib/demo-sample-desk.server.ts` (+ tests)
   - `app/app/components/SampleDeskBanner.tsx`
   - `app/app/routes/app.demo.tsx` (if only used for SAMPLE)
3. Remove `seedSampleOrderFacts` / `clearSampleOrderFacts` /
   `seedSampleCohortFacts` / `clearSampleCohortFacts` from
   `order-facts.server.ts` (search `source: "sample"`).
4. Drop Prisma `SampleSalesDay` + any `source = "sample"` spend/order rows via
   a one-shot migration after backup.
5. Grep for `useSampleDesk`, `SAMPLE`, `sample-desk`, `SampleDesk` and delete
   remaining branches.
6. Delete this doc + the amend row in `docs/FRESH_START.md`.

## Rules while SAMPLE lives

- Never present SAMPLE as live Shopify.
- Prefer real-store **core** charts for small shops (day facts first).
- Do not sprinkle SAMPLE conditionals into unrelated product logic — route
  through `sample-desk.server.ts` / the feature gate only.
