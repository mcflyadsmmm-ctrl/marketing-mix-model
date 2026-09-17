/**
 * Enterprise SAMPLE (Snowdevil) depth locks — proves the generated demo desk is
 * deep enough for a multi-million-dollar operator to judge the desk *without*
 * turning on Live:
 *
 *  1. YoY coverage      — Overview MTD / QTD / YTD always have a full prior-year
 *                         window on file (even at a quarter / year boundary).
 *  2. Guest share       — Guest Checkouts carry real dollars (never a dash) and
 *                         are a subset of orders; identified buyers still split
 *                         into new vs returning.
 *  3. Repeat buyers     — the order book has multi-order buyers + whales so LTV
 *                         cohorts, retention heat, repurchase, and Orders
 *                         frequency are believable, not a wall of one-order rows.
 *  4. Spend on file     — every book day carries paid spend so Spend / Total
 *                         ROAS demo without Live, at a ~3.5× cash MER.
 *
 * All pure — no DB — so it runs in the app vitest suite.
 */
import { describe, expect, it } from "vitest";
import {
  buildThreeYearSampleDesk,
  SAMPLE_ACTIVE_CHANNELS,
  SAMPLE_BOOK_DAYS,
  SAMPLE_GUEST_SHARE,
  type SampleDayRow,
} from "./demo-sample-desk.server";
import {
  buildSampleOrderFactRows,
  computeCohortRollups,
  ORDER_FACT_GUEST_KEY,
  SAMPLE_ORDER_FACT_WINDOW_DAYS,
} from "./order-facts.server";
import { buildCustomerAnalytics } from "./customers-analytics";
import { buildCustomerRfm } from "./customers-rfm";
import { resolvePeriod, resolvePriorPeriod, type PeriodPreset } from "./periods";

const DAY_MS = 86_400_000;

function spendOf(row: SampleDayRow): number {
  return Object.values(row.spendByChannel).reduce((sum, amt) => sum + amt, 0);
}

function sumSalesInRange(
  rows: SampleDayRow[],
  range: { start: Date; end: Date },
): number {
  let sales = 0;
  for (const r of rows) {
    const t = r.day.getTime();
    if (t >= range.start.getTime() && t <= range.end.getTime()) sales += r.sales;
  }
  return sales;
}

describe("Snowdevil SAMPLE — Overview YoY coverage", () => {
  // Boundary-stressing `now` dates: quarter starts/ends and year end are the
  // worst case for a "same days last year" window, since prior QTD/YTD reach
  // furthest back. UTC because the sample desk resolves periods in UTC.
  const nowDates = [
    "2026-01-01T18:00:00Z", // year + quarter start (prior YTD is a full 2025)
    "2026-03-31T18:00:00Z", // Q1 end
    "2026-07-01T18:00:00Z", // Q3 start
    "2026-09-17T18:00:00Z", // mid-quarter
    "2026-12-31T18:00:00Z", // year end — deepest prior-YTD reach
  ];

  for (const iso of nowDates) {
    it(`has real prior-year MTD / QTD / YTD dollars at ${iso.slice(0, 10)}`, () => {
      const now = new Date(iso);
      const rows = buildThreeYearSampleDesk({ now, targetMer: 3.5 });

      for (const preset of ["mtd", "qtd", "ytd"] as PeriodPreset[]) {
        const current = resolvePeriod(preset, now, "UTC");
        const prior = resolvePriorPeriod(preset, now, "UTC");
        expect(
          sumSalesInRange(rows, current),
          `${preset} current sales @ ${iso}`,
        ).toBeGreaterThan(0);
        // The whole point: last year's same window is on file — not $0 / missing.
        expect(
          sumSalesInRange(rows, prior),
          `${preset} prior-year sales @ ${iso}`,
        ).toBeGreaterThan(0);
      }
    });
  }

  it("book reaches back a full prior year so YTD YoY is never partial", () => {
    const now = new Date("2026-12-31T18:00:00Z");
    const rows = buildThreeYearSampleDesk({ now });
    expect(rows.length).toBe(SAMPLE_BOOK_DAYS);
    const first = rows[0]!.day;
    // Earliest book day must be on/before Jan 1 of last year.
    const priorYearJan1 = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1));
    expect(first.getTime()).toBeLessThanOrEqual(priorYearJan1.getTime());
  });
});

describe("Snowdevil SAMPLE — guest share + new vs returning mix", () => {
  const now = new Date("2026-09-17T18:00:00Z");
  const rows = buildThreeYearSampleDesk({ now, targetMer: 3.5 });

  it("carries real guest checkouts as a subset of orders", () => {
    let guestOrders = 0;
    let orderCount = 0;
    let guestNetSales = 0;
    let sales = 0;
    for (const r of rows) {
      guestOrders += r.guestOrders;
      orderCount += r.orderCount;
      guestNetSales += r.guestNetSales;
      sales += r.sales;
      // Guests never exceed the day's orders, and never eat every buyer.
      expect(r.guestOrders).toBeGreaterThanOrEqual(0);
      expect(r.guestOrders).toBeLessThan(r.orderCount);
      expect(r.newCustomers).toBeGreaterThanOrEqual(1);
    }
    expect(guestOrders).toBeGreaterThan(0);
    expect(guestNetSales).toBeGreaterThan(0);
    const guestShare = guestOrders / orderCount;
    // Believable DTC guest tail — near the modeled share, never ~0 or a majority.
    expect(guestShare).toBeGreaterThan(0.03);
    expect(guestShare).toBeLessThan(SAMPLE_GUEST_SHARE + 0.05);
    // Guest dollars are a slice of the till, not the whole book.
    expect(guestNetSales).toBeLessThan(sales * 0.25);
  });

  it("splits identified buyers into new vs returning (both present)", () => {
    let newCustomers = 0;
    let returningCustomers = 0;
    let newNet = 0;
    for (const r of rows) {
      newCustomers += r.newCustomers;
      returningCustomers += r.returningCustomers;
      newNet += r.newCustomerNetSales;
      // Identified split + guests reconcile to the day's order count.
      expect(r.newCustomers + r.returningCustomers + r.guestOrders).toBe(
        r.orderCount,
      );
    }
    expect(newCustomers).toBeGreaterThan(0);
    expect(returningCustomers).toBeGreaterThan(0);
    expect(newNet).toBeGreaterThan(0);
  });

  it("conserves till dollars: new + returning + guest = sales", () => {
    for (const r of rows) {
      const returningNet = Math.max(
        0,
        r.sales - r.newCustomerNetSales - r.guestNetSales,
      );
      expect(r.newCustomerNetSales + returningNet + r.guestNetSales).toBeCloseTo(
        r.sales,
        2,
      );
      expect(r.guestNetSales).toBeGreaterThanOrEqual(0);
      expect(r.newCustomerNetSales + r.guestNetSales).toBeLessThanOrEqual(
        r.sales + 0.01,
      );
    }
  });
});

describe("Snowdevil SAMPLE — repeat buyers, whales, frequency, cohorts", () => {
  const now = new Date("2026-09-17T18:00:00Z");
  const book = buildThreeYearSampleDesk({ now, targetMer: 3.5 });
  const windowStart = now.getTime() - SAMPLE_ORDER_FACT_WINDOW_DAYS * DAY_MS;
  const windowDays = book.filter((r) => r.day.getTime() >= windowStart);
  const orders = buildSampleOrderFactRows(windowDays);

  it("synthesizes a real order book with guests carried from the sales days", () => {
    expect(orders.length).toBeGreaterThan(200);
    const guestOrders = orders.filter(
      (o) => o.customerKey === ORDER_FACT_GUEST_KEY,
    ).length;
    expect(guestOrders).toBeGreaterThan(0);
    // Guests never carry a lifetime-orders count (no account on file).
    for (const o of orders) {
      if (o.customerKey === ORDER_FACT_GUEST_KEY) {
        expect(o.lifetimeOrders).toBeNull();
      } else {
        expect(o.lifetimeOrders).toBeGreaterThanOrEqual(1);
      }
    }
    // Per-day synthesized amounts conserve the till (splitSalesVaried).
    const byDay = new Map<string, number>();
    for (const o of orders) {
      const key = o.shopLocalDate.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + o.amount);
    }
    for (const r of windowDays) {
      const n = Math.max(0, Math.min(12, Math.trunc(r.orderCount)));
      if (n === 0 || !(r.sales > 0)) continue;
      const summed = byDay.get(r.day.toISOString().slice(0, 10)) ?? 0;
      expect(summed).toBeCloseTo(r.sales, 2);
    }
  });

  it("has multi-order buyers and at least one whale", () => {
    const byCustomer = new Map<string, number>();
    for (const o of orders) {
      if (o.customerKey === ORDER_FACT_GUEST_KEY) continue;
      byCustomer.set(o.customerKey, (byCustomer.get(o.customerKey) ?? 0) + 1);
    }
    const counts = [...byCustomer.values()];
    const repeatBuyers = counts.filter((c) => c >= 2).length;
    const whales = counts.filter((c) => c >= 4).length;
    expect(repeatBuyers).toBeGreaterThan(3);
    expect(whales).toBeGreaterThanOrEqual(1);
    // A one-order long tail must still dominate (honest DTC shape).
    const oneOrder = counts.filter((c) => c === 1).length;
    expect(oneOrder).toBeGreaterThan(repeatBuyers);
  });

  it("feeds Customers analytics: repeaters, frequency tail, guests", () => {
    const analytics = buildCustomerAnalytics(
      orders.map((o) => ({
        customerKey: o.customerKey,
        orderedAt: o.orderedAt,
        amount: o.amount,
      })),
      { windowEnd: now, historyWindowDays: SAMPLE_ORDER_FACT_WINDOW_DAYS },
    );
    expect(analytics.available).toBe(true);
    expect(analytics.identifiedBuyers).toBeGreaterThan(50);
    expect(analytics.guestOrders).toBeGreaterThan(0);
    expect(analytics.repeatBuyers).toBeGreaterThan(3);
    // The order-frequency chart needs more than one bucket to be worth drawing.
    const nonEmptyBuckets = analytics.orderFrequency.filter(
      (b) => b.customers > 0,
    );
    expect(nonEmptyBuckets.length).toBeGreaterThan(1);
    expect(analytics.everRepeatShare).not.toBeNull();
    expect(analytics.everRepeatShare!).toBeGreaterThan(0);
  });

  it("feeds Customers RFM-lite: four segments and a whale watchlist", () => {
    const rfm = buildCustomerRfm(
      orders.map((o) => ({
        customerKey: o.customerKey,
        orderedAt: o.orderedAt,
        amount: o.amount,
      })),
      { windowEnd: now, historyLimited: false },
    );
    expect(rfm.available).toBe(true);
    expect(rfm.empty).toBeNull();
    expect(rfm.identifiedBuyers).toBeGreaterThan(50);
    expect(rfm.segments).toHaveLength(4);
    const buyers = rfm.segments.reduce((s, row) => s + row.buyers, 0);
    expect(buyers).toBe(rfm.identifiedBuyers);
    expect(rfm.bands).toHaveLength(3);
    // SAMPLE has 4+ order whales; at least the slipping list or the designed empty.
    expect(rfm.watchlist.length > 0 || rfm.watchEmpty != null).toBe(true);
    expect(rfm.watchlist.every((row) => /^Whale \d+$/.test(row.label))).toBe(true);
  });

  it("feeds LTV cohorts: multi-order months with 90d repeat revenue", () => {
    const rollups = computeCohortRollups(
      orders.map((o) => ({
        customerKey: o.customerKey,
        orderedAt: o.orderedAt,
        amount: o.amount,
        lifetimeOrders: o.lifetimeOrders,
      })),
    );
    expect(rollups.length).toBeGreaterThan(0);
    const repeatCohorts = rollups.filter((r) => r.ordersD90 > r.customers);
    // At least one cohort shows repeat orders inside 90 days (retention heat).
    expect(repeatCohorts.length).toBeGreaterThan(0);
    for (const r of rollups) {
      expect(r.revenueD90).toBeGreaterThanOrEqual(r.revenueD30);
      expect(r.ordersD90).toBeGreaterThanOrEqual(r.customers);
    }
  });
});

describe("Snowdevil SAMPLE — spend on file for Spend / Total ROAS demo", () => {
  const now = new Date("2026-09-17T18:00:00Z");
  const rows = buildThreeYearSampleDesk({ now, targetMer: 3.5 });

  it("every book day carries paid spend on active channels only", () => {
    const used = new Set<string>();
    let totalSales = 0;
    let totalSpend = 0;
    for (const r of rows) {
      const daySpend = spendOf(r);
      expect(daySpend, r.day.toISOString().slice(0, 10)).toBeGreaterThan(0);
      for (const [ch, amt] of Object.entries(r.spendByChannel)) {
        if (amt > 0) used.add(ch);
      }
      totalSales += r.sales;
      totalSpend += daySpend;
    }
    expect(totalSpend).toBeGreaterThan(0);
    for (const ch of used) {
      expect(SAMPLE_ACTIVE_CHANNELS).toContain(ch);
    }
    // Total ROAS lands in the impressive-but-honest band (not 4.4× theater).
    const mer = totalSales / totalSpend;
    expect(mer).toBeGreaterThan(3.1);
    expect(mer).toBeLessThan(4.0);
  });
});
