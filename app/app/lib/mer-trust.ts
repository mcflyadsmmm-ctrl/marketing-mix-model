/**
 * Cash MER trust helpers — freshness labels, spend coverage honesty, mock guards.
 * Pure / testable. No pixels, no attribution theater.
 */

import { formatFreshness } from "./mer-format";
import {
  nextShopLocalDayKey,
  shopLocalDayKey,
} from "./shop-local-day";

export type FreshnessSource = "snapshot" | "sync" | "live";

/** UTC calendar YYYY-MM-DD — matches SpendEntry utcMidnightFromDayKey stamps. */
function utcDayKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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

function yesterdayShopLocalKey(todayKey: string, timeZone: string): string {
  const [ty, tm, td] = todayKey.split("-").map(Number);
  return shopLocalDayKey(
    new Date(Date.UTC(ty, tm - 1, td - 1, 12, 0, 0)),
    timeZone,
  );
}

function countShopLocalClosedDays(
  rangeStart: Date,
  rangeEnd: Date,
  now: Date,
  timeZone: string,
): number {
  const todayKey = shopLocalDayKey(now, timeZone);
  let endKey = shopLocalDayKey(rangeEnd, timeZone);
  const startKey = shopLocalDayKey(rangeStart, timeZone);
  if (endKey >= todayKey) {
    endKey = yesterdayShopLocalKey(todayKey, timeZone);
  }
  if (endKey < startKey) return 0;
  let count = 0;
  let cursor = startKey;
  while (cursor <= endKey) {
    count += 1;
    cursor = nextShopLocalDayKey(cursor, timeZone);
    if (count > 5000) break;
  }
  return count;
}

/** Closed calendar days in range (excludes incomplete today when range.end is "now"). */
export function countClosedDaysInPeriod(
  rangeStart: Date,
  rangeEnd: Date,
  now = new Date(),
  timeZone?: string | null,
): number {
  if (timeZone) {
    return countShopLocalClosedDays(rangeStart, rangeEnd, now, timeZone);
  }
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
 * Pass shop IANA `timeZone` so coverage matches the sales spine (not server-local).
 */
export function collectFilledSpendDayKeys(
  entries: Array<{ periodStart: Date; periodEnd: Date; amount: number }>,
  rangeStart: Date,
  rangeEnd: Date,
  now = new Date(),
  timeZone?: string | null,
): Set<string> {
  if (timeZone) {
    const todayKey = shopLocalDayKey(now, timeZone);
    let windowEndKey = shopLocalDayKey(rangeEnd, timeZone);
    if (windowEndKey >= todayKey) {
      windowEndKey = yesterdayShopLocalKey(todayKey, timeZone);
    }
    const windowStartKey = shopLocalDayKey(rangeStart, timeZone);
    const filled = new Set<string>();
    if (windowEndKey < windowStartKey) return filled;

    for (const entry of entries) {
      if (!(entry.amount > 0)) continue;
      // Spend rows are UTC-midnight of the CSV calendar day (utcMidnightFromDayKey).
      // shopLocalDayKey(…, America/Denver) on 2026-07-01T00:00Z → 2026-06-30 — false holes.
      let cursorKey = utcDayKey(entry.periodStart);
      const entryEndKey = utcDayKey(entry.periodEnd);
      if (cursorKey < windowStartKey) cursorKey = windowStartKey;
      let endKey = entryEndKey > windowEndKey ? windowEndKey : entryEndKey;
      if (endKey < cursorKey) continue;
      let guard = 0;
      while (cursorKey <= endKey) {
        filled.add(cursorKey);
        cursorKey = nextShopLocalDayKey(cursorKey, timeZone);
        guard += 1;
        if (guard > 5000) break;
      }
    }
    return filled;
  }

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
    grossSales?: number;
    netSales?: number;
    newCustomers?: number;
    returningCustomers?: number;
    newCustomerNetSales?: number;
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
      grossSales: 0,
      netSales: 0,
      orderCount: 0,
      newCustomers: 0,
      returningCustomers: 0,
      newCustomerNetSales: 0,
      returningCustomerNetSales: 0,
      guestOrders: 0,
      customerMetricsAvailable: false,
      source: "mock",
    } as T,
  };
}

/** Context-rail freshness — clear last-refreshed, sales + spend when known. */
export function formatCashFreshnessChip(input: {
  useSampleDesk: boolean;
  salesPulledAt: string | null;
  lastAt: string | null;
  source: FreshnessSource;
  spendUpdatedAt?: string | null;
}): string {
  if (input.useSampleDesk) {
    return "Practice · example numbers, not your store";
  }

  const bits: string[] = [];
  if (input.salesPulledAt) {
    bits.push(`Sales ${formatFreshness(input.salesPulledAt)}`);
  }
  if (input.spendUpdatedAt) {
    bits.push(`Spend ${formatFreshness(input.spendUpdatedAt)}`);
  }
  if (bits.length > 0) {
    return `Last refreshed · ${bits.join(" · ")}`;
  }

  if (input.lastAt) {
    const verb =
      input.source === "snapshot"
        ? "Snapshot"
        : input.source === "sync"
          ? "Last sync"
          : "As of";
    return `Last refreshed · ${verb} ${formatFreshness(input.lastAt)}`;
  }

  return "Last refreshed · open Update spend to load CSV";
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

/** Default |csv − declared| / declared threshold (Sheets recon spirit). */
export const SPEND_RECON_THRESHOLD = 0.05;

export type SpendReconStatus = "none" | "ok" | "drift";

export interface SpendReconResult {
  status: SpendReconStatus;
  csvTotal: number;
  declared: number | null;
  /** (csv − declared) / declared when declared > 0. */
  deltaPct: number | null;
  /** Threshold as percent points (e.g. 5). */
  thresholdPct: number;
}

/**
 * Compare desk CSV/manual spend sum vs merchant-declared Ads Manager total.
 * Independent of contribution margin / break-even.
 */
export function computeSpendRecon(
  csvTotal: number,
  declared: number | null | undefined,
  threshold = SPEND_RECON_THRESHOLD,
): SpendReconResult {
  const safeCsv = Number.isFinite(csvTotal) ? csvTotal : 0;
  const thresholdPct = Math.round(threshold * 1000) / 10;
  if (
    declared == null ||
    !Number.isFinite(declared) ||
    declared <= 0
  ) {
    return {
      status: "none",
      csvTotal: safeCsv,
      declared: null,
      deltaPct: null,
      thresholdPct,
    };
  }
  const deltaPct = (safeCsv - declared) / declared;
  const drift = Math.abs(deltaPct) > threshold;
  return {
    status: drift ? "drift" : "ok",
    csvTotal: safeCsv,
    declared,
    deltaPct,
    thresholdPct,
  };
}

/**
 * True when a stored declaration covers the same calendar bounds as the desk period.
 * Pass shop IANA `timeZone` so recon matches the sales spine (not server-local).
 */
export function spendReconMatchesPeriod(
  declaredStart: Date | null | undefined,
  declaredEnd: Date | null | undefined,
  rangeStart: Date,
  rangeEnd: Date,
  timeZone?: string | null,
): boolean {
  if (!declaredStart || !declaredEnd) return false;
  const dayKey = (d: Date) =>
    timeZone ? shopLocalDayKey(d, timeZone) : localDayKey(d);
  return (
    dayKey(declaredStart) === dayKey(rangeStart) &&
    dayKey(declaredEnd) === dayKey(rangeEnd)
  );
}

export function formatSpendReconLine(recon: SpendReconResult): string {
  if (recon.status === "none" || recon.declared == null) {
    return "No Ads Manager total declared for this period";
  }
  const pct =
    recon.deltaPct != null
      ? `${recon.deltaPct >= 0 ? "+" : ""}${(recon.deltaPct * 100).toFixed(1)}%`
      : "—";
  return `Desk spend vs declared Ads Manager: ${pct} (threshold ±${recon.thresholdPct}%)`;
}
