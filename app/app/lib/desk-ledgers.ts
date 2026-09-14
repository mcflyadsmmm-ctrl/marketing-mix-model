/**
 * Pure ledger row builders — Days / Orders / Buyers / Cohorts.
 */

import { formatShopMoney } from "./mer-format";

export type DayLedgerRowInput = {
  dayKey: string;
  sales: number;
  netSales: number | null;
  grossSales: number | null;
  orderCount: number;
  newCustomers: number;
  returningCustomers: number;
  newCustomerSales: number;
  returningCustomerSales: number;
  guestOrders: number;
  customerMetricsAvailable: boolean;
  asOf: string | null;
  source: string;
  open?: boolean;
  missing?: boolean;
};

export type DayLedgerRow = {
  dayKey: string;
  sales: string;
  netSales: string;
  grossSales: string;
  orders: string;
  aov: string;
  newBuyers: string;
  returningBuyers: string;
  newSales: string;
  returningSales: string;
  guestOrders: string;
  asOf: string;
  source: string;
  flag: string;
};

export type OrderLedgerRowInput = {
  shopifyOrderId: string;
  dayKey: string;
  orderedAtIso: string;
  amount: number;
  discountTotal: number | null;
  shippingTotal: number | null;
  taxTotal: number | null;
  unitCount: number | null;
  customerKey: string;
  currency: string | null;
  isGuest: boolean;
  lifetimeOrderRank: number | null;
};

export type OrderLedgerRow = {
  orderId: string;
  dayKey: string;
  orderedAt: string;
  total: string;
  discount: string;
  shipping: string;
  tax: string;
  units: string;
  buyer: string;
  segment: string;
};

export type BuyerLedgerRowInput = {
  customerKey: string;
  firstDayKey: string;
  lastDayKey: string;
  orderCount: number;
  lifetimeSales: number;
  periodSales: number;
  daysToSecond: number | null;
};

export type BuyerLedgerRow = {
  buyer: string;
  firstDay: string;
  lastDay: string;
  orders: string;
  lifetimeSales: string;
  periodSales: string;
  aov: string;
  daysToSecond: string;
  segment: string;
};

export type CohortLedgerRowInput = {
  cohortMonth: string;
  customers: number;
  revenueD30: number;
  revenueD90: number;
  revenueD365: number;
  ordersD30: number;
  ordersD90: number;
  ordersD365: number;
};

export type CohortLedgerRow = {
  cohortMonth: string;
  buyers: string;
  revenueD30: string;
  revenueD90: string;
  revenueD365: string;
  ltvD30: string;
  ltvD90: string;
  ltvD365: string;
  ordersD30: string;
  ordersD90: string;
  ordersD365: string;
};

export function shortOpaqueId(key: string): string {
  const trimmed = key.trim();
  if (!trimmed || trimmed === "guest") return "Guest";
  const tail = trimmed.includes("/")
    ? (trimmed.split("/").pop() ?? trimmed)
    : trimmed;
  if (tail.length <= 8) return tail;
  return `…${tail.slice(-6)}`;
}

export function shortOrderId(shopifyOrderId: string): string {
  const tail = shopifyOrderId.includes("/")
    ? (shopifyOrderId.split("/").pop() ?? shopifyOrderId)
    : shopifyOrderId;
  if (tail.length <= 10) return tail;
  return `…${tail.slice(-8)}`;
}

function moneyOrDash(
  n: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return formatShopMoney(n, currency);
}

function orderSegment(input: {
  isGuest: boolean;
  lifetimeOrderRank: number | null;
}): string {
  if (input.isGuest) return "Guest";
  if (input.lifetimeOrderRank == null) return "Buyer";
  if (input.lifetimeOrderRank <= 1) return "New";
  return "Returning";
}

function buyerSegment(
  orderCount: number,
  periodSales: number,
  periodTotal: number,
): string {
  if (orderCount <= 1) return "One-and-done";
  if (periodTotal > 0 && periodSales / periodTotal >= 0.05) return "Whale";
  return "Repeat";
}

export function buildDayLedgerRows(
  rows: DayLedgerRowInput[],
  currency: string | null | undefined,
): DayLedgerRow[] {
  return rows.map((r) => {
    const aov =
      r.orderCount > 0 && Number.isFinite(r.sales)
        ? formatShopMoney(r.sales / r.orderCount, currency)
        : "—";
    const flag = r.missing
      ? "Missing"
      : r.open
        ? "Open"
        : !r.customerMetricsAvailable
          ? "Sales only"
          : "";
    return {
      dayKey: r.dayKey,
      sales: r.missing ? "—" : formatShopMoney(r.sales, currency),
      netSales: r.missing ? "—" : moneyOrDash(r.netSales, currency),
      grossSales: r.missing ? "—" : moneyOrDash(r.grossSales, currency),
      orders: r.missing ? "—" : String(r.orderCount),
      aov: r.missing ? "—" : aov,
      newBuyers: r.missing ? "—" : String(r.newCustomers),
      returningBuyers: r.missing ? "—" : String(r.returningCustomers),
      newSales: r.missing
        ? "—"
        : formatShopMoney(r.newCustomerSales, currency),
      returningSales: r.missing
        ? "—"
        : formatShopMoney(r.returningCustomerSales, currency),
      guestOrders: r.missing ? "—" : String(r.guestOrders),
      asOf: r.asOf
        ? new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date(r.asOf))
        : "—",
      source: r.source || "—",
      flag,
    };
  });
}

export function buildOrderLedgerRows(
  rows: OrderLedgerRowInput[],
  currency: string | null | undefined,
): OrderLedgerRow[] {
  return rows.map((r) => {
    const cur = r.currency ?? currency;
    const orderedAt = new Date(r.orderedAtIso);
    return {
      orderId: shortOrderId(r.shopifyOrderId),
      dayKey: r.dayKey,
      orderedAt: Number.isNaN(orderedAt.getTime())
        ? "—"
        : new Intl.DateTimeFormat(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }).format(orderedAt),
      total: formatShopMoney(r.amount, cur),
      discount: moneyOrDash(r.discountTotal, cur),
      shipping: moneyOrDash(r.shippingTotal, cur),
      tax: moneyOrDash(r.taxTotal, cur),
      units: r.unitCount == null ? "—" : String(r.unitCount),
      buyer: shortOpaqueId(r.customerKey),
      segment: orderSegment({
        isGuest: r.isGuest,
        lifetimeOrderRank: r.lifetimeOrderRank,
      }),
    };
  });
}

export function buildBuyerLedgerRows(
  rows: BuyerLedgerRowInput[],
  currency: string | null | undefined,
): BuyerLedgerRow[] {
  const periodTotal = rows.reduce((s, r) => s + r.periodSales, 0);
  return rows.map((r) => {
    const aov =
      r.orderCount > 0
        ? formatShopMoney(r.lifetimeSales / r.orderCount, currency)
        : "—";
    return {
      buyer: shortOpaqueId(r.customerKey),
      firstDay: r.firstDayKey,
      lastDay: r.lastDayKey,
      orders: String(r.orderCount),
      lifetimeSales: formatShopMoney(r.lifetimeSales, currency),
      periodSales: formatShopMoney(r.periodSales, currency),
      aov,
      daysToSecond:
        r.daysToSecond == null ? "—" : String(Math.round(r.daysToSecond)),
      segment: buyerSegment(r.orderCount, r.periodSales, periodTotal),
    };
  });
}

export function buildCohortLedgerRows(
  rows: CohortLedgerRowInput[],
  currency: string | null | undefined,
): CohortLedgerRow[] {
  return rows.map((r) => {
    const n = r.customers > 0 ? r.customers : 0;
    return {
      cohortMonth: r.cohortMonth,
      buyers: String(r.customers),
      revenueD30: formatShopMoney(r.revenueD30, currency),
      revenueD90: formatShopMoney(r.revenueD90, currency),
      revenueD365: formatShopMoney(r.revenueD365, currency),
      ltvD30: n > 0 ? formatShopMoney(r.revenueD30 / n, currency) : "—",
      ltvD90: n > 0 ? formatShopMoney(r.revenueD90 / n, currency) : "—",
      ltvD365: n > 0 ? formatShopMoney(r.revenueD365 / n, currency) : "—",
      ordersD30: String(r.ordersD30),
      ordersD90: String(r.ordersD90),
      ordersD365: String(r.ordersD365),
    };
  });
}

export function strongestSoftestDayKeys(
  rows: DayLedgerRowInput[],
): { strongest: string | null; softest: string | null } {
  const closed = rows.filter((r) => !r.missing && !r.open && r.orderCount > 0);
  if (!closed.length) return { strongest: null, softest: null };
  let strongest = closed[0]!;
  let softest = closed[0]!;
  for (const r of closed) {
    if (r.sales > strongest.sales) strongest = r;
    if (r.sales < softest.sales) softest = r;
  }
  return { strongest: strongest.dayKey, softest: softest.dayKey };
}
