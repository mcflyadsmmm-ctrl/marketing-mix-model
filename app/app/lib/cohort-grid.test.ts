import { describe, expect, it } from "vitest";
import { buildCohortGrid } from "./cohort-grid";

describe("cohort grid", () => {
  it("starts at the first order, blanks empty months, and applies a dated refund once", () => {
    const grid = buildCohortGrid(
      [
        {
          customerKey: "a",
          day: "2026-01-05",
          net: 100,
          refund: { day: "2026-03-10", amount: 40 },
        },
        { customerKey: "a", day: "2026-03-20", net: 10 },
        { customerKey: "b", day: "2026-02-02", net: 50 },
        { customerKey: "guest", day: "2026-01-08", net: 999 },
      ],
      "2026-03-31",
    );
    expect(grid.months).toEqual(["2026-01", "2026-02", "2026-03"]);
    const january = grid.rows.find((row) => row.cohort === "2026-01");
    expect(january?.cells).toEqual([100, null, 70]);
    expect(january?.repeatRate).toBe(1);
    expect(january?.customers).toBe(1);
    const february = grid.rows.find((row) => row.cohort === "2026-02");
    expect(february?.cells).toEqual([null, 50, null]);
    expect(february?.repeatRate).toBe(0);
    expect(grid.rows.every((row) => row.cells.length === grid.months.length)).toBe(true);
  });

  it("reports days between orders and leaves a missing net blank", () => {
    const grid = buildCohortGrid(
      [
        { customerKey: "a", day: "2026-01-01", net: 10 },
        { customerKey: "a", day: "2026-01-11", net: 10 },
        { customerKey: "c", day: "2026-01-04", net: null },
      ],
      "2026-01-31",
    );
    const row = grid.rows[0];
    expect(row?.medianDaysBetween).toBe(10);
    expect(row?.cells[0]).toBeNull();
    expect(row?.repeatRate).toBe(0.5);
  });
});
