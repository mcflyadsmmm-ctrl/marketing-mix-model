/**
 * Product→LTV — which first product / path drives higher lifetime value.
 *
 * First-product is a stored title on the buyer's first order. Buyers without
 * a title do not form a product row. The book does not store a product title,
 * so the board stays an honest empty instead of a guessed catalog.
 *
 * Windows seal the same way as the LTV flagship: enough buyers who started
 * with that product must have lived 30 / 90 / 365 days. A dash is not $0.
 * Year-scale product LTV paints only when the approved full book has matured
 * those buyers. Order history only — no spend, no COGS, no pixels.
 *
 * Merchant chrome: first product, came back, later order. Never "cohort",
 * "ARPU", "till", or "p25–p75".
 */

import {
  rollUpCustomers,
  type CustomerDepth,
  type DepthOrder,
} from "./ltv-depth";
import {
  FIRST_PRODUCT_SYNC_COPY,
  FIRST_PRODUCT_TITLES_COPY,
  FIRST_PRODUCT_TITLES_VERB,
} from "./ltv-first-product";

/** Same 30 / 90 / 365 seals as the LTV flagship — copied, not imported, to keep this chunk isolated. */
type ProductWindow = 30 | 90 | 365;

/** Buyers who started with the same named product before a row is honest. */
export const PRODUCT_MIN_BUYERS = 8;
/** First-product cards kept on the board — densest few, not a catalog dump. */
export const PRODUCT_MAX_ROWS = 4;

const DAY_MS = 86_400_000;

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / DAY_MS);
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

function matureForWindow(
  customers: CustomerDepth[],
  asOf: Date,
  days: ProductWindow,
): CustomerDepth[] {
  return customers.filter((c) => daysBetween(c.firstOrderedAt, asOf) >= days);
}

function windowSpend(customer: CustomerDepth, days: ProductWindow): number {
  switch (days) {
    case 30:
      return customer.day30Spend;
    case 90:
      return customer.day90Spend;
    case 365:
      return customer.day365Spend;
    default: {
      const _exhaustive: never = days;
      return _exhaustive;
    }
  }
}

function windowOrders(customer: CustomerDepth, days: ProductWindow): number {
  switch (days) {
    case 30:
      return customer.ordersD30;
    case 90:
      return customer.ordersD90;
    case 365:
      return customer.ordersD365;
    default: {
      const _exhaustive: never = days;
      return _exhaustive;
    }
  }
}

function laterOrderAverage(
  mature: CustomerDepth[],
  days: ProductWindow,
): number | null {
  const later: number[] = [];
  for (const c of mature) {
    const extra = Math.max(0, windowOrders(c, days) - 1);
    if (extra <= 0) continue;
    const extraDollars = Math.max(0, windowSpend(c, days) - c.firstAmount);
    later.push(extraDollars / extra);
  }
  return mean(later);
}

function extraOrderAverage(
  mature: CustomerDepth[],
  days: ProductWindow,
): number | null {
  if (mature.length === 0) return null;
  return mean(mature.map((c) => Math.max(0, windowOrders(c, days) - 1)));
}

function predictedFromParts(
  firstOrder: number | null,
  extraOrders: number | null,
  laterOrder: number | null,
): number | null {
  if (firstOrder == null) return null;
  return firstOrder + (extraOrders ?? 0) * (laterOrder ?? 0);
}

function formulaLine(
  label: string,
  firstOrder: number,
  extraOrders: number,
  laterOrder: number,
  predicted: number,
): string {
  const later = laterOrder > 0 ? laterOrder : 0;
  return (
    `${label} ≈ average first order + average extra orders × average later order` +
    ` → ${firstOrder.toFixed(2)} + ${extraOrders.toFixed(2)} × ${later.toFixed(2)}` +
    ` = ${predicted.toFixed(2)}`
  );
}

function windowLabel(days: ProductWindow): string {
  switch (days) {
    case 30:
      return "First 30 days";
    case 90:
      return "First 90 days";
    case 365:
      return "First year";
    default: {
      const _exhaustive: never = days;
      return _exhaustive;
    }
  }
}

function sealedWindow(
  members: CustomerDepth[],
  asOf: Date,
  days: ProductWindow,
  minMature: number,
): { value: number | null; n: number; comeBack: number | null } {
  const mature = matureForWindow(members, asOf, days);
  if (mature.length < minMature) {
    return { value: null, n: mature.length, comeBack: null };
  }
  let back = 0;
  for (const c of mature) {
    if (c.reorderDays != null && c.reorderDays <= days) back += 1;
  }
  return {
    value: mean(mature.map((c) => windowSpend(c, days))),
    n: mature.length,
    comeBack: back / mature.length,
  };
}

function nextProductDriver(members: CustomerDepth[]): {
  nextProduct: string | null;
  nextShare: number | null;
  sameShare: number | null;
} {
  const counts = new Map<string, number>();
  let named = 0;
  let same = 0;
  for (const c of members) {
    if (!c.secondProduct) continue;
    named += 1;
    if (c.firstProduct && c.secondProduct === c.firstProduct) same += 1;
    counts.set(c.secondProduct, (counts.get(c.secondProduct) ?? 0) + 1);
  }
  if (named === 0) {
    return { nextProduct: null, nextShare: null, sameShare: null };
  }
  let nextProduct: string | null = null;
  let nextCount = 0;
  for (const [name, count] of counts) {
    if (count > nextCount) {
      nextProduct = name;
      nextCount = count;
    }
  }
  return {
    nextProduct,
    nextShare: nextProduct != null ? nextCount / named : null,
    sameShare: same / named,
  };
}

export interface FirstProductLtvRow {
  product: string;
  buyers: number;
  lifetimeLtv: number;
  day30Ltv: number | null;
  day90Ltv: number | null;
  day365Ltv: number | null;
  day30N: number;
  day90N: number;
  day365N: number;
  comeBack30: number | null;
  comeBack90: number | null;
  comeBack365: number | null;
  /** Product 90-day value ÷ shop 90-day value, when both are sealed. */
  lift90: number | null;
  /** Product year value ÷ shop year value, when both are sealed. */
  lift365: number | null;
  firstOrder90: number | null;
  extraOrders90: number | null;
  laterOrder90: number | null;
  predicted90: number | null;
  observed90: number | null;
  formula90: string | null;
  /** Most common titled next product among these starters (path driver). */
  nextProduct: string | null;
  nextShare: number | null;
  sameShare: number | null;
}

export interface ProductLtvRead {
  product: string;
  worth: number;
  worthDays: ProductWindow;
  worthLabel: string;
  buyers: number;
  comeBack: number | null;
  lift: number | null;
  nextProduct: string | null;
  nextShare: number | null;
  yearPending: boolean;
  estimate: number | null;
  observed: number | null;
}

export type ProductEmptyKind = "syncing" | "titles" | "thin" | "young";

export interface ProductEmpty {
  kind: ProductEmptyKind;
  buyers: number;
  namedBuyers: number;
  need: number;
  copy: string;
  verb: string;
}

export interface ProductLtvView {
  /** Titled first-line items are on file (SAMPLE) vs hidden (live Level 1). */
  productsKnown: boolean;
  buyers: number;
  namedBuyers: number;
  shop90: number | null;
  shop365: number | null;
  rows: FirstProductLtvRow[];
  best: FirstProductLtvRow | null;
  read: ProductLtvRead | null;
  empty: ProductEmpty | null;
}

function shopWindow(
  customers: CustomerDepth[],
  asOf: Date,
  days: ProductWindow,
  minMature: number,
): number | null {
  const mature = matureForWindow(customers, asOf, days);
  if (mature.length < minMature) return null;
  return mean(mature.map((c) => windowSpend(c, days)));
}

function sortProductRows(rows: FirstProductLtvRow[]): FirstProductLtvRow[] {
  return [...rows].sort((a, b) => {
    if (a.day90Ltv != null && b.day90Ltv != null && a.day90Ltv !== b.day90Ltv) {
      return b.day90Ltv - a.day90Ltv;
    }
    if (a.day90Ltv != null && b.day90Ltv == null) return -1;
    if (a.day90Ltv == null && b.day90Ltv != null) return 1;
    if (a.day30Ltv != null && b.day30Ltv != null && a.day30Ltv !== b.day30Ltv) {
      return b.day30Ltv - a.day30Ltv;
    }
    if (a.day365Ltv != null && b.day365Ltv != null && a.day365Ltv !== b.day365Ltv) {
      return b.day365Ltv - a.day365Ltv;
    }
    if (a.lifetimeLtv !== b.lifetimeLtv) return b.lifetimeLtv - a.lifetimeLtv;
    return b.buyers - a.buyers;
  });
}

function productDailyRead(
  best: FirstProductLtvRow | null,
): ProductLtvRead | null {
  if (!best) return null;
  const prefer: Array<{
    days: ProductWindow;
    value: number | null;
    comeBack: number | null;
    lift: number | null;
    n: number;
  }> = [
    {
      days: 90,
      value: best.day90Ltv,
      comeBack: best.comeBack90,
      lift: best.lift90,
      n: best.day90N,
    },
    {
      days: 30,
      value: best.day30Ltv,
      comeBack: best.comeBack30,
      lift: null,
      n: best.day30N,
    },
    {
      days: 365,
      value: best.day365Ltv,
      comeBack: best.comeBack365,
      lift: best.lift365,
      n: best.day365N,
    },
  ];
  const pick = prefer.find((p) => p.value != null);
  if (!pick || pick.value == null) return null;
  return {
    product: best.product,
    worth: pick.value,
    worthDays: pick.days,
    worthLabel: windowLabel(pick.days),
    buyers: pick.n,
    comeBack: pick.comeBack,
    lift: pick.lift,
    nextProduct: best.nextProduct,
    nextShare: best.nextShare,
    yearPending: best.day365Ltv == null,
    estimate: pick.days === 90 ? best.predicted90 : null,
    observed: pick.days === 90 ? best.observed90 : null,
  };
}

/**
 * First-win empty when no first-product window has sealed. Never a blank
 * chart. Titles / thin / young / syncing — not $0 LTV.
 */
export function productLtvEmptyState(input: {
  buyers: number;
  namedBuyers: number;
  productsKnown: boolean;
  sealed: boolean;
  need?: number;
}): ProductEmpty | null {
  const need = input.need ?? PRODUCT_MIN_BUYERS;
  if (input.sealed) return null;
  if (input.buyers <= 0) {
    return {
      kind: "syncing",
      buyers: 0,
      namedBuyers: 0,
      need,
      copy: FIRST_PRODUCT_SYNC_COPY,
      verb: "Refresh this page",
    };
  }
  if (!input.productsKnown || input.namedBuyers <= 0) {
    return {
      kind: "titles",
      buyers: input.buyers,
      namedBuyers: 0,
      need,
      copy: FIRST_PRODUCT_TITLES_COPY,
      verb: FIRST_PRODUCT_TITLES_VERB,
    };
  }
  if (input.namedBuyers < need) {
    return {
      kind: "thin",
      buyers: input.buyers,
      namedBuyers: input.namedBuyers,
      need,
      copy: `${input.namedBuyers.toLocaleString()} ${input.namedBuyers === 1 ? "buyer" : "buyers"} started with a named product. A first-product row seals after ${need} have lived 30 days — not $0.`,
      verb: "Watch first 30 days",
    };
  }
  return {
    kind: "young",
    buyers: input.buyers,
    namedBuyers: input.namedBuyers,
    need,
    copy: `${input.namedBuyers.toLocaleString()} named starters on file. First 30 days seals once those buyers have lived 30 days — not $0.`,
    verb: "Wait for day 30",
  };
}

function summarizeProduct(
  product: string,
  members: CustomerDepth[],
  asOf: Date,
  shop90: number | null,
  shop365: number | null,
  minMature: number,
): FirstProductLtvRow | null {
  if (members.length < minMature) return null;
  const d30 = sealedWindow(members, asOf, 30, minMature);
  const d90 = sealedWindow(members, asOf, 90, minMature);
  const d365 = sealedWindow(members, asOf, 365, minMature);
  const lifetime = mean(members.map((c) => c.lifetimeSpend));
  if (lifetime == null) return null;

  const mature90 = matureForWindow(members, asOf, 90);
  const firstOrder90 =
    mature90.length >= minMature ? mean(mature90.map((c) => c.firstAmount)) : null;
  const extraOrders90 =
    mature90.length >= minMature ? extraOrderAverage(mature90, 90) : null;
  const laterOrder90 =
    mature90.length >= minMature ? laterOrderAverage(mature90, 90) : null;
  const predicted90 =
    mature90.length >= minMature
      ? predictedFromParts(firstOrder90, extraOrders90, laterOrder90)
      : null;
  const observed90 =
    mature90.length >= minMature
      ? mean(mature90.map((c) => c.day90Spend))
      : null;
  const driver = nextProductDriver(members);

  return {
    product,
    buyers: members.length,
    lifetimeLtv: lifetime,
    day30Ltv: d30.value,
    day90Ltv: d90.value,
    day365Ltv: d365.value,
    day30N: d30.n,
    day90N: d90.n,
    day365N: d365.n,
    comeBack30: d30.comeBack,
    comeBack90: d90.comeBack,
    comeBack365: d365.comeBack,
    lift90:
      d90.value != null && shop90 != null && shop90 > 0
        ? d90.value / shop90
        : null,
    lift365:
      d365.value != null && shop365 != null && shop365 > 0
        ? d365.value / shop365
        : null,
    firstOrder90,
    extraOrders90,
    laterOrder90,
    predicted90,
    observed90,
    formula90:
      predicted90 != null &&
      firstOrder90 != null &&
      extraOrders90 != null
        ? formulaLine(
            "First 90 days",
            firstOrder90,
            extraOrders90,
            laterOrder90 ?? 0,
            predicted90,
          )
        : null,
    nextProduct: driver.nextProduct,
    nextShare: driver.nextShare,
    sameShare: driver.sameShare,
  };
}

/**
 * First-product → LTV / path drivers from titled first-line items.
 * Rows below {@link PRODUCT_MIN_BUYERS} drop out. Windows stay null until
 * enough of those starters have lived the window — never a fake year.
 */
export function buildProductLtv(
  orders: DepthOrder[],
  asOf: Date,
  options?: { minBuyers?: number; maxRows?: number },
): ProductLtvView {
  const minBuyers = options?.minBuyers ?? PRODUCT_MIN_BUYERS;
  const maxRows = options?.maxRows ?? PRODUCT_MAX_ROWS;
  const customers = rollUpCustomers(orders);
  const productsKnown = orders.some((o) => o.product != null && o.product !== "");
  const named = customers.filter(
    (c) => c.firstProduct != null && c.firstProduct !== "",
  );
  const shop90 = shopWindow(customers, asOf, 90, minBuyers);
  const shop365 = shopWindow(customers, asOf, 365, minBuyers);

  const groups = new Map<string, CustomerDepth[]>();
  for (const c of named) {
    const key = c.firstProduct!;
    const list = groups.get(key) ?? [];
    list.push(c);
    groups.set(key, list);
  }

  const rows: FirstProductLtvRow[] = [];
  for (const [product, members] of groups) {
    const row = summarizeProduct(
      product,
      members,
      asOf,
      shop90,
      shop365,
      minBuyers,
    );
    if (row) rows.push(row);
  }
  const ranked = sortProductRows(rows).slice(0, maxRows);
  const best =
    ranked.find(
      (row) =>
        row.day90Ltv != null || row.day30Ltv != null || row.day365Ltv != null,
    ) ?? null;
  const read = productDailyRead(best);
  const empty = productLtvEmptyState({
    buyers: customers.length,
    namedBuyers: named.length,
    productsKnown,
    sealed: read != null,
    need: minBuyers,
  });

  return {
    productsKnown,
    buyers: customers.length,
    namedBuyers: named.length,
    shop90,
    shop365,
    rows: ranked,
    best,
    read,
    empty,
  };
}
