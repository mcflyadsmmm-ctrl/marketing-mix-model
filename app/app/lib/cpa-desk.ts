/**
 * CPA desk math — cash cost of a Shopify buyer from typed spend.
 * Empty spend is —, never $0 CPA / $0 CAC / 0.00×. No pixels, MTA, or platform CPA.
 */

import { calculateAmer } from "@mcfly/mer-core";
import {
  overviewChartDayLabel,
  overviewIsoWeekStartKey,
  overviewIsWeekendKey,
  overviewMedian,
} from "./overview-sales-chart";
import { overviewWindowRange } from "./overview-yoy";
import type { DateRange } from "./periods";
import { resolvePeriod } from "./periods";
import { cashCostPerCustomer } from "./shopify-native-stats";
import {
  dateKeyFromYmd,
  shopLocalDayKey,
  shopLocalDayRange,
  shopLocalYmd,
} from "./shop-local-day";
import type { SpendPasteLiveIndex } from "./spend-paste-preview";

export const CPA_WINDOW_IDS = ["this_month", "last_28"] as const;
export type CpaWindowId = (typeof CPA_WINDOW_IDS)[number];

export const CPA_EXPLORER_RANGES = [
  "this_month",
  "last_28",
  "90d",
  "ytd",
] as const;
export type CpaExplorerRange = (typeof CPA_EXPLORER_RANGES)[number];

export const CPA_GRAINS = ["day", "week", "month"] as const;
export type CpaGrain = (typeof CPA_GRAINS)[number];

export const CPA_WINDOW_LABEL: Record<CpaWindowId, string> = {
  this_month: "This month",
  last_28: "Last 28 days",
};

export const CPA_EXPLORER_LABEL: Record<CpaExplorerRange, string> = {
  this_month: "This month",
  last_28: "Last 28",
  "90d": "90d",
  ytd: "YTD",
};

export const CPA_EXPLORER_LONG: Record<CpaExplorerRange, string> = {
  this_month: "This month",
  last_28: "Last 28 days",
  "90d": "Last 90 days",
  ytd: "Year to date",
};

export const CPA_GRAIN_LABEL: Record<CpaGrain, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
};

export const CPA_CONTRAST =
  "Shopify Analytics shows ads-manager / platform CPA if any. This page shows entered spend ÷ Shopify buyers.";

export const CPA_EMPTY_SPEND =
  "Add spend in Spend Upload to calculate customer costs. Cash CPA and Cash CAC stay — until spend is on file — never a fake $0.";

export const CPA_NO_BUYERS =
  "Shopify has not identified buyers for this window yet, so customer costs are unavailable — not $0.";

export type CpaDayPoint = {
  dateKey: string;
  spend: number;
  newCustomers: number;
  returningCustomers: number;
  newCustomerSales: number;
  buyersKnown: boolean;
  /** Interned identified buyer ids for unique week/month grain. */
  identifiedIds?: number[];
  /** Interned new-buyer ids for unique week/month grain. */
  newIds?: number[];
};

export type CpaWindowSnapshot = {
  id: CpaWindowId;
  label: string;
  fromKey: string;
  toKey: string;
  rangeLabel: string | null;
  spend: number;
  identifiedBuyers: number;
  newCustomers: number;
  returningCustomers: number;
  newCustomerSales: number;
  buyersKnown: boolean;
  cashCpa: number | null;
  cashCac: number | null;
  amer: number | null;
};

export type CpaPaybackView = {
  cashCac: number | null;
  first90: number | null;
  first30: number | null;
  valueVsCost: number | null;
  paybackDays: number | null;
  /** CAC ÷ first-90. Null when either side is missing. May be > 1. */
  cacShareOfFirst90: number | null;
};

export type CpaExplorerBucket = {
  key: string;
  label: string;
  spend: number;
  buyers: number | null;
  newCustomers: number;
  returningCustomers: number;
  cashCpa: number | null;
  weekend: boolean;
};

export type CpaDeskWindows = {
  thisMonth: DateRange;
  last28: DateRange;
  last90: DateRange;
  ytd: DateRange;
  explorer: DateRange;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Rolling last-N calendar days through today (inclusive). */
export function resolveLastNDays(
  n: number,
  now = new Date(),
  timeZone?: string | null,
): DateRange {
  const days = Math.max(1, Math.floor(n));
  const label = days === 28 ? "Last 28 days" : `Last ${days} days`;
  if (timeZone) {
    const { y, m, d } = shopLocalYmd(now, timeZone);
    const startAnchor = new Date(Date.UTC(y, m - 1, d - (days - 1), 12, 0, 0));
    const startKey = shopLocalDayKey(startAnchor, timeZone);
    const todayKey = dateKeyFromYmd(y, m, d);
    return {
      start: shopLocalDayRange(startKey, timeZone).start,
      end: shopLocalDayRange(todayKey, timeZone).end,
      label,
    };
  }
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - (days - 1),
  );
  start.setHours(0, 0, 0, 0);
  return { start, end, label };
}

export function rangeDayKeys(
  range: DateRange,
  timeZone?: string | null,
): { fromKey: string; toKey: string } {
  if (timeZone) {
    return {
      fromKey: shopLocalDayKey(range.start, timeZone),
      toKey: shopLocalDayKey(range.end, timeZone),
    };
  }
  return {
    fromKey: localDayKey(range.start),
    toKey: localDayKey(range.end),
  };
}

/** This month + Last 28 on the cards; explorer lookback is YTD ∪ last 90. */
export function resolveCpaDeskWindows(
  now = new Date(),
  timeZone?: string | null,
): CpaDeskWindows {
  const thisMonth = resolvePeriod("mtd", now, timeZone);
  const ytd = resolvePeriod("ytd", now, timeZone);
  const last28 = resolveLastNDays(28, now, timeZone);
  const last90 = resolveLastNDays(90, now, timeZone);
  const explorerStart =
    ytd.start.getTime() < last90.start.getTime() ? ytd.start : last90.start;
  return {
    thisMonth,
    last28,
    last90,
    ytd,
    explorer: {
      start: explorerStart,
      end: thisMonth.end,
      label: "CPA explorer",
    },
  };
}

export function cpaExplorerRangeOf(
  id: CpaExplorerRange,
  windows: CpaDeskWindows,
): DateRange {
  switch (id) {
    case "this_month":
      return windows.thisMonth;
    case "last_28":
      return windows.last28;
    case "90d":
      return windows.last90;
    case "ytd":
      return windows.ytd;
    default: {
      const _never: never = id;
      return _never;
    }
  }
}

/** aMER paints only when spend exists and new sales are positive — never 0.00×. */
export function paintAmer(amer: number | null): number | null {
  if (amer == null || !Number.isFinite(amer) || amer <= 0) return null;
  return amer;
}

export function sumCpaDays(days: CpaDayPoint[]): {
  spend: number;
  identifiedBuyers: number;
  newCustomers: number;
  returningCustomers: number;
  newCustomerSales: number;
  buyersKnown: boolean;
} {
  let spend = 0;
  let identifiedBuyers = 0;
  let newCustomers = 0;
  let returningCustomers = 0;
  let newCustomerSales = 0;
  let buyersKnown = false;
  for (const day of days) {
    spend += day.spend > 0 ? day.spend : 0;
    if (day.buyersKnown) {
      buyersKnown = true;
      newCustomers += Math.max(0, Math.trunc(day.newCustomers));
      returningCustomers += Math.max(0, Math.trunc(day.returningCustomers));
      identifiedBuyers +=
        Math.max(0, Math.trunc(day.newCustomers)) +
        Math.max(0, Math.trunc(day.returningCustomers));
    }
    if (day.newCustomerSales > 0) newCustomerSales += day.newCustomerSales;
  }
  return {
    spend,
    identifiedBuyers,
    newCustomers,
    returningCustomers,
    newCustomerSales,
    buyersKnown,
  };
}

export function buildCpaWindowSnapshot(
  id: CpaWindowId,
  range: DateRange,
  days: CpaDayPoint[],
  timeZone?: string | null,
): CpaWindowSnapshot {
  const keys = rangeDayKeys(range, timeZone);
  const inWindow = filterCpaDays(days, keys.fromKey, keys.toKey);
  const totals = sumCpaDays(inWindow);
  const cashCpa = totals.buyersKnown
    ? cashCostPerCustomer(totals.spend, totals.identifiedBuyers)
    : null;
  const cashCac = cashCostPerCustomer(totals.spend, totals.newCustomers);
  return {
    id,
    label: CPA_WINDOW_LABEL[id],
    fromKey: keys.fromKey,
    toKey: keys.toKey,
    rangeLabel: overviewWindowRange(keys.fromKey, keys.toKey),
    spend: totals.spend,
    identifiedBuyers: totals.identifiedBuyers,
    newCustomers: totals.newCustomers,
    returningCustomers: totals.returningCustomers,
    newCustomerSales: totals.newCustomerSales,
    buyersKnown: totals.buyersKnown,
    cashCpa,
    cashCac,
    amer: paintAmer(calculateAmer(totals.newCustomerSales, totals.spend)),
  };
}

/**
 * Live OrderFact uniques replace day-sum buyer counts when the book is on file.
 * Null unique counts leave SAMPLE day-sums (or unknown live) untouched.
 */
export function applyUniqueBuyerCounts(
  snapshot: CpaWindowSnapshot,
  unique: { identified: number | null; newBuyers: number | null },
): CpaWindowSnapshot {
  const identified =
    unique.identified != null && Number.isFinite(unique.identified)
      ? Math.max(0, Math.trunc(unique.identified))
      : null;
  const newBuyers =
    unique.newBuyers != null && Number.isFinite(unique.newBuyers)
      ? Math.max(0, Math.trunc(unique.newBuyers))
      : null;
  if (identified == null && newBuyers == null) return snapshot;

  const nextIdentified = identified ?? snapshot.identifiedBuyers;
  const nextNew = newBuyers ?? snapshot.newCustomers;
  const buyersKnown = identified != null || snapshot.buyersKnown;
  const cashCpa = buyersKnown
    ? cashCostPerCustomer(snapshot.spend, nextIdentified)
    : null;
  const cashCac = cashCostPerCustomer(snapshot.spend, nextNew);
  return {
    ...snapshot,
    identifiedBuyers: nextIdentified,
    newCustomers: nextNew,
    returningCustomers: Math.max(0, nextIdentified - nextNew),
    buyersKnown,
    cashCpa,
    cashCac,
  };
}

function uniqueIdCount(ids: number[] | undefined): number {
  if (!ids || ids.length === 0) return 0;
  return new Set(ids).size;
}

/**
 * Overlay interned OrderFact ids onto CPA days. Missing keys stay unknown
 * (—), never SalesDayFact `newCustomers: 0`. Known-zero days are `[]`.
 */
export function applyLiveBuyerIndexToCpaDays(
  days: CpaDayPoint[],
  index: SpendPasteLiveIndex | null | undefined,
): CpaDayPoint[] {
  if (!index) return days;
  return days.map((day) => {
    const hasIdentified = Object.prototype.hasOwnProperty.call(
      index.identifiedByDay,
      day.dateKey,
    );
    const hasNew = Object.prototype.hasOwnProperty.call(
      index.newByDay,
      day.dateKey,
    );
    if (!hasIdentified && !hasNew) {
      return {
        ...day,
        newCustomers: 0,
        returningCustomers: 0,
        buyersKnown: false,
        identifiedIds: undefined,
        newIds: undefined,
      };
    }
    const identifiedIds = hasIdentified
      ? [...(index.identifiedByDay[day.dateKey] ?? [])]
      : [];
    const newIds = hasNew ? [...(index.newByDay[day.dateKey] ?? [])] : [];
    const identified = uniqueIdCount(identifiedIds);
    const neu = uniqueIdCount(newIds);
    return {
      ...day,
      newCustomers: neu,
      returningCustomers: Math.max(0, identified - neu),
      buyersKnown: true,
      identifiedIds,
      newIds,
    };
  });
}

export function buildCpaPaybackView(input: {
  cashCac: number | null;
  avgRevenueD30: number | null;
  avgRevenueD90: number | null;
  /** Interpolated by till LTV — null when CAC is missing or not recovered. */
  paybackDays: number | null;
}): CpaPaybackView {
  const cashCac =
    input.cashCac != null && Number.isFinite(input.cashCac) && input.cashCac > 0
      ? input.cashCac
      : null;
  const first90 =
    input.avgRevenueD90 != null &&
    Number.isFinite(input.avgRevenueD90) &&
    input.avgRevenueD90 > 0
      ? input.avgRevenueD90
      : null;
  const first30 =
    input.avgRevenueD30 != null &&
    Number.isFinite(input.avgRevenueD30) &&
    input.avgRevenueD30 > 0
      ? input.avgRevenueD30
      : null;
  const valueVsCost =
    first90 != null && cashCac != null ? first90 / cashCac : null;
  const cacShareOfFirst90 =
    first90 != null && cashCac != null ? cashCac / first90 : null;
  const paybackDays =
    cashCac != null &&
    input.paybackDays != null &&
    Number.isFinite(input.paybackDays) &&
    input.paybackDays > 0
      ? Math.round(input.paybackDays)
      : null;
  return {
    cashCac,
    first90,
    first30,
    valueVsCost,
    paybackDays,
    cacShareOfFirst90,
  };
}

export function filterCpaDays(
  days: CpaDayPoint[],
  fromKey: string,
  toKey: string,
): CpaDayPoint[] {
  return days.filter((day) => day.dateKey >= fromKey && day.dateKey <= toKey);
}

export function hasTypedSpend(
  days: CpaDayPoint[],
  windows: CpaWindowSnapshot[] = [],
): boolean {
  if (windows.some((window) => window.spend > 0)) return true;
  return days.some((day) => day.spend > 0);
}

function monthBucketKey(dateKey: string): string {
  return `M:${dateKey.slice(0, 7)}`;
}

export function bucketCpaDays(
  days: CpaDayPoint[],
  grain: CpaGrain,
): CpaExplorerBucket[] {
  switch (grain) {
    case "day":
      return days.map((day) => {
        const fromIds = day.identifiedIds != null;
        const identified = fromIds
          ? uniqueIdCount(day.identifiedIds)
          : day.buyersKnown
            ? Math.max(0, Math.trunc(day.newCustomers)) +
              Math.max(0, Math.trunc(day.returningCustomers))
            : null;
        const newCustomers = fromIds
          ? uniqueIdCount(day.newIds)
          : day.buyersKnown
            ? Math.max(0, Math.trunc(day.newCustomers))
            : 0;
        const returningCustomers = fromIds
          ? Math.max(0, (identified ?? 0) - newCustomers)
          : day.buyersKnown
            ? Math.max(0, Math.trunc(day.returningCustomers))
            : 0;
        const buyersKnown = fromIds || day.buyersKnown;
        const buyers = buyersKnown ? identified : null;
        return {
          key: day.dateKey,
          label: overviewChartDayLabel(day.dateKey),
          spend: day.spend > 0 ? day.spend : 0,
          buyers,
          newCustomers,
          returningCustomers,
          cashCpa:
            buyersKnown && buyers != null
              ? cashCostPerCustomer(day.spend, buyers)
              : null,
          weekend: overviewIsWeekendKey(day.dateKey),
        };
      });
    case "week":
    case "month": {
      type Acc = {
        spend: number;
        newCustomers: number;
        returningCustomers: number;
        buyersKnown: boolean;
        identifiedIds: number[] | null;
        newIds: number[] | null;
        unknown: boolean;
      };
      const map = new Map<string, Acc>();
      for (const day of days) {
        const key =
          grain === "week"
            ? `W:${overviewIsoWeekStartKey(day.dateKey)}`
            : monthBucketKey(day.dateKey);
        const prev = map.get(key) ?? {
          spend: 0,
          newCustomers: 0,
          returningCustomers: 0,
          buyersKnown: false,
          identifiedIds: null,
          newIds: null,
          unknown: false,
        };
        prev.spend += day.spend > 0 ? day.spend : 0;
        if (day.identifiedIds != null && day.newIds != null) {
          if (prev.unknown) {
            map.set(key, prev);
            continue;
          }
          prev.identifiedIds = [
            ...(prev.identifiedIds ?? []),
            ...day.identifiedIds,
          ];
          prev.newIds = [...(prev.newIds ?? []), ...day.newIds];
          prev.buyersKnown = true;
        } else if (day.buyersKnown) {
          if (prev.identifiedIds != null) {
            prev.unknown = true;
            prev.buyersKnown = false;
          } else {
            prev.buyersKnown = true;
            prev.newCustomers += Math.max(0, Math.trunc(day.newCustomers));
            prev.returningCustomers += Math.max(
              0,
              Math.trunc(day.returningCustomers),
            );
          }
        } else {
          prev.unknown = true;
          prev.buyersKnown = false;
        }
        map.set(key, prev);
      }

      return [...map.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, acc]) => {
          const fromIds =
            !acc.unknown && acc.identifiedIds != null && acc.newIds != null;
          const newCustomers = fromIds
            ? uniqueIdCount(acc.newIds ?? [])
            : acc.buyersKnown
              ? acc.newCustomers
              : 0;
          const buyers = acc.unknown
            ? null
            : fromIds
              ? uniqueIdCount(acc.identifiedIds ?? [])
              : acc.buyersKnown
                ? acc.newCustomers + acc.returningCustomers
                : null;
          const returningCustomers = fromIds
            ? Math.max(0, (buyers ?? 0) - newCustomers)
            : acc.buyersKnown
              ? acc.returningCustomers
              : 0;
          const buyersKnown = !acc.unknown && (fromIds || acc.buyersKnown);
          return {
            key,
            label: overviewChartDayLabel(key),
            spend: acc.spend,
            buyers: buyersKnown ? buyers : null,
            newCustomers,
            returningCustomers,
            cashCpa:
              buyersKnown && buyers != null
                ? cashCostPerCustomer(acc.spend, buyers)
                : null,
            weekend: false,
          };
        });
    }
    default: {
      const _never: never = grain;
      throw new Error(`Unknown CPA grain: ${_never}`);
    }
  }
}

/** Median Cash CPA across buckets that have one — never a fake $0. */
export function typicalCpa(buckets: CpaExplorerBucket[]): number | null {
  return overviewMedian(
    buckets
      .map((bucket) => bucket.cashCpa)
      .filter((value): value is number => value != null && value > 0),
  );
}

export function cpaExplorerActivityDays(days: CpaDayPoint[]): CpaDayPoint[] {
  return days.filter((day) => day.spend > 0);
}
