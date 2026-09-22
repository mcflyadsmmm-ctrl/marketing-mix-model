# Two ships while ShopifyQL waits

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two merchant-visible ships, then stop. Spend can be filled from a paste and stay honest when it is empty. Customers LTV can say which kind of first order is worth more, on the lane that is already open.

**Architecture:** Each ship is one branch, one PR, one Reviewer pass, one Fly. Commits inside the branch can be small. Fly does not move for a pure function, a copy tweak, or a board that stays folded. Ship 2 starts only after Ship 1 is merged.

**Tech Stack:** React Router app in `app/`, Vitest, Prisma `OrderFact`, `parseSpendCsv`, `classifyOrderSource`, Admin API `2025-10` (`ApiVersion.October25`). No new Shopify scope. No `read_reports`.

## Global Constraints

- Branch from `cursor/spend-trust-recurring` after docs merge #136 (`627b365`). Product commit under that merge is `2107ea876cf86e8195f172e88415520b5a450ef9`. Fly stays **v406** until Ship 1 deploys. Live stays PARKED (`MCFLY_SAMPLE_ONLY=true`).
- Painted IA: `Overview → Orders → Customers → Spend → Goals`. Growth and LTV stay Customers chips. Do not add a tab or a chip.
- Commercial lock: $39 flat / store / month, 7-day trial, unpaid Live ingest about 90 closed days.
- Total ROAS = Shopify sales ÷ entered spend. Empty spend keeps Total ROAS, Cash CPA, and payback as `—`. Never `0×` and never `$0` CPA.
- A channel header is a label on dollars the merchant typed. No Meta ROAS, platform CPA, or path-credit column.
- Refuse: COGS / shipping / P&L hero, pixels, MTA, GMV or per-order pricing, a sixth tab, off-Shopify, invented Partner metrics, session/visitor fixes.
- ShopifyQL / `read_reports` + PCD L2 blocks checklist section F in `docs/ops/ACCURACY_AUDIT_CHECKLIST.md` only. These two ships do not wait on it.
- Do not read shipping addresses or customer tags while PCD L2 is in review.
- `LIVE_SYNC_LAW`: one historical backfill already happened. New order fields fill on the next incremental sync. Do not kick a second full crawl.
- Builder never merges its own craft PR. Deploy only after Reviewer PASS: `flyctl deploy --app mcfly-analytics --remote-only`.

## Version rule

Target after this plan: **v407** and **v408**. Not a version per commit.

| Fly | Ship | What a merchant can do that they cannot do on v406 |
|-----|------|-----------------------------------------------------|
| v407 | Spend cash door | Paste daily spend on the empty Total ROAS fold, see the trio for those days before save, and keep `—` when the paste is empty or dishonest |
| v408 | Starter value | On the open Customers LTV lane, see which first-order pattern is worth more: discount depth, Online / POS / Shop, and a discount code when Shopify stored one |

Anything that does not change one of those two sentences does not get its own Fly.

## Already on the tip — do not rebuild

| PR | What is already true |
|----|----------------------|
| #124–#126 | Returning $, cohort 30/90/365, days-to-second |
| #127–#130 | Product → LTV, predictive LTV, whale RFM, refunds honesty |
| #132–#133 | Order-history forecast, shareable insight cards |
| #134 | Unpaid Live ingest clamped to 90 closed days |
| #135 | Promo depth bands from discount **dollars** |

`LtvPromoBoard` renders inside `CustomersLtvDepth`, which `app.customers.tsx` mounts in the folded lane "Who the dollars sit with" (`rank="more"`, closed unless `shotMode` or `panel=depth`). The open lane "What a new buyer is worth" already shows windows, the triangle, first-product drivers, and the expected estimate. Ship 2 moves the promo answer up. It does not invent a third LTV product.

Live `ordersFromFacts` in `app/app/lib/ltv-depth-page.server.ts` sets `discountCode: null` on purpose. SAMPLE can name codes. Live cannot. That is the hole.

## What this plan will not ship

- A Fly for the preview function alone, then another for the paste box.
- A Fly for source LTV, then another for discount codes, then another for moving a board.
- An empty-state copy pass across five tabs.
- Country LTV, customer-tag LTV, sessions, visitors, or any line that says the desk matches Shopify Analytics.
- COGS, pixels, path credit, a sixth tab, Live unpark, Partner Submit, outbound sends.

---

## Ship 1 — Spend cash door (v407)

**Merchant sentence:** On Spend → Total ROAS, with no spend on file, I can paste daily spend next to Add a day. Before anything is saved I see how many days, which labels, the total dollars, and Total ROAS, Cash CPA, and payback for those pasted days. If I paste nothing, or the paste cannot be trusted, those three stay `—`.

**One PR.** Tests and UI land on the same branch. Reviewer sees the empty fold, not a library diff.

### Math contract

Create `app/app/lib/spend-paste-preview.ts`. Input rows are the positive rows `parseSpendCsv` already returns. Zeros never arrive. Do not write a second parser.

```ts
export type PastedDaysPreview = {
  positiveDays: number;
  labels: string[];
  totalDollars: number;
  intersectionDays: number;
  quietDaysInWindow: number;
  totalRoas: number | null;
  cashCpa: number | null;
  /** Sealed first-90 order-history value per new buyer ÷ Cash CPA. */
  payback: number | null;
  write: boolean;
};

export function previewPastedDays(input: {
  rows: Array<{ date: string; rawChannel: string; amount: number }>;
  /** YYYY-MM-DD → Shopify sales. A missing key is a missing sales fact. */
  salesByDate: ReadonlyMap<string, number>;
  /** YYYY-MM-DD → identified buyer keys with an order that day. */
  buyerKeysByDate: ReadonlyMap<string, readonly string[]>;
  /** Dates strictly before this key are outside the sales window. */
  salesFloorKey: string | null;
  /** Null when the first 90 is not sealed. */
  first90Value: number | null;
}): PastedDaysPreview;
```

Rules the function must enforce:

1. `write` is false when there is no positive row. `totalRoas`, `cashCpa`, and `payback` are null. The route must not call the spend upsert.
2. `positiveDays` is the count of distinct dates with a positive amount, not the count of channel rows.
3. `labels` are distinct trimmed `rawChannel` values, sorted. They are labels, not causation.
4. Days before `salesFloorKey` stay out of the intersection. They still count toward `totalDollars` and `positiveDays`. The existing sales-floor warning still shows. They do not get invented sales.
5. If any in-window pasted day has no sales fact, `quietDaysInWindow` is that count and all three cash cells are null. Do not divide a partial sales sum by the full paste. Do not drop the quiet days out of the spend and still print a ROAS.
6. Otherwise Total ROAS = intersection sales ÷ intersection spend. Cash CPA = intersection spend ÷ unique buyer keys on those dates. A buyer who ordered on two pasted days counts once.
7. Payback = `first90Value / cashCpa` only when Cash CPA is a positive number and `first90Value` is a positive sealed number. Otherwise null. Reuse that sealed first-90 figure from the same place `CpaPaybackDesk` already reads. Do not invent a second payback formula.
8. Pending sales: the route passes an empty sales map for days that are not closed facts, so the trio stays null rather than `$0`.

### Tests that define done

`app/app/lib/spend-paste-preview.test.ts`:

- Empty rows → `write false`, all three null.
- Two in-window days, one missing a sales fact → `write true`, `quietDaysInWindow 1`, all three null. Labels and total dollars still show.
- Two in-window days with sales, plus one day before the floor → ROAS and CPA use only the in-window pair. The pre-floor dollars do not enter the denominator. Payback is `first90Value / cashCpa`.
- Same honest pair with `first90Value: null` → ROAS and CPA are numbers, payback is null.
- Two rows on the same date with buyer keys `["a"]` and `["a","b"]` → one positive day, two buyers.

Run: `cd app && npx vitest run app/lib/spend-paste-preview.test.ts`

### UI contract

Create `app/app/components/SpendPasteBox.tsx`. Mount it in `app/app/routes/app.spend.tsx` inside the `emptyLiveSpend` branch, in the same `#mcfly-spend-add` section as `SpendAddDayPanel`.

- SAMPLE (`sampleDesk.enabled`) does not mount the box. Snowdevil’s existing spend ledger keeps painting the trio.
- The box calls `parseSpendCsv` on the textarea. Parse errors name the first error and write nothing.
- Preview label is **these pasted days**, not “this month”.
- Save posts the raw textarea through the import route’s existing field and `previewSpendUpsert` / the existing spend write. Read the field name in `app/app/routes/app.spend.import.tsx` and reuse it. A blank box, a header with no amount rows, or only zeros never reaches that write.
- After a successful save, the hero stays Sales | Spend | Total ROAS with the equation already on the page. The success line may name Cash CPA and payback only when `previewPastedDays` returned numbers. The CPA lane opens because spend is on file, which it already does.
- Overview files are not edited. Mix stays spend-share by label, not channel ROAS.

### Reviewer bar for v407

PASS requires Accuracy, Quality, Organization, Ease, Stickiness, and Empty-state. The empty-state proof is specific: no paste, a blank paste, and an all-zero paste leave Total ROAS, Cash CPA, and payback as `—`. A deleted day can still show `$0`, and that state is visibly different from `—`. A Meta column does not create a Meta ROAS cell.

Deploy once, after that PASS. Record Fly v407 on `docs/ops/SCOREBOARD.md` in the same merge or the deploy commit. Do not open Ship 2 on the Ship 1 branch.

---

## Ship 2 — Starter value on the open LTV lane (v408)

**Merchant sentence:** On Customers → What a new buyer is worth, under the 30/90/365 windows, I can see which first orders are worth more: how deep the first discount was, whether that first order was Online, POS, or Shop, and the discount code when the order actually had one. Thin groups stay `—` with a count. Nothing here is an ad.

**One PR after v407 is on the tip.** Three changes, one screen.

### 2a. Move the promo answer onto the open lane

`LtvPromoBoard` already implements Light / Typical / Deep and the named-code rows from `depth.promoLtv`. It is mounted in `CustomersLtvDepth` (`app/app/components/CustomersLtvSection.tsx`, after `LtvProductBoard`).

Move that one mount into `CustomersLtvWindows`, after `LtvFirstProductDrivers`. Leave a single copy. The folded depth lane keeps whales, RFM, paths, and curves. It does not also show promo.

The board’s existing empty sentences stay: discount dollars not on file, too few buyers, buyers too young, first year not sealed. Those render as words and `—`, not `$0`.

### 2b. First-order source, from `sourceName` already stored

`OrderFact.sourceName` is crawled. `classifyOrderSource` in `app/app/lib/shopify-depth-stats.ts` maps it to `online | pos | shop | other`. Orders already shows Online vs POS. This ship adds the LTV cut, not a second definition of source.

Create `app/app/lib/ltv-by-source.ts`:

```ts
export type SourceLtvRow = {
  kind: "online" | "pos" | "shop" | "other";
  buyers: number;
  revenue: number;
  ltv: number | null;
};

export function ltvByFirstOrderSource(
  orders: Array<{
    customerKey: string;
    orderedAt: Date;
    amount: number;
    sourceName: string | null;
  }>,
): SourceLtvRow[];
```

- Cohort key is `classifyOrderSource` of the buyer’s earliest identified order.
- `revenue` is that buyer’s later order-history amount, summed, including the first order.
- `ltv` is `revenue / buyers` only when `buyers >= 8`. Below the floor, `ltv` is null and `buyers` still shows. Eight matches the shareable floor. Do not invent a second threshold.
- Return online, pos, shop, other, in that order.
- `other` is draft and app source names. The card says where the order was placed. It does not say which ad sent them.

Pass `sourceName` out of `ordersFromFacts`. The row is already on `OrderFact`. Render the four rows in the same open LTV section as the promo board, under a heading the merchant can scan in one glance: discount depth, then source. No new chip.

Test `app/app/lib/ltv-by-source.test.ts`:

- Buyer A first order `web` $10, later `pos` $30, and buyer B first order `pos` $20 → online buyers 1, revenue 40, ltv null; pos buyers 1, ltv null.
- Eight buyers whose first order is `web`, each with $10 now and $10 later → online ltv is 20.
- `sourceName: null` lands in `other`, not in online.

Run: `cd app && npx vitest run app/lib/ltv-by-source.test.ts app/lib/shopify-depth-stats.test.ts`

### 2c. Store the code Shopify already returns, then let Live use it

`ltv-promo.ts` already groups a named code when `discountCode` is present, and it refuses to invent a code from discount dollars. Live never passes a code.

Add nullable `discountCode String?` on `OrderFact`. Map it in `app/app/lib/order-facts.server.ts` from the existing `McflyOrdersForFacts` query. API version is October 2025.

Before editing the query, confirm the field on the Admin schema the app already uses:

- Prefer `discountApplications(first: 5) { nodes { ... on DiscountCodeApplication { code } } }` if that type exists on `Order` in `2025-10`.
- Use `discountCodes` only if the schema still exposes it.
- Store the first non-empty code, trimmed. No title, no customer name, no description.
- If the Admin schema rejects the field, do not ship a query that fails order sync. Source LTV and the promo-board move still ship. Named codes stay on the existing “code not on file” sentence until a follow-up that Marty approves. That follow-up is not an automatic v409.

Replace `discountCode: null` in `ordersFromFacts` with the stored column. Depth bands from discount dollars keep working when the column is null.

The existing order-facts test `"selects discount, sourceName, and unit quantity without SKUs"` gains an assertion that the query requests the confirmed field and the mapper writes `discountCode`. Run `app/lib/order-facts.test.ts` and `app/lib/ltv-promo.test.ts`.

Backfill is the next incremental order sync. Do not reset `orderBackfillState.cursor`. Old rows stay null until they are touched. The board already explains a missing code.

### Reviewer bar for v408

- Open Customers → LTV on SAMPLE and see promo depth without opening "Who the dollars sit with".
- A Live shop with discount dollars and no codes still shows depth bands, and named rows stay on the honest empty sentence.
- A fixture order with `sourceName: "pos"` and eight peers shows a POS LTV. One POS buyer shows the count and `—`.
- No new tab, chip, or scope. No address. No customer tag. No COGS column. No claim that source is an ad channel.
- Folded whale / RFM lane still mounts. Promo is not duplicated there.

Deploy once, after that PASS. Record Fly v408. Then stop. The next craft idea waits for a new plan, or for ShopifyQL, whichever Marty asks for.

---

## Checklist

- [ ] Ship 1 branch from `627b365`. Preview tests pass. Paste box is on the empty Live fold and absent on SAMPLE.
- [ ] Reviewer PASS on the six bars, including blank and all-zero paste.
- [ ] Merge, Fly v407, scoreboard line updated.
- [ ] Ship 2 branch from that new tip. Promo board is on the open LTV lane once.
- [ ] Source LTV tests pass. Discount-code field is confirmed against the October 2025 schema before the orders query changes.
- [ ] Reviewer PASS. Merge, Fly v408, scoreboard line updated.
- [ ] No third Fly from this plan.
