/**
 * First product → downstream LTV on the Customers LTV chip.
 *
 * A row is buyers whose first titled line item was that product: how many
 * first orders, and the average revenue from those buyers. Revenue paints
 * only when at least one of them placed a later order. No repeat history is
 * a dash — never $0, never 0%.
 *
 * Shopify orders only. SAMPLE Snowdevil carries titles. Live OrderFacts do
 * not (existing `read_orders` scope, no line-item crawl), so live stays the
 * titles empty instead of a guessed catalog. No product-cost column, no ad spend.
 *
 * Merchant chrome: first product, first orders, revenue. Never "cohort",
 * "ARPU", "till", or "p25–p75".
 */

import { rollUpCustomers, type CustomerDepth, type DepthOrder } from "./ltv-depth";

/** First-product rows kept on the LTV chip — densest few, not a catalog dump. */
export const FIRST_PRODUCT_MAX_ROWS = 8;

/** Painted when a product has first orders and nobody came back. Not $0. */
export const FIRST_PRODUCT_LTV_DASH = "—";

/** Under a dashed cell. The dash is the value; this line says why. */
export const FIRST_PRODUCT_NO_REPEAT_COPY =
  "No repeat history yet — not $0.";

export const FIRST_PRODUCT_TITLES_COPY =
  "Product names are not on this shop’s stored orders. First-product value waits for titled line items already in scope. Not $0.";

export const FIRST_PRODUCT_SYNC_COPY =
  "Orders still syncing — not $0. First-product value fills once titled line items land and a buyer orders again.";

export type FirstProductEmptyKind = "syncing" | "titles";

export interface FirstProductDriverRow {
  product: string;
  /** Buyers whose first order’s titled line item was this product. */
  firstOrderCount: number;
  /**
   * Average order revenue from those buyers. Null when none of them placed
   * a later order — never 0, so the chip cannot paint $0 or 0%.
   */
  avgLtv: number | null;
  /** Buyers in the row who placed at least one later order. */
  repeatBuyers: number;
}

export interface FirstProductEmpty {
  kind: FirstProductEmptyKind;
  copy: string;
  verb: string;
}

export interface FirstProductDriversView {
  /** Titled first-line items are on file (SAMPLE) vs hidden (live Level 1). */
  productsKnown: boolean;
  buyers: number;
  namedBuyers: number;
  rows: FirstProductDriverRow[];
  empty: FirstProductEmpty | null;
}

function titled(product: string | null | undefined): product is string {
  return typeof product === "string" && product.trim() !== "";
}

function meanPositive(values: number[]): number | null {
  if (values.length === 0) return null;
  const avg = values.reduce((sum, n) => sum + n, 0) / values.length;
  if (!Number.isFinite(avg) || avg <= 0) return null;
  return avg;
}

/**
 * Currency paint for one cell. Null, non-finite, and non-positive amounts
 * stay a dash so a missing repeat history cannot render as $0 or 0%.
 */
export function firstProductLtvDisplay(
  amount: number | null,
  format: (amount: number) => string,
): string {
  if (amount == null || !Number.isFinite(amount) || amount <= 0) {
    return FIRST_PRODUCT_LTV_DASH;
  }
  const painted = format(amount).trim();
  if (
    painted === "" ||
    painted === "$0" ||
    painted === "$0.00" ||
    painted === "0%"
  ) {
    return FIRST_PRODUCT_LTV_DASH;
  }
  return painted;
}

function emptyState(input: {
  buyers: number;
  productsKnown: boolean;
  namedBuyers: number;
  hasRows: boolean;
}): FirstProductEmpty | null {
  if (input.hasRows) return null;
  if (input.buyers <= 0) {
    return {
      kind: "syncing",
      copy: FIRST_PRODUCT_SYNC_COPY,
      verb: "Refresh this page",
    };
  }
  if (!input.productsKnown || input.namedBuyers <= 0) {
    return {
      kind: "titles",
      copy: FIRST_PRODUCT_TITLES_COPY,
      verb: "Wait for titled line items",
    };
  }
  return null;
}

function summarize(
  product: string,
  members: CustomerDepth[],
): FirstProductDriverRow | null {
  if (members.length === 0) return null;
  const repeaters = members.filter((c) => c.orderCount > 1);
  const avgLtv =
    repeaters.length > 0
      ? meanPositive(members.map((c) => c.lifetimeSpend))
      : null;
  return {
    product,
    firstOrderCount: members.length,
    avgLtv,
    repeatBuyers: repeaters.length,
  };
}

function sortRows(rows: FirstProductDriverRow[]): FirstProductDriverRow[] {
  return [...rows].sort((a, b) => {
    if (a.avgLtv != null && b.avgLtv != null && a.avgLtv !== b.avgLtv) {
      return b.avgLtv - a.avgLtv;
    }
    if (a.avgLtv != null && b.avgLtv == null) return -1;
    if (a.avgLtv == null && b.avgLtv != null) return 1;
    if (a.firstOrderCount !== b.firstOrderCount) {
      return b.firstOrderCount - a.firstOrderCount;
    }
    return a.product.localeCompare(b.product);
  });
}

/**
 * First-product → downstream LTV from Shopify order rows. Untitled first
 * orders never form a row. A product whose buyers never ordered again keeps
 * a row with a null average — the chip prints a dash, not $0.
 */
export function buildFirstProductDrivers(
  orders: DepthOrder[],
  options?: { maxRows?: number },
): FirstProductDriversView {
  const maxRows = options?.maxRows ?? FIRST_PRODUCT_MAX_ROWS;
  const customers = rollUpCustomers(orders);
  const productsKnown = orders.some((o) => titled(o.product));
  const named = customers.filter((c) => titled(c.firstProduct));

  const groups = new Map<string, CustomerDepth[]>();
  for (const customer of named) {
    const key = customer.firstProduct!.trim();
    const list = groups.get(key) ?? [];
    list.push(customer);
    groups.set(key, list);
  }

  const rows: FirstProductDriverRow[] = [];
  for (const [product, members] of groups) {
    const row = summarize(product, members);
    if (row) rows.push(row);
  }
  const ranked = sortRows(rows).slice(0, maxRows);

  return {
    productsKnown,
    buyers: customers.length,
    namedBuyers: named.length,
    rows: ranked,
    empty: emptyState({
      buyers: customers.length,
      productsKnown,
      namedBuyers: named.length,
      hasRows: ranked.length > 0,
    }),
  };
}
