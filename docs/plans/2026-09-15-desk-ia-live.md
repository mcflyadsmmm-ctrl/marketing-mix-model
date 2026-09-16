# Desk IA live — Shopify pass then spend pass

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the locked 11-tab desk so a merchant with $0 spend gets Overview / Customers / Growth / Orders / LTV immediately, then spend tools after those five exist — Fly matches the published listing without inventing reviews.

**Architecture:** Two sequential Fly ships from `marketing-mix-model/` on `cursor/spend-trust-recurring`. Pass A is Shopify-only pages plus a slim Spend Upload door still in nav so typed spend is not deleted. Pass B splits the current Marketing pile into Total ROAS, Channel Allocation, YoY, CPA, and Goals. `s-app-nav` is a flat list: Shopify five, then spend six, then Settings. Time windows live on cards/charts, not as those nav items. Remix file routes under `app/app/routes/`. Shared book pages use `loadDeskSalesPage` + `ShopifyBookSection` groups.

**Tech Stack:** Shopify embedded Remix (`@shopify/shopify-app-react-router`), React Router 7 file routes, Vitest source tests, Prisma order/sales facts, Fly `mcfly-analytics`.

## Global Constraints

- Public mark **Mcfly Analytics**. Firm **Mcfly Ads**. Line **Spend next to sales**.
- Listing (do not invent): https://apps.shopify.com/mcfly-analytics-public · 7-day trial then **$39**/store/month · reviews **0**.
- Religion: **Total ROAS = Shopify Total Sales ÷ entered spend**. Empty spend is not 0×. No pixels / MTA / OAuth zoo / Klaviyo.
- Approved pull: `read_orders` + `read_customers`. Order API ~60 days at install. Never paint missing last year as $0.
- Spec SoT: `docs/plans/2026-09-15-TAB_LOCK.md`. Layout inventory: `docs/plans/2026-09-15-CURRENT_DESK_LAYOUT.md`.
- Execute in **`marketing-mix-model/`** (this dirty tree is the live desk). Do **not** implement in `mcfly-analytics/` (detached HEAD). Do **not** Fly-deploy from `cursor/clean-revamp-v8`.
- Workers do **not** `fly deploy`. Conductor deploys Fly after Pass A (then again after Pass B). App URL stays https://mcfly-analytics.fly.dev.
- Commit **only** `app/app/**`, `app/app/styles/mcfly-desk.css`, and `docs/plans/**` + Partner testing copy. Never stage `site/**` with this work.
- Cursor does not click Partner Submit. Marty pastes testing instructions and recaptures listing shots.
- Do not add a 12th analysis tab. Do not remount `SpendExplorer` on Overview.
- Shopify `s-app-nav` has no group headers. **Order** is the grouping.

---

## File map

| File | Responsibility |
| --- | --- |
| `app/app/lib/desk-nav.ts` | `DESK_PRIMARY_NAV` order + labels |
| `app/app/lib/desk-nav.test.ts` | Nav contract tests |
| `app/app/routes/app.tsx` | Renders `s-app-nav` from that array |
| `app/app/lib/overview-yoy.ts` | **Exists.** `buildOverviewYoyCards` |
| `app/app/lib/overview-yoy.test.ts` | **Exists.** |
| `app/app/lib/mer-control.ts` | `CashChip.priorSales` **exists.** Pass B: compare / intel stay here |
| `app/app/components/OverviewYoyCards.tsx` | **Exists, unmounted.** Mount on Overview |
| `app/app/routes/app._index.tsx` | Slim to YoY cards. Keep `buildCashControlBoard` in loader |
| `app/app/components/ShopifyBookSection.tsx` | Groups `period` \| `buyers` \| `timing` \| `growth`. Split duplicate rows |
| `app/app/routes/app.customers.tsx` | New. Buyers book minus LTV snap |
| `app/app/routes/app.growth.tsx` | New. Growth group + order-history repeat |
| `app/app/routes/app.buyers.tsx` | Redirect → `/app/customers` |
| `app/app/routes/app.timing.tsx` | Redirect → `/app/orders` |
| `app/app/routes/app.orders.tsx` | `groups={["period","timing"]}` |
| `app/app/routes/app.ltv.tsx` | Keep. Add avg orders in 90 days if missing |
| `app/app/routes/app.spend.tsx` | Pass B: input only |
| `app/app/routes/app.roas.tsx` | Pass B: explorer + dual-close + pacing + intel |
| `app/app/routes/app.yoy.tsx` | Pass B: month/LM/LY + last 7 vs prior 7 |
| `app/app/routes/app.cpa.tsx` | Pass B: cash CPA/CAC |
| `app/app/routes/app.allocation.tsx` | Pass B: keep mix/pie; drop explorer remount |
| `app/app/routes/app.goals.tsx` | Exists. Add to nav in Pass B |
| `app/app/styles/mcfly-desk.css` | `.mcfly-yoy` grid |
| `docs/PARTNER_TESTING_INSTRUCTIONS.md` | Smoke steps for the new nav |
| `docs/LIVING_BOARD.md` | Stamp after each Fly (Conductor) |

**Already landed (do not rewrite from scratch):** `overview-yoy.ts` + test, `CashChip.priorSales`, `ShopifyBookSection` `growth` group + `growthHero`/`growthRows`, `OverviewYoyCards.tsx`, `PRODUCT_NOUN.growthTitle` / `buyersTitle: "Customers"`. Nav array is **wrong** (still 7 items, Orders after LTV, label still Marketing). Overview still mounts `OverviewFirstViewport` + explorer.

---

### Task 1: Nav contract (Pass A)

**Files:**
- Modify: `app/app/lib/desk-nav.ts`
- Test: `app/app/lib/desk-nav.test.ts`

**Interfaces:**
- Consumes: `DeskNavItem { path, label, hash? }`
- Produces: `DESK_PRIMARY_NAV` Pass A = Overview, Customers, Growth, Orders, LTV, Spend Upload, Settings

Pass A keeps **Spend Upload** in the bar so typed spend does not vanish. Goals stays at `/app/goals` but **out of nav** until Pass B. Total ROAS / Allocation / YoY / CPA are not in this array yet.

- [ ] **Step 1: Write the failing nav test**

In `app/app/lib/desk-nav.test.ts` replace the `DESK_PRIMARY_NAV` label expectation:

```ts
describe("DESK_PRIMARY_NAV", () => {
  it("is Shopify five, then Spend Upload, then Settings", () => {
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).toEqual([
      "Overview",
      "Customers",
      "Growth",
      "Orders",
      "LTV",
      "Spend Upload",
      "Settings",
    ]);
    expect(DESK_PRIMARY_NAV.map((item) => item.path)).toEqual([
      "/app",
      "/app/customers",
      "/app/growth",
      "/app/orders",
      "/app/ltv",
      "/app/spend",
      "/app/settings",
    ]);
    expect(DESK_PRIMARY_NAV.every((item) => !item.hash)).toBe(true);
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).not.toContain("Buyers");
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).not.toContain("Timing");
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).not.toContain("Marketing");
  });

  it("Overview live chrome is as-of + share — no window rail, no explorer", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");
    const tabs = readFileSync(
      join(here, "../components/DeskOverviewTabs.tsx"),
      "utf8",
    );
    expect(tabs).toContain("mcfly-desk-chrome");
    expect(overview).toContain("<DeskOverviewTabs");
    expect(overview).toContain("<OverviewYoyCards");
    expect(overview).not.toContain("<DeskWindowRail");
    expect(overview).not.toContain("<SpendExplorer");
    expect(overview).not.toContain("<OverviewFirstViewport");
    expect(overview).not.toContain("<DualCloseLine");
    expect(overview).not.toContain("<MonthlyPacing");
    expect(overview).not.toContain("<CashControlBoard");
    expect(overview).not.toContain("<ShopifyBookSection");
  });
});
```

Leave `deskNavHref` tests that mention `/app/goals` — that URL still exists.

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd "/Users/martysmithson/Documents/MCFLY ANALYTICS APP/marketing-mix-model/app"
npx vitest run app/lib/desk-nav.test.ts
```

Expected: FAIL — labels still include Buyers / Timing / Marketing, or Overview still contains `OverviewFirstViewport`.

- [ ] **Step 3: Set Pass A nav array**

In `app/app/lib/desk-nav.ts` set:

```ts
export const DESK_PRIMARY_NAV: readonly DeskNavItem[] = [
  { path: "/app", label: "Overview" },
  { path: "/app/customers", label: "Customers" },
  { path: "/app/growth", label: "Growth" },
  { path: "/app/orders", label: "Orders" },
  { path: "/app/ltv", label: "LTV" },
  { path: "/app/spend", label: "Spend Upload" },
  { path: "/app/settings", label: "Settings" },
];
```

Do **not** yet slim `app._index.tsx` in this task — the Overview assertion will still fail until Task 4. That is OK: finish the array now, keep the Overview chrome test in the file, and only require the **label/path** `it` to pass before moving on if you split the describe blocks. Prefer one describe: skip or comment the Overview chrome `it` until Task 4 if you need a green Task 1. **Preferred:** keep both tests; Task 1 lands the array; Task 4 makes the Overview test pass.

If you keep both tests in one run, Task 1 is done when paths/labels match even if the Overview `it` is still red.

- [ ] **Step 4: Run label test in isolation (optional)**

```bash
npx vitest run app/lib/desk-nav.test.ts -t "is Shopify five"
```

Expected: PASS.

- [ ] **Step 5: Commit** (when founder approved commits for this plan)

```bash
git add app/app/lib/desk-nav.ts app/app/lib/desk-nav.test.ts
git commit -m "$(cat <<'EOF'
feat(app): Pass A nav is Shopify five then Spend Upload

EOF
)"
```

---

### Task 2: Split book rows (Customers ≠ Growth ≠ Orders)

**Files:**
- Modify: `app/app/components/ShopifyBookSection.tsx`
- Test: `app/app/lib/desk-sample-ux.test.ts` (source assertions on the book file)

**Interfaces:**
- Consumes: `ShopifyBookGroup = "period" | "buyers" | "timing" | "growth"`
- Produces: `buyersRows` without retention timing; `periodRows` includes biggest 10% of **orders**; `growthRows` owns days-to-second / 2nd-in-30 / 2nd vs 3rd+ / 2nd vs 1st

Today `buyersRows` still contains Growth metrics and “Biggest orders”. That is the old Buyers pile-up.

- [ ] **Step 1: Write failing source tests**

Add to `app/app/lib/desk-sample-ux.test.ts`:

```ts
it("Customers book is returning dollars; Growth owns who came back; Orders owns ticket skew", () => {
  const book = read("../components/ShopifyBookSection.tsx");
  const buyersFn = book.slice(
    book.indexOf("function buyersRows"),
    book.indexOf("function growthRows"),
  );
  const growthFn = book.slice(
    book.indexOf("function growthRows"),
    book.indexOf("function timingRows"),
  );
  const periodFn = book.slice(
    book.indexOf("function periodRows"),
    book.indexOf("function buyersRows"),
  );
  expect(buyersFn).toContain("New vs returning dollars");
  expect(buyersFn).toContain("PRODUCT_NOUN.bookSalesPerBuyer");
  expect(buyersFn).toContain("PRODUCT_NOUN.bookGuestCheckouts");
  expect(buyersFn).toContain("PRODUCT_NOUN.bookOneOrderBuyers");
  expect(buyersFn).toContain("Top 10% of customers");
  expect(buyersFn).toContain("PRODUCT_NOUN.bookOrdersPerBuyer");
  expect(buyersFn).toContain("Repeat sales");
  expect(buyersFn).not.toContain("PRODUCT_NOUN.bookSecondWithin30");
  expect(buyersFn).not.toContain("PRODUCT_NOUN.bookSecondVsThird");
  expect(buyersFn).not.toContain("PRODUCT_NOUN.bookSecondVsFirst");
  expect(buyersFn).not.toContain("Days to a second order");
  expect(buyersFn).not.toContain("Biggest orders");
  expect(growthFn).toContain("PRODUCT_NOUN.bookSecondWithin30");
  expect(growthFn).toContain("PRODUCT_NOUN.bookSecondVsThird");
  expect(growthFn).toContain("Days to a second order");
  expect(periodFn).toContain("Biggest orders");
  expect(periodFn).toContain("topDecileSalesShare");
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run app/lib/desk-sample-ux.test.ts -t "Customers book is returning"
```

Expected: FAIL because `buyersRows` still contains `bookSecondWithin30` and `Biggest orders`.

- [ ] **Step 3: Move rows**

In `buyersRows`:
- Keep: new vs returning $, $ per buyer, **Repeat sales** (`repeatSalesShare`), guests (+ guest vs account typical $ already on the guest row), one-order buyers, **Top 10% of customers**, orders per buyer.
- Delete from `buyersRows`: days to second, `bookSecondWithin30`, `bookSecondVsThird`, `bookSecondVsFirst`, Biggest orders (`topDecileSalesShare`).

In `periodRows`, after shipping+tax (or with typical-order rows), add the Biggest orders block currently in `buyersRows`:

```ts
  if (hasShare(depth.topDecileSalesShare)) {
    rows.push({
      k: "Biggest orders",
      v: pct(depth.topDecileSalesShare),
      d: "Share of sales from the largest 10% of orders in this window.",
    });
  }
```

`growthRows` already has new customers, new vs returning dollars, days to second, 2nd in 30, 2nd vs 3rd+, 2nd vs 1st. **Remove “New vs returning dollars” from `growthRows`** so Customers owns that split; Growth hero is first-time $ only.

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run app/lib/desk-sample-ux.test.ts -t "Customers book is returning"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/app/components/ShopifyBookSection.tsx app/app/lib/desk-sample-ux.test.ts
git commit -m "$(cat <<'EOF'
fix(app): split Customers, Growth, and Orders book rows

EOF
)"
```

---

### Task 3: Customers + Growth routes and old-URL redirects

**Files:**
- Create: `app/app/routes/app.customers.tsx`
- Create: `app/app/routes/app.growth.tsx`
- Modify: `app/app/routes/app.buyers.tsx` (redirect)
- Modify: `app/app/routes/app.timing.tsx` (redirect)
- Modify: `app/app/routes/app.orders.tsx`
- Test: `app/app/lib/desk-sample-ux.test.ts`

**Interfaces:**
- Consumes: `loadDeskSalesPage(request, path)`, `shopifyNativePeriodStats`, `ShopifyBookSection`
- Produces: `/app/customers`, `/app/growth`; 302 from `/app/buyers` and `/app/timing`

React Router file routes pick up `app.customers.tsx` automatically. No `routes.ts` edit.

- [ ] **Step 1: Write failing source tests**

Replace the Overview / buyers / timing assertions in `desk-sample-ux.test.ts` that still expect `OverviewFirstViewport` and `/app/buyers` loaders. Add:

```ts
it("Pass A book routes exist and old URLs redirect", () => {
  const customers = read("../routes/app.customers.tsx");
  const growth = read("../routes/app.growth.tsx");
  const orders = read("../routes/app.orders.tsx");
  const buyers = read("../routes/app.buyers.tsx");
  const timing = read("../routes/app.timing.tsx");
  expect(customers).toContain("loadDeskSalesPage");
  expect(customers).toContain('groups={["buyers"]}');
  expect(customers).not.toContain("LtvSnapSection");
  expect(customers).not.toContain("cashCostPerCustomer");
  expect(growth).toContain("loadDeskSalesPage");
  expect(growth).toContain('groups={["growth"]}');
  expect(growth).toContain("tillLtv.repeatRate");
  expect(growth).toContain("/app/ltv");
  expect(growth).not.toContain("cashCac");
  expect(orders).toContain('groups={["period", "timing"]}');
  expect(buyers).toContain('throw redirect(`/app/customers');
  expect(timing).toContain('throw redirect(`/app/orders');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run app/lib/desk-sample-ux.test.ts -t "Pass A book routes"
```

Expected: FAIL — `app.customers.tsx` missing.

- [ ] **Step 3: Write `app.customers.tsx`**

Copy `app.buyers.tsx` structure. Loader: `loadDeskSalesPage(request, "/app/customers")`. Heading `PRODUCT_NOUN.buyersTitle` (already `"Customers"`). **Do not** mount `LtvSnapSection`. **Do not** compute `cashCpa`.

```tsx
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskBookPage } from "../components/DeskBookPage";
import { ShopifyBookSection } from "../components/ShopifyBookSection";
import { deskPeriodTillLabel } from "../lib/desk-history";
import { loadDeskSalesPage } from "../lib/desk-sales-page.server";
import { PRODUCT_NOUN } from "../lib/product-labels";
import { shopifyNativePeriodStats } from "../lib/shopify-native-stats";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return loadDeskSalesPage(request, "/app/customers");
};

export default function CustomersPage() {
  const { metrics, preset, shotMode, useSampleDesk, salesError } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const tillLabel = deskPeriodTillLabel({
    periodLabel: metrics.period.label,
    useSampleDesk,
    shotMode,
    salesError,
    blockedMockAsLive: metrics.blockedMockAsLive,
    salesSource: metrics.salesSource,
  });
  const book = shopifyNativePeriodStats({
    sales: metrics.sales,
    orderCount: metrics.orderCount,
    newCustomers: metrics.newCustomers,
    returningCustomers: metrics.returningCustomers,
    guestOrders: metrics.guestOrders,
    customerMetricsAvailable: metrics.customerMetricsAvailable,
    newCustomerNetSales: metrics.newCustomerNetSales,
    returningCustomerNetSales: metrics.returningCustomerNetSales,
    grossSales: metrics.grossSales,
    grossSalesKnown: metrics.grossSalesKnown,
  });
  const totalSalesDisplay = metrics.totalSalesAmount ?? metrics.sales;

  return (
    <DeskBookPage
      heading={PRODUCT_NOUN.buyersTitle}
      tillLabel={tillLabel}
      preset={preset}
      shotMode={shotMode}
      useSampleDesk={useSampleDesk}
      isLoading={isLoading}
    >
      {metrics.salesPending ? (
        <p className="mcfly-book__lede">
          Sales for closed days are still loading — not $0.
        </p>
      ) : (
        <ShopifyBookSection
          book={book}
          depth={metrics.shopifyDepth}
          clocks={{
            gross: metrics.grossSales,
            grossKnown: metrics.grossSalesKnown,
            total: totalSalesDisplay,
            net: metrics.netSales,
            netKnown: metrics.netSalesKnown,
          }}
          groups={["buyers"]}
          title={PRODUCT_NOUN.buyersTitle}
          muted={PRODUCT_NOUN.buyersMuted}
        />
      )}
    </DeskBookPage>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
```

- [ ] **Step 4: Write `app.growth.tsx`**

Same loader path `"/app/growth"`. Mount `ShopifyBookSection` `groups={["growth"]}` with `PRODUCT_NOUN.growthTitle` / `growthMuted`. After the book, if `metrics.tillLtv.repeatRate != null`, one `<details>` row “Repeat rate” with the percent (order history, not email). List first-order months as **headcount only** from `metrics.tillLtv.cohorts` (month label + `customers` count — no CAC). Footer: `<s-link href="/app/ltv">{PRODUCT_NOUN.openLtv}</s-link>`. No `cashCac`, no `LtvSnapSection`.

Percent helper (same as LTV page): `` `${Math.round(share * 100)}%` ``.

- [ ] **Step 5: Redirects**

`app.buyers.tsx`:

```tsx
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const url = new URL(request.url);
  const qs = url.searchParams.toString();
  throw redirect(`/app/customers${qs ? `?${qs}` : ""}`);
};

export default function BuyersRedirect() {
  return null;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
```

`app.timing.tsx`: same pattern → `/app/orders`.

- [ ] **Step 6: Orders deep dive**

In `app.orders.tsx` change groups to:

```tsx
groups={["period", "timing"]}
```

Keep `PRODUCT_NOUN.ordersMuted` (already mentions weekends / Online vs POS).

- [ ] **Step 7: Run the source test**

```bash
npx vitest run app/lib/desk-sample-ux.test.ts -t "Pass A book routes"
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app/app/routes/app.customers.tsx app/app/routes/app.growth.tsx app/app/routes/app.buyers.tsx app/app/routes/app.timing.tsx app/app/routes/app.orders.tsx app/app/lib/desk-sample-ux.test.ts
git commit -m "$(cat <<'EOF'
feat(app): Customers and Growth pages; Orders includes timing

EOF
)"
```

---

### Task 4: Overview = three YoY sales cards

**Files:**
- Modify: `app/app/routes/app._index.tsx`
- Modify: `app/app/styles/mcfly-desk.css`
- Modify: `app/app/lib/overview-first-viewport.test.ts`
- Modify: `app/app/lib/desk-sample-ux.test.ts`
- Keep: `app/app/components/OverviewYoyCards.tsx`, `app/app/lib/overview-yoy.ts`

**Interfaces:**
- Consumes: `buildCashControlBoard` → `chips`; `buildOverviewYoyCards(chips)`
- Produces: Overview JSX with `<OverviewYoyCards cards={...} salesPending={metrics.salesPending} />` only (plus existing chrome / trust banners)

- [ ] **Step 1: Confirm YoY unit tests still pass**

```bash
npx vitest run app/lib/overview-yoy.test.ts app/lib/mer-control.test.ts
```

Expected: PASS (`priorSales` + three-card builder). If mer-control YoY case is missing, add:

```ts
  it("YoY chips carry last-year sales dollars, not a fake $0", () => {
    const rows = [
      ...septDeterioration(),
      day("2025-09-01", 9_000, 3_000, [{ channel: "meta", amount: 3_000 }]),
      day("2025-09-15", 9_000, 3_000, [{ channel: "meta", amount: 3_000 }]),
    ];
    const { days } = certifyDailyRows(rows);
    const chips = buildCashChips(days, 4);
    const mtd = chips.find((c) => c.id === "mtd");
    expect(mtd?.priorSales).toBe(18_000);
    expect(mtd?.priorFromKey).toBe("2025-09-01");
  });
```

- [ ] **Step 2: Rewrite Overview chrome source tests so they fail for the right reason**

In `overview-first-viewport.test.ts` replace the “Overview home is the scoreboard” `it` with:

```ts
  it("Overview home is three YoY sales cards", () => {
    const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");
    expect(overview).toContain("<OverviewYoyCards");
    expect(overview).toContain("buildOverviewYoyCards");
    expect(overview).toContain("<DeskOverviewTabs");
    expect(overview).not.toContain("<OverviewFirstViewport");
    expect(overview).not.toContain("<DeskWindowRail");
    expect(overview).not.toContain("<SpendExplorer");
    expect(overview).not.toContain("<DualCloseLine");
    expect(overview).not.toContain("<MonthlyPacing");
    expect(overview).not.toContain("<ShopifyBookSection");
    expect(overview).not.toContain("<MarketingSnapSection");
  });
```

Keep the `overviewNoticeSentence` unit tests — that helper may still exist for unused first-viewport; do not delete the module this task.

Update every `desk-sample-ux.test.ts` expect that requires `<OverviewFirstViewport` / `<SpendExplorer` on Overview to require `<OverviewYoyCards` and `not.toContain("<SpendExplorer")` **on the overview file** (SpendExplorer must remain on `app.spend.tsx` until Pass B).

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run app/lib/overview-first-viewport.test.ts app/lib/desk-nav.test.ts
```

Expected: FAIL — `app._index.tsx` still mounts first viewport.

- [ ] **Step 4: Slim `app._index.tsx`**

Imports: add `OverviewYoyCards` and `buildOverviewYoyCards`. Remove JSX mounts of `OverviewFirstViewport`, `DeskWindowRail`, `DualCloseLine`, `SpendExplorer`, `MonthlyPacing`. You may leave loader series computation temporarily if removing it is a large diff; **must not** reference `explorer` / `monthPace` in the render tree (prefix unused with void or delete). Prefer deleting unused imports so `typecheck` is clean.

In the scoreboard block (`scoreboardReady && onHome`):

```tsx
{scoreboardReady && onHome ? (
  <div className="mcfly-desk-anchor" id={DESK_SECTION.overview}>
    <OverviewYoyCards
      cards={buildOverviewYoyCards(cashControl?.chips ?? [])}
      salesPending={metrics.salesPending}
    />
  </div>
) : null}
```

Keep: Sample banner, trust banners, sales-error retry, `DeskOverviewTabs` (as-of + freshness + Share). Do **not** mount `PeriodControl` on live Overview (shot mode may keep it). Do not show Total ROAS on this page.

- [ ] **Step 5: CSS for three cards**

Append to `app/app/styles/mcfly-desk.css` (reuse book tokens, no new palette):

```css
.mcfly-yoy {
  margin: 0 0 2rem;
}

.mcfly-yoy__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem 1.5rem;
}

.mcfly-yoy__k {
  margin: 0 0 0.4rem;
  color: var(--mcfly-mute);
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.075em;
  text-transform: uppercase;
}

.mcfly-yoy__v {
  margin: 0;
  font-family: var(--mcfly-display);
  font-size: clamp(1.6rem, 3vw, 2.4rem);
  font-variant-numeric: tabular-nums lining-nums;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1.1;
}

.mcfly-yoy__vs,
.mcfly-yoy__miss {
  margin: 0.55rem 0 0;
  color: var(--mcfly-mute);
  font-size: 0.88rem;
  line-height: 1.45;
}

@media (max-width: 52rem) {
  .mcfly-yoy__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

- [ ] **Step 6: Run tests**

```bash
npx vitest run app/lib/overview-yoy.test.ts app/lib/overview-first-viewport.test.ts app/lib/desk-nav.test.ts app/lib/desk-sample-ux.test.ts app/lib/easy-add-spend-tab.test.ts
```

Expected: PASS. `easy-add-spend-tab` must still find `<SpendExplorer` on **spend**, not Overview.

- [ ] **Step 7: Typecheck**

```bash
npm run typecheck --workspace=app
```

Working directory: `marketing-mix-model`. Expected: no errors from unused Overview imports.

- [ ] **Step 8: Commit**

```bash
git add app/app/routes/app._index.tsx app/app/components/OverviewYoyCards.tsx app/app/styles/mcfly-desk.css app/app/lib/overview-first-viewport.test.ts app/app/lib/desk-sample-ux.test.ts app/app/lib/desk-nav.test.ts
git commit -m "$(cat <<'EOF'
feat(app): Overview is three YoY sales cards

EOF
)"
```

---

### Task 5: LTV row pin + Partner smoke copy (Pass A done)

**Files:**
- Modify: `app/app/routes/app.ltv.tsx` if `avgOrdersD90` is not already a visible row
- Modify: `docs/PARTNER_TESTING_INSTRUCTIONS.md`
- Test: `app/app/lib/ltv-sales-spine.test.ts` (source contains `avgOrdersD90` in the route)

**Interfaces:**
- Consumes: `metrics.tillLtv.avgOrdersD90: number | null`
- Produces: LTV drill row “Orders in first 90 days” when finite

- [ ] **Step 1: Failing test**

```ts
it("LTV page shows avg orders in 90 days from order history", () => {
  const ltv = readFileSync(join(here, "../routes/app.ltv.tsx"), "utf8");
  expect(ltv).toContain("avgOrdersD90");
  expect(ltv).toMatch(/Orders in first 90 days/);
});
```

Put this in `app/app/lib/ltv-sales-spine.test.ts` (it already reads the LTV route).

- [ ] **Step 2: Run to verify fail** (skip if the string already exists — then this task is copy-only)

- [ ] **Step 3: Add the row** next to first-90 $ using the same `BookRows` pattern. Omit when `avgOrdersD90 == null`. Format with `toFixed(1)`. Definition: “Average orders per new buyer in the first 90 days, from Shopify orders — not an email list.”

- [ ] **Step 4: Partner testing paste** — in `docs/PARTNER_TESTING_INSTRUCTIONS.md` replace the desk list and smoke Overview paragraph:

```text
- One plan, whole desk: Overview, Customers, Growth, Orders, LTV,
  Spend Upload, Settings. Goals remains at /app/goals. Nothing is
  feature-gated.
```

Smoke step 1 must say Overview is **This month / This quarter / This year** sales vs last year, not typical-order cards. Spend optional. Missing last year is a sentence about the ~60-day pull, never $0.

Do not invent install counts or reviews.

- [ ] **Step 5: Run**

```bash
npx vitest run app/lib/ltv-sales-spine.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add app/app/routes/app.ltv.tsx app/app/lib/ltv-sales-spine.test.ts docs/PARTNER_TESTING_INSTRUCTIONS.md
git commit -m "$(cat <<'EOF'
feat(app): LTV 90-day order count; Pass A Partner smoke copy

EOF
)"
```

---

### Task 6: Pass A ship gate (Conductor)

**Files:** none except `docs/LIVING_BOARD.md` after deploy.

- [ ] **Step 1: Full app tests**

```bash
cd "/Users/martysmithson/Documents/MCFLY ANALYTICS APP/marketing-mix-model/app"
npx vitest run
```

Expected: PASS. Fix any leftover source tests that still mention Buyers / Timing / Overview explorer.

- [ ] **Step 2: Typecheck**

```bash
cd "/Users/martysmithson/Documents/MCFLY ANALYTICS APP/marketing-mix-model"
npm run typecheck --workspace=app
```

Expected: PASS.

- [ ] **Step 3: Conductor `fly deploy`** from this tree (`cursor/spend-trust-recurring`), **not** `clean-revamp-v8`. Workers do not run this step.

- [ ] **Step 4: Probe**

```bash
curl -sS -o /dev/null -w "%{http_code}" https://mcfly-analytics.fly.dev/health
curl -sS -o /dev/null -w "%{http_code}" https://mcfly-analytics.fly.dev/app
```

Expected: `200` and `200`.

- [ ] **Step 5: Marty Admin smoke (human)** — Live data, $0 extra spend: Overview three cards; Customers / Growth / Orders / LTV; Spend Upload still adds a day; Settings. Report Result. Recapture listing shots 3–4 if they still say Buyers / Timing.

- [ ] **Step 6: Stamp `docs/LIVING_BOARD.md`** Fly version + “Pass A Shopify five live”. Do not invent reviews.

**Pass A definition of done:** stranger, Sample off, empty spend, sees YoY sales cards and four Shopify book tabs. Explorer is gone from Overview. Spend Upload still works.

---

## Pass B — spend tools (only after Pass A is on Fly)

Do not start Pass B until Marty reports Pass A Result or Conductor has Fly probes + nav screenshot-equivalent (Admin smoke).

Pass B nav (replace the array from Task 1):

```ts
export const DESK_PRIMARY_NAV: readonly DeskNavItem[] = [
  { path: "/app", label: "Overview" },
  { path: "/app/customers", label: "Customers" },
  { path: "/app/growth", label: "Growth" },
  { path: "/app/orders", label: "Orders" },
  { path: "/app/ltv", label: "LTV" },
  { path: "/app/spend", label: "Spend Upload" },
  { path: "/app/roas", label: "Total ROAS" },
  { path: "/app/allocation", label: "Channel Allocation" },
  { path: "/app/yoy", label: "YoY" },
  { path: "/app/cpa", label: "CPA" },
  { path: "/app/goals", label: "Goals" },
  { path: "/app/settings", label: "Settings" },
];
```

---

### Task 7: Pass B nav test

**Files:** `app/app/lib/desk-nav.ts`, `app/app/lib/desk-nav.test.ts`

- [ ] **Step 1: Failing test** — expect 12 labels in the order above.
- [ ] **Step 2: Run** `npx vitest run app/lib/desk-nav.test.ts -t "Shopify five"` — FAIL until array updates.
- [ ] **Step 3: Write the 12-item array.**
- [ ] **Step 4: PASS.**
- [ ] **Step 5: Commit** `feat(app): Pass B nav lists spend tools after Shopify five`

---

### Task 8: Spend Upload becomes input-only

**Files:**
- Modify: `app/app/routes/app.spend.tsx`
- Modify: `app/app/lib/easy-add-spend-tab.test.ts`
- Modify: `app/app/lib/marketing-spend-room.test.ts`

**Interfaces:**
- Produces: Spend route mounts doors + add-a-day + recurring + import link + coverage strip + recent entries. **Does not** mount `SpendExplorer`, `MarketingSpendRoom` mix/plan/intel, dual-close, or period ROAS hero.

Empty Live copy stays: Shopify sales already here; empty spend is not 0×.

- [ ] **Step 1: Failing tests**

```ts
it("Spend Upload is input only", () => {
  const spend = read("../routes/app.spend.tsx");
  expect(spend).toContain("mcfly-spend-add");
  expect(spend).not.toContain("<SpendExplorer");
  expect(spend).not.toContain("<MarketingSpendRoom");
  expect(spend).not.toContain("<DualCloseLine");
});
```

Keep a separate test that **Total ROAS** route (Task 9) contains `<SpendExplorer`.

- [ ] **Step 2: Run — FAIL** (explorer still on spend).
- [ ] **Step 3: Strip analysis JSX from `app.spend.tsx`.** Leave loader spend writes. Coverage strip + recent list stay. Footer link: `<s-link href="/app/roas">Total ROAS</s-link>` when `hasSpend`.
- [ ] **Step 4: Update `easy-add-spend-tab.test.ts` / `marketing-spend-room.test.ts`** to read `app.roas.tsx` for explorer+room instead of `app.spend.tsx`.
- [ ] **Step 5: PASS + commit** `fix(app): Spend Upload is input only`

---

### Task 9: Total ROAS page

**Files:**
- Create: `app/app/routes/app.roas.tsx`
- Test: `app/app/lib/easy-add-spend-tab.test.ts`

**Interfaces:**
- Consumes: existing spend loader pieces — `buildSpendExplorerSeries`, `buildCashControlBoard`, `buildControlPace`
- Produces: `/app/roas` with Sales | Spend | Total ROAS pair (ROAS **blank** when spend is 0, never 0×), `<SpendExplorer>` with range/grain **on the chart** (`quiet` false), `<DualCloseLine>`, `<MonthlyPacing>`, intel last-7 / last-28 from `MarketingSpendRoom` intel **or** a slimmer extract. Mix table / pie **not** here.

Empty: sales still show; CTA to `/app/spend`. Formula line once: `PRODUCT_NOUN.definition`.

`loadDeskSalesPage` is not enough (needs explorer series). Duplicate the **read-only** loader from `app.spend.tsx` (authenticate, sample/live sales, `buildDashboardMetrics`, `buildSpendExplorerSeries`, `buildCashControlBoard`, `buildControlPace`). **Do not** copy `action` — POSTs stay on `/app/spend`.

Render skeleton (fill props from that loader the same way `app.spend.tsx` does today):

```tsx
<s-page heading="Total ROAS" inlineSize="large">
  <p className="mcfly-book__lede">{PRODUCT_NOUN.definition}</p>
  {/* Sales | Spend | Total ROAS pair. If !hasSpend, ROAS cell is "—" plus
      s-link to /app/spend. Never format 0.00×. */}
  <SpendExplorer series={explorer} period={preset} shotMode={shotMode} />
  {cashControl?.dualClose ? (
    <DualCloseLine close={cashControl.dualClose} targetMer={cashControl.targetMer} />
  ) : null}
  {monthPace && cashControl ? (
    <MonthlyPacing
      sales={cashControl.dualClose?.mtd.sales ?? 0}
      spend={cashControl.dualClose?.mtd.spend ?? 0}
      mer={cashControl.dualClose?.mtd.mer ?? null}
      targetMer={cashControl.targetMer}
      heading="This month"
      periodLabel={monthPace.densityLabel}
      control={monthPace}
    />
  ) : null}
  {cashControl ? (
    <MarketingSpendRoom board={cashControl} />
  ) : null}
</s-page>
```

Intel (hit rate / last 7 / last 28) may stay inside `MarketingSpendRoom` on this page until Task 10 moves mix off it.

- [ ] **Step 1: Test** `app.roas.tsx` contains `<SpendExplorer`, `<DualCloseLine`, `<MonthlyPacing`, `PRODUCT_NOUN.definition`, and `not.toContain("mcfly-spend-add")`.
- [ ] **Step 2: FAIL** (file missing).
- [ ] **Step 3: Create the route from the skeleton. Range/grain stay on `SpendExplorer` (not `s-app-nav`).
- [ ] **Step 4: PASS + commit** `feat(app): Total ROAS page owns the explorer`

---

### Task 10: Channel Allocation without a second explorer

**Files:** `app/app/routes/app.allocation.tsx`, `app/app/lib/allocation-honesty.test.ts`

- [ ] **Step 1: Test** `app.allocation.tsx` `not.toContain("<SpendExplorer")` and still contains mix window labels (`This month`, `Last 7 days`, `This quarter`). Test a new `SpendMixPlan.tsx` exists and `MarketingSpendRoom.tsx` no longer contains `MIX_WINDOWS`.
- [ ] **Step 2: FAIL** if explorer still remounted.
- [ ] **Step 3: Create `app/app/components/SpendMixPlan.tsx` by moving mix-window buttons, mix table, daily cap, and pie out of `MarketingSpendRoom.tsx`. Mount `SpendMixPlan` only on `app.allocation.tsx`. Unmount `<SpendExplorer>` from allocation. Leave intel on Total ROAS via `MarketingSpendRoom`.
- [ ] **Step 4: PASS + commit** `fix(app): Channel Allocation is mix and cap, not a fourth explorer`

---

### Task 11: YoY workspace

**Files:**
- Create: `app/app/routes/app.yoy.tsx`
- Create: `app/app/lib/yoy-workspace.ts` (pure)
- Test: `app/app/lib/yoy-workspace.test.ts`

**Interfaces:**

```ts
export type YoyCompareRow = {
  label: string;
  sales: number;
  priorSales: number | null;
  spend: number;
  priorSpend: number | null;
  mer: number | null;
  priorMer: number | null;
};

export function last7VsPrior7(days: CertifiedDay[]): YoyCompareRow;
```

Use `buildCashChips` / `compareMix` / existing Marketing compare table data from `mer-control.ts` (`CashControlBoard`). Prefer exporting a function from `mer-control.ts` if compare rows already exist rather than duplicating.

- [ ] **Step 1: Failing unit test** — given certified days for this month and last year, `last7VsPrior7` returns sales on both sides; `priorSales` null when last year window empty (not 0).
- [ ] **Step 2: FAIL.**
- [ ] **Step 3: Implement helper + page.** Page: this month vs last month vs last year (sales always; spend/ROAS columns hidden when spend is 0). Last 7 vs prior 7. Monthly 12-row table can wait if Goals already has it — **link to Goals** rather than clone the editable board. Missing last year uses `OVERVIEW_YOY_MISSING` (import from `overview-yoy.ts`).
- [ ] **Step 4: PASS + commit** `feat(app): YoY workspace for month and last-7 compare`

---

### Task 12: CPA page

**Files:**
- Create: `app/app/routes/app.cpa.tsx`
- Test: `app/app/lib/shopify-native-stats.test.ts` already covers `cashCostPerCustomer`

**Interfaces:**
- Consumes: `cashCostPerCustomer(totalSpend, identifiedBuyers)`, `metrics.tillLtv.cashCac`, `metrics.amer`
- Produces: `/app/cpa`

- [ ] **Step 1: Source test** — `app.cpa.tsx` contains `cashCostPerCustomer`, `cashCac`, `PRODUCT_NOUN.amer`, `never` `0.00×`, and when `!hasSpend` a sentence to Spend Upload (not `$0` CPA).
- [ ] **Step 2: FAIL.**
- [ ] **Step 3: Page using `loadDeskSalesPage(request, "/app/cpa")`.** Cards: Cash CPA, Cash CAC, New sales ÷ spend. Payback days if `tillLtv.paybackDays != null`. Links to LTV and Spend Upload. Window: this month from `preset` (page as-of, not nav chips).
- [ ] **Step 4: PASS + commit** `feat(app): CPA from typed spend`

---

### Task 13: Goals in the bar + Advanced unlinked

**Files:** `app/app/routes/app.advanced.tsx` (leave URL), `app/app/routes/app.goals.tsx` (no explorer), Partner copy

- [ ] **Step 1: Test** `DESK_PRIMARY_NAV` includes Goals; `app.advanced.tsx` is **not** in the array; spend footer does not primary-link Advanced.
- [ ] **Step 2: Partner testing** list becomes the 11 analysis tabs + Settings.
- [ ] **Step 3: `npx vitest run` + `npm run typecheck --workspace=app`.**
- [ ] **Step 4: Commit** `docs: Pass B Partner smoke lists 11 analysis tabs`

---

### Task 14: Pass B Fly (Conductor)

Same as Task 6: vitest, typecheck, Conductor `fly deploy`, curl `/health` `/app`, Marty smoke: type one spend day → Total ROAS paints; empty spend on CPA is not $0; Allocation has no explorer; YoY last year missing is honest.

Stamp Living Board. **Ads still NO** until `FUNNEL_WEEKLY.md` has an organic week.

---

## Marty-only (never a Task agent)

- Partner paste of testing instructions after Pass A, again after Pass B.
- Admin smoke Result.
- Listing screenshot recapture (Buyers/Timing shots are stale).
- Partner Submit.
- Ads budget (four gates still closed: smoke PASS, 3 honest reviews, organic week, P0 on Fly).

---

## Out of scope (do not sneak in)

- `read_all_orders`, pixels, Klaviyo, sessions, products/SKU, in-page duplicate nav chrome, explorer back on Overview, site HTML, job-search, inventing reviews.

---

## Self-review

| Spec item | Task |
| --- | --- |
| Overview three YoY cards, never $0 last year | 4 (+ existing `overview-yoy`) |
| Customers without LTV/CAC | 2, 3 |
| Growth first-time + who came back | 2, 3 |
| Orders + timing | 3 |
| LTV + avg orders 90d | 5 |
| Spend Upload input only | 8 |
| Total ROAS owns explorer | 9 |
| Channel Allocation mix/pie/cap | 10 |
| YoY workspace + last 7 | 11 |
| CPA | 12 |
| Goals in bar | 7, 13 |
| Time not in top bar | Overview has no PeriodControl; explorer range on chart; mix windows on mix table; Goals year on Goals |
| Shopify pass before spend pass | Tasks 1–6 then 7–14 |
| Settings not an analysis tab | Always last in nav |
| Fly + Partner | 6, 14, Marty |
