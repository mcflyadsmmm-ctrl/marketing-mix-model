import { describe, expect, it } from "vitest";
import {
  assessSalesDayAccuracy,
  excludeOpenDayFacts,
  salesDayAccuracyNeedsRefresh,
} from "./sales-day-accuracy";

describe("assessSalesDayAccuracy", () => {
  it("marks complete when every closed day is present", () => {
    const snap = assessSalesDayAccuracy({
      expectedClosedDayKeys: ["2026-09-01", "2026-09-02"],
      presentDayKeys: ["2026-09-02", "2026-09-01"],
      openDayKey: "2026-09-03",
      freshestAsOf: new Date("2026-09-03T12:00:00Z"),
    });
    expect(snap.status).toBe("complete");
    expect(snap.missingDayKeys).toEqual([]);
    expect(snap.headline).toMatch(/2 closed day/);
  });

  it("lists missing closed days as catching_up — never treats holes as present", () => {
    const snap = assessSalesDayAccuracy({
      expectedClosedDayKeys: ["2026-09-01", "2026-09-02", "2026-09-03"],
      presentDayKeys: ["2026-09-01"],
      openDayKey: "2026-09-04",
    });
    expect(snap.status).toBe("catching_up");
    expect(snap.missingDayKeys).toEqual(["2026-09-02", "2026-09-03"]);
    expect(snap.detail).toMatch(/not treated as \$0/);
  });

  it("flags partial_history when the period exceeds the fact window", () => {
    const snap = assessSalesDayAccuracy({
      expectedClosedDayKeys: ["2022-01-01"],
      presentDayKeys: ["2022-01-01"],
      periodExceedsFactWindow: true,
    });
    expect(snap.status).toBe("partial_history");
  });
});

describe("salesDayAccuracyNeedsRefresh", () => {
  it("refreshes while catching up", () => {
    const snap = assessSalesDayAccuracy({
      expectedClosedDayKeys: ["2026-09-01", "2026-09-02"],
      presentDayKeys: ["2026-09-01"],
    });
    expect(salesDayAccuracyNeedsRefresh(snap)).toBe(true);
  });

  it("refreshes stale complete snapshots (>6h)", () => {
    const snap = assessSalesDayAccuracy({
      expectedClosedDayKeys: ["2026-09-01"],
      presentDayKeys: ["2026-09-01"],
      freshestAsOf: new Date(Date.now() - 7 * 60 * 60 * 1000),
    });
    expect(salesDayAccuracyNeedsRefresh(snap)).toBe(true);
  });
});

describe("excludeOpenDayFacts", () => {
  it("drops the open shop-local day from aggregates", () => {
    const facts = [
      { dayKey: "2026-09-10", sales: 100 },
      { dayKey: "2026-09-11", sales: 50 },
      { dayKey: "2026-09-12", sales: 999 },
    ];
    const closed = excludeOpenDayFacts(facts, "2026-09-12");
    expect(closed.map((d) => d.dayKey)).toEqual([
      "2026-09-10",
      "2026-09-11",
    ]);
    expect(closed.reduce((s, d) => s + d.sales, 0)).toBe(150);
  });

  it("returns all facts when no open day is set", () => {
    const facts = [{ dayKey: "2026-09-10", sales: 10 }];
    expect(excludeOpenDayFacts(facts, null)).toHaveLength(1);
    expect(excludeOpenDayFacts(facts, undefined)).toHaveLength(1);
  });
});
