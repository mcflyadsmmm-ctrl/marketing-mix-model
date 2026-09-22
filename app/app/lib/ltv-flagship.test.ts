import { describe, expect, it } from "vitest";
import { rollUpCustomers, type DepthOrder } from "./ltv-depth";
import { generateSnowdevilDepthOrders } from "./ltv-depth-sample";
import {
  buildLtvFlagship,
  firstOrderWindowTriangle,
  flagshipDailyRead,
  flagshipEmptyState,
  flagshipMonthRows,
  flagshipWindowCurve,
  pathClarity,
  predictiveLtv,
  cohortCellRevenue,
  cohortRevenueBasisLabel,
  cohortRevenueFormula,
  DEFAULT_COHORT_REVENUE_BASIS,
  refundHonesty,
  windowAddedAfterPrior,
  windowRetention,
  windowRevenue,
} from "./ltv-flagship";

function order(
  customerKey: string,
  iso: string,
  amount: number,
  extra?: Partial<DepthOrder>,
): DepthOrder {
  return {
    customerKey,
    orderedAt: new Date(iso),
    amount,
    units: 1,
    product: extra?.product ?? null,
    grossAmount: extra?.grossAmount,
  };
}

function maturedBook(): DepthOrder[] {
  const rows: DepthOrder[] = [];
  for (let i = 0; i < 10; i += 1) {
    rows.push(order(`c${i}`, "2024-01-01", 100));
    if (i < 4) rows.push(order(`c${i}`, "2024-01-15", 50)); // +14d
    if (i < 6) rows.push(order(`c${i}`, "2024-03-01", 40)); // +60d
    if (i < 7) rows.push(order(`c${i}`, "2024-06-01", 30)); // +152d
  }
  return rows;
}

describe("30 / 90 / 365 come-back + revenue", () => {
  const asOf = new Date("2025-01-01");

  it("counts a second order inside each window among matured buyers", () => {
    const customers = rollUpCustomers(maturedBook());
    expect(windowRetention(customers, asOf, 30).rate).toBeCloseTo(0.4, 5);
    expect(windowRetention(customers, asOf, 90).rate).toBeCloseTo(0.6, 5);
    expect(windowRetention(customers, asOf, 365).rate).toBeCloseTo(0.7, 5);
  });

  it("averages net dollars through each matured window", () => {
    const customers = rollUpCustomers(maturedBook());
    // 4 buyers: 100+50+40+30 = 220 through year; 30d is 150 for those 4,
    // 100 for the other 6 → (4*150 + 6*100) / 10 = 120.
    expect(windowRevenue(customers, asOf, 30).revenue).toBeCloseTo(120, 5);
    // 90d: 6 buyers at 100+50? wait — i<4 have +14d and +60d; i=4,5 have +60d only.
    // i=0-3: 100+50+40 = 190 in 90d; i=4-5: 100+40 = 140; i=6-9: 100.
    expect(windowRevenue(customers, asOf, 90).revenue).toBeCloseTo(
      (4 * 190 + 2 * 140 + 4 * 100) / 10,
      5,
    );
  });

  it("leaves un-elapsed windows null instead of a fake 0% / $0", () => {
    // 45 days after first orders — 30d has matured, 90/365 have not.
    const youngAsOf = new Date("2024-02-15");
    const customers = rollUpCustomers(maturedBook());
    expect(windowRetention(customers, youngAsOf, 90).rate).toBeNull();
    expect(windowRevenue(customers, youngAsOf, 365).revenue).toBeNull();
    const curve = flagshipWindowCurve(customers, youngAsOf);
    expect(curve).not.toBeNull();
    expect(curve!.points.find((p) => p.days === 30)?.revenue).not.toBeNull();
    expect(curve!.points.find((p) => p.days === 365)?.revenue).toBeNull();
    expect(curve!.points.find((p) => p.days === 365)?.retention).toBeNull();
  });

  it("adds after the prior window among the same matured buyers", () => {
    const asOf = new Date("2024-04-15");
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 10; i += 1) {
      rows.push(order(`old${i}`, "2024-01-01", 100));
      rows.push(order(`old${i}`, "2024-01-20", 50));
    }
    for (let i = 0; i < 10; i += 1) {
      rows.push(order(`mid${i}`, "2024-03-01", 300));
    }
    const curve = flagshipWindowCurve(rollUpCustomers(rows), asOf)!;
    const d30 = curve.points.find((p) => p.days === 30)!;
    const d90 = curve.points.find((p) => p.days === 90)!;
    // Blended 30 mixes $150 old + $300 mid. 90-day lift must not subtract that mix.
    expect(d30.revenue).toBeCloseTo((10 * 150 + 10 * 300) / 20, 5);
    expect(d90.revenue).toBeCloseTo(150, 5);
    expect(windowAddedAfterPrior(curve.points, 30)).toBeNull();
    expect(windowAddedAfterPrior(curve.points, 90)).toEqual({
      added: 0,
      afterDays: 30,
    });
    expect(d90.added).toBe(0);
  });

  it("leaves the year lift null when the year window is unsealed", () => {
    const youngAsOf = new Date("2024-02-15");
    const curve = flagshipWindowCurve(rollUpCustomers(maturedBook()), youngAsOf)!;
    expect(windowAddedAfterPrior(curve.points, 365)).toBeNull();
    expect(curve.points.find((p) => p.days === 365)?.added).toBeNull();
  });

  it("dashes later columns on a young first-order month", () => {
    const asOfNow = new Date("2024-08-01");
    const rows = flagshipMonthRows(
      rollUpCustomers([
        ...Array.from({ length: 8 }, (_, i) =>
          order(`old${i}`, "2024-01-10", 80),
        ),
        ...Array.from({ length: 8 }, (_, i) =>
          order(`new${i}`, "2024-07-20", 80),
        ),
      ]),
      asOfNow,
    );
    const oldRow = rows.find((r) => r.cohortMonth === "2024-01")!;
    const newRow = rows.find((r) => r.cohortMonth === "2024-07")!;
    expect(oldRow.rev30).not.toBeNull();
    expect(oldRow.rev90).not.toBeNull();
    expect(newRow.rev30).toBeNull();
    expect(newRow.retain90).toBeNull();
    expect(newRow.rev365).toBeNull();
  });
});

describe("thin-shop empty state", () => {
  it("is syncing when no identified buyers are on file", () => {
    const empty = flagshipEmptyState(null, 0)!;
    expect(empty.kind).toBe("syncing");
    expect(empty.copy).toContain("not $0");
    expect(empty.verb).toBe("Refresh this page");
  });

  it("is thin when fewer than eight buyers have landed", () => {
    const empty = flagshipEmptyState(null, 3)!;
    expect(empty.kind).toBe("thin");
    expect(empty.need).toBe(8);
    expect(empty.copy).toContain("3 identified buyers");
    expect(empty.verb).toBe("Watch first 30 days");
  });

  it("is young when buyers exist but no window has sealed", () => {
    const empty = flagshipEmptyState(null, 12)!;
    expect(empty.kind).toBe("young");
    expect(empty.copy).toContain("lived 30 days");
    expect(empty.verb).toBe("Wait for day 30");
  });

  it("stays null once a window curve is on file", () => {
    const customers = rollUpCustomers(maturedBook());
    const curve = flagshipWindowCurve(customers, new Date("2025-01-01"));
    expect(flagshipEmptyState(curve, customers.length)).toBeNull();
  });
});

describe("today’s LTV read", () => {
  it("prefers first 90 days and writes first vs later from the same buyers", () => {
    const asOf = new Date("2024-06-01");
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 10; i += 1) {
      rows.push(order(`c${i}`, "2024-01-01", 100));
      if (i < 5) rows.push(order(`c${i}`, "2024-02-01", 50));
    }
    const customers = rollUpCustomers(rows);
    const daily = flagshipDailyRead(
      flagshipWindowCurve(customers, asOf),
      predictiveLtv(customers, asOf),
    )!;
    expect(daily.worthDays).toBe(90);
    expect(daily.worth).toBeCloseTo(125, 5);
    expect(daily.firstOrder).toBe(100);
    expect(daily.laterInWindow).toBeCloseTo(25, 5);
    expect(daily.estimate).toBeCloseTo(125, 5);
    expect(daily.observed).toBeCloseTo(125, 5);
    expect(daily.yearPending).toBe(true);
  });

  it("falls back to first 30 days when 90 is not on file", () => {
    const youngAsOf = new Date("2024-02-15");
    const customers = rollUpCustomers(maturedBook());
    const daily = flagshipDailyRead(
      flagshipWindowCurve(customers, youngAsOf),
      predictiveLtv(customers, youngAsOf),
    )!;
    expect(daily.worthDays).toBe(30);
    expect(daily.estimate).toBeNull();
    expect(daily.firstOrder).toBeNull();
    expect(daily.yearPending).toBe(true);
  });
});

describe("transparent predictive LTV", () => {
  it("is first order + extra orders × later order among 90-day mature buyers", () => {
    const asOf = new Date("2024-06-01");
    const rows: DepthOrder[] = [];
    // 10 buyers, first $100 on 2024-01-01. Half come back once (+$50) inside 90d.
    for (let i = 0; i < 10; i += 1) {
      rows.push(order(`c${i}`, "2024-01-01", 100));
      if (i < 5) rows.push(order(`c${i}`, "2024-02-01", 50));
    }
    const pred = predictiveLtv(rollUpCustomers(rows), asOf)!;
    expect(pred).not.toBeNull();
    expect(pred.firstOrder90).toBe(100);
    expect(pred.extraOrders90).toBeCloseTo(0.5, 5);
    expect(pred.laterOrder90).toBeCloseTo(50, 5);
    expect(pred.predicted90).toBeCloseTo(125, 5);
    expect(pred.observed90).toBeCloseTo(125, 5);
    expect(pred.formula90).toContain("average first order");
    expect(pred.formula90).toContain("100.00 + 0.50 × 50.00 = 125.00");
    // No buyer has a full year.
    expect(pred.predicted365).toBeNull();
    expect(pred.formula365).toBeNull();
  });

  it("does not invent a first-year estimate without matured year buyers", () => {
    const asOf = new Date("2024-03-01");
    const rows = Array.from({ length: 10 }, (_, i) =>
      order(`c${i}`, "2024-01-01", 80),
    );
    const pred = predictiveLtv(rollUpCustomers(rows), asOf);
    expect(pred?.predicted365 ?? null).toBeNull();
  });

  it("stays null when too few buyers have lived 90 days", () => {
    const asOf = new Date("2024-02-01");
    const rows = Array.from({ length: 3 }, (_, i) =>
      order(`c${i}`, "2024-01-01", 80),
    );
    expect(predictiveLtv(rollUpCustomers(rows), asOf)).toBeNull();
  });
});

describe("refund honesty (never invent)", () => {
  it("breaks out refunds only when a known gross sits above net", () => {
    const orders = [
      order("a", "2024-01-01", 80, { grossAmount: 100 }),
      order("b", "2024-01-02", 50, { grossAmount: 50 }),
    ];
    const honesty = refundHonesty(orders, { sample: true });
    expect(honesty.brokenOut).toBe(true);
    expect(honesty.refundedDollars).toBe(20);
    expect(honesty.netDollars).toBe(130);
    expect(honesty.refundShare).toBeCloseTo(20 / 150, 5);
    expect(honesty.refundedOrderCount).toBe(1);
    expect(honesty.basis).toBe("sample_gross_known");
  });

  it("does not invent a refund total when gross is missing (live)", () => {
    const orders = [
      order("a", "2024-01-01", 80),
      order("b", "2024-01-02", 0),
    ];
    const honesty = refundHonesty(orders, { sample: false });
    expect(honesty.brokenOut).toBe(false);
    expect(honesty.refundedDollars).toBeNull();
    expect(honesty.refundShare).toBeNull();
    expect(honesty.netDollars).toBe(80);
    expect(honesty.basis).toBe("shopify_current_total");
  });
});

describe("path LTV clarity", () => {
  it("names the highest-LTV journey and its lift vs the shop", () => {
    const asOf = new Date("2025-01-01");
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 6; i += 1) {
      rows.push(order(`g${i}`, "2024-01-10", 90, { product: "Goggles" }));
      rows.push(order(`g${i}`, "2024-02-10", 300, { product: "Board" }));
    }
    for (let i = 0; i < 6; i += 1) {
      rows.push(order(`w${i}`, "2024-01-10", 20, { product: "Wax" }));
      rows.push(order(`w${i}`, "2024-02-10", 20, { product: "Wax" }));
    }
    const view = buildLtvFlagship(rows, asOf, { sample: true });
    const clarity = pathClarity(view.paths, rollUpCustomers(rows))!;
    expect(clarity.bestLifetime.first).toBe("Goggles");
    expect(clarity.bestLifetime.second).toBe("Board");
    expect(clarity.lift).toBeGreaterThan(1);
    expect(clarity.sameProductShare).toBeCloseTo(0.5, 5);
  });
});

describe("Product→LTV rides the same flagship book", () => {
  it("keeps live untitled orders as an honest titles empty, not a guessed catalog", () => {
    const asOf = new Date("2025-01-01");
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 12; i += 1) {
      rows.push(order(`c${i}`, "2024-01-01", 80));
      if (i < 6) rows.push(order(`c${i}`, "2024-02-01", 40));
    }
    const view = buildLtvFlagship(rows, asOf, { sample: false });
    expect(view.windows).not.toBeNull();
    expect(view.productLtv.productsKnown).toBe(false);
    expect(view.productLtv.rows).toEqual([]);
    expect(view.productLtv.empty?.kind).toBe("titles");
    expect(view.productLtv.empty?.copy).toContain("Not $0");
    expect(view.promoLtv.discountsKnown).toBe(false);
    expect(view.promoLtv.codesKnown).toBe(false);
    expect(view.promoLtv.rows).toEqual([]);
    expect(view.promoLtv.empty?.kind).toBe("discounts");
    expect(view.promoLtv.empty?.copy).toContain("Not $0");
  });
});

describe("SAMPLE Snowdevil flagship is dense", () => {
  const NOW = new Date("2026-09-17T00:00:00Z");
  const view = buildLtvFlagship(generateSnowdevilDepthOrders(NOW), NOW, {
    sample: true,
  });

  it("fills 30/90/365 windows, the written-out estimate, refunds, and path lift", () => {
    expect(view.windows).not.toBeNull();
    expect(view.windows!.points).toHaveLength(3);
    expect(view.windows!.points.every((p) => p.revenue != null)).toBe(true);
    expect(view.windows!.points.every((p) => p.retention != null)).toBe(true);
    expect(view.monthWindows.length).toBeGreaterThanOrEqual(10);
    expect(view.predictive).not.toBeNull();
    expect(view.predictive!.predicted90).toBeGreaterThan(300);
    expect(view.predictive!.predicted365).toBeGreaterThan(600);
    expect(view.predictive!.formula90).toContain("average first order");
    expect(view.refunds.brokenOut).toBe(true);
    expect(view.refunds.refundedDollars).toBeGreaterThan(0);
    expect(view.pathClarity).toBeNull();
    expect(view.whales!.ltvMultiple).toBeGreaterThan(1);
    const daily = flagshipDailyRead(view.windows, view.predictive)!;
    expect(daily.worthDays).toBe(90);
    expect(daily.laterInWindow).toBeGreaterThan(0);
    expect(daily.yearPending).toBe(false);
    expect(windowAddedAfterPrior(view.windows!.points, 90)?.added).toBeGreaterThan(
      0,
    );
    expect(windowAddedAfterPrior(view.windows!.points, 365)?.added).toBeGreaterThan(
      0,
    );
    expect(view.productLtv.productsKnown).toBe(false);
    expect(view.productLtv.rows).toEqual([]);
    expect(view.productLtv.best).toBeNull();
    expect(view.productLtv.read).toBeNull();
    expect(view.productLtv.empty?.kind).toBe("titles");
    expect(view.promoLtv.empty).toBeNull();
    expect(view.promoLtv.best).not.toBeNull();
    expect(view.promoLtv.codesKnown).toBe(true);
    expect(view.promoLtv.best!.day90Ltv).toBeGreaterThan(0);
    expect(view.promoLtv.best!.day365Ltv).toBeGreaterThan(0);
    expect(view.promoLtv.best!.formula90).toContain("average first order");
    expect(view.promoLtv.read?.worthDays).toBe(90);
  });

  it("keeps the young first-order month from sealing a fake year", () => {
    const newest = view.monthWindows[view.monthWindows.length - 1]!;
    expect(newest.rev365).toBeNull();
    expect(newest.retain365).toBeNull();
    expect(newest.n365).toBe(0);
  });

  it("paints a 30/90/365 triangle and leaves the young corner blank", () => {
    const triangle = firstOrderWindowTriangle(view.monthWindows, view.buyers);
    expect(triangle.kind).toBe("ready");
    expect(triangle.rows.length).toBeGreaterThanOrEqual(10);
    const oldest = triangle.rows[0]!;
    expect(oldest.cells.map((cell) => cell.header)).toEqual([
      "30 days",
      "90 days",
      "First year",
    ]);
    expect(oldest.cells.every((cell) => cell.retention != null)).toBe(true);
    expect(oldest.cells.every((cell) => cell.revenue != null && cell.revenue > 0)).toBe(
      true,
    );
    const moved = triangle.rows.some((row) =>
      row.cells.some(
        (cell) =>
          cell.revenue != null &&
          cell.grossRevenue != null &&
          cell.grossRevenue > cell.revenue,
      ),
    );
    expect(moved).toBe(true);
    const newest = triangle.rows[triangle.rows.length - 1]!;
    const year = newest.cells.find((cell) => cell.days === 365)!;
    expect(year.retention).toBeNull();
    expect(year.revenue).toBeNull();
    expect(year.grossRevenue).toBeNull();
    const sealedYear = triangle.rows.some((row) =>
      row.cells.some((cell) => cell.days === 365 && cell.revenue != null),
    );
    expect(sealedYear).toBe(true);
  });
});

describe("first-order window triangle", () => {
  it("stays blank until eight buyers in that month have lived the window", () => {
    const asOf = new Date("2024-08-01");
    const thin = flagshipMonthRows(
      rollUpCustomers([
        ...Array.from({ length: 7 }, (_, i) => order(`t${i}`, "2024-01-10", 80)),
        ...Array.from({ length: 7 }, (_, i) => order(`u${i}`, "2024-03-10", 80)),
      ]),
      asOf,
    );
    expect(thin[0]!.n30).toBe(7);
    expect(thin[0]!.retain30).not.toBeNull();
    const hidden = firstOrderWindowTriangle(thin, 14);
    expect(hidden.kind).toBe("young");
    expect(hidden.rows[0]!.cells.every((cell) => cell.retention == null)).toBe(
      true,
    );
    expect(hidden.rows[0]!.cells.every((cell) => cell.revenue == null)).toBe(true);

    const enough = flagshipMonthRows(
      rollUpCustomers([
        ...Array.from({ length: 8 }, (_, i) => order(`a${i}`, "2024-01-10", 80)),
        ...Array.from({ length: 8 }, (_, i) => order(`b${i}`, "2024-03-10", 90)),
      ]),
      asOf,
    );
    const painted = firstOrderWindowTriangle(enough, 16);
    expect(painted.kind).toBe("ready");
    expect(painted.rows[0]!.cells.find((cell) => cell.days === 30)?.revenue).toBe(80);
    expect(painted.rows[1]!.cells.find((cell) => cell.days === 365)?.revenue).toBeNull();
  });

  it("names syncing, one-month, and too-young books without a fake zero", () => {
    const syncing = firstOrderWindowTriangle([], 0);
    expect(syncing.kind).toBe("syncing");
    expect(syncing.copy).toContain("not $0");
    expect(syncing.verb).toBe("Refresh this page");

    const oneMonth = flagshipMonthRows(
      rollUpCustomers(
        Array.from({ length: 8 }, (_, i) => order(`o${i}`, "2024-01-10", 40)),
      ),
      new Date("2024-08-01"),
    );
    const thin = firstOrderWindowTriangle(oneMonth, 8);
    expect(thin.kind).toBe("thin");
    expect(thin.copy).toContain("two first-order months");
    expect(thin.copy).toContain("not 0%");

    const young = flagshipMonthRows(
      rollUpCustomers([
        ...Array.from({ length: 8 }, (_, i) => order(`y${i}`, "2024-07-20", 40)),
        ...Array.from({ length: 8 }, (_, i) => order(`z${i}`, "2024-08-02", 40)),
      ]),
      new Date("2024-08-10"),
    );
    const waiting = firstOrderWindowTriangle(young, 16);
    expect(waiting.kind).toBe("young");
    expect(waiting.copy).toContain("not $0");
    expect(waiting.rows.every((row) => row.cells.every((cell) => cell.n === 0))).toBe(
      true,
    );
  });
});

describe("refund-adjusted cohort LTV vs gross orders", () => {
  const asOf = new Date("2024-08-01T00:00:00.000Z");

  function refundedBook(): DepthOrder[] {
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 8; i += 1) {
      // $20 refund on the first order, inside 30 and 90.
      rows.push(order(`a${i}`, "2024-01-10", 80, { grossAmount: 100 }));
      // Refunded later order sits inside the year, outside 90 days.
      rows.push(order(`a${i}`, "2024-07-28", 0, { grossAmount: 40 }));
    }
    for (let i = 0; i < 8; i += 1) {
      // No gross on file — Gross orders must stay blank, not a copied net.
      rows.push(order(`b${i}`, "2024-03-10", 90));
    }
    return rows;
  }

  it("moves sealed LTV when a refund lands inside the cohort window", () => {
    expect(DEFAULT_COHORT_REVENUE_BASIS).toBe("includes_refunds");
    expect(cohortRevenueBasisLabel("includes_refunds")).toBe("Includes refunds");
    expect(cohortRevenueBasisLabel("gross_orders")).toBe("Gross orders");
    expect(cohortRevenueFormula("includes_refunds")).toBe(
      "order revenue − refunds attributed to cohort window",
    );

    const rows = flagshipMonthRows(rollUpCustomers(refundedBook()), asOf);
    const january = rows.find((row) => row.cohortMonth === "2024-01")!;
    const march = rows.find((row) => row.cohortMonth === "2024-03")!;
    expect(january.rev30).toBe(80);
    expect(january.grossRev30).toBe(100);
    expect(january.rev90).toBe(80);
    expect(january.grossRev90).toBe(100);
    // The July refund is outside 90 days, so 30/90 do not move for it.
    expect(january.rev365).toBeNull();
    expect(january.grossRev365).toBeNull();
    expect(march.rev30).toBe(90);
    expect(march.grossRev30).toBeNull();

    const triangle = firstOrderWindowTriangle(rows, 16);
    expect(triangle.kind).toBe("ready");
    const janCells = triangle.rows.find((row) => row.monthKey === "2024-01")!;
    const day30 = janCells.cells.find((cell) => cell.days === 30)!;
    const year = janCells.cells.find((cell) => cell.days === 365)!;
    expect(cohortCellRevenue(day30, "includes_refunds")).toBe(80);
    expect(cohortCellRevenue(day30, "gross_orders")).toBe(100);
    expect(day30.revenue).toBeLessThan(day30.grossRevenue!);
    expect(cohortCellRevenue(year, "includes_refunds")).toBeNull();
    expect(cohortCellRevenue(year, "gross_orders")).toBeNull();

    const marchCells = triangle.rows.find((row) => row.monthKey === "2024-03")!;
    const march30 = marchCells.cells.find((cell) => cell.days === 30)!;
    expect(cohortCellRevenue(march30, "includes_refunds")).toBe(90);
    expect(cohortCellRevenue(march30, "gross_orders")).toBeNull();
    expect(march30.retention).not.toBeNull();
  });

  it("keeps a sealed full refund at $0 and an unlived year as a blank", () => {
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 8; i += 1) {
      rows.push(order(`f${i}`, "2024-01-10", 0, { grossAmount: 120 }));
      rows.push(order(`g${i}`, "2024-03-10", 40, { grossAmount: 40 }));
    }
    const triangle = firstOrderWindowTriangle(
      flagshipMonthRows(rollUpCustomers(rows), asOf),
      16,
    );
    const january = triangle.rows.find((row) => row.monthKey === "2024-01")!;
    const day30 = january.cells.find((cell) => cell.days === 30)!;
    const year = january.cells.find((cell) => cell.days === 365)!;
    expect(cohortCellRevenue(day30, "includes_refunds")).toBe(0);
    expect(cohortCellRevenue(day30, "gross_orders")).toBe(120);
    expect(year.revenue).toBeNull();
    expect(year.grossRevenue).toBeNull();
    expect(year.retention).toBeNull();
  });
});
