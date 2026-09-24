/**
 * Daily sales totals from ShopifyQL. One row per day. No order pages.
 *
 * The query helper can span calendar years. Desk ingest caps the pull at
 * 24 months (`salesIngestDayCount`). Order rows stay at 24 months.
 *
 * New/Returning sales $ use a second lightweight ShopifyQL query
 * (`GROUP BY new_or_returning_customer`). That split is Shopify’s
 * order-based New/Returning label — not unique buyer headcount.
 */

export const SALES_TOTALS_YEARS_BACK = 10;

export type SalesDayTotal = {
  dayKey: string;
  totalSales: number;
  netSales: number;
  grossSales: number;
  orderCount: number;
  /** Total Sales $ on New (first-purchase) orders — ShopifyQL order split. */
  newCustomerNetSales: number;
  /** Total Sales $ on Returning orders — ShopifyQL order split. */
  returningCustomerNetSales: number;
  /** True when ShopifyQL returned the New/Returning dimension for this day. */
  customerMetricsAvailable: boolean;
};

export type SalesDayCustomerSplit = {
  dayKey: string;
  newCustomerNetSales: number;
  returningCustomerNetSales: number;
};

export function salesTotalsWindowStartUtc(now: Date = new Date()): Date {
  const year = now.getUTCFullYear() - SALES_TOTALS_YEARS_BACK;
  return new Date(Date.UTC(year, 0, 1));
}

export function salesTotalsWindowDayCount(now: Date = new Date()): number {
  const ms = now.getTime() - salesTotalsWindowStartUtc(now).getTime();
  return Math.max(1, Math.ceil(ms / 86_400_000));
}

/** Inclusive calendar-year slices so one response stays under ShopifyQL's row cap. */
export function salesTotalsYearChunks(
  since: string,
  until: string,
): { since: string; until: string }[] {
  const startYear = Number(since.slice(0, 4));
  const endYear = Number(until.slice(0, 4));
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear) || endYear < startYear) {
    return [{ since, until }];
  }
  const chunks: { since: string; until: string }[] = [];
  for (let year = startYear; year <= endYear; year += 1) {
    chunks.push({
      since: year === startYear ? since : `${year}-01-01`,
      until: year === endYear ? until : `${year}-12-31`,
    });
  }
  return chunks;
}

export function salesDayTotalsQuery(since: string, until: string): string {
  return `FROM sales SHOW total_sales, net_sales, gross_sales, orders TIMESERIES day SINCE ${since} UNTIL ${until} ORDER BY day ASC`;
}

/**
 * Second lightweight query — New/Returning Total Sales $ by day.
 * Order-based Shopify split (values New / Returning), not unique headcount.
 */
export function salesDayCustomerSplitQuery(since: string, until: string): string {
  return `FROM sales SHOW total_sales TIMESERIES day GROUP BY new_or_returning_customer SINCE ${since} UNTIL ${until} ORDER BY day ASC`;
}

function money(value: string | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function whole(value: string | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}

function emptyCustomerSplit(): Pick<
  SalesDayTotal,
  "newCustomerNetSales" | "returningCustomerNetSales" | "customerMetricsAvailable"
> {
  return {
    newCustomerNetSales: 0,
    returningCustomerNetSales: 0,
    customerMetricsAvailable: false,
  };
}

export function parseSalesDayTotals(
  rows: Array<Record<string, string | null>> | null | undefined,
): SalesDayTotal[] {
  const out: SalesDayTotal[] = [];
  for (const row of rows ?? []) {
    const raw = row.day;
    if (!raw) continue;
    const dayKey = raw.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) continue;
    out.push({
      dayKey,
      totalSales: money(row.total_sales),
      netSales: money(row.net_sales),
      grossSales: money(row.gross_sales),
      orderCount: whole(row.orders),
      ...emptyCustomerSplit(),
    });
  }
  return out;
}

/**
 * Parse New/Returning Total Sales by day. Dimension values are Shopify’s
 * "New" / "Returning" (order-based), not unique buyer counts.
 */
export function parseSalesDayCustomerSplit(
  rows: Array<Record<string, string | null>> | null | undefined,
): Map<string, SalesDayCustomerSplit> {
  const out = new Map<string, SalesDayCustomerSplit>();
  for (const row of rows ?? []) {
    const raw = row.day;
    if (!raw) continue;
    const dayKey = raw.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) continue;
    const label = (row.new_or_returning_customer ?? "").trim().toLowerCase();
    const amount = money(row.total_sales);
    const prev = out.get(dayKey) ?? {
      dayKey,
      newCustomerNetSales: 0,
      returningCustomerNetSales: 0,
    };
    if (label === "new") {
      prev.newCustomerNetSales += amount;
    } else if (label === "returning") {
      prev.returningCustomerNetSales += amount;
    } else {
      continue;
    }
    out.set(dayKey, prev);
  }
  return out;
}

/** Merge New/Returning split into day totals. Marks customerMetricsAvailable when present. */
export function mergeCustomerSplitIntoDayTotals(
  totals: Map<string, SalesDayTotal>,
  splits: Map<string, SalesDayCustomerSplit>,
): void {
  for (const [dayKey, split] of splits) {
    const row = totals.get(dayKey);
    if (row) {
      row.newCustomerNetSales = split.newCustomerNetSales;
      row.returningCustomerNetSales = split.returningCustomerNetSales;
      row.customerMetricsAvailable = true;
      continue;
    }
    totals.set(dayKey, {
      dayKey,
      totalSales: 0,
      netSales: 0,
      grossSales: 0,
      orderCount: 0,
      newCustomerNetSales: split.newCustomerNetSales,
      returningCustomerNetSales: split.returningCustomerNetSales,
      customerMetricsAvailable: true,
    });
  }
}

export function isReportsScopeMessage(message: string): boolean {
  return /read_reports|access denied|not approved to access/i.test(message);
}
