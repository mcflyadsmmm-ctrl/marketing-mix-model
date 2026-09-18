import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  chartBarLayout,
  chartBarPlotClassName,
  chartBarRadius,
  chartBarShellClassName,
  chartBarWidth,
  chartPairInnerGap,
  chartXAxisMaxLabels,
} from "./chart-bar";

const here = dirname(fileURLToPath(import.meta.url));

describe("chart bar layout", () => {
  it("packs dense day series instead of painting hairline needles", () => {
    const band90 = 658 / 90;
    const dense = chartBarWidth(band90, 90);
    expect(dense).toBeGreaterThan(band90 * 0.65);
    expect(dense).toBeLessThan(band90);
    expect(dense).toBeGreaterThan(4);
  });

  it("lets sparse columns breathe instead of filling the slot", () => {
    const band7 = 658 / 7;
    const wide = chartBarWidth(band7, 7);
    expect(wide).toBeLessThan(band7 * 0.64);
    expect(wide).toBeGreaterThan(band7 * 0.4);
  });

  it("keeps 30-day day bars near the previous mid-weight fill", () => {
    const band30 = 658 / 30;
    const mid = chartBarWidth(band30, 30);
    expect(mid).toBeGreaterThan(band30 * 0.55);
    expect(mid).toBeLessThan(band30 * 0.7);
  });

  it("rounds corners down as bars thin", () => {
    expect(chartBarRadius(2)).toBe(0.6);
    expect(chartBarRadius(5)).toBe(1.2);
    expect(chartBarRadius(10)).toBe(2);
    expect(chartBarRadius(20)).toBe(2.6);
    expect(chartBarRadius(0)).toBe(0);
  });

  it("leaves a hairline gap between YoY pair bars", () => {
    expect(chartPairInnerGap(20)).toBe(1.2);
    expect(chartPairInnerGap(10)).toBe(0.6);
    const layout = chartBarLayout({
      plotLeft: 50,
      plotWidth: 660,
      count: 12,
      kind: "pair",
    });
    expect(layout.pairBarW * 2 + layout.pairGap).toBeCloseTo(layout.pairW, 5);
    expect(layout.pairX(0)).toBeCloseTo(50 + (layout.band - layout.pairW) / 2, 5);
    expect(layout.centerX(0)).toBeCloseTo(50 + layout.band / 2, 5);
  });

  it("thins x-axis labels as the series densifies", () => {
    expect(chartXAxisMaxLabels(7)).toBe(7);
    expect(chartXAxisMaxLabels(12)).toBe(8);
    expect(chartXAxisMaxLabels(30)).toBe(7);
    expect(chartXAxisMaxLabels(90)).toBe(6);
  });

  it("marks the plot hot only while a pointer is in the series", () => {
    expect(chartBarPlotClassName(false)).toBe("mcfly-chart__plot");
    expect(chartBarPlotClassName(true, "mcfly-cust-mix__ghost")).toBe(
      "mcfly-chart__plot mcfly-chart__plot--hot mcfly-cust-mix__ghost",
    );
    expect(chartBarShellClassName("mcfly-chart mcfly-chart--weekdays", true)).toBe(
      "mcfly-chart mcfly-chart--weekdays mcfly-chart--hot",
    );
  });
});

describe("desk bar charts share the layout helper", () => {
  const files = [
    "../components/OverviewSalesChart.tsx",
    "../components/CpaExplorer.tsx",
    "../components/CustomerMixChart.tsx",
    "../components/GrowthComebackChart.tsx",
    "../components/YoyYearChart.tsx",
    "../components/OrdersIntelligence.tsx",
    "../components/SpendExplorer.tsx",
  ];

  it("imports chartBarLayout or chartBarWidth on every SVG bar series", () => {
    for (const file of files) {
      const source = readFileSync(join(here, file), "utf8");
      expect(source).toMatch(/chartBarLayout|chartBarWidth/);
    }
  });

  it("does not keep the old hairline min-width on explorers", () => {
    for (const file of files) {
      const source = readFileSync(join(here, file), "utf8");
      expect(source).not.toMatch(/Math\.max\(1\.2,\s*band \* 0\.6\)/);
    }
  });

  it("dims idle bars and transitions fill while a plot is hot", () => {
    const css = readFileSync(join(here, "../styles/mcfly-desk.css"), "utf8");
    expect(css).toContain("mcfly-chart__plot--hot");
    expect(css).toContain("mcfly-chart__bar--dim");
    expect(css).toMatch(/\.mcfly-chart__bar \{[\s\S]*?transition:/);
    expect(css).toContain("mcfly-chart--hot");
  });
});
