import { describe, expect, it } from "vitest";
import {
  applyLiveBuyerIndexToCpaDays,
  applyUniqueBuyerCounts,
  bucketCpaDays,
  buildCpaPaybackView,
  buildCpaWindowSnapshot,
  filterCpaDays,
  hasTypedSpend,
  paintAmer,
  resolveCpaDeskWindows,
  resolveLastNDays,
  typicalCpa,
  type CpaDayPoint,
} from "./cpa-desk";

function day(
  dateKey: string,
  spend: number,
  newCustomers = 0,
  returningCustomers = 0,
  newCustomerSales = 0,
  buyersKnown = true,
): CpaDayPoint {
  return {
    dateKey,
    spend,
    newCustomers,
    returningCustomers,
    newCustomerSales,
    buyersKnown,
  };
}

describe("resolveLastNDays", () => {
  it("covers 28 inclusive shop-local days through today", () => {
    const range = resolveLastNDays(
      28,
      new Date("2026-09-17T18:00:00.000Z"),
      "UTC",
    );
    expect(range.label).toBe("Last 28 days");
    expect(range.start.toISOString().slice(0, 10)).toBe("2026-08-21");
    expect(range.end.toISOString().slice(0, 10)).toBe("2026-09-17");
  });
});

describe("resolveCpaDeskWindows", () => {
  it("pins This month and Last 28, and explorer covers YTD ∪ last 90", () => {
    const windows = resolveCpaDeskWindows(
      new Date("2026-09-17T18:00:00.000Z"),
      "UTC",
    );
    expect(windows.thisMonth.label).toBe("Month to date");
    expect(windows.thisMonth.start.toISOString().slice(0, 10)).toBe("2026-09-01");
    expect(windows.last28.label).toBe("Last 28 days");
    expect(windows.explorer.start.toISOString().slice(0, 10)).toBe("2026-01-01");
    expect(windows.explorer.end.toISOString().slice(0, 10)).toBe("2026-09-17");
  });
});

describe("buildCpaWindowSnapshot", () => {
  const days = [
    day("2026-09-01", 100, 2, 3, 400),
    day("2026-09-02", 50, 1, 1, 120),
    day("2026-08-20", 80, 4, 0, 200),
  ];

  it("computes Cash CPA / CAC from typed spend and identified buyers", () => {
    const snap = buildCpaWindowSnapshot(
      "this_month",
      {
        start: new Date("2026-09-01T00:00:00.000Z"),
        end: new Date("2026-09-17T23:59:59.999Z"),
        label: "Month to date",
      },
      days,
      "UTC",
    );
    expect(snap.label).toBe("This month");
    expect(snap.rangeLabel).toMatch(/Sep/);
    expect(snap.spend).toBe(150);
    expect(snap.identifiedBuyers).toBe(7);
    expect(snap.cashCpa).toBeCloseTo(150 / 7, 5);
    expect(snap.cashCac).toBeCloseTo(150 / 3, 5);
    expect(snap.amer).toBeCloseTo(520 / 150, 5);
  });

  it("returns null costs when spend is missing — never $0", () => {
    const snap = buildCpaWindowSnapshot(
      "last_28",
      {
        start: new Date("2026-09-01T00:00:00.000Z"),
        end: new Date("2026-09-17T23:59:59.999Z"),
        label: "Last 28 days",
      },
      [day("2026-09-01", 0, 4, 2, 300)],
      "UTC",
    );
    expect(snap.spend).toBe(0);
    expect(snap.cashCpa).toBeNull();
    expect(snap.cashCac).toBeNull();
    expect(snap.amer).toBeNull();
  });

  it("returns null Cash CPA when spend exists but buyers are unknown", () => {
    const snap = buildCpaWindowSnapshot(
      "this_month",
      {
        start: new Date("2026-09-01T00:00:00.000Z"),
        end: new Date("2026-09-17T23:59:59.999Z"),
        label: "Month to date",
      },
      [day("2026-09-01", 200, 0, 0, 0, false)],
      "UTC",
    );
    expect(snap.spend).toBe(200);
    expect(snap.buyersKnown).toBe(false);
    expect(snap.cashCpa).toBeNull();
    expect(snap.cashCac).toBeNull();
  });
});

describe("paintAmer / hasTypedSpend", () => {
  it("dashes zero and negative aMER so the desk never paints 0.00×", () => {
    expect(paintAmer(0)).toBeNull();
    expect(paintAmer(-1)).toBeNull();
    expect(paintAmer(null)).toBeNull();
    expect(paintAmer(2.5)).toBe(2.5);
  });

  it("treats any window or day with spend as typed spend", () => {
    expect(hasTypedSpend([day("2026-09-01", 0)])).toBe(false);
    expect(hasTypedSpend([day("2026-09-01", 1)])).toBe(true);
    expect(
      hasTypedSpend([], [
        {
          id: "this_month",
          label: "This month",
          fromKey: "2026-09-01",
          toKey: "2026-09-17",
          rangeLabel: "Sep 1–17",
          spend: 10,
          identifiedBuyers: 0,
          newCustomers: 0,
          returningCustomers: 0,
          newCustomerSales: 0,
          buyersKnown: false,
          cashCpa: null,
          cashCac: null,
          amer: null,
        },
      ]),
    ).toBe(true);
  });
});

describe("applyUniqueBuyerCounts", () => {
  const base = buildCpaWindowSnapshot(
    "this_month",
    {
      start: new Date("2026-09-01T00:00:00.000Z"),
      end: new Date("2026-09-17T23:59:59.999Z"),
      label: "Month to date",
    },
    [day("2026-09-01", 200, 0, 0, 0, false)],
    "UTC",
  );

  it("fills live CPA/CAC from unique OrderFact counts", () => {
    const next = applyUniqueBuyerCounts(base, {
      identified: 8,
      newBuyers: 5,
    });
    expect(next.buyersKnown).toBe(true);
    expect(next.identifiedBuyers).toBe(8);
    expect(next.newCustomers).toBe(5);
    expect(next.cashCpa).toBeCloseTo(25, 5);
    expect(next.cashCac).toBeCloseTo(40, 5);
  });

  it("leaves the snapshot alone when unique counts are not on file", () => {
    expect(
      applyUniqueBuyerCounts(base, { identified: null, newBuyers: null }),
    ).toEqual(base);
  });

  it("keeps Cash CAC — when unique new buyers are unknown", () => {
    const next = applyUniqueBuyerCounts(base, {
      identified: 8,
      newBuyers: null,
    });
    expect(next.identifiedBuyers).toBe(8);
    expect(next.cashCac).toBeNull();
    expect(next.newCustomers).toBe(0);
  });
});

describe("applyLiveBuyerIndexToCpaDays", () => {
  it("uses interned ids when the day is in the book, including known-zero", () => {
    const days: CpaDayPoint[] = [
      day("2026-09-14", 80, 9, 9, 0, false),
      day("2026-09-15", 40, 0, 0, 0, false),
    ];
    const next = applyLiveBuyerIndexToCpaDays(days, {
      identifiedByDay: { "2026-09-14": [1, 2], "2026-09-15": [] },
      newByDay: { "2026-09-14": [1], "2026-09-15": [] },
    });
    expect(next[0]?.buyersKnown).toBe(true);
    expect(next[0]?.newCustomers).toBe(1);
    expect(next[0]?.identifiedIds).toEqual([1, 2]);
    expect(next[1]?.buyersKnown).toBe(true);
    expect(next[1]?.newCustomers).toBe(0);
  });

  it("does not treat a missing key as SalesDayFact zero buyers", () => {
    const next = applyLiveBuyerIndexToCpaDays(
      [day("2026-09-21", 200, 0, 0, 0, false)],
      { identifiedByDay: {}, newByDay: {} },
    );
    expect(next[0]?.buyersKnown).toBe(false);
    expect(next[0]?.newCustomers).toBe(0);
    expect(next[0]?.identifiedIds).toBeUndefined();
  });
});

describe("buildCpaPaybackView", () => {
  it("compares Cash CAC to first-90 LTV and keeps payback only when CAC exists", () => {
    const view = buildCpaPaybackView({
      cashCac: 80,
      avgRevenueD30: 125,
      avgRevenueD90: 380,
      paybackDays: 19,
    });
    expect(view.first90).toBe(380);
    expect(view.valueVsCost).toBeCloseTo(380 / 80, 5);
    expect(view.cacShareOfFirst90).toBeCloseTo(80 / 380, 5);
    expect(view.paybackDays).toBe(19);
  });

  it("stays dashed when spend/CAC is missing — never $0 payback", () => {
    const view = buildCpaPaybackView({
      cashCac: null,
      avgRevenueD30: 125,
      avgRevenueD90: 380,
      paybackDays: 19,
    });
    expect(view.cashCac).toBeNull();
    expect(view.valueVsCost).toBeNull();
    expect(view.paybackDays).toBeNull();
    expect(view.first90).toBe(380);
  });
});

describe("explorer buckets", () => {
  const days = [
    day("2026-09-01", 40, 2, 2),
    day("2026-09-02", 60, 1, 1),
    day("2026-09-08", 20, 4, 0),
  ];

  it("keeps daily Cash CPA null on spend-less buckets", () => {
    const buckets = bucketCpaDays(
      [...days, day("2026-09-03", 0, 3, 1)],
      "day",
    );
    const empty = buckets.find((bucket) => bucket.key === "2026-09-03");
    expect(empty?.cashCpa).toBeNull();
    expect(empty?.spend).toBe(0);
  });

  it("rolls week buckets and reports a typical CPA that is not $0", () => {
    const weeks = bucketCpaDays(days, "week");
    expect(weeks.length).toBe(2);
    expect(weeks[0]?.cashCpa).toBeCloseTo(100 / 6, 5);
    expect(typicalCpa(weeks)).toBeGreaterThan(0);
    expect(filterCpaDays(days, "2026-09-02", "2026-09-08")).toHaveLength(2);
  });

  it("uniques interned buyer ids across a live week grain", () => {
    const live = [
      {
        dateKey: "2026-09-14",
        spend: 50,
        newCustomers: 1,
        returningCustomers: 1,
        newCustomerSales: 0,
        buyersKnown: true,
        identifiedIds: [1, 2],
        newIds: [1],
      },
      {
        dateKey: "2026-09-15",
        spend: 50,
        newCustomers: 1,
        returningCustomers: 1,
        newCustomerSales: 0,
        buyersKnown: true,
        identifiedIds: [2, 3],
        newIds: [3],
      },
    ];
    const weeks = bucketCpaDays(live, "week");
    expect(weeks).toHaveLength(1);
    expect(weeks[0]?.buyers).toBe(3);
    expect(weeks[0]?.newCustomers).toBe(2);
    expect(weeks[0]?.cashCpa).toBeCloseTo(100 / 3, 5);
  });

  it("keeps unknown live week buyers as — and never spend ÷ 0", () => {
    const unknown = [
      day("2026-09-14", 80, 0, 0, 0, false),
      day("2026-09-15", 40, 0, 0, 0, false),
    ];
    const weeks = bucketCpaDays(unknown, "week");
    expect(weeks[0]?.buyers).toBeNull();
    expect(weeks[0]?.cashCpa).toBeNull();
  });
});
