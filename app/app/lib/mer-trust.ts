/**
 * Cash MER trust helpers — freshness labels, spend coverage honesty, mock guards.
 * Pure / testable. No pixels, no attribution theater.
 */

import { formatFreshness } from "./mer-format";

export type FreshnessSource = "snapshot" | "sync" | "live";

export interface SpendPeriodCoverage {
  daysWithSpend: number;
  daysInPeriod: number;
  coveragePct: number;
  /** True when some spend exists but many period days are empty (recon-style honesty). */
  incomplete: boolean;
}

export interface HonestSalesResult<T extends { source: "shopify" | "mock" }> {
  sales: T;
  /** Sample desk OFF but caller passed mock sales — numbers zeroed; UI must not say live Shopify. */
  blockedMockAsLive: boolean;
}

const INCOMPLETE_BELOW_PCT = 70;
const MIN_DAYS_FOR_INCOMPLETE_FLAG = 5;

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addLocalDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return startOfLocalDay(next);
}

function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Closed calendar days in range (excludes incomplete today when range.end is "now"). */
export function countClosedDaysInPeriod(
  rangeStart: Date,
  rangeEnd: Date,
  now = new Date(),
): number {
  const todayStart = startOfLocalDay(now);
  let end = startOfLocalDay(rangeEnd);
  // Cap at yesterday when range includes today — same closed-day religion as the spine.
  if (end >= todayStart) {
    end = addLocalDays(todayStart, -1);
  }
  const start = startOfLocalDay(rangeStart);
  if (end < start) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

/**
 * Mark calendar days that have any positive spend overlapping the closed period window.
 */
export function collectFilledSpendDayKeys(
  entries: Array<{ periodStart: Date; periodEnd: Date; amount: number }>,
  rangeStart: Date,
  rangeEnd: Date,
  now = new Date(),
): Set<string> {
  const todayStart = startOfLocalDay(now);
  let windowEnd = startOfLocalDay(rangeEnd);
  if (windowEnd >= todayStart) {
    windowEnd = addLocalDays(todayStart, -1);
  }
  const windowStart = startOfLocalDay(rangeStart);
  const filled = new Set<string>();
  if (windowEnd < windowStart) return filled;

  for (const entry of entries) {
    if (!(entry.amount > 0)) continue;
    let cursor = startOfLocalDay(
      entry.periodStart < windowStart ? windowStart : entry.periodStart,
    );
    const end = startOfLocalDay(
      entry.periodEnd > windowEnd ? windowEnd : entry.periodEnd,
    );
    for (; cursor <= end; cursor = addLocalDays(cursor, 1)) {
      filled.add(localDayKey(cursor));
    }
  }
  return filled;
}

export function computeSpendPeriodCoverage(input: {
  daysWithSpend: number;
  daysInPeriod: number;
  incompleteBelowPct?: number;
  minDaysForFlag?: number;
}): SpendPeriodCoverage {
  const daysInPeriod = Math.max(0, input.daysInPeriod);
  const daysWithSpend = Math.max(
    0,
    Math.min(input.daysWithSpend, daysInPeriod || input.daysWithSpend),
  );
  const coveragePct =
    daysInPeriod > 0
      ? Math.min(100, Math.round((daysWithSpend / daysInPeriod) * 100))
      : 0;
  const below = input.incompleteBelowPct ?? INCOMPLETE_BELOW_PCT;
  const minDays = input.minDaysForFlag ?? MIN_DAYS_FOR_INCOMPLETE_FLAG;
  const incomplete =
    daysWithSpend > 0 &&
    daysInPeriod >= minDays &&
    coveragePct < below;

  return { daysWithSpend, daysInPeriod, coveragePct, incomplete };
}

/**
 * Guard: never present mock sales as live Shopify when sample desk is OFF.
 * Zeros till totals so Cash MER cannot be inflated by fabricated revenue.
 */
export function resolveHonestSales<
  T extends {
    source: "shopify" | "mock";
    totalSales: number;
    orderCount: number;
    newCustomers?: number;
    returningCustomers?: number;
    guestOrders?: number;
    customerMetricsAvailable?: boolean;
  },
>(sales: T, useSampleDesk: boolean): HonestSalesResult<T> {
  if (useSampleDesk || sales.source !== "mock") {
    return { sales, blockedMockAsLive: false };
  }
  return {
    blockedMockAsLive: true,
    sales: {
      ...sales,
      totalSales: 0,
      orderCount: 0,
      newCustomers: 0,
      returningCustomers: 0,
      guestOrders: 0,
      customerMetricsAvailable: false,
      source: "mock",
    } as T,
  };
}

/** Context-rail freshness chip — honest, not real-time theater. */
export function formatCashFreshnessChip(input: {
  useSampleDesk: boolean;
  salesPulledAt: string | null;
  lastAt: string | null;
  source: FreshnessSource;
  spendUpdatedAt?: string | null;
}): string {
  if (input.useSampleDesk) {
    return "Sample desk";
  }

  const salesBit = input.salesPulledAt
    ? `Sales as of ${formatFreshness(input.salesPulledAt)}`
    : null;

  if (salesBit) return salesBit;

  if (input.lastAt) {
    const verb =
      input.source === "snapshot"
        ? "Snapshot"
        : input.source === "sync"
          ? "Last sync"
          : "As of";
    return `${verb} ${formatFreshness(input.lastAt)}`;
  }

  return "Desk refresh";
}

/** Short spend-side honesty line for chips / coverage banner. */
export function formatSpendCoverageLine(
  coverage: SpendPeriodCoverage,
  periodLabel: string,
): string {
  if (coverage.daysInPeriod <= 0) {
    return `No closed days in ${periodLabel} yet`;
  }
  if (coverage.daysWithSpend === 0) {
    return `No spend days in ${periodLabel}`;
  }
  return `${coverage.daysWithSpend} of ${coverage.daysInPeriod} closed days have spend · ${periodLabel}`;
}
