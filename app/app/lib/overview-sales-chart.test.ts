import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DeskCurrencyContext } from "./desk-currency";
import { formatCurrency } from "./mer-format";
import {
  OVERVIEW_MIX_FORMULA_EQ,
  overviewMonthClock,
} from "./overview-mix-forecast";
import {
  OVERVIEW_PERIOD_TOTAL_LABEL,
  OVERVIEW_PERIOD_TOTAL_SENTENCE,
} from "./overview-first-viewport";
import { OverviewFirstViewport } from "../components/OverviewFirstViewport";
import { OverviewSalesChart } from "../components/OverviewSalesChart";
import {
  overviewAov,
  overviewBucketize,
  overviewChartAxis,
  overviewChartDayLabel,
  overviewCalendarDateLastYear,
  overviewChartLabelIndices,
  overviewChartVsCopy,
  overviewClockSentence,
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
  overviewSameDatesLastYear,
  overviewSameDatesSales,
  overviewSameDatesSentence,
  overviewShiftDayKey,
  overviewThroughClock,
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
    expect(html).toContain("mcfly-chart__hero");
  });
});

const money = (amount: number) => formatCurrency(amount, "USD");

function atUtc(iso: string): Date {
  return new Date(iso);
}

describe("same dates last year", () => {
  it("compares a custom launch week to those calendar dates, not the span before", () => {
    const same = overviewSameDatesLastYear("2026-09-08", "2026-09-14");
    expect(same).toMatchObject({
      fromKey: "2025-09-08",
      toKey: "2025-09-14",
    });
    expect(same?.dateKeys).toEqual([
      "2025-09-08",
      "2025-09-09",
      "2025-09-10",
      "2025-09-11",
      "2025-09-12",
      "2025-09-13",
      "2025-09-14",
    ]);
    const prior = overviewPriorWindow("2026-09-08", "2026-09-14");
    expect(prior.fromKey).toBe("2026-09-01");
    expect(prior.toKey).toBe("2026-09-07");
    expect(prior.fromKey).not.toBe("2025-09-08");
  });

  it("keeps a missing day inside the prior window off file, never $0", () => {
    const days = [
      "2025-09-08",
      "2025-09-09",
      "2025-09-10",
      "2025-09-12",
      "2025-09-13",
      "2025-09-14",
    ].map((dateKey) => ({ dateKey, sales: 100 }));
    expect(overviewSameDatesSales(days, "2026-09-08", "2026-09-14")).toBeNull();
    const sentence = overviewSameDatesSentence({
      fromKey: "2026-09-08",
      toKey: "2026-09-14",
      sales: 1200,
      priorSales: null,
      money,
    });
    expect(sentence).toBe(
      "Shopify Total Sales for Sep 8–14, 2026 versus those dates last year is — not on file.",
    );
    expect(sentence).not.toMatch(/\$0/);
    expect(sentence).not.toMatch(/0%/);
  });

  it("sums a real zero when every prior day is on file and the stored sales are zero", () => {
    const days = overviewSameDatesLastYear("2026-09-08", "2026-09-14")!.dateKeys.map(
      (dateKey) => ({ dateKey, sales: 0 }),
    );
    expect(overviewSameDatesSales(days, "2026-09-08", "2026-09-14")).toBe(0);
  });

  it("does not treat Feb 29 as Feb 28", () => {
    expect(overviewCalendarDateLastYear("2024-02-29")).toBeNull();
    expect(overviewSameDatesLastYear("2024-02-29", "2024-02-29")).toBeNull();
    expect(overviewSameDatesLastYear("2024-02-28", "2024-03-01")).toBeNull();
    expect(overviewSameDatesSales([], "2024-02-28", "2024-03-01")).toBeNull();
    const leapPrior = overviewSameDatesLastYear("2025-02-28", "2025-03-01");
    expect(leapPrior?.dateKeys).toEqual(["2024-02-28", "2024-03-01"]);
    expect(
      overviewSameDatesSales(
        [
          { dateKey: "2024-02-28", sales: 10 },
          { dateKey: "2024-03-01", sales: 20 },
        ],
        "2025-02-28",
        "2025-03-01",
      ),
    ).toBe(30);
  });

  it("paints the launch week versus those dates", () => {
    const priorKeys = overviewSameDatesLastYear("2026-09-08", "2026-09-14")!.dateKeys;
    const days = priorKeys.map((dateKey) => ({ dateKey, sales: 1000 }));
    const priorSales = overviewSameDatesSales(days, "2026-09-08", "2026-09-14");
    expect(priorSales).toBe(7000);
    expect(
      overviewSameDatesSentence({
        fromKey: "2026-09-08",
        toKey: "2026-09-14",
        sales: 8400,
        priorSales,
        money,
      }),
    ).toBe(
      "Shopify Total Sales for Sep 8–14, 2026 is $8,400 versus $7,000 those dates last year (+20%).",
    );
  });
});

describe("through this clock", () => {
  const now = atUtc("2026-09-19T14:55:00.000Z");
  const todayKey = "2026-09-19";
  const priorKey = overviewShiftDayKey(todayKey, -364);

  function order(day: string, hour: number, minute: number, amount: number) {
    return {
      orderedAt: atUtc(
        `${day}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`,
      ),
      amount,
    };
  }

  it("includes 14:50 and excludes 15:10 and last year's 21:00", () => {
    const compare = overviewThroughClock({
      now,
      timeZone: "UTC",
      pending: false,
      todayOrders: [
        order(todayKey, 14, 50, 400),
        order(todayKey, 15, 10, 900),
      ],
      priorOrders: [
        order(priorKey, 14, 50, 250),
        order(priorKey, 21, 0, 5000),
      ],
    });
    expect(compare.todayKey).toBe(todayKey);
    expect(compare.priorKey).toBe(priorKey);
    expect(compare.clockLabel).toBe("2:55 pm");
    expect(compare.todaySales).toBe(400);
    expect(compare.priorSales).toBe(250);
    expect(compare.priorSales).not.toBe(5250);
    expect(overviewClockSentence(compare, money)).toBe(
      "Shopify Total Sales through 2:55 pm is $400 versus $250 the same weekday last year (+60%).",
    );
  });

  it("stays not on file when that weekday's orders are missing, even if a day total exists", () => {
    const compare = overviewThroughClock({
      now,
      timeZone: "UTC",
      pending: false,
      todayOrders: [order(todayKey, 14, 50, 400)],
      priorOrders: null,
    });
    expect(compare.priorSales).toBeNull();
    const sentence = overviewClockSentence(compare, money);
    expect(sentence).toBe(
      "Shopify Total Sales through 2:55 pm is $400, and the same weekday last year is — not on file.",
    );
    expect(sentence).not.toMatch(/\$0/);
    expect(sentence).not.toMatch(/0%/);
  });

  it("allows a real zero only when today's orders are on file and none fall through the clock", () => {
    const compare = overviewThroughClock({
      now,
      timeZone: "UTC",
      pending: false,
      todayOrders: [order(todayKey, 15, 10, 80)],
      priorOrders: [order(priorKey, 14, 50, 250)],
    });
    expect(compare.todaySales).toBe(0);
    expect(compare.priorSales).toBe(250);
    expect(overviewClockSentence(compare, money)).toBe(
      "Shopify Total Sales through 2:55 pm is $0 versus $250 the same weekday last year (−100%).",
    );
  });

  it("treats a synced quiet day as $0 today and last year not on file", () => {
    const compare = overviewThroughClock({
      now,
      timeZone: "UTC",
      pending: false,
      todayOrders: [],
      priorOrders: null,
    });
    expect(compare.status).toBe("ready");
    expect(compare.todaySales).toBe(0);
    expect(compare.priorSales).toBeNull();
    const sentence = overviewClockSentence(compare, money);
    expect(sentence).toBe(
      "Shopify Total Sales through 2:55 pm is $0, and the same weekday last year is — not on file.",
    );
    expect(sentence).not.toContain("still loading");
  });

  it("does not paint a finished zero when the book has not synced", () => {
    const compare = overviewThroughClock({
      now,
      timeZone: "UTC",
      pending: true,
      todayOrders: [],
      priorOrders: [order(priorKey, 14, 50, 250)],
    });
    const sentence = overviewClockSentence(compare, money);
    expect(sentence).toBe(
      "Shopify Total Sales through this clock is still loading — not $0.",
    );
    expect(sentence).not.toMatch(/is \$0/);
    expect(sentence).not.toMatch(/0%/);
  });

  it("does not pretend UTC is the shop clock when the timezone is missing", () => {
    const compare = overviewThroughClock({
      now,
      timeZone: null,
      pending: false,
      todayOrders: [order(todayKey, 14, 50, 400)],
      priorOrders: [order(priorKey, 14, 50, 250)],
    });
    expect(compare.status).toBe("no-timezone");
    expect(compare.todaySales).toBeNull();
    expect(compare.priorSales).toBeNull();
    const sentence = overviewClockSentence(compare, money);
    expect(sentence).toBe(
      "Shopify Total Sales through this clock is — not on file.",
    );
    expect(sentence).not.toMatch(/\$0/);
    expect(sentence).not.toContain("$400");
  });
});

describe("month close and the period hero stay put", () => {
  it("keeps month close as so far plus remaining days times a typical day", () => {
    expect(OVERVIEW_MIX_FORMULA_EQ).toBe(
      "Month close = so far + remaining days × typical day",
    );
    expect(overviewMonthClock(2026, 9, 16)).toEqual({
      daysElapsed: 16,
      daysInMonth: 30,
      remainingDays: 14,
    });
  });

  it("keeps the period-total hero labeled Shopify Total Sales", () => {
    expect(OVERVIEW_PERIOD_TOTAL_LABEL).toBe("Shopify Total Sales");
    expect(OVERVIEW_PERIOD_TOTAL_SENTENCE).toBe(
      "Shopify Total Sales for this period.",
    );
    const first = readFileSync(
      join(here, "../components/OverviewFirstViewport.tsx"),
      "utf8",
    );
    expect(first).toContain("label={OVERVIEW_PERIOD_TOTAL_LABEL}");
    expect(first).toContain("overviewClockSentenceFromPayload");
    const chart = readFileSync(
      join(here, "../components/OverviewSalesChart.tsx"),
      "utf8",
    );
    expect(chart).toContain("overviewSameDatesSentence");
    expect(chart).toContain("overviewPriorWindow");
    expect(chart).toContain('data-overview-compare="same-dates"');
    expect(chart).not.toContain('data-overview-compare="clock"');
    expect(first).toContain('data-overview-compare="clock"');
    const route = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");
    expect(route).not.toContain("today.length === 0 && prior == null");
    expect(route).toContain("clockTodayOrders = todayRows.map");
    expect(chart).toContain("mcfly-chart__hero");
  });
});

describe("Overview paints the labeled lines", () => {
  it("paints a custom launch week versus those dates, and a missing year as not on file", () => {
    const current = daySeries("2026-09-01", 21, 1200);
    const prior = overviewSameDatesLastYear("2026-09-08", "2026-09-14")!.dateKeys.map(
      (dateKey) => ({ dateKey, sales: 1000 }),
    );
    const html = renderToStaticMarkup(
      createElement(
        DeskCurrencyContext.Provider,
        { value: "USD" },
        createElement(OverviewSalesChart, {
          days: current,
          historyDays: prior,
          initialPreset: "custom",
          initialCustom: { fromKey: "2026-09-08", toKey: "2026-09-14" },
          typicalDay: 1200,
        }),
      ),
    );
    expect(html).toContain(
      "Shopify Total Sales for Sep 8–14, 2026 is $8,400 versus $7,000 those dates last year (+20%).",
    );
    expect(html).toContain("mcfly-chart__hero");
    expect(html).not.toContain("same dates last year");

    const gapped = prior.filter((day) => day.dateKey !== "2025-09-11");
    const missing = renderToStaticMarkup(
      createElement(
        DeskCurrencyContext.Provider,
        { value: "USD" },
        createElement(OverviewSalesChart, {
          days: current,
          historyDays: gapped,
          initialPreset: "custom",
          initialCustom: { fromKey: "2026-09-08", toKey: "2026-09-14" },
          typicalDay: 1200,
        }),
      ),
    );
    expect(missing).toContain(
      "Shopify Total Sales for Sep 8–14, 2026 versus those dates last year is — not on file.",
    );
    expect(missing).not.toContain("those dates last year is $0");
    expect(missing).not.toContain("those dates last year (");
  });

  it("paints an on-file clock and a missing clock on the first viewport only", () => {
    const days = daySeries("2026-09-01", 21, 100);
    const now = atUtc("2026-09-19T14:55:00.000Z");
    const todayKey = "2026-09-19";
    const priorKey = overviewShiftDayKey(todayKey, -364);
    const onFileClock = {
      timeZone: "UTC",
      nowIso: now.toISOString(),
      pending: false,
      todayOrders: [{ orderedAt: `${todayKey}T14:50:00.000Z`, amount: 400 }],
      priorOrders: [
        { orderedAt: `${priorKey}T14:50:00.000Z`, amount: 250 },
        { orderedAt: `${priorKey}T21:00:00.000Z`, amount: 5000 },
      ],
    };
    const onFile = renderToStaticMarkup(
      createElement(
        DeskCurrencyContext.Provider,
        { value: "USD" },
        createElement(OverviewFirstViewport, {
          orderCount: 1,
          typicalOrder: 100,
          meanAov: 100,
          returningSalesShare: null,
          salesPending: false,
          ordersHref: "/app/orders",
          clock: onFileClock,
        }),
      ),
    );
    expect(onFile).toContain(
      "Shopify Total Sales through 2:55 pm is $400 versus $250 the same weekday last year (+60%).",
    );
    expect(onFile).not.toContain("$5,000");
    const chart = renderToStaticMarkup(
      createElement(
        DeskCurrencyContext.Provider,
        { value: "USD" },
        createElement(OverviewSalesChart, { days }),
      ),
    );
    expect(chart).not.toContain("data-overview-compare=\"clock\"");
    expect(chart).not.toContain("through 2:55 pm");

    const missing = renderToStaticMarkup(
      createElement(
        DeskCurrencyContext.Provider,
        { value: "USD" },
        createElement(OverviewFirstViewport, {
          orderCount: 1,
          typicalOrder: 100,
          meanAov: 100,
          returningSalesShare: null,
          salesPending: false,
          ordersHref: "/app/orders",
          clock: {
            timeZone: "UTC",
            nowIso: now.toISOString(),
            pending: false,
            todayOrders: [
              { orderedAt: `${todayKey}T14:50:00.000Z`, amount: 400 },
            ],
            priorOrders: null,
          },
        }),
      ),
    );
    expect(missing).toContain(
      "Shopify Total Sales through 2:55 pm is $400, and the same weekday last year is — not on file.",
    );
  });
});
