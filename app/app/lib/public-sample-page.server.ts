/**
 * Public `/demo` loader — Snowdevil SAMPLE only.
 * Never Shopify authenticate, never Prisma shop rows, never live orders.
 */

import { buildCashControlBoard, type CashControlBoard } from "./mer-control";
import { buildCustomerAnalytics, type RetentionOrderRow } from "./customers-analytics";
import { buildCustomerRfm, type CustomerRfmView } from "./customers-rfm";
import { buildGrowthTt2, type GrowthTt2View } from "./growth-tt2";
import {
  GROWTH_COMEBACK_WINDOW_DAYS,
  growthFirstOrderMonths,
  type GrowthCohortInput,
  type GrowthMonthBar,
} from "./growth-comeback";
import { buildHabitGoals, type HabitGoalsView } from "./goals-habit";
import {
  buildOrderHistoryForecast,
  type OrderHistoryForecastView,
} from "./order-history-forecast";
import {
  buildOverviewMixForecast,
  overviewHistoryDays,
  overviewMonthClock,
  overviewMtdFromDays,
  type OverviewMixForecastView,
} from "./overview-mix-forecast";
import {
  pickShareableLtvPeek,
  shareableLtvWindowLabel,
} from "./shareable-insights";
import { buildOverviewYoyCards, type OverviewYoyCard } from "./overview-yoy";
import {
  buildOverviewOrderBookHero,
  filterOrdersInRange,
  orderBookDaySeries,
  orderBookFirstOrderMs,
  shiftRangeOneYear,
  type OverviewOrderBookHero,
  type OverviewOrderBookRow,
} from "./overview-order-book";
import {
  parsePeriodPreset,
  resolvePeriod,
  type PeriodPreset,
} from "./periods";
import { SAMPLE_DESK_MARGIN_PCT, SAMPLE_DESK_TARGET_MER } from "./sample-desk.server";
import { shopifyNativePeriodStats, type ShopifyNativePeriodStats } from "./shopify-native-stats";
import {
  shopifyDepthStats,
  type OrderDepthRow,
  type ShopifyDepthStats,
} from "./shopify-depth-stats";
import { shopLocalYmd } from "./shop-local-day";
import {
  buildCpaWindowSnapshot,
  resolveCpaDeskWindows,
  type CpaDayPoint,
  type CpaWindowSnapshot,
} from "./cpa-desk";
import { PRODUCT_NOUN } from "./product-labels";
import type { SampleOrderFactRow } from "./order-facts.server";
import {
  explorerRowsFromDays,
  filterSampleDays,
  loadPublicSampleBook,
  merFromPair,
  PUBLIC_SAMPLE_CURRENCY,
  PUBLIC_SAMPLE_SHOP_LABEL,
  PUBLIC_SAMPLE_TZ,
  sampleSalesFromDays,
  spendFromDays,
  type PublicSampleDay,
} from "./public-sample-book.server";
import type { SalesResult } from "./shopify-sales.server";

const DAY_MS = 86_400_000;
const CUSTOMERS_WINDOW_DAYS = 90;

export type PublicSampleCustomers = ReturnType<typeof buildCustomerAnalytics> & {
  rfm: CustomerRfmView;
};

export type PublicSampleLtv = {
  revenue30: number | null;
  revenue90: number | null;
  revenue365: number | null;
  avgOrdersD90: number | null;
  repeatRate: number | null;
};

export type PublicSamplePage = {
  preset: PeriodPreset;
  shotMode: boolean;
  embed: string | null;
  shopLabel: string;
  currencyCode: string;
  tillLabel: string;
  targetMer: number;
  marginPct: number;
  rangeLabel: string;
  sales: SalesResult;
  spend: number;
  mer: number | null;
  depth: ShopifyDepthStats;
  book: ShopifyNativePeriodStats;
  cashControl: CashControlBoard;
  yoyCards: OverviewYoyCard[];
  /** OrderFact first-fold hero — From orders, never SalesDayFact. */
  orderHero: OverviewOrderBookHero;
  explorerDays: Array<{ dateKey: string; sales: number; orders: number }>;
  mixForecast: OverviewMixForecastView;
  orderHistoryForecast: OrderHistoryForecastView;
  customers: PublicSampleCustomers;
  tt2: GrowthTt2View;
  comebackDepth: ShopifyDepthStats;
  growthMonths: GrowthMonthBar[];
  ltv: PublicSampleLtv;
  cpaWindows: CpaWindowSnapshot[];
  cpaDays: CpaDayPoint[];
  ledgerDays: PublicSampleDay[];
  channelSpend: Array<{ channel: string; amount: number }>;
  habitGoals: HabitGoalsView;
  goalsYear: number;
};

function toDepthRows(orders: SampleOrderFactRow[]): OrderDepthRow[] {
  return orders.map((row) => ({
    customerKey: row.customerKey,
    amount: row.amount,
    orderedAt: row.orderedAt,
    shopLocalDate: row.shopLocalDate,
    discountAmount: row.discountAmount,
    sourceName: row.sourceName,
    unitCount: row.unitCount,
  }));
}

function toOrderBookRows(orders: SampleOrderFactRow[]): OverviewOrderBookRow[] {
  return orders.map((row) => ({
    customerKey: row.customerKey,
    amount: row.amount,
    orderedAt: row.orderedAt,
    shopLocalDate: row.shopLocalDate,
  }));
}

function toRetention(orders: SampleOrderFactRow[]): RetentionOrderRow[] {
  return orders.map((row) => ({
    customerKey: row.customerKey,
    orderedAt: row.orderedAt,
    amount: row.amount,
    lifetimeOrders: row.lifetimeOrders,
    shopLocalDate: row.shopLocalDate,
  }));
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

export function sampleLtvAverages(
  orders: SampleOrderFactRow[],
  now: Date,
): PublicSampleLtv {
  const identified = orders.filter(
    (row) => row.customerKey && row.customerKey !== "guest",
  );
  const byCustomer = new Map<
    string,
    { first: number; rows: Array<{ t: number; amt: number }> }
  >();
  for (const row of identified) {
    const t = row.orderedAt.getTime();
    const rec = byCustomer.get(row.customerKey) ?? { first: t, rows: [] };
    rec.first = Math.min(rec.first, t);
    rec.rows.push({ t, amt: row.amount });
    byCustomer.set(row.customerKey, rec);
  }
  const r30: number[] = [];
  const r90: number[] = [];
  const r365: number[] = [];
  const orders90: number[] = [];
  let eligible30 = 0;
  let within30 = 0;
  const nowMs = now.getTime();
  for (const rec of byCustomer.values()) {
    const age = nowMs - rec.first;
    if (age >= 30 * DAY_MS) {
      eligible30 += 1;
      if (rec.rows.some((row) => row.t > rec.first && row.t - rec.first <= 30 * DAY_MS)) {
        within30 += 1;
      }
      r30.push(
        rec.rows
          .filter((row) => row.t - rec.first <= 30 * DAY_MS)
          .reduce((sum, row) => sum + row.amt, 0),
      );
    }
    if (age >= 90 * DAY_MS) {
      const in90 = rec.rows.filter((row) => row.t - rec.first <= 90 * DAY_MS);
      r90.push(in90.reduce((sum, row) => sum + row.amt, 0));
      orders90.push(in90.length);
    }
    if (age >= 365 * DAY_MS) {
      r365.push(
        rec.rows
          .filter((row) => row.t - rec.first <= 365 * DAY_MS)
          .reduce((sum, row) => sum + row.amt, 0),
      );
    }
  }
  return {
    revenue30: mean(r30),
    revenue90: mean(r90),
    revenue365: mean(r365),
    avgOrdersD90: mean(orders90),
    repeatRate: eligible30 > 0 ? within30 / eligible30 : null,
  };
}

export function sampleGrowthCohorts(
  orders: SampleOrderFactRow[],
): GrowthCohortInput[] {
  const identified = orders.filter(
    (row) => row.customerKey && row.customerKey !== "guest",
  );
  const byCustomer = new Map<
    string,
    { first: number; rows: Array<{ t: number; amt: number }> }
  >();
  for (const row of identified) {
    const t = row.orderedAt.getTime();
    const rec = byCustomer.get(row.customerKey) ?? { first: t, rows: [] };
    rec.first = Math.min(rec.first, t);
    rec.rows.push({ t, amt: row.amount });
    byCustomer.set(row.customerKey, rec);
  }
  const byMonth = new Map<
    string,
    { customers: number; revenueD30: number; ordersD90: number }
  >();
  for (const rec of byCustomer.values()) {
    const first = new Date(rec.first);
    const cohortMonth = `${first.getUTCFullYear()}-${String(first.getUTCMonth() + 1).padStart(2, "0")}`;
    const bucket = byMonth.get(cohortMonth) ?? {
      customers: 0,
      revenueD30: 0,
      ordersD90: 0,
    };
    bucket.customers += 1;
    for (const row of rec.rows) {
      const age = row.t - rec.first;
      if (age <= 30 * DAY_MS) bucket.revenueD30 += row.amt;
      if (age <= 90 * DAY_MS) bucket.ordersD90 += 1;
    }
    byMonth.set(cohortMonth, bucket);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cohortMonth, bucket]) => ({ cohortMonth, ...bucket }));
}

function channelTotals(days: PublicSampleDay[]): Array<{ channel: string; amount: number }> {
  const totals = new Map<string, number>();
  for (const day of days) {
    for (const [channel, amount] of Object.entries(day.spendByChannel)) {
      if (!(amount > 0)) continue;
      totals.set(channel, (totals.get(channel) ?? 0) + amount);
    }
  }
  return [...totals.entries()]
    .map(([channel, amount]) => ({ channel, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export async function loadPublicSamplePage(
  request: Request,
): Promise<PublicSamplePage> {
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const embed = url.searchParams.get("embed")?.trim() || null;
  const preset = parsePeriodPreset(url.searchParams.get("period"));
  const now = new Date();
  const range = resolvePeriod(preset, now, PUBLIC_SAMPLE_TZ);
  const book = loadPublicSampleBook(now);
  const periodDays = filterSampleDays(book.days, range.start, range.end);
  const sales = sampleSalesFromDays(periodDays);
  const spend = spendFromDays(periodDays);
  const mer = merFromPair(sales.totalSales, spend);

  const periodStartMs = range.start.getTime();
  const periodEndMs = range.end.getTime();
  const allOrderBook = toOrderBookRows(book.orders);
  const periodOrderBook = filterOrdersInRange(
    allOrderBook,
    range.start,
    range.end,
  );
  const priorRange = shiftRangeOneYear(range.start, range.end);
  const priorOrderBook = filterOrdersInRange(
    allOrderBook,
    priorRange.start,
    priorRange.end,
  );
  const orderHeroBase = buildOverviewOrderBookHero({
    windowOrders: periodOrderBook,
    priorOrders: priorOrderBook,
    firstByCustomer: orderBookFirstOrderMs(allOrderBook),
    typicalOrder: null,
  });
  const periodOrders = book.orders.filter((row) => {
    const t = row.orderedAt.getTime();
    return t >= periodStartMs && t <= periodEndMs;
  });
  const depth = shopifyDepthStats({
    orders: toDepthRows(periodOrders),
    totalSales: orderHeroBase.sales ?? sales.totalSales,
    netSales: sales.netSales,
    netSalesKnown: true,
    grossSales: sales.grossSales,
    grossSalesKnown: true,
    timeZone: PUBLIC_SAMPLE_TZ,
    windowEnd: range.end,
  });
  const orderHero: OverviewOrderBookHero = {
    ...orderHeroBase,
    typicalOrder:
      depth.medianAov != null && Number.isFinite(depth.medianAov)
        ? depth.medianAov
        : orderHeroBase.typicalOrder,
    weekendShare:
      depth.weekendSalesShare != null
        ? depth.weekendSalesShare
        : orderHeroBase.weekendShare,
  };
  const native = shopifyNativePeriodStats({
    sales: sales.totalSales,
    orderCount: sales.orderCount,
    newCustomers: sales.newCustomers,
    returningCustomers: sales.returningCustomers,
    guestOrders: sales.guestOrders,
    customerMetricsAvailable: true,
    newCustomerNetSales: sales.newCustomerNetSales,
    returningCustomerNetSales: sales.returningCustomerNetSales,
    grossSales: sales.grossSales,
    grossSalesKnown: true,
  });

  const cashControl = buildCashControlBoard(
    explorerRowsFromDays(book.days),
    SAMPLE_DESK_TARGET_MER,
  );
  const yoyCards = buildOverviewYoyCards(cashControl.chips);

  // Chart = order-book day sums for display only — never upserted as SalesDayFact.
  const explorerDays = orderBookDaySeries(allOrderBook);
  const ymd = shopLocalYmd(now, PUBLIC_SAMPLE_TZ);
  const monthPrefix = `${ymd.y}-${String(ymd.m).padStart(2, "0")}`;
  const clock = overviewMonthClock(ymd.y, ymd.m, ymd.d);
  const mtdFromChip = cashControl.chips.find((chip) => chip.id === "mtd")?.sales;
  const mtdSales =
    mtdFromChip != null && Number.isFinite(mtdFromChip)
      ? mtdFromChip
      : overviewMtdFromDays(explorerDays, monthPrefix);
  const mixForecast = buildOverviewMixForecast({
    salesPending: false,
    orderCount: sales.orderCount,
    windowNewSales: sales.newCustomerNetSales,
    windowReturningSales: sales.returningCustomerNetSales,
    mtdSales,
    dailySales: explorerDays.map((day) => day.sales),
    daysElapsed: clock.daysElapsed,
    daysInMonth: clock.daysInMonth,
    remainingDays: clock.remainingDays,
    historyLimited: false,
    historyDays: overviewHistoryDays(
      explorerDays[0]?.dateKey ?? null,
      explorerDays[explorerDays.length - 1]?.dateKey ?? null,
    ),
  });

  const retention = toRetention(book.orders);
  const recentStart = now.getTime() - CUSTOMERS_WINDOW_DAYS * DAY_MS;
  const recent = retention.filter((row) => row.orderedAt.getTime() >= recentStart);
  const customers: PublicSampleCustomers = {
    ...buildCustomerAnalytics(recent, {
      windowEnd: now,
      historyWindowDays: CUSTOMERS_WINDOW_DAYS,
      orderBook: retention,
      periodStart: range.start,
      periodEnd: range.end,
      historyLimited: false,
      timeZone: PUBLIC_SAMPLE_TZ,
    }),
    rfm: buildCustomerRfm(retention, { windowEnd: now, historyLimited: false }),
  };

  const comebackStart = now.getTime() - GROWTH_COMEBACK_WINDOW_DAYS * DAY_MS;
  const comebackOrders = book.orders.filter(
    (row) => row.orderedAt.getTime() >= comebackStart,
  );
  const comebackSales = sampleSalesFromDays(
    filterSampleDays(book.days, new Date(comebackStart), now),
  );
  const comebackDepth = shopifyDepthStats({
    orders: toDepthRows(comebackOrders),
    totalSales: comebackSales.totalSales,
    netSales: comebackSales.netSales,
    netSalesKnown: true,
    grossSales: comebackSales.grossSales,
    grossSalesKnown: true,
    timeZone: PUBLIC_SAMPLE_TZ,
    windowEnd: now,
  });
  const tt2 = buildGrowthTt2(
    book.orders.map((row) => ({
      customerKey: row.customerKey,
      orderedAt: row.orderedAt,
      amount: row.amount,
      shopLocalDate: row.shopLocalDate,
    })),
    { windowEnd: now, historyLimited: false },
  );

  const cpaDays: CpaDayPoint[] = book.days.map((day) => ({
    dateKey: day.dateKey,
    spend: day.spend,
    newCustomers: day.newCustomers,
    returningCustomers: day.returningCustomers,
    newCustomerSales: day.newCustomerNetSales,
    buyersKnown: true,
  }));
  const cpaWindowsDef = resolveCpaDeskWindows(now, PUBLIC_SAMPLE_TZ, "paid_full");
  const cpaWindows = [
    buildCpaWindowSnapshot("this_month", cpaWindowsDef.thisMonth, cpaDays, PUBLIC_SAMPLE_TZ),
    buildCpaWindowSnapshot("last_28", cpaWindowsDef.last28, cpaDays, PUBLIC_SAMPLE_TZ),
  ];

  const ledgerDays = [...periodDays].sort((a, b) => b.dateKey.localeCompare(a.dateKey)).slice(0, 14);
  const ltv = sampleLtvAverages(book.orders, now);
  const ltvPeek = pickShareableLtvPeek({
    revenue30: ltv.revenue30,
    revenue90: ltv.revenue90,
    revenue365: ltv.revenue365,
    historyLimited: false,
  });
  const yearDays = book.days.filter((day) =>
    day.dateKey.startsWith(`${ymd.y}-`),
  );
  const yearReturningSales = sampleSalesFromDays(yearDays).returningCustomerNetSales;
  const yearReturning = yearReturningSales > 0 ? yearReturningSales : null;
  const yearOrderCount = yearDays.reduce((sum, day) => sum + day.orderCount, 0);
  const habitGoals = buildHabitGoals({
    salesPending: false,
    orderCount: yearOrderCount,
    ltv30: ltv.revenue30,
    ltv90: ltv.revenue90,
    ltv365: ltv.revenue365,
    yearReturningSales: yearReturning,
    typedReturningTarget: null,
    historyLimited: false,
    sample: true,
    year: ymd.y,
  });
  const orderHistoryForecast = buildOrderHistoryForecast({
    salesPending: false,
    dailySales: book.days.map((day) => day.sales),
    todayYear: ymd.y,
    todayMonth: ymd.m,
    historyLimited: false,
    bookLabel: "Snowdevil book",
    targets: {
      salesActual: mtdSales > 0 ? mtdSales : null,
      salesGoal: null,
      returningActual: yearReturning,
      returningTarget: habitGoals.returning?.target ?? null,
      returningSource:
        habitGoals.returning?.targetSource === "typed" ||
        habitGoals.returning?.targetSource === "sample"
          ? habitGoals.returning.targetSource
          : null,
      ltvActual: ltvPeek?.amount ?? null,
      ltvWindow: ltvPeek ? shareableLtvWindowLabel(ltvPeek.days) : null,
    },
  });

  return {
    preset,
    shotMode,
    embed,
    shopLabel: PUBLIC_SAMPLE_SHOP_LABEL,
    currencyCode: PUBLIC_SAMPLE_CURRENCY,
    tillLabel: `${range.label}${PRODUCT_NOUN.samplePeriodSuffix}`,
    targetMer: SAMPLE_DESK_TARGET_MER,
    marginPct: SAMPLE_DESK_MARGIN_PCT,
    rangeLabel: range.label,
    sales,
    spend,
    mer,
    depth,
    book: native,
    cashControl,
    yoyCards,
    orderHero,
    explorerDays,
    mixForecast,
    orderHistoryForecast,
    customers,
    tt2,
    comebackDepth,
    growthMonths: growthFirstOrderMonths(sampleGrowthCohorts(book.orders)),
    ltv,
    cpaWindows,
    cpaDays,
    ledgerDays,
    channelSpend: channelTotals(periodDays),
    habitGoals,
    goalsYear: ymd.y,
  };
}
