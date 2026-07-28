import { describe, expect, it } from "vitest";
import {
  buildBillDailyLongCsv,
  buildBillDailyWideCsv,
  distributeDailyAmounts,
  firstOfCurrentMonth,
  inclusiveDayCount,
  periodEndDate,
  planBillDaily,
} from "./spend-billing";
import { parseSpendCsv, aggregateSpendRows } from "./spend-csv";

describe("periodEndDate", () => {
  it("calendar month from the 1st ends on the last day of that month", () => {
    expect(periodEndDate("2026-07-01", "month", "calendar")).toBe("2026-07-31");
    expect(periodEndDate("2026-02-01", "month", "calendar")).toBe("2026-02-28");
    expect(periodEndDate("2024-02-01", "month", "calendar")).toBe("2024-02-29");
  });

  it("calendar quarter and year span the right end dates", () => {
    expect(periodEndDate("2026-07-01", "quarter", "calendar")).toBe("2026-09-30");
    expect(periodEndDate("2026-01-01", "year", "calendar")).toBe("2026-12-31");
  });

  it("fixed basis uses 30 / 90 / 365 inclusive days", () => {
    expect(periodEndDate("2026-07-01", "month", "fixed")).toBe("2026-07-30");
    expect(periodEndDate("2026-07-01", "quarter", "fixed")).toBe("2026-09-28");
    expect(periodEndDate("2026-01-01", "year", "fixed")).toBe("2026-12-31");
  });
});

describe("inclusiveDayCount", () => {
  it("counts inclusive calendar days", () => {
    expect(inclusiveDayCount("2026-07-01", "2026-07-31")).toBe(31);
    expect(inclusiveDayCount("2026-07-01", "2026-07-01")).toBe(1);
  });
});

describe("distributeDailyAmounts", () => {
  it("sums exactly to the cent-rounded total", () => {
    const amounts = distributeDailyAmounts(100, 3);
    expect(amounts).toEqual([33.33, 33.33, 33.34]);
    expect(amounts.reduce((s, a) => s + a, 0)).toBeCloseTo(100, 10);
  });

  it("handles even splits", () => {
    expect(distributeDailyAmounts(90, 30)).toEqual(Array(30).fill(3));
  });
});

describe("planBillDaily", () => {
  it("rejects non-positive amounts", () => {
    const result = planBillDaily({
      amount: 0,
      cadence: "month",
      dayBasis: "calendar",
      startDate: "2026-07-01",
      channel: "email",
    });
    expect(result.ok).toBe(false);
  });

  it("calendar month: daily rate × N days covers the invoice", () => {
    const result = planBillDaily({
      amount: 310,
      cadence: "month",
      dayBasis: "calendar",
      startDate: "2026-07-01",
      channel: "email",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.dayCount).toBe(31);
    expect(result.plan.dailyRate).toBe(10);
    expect(result.plan.endDate).toBe("2026-07-31");
    expect(result.plan.days).toHaveLength(31);
    expect(result.plan.days[0]).toEqual({ date: "2026-07-01", amount: 10 });
    expect(result.plan.days[30].date).toBe("2026-07-31");
    expect(result.plan.totalAllocated).toBe(310);
  });

  it("fixed 30-day month spreads evenly", () => {
    const result = planBillDaily({
      amount: 300,
      cadence: "month",
      dayBasis: "fixed",
      startDate: "2026-07-01",
      channel: "affiliate",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.dayCount).toBe(30);
    expect(result.plan.endDate).toBe("2026-07-30");
    expect(result.plan.dailyRate).toBe(10);
    expect(result.plan.days.every((d) => d.amount === 10)).toBe(true);
  });

  it("defaults channel labels stay on engine buckets", () => {
    const result = planBillDaily({
      amount: 90,
      cadence: "month",
      dayBasis: "fixed",
      startDate: "2026-07-01",
      channel: "other",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.plan.channel).toBe("other");
  });
});

describe("bill daily CSV", () => {
  it("wide CSV parses back into the bill channel only", () => {
    const planned = planBillDaily({
      amount: 31,
      cadence: "month",
      dayBasis: "calendar",
      startDate: "2026-07-01",
      channel: "email",
    });
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;

    const csv = buildBillDailyWideCsv(planned.plan);
    const parsed = parseSpendCsv(csv);
    expect(parsed.errors).toEqual([]);
    const aggregated = aggregateSpendRows(parsed.rows);
    expect(aggregated.every((r) => r.channel === "email")).toBe(true);
    expect(aggregated).toHaveLength(31);
    const total = aggregated.reduce((s, r) => s + r.amount, 0);
    expect(total).toBeCloseTo(31, 2);
  });

  it("long CSV is importable", () => {
    const planned = planBillDaily({
      amount: 30,
      cadence: "month",
      dayBasis: "fixed",
      startDate: "2026-07-01",
      channel: "affiliate",
    });
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;

    const csv = buildBillDailyLongCsv(planned.plan);
    const parsed = parseSpendCsv(csv);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(30);
    expect(parsed.rows[0].channel).toBe("affiliate");
  });
});

describe("firstOfCurrentMonth", () => {
  it("returns YYYY-MM-01 for the given local date", () => {
    expect(firstOfCurrentMonth(new Date(2026, 6, 26))).toBe("2026-07-01");
  });
});
