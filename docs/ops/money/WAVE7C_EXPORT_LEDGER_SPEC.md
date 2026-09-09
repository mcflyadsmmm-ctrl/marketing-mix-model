# Wave 7C — closed-day period ledger CSV

**Owner:** Claude Desk lane  
**Outcome:** A merchant can download the selected period as an analysis-ready daily CSV from Overview or Spend. Shopify sales come only from persisted `SalesDayFact`; spend comes from live, non-SAMPLE `SpendEntry` rows. The export refuses SAMPLE and incomplete closed-day data.

## Source and current baseline

- Product math remains **Total ROAS = Shopify Total Sales after returns ÷ entered ad spend**.
- `app/app/components/SpendExplorer.tsx` currently creates a browser-side chart CSV from displayed buckets. That file is not the Wave 7C ledger: it can be SAMPLE, can be weekly/monthly/quarterly, omits inactive days, and trusts data already sent to the browser.
- `getSalesFactsByDay` and `getSalesFactsCoverage` in `sales-facts.server.ts` are the sales source of truth.
- `buildDailyRowsForWindow` already applies overlapping spend across daily calendar keys and can exclude `source = "sample"`.
- The selected `period` query parameter and `resolvePeriod` remain the period contract on both Overview and Spend.

Do not add a sales column to spend import. CSV is an allowed **spend** source only. A number parsed from any uploaded CSV must never become Shopify sales in this export.

## Product contract

### 1. One authenticated server export

Add a resource route:

`GET /app/period-ledger.csv?period=<preset>`

The route must:

1. authenticate with `authenticate.admin(request)`;
2. resolve the authenticated shop with `ensureShop(session.shop)`;
3. parse the same period preset used by Overview and Spend;
4. resolve dates in `shop.ianaTimezone`;
5. clamp the requested end to the last fully closed shop-local day;
6. load sales only through `SalesDayFact` server helpers;
7. load spend with `source != "sample"`;
8. run the fail-closed gates below before returning a file.

Never accept `shopId`, shop domain, raw start/end instants, sales values, or timezone from the browser. The only client input is the existing period preset. Invalid or unsupported presets fall back through the existing parser; do not invent a second period parser.

The response is:

- status `200`;
- `Content-Type: text/csv; charset=utf-8`;
- `Content-Disposition: attachment; filename="mcfly-period-ledger-<start-day>-to-<end-day>.csv"`;
- `Cache-Control: private, no-store`.

The route is read-only. It must not enqueue backfill, call Shopify GraphQL, mutate facts, write spend, or change settings.

### 2. Exact CSV schema

Emit these columns in this exact order:

1. `day`
2. `Shopify sales`
3. `spend total`
4. `Meta spend`
5. `Google spend`
6. `Microsoft spend`
7. `TikTok spend`
8. `Pinterest spend`
9. `Snapchat spend`
10. `Reddit spend`
11. `X spend`
12. `LinkedIn spend`
13. `Amazon spend`
14. `Apple Search Ads spend`
15. `Affiliate spend`
16. `Email spend`
17. `Other spend`
18. `Total ROAS`

Row rules:

- one row per fully closed shop-local calendar day, oldest first;
- `day` is `YYYY-MM-DD`;
- `Shopify sales`, `spend total`, and every channel spend value are numeric decimal strings with exactly two places;
- absent spend channels are `0.00`;
- `spend total` equals the rounded sum of the fourteen channel columns;
- `Total ROAS` is `Shopify sales ÷ spend total`, emitted as a numeric decimal with four places;
- when `spend total` is zero, `Total ROAS` is an empty field, never `0`, `Infinity`, `NaN`, or text;
- use CRLF row separators and RFC 4180 escaping;
- do not add currency symbols, `×`, formulas, locale separators, summary rows, comments, merchant identifiers, customer data, campaign data, or platform-attributed sales.

The channel set and order are fixed by this contract. A future `SpendChannel` addition must make the serializer test fail until this schema is deliberately updated.

### 3. Sales provenance is non-negotiable

For live exports, every value in `Shopify sales` must be derived from `SalesDayFact.sales` for the authenticated `shopId` and the row's stored UTC-midnight day key.

Allowed:

- `getSalesFactsByDay`;
- `getSalesFactsCoverage`;
- pure rounding/serialization after those reads.

Forbidden:

- uploaded CSV columns other than spend;
- `SampleSalesDay`;
- SAMPLE overlays;
- browser-provided sales;
- explorer bucket sales supplied by the client;
- `fetchShopifySales`, `fetchShopifySalesByDay`, or any new live GraphQL crawl;
- platform conversion value, attributed revenue, Domo, Sheets, CRM, or another warehouse.

The server test must prove that spend rows or arbitrary CSV-like input cannot supply or overwrite the sales value.

### 4. Closed-day honesty and fail-closed gates

The route must block instead of downloading a partial or ambiguous ledger.

Return a plain UTF-8 response with `Cache-Control: private, no-store` and no attachment header for each blocked state:

| State | Status | Exact response body |
| --- | --- | --- |
| SAMPLE preview enabled | `409` | `SAMPLE preview is on — switch to Real store before exporting your period ledger. Nothing was downloaded.` |
| Requested period has no fully closed day | `409` | `Period ledger is not ready — the selected period has no fully closed day.` |
| Sales facts missing, incomplete, unreadable, or period exceeds the facts window | `409` | `Period ledger is paused — closed-day Shopify sales facts are incomplete. Try again after the desk finishes filling.` |
| Spend coverage incomplete for any requested closed day | `409` | `Period ledger is paused — closed-day spend is incomplete. Fill the missing days in Spend, then export again.` |

Required checks:

- call `getSampleDeskEnabled(shop.id)` before constructing export rows;
- require `SalesFactsCoverage.complete === true`;
- require `periodExceedsFactWindow === false`;
- require `factDays === expectedClosedDays`;
- use `getSpendPeriodCoverage` with `{ excludeSample: true, timeZone: shop.ianaTimezone }`;
- require complete spend coverage for the same clamped closed-day range;
- never silently shorten the start of a period to the facts window;
- exclude today even if a `SalesDayFact` or spend row exists for today;
- never replace a missing closed day with `0.00`.

A legitimate covered zero-sales day remains `0.00` because the row exists in `SalesDayFact`. A missing fact is not zero and blocks the whole export.

### 5. Overview and Spend entry points

Add a visible link/button labeled exactly:

`Export period ledger (.csv)`

Both entry points must target `/app/period-ledger.csv?period=<current preset>`.

- Overview places it beside the existing period/share controls.
- Spend places it near the selected-period spend summary, not in the import controls.
- Preserve the current `period` selection.
- Do not use the existing explorer chart's `CSV` button as the implementation.
- When SAMPLE is on, render the control disabled with accessible help text matching the SAMPLE block. The server-side `409` remains authoritative.
- The control needs a useful accessible name and keyboard focus.
- Do not claim the file is ready while either closed-day gate is incomplete. Disabled help may use the same exact blocked copy as the route.

No new navigation item, page, modal, background job, toast framework, or export history is required.

## Exact files Claude may touch

1. `app/app/lib/period-ledger.ts` — fixed schema, dense closed-day row builder, decimal formatting, RFC 4180 serializer, filename helper.
2. `app/app/lib/period-ledger.test.ts` — pure schema/math/escaping/order tests.
3. `app/app/lib/period-ledger.server.ts` — authenticated-shop data assembly from `SalesDayFact` and non-SAMPLE spend plus closed-day gates.
4. `app/app/lib/period-ledger.server.test.ts` — mocked repository/provenance and blocked-state tests.
5. `app/app/routes/app.period-ledger.csv.tsx` — authenticated resource loader and HTTP response headers/status.
6. `app/app/routes/app._index.tsx` — Overview export entry point and loader readiness state.
7. `app/app/routes/app.spend.tsx` — Spend export entry point and loader readiness state.

No other file is in scope. Do not edit `SpendExplorer.tsx`, Prisma schema/migrations, CSS, package files, route configuration, Shopify configuration, or generated files. React Router flat routes discover the new resource route. If typecheck proves another file must change, stop and report the exact compile error before widening the lane.

## Acceptance tests

### Pure ledger contract

`period-ledger.test.ts` must prove:

1. headers match the exact eighteen-column order above;
2. rows are oldest first and include every requested closed day, including covered `0.00` sales/spend days;
3. each named channel lands in only its contracted column;
4. channel columns sum exactly to `spend total` after cent rounding;
5. Total ROAS is sales divided by spend and is formatted to four places;
6. zero spend produces an empty Total ROAS field;
7. output contains no `Infinity`, `NaN`, currency symbol, or `×`;
8. commas, quotes, and line breaks are RFC 4180 escaped and rows use CRLF;
9. filename contains only the resolved start/end day keys;
10. a compile-time exhaustive channel map prevents a newly added channel from silently disappearing.

### Server provenance and honesty

`period-ledger.server.test.ts` must prove:

1. sales values come from the mocked `SalesDayFact` map and cannot be overridden by spend/CSV-shaped values;
2. the spend query excludes `source = "sample"`;
3. SAMPLE enabled returns the exact `409` block before export assembly;
4. incomplete sales facts return the exact sales-facts `409`;
5. `periodExceedsFactWindow` returns the same sales-facts `409`;
6. incomplete spend coverage returns the exact spend `409`;
7. a period with no closed day returns the exact `409`;
8. today is excluded in the shop timezone;
9. complete closed-day facts plus complete live spend return the dense ledger;
10. the server path never calls a Shopify sales fetch or accepts client sales.

### Route and UI

1. Authenticated `200` response has the exact content type, attachment filename, and `private, no-store`.
2. Every blocked response has no attachment header.
3. Overview and Spend links preserve the current period preset.
4. Both labels read `Export period ledger (.csv)`.
5. SAMPLE disables both controls and exposes the exact SAMPLE help text.
6. Incomplete sales or spend disables the corresponding control without hiding the reason.
7. Existing explorer chart CSV behavior is untouched.
8. Keyboard users can reach and activate an enabled export control.

### Commands

Run from `app/`:

```bash
npm test -- --run app/app/lib/period-ledger.test.ts app/app/lib/period-ledger.server.test.ts app/app/lib/spend-day-route.test.ts app/app/lib/cash-desk-ux.test.ts
npm run typecheck
npm run build
```

Then run from repository root:

```bash
bash scripts/agent-ship-gate.sh
git diff --check
git diff --name-only
```

`git diff --name-only` must contain only the seven allowlisted implementation files when Claude executes this spec. The prep lane that creates this document is separately limited to this specification file.

## Hard refusals

- No Domo, Apps Script runtime, Google Sheets, warehouse, CRM, or OAuth.
- No Meta/Google Ads or other platform connector work.
- No sales imported from CSV; CSV remains spend-only.
- No pixels, MTA, path credit, view-through, “true ROAS,” or platform-attributed claims.
- No SAMPLE money in a live export and no unlabeled SAMPLE download.
- No open-day/today row.
- No review, install, merchant-count, or revenue claims.
- No pricing, billing, listing, site, Fly deploy, Partner Dashboard, App Store, ads purchase, or ad-status change.
- App Store Ads remain **NO**.

## Definition of done

- [ ] Overview and Spend download the same authenticated selected-period ledger.
- [ ] The CSV has exactly the contracted eighteen columns and one row per covered closed day.
- [ ] Shopify sales come only from `SalesDayFact`.
- [ ] Spend excludes SAMPLE and is split across every named channel.
- [ ] Total ROAS is sales ÷ spend; zero spend is blank.
- [ ] SAMPLE, incomplete sales facts, incomplete spend coverage, out-of-window periods, and no-closed-day periods fail closed with exact copy.
- [ ] Today is excluded in the merchant's timezone.
- [ ] Focused tests, typecheck, build, ship gate, and diff checks pass.
- [ ] Diff contains only the exact allowlist and adds no Domo/OAuth/CRM/review-count work.
- [ ] App Store Ads remain **NO**.
