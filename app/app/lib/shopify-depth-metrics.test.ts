import { describe, expect, it } from "vitest";
import {
  SHOPIFY_DEPTH_CATALOG,
  depthFeaturesForTab,
} from "./shopify-depth-catalog";
import {
  buildDepthChartPlaceholdersForTab,
  buildDepthChartsForTab,
  depthCatalogCount,
  type DayFactInput,
  type OrderFactInput,
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

function sampleOrders(): OrderFactInput[] {
  const orders: OrderFactInput[] = [];
  for (let i = 0; i < 20; i += 1) {
    const day = String((i % 14) + 1).padStart(2, "0");
    orders.push({
      buyerKey: `buyer-${i % 8}`,
      orderAt: new Date(`2026-03-${day}T${10 + (i % 8)}:00:00Z`),
      netSales: 40 + i * 5,
      hasCustomer: i % 3 !== 0,
      lifetimeOrderRank: Math.floor(i / 8) + 1,
    });
  }
  return orders;
}

describe("buildDepthChartsForTab", () => {
  it("covers every catalog feature with a chart shell (47)", () => {
    expect(depthCatalogCount()).toBe(47);
    expect(SHOPIFY_DEPTH_CATALOG.map((f) => f.id).length).toBe(47);

    const dayFacts = sampleDayFacts();
    const prior = dayFacts.map((d) => ({ ...d, sales: d.sales * 0.9 }));
    const orderFacts = sampleOrders();

    for (const tab of ["sales", "customers", "goals"] as const) {
      const expectedIds = depthFeaturesForTab(tab).map((f) => f.id);
      const charts = buildDepthChartsForTab({
        tab,
        dayFacts,
        priorDayFacts: prior,
        baselineDayFacts: prior,
        orderFacts,
        goals:
          tab === "goals"
            ? {
                year: 2026,
                periods: [
                  {
                    key: "mtd",
                    label: "MTD",
                    actual: 1200,
                    goal: 2000,
                    progressPct: 60,
                    paceLabel: "Behind",
                  },
                  {
                    key: "qtd",
                    label: "QTD",
                    actual: 5000,
                    goal: 6000,
                    progressPct: 83,
                    paceLabel: "On track",
                  },
                  {
                    key: "ytd",
                    label: "YTD",
                    actual: 18000,
                    goal: 24000,
                    progressPct: 75,
                    paceLabel: "Behind",
                  },
                ],
                months: Array.from({ length: 12 }, (_, i) => ({
                  month: i + 1,
                  label: `M${i + 1}`,
                  actual: 1000 + i * 10,
                  goal: 2000,
                  prior: 1500,
                })),
                priorYearTotal: 18000,
                yoyGrow10Total: 19800,
              }
            : null,
      });
      expect(charts.map((c) => c.id).sort()).toEqual([...expectedIds].sort());
      for (const chart of charts) {
        expect(chart.title).toBeTruthy();
        expect(chart.chart).toBeTruthy();
        expect(chart.emptyReason).not.toBe("Chart not wired yet.");
      }
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

  it("goals charts use snapshot KPIs / board / YoY callout", () => {
    const charts = buildDepthChartsForTab({
      tab: "goals",
      dayFacts: [],
      goals: {
        year: 2026,
        periods: [
          {
            key: "mtd",
            label: "MTD",
            actual: 1000,
            goal: 2000,
            progressPct: 50,
            paceLabel: "Behind",
          },
        ],
        months: [
          {
            month: 1,
            label: "Jan",
            actual: 1000,
            goal: 2000,
            prior: 1500,
          },
        ],
        priorYearTotal: 1500,
        yoyGrow10Total: 1650,
      },
    });
    const pace = charts.find((c) => c.id === "sales_goal_mtd");
    const board = charts.find((c) => c.id === "sales_goal_board");
    const yoy = charts.find((c) => c.id === "yoy_grow");
    expect(pace?.emptyReason).toBeUndefined();
    expect(pace?.kpis?.[0]?.value).toContain("50%");
    expect(board?.rows?.length).toBe(1);
    expect(yoy?.callout).toMatch(/10%/);
  });

  it("line-item sales charts stay as honest empty shells", () => {
    const charts = buildDepthChartsForTab({
      tab: "sales",
      dayFacts: sampleDayFacts(),
      orderFacts: sampleOrders(),
    });
    for (const id of [
      "discount_dependency",
      "shipping_share",
      "tax_duty_share",
      "units_per_order",
    ]) {
      const chart = charts.find((c) => c.id === id);
      expect(chart?.emptyReason).toMatch(/line ingest/i);
    }
  });
});


describe("progressive depth paint", () => {
  it("fast phase skips order_facts; slow phase is only order_facts", () => {
    const dayFacts = sampleDayFacts();
    const orderFacts = sampleOrders();
    const fast = buildDepthChartsForTab(
      { tab: "sales", dayFacts, orderFacts },
      "fast",
    );
    const slow = buildDepthChartsForTab(
      { tab: "sales", dayFacts, orderFacts },
      "slow",
    );
    const placeholders = buildDepthChartPlaceholdersForTab("sales");
    expect(fast.length).toBeGreaterThan(0);
    expect(slow.length).toBeGreaterThan(0);
    expect(fast.every((c) => !placeholders.some((p) => p.id === c.id))).toBe(
      true,
    );
    expect(slow.map((c) => c.id).sort()).toEqual(
      placeholders.map((p) => p.id).sort(),
    );
    expect(placeholders.every((p) => p.emptyReason?.includes("Loading"))).toBe(
      true,
    );
  });
});


describe("day accuracy honesty in charts", () => {
  it("day_board shows Missing — not $0 — for absent closed days", () => {
    const charts = buildDepthChartsForTab({
      tab: "sales",
      dayFacts: sampleDayFacts().slice(0, 2),
      missingDayKeys: ["2026-03-03", "2026-03-04"],
    });
    const board = charts.find((c) => c.id === "day_board");
    expect(board?.emptyReason).toBeUndefined();
    const missingRow = board?.rows?.find((r) => r.cells[0] === "2026-03-03");
    expect(missingRow?.cells.join(" ")).toMatch(/Missing fact/i);
    expect(missingRow?.cells.join(" ")).not.toMatch(/^\$0$/);
  });

  it("closed_day_honesty counts missing closed days", () => {
    const charts = buildDepthChartsForTab({
      tab: "sales",
      dayFacts: sampleDayFacts().slice(0, 2),
      missingDayKeys: ["2026-03-10"],
    });
    const honesty = charts.find((c) => c.id === "closed_day_honesty");
    const missingKpi = honesty?.kpis?.find((k) =>
      /missing/i.test(k.label),
    );
    expect(missingKpi?.value).toBe("1");
  });

  it("concentration_trend compares current vs prior whale share", () => {
    const mk = (scale: number) =>
      Array.from({ length: 20 }, (_, i) => ({
        buyerKey: `buyer-${i}`,
        orderAt: new Date(`2026-03-${String((i % 14) + 1).padStart(2, "0")}T12:00:00Z`),
        netSales: (20 - i) * 10 * scale,
        hasCustomer: true,
      }));
    const charts = buildDepthChartsForTab({
      tab: "customers",
      dayFacts: sampleDayFacts(),
      orderFacts: mk(1),
      priorOrderFacts: mk(0.5),
    });
    const trend = charts.find((c) => c.id === "concentration_trend");
    expect(trend?.emptyReason).toBeUndefined();
    expect(trend?.kpis?.length).toBeGreaterThanOrEqual(2);
  });
});


describe("partial day coverage honesty", () => {
  it("strongest_softest_day notes missing closed days", () => {
    const charts = buildDepthChartsForTab({
      tab: "sales",
      dayFacts: sampleDayFacts().slice(0, 5),
      missingDayKeys: ["2026-03-10", "2026-03-11"],
    });
    const chart = charts.find((c) => c.id === "strongest_softest_day");
    expect(chart?.callout).toMatch(/still filling/i);
  });

  it("pace_vs_prior notes missing closed days", () => {
    const dayFacts = sampleDayFacts();
    const charts = buildDepthChartsForTab({
      tab: "sales",
      dayFacts,
      priorDayFacts: dayFacts.map((d) => ({ ...d, sales: d.sales * 0.9 })),
      missingDayKeys: ["2026-03-12"],
    });
    const chart = charts.find((c) => c.id === "pace_vs_prior");
    expect(chart?.callout).toMatch(/partial|still filling/i);
  });
});
