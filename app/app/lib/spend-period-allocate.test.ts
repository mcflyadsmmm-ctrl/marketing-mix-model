import { describe, expect, it } from "vitest";
import {
  allocateLumpToDays,
  buildLumpSpreadLongCsv,
  currentYearMonth,
  distributeEqualDailyAmounts,
  inclusiveDayCount,
  periodWindow,
  planLumpSpread,
} from "./spend-period-allocate";
import { aggregateSpendRows, parseSpendCsv } from "./spend-csv";

describe("periodWindow", () => {
  it("month: full calendar month from YYYY-MM or YYYY-MM-DD", () => {
    expect(periodWindow("month", "2026-07")).toEqual({
      startDateYmd: "2026-07-01",
      endDateYmd: "2026-07-31",
      dayCount: 31,
    });
    expect(periodWindow("month", "2026-02-15")).toEqual({
      startDateYmd: "2026-02-01",
      endDateYmd: "2026-02-28",
      dayCount: 28,
    });
    expect(periodWindow("month", "2024-02")).toEqual({
      startDateYmd: "2024-02-01",
      endDateYmd: "2024-02-29",
      dayCount: 29,
    });
  });

  it("quarter: calendar Q containing the anchor", () => {
    expect(periodWindow("quarter", "2026-07")).toEqual({
      startDateYmd: "2026-07-01",
      endDateYmd: "2026-09-30",
      dayCount: 92,
    });
    expect(periodWindow("quarter", "2026-01-10")).toEqual({
      startDateYmd: "2026-01-01",
      endDateYmd: "2026-03-31",
      dayCount: 90,
    });
  });

  it("half_year: bi-annual H1 / H2", () => {
    expect(periodWindow("half_year", "2026-03")).toEqual({
      startDateYmd: "2026-01-01",
      endDateYmd: "2026-06-30",
      dayCount: 181,
    });
    expect(periodWindow("half_year", "2026-07-01")).toEqual({
      startDateYmd: "2026-07-01",
      endDateYmd: "2026-12-31",
      dayCount: 184,
    });
  });

  it("year: Jan 1 – Dec 31", () => {
    expect(periodWindow("year", "2026-08")).toEqual({
      startDateYmd: "2026-01-01",
      endDateYmd: "2026-12-31",
      dayCount: 365,
    });
  });

  it("rejects bad anchors", () => {
    expect(periodWindow("month", "not-a-date")).toBeNull();
    expect(periodWindow("month", "2026-13")).toBeNull();
  });
});

describe("inclusiveDayCount", () => {
  it("counts inclusive calendar days", () => {
    expect(inclusiveDayCount("2026-07-01", "2026-07-31")).toBe(31);
    expect(inclusiveDayCount("2026-07-01", "2026-07-01")).toBe(1);
    expect(inclusiveDayCount("2026-07-31", "2026-07-01")).toBeNull();
  });
});

describe("distributeEqualDailyAmounts", () => {
  it("sums exactly; last day absorbs remainder cents", () => {
    const amounts = distributeEqualDailyAmounts(100, 3);
    expect(amounts).toEqual([33.33, 33.33, 33.34]);
    expect(amounts.reduce((s, a) => s + a, 0)).toBeCloseTo(100, 10);
  });

  it("handles even splits", () => {
    expect(distributeEqualDailyAmounts(90, 30)).toEqual(Array(30).fill(3));
  });
});

describe("allocateLumpToDays", () => {
  it("equal split with channel on every row; sum exact", () => {
    const rows = allocateLumpToDays({
      totalAmount: 310,
      startDateYmd: "2026-07-01",
      endDateYmd: "2026-07-31",
      channel: "email",
    });
    expect(rows).toHaveLength(31);
    expect(rows[0]).toEqual({ date: "2026-07-01", channel: "email", amount: 10 });
    expect(rows[30].date).toBe("2026-07-31");
    expect(rows.every((r) => r.channel === "email")).toBe(true);
    const sum = rows.reduce((s, r) => s + r.amount, 0);
    expect(sum).toBeCloseTo(310, 10);
  });

  it("last day absorbs remainder cents", () => {
    const rows = allocateLumpToDays({
      totalAmount: 100,
      startDateYmd: "2026-07-01",
      endDateYmd: "2026-07-03",
      channel: "other",
    });
    expect(rows.map((r) => r.amount)).toEqual([33.33, 33.33, 33.34]);
  });

  it("returns empty for invalid inputs", () => {
    expect(
      allocateLumpToDays({
        totalAmount: 0,
        startDateYmd: "2026-07-01",
        endDateYmd: "2026-07-31",
        channel: "email",
      }),
    ).toEqual([]);
    expect(
      allocateLumpToDays({
        totalAmount: 100,
        startDateYmd: "2026-07-31",
        endDateYmd: "2026-07-01",
        channel: "email",
      }),
    ).toEqual([]);
    expect(
      allocateLumpToDays({
        totalAmount: 100,
        startDateYmd: "2026-07-01",
        endDateYmd: "2026-07-31",
        channel: "",
      }),
    ).toEqual([]);
  });
});

describe("planLumpSpread", () => {
  it("month anchor → preview math", () => {
    const result = planLumpSpread({
      totalAmount: 310,
      periodType: "month",
      anchor: "2026-07",
      channel: "email",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.dayCount).toBe(31);
    expect(result.plan.dailyAmount).toBe(10);
    expect(result.plan.startDateYmd).toBe("2026-07-01");
    expect(result.plan.endDateYmd).toBe("2026-07-31");
    expect(result.plan.totalAllocated).toBe(310);
  });

  it("half_year bi-annual spread", () => {
    const result = planLumpSpread({
      totalAmount: 1800,
      periodType: "half_year",
      anchor: "2026-01",
      channel: "affiliate",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.dayCount).toBe(181);
    expect(result.plan.startDateYmd).toBe("2026-01-01");
    expect(result.plan.endDateYmd).toBe("2026-06-30");
    expect(result.plan.days).toHaveLength(181);
    expect(result.plan.totalAllocated).toBe(1800);
  });

  it("rejects non-positive amounts", () => {
    const result = planLumpSpread({
      totalAmount: 0,
      periodType: "month",
      anchor: "2026-07",
      channel: "email",
    });
    expect(result.ok).toBe(false);
  });
});

describe("buildLumpSpreadLongCsv", () => {
  it("parses back via spend CSV spine", () => {
    const planned = planLumpSpread({
      totalAmount: 31,
      periodType: "month",
      anchor: "2026-07",
      channel: "email",
    });
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;

    const csv = buildLumpSpreadLongCsv(planned.plan);
    const parsed = parseSpendCsv(csv);
    expect(parsed.errors).toEqual([]);
    const aggregated = aggregateSpendRows(parsed.rows);
    expect(aggregated.every((r) => r.channel === "email")).toBe(true);
    expect(aggregated).toHaveLength(31);
    const total = aggregated.reduce((s, r) => s + r.amount, 0);
    expect(total).toBeCloseTo(31, 2);
  });
});

describe("currentYearMonth", () => {
  it("returns YYYY-MM for local date", () => {
    expect(currentYearMonth(new Date(2026, 6, 26))).toBe("2026-07");
  });
});
