import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  overviewChartDayLabel,
  overviewVsTypical,
} from "./overview-sales-chart";

const here = dirname(fileURLToPath(import.meta.url));

describe("overview sales chart labels", () => {
  it("paints human days and ISO weeks, never a raw dump as the only label", () => {
    expect(overviewChartDayLabel("2026-09-16")).toBe("Sep 16");
    expect(overviewChartDayLabel("2026-01-01")).toBe("Jan 1");
    expect(overviewChartDayLabel("2026-W37")).toBe("W37");
    expect(overviewChartDayLabel("nope")).toBe("nope");
  });

  it("compares a day to typical without inventing $0", () => {
    expect(overviewVsTypical(5184, 4279)).toEqual({
      delta: 905,
      kind: "up",
    });
    expect(overviewVsTypical(4000, 4279)).toEqual({
      delta: -279,
      kind: "down",
    });
    expect(overviewVsTypical(4279, 4279)).toEqual({
      delta: 0,
      kind: "even",
    });
    expect(overviewVsTypical(5184, null)).toBeNull();
    expect(overviewVsTypical(5184, 0)).toBeNull();
  });

  it("Overview chart draws a typical line and never a spend overlay", () => {
    const chart = readFileSync(
      join(here, "../components/OverviewSalesChart.tsx"),
      "utf8",
    );
    expect(chart).toContain("mcfly-chart__typical");
    expect(chart).toContain("overviewChartDayLabel");
    expect(chart).toContain("overviewVsTypical");
    expect(chart).toContain("mcfly-chart__bar--hot");
    expect(chart).toContain("vs typical");
    expect(chart).toContain("Tap a bar");
    expect(chart).not.toContain("mcfly-chart__hint");
    expect(chart).not.toContain("mcfly-chart__spend-line");
    expect(chart).not.toContain("Sales and spend");
  });
});
