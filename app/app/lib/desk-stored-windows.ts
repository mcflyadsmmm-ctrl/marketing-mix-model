/**
 * Period chips paint from the five stored windows.
 * A click selects one window. It does not recompute the book.
 */

import {
  DESK_PERIOD_CHIPS,
  isDeskPeriodChip,
  type DeskPeriodChip,
} from "./book-window";
import {
  buildOverviewOrderBookHero,
  filterOrdersInRange,
  orderBookFirstOrderMs,
  shiftRangeOneYear,
  type OverviewOrderBookHero,
  type OverviewOrderBookRow,
} from "./overview-order-book";
import { resolvePeriod, type PeriodPreset } from "./periods";

export type StoredWindowHero = {
  sales: number | null;
  priorSales: number | null;
  yoyPct: number | null;
  zone: OverviewOrderBookHero["zone"];
  returningSales: number | null;
  typicalOrder: number | null;
  weekendShare: number | null;
  orderCount: number;
  empty: boolean;
};

export function deskPeriodFromSearch(
  period: string | null | undefined,
): DeskPeriodChip {
  if (period && isDeskPeriodChip(period)) return period;
  return "mtd";
}

/**
 * True when the address stays on this page and only moves among the five chips.
 * That branch must not refetch Shopify, the order book, or spend materialize.
 */
export function deskPeriodClickStaysOnStoredWindows(
  current: URL,
  next: URL,
): boolean {
  if (current.pathname !== next.pathname) return false;
  const fromRaw = current.searchParams.get("period");
  const toRaw = next.searchParams.get("period");
  const from = fromRaw == null || fromRaw === "" ? "mtd" : fromRaw;
  const to = toRaw == null || toRaw === "" ? "mtd" : toRaw;
  if (from === to) return false;
  return isDeskPeriodChip(from) && isDeskPeriodChip(to);
}

export function emptyDeskOrderHero(): OverviewOrderBookHero {
  return buildOverviewOrderBookHero({
    windowOrders: [],
    priorOrders: [],
    firstByCustomer: new Map(),
  });
}

export function storedHeroToOrderHero(
  hero: StoredWindowHero | null,
): OverviewOrderBookHero | null {
  if (!hero) return null;
  return {
    sales: hero.sales,
    priorSales: hero.priorSales,
    yoyPct: hero.yoyPct,
    zone: hero.zone,
    returningSales: hero.returningSales,
    typicalOrder: hero.typicalOrder,
    weekendShare: hero.weekendShare,
    orderCount: hero.orderCount,
    empty: hero.empty,
  };
}

/**
 * Map the stored chip record. A missing chip is omitted.
 * This month with no chip still accepts the legacy hero.
 */
export function orderWindowsFromStoredHeroes(
  windows: Partial<Record<DeskPeriodChip, { hero: StoredWindowHero | null } | null>>,
  legacyThisMonth: StoredWindowHero | null,
): Partial<Record<DeskPeriodChip, OverviewOrderBookHero>> | null {
  const out: Partial<Record<DeskPeriodChip, OverviewOrderBookHero>> = {};
  let any = false;
  for (const chip of DESK_PERIOD_CHIPS) {
    const stored = storedHeroToOrderHero(windows[chip]?.hero ?? null);
    if (stored) {
      out[chip] = stored;
      any = true;
      continue;
    }
    if (chip === "mtd") {
      const legacy = storedHeroToOrderHero(legacyThisMonth);
      if (legacy) {
        out.mtd = legacy;
        any = true;
      }
    }
  }
  return any ? out : null;
}

/**
 * Select the chip in memory.
 * A missing chip does not borrow another month.
 * With no stored map, only the preset the loader already built may use the fallback.
 */
export function selectStoredDeskWindow(input: {
  windows: Partial<Record<DeskPeriodChip, OverviewOrderBookHero>> | null;
  period: string | null;
  loadedPreset: PeriodPreset;
  fallback: OverviewOrderBookHero;
}): { chip: DeskPeriodChip; hero: OverviewOrderBookHero } {
  const chip = deskPeriodFromSearch(input.period);
  const stored = input.windows?.[chip];
  if (stored) return { chip, hero: stored };
  const loaded = deskPeriodFromSearch(input.loadedPreset);
  if (chip === loaded) return { chip, hero: input.fallback };
  return { chip, hero: emptyDeskOrderHero() };
}

/** Slice one in-memory book into the five chips. Does not call Shopify. */
export function orderWindowsFromBook(input: {
  orders: OverviewOrderBookRow[];
  now: Date;
  timeZone: string;
  thisMonth?: OverviewOrderBookHero | null;
}): Record<DeskPeriodChip, OverviewOrderBookHero> {
  const firstByCustomer = orderBookFirstOrderMs(input.orders);
  const windows = {} as Record<DeskPeriodChip, OverviewOrderBookHero>;
  for (const chip of DESK_PERIOD_CHIPS) {
    if (chip === "mtd" && input.thisMonth) {
      windows.mtd = input.thisMonth;
      continue;
    }
    const range = resolvePeriod(chip, input.now, input.timeZone);
    const prior = shiftRangeOneYear(range.start, range.end);
    windows[chip] = buildOverviewOrderBookHero({
      windowOrders: filterOrdersInRange(input.orders, range.start, range.end),
      priorOrders: filterOrdersInRange(input.orders, prior.start, prior.end),
      firstByCustomer,
    });
  }
  return windows;
}
