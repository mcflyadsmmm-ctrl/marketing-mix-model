import { describe, expect, it } from "vitest";
import {
  assessSalesDayReconcile,
  salesAmountsMatch,
  salesDayProbeMatches,
  selectSalesDayReconcileTargets,
} from "./sales-day-reconcile";

describe("salesAmountsMatch", () => {
  it("tolerates sub-cent float noise", () => {
    expect(salesAmountsMatch(100, 100.01)).toBe(true);
    expect(salesAmountsMatch(100, 100.5)).toBe(false);
  });

  it("allows tiny relative drift on large days", () => {
    expect(salesAmountsMatch(10_000, 10_015)).toBe(true); // 0.15% < 0.2%
    expect(salesAmountsMatch(10_000, 10_050)).toBe(false);
  });
});

describe("salesDayProbeMatches", () => {
  it("requires matching order counts exactly", () => {
    expect(
      salesDayProbeMatches(
        { dayKey: "2026-09-10", sales: 100, orderCount: 2 },
        { dayKey: "2026-09-10", sales: 100, orderCount: 3 },
      ),
    ).toBe(false);
  });
});

describe("selectSalesDayReconcileTargets", () => {
  it("picks newest closed present days and skips the open day", () => {
    const keys = selectSalesDayReconcileTargets({
      expectedClosedDayKeys: [
        "2026-09-08",
        "2026-09-09",
        "2026-09-10",
        "2026-09-11",
      ],
      presentDayKeys: ["2026-09-08", "2026-09-10", "2026-09-11"],
      openDayKey: "2026-09-12",
      limit: 2,
    });
    expect(keys).toEqual(["2026-09-11", "2026-09-10"]);
  });

  it("returns empty when no present closed days yet", () => {
    expect(
      selectSalesDayReconcileTargets({
        expectedClosedDayKeys: ["2026-09-10"],
        presentDayKeys: [],
        openDayKey: "2026-09-11",
      }),
    ).toEqual([]);
  });
});

describe("assessSalesDayReconcile", () => {
  it("reports matched when live Admin equals stored facts", () => {
    const result = assessSalesDayReconcile({
      facts: [
        { dayKey: "2026-09-10", sales: 200, orderCount: 4 },
        { dayKey: "2026-09-11", sales: 150, orderCount: 3 },
      ],
      live: [
        { dayKey: "2026-09-10", sales: 200, orderCount: 4 },
        { dayKey: "2026-09-11", sales: 150.01, orderCount: 3 },
      ],
    });
    expect(result.status).toBe("matched");
    expect(result.mismatches).toHaveLength(0);
    expect(result.headline).toBeNull();
  });

  it("flags sales drift and names the days", () => {
    const result = assessSalesDayReconcile({
      facts: [{ dayKey: "2026-09-10", sales: 200, orderCount: 4 }],
      live: [{ dayKey: "2026-09-10", sales: 250, orderCount: 4 }],
    });
    expect(result.status).toBe("mismatch");
    expect(result.mismatches[0]?.salesDelta).toBe(50);
    expect(result.headline).toMatch(/disagree/i);
    expect(result.detail).toMatch(/2026-09-10/);
  });
});
