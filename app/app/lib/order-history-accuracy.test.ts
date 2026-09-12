import { describe, expect, it } from "vitest";
import {
  assessOrderHistoryAccuracy,
  orderHistoryAccuracyNeedsRefresh,
} from "./order-history-accuracy";

describe("assessOrderHistoryAccuracy", () => {
  it("marks complete when every closed day is sealed", () => {
    const snap = assessOrderHistoryAccuracy({
      expectedClosedDayKeys: ["2026-09-01", "2026-09-02"],
      sealedDayKeys: ["2026-09-02", "2026-09-01"],
      openDayKey: "2026-09-03",
    });
    expect(snap.status).toBe("complete");
    expect(snap.missingDayKeys).toEqual([]);
  });

  it("lists unsealed closed days as catching_up", () => {
    const snap = assessOrderHistoryAccuracy({
      expectedClosedDayKeys: ["2026-09-01", "2026-09-02", "2026-09-03"],
      sealedDayKeys: ["2026-09-01"],
      openDayKey: "2026-09-04",
    });
    expect(snap.status).toBe("catching_up");
    expect(snap.missingDayKeys).toEqual(["2026-09-02", "2026-09-03"]);
    expect(snap.detail).toMatch(/not a final customer picture/);
  });

  it("flags partial_history when the period exceeds the crawl window", () => {
    const snap = assessOrderHistoryAccuracy({
      expectedClosedDayKeys: ["2022-01-01"],
      sealedDayKeys: ["2022-01-01"],
      periodExceedsFactWindow: true,
    });
    expect(snap.status).toBe("partial_history");
  });
});

describe("orderHistoryAccuracyNeedsRefresh", () => {
  it("refreshes while catching up", () => {
    const snap = assessOrderHistoryAccuracy({
      expectedClosedDayKeys: ["2026-09-01", "2026-09-02"],
      sealedDayKeys: ["2026-09-01"],
    });
    expect(orderHistoryAccuracyNeedsRefresh(snap)).toBe(true);
  });
});
