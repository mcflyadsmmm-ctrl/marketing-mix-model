/**
 * Order economics Shopify Analytics buries — typical order, weekend vs
 * weekday till share, new vs returning sales. No sessions, no conversion
 * rate, no path credit. Spend is optional; this is the zero-spend wedge.
 */

export type OrderEconomicsInput = {
  sales: number;
  orderCount: number;
  /** Calendar keys `YYYY-MM-DD` → sales that day (shop-local when facts use IANA). */
  salesByDay: Map<string, number> | Record<string, number>;
  newCustomerSales: number;
  returningCustomerSales: number;
};

export type OrderEconomics = {
  sales: number;
  orderCount: number;
  /** Null when no orders. */
  aov: number | null;
  weekdaySales: number;
  weekendSales: number;
  /** Weekend share of weekday+weekend sales; null when both are 0. */
  weekendShare: number | null;
  newCustomerSales: number;
  returningCustomerSales: number;
  /** Returning share of new+returning; null when both are 0. */
  returningShare: number | null;
  /** True when there is any order or sales signal to show. */
  hasSignal: boolean;
};

function asDayMap(
  salesByDay: Map<string, number> | Record<string, number>,
): Iterable<[string, number]> {
  if (salesByDay instanceof Map) return salesByDay.entries();
  return Object.entries(salesByDay);
}

/** Sunday=0 … Saturday=6 from a `YYYY-MM-DD` calendar key (UTC noon). */
export function dayOfWeekFromKey(dayKey: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey.trim());
  if (!m) return -1;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return -1;
  return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)).getUTCDay();
}

export function isWeekendDayKey(dayKey: string): boolean {
  const dow = dayOfWeekFromKey(dayKey);
  return dow === 0 || dow === 6;
}

export function resolveOrderEconomics(
  input: OrderEconomicsInput,
): OrderEconomics {
  const sales = Number.isFinite(input.sales) ? Math.max(0, input.sales) : 0;
  const orderCount = Number.isFinite(input.orderCount)
    ? Math.max(0, Math.floor(input.orderCount))
    : 0;
  const newCustomerSales = Number.isFinite(input.newCustomerSales)
    ? Math.max(0, input.newCustomerSales)
    : 0;
  const returningCustomerSales = Number.isFinite(input.returningCustomerSales)
    ? Math.max(0, input.returningCustomerSales)
    : 0;

  let weekdaySales = 0;
  let weekendSales = 0;
  for (const [key, amount] of asDayMap(input.salesByDay)) {
    if (!Number.isFinite(amount) || amount <= 0) continue;
    if (dayOfWeekFromKey(key) < 0) continue;
    if (isWeekendDayKey(key)) weekendSales += amount;
    else weekdaySales += amount;
  }

  const weekTotal = weekdaySales + weekendSales;
  const cohortTotal = newCustomerSales + returningCustomerSales;

  return {
    sales,
    orderCount,
    aov: orderCount > 0 ? sales / orderCount : null,
    weekdaySales,
    weekendSales,
    weekendShare: weekTotal > 0 ? weekendSales / weekTotal : null,
    newCustomerSales,
    returningCustomerSales,
    returningShare: cohortTotal > 0 ? returningCustomerSales / cohortTotal : null,
    hasSignal: sales > 0 || orderCount > 0,
  };
}

/** Serialize Map for Remix loader JSON. */
export function salesByDayToRecord(
  salesByDay: Map<string, number>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of salesByDay) {
    if (Number.isFinite(v) && v !== 0) out[k] = v;
  }
  return out;
}
