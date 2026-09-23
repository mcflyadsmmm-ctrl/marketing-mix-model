/**
 * Client-safe Goals year-board arithmetic. Prisma-free so the empty-vs-typed-0
 * contract, implied identified buyers, and returning-$ month buckets unit-test
 * away from the loader.
 *
 * Compete 21: implied identified buyers = sales goal ÷ typical order when both
 * exist and the 8-order floor seals. Empty spend stays off that sentence.
 * No pixel CAC.
 */

import { formatCurrency } from "./mer-format";

export const IMPLIED_IDENTIFIED_BUYERS_MIN_ORDERS = 8;

export const MONTH_CLOSE_SALES_FORMULA =
  "Month close = Shopify Total Sales so far + remaining days × typical selling day";

const GUEST_KEY = "guest";

/**
 * Empty / whitespace → not on file (null). Typed 0 is a real $0 plan.
 * Invalid → NaN so the action can reject it.
 */
export function parseGoalInput(
  raw: FormDataEntryValue | null,
): number | null {
  const cleaned = String(raw ?? "")
    .replace(/[$,\s]/g, "")
    .trim();
  if (cleaned === "") return null;
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n) || n < 0) return Number.NaN;
  return n;
}

/** Blank plan → empty field. Typed $0 stays "0", never a silent empty. */
export function formatGoalInput(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "";
  if (value === 0) return "0";
  return String(Math.round(value));
}

/**
 * Typed $0 is a real plan. Cleared / junk is not on file.
 */
export function typedGoalAmount(
  salesGoal: number | null | undefined,
): number | null {
  if (salesGoal == null || !Number.isFinite(salesGoal)) return null;
  return salesGoal;
}

/**
 * Saturday finance line for ThisMonthPlanStack. Empty goal copies nothing.
 * Missing last year is "not on file" — never a silent $0.
 */
export function thisMonthPlanCopyText(opts: {
  goal: number | null;
  actual: number | null;
  prior: number | null;
  currency: string;
}): string | null {
  const goal = typedGoalAmount(opts.goal);
  if (goal == null) return null;
  const goalText = formatCurrency(goal, opts.currency);
  const actualText =
    opts.actual == null || !Number.isFinite(opts.actual)
      ? "—"
      : formatCurrency(opts.actual, opts.currency);
  const priorBit =
    opts.prior == null || !Number.isFinite(opts.prior)
      ? " Last year is not on file."
      : ` Last year ${formatCurrency(opts.prior, opts.currency)}.`;
  return `We are ${actualText} versus ${goalText} plan.${priorBit}`;
}

/**
 * Identified buyers the typed sales goal implies at this typical order.
 * Withholds under the 8-order floor, when either side is missing, or when
 * the typical order is not a positive dollar. Never a pixel CAC.
 */
export function impliedIdentifiedBuyers(input: {
  salesGoal: number | null | undefined;
  typicalOrder: number | null | undefined;
  orderCount: number;
}): number | null {
  const orders = Number.isFinite(input.orderCount)
    ? Math.max(0, Math.trunc(input.orderCount))
    : 0;
  if (orders < IMPLIED_IDENTIFIED_BUYERS_MIN_ORDERS) return null;
  const goal = input.salesGoal;
  const typical = input.typicalOrder;
  if (goal == null || !Number.isFinite(goal) || !(goal > 0)) return null;
  if (typical == null || !Number.isFinite(typical) || !(typical > 0)) {
    return null;
  }
  return Math.round(goal / typical);
}

/** Prior-year actual × (1 + pct/100), whole dollars. Missing/zero prior stays blank. */
export function goalsAtYoyGrowth(
  priorYearMonthly: Array<number | null>,
  growthPct: number,
): Array<number | null> {
  const factor = 1 + growthPct / 100;
  return priorYearMonthly.map((prior) => {
    if (prior == null || !(prior > 0)) return null;
    return Math.round(prior * factor);
  });
}

export type ReturningOrderRow = {
  customerKey: string;
  amount: number;
  shopLocalDate: Date;
  lifetimeOrders: number | null;
};

/**
 * Identified returning Shopify Total Sales by calendar month from OrderFact.
 * Guests stay out. Unknown lifetime is not stuffed into returning. A month
 * with no identified known-lifetime orders stays absent — not $0.
 */
export function returningSalesByMonthFromOrders(
  year: number,
  rows: ReturningOrderRow[],
): Map<number, number | null> {
  const months = new Map<number, { returning: number; identifiedKnown: number }>();
  for (const row of rows) {
    if (!row || !Number.isFinite(row.amount)) continue;
    const key = row.customerKey?.trim() ?? "";
    if (!key || key === GUEST_KEY) continue;
    const day = row.shopLocalDate;
    if (!(day instanceof Date) || !Number.isFinite(day.getTime())) continue;
    const y = day.getUTCFullYear();
    const m = day.getUTCMonth() + 1;
    if (y !== year || m < 1 || m > 12) continue;
    const lifetime =
      row.lifetimeOrders != null && Number.isFinite(row.lifetimeOrders)
        ? Math.trunc(row.lifetimeOrders)
        : null;
    if (lifetime == null) continue;
    const rec = months.get(m) ?? { returning: 0, identifiedKnown: 0 };
    rec.identifiedKnown += 1;
    if (lifetime > 1) rec.returning += row.amount;
    months.set(m, rec);
  }
  const out = new Map<number, number | null>();
  for (const [month, rec] of months) {
    if (rec.identifiedKnown <= 0) continue;
    out.set(month, rec.returning);
  }
  return out;
}
