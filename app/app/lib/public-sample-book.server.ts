/**
 * In-memory Snowdevil SAMPLE book for the public `/demo` desk.
 * Same generators as Admin SAMPLE — never Prisma, never a live shop.
 */

import {
  buildThreeYearSampleDesk,
  type SampleDayRow,
} from "./demo-sample-desk.server";
import { buildSampleOrderFactRows, type SampleOrderFactRow } from "./order-facts.server";
import { SAMPLE_DESK_TARGET_MER, utcDayKey } from "./sample-desk.server";
import { sampleSalesClock } from "./sample-order-clock";
import type { SalesResult } from "./shopify-sales.server";
import type { ExplorerDailyRow } from "./spend-explorer";
import {
  PUBLIC_SAMPLE_CURRENCY,
  PUBLIC_SAMPLE_SHOP_LABEL,
  PUBLIC_SAMPLE_TZ,
} from "./public-sample-constants";

export {
  PUBLIC_SAMPLE_CURRENCY,
  PUBLIC_SAMPLE_SHOP_LABEL,
  PUBLIC_SAMPLE_TZ,
};

export type PublicSampleDay = SampleDayRow & {
  dateKey: string;
  spend: number;
};

export type PublicSampleBook = {
  stamp: string;
  days: PublicSampleDay[];
  orders: SampleOrderFactRow[];
};

function spendOf(row: SampleDayRow): number {
  let sum = 0;
  for (const amt of Object.values(row.spendByChannel)) {
    if (Number.isFinite(amt) && amt > 0) sum += amt;
  }
  return Math.round(sum * 100) / 100;
}

let cache: PublicSampleBook | null = null;

export function loadPublicSampleBook(now = new Date()): PublicSampleBook {
  const stamp = utcDayKey(now);
  if (cache?.stamp === stamp) return cache;
  const rows = buildThreeYearSampleDesk({ now, targetMer: SAMPLE_DESK_TARGET_MER });
  const days: PublicSampleDay[] = rows.map((row) => ({
    ...row,
    dateKey: utcDayKey(row.day),
    spend: spendOf(row),
  }));
  const orders = buildSampleOrderFactRows(days);
  cache = { stamp, days, orders };
  return cache;
}

export function filterSampleDays(
  days: PublicSampleDay[],
  start: Date,
  end: Date,
): PublicSampleDay[] {
  const from = utcDayKey(start);
  const to = utcDayKey(end);
  return days.filter((day) => day.dateKey >= from && day.dateKey <= to);
}

export function sampleSalesFromDays(days: PublicSampleDay[]): SalesResult {
  let totalSales = 0;
  let orderCount = 0;
  let newCustomers = 0;
  let returningCustomers = 0;
  let newCustomerNetSales = 0;
  let guestOrders = 0;
  let guestNetSales = 0;
  for (const d of days) {
    totalSales += d.sales;
    orderCount += d.orderCount;
    newCustomers += d.newCustomers;
    returningCustomers += d.returningCustomers;
    newCustomerNetSales += d.newCustomerNetSales;
    guestOrders += d.guestOrders;
    guestNetSales += d.guestNetSales;
  }
  const clock = sampleSalesClock(totalSales);
  return {
    totalSales,
    grossSales: clock.grossSales,
    grossSalesKnown: true,
    netSales: clock.netSales,
    netSalesKnown: true,
    salesBasisUsed: "total",
    orderCount,
    newCustomers,
    returningCustomers,
    newCustomerNetSales,
    returningCustomerNetSales: Math.max(
      0,
      totalSales - newCustomerNetSales - guestNetSales,
    ),
    guestOrders,
    customerMetricsAvailable: true,
    source: "shopify",
  };
}

export function spendFromDays(days: PublicSampleDay[]): number {
  return days.reduce((sum, day) => sum + day.spend, 0);
}

export function explorerRowsFromDays(days: PublicSampleDay[]): ExplorerDailyRow[] {
  return days.map((day) => ({
    dateKey: day.dateKey,
    sales: day.sales,
    spend: day.spend,
    channels: Object.entries(day.spendByChannel)
      .filter(([, amount]) => Number.isFinite(amount) && amount > 0)
      .map(([channel, amount]) => ({ channel, amount: amount as number })),
  }));
}

export function merFromPair(sales: number, spend: number): number | null {
  if (!(spend > 0) || !Number.isFinite(sales)) return null;
  return sales / spend;
}
