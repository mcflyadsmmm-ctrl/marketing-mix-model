import { describe, expect, it } from "vitest";
import { depthFeaturesForTab } from "./shopify-depth-catalog";
import {
  buildDepthChartsForTab,
  depthCatalogCount,
  type DayFactInput,
} from "./shopify-depth-metrics";

function sampleDayFacts(): DayFactInput[] {
  const facts: DayFactInput[] = [];
  for (let i = 1; i <= 14; i += 1) {
    const day = String(i).padStart(2, "0");
    const dow = new Date(`2026-03-${day}T12:00:00Z`).getUTCDay();
    const isWeekend = dow === 0 || dow === 6;
    facts.push({
      dayKey: `2026-03-${day}`,
      sales: isWeekend ? 400 : 200,
      orderCount: isWeekend ? 8 : 4,
      newCustomerSales: isWeekend ? 120 : 60,
      returningCustomerSales: isWeekend ? 280 : 140,
    });
  }
  return facts;
}

describe("buildDepthChartsForTab", () => {
  it("covers every catalog feature with a chart shell", () => {
    expect(depthCatalogCount()).toBe(47);
    const salesIds = depthFeaturesForTab("sales").map((f) => f.id);
    const charts = buildDepthChartsForTab({
      tab: "sales",
      dayFacts: sampleDayFacts(),
      priorDayFacts: sampleDayFacts().map((d) => ({
        ...d,
        sales: d.sales * 0.9,
      })),
      orderFacts: [],
    });
    expect(charts.map((c) => c.id).sort()).toEqual([...salesIds].sort());
    for (const chart of charts) {
      expect(chart.title).toBeTruthy();
      expect(chart.chart).toBeTruthy();
    }
  });

  it("weekday_rhythm and weekend_vs_weekday read Mon–Sun mix", () => {
    const charts = buildDepthChartsForTab({
      tab: "sales",
      dayFacts: sampleDayFacts(),
    });
    const rhythm = charts.find((c) => c.id === "weekday_rhythm");
    const weekend = charts.find((c) => c.id === "weekend_vs_weekday");
    expect(rhythm?.emptyReason).toBeUndefined();
    expect(rhythm?.bars?.length).toBe(7);
    expect(weekend?.emptyReason).toBeUndefined();
    const weekendBar = weekend?.bars?.find((b) => b.id === "weekend");
    const weekdayBar = weekend?.bars?.find((b) => b.id === "weekday");
    expect(weekendBar!.share + weekdayBar!.share).toBeCloseTo(1, 5);
    expect(weekendBar!.value).toBeGreaterThan(0);
    expect(weekdayBar!.value).toBeGreaterThan(0);
  });

  it("aov_mean uses period sales ÷ orders", () => {
    const dayFacts = sampleDayFacts();
    const charts = buildDepthChartsForTab({ tab: "sales", dayFacts });
    const aov = charts.find((c) => c.id === "aov_mean");
    const totalSales = dayFacts.reduce((s, d) => s + d.sales, 0);
    const orders = dayFacts.reduce((s, d) => s + d.orderCount, 0);
    const expected = totalSales / orders;
    expect(aov?.emptyReason).toBeUndefined();
    expect(aov?.kpis?.[0]?.label).toBe("AOV");
    const parsed = Number.parseFloat(
      (aov?.kpis?.[0]?.value ?? "").replace(/[^0-9.-]/g, ""),
    );
    expect(parsed).toBeCloseTo(expected, 0);
  });
});
