/**
 * Overview first-screen math — OrderFact sums only.
 * Never write these day sums into SalesDayFact. Never label them as
 * Shopify Total Sales or Analytics-matched. Guests are never returning.
 */

export const OVERVIEW_FROM_ORDERS_LABEL = "From orders";

export const OVERVIEW_ORDERS_EMPTY_LINE = "Orders still loading — not $0.";

export const OVERVIEW_PRIOR_MISSING_LINE = "Last year not on file.";

export const OVERVIEW_CHART_CAPTION = "Orders";

/** Guest / anonymous keys never count as returning. */
export const OVERVIEW_ORDER_GUEST_KEY = "guest";

export type OverviewOrderBookRow = {
  amount: number;
  orderedAt: Date;
  customerKey: string;
  shopLocalDate: Date;
};

export type OverviewOrderBookHero = {
  /** Window order-amount sum. Null when the book is empty — never a fake $0. */
  sales: number | null;
  /** Same window shifted one year. Null when no prior orders on file. */
  priorSales: number | null;
  /** Whole-percent YoY. Null when prior is missing or zero. */
  yoyPct: number | null;
  zone: "up" | "down" | "even" | "empty";
  returningSales: number | null;
  typicalOrder: number | null;
  weekendShare: number | null;
  orderCount: number;
  empty: boolean;
};

function finiteAmount(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

function isGuest(key: string): boolean {
  const trimmed = key.trim().toLowerCase();
  return !trimmed || trimmed === OVERVIEW_ORDER_GUEST_KEY;
}

/** Sum of order amounts — OrderFact book dollars, not SalesDayFact. */
export function sumOrderBookAmounts(orders: OverviewOrderBookRow[]): number {
  let total = 0;
  for (const row of orders) {
    total += finiteAmount(row.amount);
  }
  return total;
}

/**
 * Returning $ = amounts on orders after that customer’s first order on file.
 * Guests never returning. Not ShopifyQL New/Returning.
 */
export function orderBookReturningSales(
  windowOrders: OverviewOrderBookRow[],
  firstByCustomer: Map<string, number>,
): number {
  let returning = 0;
  for (const row of windowOrders) {
    if (isGuest(row.customerKey)) continue;
    const first = firstByCustomer.get(row.customerKey);
    if (first == null) continue;
    if (row.orderedAt.getTime() > first) {
      returning += finiteAmount(row.amount);
    }
  }
  return returning;
}

/** Earliest orderedAt per identified customer across the full book on file. */
export function orderBookFirstOrderMs(
  orders: OverviewOrderBookRow[],
): Map<string, number> {
  const first = new Map<string, number>();
  for (const row of orders) {
    if (isGuest(row.customerKey)) continue;
    const t = row.orderedAt.getTime();
    const prev = first.get(row.customerKey);
    if (prev == null || t < prev) first.set(row.customerKey, t);
  }
  return first;
}

export function filterOrdersInRange(
  orders: OverviewOrderBookRow[],
  start: Date,
  end: Date,
): OverviewOrderBookRow[] {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return orders.filter((row) => {
    const t = row.orderedAt.getTime();
    return t >= startMs && t <= endMs;
  });
}

/** Same calendar window one year earlier (UTC instant shift by −1 year). */
export function shiftRangeOneYear(start: Date, end: Date): {
  start: Date;
  end: Date;
} {
  const priorStart = new Date(start.getTime());
  priorStart.setUTCFullYear(priorStart.getUTCFullYear() - 1);
  const priorEnd = new Date(end.getTime());
  priorEnd.setUTCFullYear(priorEnd.getUTCFullYear() - 1);
  return { start: priorStart, end: priorEnd };
}

/**
 * Day series for the Overview chart — display only.
 * Do not upsert these as shopifyql_sales_day_v1.
 */
export function orderBookDaySeries(
  orders: OverviewOrderBookRow[],
): Array<{ dateKey: string; sales: number; orders: number }> {
  const map = new Map<string, { sales: number; orders: number }>();
  for (const row of orders) {
    const y = row.shopLocalDate.getUTCFullYear();
    const m = String(row.shopLocalDate.getUTCMonth() + 1).padStart(2, "0");
    const d = String(row.shopLocalDate.getUTCDate()).padStart(2, "0");
    const dateKey = `${y}-${m}-${d}`;
    const prev = map.get(dateKey) ?? { sales: 0, orders: 0 };
    prev.sales += finiteAmount(row.amount);
    prev.orders += 1;
    map.set(dateKey, prev);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, value]) => ({ dateKey, ...value }));
}

function medianOf(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * Weekend share when enough sales days exist (≥5); otherwise null → —.
 */
export function orderBookWeekendShare(
  orders: OverviewOrderBookRow[],
): number | null {
  const daySales = new Map<string, number>();
  let weekend = 0;
  let total = 0;
  for (const row of orders) {
    const amt = finiteAmount(row.amount);
    total += amt;
    const y = row.shopLocalDate.getUTCFullYear();
    const m = String(row.shopLocalDate.getUTCMonth() + 1).padStart(2, "0");
    const d = String(row.shopLocalDate.getUTCDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    daySales.set(key, (daySales.get(key) ?? 0) + amt);
    const dow = row.shopLocalDate.getUTCDay();
    if (dow === 0 || dow === 6) weekend += amt;
  }
  const daysWithSales = [...daySales.values()].filter((n) => n > 0).length;
  if (daysWithSales < 5 || !(total > 0)) return null;
  return weekend / total;
}

export function overviewYoyPct(
  sales: number,
  priorSales: number | null,
): number | null {
  if (priorSales == null || !(priorSales > 0) || !Number.isFinite(sales)) {
    return null;
  }
  return ((sales - priorSales) / priorSales) * 100;
}

export function overviewYoyZoneFromPct(
  pct: number | null,
): OverviewOrderBookHero["zone"] {
  if (pct == null || !Number.isFinite(pct)) return "empty";
  if (pct > 0) return "up";
  if (pct < 0) return "down";
  return "even";
}

/**
 * Build the Overview first-screen order-book hero.
 * Empty book → sales null (paint —), never $0 theater.
 */
export function buildOverviewOrderBookHero(input: {
  windowOrders: OverviewOrderBookRow[];
  priorOrders: OverviewOrderBookRow[];
  firstByCustomer: Map<string, number>;
  typicalOrder?: number | null;
}): OverviewOrderBookHero {
  const orderCount = input.windowOrders.length;
  if (!(orderCount > 0)) {
    return {
      sales: null,
      priorSales: null,
      yoyPct: null,
      zone: "empty",
      returningSales: null,
      typicalOrder: null,
      weekendShare: null,
      orderCount: 0,
      empty: true,
    };
  }
  const sales = sumOrderBookAmounts(input.windowOrders);
  const priorRaw = sumOrderBookAmounts(input.priorOrders);
  const priorSales = input.priorOrders.length > 0 ? priorRaw : null;
  const yoyPct = overviewYoyPct(sales, priorSales);
  const returning = orderBookReturningSales(
    input.windowOrders,
    input.firstByCustomer,
  );
  const typical =
    input.typicalOrder != null && Number.isFinite(input.typicalOrder)
      ? input.typicalOrder
      : medianOf(input.windowOrders.map((row) => finiteAmount(row.amount)));
  return {
    sales,
    priorSales,
    yoyPct,
    zone: overviewYoyZoneFromPct(yoyPct),
    returningSales: returning > 0 ? returning : null,
    typicalOrder: typical != null && typical > 0 ? typical : null,
    weekendShare: orderBookWeekendShare(input.windowOrders),
    orderCount,
    empty: false,
  };
}

/**
 * Canonical hero sentence:
 * "This month is $X — up N% vs the same days last year."
 */
export function overviewOrderHeroSentence(input: {
  periodLabel: string;
  salesLabel: string | null;
  yoyPct: number | null;
  empty: boolean;
  missingPrior: boolean;
}): string {
  if (input.empty || input.salesLabel == null) {
    return OVERVIEW_ORDERS_EMPTY_LINE;
  }
  const period = input.periodLabel.trim() || "This period";
  if (input.missingPrior || input.yoyPct == null) {
    return `${period} is ${input.salesLabel} — ${OVERVIEW_PRIOR_MISSING_LINE}`;
  }
  const rounded = Math.round(input.yoyPct);
  if (rounded === 0) {
    return `${period} is ${input.salesLabel} — even vs the same days last year.`;
  }
  const direction = rounded > 0 ? "up" : "down";
  return `${period} is ${input.salesLabel} — ${direction} ${Math.abs(rounded)}% vs the same days last year.`;
}

export function overviewOrderDeltaLabel(input: {
  yoyPct: number | null;
  missingPrior: boolean;
}): string | null {
  if (input.missingPrior || input.yoyPct == null) return null;
  const rounded = Math.round(input.yoyPct);
  if (rounded === 0) return "Even vs last year";
  const arrow = rounded > 0 ? "↑" : "↓";
  return `${arrow} ${Math.abs(rounded)}% vs last year`;
}
