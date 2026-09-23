import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  OVERVIEW_ANALYTICS_CONTRAST,
  OVERVIEW_COVERAGE_LINE,
  overviewCoverageLine,
  OVERVIEW_FIRST_FOLD_HEROES,
  OVERVIEW_FIRST_LANE_LABEL,
  OVERVIEW_LIVE_HANDOFF_BODY,
  OVERVIEW_PENDING_ASOF,
  OVERVIEW_PENDING_LINE,
  OVERVIEW_SALES_ONLY_LINE,
  OVERVIEW_THIN_EMPTY_LINE,
  OVERVIEW_WINBACK_PAD_DAYS,
  overviewBusiestWeekday,
  overviewGreetingPending,
  overviewHandoffPeeks,
  overviewHeroBeatsShopifyAnalytics,
  overviewNoticeSentence,
  overviewOperatorGreeting,
  overviewPanelElementId,
  overviewPeekThird,
  overviewPendingFinding,
  overviewReturningCompactDollars,
  overviewThinEmptyFinding,
  overviewWeekendWeekday,
  overviewWinBackDay,
  OVERVIEW_MIX_CLOSE_ID,
  OVERVIEW_YOY_GLANCE_ID,
  OVERVIEW_YOY_YEAR_ID,
  OVERVIEW_YOY_YEAR_PANEL,
} from "./overview-first-viewport";

/**
 * Authority: docs/ops/CRAFT_UNLOCK.md (2026-09-16) then TAB_LOCK Overview.
 * Dead locks (chart-none, omit-tiles, one hero, QuietSpendDoor) are not
 * re-implemented. Update this file toward density, never toward a pamphlet.
 */
const OVERVIEW_SPEND_BANS = [
  "Spend Upload",
  "Total ROAS",
  "Edit spend",
  "Spend is optional",
  "QuietSpendDoor",
] as const;

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("overview first viewport", () => {
  it("leads with returning-sales share when the split exists", () => {
    expect(
      overviewNoticeSentence({
        orderCount: 1184,
        returningSalesShare: 0.42,
        discountedOrderShare: 0.19,
        medianDaysToSecond: 23,
        salesPending: false,
      }),
    ).toBe(
      "Returning customers generated 42% of sales in this window.",
    );
  });

  it("does not invent a window when there are no orders", () => {
    expect(
      overviewNoticeSentence({
        orderCount: 0,
        returningSalesShare: null,
        discountedOrderShare: null,
        medianDaysToSecond: null,
        salesPending: false,
      }),
    ).toBe("No orders in this window yet.");
  });

  it("does not treat pending sales as $0", () => {
    expect(
      overviewNoticeSentence({
        orderCount: 0,
        returningSalesShare: null,
        discountedOrderShare: null,
        medianDaysToSecond: null,
        salesPending: true,
      }),
    ).toBe(OVERVIEW_PENDING_LINE);
  });

  it("falls back to days-to-second, then discount share", () => {
    expect(
      overviewNoticeSentence({
        orderCount: 40,
        returningSalesShare: null,
        discountedOrderShare: 0.4,
        medianDaysToSecond: 18,
        salesPending: false,
      }),
    ).toBe("Typical wait to a second order was 18 days.");
    expect(
      overviewNoticeSentence({
        orderCount: 40,
        returningSalesShare: null,
        discountedOrderShare: 0.4,
        medianDaysToSecond: null,
        salesPending: false,
      }),
    ).toBe("40% of orders used a discount.");
    expect(
      overviewNoticeSentence({
        orderCount: 40,
        returningSalesShare: null,
        discountedOrderShare: 0.1,
        medianDaysToSecond: null,
        salesPending: false,
      }),
    ).toBe(OVERVIEW_SALES_ONLY_LINE);
  });

  it("coverage line names order book + 24mo orders, not a blanket 60d", () => {
    expect(OVERVIEW_COVERAGE_LINE).toMatch(/24 months/);
    expect(overviewCoverageLine("paid_full")).toBe(OVERVIEW_COVERAGE_LINE);
    expect(overviewCoverageLine("trial_slice")).toMatch(/90 closed days/);
    expect(overviewCoverageLine("trial_slice")).not.toMatch(/24 months/);
    expect(OVERVIEW_COVERAGE_LINE).not.toMatch(/60 days/);
    expect(OVERVIEW_PENDING_LINE).toMatch(/Orders still loading|not \$0/i);
    expect(OVERVIEW_SALES_ONLY_LINE).toMatch(/Shopify orders/i);
    expect(OVERVIEW_SALES_ONLY_LINE).not.toMatch(/optional|spend|ROAS/i);
    expect(OVERVIEW_LIVE_HANDOFF_BODY).toMatch(/Shopify sales/i);
    expect(OVERVIEW_LIVE_HANDOFF_BODY).not.toMatch(/Spend Upload|Total ROAS|optional/i);
    expect(OVERVIEW_PENDING_ASOF).toMatch(/not \$0/);
  });

  it("Overview home is order-book hero, then chart, then YoY below the fold", () => {
    const overview = read("../routes/app._index.tsx");
    const yoyAt = overview.indexOf("<OverviewYoyCards");
    const viewportAt = overview.indexOf("<OverviewFirstViewport");
    const mixAt = overview.indexOf("<OverviewMixForecast");
    const shareAt = overview.indexOf("<ShareableInsightCards");
    const chartAt = overview.indexOf("<OverviewSalesChart");
    const depthAt = overview.indexOf("<OverviewDepthPeeks");
    const weekdayAt = overview.indexOf("<WeekdaySalesChart");
    const yearAt = overview.indexOf("<OverviewYoyYearSection");
    expect(viewportAt).toBeGreaterThan(-1);
    expect(chartAt).toBeGreaterThan(viewportAt);
    // YoY glance sits after the first-fold chart — not a soft card row above it.
    expect(yoyAt).toBeGreaterThan(chartAt);
    expect(mixAt).toBeGreaterThan(yoyAt);
    expect(shareAt).toBeGreaterThan(mixAt);
    expect(depthAt).toBeGreaterThan(shareAt);
    expect(weekdayAt).toBeGreaterThan(depthAt);
    expect(yearAt).toBeGreaterThan(weekdayAt);
    expect(overview).toContain("orderHero");
    expect(overview).toContain("buildOverviewYoyCards");
    expect(overview).toContain("overviewGreetingPending");
    expect(overview).toContain("greetingPending");
    expect(overview).toContain("OVERVIEW_YOY_YEAR_PANEL");
    expect(overview).toContain("OVERVIEW_MIX_CLOSE_ID");
    expect(overview).toContain("id={DESK_SECTION.chart}");
    expect(overview).toContain('hint=""');
    expect(overview).not.toContain('"/app/yoy"');
    expect(overview).not.toContain('"/app/growth"');
    expect(overview).not.toContain('"/app/ltv"');
    expect(overview).not.toContain("<PeriodControl");
    expect(overview).not.toContain("<DeskOverviewTabs");
    expect(overview).not.toContain("<DeskWindowRail");
    expect(overview).not.toContain("<SpendExplorer");
    expect(overview).not.toContain("<DualCloseLine");
    expect(overview).not.toContain("<MonthlyPacing");
    expect(overview).not.toContain("<ShopifyBookSection");
    expect(overview).not.toContain("<MarketingSnapSection");
    expect(overview).toContain("deskStageFromHash");
    expect(overview).toContain("getOrderBackfillProgress");
    expect(overview).toContain("orderFactsTruncated");
    expect(overview).toContain("orderBackfillProgress?.truncated");
    expect(overview).not.toContain("hideHero");
    expect(overview).not.toContain("<GoalsSnapSection");
    expect(overview).not.toContain("mcfly-tab-snaps");
    expect(overview).not.toContain("Coverage {Math.round(coveragePct)}%");
    expect(overview).not.toContain("Margin {Math.round(metrics.marginPct * 100)}%");
    expect(overview).not.toMatch(/Margin \{Math\.round\(metrics\.marginPct/);
    expect(overview).toContain("!greetingPending");
    expect(overview).toContain("factDays: salesFactsCoverage?.factDays");
    const chart = read("../components/OverviewSalesChart.tsx");
    expect(chart).not.toContain(
      "salesPending || !hasSales || points.length < 2",
    );
    expect(chart).not.toMatch(/if \(points\.length < 2\)\s*return null/);
    expect(chart).toContain("ChartEmptyFrame");
    expect(chart).toContain("OVERVIEW_CHART_EMPTY");
    expect(chart).toContain("No days in this window yet");
    expect(chart).toContain("Tap a bar");
    expect(chart).toContain("OVERVIEW_CHART_CAPTION");
    expect(chart).toContain("mcfly-chart__typical");
    expect(chart).toContain("mcfly-chart__sales-fill");
    expect(chart).toContain("mcfly-chart__hero");
    expect(chart).toContain("overviewChartDayLabel");
    expect(chart).not.toContain("mcfly-chart__hint");
    expect(chart).not.toContain("mcfly-chart__spend-line");
    expect(chart).not.toContain("Sales and spend");
  });

  it("Overview YoY cards say pending sales are not $0", () => {
    const cards = read("../components/OverviewYoyCards.tsx");
    expect(cards).toContain("OVERVIEW_YOY_PENDING");
    expect(cards).toContain("OVERVIEW_YOY_LABELS");
    expect(cards).toContain("OVERVIEW_YOY_MISSING");
    expect(cards).not.toMatch(/if \(salesPending\) return null/);
    expect(cards).toContain("if (salesPending)");
    expect(cards).toContain("if (cards.length === 0)");
    expect(cards).not.toContain("salesPending || cards.length === 0");
    expect(cards).not.toContain("0.00×");
    expect(cards).not.toContain("Total ROAS");
    expect(cards).not.toContain("Edit spend");
    expect(cards).toContain("overviewWindowRange");
    expect(cards).toContain("overviewYoyZone");
    expect(cards).toContain("mcfly-yoy--glance");
    expect(cards).toContain("OVERVIEW_YOY_GLANCE_ID");
    expect(cards).toContain("OVERVIEW_YOY_YEAR_PANEL");
    expect(cards).not.toContain('deskHref("/app/yoy")');
    expect(cards).toContain("overviewYoyDeltaPct");
    expect(cards).not.toContain("Click for detail");
  });

  it("first viewport is order-book hero plane — never a soft KPI grid or ROAS hero", () => {
    const firstView = read("../components/OverviewFirstViewport.tsx");
    expect(firstView).toContain("mcfly-overview-plane");
    expect(firstView).toContain("OVERVIEW_FROM_ORDERS_LABEL");
    expect(firstView).toContain("overviewOrderHeroSentence");
    expect(firstView).toContain("orderHero");
    expect(firstView).not.toContain("mcfly-kpi-grid--peeks-lead");
    expect(firstView).not.toContain("mcfly-kpi-grid--peeks-4");
    expect(firstView).not.toContain("mcfly-kpi--soft");
    expect(firstView).not.toContain("Click for detail");
    expect(firstView).not.toContain("mcfly-decision__takeaway");
    expect(firstView).toContain("weekendSalesShare");
    expect(firstView).toContain("Returning");
    expect(firstView).toContain("Typical order");
    expect(firstView).toContain("Weekend");
    expect(firstView).not.toContain("Live is parked until launch");
    expect(firstView).not.toContain("Look here first");
    expect(firstView).not.toContain("setupAddSpend");
    expect(firstView).not.toContain("Upload Spend");
    expect(firstView).not.toContain("Edit spend →");
    expect(firstView).not.toContain("<s-link");
    expect(firstView).not.toContain("0.00×");
    expect(firstView).not.toContain("formatMer");
    expect(firstView).not.toContain("EOM projected");
    expect(firstView).not.toContain('label="Total Sales"');
    expect(firstView).not.toContain("totalRoas");
    expect(firstView).not.toContain("spendHref");
    expect(firstView).not.toContain("spendEmpty");
    expect(firstView).not.toContain("hasSpend");
    expect(firstView).not.toContain("matches Analytics");
    expect(firstView).not.toContain("Shopify Total Sales");
  });

  it("order-book depth peeks stay below the fold — first fold never blanks on salesPending", () => {
    const firstView = read("../components/OverviewFirstViewport.tsx");
    expect(firstView).toContain("salesPending: _salesPending");
    expect(firstView).toContain("OVERVIEW_ORDERS_EMPTY_LINE");
    expect(firstView).toContain("OVERVIEW_THIN_EMPTY_LINE");
    expect(firstView).not.toContain("FindingStrip");
    expect(firstView).not.toContain("mcfly-book__clock");
    expect(overviewPendingFinding()).toEqual({
      signal: "Orders still landing",
      evidence: OVERVIEW_PENDING_LINE,
      next: "Typical order, returning $, and weekend fill as closed days land — not $0.",
    });
    expect(overviewThinEmptyFinding().evidence).toBe(OVERVIEW_THIN_EMPTY_LINE);
    expect(overviewPendingFinding().next).not.toMatch(/Profit Agent|ROAS|spend/i);
    expect(overviewThinEmptyFinding().next).not.toMatch(/Profit Agent|ROAS|spend/i);
  });

  it("never paints spend, upload, or ROAS copy on Overview", () => {
    const firstView = read("../components/OverviewFirstViewport.tsx");
    const lib = read("./overview-first-viewport.ts");
    const orderBook = read("./overview-order-book.ts");
    const mixBoard = read("../components/OverviewMixForecast.tsx");
    const mixLib = read("./overview-mix-forecast.ts");
    const overview = read("../routes/app._index.tsx");
    const chart = read("../components/OverviewSalesChart.tsx");
    const yoy = read("../components/OverviewYoyCards.tsx");
    const fixture = read("./desk-phone-fixture.html");
    const pending = read("./desk-phone-pending-fixture.html");
    const overviewStart = fixture.indexOf('aria-label="Sales versus last year"');
    const spendDay = fixture.indexOf('aria-label="Spend day"');
    const fixtureOverview = fixture.slice(overviewStart, spendDay);
    const pendingOverview = pending.slice(
      pending.indexOf('aria-label="Sales versus last year"'),
    );
    const corpus = [
      firstView,
      lib,
      orderBook,
      mixBoard,
      mixLib,
      overview,
      chart,
      yoy,
      fixtureOverview,
      pendingOverview,
    ].join("\n");
    for (const ban of OVERVIEW_SPEND_BANS) {
      expect(corpus, ban).not.toContain(ban);
    }
    expect(firstView).not.toContain("Add spend to see Total ROAS");
    expect(firstView).not.toContain('label="Ad spend"');
    expect(firstView).not.toContain("Spend Upload →");
    expect(firstView).not.toContain("returningCustomers.toLocaleString()");
    expect(firstView).not.toContain("mcfly-kpi-grid--with-roas");
    expect(firstView).not.toContain("mcfly-decision__verb");
    expect(firstView).not.toContain("mcfly-decision__actions");
    expect(firstView).toContain("OVERVIEW_FROM_ORDERS_LABEL");
    expect(firstView).toContain("Typical order");
    expect(chart).toContain("OVERVIEW_CHART_CAPTION");
    expect(chart).toContain("mcfly-chart__sales-line");
    expect(chart).not.toContain("mcfly-chart__spend-line");
    expect(yoy).toContain("OVERVIEW_YOY_LABELS");
    expect(yoy).toContain("overviewYoyZoneLabel");
  });

  it("maps Overview panel=yoy-year onto the year board id", () => {
    expect(OVERVIEW_YOY_GLANCE_ID).toBe("mcfly-yoy-glance");
    expect(OVERVIEW_MIX_CLOSE_ID).toBe("mcfly-mix-close");
    expect(OVERVIEW_YOY_YEAR_ID).toBe("mcfly-yoy-year");
    expect(OVERVIEW_YOY_YEAR_PANEL).toBe("yoy-year");
    expect(overviewPanelElementId("yoy-year")).toBe("mcfly-yoy-year");
    expect(overviewPanelElementId("growth")).toBeNull();
    expect(overviewPanelElementId(null)).toBeNull();
  });

  it("feeds the sales chart a sales-only projection — payload spend never reaches a rendered prop", () => {
    const overview = read("../routes/app._index.tsx");
    // The Overview loader carries a per-day `spend` field in `salesDays`, but the
    // chart must only ever receive `{ dateKey, sales }`. If a future edit hands the
    // raw `salesDays` (with spend) to the chart, spend could leak onto Overview.
    expect(overview).toContain(
      "salesDays.map(({ dateKey, sales }) => ({ dateKey, sales }))",
    );
    expect(overview).not.toContain("days={salesDays}");
  });

  it("returning compact is dollars or an em dash, never headcount", () => {
    expect(overviewReturningCompactDollars(4200)).toBe(4200);
    expect(overviewReturningCompactDollars(0)).toBeNull();
    expect(overviewReturningCompactDollars(null)).toBeNull();
    expect(overviewReturningCompactDollars(undefined)).toBeNull();
  });
});

describe("overviewGreetingPending", () => {
  it("does not treat incomplete coverage + $0 sales as pending when fact days exist", () => {
    expect(
      overviewGreetingPending({
        salesPending: false,
        sales: 0,
        coverageComplete: false,
        factDays: 7,
        periodExceedsFactWindow: false,
        useSampleDesk: false,
      }),
    ).toBe(false);
  });

  it("keeps unknown loading when no certified facts and $0 sales", () => {
    expect(
      overviewGreetingPending({
        salesPending: false,
        sales: 0,
        coverageComplete: false,
        factDays: 0,
        periodExceedsFactWindow: false,
        useSampleDesk: false,
      }),
    ).toBe(true);
  });

  it("keeps a genuine $0 when coverage is complete", () => {
    expect(
      overviewGreetingPending({
        salesPending: false,
        sales: 0,
        coverageComplete: true,
        factDays: 16,
        periodExceedsFactWindow: false,
        useSampleDesk: false,
      }),
    ).toBe(false);
  });

  it("does not blank a partial window that already has sales", () => {
    expect(
      overviewGreetingPending({
        salesPending: false,
        sales: 18_400,
        coverageComplete: false,
        factDays: 9,
        periodExceedsFactWindow: false,
        useSampleDesk: false,
      }),
    ).toBe(false);
  });

  it("follows salesPending and never pending-seals SAMPLE", () => {
    expect(
      overviewGreetingPending({
        salesPending: true,
        sales: 0,
        coverageComplete: true,
        useSampleDesk: false,
      }),
    ).toBe(true);
    expect(
      overviewGreetingPending({
        salesPending: true,
        sales: 0,
        coverageComplete: false,
        factDays: 0,
        useSampleDesk: true,
      }),
    ).toBe(false);
    expect(
      overviewGreetingPending({
        salesPending: false,
        sales: 0,
        coverageComplete: false,
        factDays: 0,
        useSampleDesk: true,
      }),
    ).toBe(false);
  });
});

describe("overviewPeekThird", () => {
  it("prefers weekend share, then days-to-second, and never a fake 0%", () => {
    expect(
      overviewPeekThird({ weekendSalesShare: 0.31, medianDaysToSecond: 18 }),
    ).toEqual({ kind: "weekend", share: 0.31 });
    expect(
      overviewPeekThird({ weekendSalesShare: 0, medianDaysToSecond: 18 }),
    ).toEqual({ kind: "daysToSecond", days: 18 });
    expect(
      overviewPeekThird({ weekendSalesShare: null, medianDaysToSecond: null }),
    ).toEqual({ kind: "empty" });
  });
});

describe("overviewWeekendWeekday", () => {
  it("splits weekend vs weekday and withholds a fake 0%", () => {
    expect(overviewWeekendWeekday(0.23)).toEqual({
      weekendPct: 23,
      weekdayPct: 77,
    });
    expect(overviewWeekendWeekday(0)).toBeNull();
    expect(overviewWeekendWeekday(null)).toBeNull();
  });
});

describe("overviewBusiestWeekday", () => {
  it("names the peak weekday in dollars when window sales exist", () => {
    const shares = [0.11, 0.12, 0.19, 0.2, 0.13, 0.13, 0.12];
    expect(
      overviewBusiestWeekday({
        peakWeekday: 3,
        weekdaySalesShare: shares,
        windowSales: 68_457,
      }),
    ).toEqual({
      label: "Wed",
      dollars: 68_457 * 0.2,
      pct: 20,
    });
    expect(
      overviewBusiestWeekday({
        peakWeekday: null,
        weekdaySalesShare: shares,
        windowSales: 68_457,
      }),
    ).toBeNull();
  });
});

describe("overviewOperatorGreeting", () => {
  it("leads with typical order, returning $, and weekends vs Analytics", () => {
    expect(
      overviewOperatorGreeting({
        salesPending: false,
        orderCount: 1184,
        typicalOrderLabel: "$631",
        returningSalesShare: 0.66,
        weekendSalesShare: 0.23,
      }),
    ).toBe(
      "Typical order around $631. Returning buyers carry 66% of sales. Weekends are 23%. Order-book dollars — not Shopify Analytics day totals.",
    );
    expect(OVERVIEW_ANALYTICS_CONTRAST).not.toMatch(/sessions|ROAS|spend/i);
    expect(OVERVIEW_FIRST_LANE_LABEL).toMatch(/from orders/i);
    expect(OVERVIEW_THIN_EMPTY_LINE).toMatch(/not \$0/);
  });

  it("does not greet thin or pending shops as a Total Sales scoreboard", () => {
    expect(
      overviewOperatorGreeting({
        salesPending: true,
        orderCount: 0,
        typicalOrderLabel: null,
        returningSalesShare: null,
        weekendSalesShare: null,
      }),
    ).toBe(OVERVIEW_PENDING_LINE);
    expect(
      overviewOperatorGreeting({
        salesPending: false,
        orderCount: 0,
        typicalOrderLabel: null,
        returningSalesShare: null,
        weekendSalesShare: null,
      }),
    ).toBe("No orders in this window yet.");
  });
});

describe("overviewHandoffPeeks", () => {
  it("seals days-to-second, LTV, and month close — never a fake $0 row", () => {
    expect(overviewWinBackDay(18)).toBe(18 + OVERVIEW_WINBACK_PAD_DAYS);
    expect(overviewWinBackDay(null)).toBeNull();
    expect(
      overviewHandoffPeeks({
        medianDaysToSecond: 18,
        ltvPeek: 380,
        ltvPeekDays: 90,
        monthClose: 128_363,
        monthCloseRemainingDays: 14,
        monthCloseClosed: false,
      }),
    ).toEqual([
      { kind: "daysToSecond", days: 18, winBack: 33 },
      { kind: "ltvPeek", amount: 380, windowDays: 90 },
      {
        kind: "monthClose",
        projected: 128_363,
        remainingDays: 14,
        closed: false,
      },
    ]);
    expect(
      overviewHandoffPeeks({
        medianDaysToSecond: null,
        ltvPeek: 720,
        ltvPeekDays: 365,
        historyLimited: true,
        monthClose: 0,
      }),
    ).toEqual([]);
  });
});

describe("Overview first-fold SCORECARD vs free Shopify Analytics", () => {
  it("PASS only when every first-fold hero is Mcfly-differentiated", () => {
    expect([...OVERVIEW_FIRST_FOLD_HEROES]).toEqual([
      "typicalOrder",
      "returningDollars",
      "weekendWeekday",
      "yoySameDays",
      "newVsReturningMix",
      "daysToSecond",
      "orderLtvPeek",
      "monthClosePeek",
    ]);
    for (const hero of OVERVIEW_FIRST_FOLD_HEROES) {
      expect(overviewHeroBeatsShopifyAnalytics(hero)).toBe(true);
    }
    const overview = read("../routes/app._index.tsx");
    const firstView = read("../components/OverviewFirstViewport.tsx");
    expect(overview).toContain("OVERVIEW_FIRST_LANE_LABEL");
    expect(overview).toContain("orderHero");
    expect(overview).toContain("ltvPeek={ltvPeek?.amount ?? null}");
    expect(overview).toContain("monthClose={mixView.forecast?.projected ?? null}");
    expect(firstView).toContain("mcfly-overview-plane");
    expect(firstView).toContain("OVERVIEW_FROM_ORDERS_LABEL");
    expect(firstView).toContain("overviewOrderHeroSentence");
    expect(firstView).not.toContain('label="Total Sales"');
    expect(firstView).not.toContain("Sessions");
    expect(firstView).not.toContain("mcfly-kpi-grid--peeks-4");
    expect(firstView).not.toContain("Live is parked until launch");
  });
});
