import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  cancelChartFrame,
  chartIndexFromClientX,
  chartIndexFromPlotFraction,
  chartIndexFromViewX,
  chartSeriesId,
  chartTipClassName,
  clientPointToViewBox,
  clampChartIndex,
  explorerHoverFromViewPoint,
  holdChartValue,
  isChartAbortError,
  isChartRequestAborted,
  throwIfChartRequestAborted,
} from "./chart-smooth";
import { paintExplorerControls } from "./spend-explorer";

const here = dirname(fileURLToPath(import.meta.url));

describe("chart smoothness helpers", () => {
  it("clamps hover indexes and builds a stable series id", () => {
    expect(clampChartIndex(null, 4)).toBeNull();
    expect(clampChartIndex(2, 0)).toBeNull();
    expect(clampChartIndex(-3, 5)).toBe(0);
    expect(clampChartIndex(9, 5)).toBe(4);
    expect(clampChartIndex(1.8, 5)).toBe(1);
    expect(chartSeriesId(["30d", "day", "a", "b"])).toBe("30d|day|a|b");
    expect(chartSeriesId(["x", null, undefined, 2])).toBe("x|||2");
  });

  it("holds the previous series while a navigation is loading", () => {
    expect(holdChartValue("next", "prev", true)).toBe("prev");
    expect(holdChartValue("next", "prev", false)).toBe("next");
    expect(holdChartValue("next", null, true)).toBe("next");
  });

  it("hit-tests buckets from pointer x without leaving gaps", () => {
    expect(chartIndexFromClientX(10, 0, 100, 4)).toBe(0);
    expect(chartIndexFromClientX(49, 0, 100, 4)).toBe(1);
    expect(chartIndexFromClientX(99, 0, 100, 4)).toBe(3);
    expect(chartIndexFromClientX(-1, 0, 100, 4)).toBeNull();
    expect(chartIndexFromClientX(101, 0, 100, 4)).toBeNull();
    expect(
      chartIndexFromViewX(60, 0, 200, { viewWidth: 100, plotLeft: 10, plotWidth: 80 }, 4),
    ).toBe(1);
    expect(chartIndexFromPlotFraction(25, 0, 100, 5)).toBe(1);
  });

  it("maps a client point into the SVG viewBox", () => {
    expect(
      clientPointToViewBox(50, 25, { left: 0, top: 0, width: 100, height: 50 }, 200, 100),
    ).toEqual({ x: 100, y: 50 });
    expect(
      clientPointToViewPointSafe(),
    ).toBeNull();
  });

  it("picks stacked segments and nearby ROAS dots from a view point", () => {
    const buckets = [
      {
        key: "d1",
        bars: [
          { channel: "meta", amount: 40 },
          { channel: "google", amount: 60 },
        ],
      },
      { key: "d2", bars: [{ channel: "meta", amount: 10 }] },
    ];
    const merPoints = [
      { key: "d1", x: 30, y: 20 },
      { key: "d2", x: 70, y: 40 },
    ];
    expect(
      explorerHoverFromViewPoint({
        viewX: 30,
        viewY: 90,
        padL: 10,
        padR: 10,
        padT: 10,
        plotH: 80,
        viewW: 100,
        buckets,
        leftCeil: 100,
        merPoints,
        salesLead: false,
      }),
    ).toEqual({ kind: "seg", bucketKey: "d1", channel: "meta" });
    expect(
      explorerHoverFromViewPoint({
        viewX: 30,
        viewY: 20,
        padL: 10,
        padR: 10,
        padT: 10,
        plotH: 80,
        viewW: 100,
        buckets,
        leftCeil: 100,
        merPoints,
        salesLead: false,
      }),
    ).toEqual({ kind: "dot", bucketKey: "d1" });
  });

  it("rethrows abort and never treats abort as a finished empty book", () => {
    const controller = new AbortController();
    expect(isChartRequestAborted(controller.signal)).toBe(false);
    controller.abort();
    expect(isChartRequestAborted(controller.signal)).toBe(true);
    expect(() => throwIfChartRequestAborted(controller.signal)).toThrowError(
      /aborted/i,
    );
    expect(isChartAbortError(new DOMException("Chart request aborted", "AbortError"))).toBe(
      true,
    );
    expect(isChartAbortError(new Error("nope"))).toBe(false);
  });

  it("cancels a scheduled frame handle without throwing", () => {
    expect(cancelChartFrame(null)).toBeNull();
    expect(cancelChartFrame(1)).toBeNull();
  });

  it("keeps tooltip class mounted and marks it on", () => {
    expect(chartTipClassName({ open: false, edge: "mid" })).toBe(
      "mcfly-chart__tip mcfly-chart__tip--mid",
    );
    expect(chartTipClassName({ open: true, edge: "left", below: true })).toBe(
      "mcfly-chart__tip mcfly-chart__tip--left mcfly-chart__tip--below mcfly-chart__tip--on",
    );
  });

  it("paints pending explorer controls from the in-flight search", () => {
    const current = {
      range: "14d" as const,
      granularity: "Day" as const,
      mode: "stacked" as const,
      showSales: false,
    };
    expect(
      paintExplorerControls(current, null, "paid_full"),
    ).toEqual(current);
    expect(
      paintExplorerControls(current, "?period=mtd", "paid_full"),
    ).toEqual(current);
    expect(
      paintExplorerControls(
        current,
        "?exRange=30d&exGran=Week&exMode=total&exSales=1",
        "paid_full",
      ),
    ).toEqual({
      range: "30d",
      granularity: "Week",
      mode: "total",
      showSales: true,
    });
  });
});

describe("desk explorers wire the smoothness layer", () => {
  const files = [
    "../components/OverviewSalesChart.tsx",
    "../components/CpaExplorer.tsx",
    "../components/CustomerMixChart.tsx",
    "../components/GrowthComebackChart.tsx",
    "../components/YoyYearChart.tsx",
    "../components/LtvBuildCurves.tsx",
    "../components/OrdersTimingChart.tsx",
    "../components/OrdersIntelligence.tsx",
    "../components/SpendExplorer.tsx",
    "../components/WeekdaySalesChart.tsx",
    "../components/OrdersFrequencyChart.tsx",
    "../components/CustomerCharts.tsx",
  ];

  it("imports useChartHover or held-series helpers on every desk explorer", () => {
    for (const file of files) {
      const source = readFileSync(join(here, file), "utf8");
      expect(source).toMatch(/useChartHover|useHeldChartSeries|chartTipClassName/);
      expect(source).toContain("onPointerLeave");
    }
  });

  it("does not fade explorers or charts while a period refresh is in flight", () => {
    const css = readFileSync(join(here, "../styles/mcfly-desk.css"), "utf8");
    expect(css).toContain(".mcfly-desk--loading .mcfly-explorer,");
    expect(css).toContain(".mcfly-desk--loading .mcfly-chart {");
    expect(css).toMatch(/\.mcfly-desk--loading \.mcfly-chart \{\s*opacity:\s*1;/);
    expect(css).toContain("mcfly-chart__tip--on");
    expect(css).toContain("left var(--mcfly-motion");
  });

  it("cancels aborted desk sales instead of returning an empty book", () => {
    const sales = readFileSync(join(here, "./sales-facts.server.ts"), "utf8");
    expect(sales).toContain("throwIfChartRequestAborted");
    expect(sales).toContain("isChartAbortError");
    expect(sales).toContain("signal");
  });
});

function clientPointToViewPointSafe() {
  return clientPointToViewBox(0, 0, { left: 0, top: 0, width: 0, height: 10 }, 100, 100);
}
