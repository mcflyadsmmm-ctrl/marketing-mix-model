import { shopLocalDayKey } from "./shop-local-day";

export {
  shopLocalDayKey,
  shopLocalDayRange,
  listRecentClosedShopLocalDays,
} from "./shop-local-day";

export interface SalesResult {
  /**
   * Shopify Total Sales (`currentTotalPriceSet` sum) — default Total ROAS numerator
   * (net + shipping + taxes + duties + fees, after returns).
   */
  totalSales: number;
  /** Gross order totals (`totalPriceSet`) — Ads Manager–comparable secondary. */
  grossSales: number;
  /**
   * False when closed-day gross is incomplete/unknown (legacy facts) — UI must
   * not claim Ads Manager–comparable gross. Default true for live GraphQL.
   */
  grossSalesKnown?: boolean;
  /**
   * Shopify Net Sales (`currentSubtotalPriceSet`) — product subtotal after
   * returns, excl. shipping/tax. Used when desk salesBasis = "net".
   */
  netSales: number;
  /** False when Net Sales unknown (legacy facts without subtotal). */
  netSalesKnown?: boolean;
  /** Basis last used to paint action MER on this result (default total). */
  salesBasisUsed: "total" | "net";
  orderCount: number;
  /** Unique customers whose first-ever order falls in this period (cash desk definition). */
  newCustomers: number;
  /** Unique customers who ordered in this period and had prior orders. */
  returningCustomers: number;
  /**
   * Net sales from new-customer orders (Level-1 opaque lifetimeOrders heuristic).
   * Guest order net stays in totalSales/netSales but is excluded here.
   */
  newCustomerNetSales: number;
  /** Net sales from returning-customer orders (same heuristic). */
  returningCustomerNetSales: number;
  /** Orders with no customer (guest checkout) — excluded from new/returning. */
  guestOrders: number;
  /** True when customer fields were readable (needs read_customers). */
  customerMetricsAvailable: boolean;
  source: "shopify" | "mock";
  /**
   * True when a capped live top-up stopped while more data remained.
   * Desk today top-up may undercount — surface via CashTrustBanners; never silent.
   */
  truncatedByPageCap?: boolean;
}

type MoneySet = { shopMoney?: { amount?: string } };

function parseMoneyAmount(set: MoneySet | undefined): number {
  const amount = parseFloat(set?.shopMoney?.amount ?? "0");
  return Number.isFinite(amount) ? amount : 0;
}

/**
 * Shopify Total Sales for one order (`currentTotalPriceSet`).
 * Fully refunded orders have currentTotal = 0 — that must win (do not treat 0 as
 * "missing"). Fall back to gross only when currentTotal amount is absent.
 */
export function orderTotalSalesAmount(node: {
  totalPriceSet?: MoneySet;
  currentTotalPriceSet?: MoneySet;
} | null | undefined): number {
  const gross = parseMoneyAmount(node?.totalPriceSet);
  const raw = node?.currentTotalPriceSet?.shopMoney?.amount;
  if (raw == null || raw === "") {
    return gross;
  }
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : gross;
}

/**
 * Shopify Net Sales for one order (`currentSubtotalPriceSet`) — product subtotal
 * after returns, excl. shipping/tax. Falls back to Total Sales when subtotal absent.
 */
export function orderNetSalesAmount(node: {
  totalPriceSet?: MoneySet;
  currentTotalPriceSet?: MoneySet;
  currentSubtotalPriceSet?: MoneySet;
} | null | undefined): number {
  const raw = node?.currentSubtotalPriceSet?.shopMoney?.amount;
  if (raw == null || raw === "") {
    return orderTotalSalesAmount(node);
  }
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : orderTotalSalesAmount(node);
}

/** @deprecated Prefer orderTotalSalesAmount — kept for OrderFact refund tests. */
export function orderNetAmount(node: {
  totalPriceSet?: MoneySet;
  currentTotalPriceSet?: MoneySet;
} | null | undefined): number {
  return orderTotalSalesAmount(node);
}

/**
 * Order revenue before refunds (`totalPriceSet`). Null when Shopify did not
 * send a gross — never coerced to 0, and never copied from the current total.
 */
export function orderGrossAmount(node: {
  totalPriceSet?: MoneySet;
} | null | undefined): number | null {
  const raw = node?.totalPriceSet?.shopMoney?.amount;
  if (raw == null || raw === "") return null;
  const n = parseFloat(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** Bucket an order `createdAt` ISO into a shop-local YYYY-MM-DD day key. */
export function shopLocalDayKeyFromIso(iso: string, timeZone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return shopLocalDayKey(date, timeZone);
}

function emptySales(source: SalesResult["source"] = "shopify"): SalesResult {
  return {
    totalSales: 0,
    grossSales: 0,
    grossSalesKnown: true,
    netSales: 0,
    netSalesKnown: true,
    salesBasisUsed: "total",
    orderCount: 0,
    newCustomers: 0,
    returningCustomers: 0,
    newCustomerNetSales: 0,
    returningCustomerNetSales: 0,
    guestOrders: 0,
    customerMetricsAvailable: false,
    source,
  };
}

export { emptySales };
