# ShopifyQL-wait maximum improve queue

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the remaining PASS desk depth that already lives in order history and typed spend, while `read_reports` and PCD L2 stay a trust gate for Analytics-parity claims.

**Architecture:** One named ADD per PR, pure function first, then the existing route. Craft never grades its own PR. Reviewer PASS, then merge onto `cursor/spend-trust-recurring`, then one Fly. Later waves do not start until the previous PR is merged, so two cooks never share `app/app/routes`.

**Tech Stack:** React Router app in `app/`, Vitest, Prisma `OrderFact`, existing `parseSpendCsv` and `classifyOrderSource`. No new Shopify scope.

## Global Constraints

- Branch from `cursor/spend-trust-recurring` after docs merge #136 (`627b365`). Product commit under that merge is `2107ea876cf86e8195f172e88415520b5a450ef9`. Fly stays **v406** until the next craft deploy. Live stays PARKED (`MCFLY_SAMPLE_ONLY=true`).
- Painted IA: `Overview → Orders → Customers → Spend → Goals`. Growth and LTV stay Customers chips.
- Commercial lock: $39 flat / store / month, 7-day trial, unpaid Live ingest about 90 closed days.
- Total ROAS = Shopify sales ÷ entered spend. Empty spend keeps Total ROAS, Cash CPA, and payback as `—`. Never `0×` and never `$0` CPA.
- A channel header is a label on dollars the merchant typed. No Meta ROAS, platform CPA, or path-credit column.
- Refuse: COGS / shipping / P&L hero, pixels, MTA, GMV or per-order pricing, a sixth tab, off-Shopify, invented Partner metrics, session/visitor fixes.
- ShopifyQL / `read_reports` + PCD L2 does not block these cooks. It blocks checklist section F (cold Analytics-parity claims) in `docs/ops/ACCURACY_AUDIT_CHECKLIST.md`.
- Do not add `read_reports`. Do not read shipping addresses or customer tags while PCD L2 is in review.
- Builder never merges its own craft PR. Deploy only after Reviewer PASS: `flyctl deploy --app mcfly-analytics --remote-only`.

---

## Already on the tip — do not recook

| PR | ADD |
|----|-----|
| #124–#126 | Returning $, cohort LTV 30/90/365, days-to-second |
| #127–#130 | Product → LTV, predictive LTV, whale RFM, refunds honesty |
| #132 | Order-history forecast on Overview + Goals |
| #133 | Shareable insight cards |
| #134 | Unpaid Live ingest clamped to 90 closed days |
| #135 | Promo discount-depth bands (Light / Typical / Deep) from discount **dollars** |

`docs/ops/ADD_BACKLOG_RANKED.md` still lists those as the action queue. That file is stale for cook order. This plan is the cook order.

## What stays waiting on ShopifyQL

- Checklist **F**: Total sales parity against ShopifyQL, session or visitor accuracy, any sentence that says the desk matches Shopify Analytics reports.
- New scopes. Country-from-address and customer-tag LTV stay HOLD until Marty says the PCD review can absorb another field.
- Live unpark, Partner Submit, and outbound sends.

## Cook order

Serial. One Fly after each Reviewer PASS.

| Wave | ADD | Why it does not need ShopifyQL |
|------|-----|--------------------------------|
| 1 | Spend paste densify (Brief 2) | Uses `parseSpendCsv` and sales facts already on the Spend page |
| 2 | LTV by Online / POS / Shop | `OrderFact.sourceName` is already crawled |
| 3 | Named discount code on Live LTV | Add `discountCodes` to the existing `read_orders` query. Live currently forces `discountCode: null` |
| 4 | First-fold empty-state pass | Copy and lane fold only, on whichever tab Reviewer still marks thin after waves 1–3 |

Parallel, and they do not open app PRs: Compete Scout updates the backlog after each merge; Warm Ops keeps drafts unsent; Live Accuracy stays on standby and does not claim a Live PASS.

---

### Task 1: Pasted-days cash preview

**Files:**
- Create: `app/app/lib/spend-paste-preview.ts`
- Test: `app/app/lib/spend-paste-preview.test.ts`
- Consumes: `ParsedSpendRow` from `app/app/lib/spend-csv.ts`

**Interfaces:**
- Consumes: rows already returned by `parseSpendCsv` (positive amounts only; zeros never appear).
- Produces:

```ts
export type PastedDaysPreview = {
  positiveDays: number;
  labels: string[];
  totalDollars: number;
  intersectionDays: number;
  quietDaysInWindow: number;
  totalRoas: number | null;
  cashCpa: number | null;
  /** First-90 order-history value ÷ Cash CPA. Null until both exist. */
  payback: number | null;
  write: boolean;
};

export function previewPastedDays(input: {
  rows: Array<{ date: string; rawChannel: string; amount: number }>;
  /** YYYY-MM-DD → Shopify sales. Missing key means no sales fact. */
  salesByDate: ReadonlyMap<string, number>;
  /** YYYY-MM-DD → identified buyer keys with an order that day. */
  buyerKeysByDate: ReadonlyMap<string, readonly string[]>;
  /** Dates strictly before this key are outside the sales window. */
  salesFloorKey: string | null;
  /** Sealed first-90 order-history value per new buyer. Null if unsealed. */
  first90Value: number | null;
}): PastedDaysPreview;
```

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { previewPastedDays } from "./spend-paste-preview";

const sales = new Map<string, number>([
  ["2026-09-01", 200],
  ["2026-09-02", 100],
]);
const buyers = new Map<string, readonly string[]>([
  ["2026-09-01", ["a", "b"]],
  ["2026-09-02", ["c"]],
]);

describe("previewPastedDays", () => {
  it("leaves the trio null and writes nothing for blank, header-only, or all-zero input", () => {
    const empty = previewPastedDays({
      rows: [],
      salesByDate: sales,
      buyerKeysByDate: buyers,
      salesFloorKey: "2026-09-01",
      first90Value: 90,
    });
    expect(empty.write).toBe(false);
    expect(empty.totalRoas).toBeNull();
    expect(empty.cashCpa).toBeNull();
    expect(empty.payback).toBeNull();
  });

  it("uses the intersection only, and returns null ROAS when any in-window day has no sales fact", () => {
    const preview = previewPastedDays({
      rows: [
        { date: "2026-09-01", rawChannel: "Meta", amount: 40 },
        { date: "2026-09-03", rawChannel: "Meta", amount: 10 },
      ],
      salesByDate: sales,
      buyerKeysByDate: buyers,
      salesFloorKey: "2026-09-01",
      first90Value: 90,
    });
    expect(preview.write).toBe(true);
    expect(preview.positiveDays).toBe(2);
    expect(preview.labels).toEqual(["Meta"]);
    expect(preview.totalDollars).toBe(50);
    expect(preview.quietDaysInWindow).toBe(1);
    expect(preview.totalRoas).toBeNull();
    expect(preview.cashCpa).toBeNull();
    expect(preview.payback).toBeNull();
  });

  it("divides intersection sales by intersection spend and payback by Cash CPA", () => {
    const preview = previewPastedDays({
      rows: [
        { date: "2026-09-01", rawChannel: "Meta", amount: 40 },
        { date: "2026-09-02", rawChannel: "Google", amount: 20 },
        { date: "2026-08-01", rawChannel: "Meta", amount: 999 },
      ],
      salesByDate: sales,
      buyerKeysByDate: buyers,
      salesFloorKey: "2026-09-01",
      first90Value: 90,
    });
    expect(preview.intersectionDays).toBe(2);
    expect(preview.totalRoas).toBeCloseTo(300 / 60);
    expect(preview.cashCpa).toBeCloseTo(60 / 3);
    expect(preview.payback).toBeCloseTo(90 / 20);
  });

  it("keeps payback null until first-90 is sealed or buyers are zero", () => {
    const noSeal = previewPastedDays({
      rows: [{ date: "2026-09-01", rawChannel: "Meta", amount: 40 }],
      salesByDate: sales,
      buyerKeysByDate: buyers,
      salesFloorKey: "2026-09-01",
      first90Value: null,
    });
    expect(noSeal.totalRoas).toBeCloseTo(200 / 40);
    expect(noSeal.cashCpa).toBeCloseTo(40 / 2);
    expect(noSeal.payback).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd app && npx vitest run app/lib/spend-paste-preview.test.ts`

Expected: FAIL with `Cannot find module './spend-paste-preview'`

- [ ] **Step 3: Write the preview**

```ts
export type PastedDaysPreview = {
  positiveDays: number;
  labels: string[];
  totalDollars: number;
  intersectionDays: number;
  quietDaysInWindow: number;
  totalRoas: number | null;
  cashCpa: number | null;
  payback: number | null;
  write: boolean;
};

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function previewPastedDays(input: {
  rows: Array<{ date: string; rawChannel: string; amount: number }>;
  salesByDate: ReadonlyMap<string, number>;
  buyerKeysByDate: ReadonlyMap<string, readonly string[]>;
  salesFloorKey: string | null;
  first90Value: number | null;
}): PastedDaysPreview {
  const rows = input.rows.filter(
    (row) => Number.isFinite(row.amount) && row.amount > 0 && row.date,
  );
  const labels = [...new Set(rows.map((row) => row.rawChannel.trim()).filter(Boolean))].sort();
  const totalDollars = roundMoney(rows.reduce((sum, row) => sum + row.amount, 0));
  const positiveDays = new Set(rows.map((row) => row.date)).size;
  const inWindow = rows.filter(
    (row) => input.salesFloorKey == null || row.date >= input.salesFloorKey,
  );
  const quietDaysInWindow = inWindow.filter((row) => !input.salesByDate.has(row.date)).length;
  const intersection = quietDaysInWindow === 0 ? inWindow : [];
  const intersectionSpend = intersection.reduce((sum, row) => sum + row.amount, 0);
  const intersectionSales = intersection.reduce(
    (sum, row) => sum + (input.salesByDate.get(row.date) ?? 0),
    0,
  );
  const buyerKeys = new Set<string>();
  for (const row of intersection) {
    for (const key of input.buyerKeysByDate.get(row.date) ?? []) buyerKeys.add(key);
  }
  const buyers = buyerKeys.size;
  const honest = intersection.length > 0 && intersectionSpend > 0;
  const totalRoas = honest ? intersectionSales / intersectionSpend : null;
  const cashCpa = honest && buyers > 0 ? intersectionSpend / buyers : null;
  const payback =
    cashCpa != null &&
    input.first90Value != null &&
    Number.isFinite(input.first90Value) &&
    input.first90Value > 0
      ? input.first90Value / cashCpa
      : null;
  return {
    positiveDays,
    labels,
    totalDollars,
    intersectionDays: intersection.length,
    quietDaysInWindow,
    totalRoas,
    cashCpa,
    payback,
    write: rows.length > 0,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd app && npx vitest run app/lib/spend-paste-preview.test.ts`

Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add app/app/lib/spend-paste-preview.ts app/app/lib/spend-paste-preview.test.ts
git commit -m "feat(spend): preview pasted-day ROAS on the sales intersection"
```

---

### Task 2: Paste box on the empty Total ROAS fold

**Files:**
- Create: `app/app/components/SpendPasteBox.tsx`
- Modify: `app/app/routes/app.spend.tsx` (the `emptyLiveSpend` block that renders `SpendAddDayPanel`, around the `#mcfly-spend-add` section)
- Modify: `app/app/lib/spend-upload-findings.test.ts` (source assertion)
- Reuse: `parseSpendCsv` in the action already used by `app/app/routes/app.spend.import.tsx`. Do not add a second parser.

**Interfaces:**
- Consumes: `previewPastedDays` from Task 1. Sales-by-date and buyers-by-date come from the Spend loader facts that already feed the hero. `first90Value` comes from the same sealed first-90 figure `CpaPaybackDesk` already reads. Pass `null` when that figure is absent.
- Produces: a paste control beside Add a day. Save posts the same CSV text the import route already accepts. `preview.write === false` does not call the spend upsert.

- [ ] **Step 1: Write the failing source test**

Add to `app/app/lib/spend-upload-findings.test.ts`:

```ts
it("puts paste next to Add a day on the empty Live fold and keeps a blank paste from writing", () => {
  const spend = readFileSync(new URL("../routes/app.spend.tsx", import.meta.url), "utf8");
  const paste = readFileSync(
    new URL("../components/SpendPasteBox.tsx", import.meta.url),
    "utf8",
  );
  expect(spend).toContain("SpendPasteBox");
  expect(spend).toContain("emptyLiveSpend");
  expect(paste).toContain("parseSpendCsv");
  expect(paste).toContain("previewPastedDays");
  expect(paste).not.toContain("Meta ROAS");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd app && npx vitest run app/lib/spend-upload-findings.test.ts -t "paste next to Add a day"`

Expected: FAIL because `SpendPasteBox.tsx` does not exist.

- [ ] **Step 3: Add the box and mount it**

Create `app/app/components/SpendPasteBox.tsx` as a client form that:

1. Holds textarea text.
2. Calls `parseSpendCsv(text)` on change.
3. Calls `previewPastedDays` with the parsed `rows` plus the sales map, buyers map, sales floor, and first-90 value passed from the route.
4. Renders days, labels, total dollars, and the three cells. Nulls render as `—`. When `quietDaysInWindow > 0`, the ROAS cell stays `—` and the line names that count.
5. Submits only when `preview.write` is true and `parseSpendCsv` returned no errors. The submit field is the raw textarea text under the import action's existing field name. Confirm that name in `app.spend.import.tsx` before wiring; do not invent a second write path.

In `app.spend.tsx`, inside the `emptyLiveSpend` branch, render `<SpendPasteBox ... />` in the same `#mcfly-spend-add` section as `SpendAddDayPanel`. SAMPLE (`sampleDesk.enabled`) does not mount the box. Overview files are untouched.

- [ ] **Step 4: Run the tests**

Run: `cd app && npx vitest run app/lib/spend-paste-preview.test.ts app/lib/spend-upload-findings.test.ts app/lib/spend-csv.test.ts`

Expected: PASS. Then exercise `/app/spend` on the SAMPLE desk and confirm the paste box is absent there, and on a Live-empty fixture confirm a blank textarea leaves the hero as `—`.

- [ ] **Step 5: Commit and hand Reviewer**

```bash
git add app/app/components/SpendPasteBox.tsx app/app/routes/app.spend.tsx app/app/lib/spend-upload-findings.test.ts
git commit -m "feat(spend): paste daily spend on the empty Total ROAS fold"
```

Reviewer PASS requires the Brief 2 empty-state: no paste, blank paste, and all-zero paste leave Total ROAS, Cash CPA, and payback as `—`.

---

### Task 3: LTV by Online / POS / Shop

Start this only after Task 2 is merged. Branch from the new tip.

**Files:**
- Create: `app/app/lib/ltv-by-source.ts`
- Test: `app/app/lib/ltv-by-source.test.ts`
- Modify: `app/app/lib/ltv-depth-page.server.ts` to pass `sourceName` through (it already selects order rows that include `sourceName`)
- Modify: the Customers LTV chip component that already mounts promo depth. Do not add a chip or a tab.
- Reuse: `classifyOrderSource` from `app/app/lib/shopify-depth-stats.ts`

**Interfaces:**
- Produces:

```ts
export type SourceLtvRow = {
  kind: "online" | "pos" | "shop" | "other";
  buyers: number;
  revenue: number;
  ltv: number | null;
};

export function ltvByFirstOrderSource(
  orders: Array<{ customerKey: string; orderedAt: Date; amount: number; sourceName: string | null }>,
): SourceLtvRow[];
```

Grouping key is the buyer's **first** identified order, classified with `classifyOrderSource`. `ltv` is that cohort's later order-history revenue ÷ buyers. Fewer than 8 buyers in a kind returns `ltv: null` for that row (same floor as shareables), with the buyer count still shown. `other` is draft/app source names, never an ad platform.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { ltvByFirstOrderSource } from "./ltv-by-source";

function order(
  customerKey: string,
  day: string,
  amount: number,
  sourceName: string | null,
) {
  return { customerKey, orderedAt: new Date(`${day}T16:00:00Z`), amount, sourceName };
}

describe("ltvByFirstOrderSource", () => {
  it("groups by the first order's source and hides LTV under 8 buyers", () => {
    const rows = ltvByFirstOrderSource([
      order("a", "2026-01-01", 10, "web"),
      order("a", "2026-02-01", 30, "pos"),
      order("b", "2026-01-02", 20, "pos"),
    ]);
    const online = rows.find((row) => row.kind === "online");
    const pos = rows.find((row) => row.kind === "pos");
    expect(online?.buyers).toBe(1);
    expect(online?.revenue).toBe(40);
    expect(online?.ltv).toBeNull();
    expect(pos?.buyers).toBe(1);
    expect(pos?.ltv).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and confirm FAIL**

Run: `cd app && npx vitest run app/lib/ltv-by-source.test.ts`

Expected: FAIL with module not found.

- [ ] **Step 3: Implement `ltvByFirstOrderSource`**

Sort each customer's orders by `orderedAt`. The earliest row's `sourceName` is the cohort key via `classifyOrderSource`. Sum `amount` across that customer's orders into `revenue`. Set `ltv` to `revenue / buyers` only when `buyers >= 8`. Return the four kinds in the order online, pos, shop, other.

- [ ] **Step 4: Pass `sourceName` from the Live loader and render the rows on the LTV chip**

In `ordersFromFacts`, include `sourceName: row.sourceName`. The LTV chip lists the four rows. Null LTV renders as `—` plus the buyer count. The card says the source is where the order was placed, not which ad sent it.

- [ ] **Step 5: Test, commit, hand Reviewer**

Run: `cd app && npx vitest run app/lib/ltv-by-source.test.ts app/lib/shopify-depth-stats.test.ts`

```bash
git commit -m "feat(ltv): show order-history value by Online, POS, and Shop"
```

---

### Task 4: Store the discount code the order already has

Start only after Task 3 is merged.

**Files:**
- Modify: `app/prisma/schema.prisma` `OrderFact` — add `discountCode String?`
- Modify: `ORDERS_FOR_FACTS_QUERY` in `app/app/lib/order-facts.server.ts` to request `discountCodes` (code only, no customer name)
- Modify: `app/app/lib/ltv-depth-page.server.ts` line that sets `discountCode: null` so it passes the stored code
- Test: `app/app/lib/order-facts.test.ts` and `app/app/lib/ltv-promo.test.ts`

**Interfaces:**
- Consumes: Shopify Admin `Order.discountCodes` on the query that already uses `read_orders`.
- Produces: `OrderFact.discountCode` as the first code string, or null. `buildLtvFlagship` already accepts `discountCode`. Named promo rows appear on Live only when a code was stored. Discount dollars still drive Light / Typical / Deep when the code is null. Never invent a code from the dollar amount.

- [ ] **Step 1: Extend the order-facts source test**

The existing test `"selects discount, sourceName, and unit quantity without SKUs"` in `app/app/lib/order-facts.test.ts` must also expect the query string to contain `discountCodes` and the mapper to write `discountCode`.

- [ ] **Step 2: Run that test and confirm FAIL**

Run: `cd app && npx vitest run app/lib/order-facts.test.ts -t "selects discount"`

- [ ] **Step 3: Add the column, the field, and the Live pass-through**

Query fragment inside the existing order node:

```graphql
discountCodes
```

Map `node.discountCodes?.[0]` trimmed, else null. Migration is additive and nullable. Backfill happens on the next incremental sync; do not run a second full historical crawl and do not break `LIVE_SYNC_LAW`.

Replace `discountCode: null` in `ordersFromFacts` with the stored column.

- [ ] **Step 4: Run promo + order-facts tests**

Run: `cd app && npx vitest run app/lib/order-facts.test.ts app/lib/ltv-promo.test.ts`

Expected: PASS. A shop with discount dollars and no codes still shows depth bands and the existing "codes are not on this shop's stored orders" sentence until sync writes a code.

- [ ] **Step 5: Commit and hand Reviewer**

```bash
git commit -m "feat(ltv): store Shopify discount codes for named promo rows"
```

---

### Task 5: First-fold empty-state pass

Start only after Task 4 is merged. This wave changes copy and `DeskLane` fold state. It does not add a metric.

Walk Overview, Orders, Customers, Spend, and Goals at two shapes: Snowdevil SAMPLE, and a Live shop with orders but no spend. For each tab, the first fold must show a number the merchant already has, or an em dash with the reason. Pending sales stay a banner, not `$0`. Spend with no paste stays `—`.

File the findings as Reviewer notes on the PR. Fix only the folds that fail. Do not restack navigation.

---

## Still HOLD after this queue

| Item | Why it waits |
|------|----------------|
| Country LTV, customer-tag LTV | Would read fields outside the current order query while PCD L2 is in review |
| ShopifyQL parity, sessions, visitors | Checklist F. `read_reports` is not a craft scope |
| COGS, pixels, path credit, sixth tab, GMV pricing | Refuse list |
| Live unpark, Partner Submit, warm sends | Marty taps |
