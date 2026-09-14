/**
 * Server loaders for Days / Orders / Buyers / Cohorts ledgers.
 */

import prisma from "../db.server";
import { fetchSampleSalesRowsByDay } from "./sample-desk.server";
import {
  ORDER_FACT_DAY_COMPLETE_PREFIX,
  ORDER_FACT_GUEST_KEY,
  ORDER_FACT_SOURCE,
} from "./order-facts.server";
import { shopLocalDayKey, utcMidnightFromDayKey } from "./shop-local-day";
import {
  buildBuyerLedgerRows,
  buildCohortLedgerRows,
  buildDayLedgerRows,
  buildOrderLedgerRows,
  strongestSoftestDayKeys,
  type BuyerLedgerRow,
  type BuyerLedgerRowInput,
  type CohortLedgerRow,
  type DayLedgerRow,
  type DayLedgerRowInput,
  type OrderLedgerRow,
} from "./desk-ledgers";

function eachDayKey(startKey: string, endKey: string): string[] {
  const out: string[] = [];
  let cur = startKey;
  while (cur <= endKey) {
    out.push(cur);
    const [y, m, d] = cur.split("-").map(Number);
    const next = new Date(Date.UTC(y!, m! - 1, d! + 1));
    cur = next.toISOString().slice(0, 10);
  }
  return out;
}

function dayKeyFromUtcDate(day: Date): string {
  return day.toISOString().slice(0, 10);
}

export async function loadDayLedger(args: {
  shopId: string;
  range: { start: Date; end: Date };
  ianaTimezone: string | null;
  currencyCode: string | null;
  useSampleDesk: boolean;
  openDayKey: string | null;
  missingDayKeys?: string[];
}): Promise<{
  rows: DayLedgerRow[];
  strongest: string | null;
  softest: string | null;
  rawCount: number;
}> {
  const tz = args.ianaTimezone || "UTC";
  const startKey = shopLocalDayKey(args.range.start, tz);
  const endKey = shopLocalDayKey(args.range.end, tz);
  const calendar = eachDayKey(startKey, endKey);
  const missing = new Set(args.missingDayKeys ?? []);
  const byKey = new Map<string, DayLedgerRowInput>();

  if (args.useSampleDesk) {
    const sample = await fetchSampleSalesRowsByDay(args.shopId, args.range);
    for (const [dayKey, row] of sample) {
      byKey.set(dayKey, {
        dayKey,
        sales: row.sales,
        netSales: null,
        grossSales: null,
        orderCount: row.orderCount,
        newCustomers: 0,
        returningCustomers: 0,
        newCustomerSales: row.newCustomerNetSales,
        returningCustomerSales: row.returningCustomerNetSales,
        guestOrders: 0,
        customerMetricsAvailable: true,
        asOf: null,
        source: "sample",
        open: args.openDayKey === dayKey,
      });
    }
  } else {
    const rows = await prisma.salesDayFact.findMany({
      where: {
        shopId: args.shopId,
        day: {
          gte: utcMidnightFromDayKey(startKey),
          lte: utcMidnightFromDayKey(endKey),
        },
      },
      select: {
        day: true,
        sales: true,
        netSales: true,
        grossSales: true,
        orderCount: true,
        newCustomers: true,
        returningCustomers: true,
        newCustomerNetSales: true,
        returningCustomerNetSales: true,
        guestOrders: true,
        customerMetricsAvailable: true,
        asOf: true,
        source: true,
      },
      orderBy: { day: "desc" },
    });
    for (const row of rows) {
      const dayKey = dayKeyFromUtcDate(row.day);
      byKey.set(dayKey, {
        dayKey,
        sales: row.sales,
        netSales: row.netSales,
        grossSales: row.grossSales,
        orderCount: row.orderCount,
        newCustomers: row.newCustomers,
        returningCustomers: row.returningCustomers,
        newCustomerSales: row.newCustomerNetSales,
        returningCustomerSales: row.returningCustomerNetSales,
        guestOrders: row.guestOrders,
        customerMetricsAvailable: row.customerMetricsAvailable,
        asOf: row.asOf?.toISOString() ?? null,
        source: row.source,
        open: args.openDayKey === dayKey,
      });
    }
  }

  const inputs: DayLedgerRowInput[] = [...calendar].reverse().map((dayKey) => {
    const hit = byKey.get(dayKey);
    if (hit) return { ...hit, missing: false };
    return {
      dayKey,
      sales: 0,
      netSales: null,
      grossSales: null,
      orderCount: 0,
      newCustomers: 0,
      returningCustomers: 0,
      newCustomerSales: 0,
      returningCustomerSales: 0,
      guestOrders: 0,
      customerMetricsAvailable: true,
      asOf: null,
      source: "",
      open: args.openDayKey === dayKey,
      missing: args.openDayKey !== dayKey,
    };
  });

  for (const row of inputs) {
    if (row.open) row.missing = false;
    else if (missing.has(row.dayKey) && !byKey.has(row.dayKey)) row.missing = true;
  }

  const { strongest, softest } = strongestSoftestDayKeys(inputs);
  return {
    rows: buildDayLedgerRows(inputs, args.currencyCode),
    strongest,
    softest,
    rawCount: byKey.size,
  };
}

export async function loadOrderLedger(args: {
  shopId: string;
  range: { start: Date; end: Date };
  currencyCode: string | null;
  useSampleDesk: boolean;
  guestOnly?: boolean;
  returningOnly?: boolean;
  discountedOnly?: boolean;
  limit?: number;
}): Promise<{ rows: OrderLedgerRow[]; totalMatched: number }> {
  const source = args.useSampleDesk ? "sample" : ORDER_FACT_SOURCE;
  const limit = Math.min(Math.max(args.limit ?? 250, 1), 500);

  const where = {
    shopId: args.shopId,
    source,
    orderedAt: { gte: args.range.start, lte: args.range.end },
    NOT: { shopifyOrderId: { startsWith: ORDER_FACT_DAY_COMPLETE_PREFIX } },
    ...(args.guestOnly ? { customerKey: ORDER_FACT_GUEST_KEY } : {}),
    ...(args.returningOnly
      ? { customerKey: { not: ORDER_FACT_GUEST_KEY } }
      : {}),
    ...(args.discountedOnly ? { discountTotal: { gt: 0 } } : {}),
  };

  const [totalMatched, orders] = await Promise.all([
    prisma.orderFact.count({ where }),
    prisma.orderFact.findMany({
      where,
      select: {
        shopifyOrderId: true,
        customerKey: true,
        orderedAt: true,
        shopLocalDate: true,
        amount: true,
        discountTotal: true,
        shippingTotal: true,
        taxTotal: true,
        unitCount: true,
        currency: true,
      },
      orderBy: { orderedAt: "desc" },
      take: limit,
    }),
  ]);

  const identified = [
    ...new Set(
      orders
        .filter((o) => o.customerKey !== ORDER_FACT_GUEST_KEY)
        .map((o) => o.customerKey),
    ),
  ];
  const priorCounts = new Map<string, number>();
  if (identified.length > 0) {
    const priors = await prisma.orderFact.groupBy({
      by: ["customerKey"],
      where: {
        shopId: args.shopId,
        source,
        customerKey: { in: identified },
        orderedAt: { lt: args.range.start },
        NOT: {
          shopifyOrderId: { startsWith: ORDER_FACT_DAY_COMPLETE_PREFIX },
        },
      },
      _count: { _all: true },
    });
    for (const p of priors) priorCounts.set(p.customerKey, p._count._all);
  }

  const seenInPeriod = new Map<string, number>();
  const chronological = [...orders].sort(
    (a, b) => a.orderedAt.getTime() - b.orderedAt.getTime(),
  );
  const rankByOrderId = new Map<string, number | null>();
  for (const o of chronological) {
    if (o.customerKey === ORDER_FACT_GUEST_KEY) {
      rankByOrderId.set(o.shopifyOrderId, null);
      continue;
    }
    const prior = priorCounts.get(o.customerKey) ?? 0;
    const seen = seenInPeriod.get(o.customerKey) ?? 0;
    rankByOrderId.set(o.shopifyOrderId, prior + seen + 1);
    seenInPeriod.set(o.customerKey, seen + 1);
  }

  return {
    rows: buildOrderLedgerRows(
      orders.map((o) => ({
        shopifyOrderId: o.shopifyOrderId,
        dayKey: dayKeyFromUtcDate(o.shopLocalDate),
        orderedAtIso: o.orderedAt.toISOString(),
        amount: o.amount,
        discountTotal: o.discountTotal,
        shippingTotal: o.shippingTotal,
        taxTotal: o.taxTotal,
        unitCount: o.unitCount,
        customerKey: o.customerKey,
        currency: o.currency,
        isGuest: o.customerKey === ORDER_FACT_GUEST_KEY,
        lifetimeOrderRank: rankByOrderId.get(o.shopifyOrderId) ?? null,
      })),
      args.currencyCode,
    ),
    totalMatched,
  };
}

export async function loadBuyerLedger(args: {
  shopId: string;
  range: { start: Date; end: Date };
  currencyCode: string | null;
  useSampleDesk: boolean;
  limit?: number;
}): Promise<{ rows: BuyerLedgerRow[]; totalBuyers: number }> {
  const source = args.useSampleDesk ? "sample" : ORDER_FACT_SOURCE;
  const limit = Math.min(Math.max(args.limit ?? 100, 1), 300);

  const periodOrders = await prisma.orderFact.findMany({
    where: {
      shopId: args.shopId,
      source,
      orderedAt: { gte: args.range.start, lte: args.range.end },
      customerKey: { not: ORDER_FACT_GUEST_KEY },
      NOT: { shopifyOrderId: { startsWith: ORDER_FACT_DAY_COMPLETE_PREFIX } },
    },
    select: {
      customerKey: true,
      orderedAt: true,
      shopLocalDate: true,
      amount: true,
    },
    orderBy: { orderedAt: "asc" },
  });

  const periodKeys = [...new Set(periodOrders.map((o) => o.customerKey))];
  if (periodKeys.length === 0) return { rows: [], totalBuyers: 0 };

  const lifetimeOrders = await prisma.orderFact.findMany({
    where: {
      shopId: args.shopId,
      source,
      customerKey: { in: periodKeys },
      NOT: { shopifyOrderId: { startsWith: ORDER_FACT_DAY_COMPLETE_PREFIX } },
    },
    select: {
      customerKey: true,
      orderedAt: true,
      shopLocalDate: true,
      amount: true,
    },
    orderBy: { orderedAt: "asc" },
  });

  const byBuyer = new Map<
    string,
    {
      firstDayKey: string;
      lastDayKey: string;
      orderCount: number;
      lifetimeSales: number;
      periodSales: number;
      orderedAts: Date[];
    }
  >();

  for (const o of lifetimeOrders) {
    const dayKey = dayKeyFromUtcDate(o.shopLocalDate);
    const row = byBuyer.get(o.customerKey);
    if (!row) {
      byBuyer.set(o.customerKey, {
        firstDayKey: dayKey,
        lastDayKey: dayKey,
        orderCount: 1,
        lifetimeSales: o.amount,
        periodSales: 0,
        orderedAts: [o.orderedAt],
      });
    } else {
      row.orderCount += 1;
      row.lifetimeSales += o.amount;
      row.lastDayKey = dayKey;
      row.orderedAts.push(o.orderedAt);
    }
  }

  for (const o of periodOrders) {
    const row = byBuyer.get(o.customerKey);
    if (row) row.periodSales += o.amount;
  }

  const inputs: BuyerLedgerRowInput[] = [...byBuyer.entries()].map(
    ([customerKey, row]) => {
      let daysToSecond: number | null = null;
      if (row.orderedAts.length >= 2) {
        daysToSecond =
          (row.orderedAts[1]!.getTime() - row.orderedAts[0]!.getTime()) /
          (24 * 60 * 60 * 1000);
      }
      return {
        customerKey,
        firstDayKey: row.firstDayKey,
        lastDayKey: row.lastDayKey,
        orderCount: row.orderCount,
        lifetimeSales: row.lifetimeSales,
        periodSales: row.periodSales,
        daysToSecond,
      };
    },
  );

  inputs.sort((a, b) => b.periodSales - a.periodSales);

  return {
    rows: buildBuyerLedgerRows(inputs.slice(0, limit), args.currencyCode),
    totalBuyers: inputs.length,
  };
}

export async function loadCohortLedger(args: {
  shopId: string;
  currencyCode: string | null;
  useSampleDesk: boolean;
  limit?: number;
}): Promise<{ rows: CohortLedgerRow[] }> {
  const source = args.useSampleDesk ? "sample" : ORDER_FACT_SOURCE;
  const limit = Math.min(Math.max(args.limit ?? 36, 1), 60);
  const facts = await prisma.cohortFact.findMany({
    where: { shopId: args.shopId, source },
    orderBy: { cohortMonth: "desc" },
    take: limit,
  });

  return {
    rows: buildCohortLedgerRows(
      facts.map((f) => ({
        cohortMonth: f.cohortMonth,
        customers: f.customers,
        revenueD30: f.revenueD30,
        revenueD90: f.revenueD90,
        revenueD365: f.revenueD365,
        ordersD30: f.ordersD30,
        ordersD90: f.ordersD90,
        ordersD365: f.ordersD365,
      })),
      args.currencyCode,
    ),
  };
}
