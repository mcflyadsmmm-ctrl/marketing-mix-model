import { describe, expect, it } from "vitest";
import {
  FORECAST_MIN_DAYS,
  MIX_MIN_ORDERS,
  OVERVIEW_MIX_FORMULA_CLOSED,
  OVERVIEW_MIX_FORMULA_EQ,
  buildOverviewMixForecast,
  emptyOverviewMixForecast,
  overviewHistoryDays,
  overviewMixEmptyState,
  overviewMixForecastRead,
  overviewMixHistoryLine,
  overviewMixSplit,
  overviewMonthClock,
  overviewMtdFromDays,
  overviewTypicalDayFromBook,
} from "./overview-mix-forecast";

function richInput(
  extra: Partial<Parameters<typeof buildOverviewMixForecast>[0]> = {},
) {
  return buildOverviewMixForecast({
    salesPending: false,
    orderCount: 40,
    windowNewSales: 4_200,
    windowReturningSales: 5_800,
    mtdSales: 42_100,
    dailySales: [2_800, 3_100, 2_900, 3_200, 3_000, 3_050, 2_950, 3_010, 3_040],
    daysElapsed: 17,
    daysInMonth: 30,
    remainingDays: 13,
    historyLimited: false,
    historyDays: 400,
    ...extra,
  });
}

describe("overview mix floors", () => {
  it("names the 8-order mix floor and 8-day typical-day floor", () => {
    expect(MIX_MIN_ORDERS).toBe(8);
    expect(FORECAST_MIN_DAYS).toBe(8);
  });
});

describe("overviewMixEmptyState — floor 8 orders", () => {
  it("is syncing with a verb when nothing is on file", () => {
    const e = overviewMixEmptyState(0, 0, false, false);
    expect(e?.kind).toBe("syncing");
    expect(e?.need).toBe(MIX_MIN_ORDERS);
    expect(e?.verb).toBe("Refresh this page");
    expect(e?.copy).toMatch(/not \$0/);
  });

  it("is syncing while sales are still loading", () => {
    const e = overviewMixEmptyState(12, 20, true, true);
    expect(e?.kind).toBe("syncing");
    expect(e?.copy).toMatch(/still syncing/);
  });

  it("is thin below the order floor", () => {
    const e = overviewMixEmptyState(3, 4, true, false);
    expect(e?.kind).toBe("thin");
    expect(e?.orders).toBe(3);
    expect(e?.copy).toContain("3 orders");
    expect(e?.copy).toContain("8 paid orders");
    expect(e?.verb).toBe("Watch the next orders");
  });

  it("is young when orders exist but the $ split is missing", () => {
    const e = overviewMixEmptyState(12, 10, false, false);
    expect(e?.kind).toBe("young");
    expect(e?.copy).toMatch(/identified buyers/);
    expect(e?.copy).toMatch(/not \$0/);
    expect(e?.verb).toBe("Wait for identified buyers");
  });

  it("seals when 8 orders have a new-vs-returning split", () => {
    expect(overviewMixEmptyState(8, 8, true, false)).toBeNull();
  });
});

describe("overview mix split — dollars, not headcount", () => {
  it("splits new vs returning $ and withholds a fake 0% bar", () => {
    expect(overviewMixSplit(4_200, 5_800)).toEqual({
      newSales: 4_200,
      returningSales: 5_800,
      newShare: 4_200 / 10_000,
      returningShare: 5_800 / 10_000,
    });
    expect(overviewMixSplit(0, 0)).toBeNull();
    expect(overviewMixSplit(null, null)).toBeNull();
  });
});

describe("typical day + month clock", () => {
  it("withholds typical day below 8 days with sales", () => {
    expect(overviewTypicalDayFromBook([100, 200, 150, 180, 220, 190, 210])).toBeNull();
    expect(
      overviewTypicalDayFromBook([100, 200, 150, 180, 220, 190, 210, 170]),
    ).toBe(185);
  });

  it("counts remaining days after today — today sits in so-far", () => {
    expect(overviewMonthClock(2026, 9, 17)).toEqual({
      daysElapsed: 17,
      daysInMonth: 30,
      remainingDays: 13,
    });
    expect(overviewMonthClock(2026, 9, 30).remainingDays).toBe(0);
    expect(overviewMonthClock(2026, 2, 1).daysInMonth).toBe(28);
  });

  it("sums MTD from shop-local month keys only", () => {
    expect(
      overviewMtdFromDays(
        [
          { dateKey: "2026-08-31", sales: 9_000 },
          { dateKey: "2026-09-01", sales: 3_000 },
          { dateKey: "2026-09-17", sales: 2_100 },
          { dateKey: "2026-09-18", sales: 0 },
        ],
        "2026-09",
      ),
    ).toBe(5_100);
  });

  it("counts inclusive history days from keys", () => {
    expect(overviewHistoryDays("2026-08-01", "2026-09-17")).toBe(48);
    expect(overviewHistoryDays("2026-09-17", "2026-09-17")).toBe(1);
    expect(overviewHistoryDays(null, "2026-09-17")).toBe(0);
  });
});

describe("buildOverviewMixForecast — written-out month close", () => {
  it("writes so far + remaining × typical day and the $ mix", () => {
    const view = richInput();
    expect(view.available).toBe(true);
    expect(view.empty).toBeNull();
    expect(view.mix?.returningShare).toBeCloseTo(0.58, 5);
    expect(view.mix?.newShare).toBeCloseTo(0.42, 5);
    expect(view.forecast?.formulaEq).toBe(OVERVIEW_MIX_FORMULA_EQ);
    expect(view.forecast?.typicalDay).toBe(3_010);
    expect(view.forecast?.projected).toBe(42_100 + 13 * 3_010);
    expect(view.forecast?.formulaPlug).toBe("42,100 + 13 × 3,010 = 81,230");
    expect(view.forecast?.closed).toBe(false);
  });

  it("uses so-far when the month is already closed — not a pace", () => {
    const view = richInput({ remainingDays: 0, daysElapsed: 30 });
    expect(view.forecast?.closed).toBe(true);
    expect(view.forecast?.projected).toBe(42_100);
    expect(view.forecast?.formulaEq).toBe(OVERVIEW_MIX_FORMULA_CLOSED);
    expect(view.forecast?.formulaPlug).toBe("42,100 (month done)");
  });

  it("keeps mix and withholds the close below 8 days with sales", () => {
    const view = richInput({ dailySales: [2_800, 3_100, 2_900] });
    expect(view.mix?.returningSales).toBe(5_800);
    expect(view.forecast).toBeNull();
    expect(view.forecastEmpty?.kind).toBe("young");
    expect(view.forecastEmpty?.need).toBe(FORECAST_MIN_DAYS);
    expect(view.forecastEmpty?.copy).toMatch(/not \$0/);
  });

  it("stays an ActionCard-shaped empty below the floor", () => {
    const view = buildOverviewMixForecast({
      salesPending: false,
      orderCount: 3,
      windowNewSales: 400,
      windowReturningSales: 200,
      mtdSales: 600,
      dailySales: [200, 400],
      daysElapsed: 4,
      daysInMonth: 30,
      remainingDays: 26,
      historyLimited: true,
      historyDays: 12,
    });
    expect(view.available).toBe(false);
    expect(view.empty?.kind).toBe("thin");
    expect(view.empty?.need).toBe(8);
    expect(view.mix).toBeNull();
    expect(view.forecast).toBeNull();
  });

  it("never invents a year of pace when history is limited", () => {
    const view = richInput({ historyLimited: true, historyDays: 58 });
    expect(overviewMixHistoryLine(view)).toMatch(/~58 days on file/);
    expect(overviewMixHistoryLine(view)).toMatch(/not a year of pace/);
    expect(overviewMixHistoryLine(richInput())).toMatch(/stored book/);
  });

  it("reads returning $ first, then the written close", () => {
    const read = overviewMixForecastRead(richInput());
    expect(read?.returningShare).toBe(58);
    expect(read?.line).toContain("Returning buyers carry 58% of sales");
    expect(read?.line).toContain("13 remaining days × the typical day");
    expect(read?.projected).toBe(42_100 + 13 * 3_010);
    expect(overviewMixForecastRead(emptyOverviewMixForecast())).toBeNull();
  });

  it("empty helper is a syncing first-win, not a fake $0 close", () => {
    const e = emptyOverviewMixForecast();
    expect(e.empty?.kind).toBe("syncing");
    expect(e.forecast).toBeNull();
    expect(e.mix).toBeNull();
  });
});
