import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DeskCurrencyContext } from "./desk-currency";
import { OverviewSalesChart } from "../components/OverviewSalesChart";
import {
  overviewAov,
  overviewBucketize,
  overviewChartAxis,
  overviewChartDayLabel,
  overviewChartLabelIndices,
  overviewChartVsCopy,
  overviewCompactMoney,
  overviewCumulative,
  overviewDaySpan,
  overviewDeltaCopy,
  overviewDeltaPct,
  overviewFilterRange,
  overviewIsoWeekStartKey,
  overviewIsWeekendKey,
  overviewLatestDayKey,
  overviewMedian,
  overviewPresetRange,
  overviewPriorWindow,
  overviewShiftDayKey,
  overviewVsTypical,
  overviewVsTypicalPctCopy,
} from "./overview-sales-chart";

const here = dirname(fileURLToPath(import.meta.url));

function daySeries(start: string, count: number, sales: number, orders?: number) {
  return Array.from({ length: count }, (_, i) => ({
    dateKey: overviewShiftDayKey(start, i),
    sales,
    ...(orders != null ? { orders } : {}),
  }));
}

describe("overview sales chart labels + buckets", () => {
  it("paints human day/week/month/quarter labels, never a raw dump", () => {
    expect(overviewChartDayLabel("2026-09-16")).toBe("Sep 16");
    expect(overviewChartDayLabel("2026-01-01")).toBe("Jan 1");
    expect(overviewChartDayLabel("W:2026-09-14")).toBe("Wk of Sep 14");
    expect(overviewChartDayLabel("M:2026-09")).toBe("Sep '26");
    expect(overviewChartDayLabel("Q:2026-3")).toBe("Q3 '26");
    expect(overviewChartDayLabel("2026-W37")).toBe("W37");
    expect(overviewChartDayLabel("nope")).toBe("nope");
  });

  it("buckets a day into its ISO-week Monday and flags weekends", () => {
    expect(overviewIsoWeekStartKey("2026-09-16")).toBe("2026-09-14");
    expect(overviewIsoWeekStartKey("2026-09-20")).toBe("2026-09-14");
    expect(overviewIsoWeekStartKey("2026-09-01")).toBe("2026-08-31");
    expect(overviewIsWeekendKey("2026-09-19")).toBe(true);
    expect(overviewIsWeekendKey("2026-09-20")).toBe(true);
    expect(overviewIsWeekendKey("2026-09-16")).toBe(false);
    expect(overviewIsWeekendKey("W:2026-09-14")).toBe(false);
    expect(overviewIsWeekendKey("M:2026-09")).toBe(false);
  });

  it("folds days into week / month / quarter buckets in order", () => {
    const days = daySeries("2026-08-31", 40, 100); // Mon Aug 31 → +39 days
    const day = overviewBucketize(days, "day");
    expect(day).toHaveLength(40);
    expect(day[0]!.key).toBe("2026-08-31");

    const week = overviewBucketize(days, "week");
    expect(week[0]!.key).toBe("W:2026-08-31");
    expect(week[0]!.label).toBe("Wk of Aug 31");
    expect(week[0]!.sales).toBe(700); // 7 days × 100
    expect(week.every((b) => !b.weekend)).toBe(true);

    const month = overviewBucketize(days, "month");
    expect(month.map((b) => b.key)).toEqual(["M:2026-08", "M:2026-09", "M:2026-10"]);

    const quarter = overviewBucketize(days, "quarter");
    expect(quarter.map((b) => b.key)).toEqual(["Q:2026-3", "Q:2026-4"]);
  });

  it("cumulates buckets and takes an honest median", () => {
    expect(overviewCumulative([
      { key: "a", label: "a", sales: 10, orders: 1, weekend: false },
      { key: "b", label: "b", sales: 5, orders: 1, weekend: false },
      { key: "c", label: "c", sales: 20, orders: 1, weekend: false },
    ])).toEqual([10, 15, 35]);
    expect(overviewMedian([4, 1, 3, 2])).toBe(2.5);
    expect(overviewMedian([5, 1, 3])).toBe(3);
    expect(overviewMedian([])).toBeNull();
  });

  it("sums orders per bucket and computes AOV honestly", () => {
    const days = [
      { dateKey: "2026-09-14", sales: 1000, orders: 10 },
      { dateKey: "2026-09-15", sales: 1500, orders: 10 },
      { dateKey: "2026-09-16", sales: 500, orders: 5 },
    ];
    const week = overviewBucketize(days, "week");
    expect(week[0]!.sales).toBe(3000);
    expect(week[0]!.orders).toBe(25);
    expect(overviewAov(3000, 25)).toBe(120);
    expect(overviewAov(1000, 0)).toBeNull();
    expect(overviewAov(1000, -1)).toBeNull();
    // Missing orders default to 0 (sales-only series stays honest).
    expect(overviewBucketize([{ dateKey: "2026-09-16", sales: 500 }], "day")[0]!.orders).toBe(0);
  });

  it("frames an equal-length prior window + honest vs-prior deltas", () => {
    expect(overviewDaySpan("2026-09-01", "2026-09-30")).toBe(30);
    const prior = overviewPriorWindow("2026-09-01", "2026-09-30");
    expect(prior.toKey).toBe("2026-08-31");
    expect(prior.fromKey).toBe("2026-08-02");
    expect(overviewDeltaPct(1160, 1000)).toEqual({ pct: 16, kind: "up" });
    expect(overviewDeltaPct(900, 1000)).toEqual({ pct: -10, kind: "down" });
    expect(overviewDeltaPct(1000, 1000)).toEqual({ pct: 0, kind: "even" });
    expect(overviewDeltaPct(1000, 0)).toBeNull();
    expect(overviewDeltaCopy({ pct: 16, kind: "up" })).toBe("+16% vs prior");
    expect(overviewDeltaCopy({ pct: -10, kind: "down" })).toBe("−10% vs prior");
    expect(overviewDeltaCopy(null)).toBeNull();
  });

  it("compares a bucket to typical without inventing $0", () => {
    expect(overviewVsTypical(5184, 4279)).toEqual({ delta: 905, kind: "up" });
    expect(overviewVsTypical(4000, 4279)).toEqual({ delta: -279, kind: "down" });
    expect(overviewVsTypical(4279, 4279)).toEqual({ delta: 0, kind: "even" });
    expect(overviewVsTypical(5184, null)).toBeNull();
    expect(overviewVsTypical(5184, 0)).toBeNull();
    expect(overviewChartVsCopy({ delta: 905, kind: "up" }, "$905")).toBe(
      "+$905 vs typical",
    );
    expect(overviewChartVsCopy({ delta: 279, kind: "down" }, "$279")).toBe(
      "−$279 vs typical",
    );
    expect(overviewChartVsCopy({ delta: 0, kind: "even" }, "$0")).toBe(
      "even with typical",
    );
  });

  it("speaks the vs-typical gap in whole percent, sales language only", () => {
    expect(overviewVsTypicalPctCopy({ delta: 905, kind: "up" }, 4279)).toBe(
      "21% above typical",
    );
    expect(overviewVsTypicalPctCopy({ delta: -279, kind: "down" }, 4279)).toBe(
      "7% below typical",
    );
    expect(overviewVsTypicalPctCopy({ delta: 0, kind: "even" }, 4279)).toBeNull();
    expect(overviewVsTypicalPctCopy(null, 4279)).toBeNull();
    expect(overviewVsTypicalPctCopy({ delta: 905, kind: "up" }, null)).toBeNull();
  });

  it("builds a nice y-scale + gridline ticks that always cover the data", () => {
    expect(overviewChartAxis(13264, 4)).toEqual({
      max: 15000,
      ticks: [0, 5000, 10000, 15000],
    });
    expect(overviewChartAxis(4310, 4)).toEqual({
      max: 6000,
      ticks: [0, 2000, 4000, 6000],
    });
    expect(overviewChartAxis(0)).toEqual({ max: 1, ticks: [0, 1] });
  });

  it("formats compact axis money and stays honest on bad currency", () => {
    expect(overviewCompactMoney(5000, "USD")).toBe("$5k");
    expect(overviewCompactMoney(15000, "USD")).toBe("$15k");
    expect(overviewCompactMoney(2500, "USD")).toBe("$2.5k");
    expect(overviewCompactMoney(500, "USD")).toBe("$500");
    expect(overviewCompactMoney(0, "USD")).toBe("$0");
    expect(overviewCompactMoney(1500000, "USD")).toBe("$1.5m");
    expect(overviewCompactMoney(5000, "")).toBe("—");
  });

  it("thins x-axis labels so dates never crowd, keeping first + last", () => {
    expect(overviewChartLabelIndices(3, 6)).toEqual([0, 1, 2]);
    expect(overviewChartLabelIndices(17, 6)).toEqual([0, 3, 6, 9, 12, 15, 16]);
    const many = overviewChartLabelIndices(90, 6);
    expect(many[0]).toBe(0);
    expect(many[many.length - 1]).toBe(89);
    expect(many.length).toBeLessThanOrEqual(8);
  });

  it("resolves range presets against the newest day + filters the window", () => {
    const days = daySeries("2026-01-01", 400, 100);
    expect(overviewLatestDayKey(days)).toBe(overviewShiftDayKey("2026-01-01", 399));
    const latest = overviewLatestDayKey(days)!;
    const thirty = overviewPresetRange("30d", days)!;
    expect(thirty.toKey).toBe(latest);
    expect(thirty.fromKey).toBe(overviewShiftDayKey(latest, -29));
    expect(overviewFilterRange(days, thirty.fromKey, thirty.toKey)).toHaveLength(30);
    const ytd = overviewPresetRange("ytd", days)!;
    expect(ytd.fromKey).toBe(`${latest.slice(0, 4)}-01-01`);
    // Preset clamps to the earliest available day.
    const short = daySeries("2026-09-01", 10, 100);
    const year = overviewPresetRange("1y", short)!;
    expect(year.fromKey).toBe("2026-09-01");
  });

  it("Overview chart is a dual-axis sales explorer, never spend", () => {
    const chart = readFileSync(
      join(here, "../components/OverviewSalesChart.tsx"),
      "utf8",
    );
    // Truth: day-vs-typical, typical rail, weekend shade, cumulative sweep.
    expect(chart).toContain("mcfly-chart__typical");
    expect(chart).toContain("mcfly-chart__weekend");
    expect(chart).toContain("mcfly-chart__sales-line");
    expect(chart).toContain("mcfly-chart__sales-fill");
    expect(chart).toContain("overviewChartDayLabel");
    expect(chart).toContain("overviewVsTypical");
    expect(chart).toContain("mcfly-chart__bar--hot");
    expect(chart).toContain("Vs typical");
    // Explorer craft: presets, FROM/TO, grain, dual axis, dark tooltip, cards.
    expect(chart).toContain("mcfly-chart__controls");
    expect(chart).toContain("Sales range");
    expect(chart).toContain("Chart grain");
    expect(chart).toContain('type="date"');
    expect(chart).toContain("mcfly-chart__axis-y2");
    expect(chart).toContain("mcfly-chart__grid");
    expect(chart).toContain("mcfly-chart__tip-foot");
    expect(chart).toContain("mcfly-chart__stats");
    expect(chart).toContain("mcfly-chart__bars");
    expect(chart).toContain("mcfly-chart__legend");
    expect(chart).toContain("mcfly-chart__hero");
    expect(chart).toContain("mcfly-chart__board");
    // Monthly-pacing soft-card language: serif title + muted subtitle.
    expect(chart).toContain("mcfly-chart__serif");
    expect(chart).toContain("mcfly-chart__muted");
    expect(chart).toContain("Tap a bar");
    // Zero spend on Overview — the whole point of this tab.
    expect(chart).not.toContain("mcfly-chart__hint");
    expect(chart).not.toContain("mcfly-chart__spend-line");
    expect(chart).not.toContain("Sales and spend");
    expect(chart).not.toContain("Total ROAS");
    expect(chart).not.toContain("Spend Upload");
  });

  it("renders the sales-order explorer chrome with AOV + vs-prior", () => {
    const days = daySeries("2026-05-01", 130, 4300).map((d, i) => ({
      dateKey: d.dateKey,
      sales: d.sales + (i % 7 === 3 ? 900 : 0) - (i % 7 === 0 ? 800 : 0),
      orders: 40 + (i % 7 === 3 ? 8 : 0),
    }));
    const html = renderToStaticMarkup(
      createElement(
        DeskCurrencyContext.Provider,
        { value: "USD" },
        createElement(OverviewSalesChart, { days, typicalDay: 4300 }),
      ),
    );
    // Explorer controls + dual axis + bars + line + cards render.
    expect(html).toContain("mcfly-chart__controls");
    expect(html).toContain('type="date"');
    expect(html).toContain(">30d<");
    expect(html).toContain(">1y<");
    expect(html).toContain(">Day<");
    expect(html).toContain(">Quarter<");
    expect(html).toContain("mcfly-chart__bar");
    expect(html).toContain("mcfly-chart__sales-line");
    expect(html).toContain("mcfly-chart__axis-y2");
    expect(html).toContain("mcfly-chart__stats");
    // Sales-order depth + honest vs-prior.
    expect(html).toContain(">Orders<");
    expect(html).toContain(">AOV<");
    expect(html).toContain("vs prior");
    expect(html).toContain("vs typical");
    // Still zero spend on Overview once rendered.
    expect(html).not.toContain("Total ROAS");
    expect(html).not.toContain("Spend Upload");
    expect(html).not.toContain("spend-line");
    expect(html).not.toContain("MER");
  });
});
