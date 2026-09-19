import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { CertifiedDay } from "./mer-control";
import { OVERVIEW_YOY_MISSING } from "./overview-yoy";
import {
  buildYoyYearBoard,
  formatYoyPct,
  last7VsPrior7,
  operatingMonthRows,
  parseYoyYear,
  YOY_ANALYTICS_LEDE,
  YOY_CHANNEL_EMPTY,
  yoyBoardHasSpend,
  yoyBoardPriorMissing,
  yoyBoardTotals,
  yoyChannelVsLy,
  yoyChartBuckets,
  yoyDisplayValue,
  yoyPct,
  yoyYearOptions,
  yoyYearWindowDays,
} from "./yoy-workspace";

const here = dirname(fileURLToPath(import.meta.url));
const yoyRoute = readFileSync(
  join(here, "../components/OverviewYoyYearSection.tsx"),
  "utf8",
);

function certifiedDay(
  dateKey: string,
  sales: number,
  spend = 0,
  channels: Array<{ channel: string; amount: number }> = [],
): CertifiedDay {
  const [year, monthIndex, day] = dateKey.split("-").map(Number);
  return {
    dateKey,
    year,
    monthIndex: monthIndex - 1,
    day,
    quarter: Math.ceil(monthIndex / 3),
    sales,
    spend,
    mer: spend > 0 ? sales / spend : null,
    channels,
    residualSpend: 0,
    unpaired: false,
  };
}

describe("YoY vs Shopify Analytics", () => {
  it("contrasts this period’s sales with this month / last month / last year plus last 7", () => {
    expect(YOY_ANALYTICS_LEDE).toContain("Shopify Analytics shows");
    expect(YOY_ANALYTICS_LEDE).toContain("This page shows");
    expect(YOY_ANALYTICS_LEDE).toMatch(/this period['’]s sales/i);
    expect(YOY_ANALYTICS_LEDE).toMatch(
      /this month vs last month vs last year plus last 7/i,
    );
    expect(YOY_ANALYTICS_LEDE).toMatch(/12-month board vs last year/i);
    expect(YOY_ANALYTICS_LEDE).toMatch(/channel spend vs last year/i);
    expect(yoyRoute).toContain("YOY_ANALYTICS_LEDE");
  });

  it("does not remount SpendExplorer or Overview’s three YoY cards", () => {
    expect(yoyRoute).not.toContain("SpendExplorer");
    expect(yoyRoute).not.toContain("OverviewYoyCards");
  });

  it("mounts the year explorer and 12-month board, not a cards-only pamphlet", () => {
    expect(yoyRoute).toContain("YoyYearChart");
    expect(yoyRoute).toContain("YoyYearBoard");
    expect(yoyRoute).toContain("YoyChannelBoard");
    expect(yoyRoute).toContain("buildYoyYearBoard");
    expect(yoyRoute).toContain("yoyChannelVsLy");
  });
});

describe("operatingMonthRows", () => {
  it("still paints thisMonth when last year is missing, with last-year sales null", () => {
    const rows = operatingMonthRows([
      { id: "thisMonth", sales: 12_000, spend: 0, mer: null },
    ]);
    expect(rows.map((row) => row.id)).toEqual([
      "thisMonth",
      "lastMonth",
      "lastYear",
    ]);
    expect(rows[0]?.sales).toBe(12_000);
    expect(rows.find((row) => row.id === "lastYear")?.sales).toBeNull();
  });
});

describe("YoY last-year honesty", () => {
  it("uses OVERVIEW_YOY_MISSING when last-year sales are null, not only a missing row id", () => {
    expect(yoyRoute).toContain("OVERVIEW_YOY_MISSING");
    expect(yoyRoute).not.toContain('byId.has("lastYear")');
    expect(OVERVIEW_YOY_MISSING).toMatch(/reports scope/);
    expect(OVERVIEW_YOY_MISSING).toMatch(/not \$0/);
  });
});

describe("last7 empty display", () => {
  it("empty last-7 is an em dash, not $0", () => {
    expect(last7VsPrior7([]).sales).toBeNull();
    expect(yoyDisplayValue(null, (n) => `$${n}`)).toBe("—");
    expect(yoyDisplayValue(undefined, (n) => `$${n}`)).toBe("—");
    expect(
      readFileSync(join(here, "../components/YoyYearBoard.tsx"), "utf8"),
    ).toContain("yoyDisplayValue");
  });
});

describe("last7VsPrior7", () => {
  it("compares the latest seven certified days with the preceding seven", () => {
    const days = Array.from({ length: 14 }, (_, index) =>
      certifiedDay(
        `2026-09-${String(index + 1).padStart(2, "0")}`,
        index < 7 ? 100 : 200,
        index < 7 ? 25 : 50,
      ),
    );

    expect(last7VsPrior7(days)).toMatchObject({
      label: "Last 7 vs prior 7",
      sales: 1_400,
      priorSales: 700,
      spend: 350,
      priorSpend: 175,
      mer: 4,
      priorMer: 4,
    });
  });

  it("keeps the prior window null when no certified days precede it", () => {
    const days = Array.from({ length: 7 }, (_, index) =>
      certifiedDay(
        `2026-09-${String(index + 1).padStart(2, "0")}`,
        100,
        25,
      ),
    );

    const comparison = last7VsPrior7(days);
    expect(comparison.sales).toBe(700);
    expect(comparison.priorSales).toBeNull();
    expect(comparison.priorSpend).toBeNull();
    expect(comparison.priorMer).toBeNull();
  });

  it("keeps last-7 sales null when no certified days exist", () => {
    expect(last7VsPrior7([])).toMatchObject({
      sales: null,
      spend: null,
      mer: null,
      priorSales: null,
      priorSpend: null,
      priorMer: null,
    });
  });
});

describe("buildYoyYearBoard", () => {
  const asOf = { year: 2026, month: 9, day: 17 };

  it("always returns 12 months and keeps missing last year null, not $0", () => {
    const days = [
      certifiedDay("2026-08-01", 8_000),
      certifiedDay("2026-09-01", 4_000),
      certifiedDay("2026-09-17", 1_200),
    ];
    const rows = buildYoyYearBoard(days, 2026, asOf);
    expect(rows).toHaveLength(12);
    expect(rows.map((row) => row.label)).toEqual([
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ]);
    expect(rows[7]?.actual).toBe(8_000);
    expect(rows[7]?.prior).toBeNull();
    expect(rows[7]?.yoyPct).toBeNull();
    expect(rows[8]?.isCurrent).toBe(true);
    expect(rows[8]?.actual).toBe(5_200);
    expect(rows[9]?.isFuture).toBe(true);
    expect(rows[9]?.actual).toBeNull();
    expect(yoyBoardPriorMissing(rows)).toBe(true);
    expect(yoyBoardHasSpend(rows)).toBe(false);
  });

  it("aligns the current month to the same days last year", () => {
    const days = [
      certifiedDay("2025-09-01", 100),
      certifiedDay("2025-09-17", 50),
      certifiedDay("2025-09-30", 9_000),
      certifiedDay("2026-09-01", 200),
      certifiedDay("2026-09-17", 80),
    ];
    const rows = buildYoyYearBoard(days, 2026, asOf);
    expect(rows[8]?.actual).toBe(280);
    expect(rows[8]?.prior).toBe(150);
    expect(rows[8]?.yoyPct).toBeCloseTo((280 - 150) / 150 * 100);
  });

  it("keeps spend and Total ROAS null until spend is typed", () => {
    const days = [
      certifiedDay("2025-08-01", 1_000, 250, [{ channel: "meta", amount: 250 }]),
      certifiedDay("2026-08-01", 1_200, 200, [{ channel: "meta", amount: 200 }]),
    ];
    const withSpend = buildYoyYearBoard(days, 2026, asOf);
    expect(withSpend[7]?.spend).toBe(200);
    expect(withSpend[7]?.priorSpend).toBe(250);
    expect(withSpend[7]?.mer).toBeCloseTo(6);
    expect(yoyBoardHasSpend(withSpend)).toBe(true);

    const salesOnly = buildYoyYearBoard(
      [certifiedDay("2026-08-01", 1_200)],
      2026,
      asOf,
    );
    expect(salesOnly[7]?.spend).toBeNull();
    expect(salesOnly[7]?.mer).toBeNull();
    expect(yoyBoardHasSpend(salesOnly)).toBe(false);
  });

  it("YTD YoY uses only overlapping months so missing last year is not $0", () => {
    const days = [
      certifiedDay("2025-08-01", 1_000),
      certifiedDay("2026-07-01", 400),
      certifiedDay("2026-08-01", 1_200),
    ];
    const totals = yoyBoardTotals(buildYoyYearBoard(days, 2026, asOf));
    expect(totals.actual).toBe(1_600);
    expect(totals.prior).toBe(1_000);
    expect(totals.yoyPct).toBeCloseTo(20);
  });
});

describe("yoyChartBuckets", () => {
  it("rolls months into quarters without inventing $0 last year", () => {
    const rows = buildYoyYearBoard(
      [
        certifiedDay("2026-01-10", 100),
        certifiedDay("2026-02-10", 200),
        certifiedDay("2025-04-10", 80),
        certifiedDay("2026-04-10", 120),
      ],
      2026,
      { year: 2026, month: 9, day: 17 },
    );
    const quarters = yoyChartBuckets(rows, "quarter");
    expect(quarters).toHaveLength(4);
    expect(quarters[0]?.actual).toBe(300);
    expect(quarters[0]?.prior).toBeNull();
    expect(quarters[0]?.yoyPct).toBeNull();
    expect(quarters[1]?.actual).toBe(120);
    expect(quarters[1]?.prior).toBe(80);
    expect(quarters[3]?.isFuture).toBe(true);
  });
});

describe("yoyChannelVsLy", () => {
  it("returns no invented channels when neither year has typed spend", () => {
    const thisYear = [certifiedDay("2026-09-01", 500)];
    const lastYear = [certifiedDay("2025-09-01", 400)];
    expect(yoyChannelVsLy(thisYear, lastYear)).toEqual([]);
    expect(YOY_CHANNEL_EMPTY).toMatch(/typed spend/);
  });

  it("keeps last-year spend as — when that channel was not on file", () => {
    const thisYear = [
      certifiedDay("2026-03-01", 1_000, 100, [
        { channel: "meta", amount: 100 },
      ]),
    ];
    const lastYear = [
      certifiedDay("2025-03-01", 800, 80, [
        { channel: "google", amount: 80 },
      ]),
    ];
    const rows = yoyChannelVsLy(thisYear, lastYear);
    expect(rows.map((row) => row.channel).sort()).toEqual(["google", "meta"]);
    const meta = rows.find((row) => row.channel === "meta");
    const google = rows.find((row) => row.channel === "google");
    expect(meta?.spend).toBe(100);
    expect(meta?.priorSpend).toBeNull();
    expect(meta?.vsPct).toBeNull();
    expect(google?.spend).toBeNull();
    expect(google?.priorSpend).toBe(80);
    expect(rows.every((row) => row.channel !== "tiktok")).toBe(true);
  });

  it("compares spend vs last year only for channels on both books", () => {
    const thisYear = [
      certifiedDay("2026-03-01", 1_000, 200, [
        { channel: "meta", amount: 200 },
      ]),
    ];
    const lastYear = [
      certifiedDay("2025-03-01", 800, 100, [
        { channel: "meta", amount: 100 },
      ]),
    ];
    const [row] = yoyChannelVsLy(thisYear, lastYear);
    expect(row?.channel).toBe("meta");
    expect(row?.spend).toBe(200);
    expect(row?.priorSpend).toBe(100);
    expect(row?.vsPct).toBe(100);
  });
});

describe("yoy year helpers", () => {
  it("parses a year and lists years on file through as-of", () => {
    expect(parseYoyYear("2025", 2026)).toBe(2025);
    expect(parseYoyYear("nope", 2026)).toBe(2026);
    expect(yoyYearOptions(2026, 2024)).toEqual([2024, 2025, 2026]);
  });

  it("caps a current-year window at as-of, and formats missing YoY as —", () => {
    const days = [
      certifiedDay("2026-01-02", 10),
      certifiedDay("2026-09-17", 20),
      certifiedDay("2026-09-30", 99),
    ];
    const window = yoyYearWindowDays(days, 2026, {
      year: 2026,
      month: 9,
      day: 17,
    });
    expect(window.map((day) => day.dateKey)).toEqual([
      "2026-01-02",
      "2026-09-17",
    ]);
    const priorYtd = yoyYearWindowDays(
      [
        certifiedDay("2025-09-17", 10),
        certifiedDay("2025-12-31", 99),
      ],
      2025,
      { year: 2026, month: 9, day: 17 },
      2026,
    );
    expect(priorYtd.map((day) => day.dateKey)).toEqual(["2025-09-17"]);
    expect(yoyPct(120, 100)).toBe(20);
    expect(formatYoyPct(null)).toBe("—");
    expect(formatYoyPct(12.4)).toBe("+12%");
    expect(formatYoyPct(-8.2)).toBe("-8%");
  });
});
