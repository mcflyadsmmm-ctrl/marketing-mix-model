/**
 * P1-D predictive LTV — a written-out estimate beside realized order LTV.
 *
 * Expected value = average order value × expected orders.
 * Expected orders = 1 + the share who came back, among buyers in first-order
 * months that have lived the window (the same months the triangle paints).
 * One later order per returner. Not a hidden model. Order history only.
 *
 * A missing input stays null. Callers paint "—" — never $0.
 */

import type { CustomerDepth } from "./ltv-depth";
import { paintedYearDollars } from "./ltv-year-honesty";

/** Same floor as the first-order triangle. Locked equal in tests. */
export const EXPECTED_LTV_MIN_MATURE = 8;
/** Same month cap as the first-order triangle. Locked equal in tests. */
export const EXPECTED_LTV_MAX_MONTH_ROWS = 14;

export const EXPECTED_LTV_FORMULA_LABEL =
  "Estimate — formula: average order value × expected orders";

const WINDOWS = [90, 365, 30] as const;
type HorizonDays = (typeof WINDOWS)[number];

export interface ExpectedLtvEstimate {
  /** Null when average order value or come-back is not on file. */
  expected: number | null;
  horizonDays: HorizonDays | null;
  /** Net dollars ÷ orders among buyers in sealed first-order months. */
  averageOrderValue: number | null;
  /** 1 + share who came back. Null when that share is not on file. */
  expectedOrders: number | null;
  /** Share who placed a second order inside the horizon. */
  comeBack: number | null;
  buyers: number;
  orders: number;
  /**
   * Honesty line. Always starts with {@link EXPECTED_LTV_FORMULA_LABEL}.
   * When both inputs exist, the plugged product is on the same line.
   */
  formula: string;
  /** `aov × expected orders = product`, or null when an input is missing. */
  plug: string | null;
  /** What each input is, in shop-owner English. */
  inputs: string;
  /** Plugged arithmetic, or "—" when an input is missing. Never "$0". */
  display: string;
}

function horizonLabel(days: HorizonDays): string {
  switch (days) {
    case 30:
      return "first 30 days";
    case 90:
      return "first 90 days";
    case 365:
      return "first year";
    default: {
      const _exhaustive: never = days;
      return _exhaustive;
    }
  }
}

function windowSpend(customer: CustomerDepth, days: HorizonDays): number {
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

function windowOrders(customer: CustomerDepth, days: HorizonDays): number {
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

function lived(customer: CustomerDepth, asOf: Date, days: number): boolean {
  const delta = Math.floor(
    (asOf.getTime() - customer.firstOrderedAt.getTime()) / 86_400_000,
  );
  return delta >= days;
}

/**
 * Plug line from the cents a merchant can multiply.
 * `68.97 × 1.50 = 103.46` — half-up on the product of the shown factors.
 */
function shownFactors(
  averageOrderValue: number,
  expectedOrders: number,
): { aovText: string; ordersText: string; plug: string } {
  const aovCents = Math.round(averageOrderValue * 100);
  const orderHundredths = Math.round(expectedOrders * 100);
  const productCents = Math.round((aovCents * orderHundredths) / 100);
  const aovText = (aovCents / 100).toFixed(2);
  const ordersText = (orderHundredths / 100).toFixed(2);
  const productText = (productCents / 100).toFixed(2);
  return {
    aovText,
    ordersText,
    plug: `${aovText} × ${ordersText} = ${productText}`,
  };
}

function missingEstimate(): ExpectedLtvEstimate {
  return {
    expected: null,
    horizonDays: null,
    averageOrderValue: null,
    expectedOrders: null,
    comeBack: null,
    buyers: 0,
    orders: 0,
    formula: EXPECTED_LTV_FORMULA_LABEL,
    plug: null,
    inputs:
      "Average order value — · expected orders —. Who came back is not on file yet for a first-order month. Not $0.",
    display: "—",
  };
}

function recentMonthKeys(customers: CustomerDepth[]): string[] {
  const months = [...new Set(customers.map((c) => c.cohortMonth))].sort();
  return months.slice(-EXPECTED_LTV_MAX_MONTH_ROWS);
}

/**
 * Buyers in first-order months (the triangle's recent months) who have lived
 * `days`, kept only for months that cleared the same maturity floor as a
 * painted triangle cell.
 */
function sealedBuyers(
  customers: CustomerDepth[],
  monthKeys: readonly string[],
  asOf: Date,
  days: HorizonDays,
): CustomerDepth[] {
  const allowed = new Set(monthKeys);
  const groups = new Map<string, CustomerDepth[]>();
  for (const customer of customers) {
    if (!allowed.has(customer.cohortMonth)) continue;
    const list = groups.get(customer.cohortMonth) ?? [];
    list.push(customer);
    groups.set(customer.cohortMonth, list);
  }
  const picked: CustomerDepth[] = [];
  for (const members of groups.values()) {
    const mature = members.filter((customer) => lived(customer, asOf, days));
    if (mature.length < EXPECTED_LTV_MIN_MATURE) continue;
    picked.push(...mature);
  }
  return picked;
}

/**
 * Predictive LTV from order history only.
 *
 * Prefers the first 90 days (the realized hero window), then the first year,
 * then 30 days. Needs two first-order months on the triangle and one sealed
 * window. Otherwise every numeric input stays null.
 */
export function expectedLtvFromRetention(
  customers: CustomerDepth[],
  asOf: Date,
  options?: { omitYear?: boolean },
): ExpectedLtvEstimate {
  const monthKeys = recentMonthKeys(customers);
  if (monthKeys.length < 2) return missingEstimate();
  const windows = options?.omitYear
    ? WINDOWS.filter((days) => days !== 365)
    : WINDOWS;

  let horizon: HorizonDays | null = null;
  let buyers: CustomerDepth[] = [];
  for (const days of windows) {
    const sealed = sealedBuyers(customers, monthKeys, asOf, days);
    if (sealed.length < EXPECTED_LTV_MIN_MATURE) continue;
    horizon = days;
    buyers = sealed;
    break;
  }
  if (horizon == null) return missingEstimate();

  let spend = 0;
  let orders = 0;
  let back = 0;
  for (const customer of buyers) {
    spend += windowSpend(customer, horizon);
    orders += windowOrders(customer, horizon);
    if (customer.reorderDays != null && customer.reorderDays <= horizon) {
      back += 1;
    }
  }
  if (!(orders > 0) || !(buyers.length > 0)) return missingEstimate();

  const comeBack = back / buyers.length;
  const averageOrderValue = spend / orders;
  const expectedOrders = 1 + comeBack;
  const expected = averageOrderValue * expectedOrders;
  if (
    !Number.isFinite(comeBack) ||
    !Number.isFinite(averageOrderValue) ||
    !Number.isFinite(expectedOrders) ||
    !Number.isFinite(expected)
  ) {
    return missingEstimate();
  }
  if (horizon === 365 && paintedYearDollars(expected) == null) {
    return missingEstimate();
  }

  const shown = shownFactors(averageOrderValue, expectedOrders);
  const cameBackPct = `${Math.round(comeBack * 100)}%`;
  const window = horizonLabel(horizon);
  return {
    expected,
    horizonDays: horizon,
    averageOrderValue,
    expectedOrders,
    comeBack,
    buyers: buyers.length,
    orders,
    formula: `${EXPECTED_LTV_FORMULA_LABEL} → ${shown.plug}`,
    plug: shown.plug,
    inputs:
      `Average order value ${shown.aovText} = net dollars ÷ orders in the ${window}. ` +
      `Expected orders ${shown.ordersText} = 1 + ${cameBackPct} who came back. ` +
      `Same buyers as the first-order month table. One later order per returner — not a hidden forecast. Not a promise.`,
    display: shown.plug,
  };
}
