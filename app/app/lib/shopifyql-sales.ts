/**
 * Pure ShopifyQL helpers for Analytics-matching day sales.
 *
 * Community pain (Shopify forums, Weld, Triple Whale docs): day charts drift when
 * apps sum orders by created_at + current totals. Shopify Analytics is event-based
 * (refunds land on the refund day) in the shop timezone. ShopifyQL `FROM sales`
 * is the same grain Admin charts use — that is the easy “match Shopify” answer.
 */

export type ShopifyQlSalesDayRow = {
  dayKey: string;
  totalSales: number;
  orderCount: number;
  netSales: number | null;
  grossSales: number | null;
};

/** Build a day TIMESERIES query for closed shop-local calendar days (inclusive). */
export function buildShopifyQlSalesDaysQuery(args: {
  sinceDayKey: string;
  untilDayKey: string;
}): string {
  const since = args.sinceDayKey.trim();
  const until = args.untilDayKey.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since) || !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    throw new Error("ShopifyQL day keys must be YYYY-MM-DD");
  }
  if (since > until) {
    throw new Error("ShopifyQL sinceDayKey must be <= untilDayKey");
  }
  // Absolute dates, no quotes — ShopifyQL SINCE/UNTIL syntax.
  return [
    "FROM sales",
    "SHOW total_sales, orders, net_sales, gross_sales",
    "TIMESERIES day",
    `SINCE ${since}`,
    `UNTIL ${until}`,
    "ORDER BY day ASC",
  ].join(" ");
}

export function parseShopifyQlMoney(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number.parseFloat(value.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function parseShopifyQlOrderCount(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }
  if (typeof value === "string") {
    const n = Number.parseFloat(value.replace(/,/g, "").trim());
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : null;
  }
  return null;
}

/** Normalize ShopifyQL day cell → YYYY-MM-DD. */
export function parseShopifyQlDayKey(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
  return m?.[1] ?? null;
}

/**
 * Parse shopifyqlQuery tableData rows into day → totals.
 * Tolerates missing optional money columns (net/gross).
 */
export function parseShopifyQlSalesDayRows(
  rows: ReadonlyArray<Record<string, unknown>> | null | undefined,
): Map<string, ShopifyQlSalesDayRow> {
  const map = new Map<string, ShopifyQlSalesDayRow>();
  if (!rows?.length) return map;

  for (const row of rows) {
    const dayKey = parseShopifyQlDayKey(row.day ?? row.Day);
    if (!dayKey) continue;
    const totalSales = parseShopifyQlMoney(row.total_sales ?? row.totalSales);
    const orderCount = parseShopifyQlOrderCount(row.orders ?? row.order_count);
    if (totalSales == null || orderCount == null) continue;
    map.set(dayKey, {
      dayKey,
      totalSales,
      orderCount,
      netSales: parseShopifyQlMoney(row.net_sales ?? row.netSales),
      grossSales: parseShopifyQlMoney(row.gross_sales ?? row.grossSales),
    });
  }
  return map;
}
