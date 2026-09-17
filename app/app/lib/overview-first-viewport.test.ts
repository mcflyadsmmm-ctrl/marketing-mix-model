import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  OVERVIEW_COVERAGE_LINE,
  OVERVIEW_LIVE_HANDOFF_BODY,
  OVERVIEW_PENDING_ASOF,
  OVERVIEW_PENDING_LINE,
  OVERVIEW_SALES_ONLY_LINE,
  overviewBusiestWeekday,
  overviewGreetingPending,
  overviewNoticeSentence,
  overviewPeekThird,
  overviewReturningCompactDollars,
  overviewWeekendWeekday,
} from "./overview-first-viewport";

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

  it("coverage line names the 60-day order window and returns", () => {
    expect(OVERVIEW_COVERAGE_LINE).toMatch(/60 days/);
    expect(OVERVIEW_COVERAGE_LINE).toMatch(/returns included/i);
    expect(OVERVIEW_SALES_ONLY_LINE).toMatch(/Shopify orders/i);
    expect(OVERVIEW_SALES_ONLY_LINE).not.toMatch(/optional|spend|ROAS/i);
    expect(OVERVIEW_LIVE_HANDOFF_BODY).toMatch(/Shopify sales/i);
    expect(OVERVIEW_LIVE_HANDOFF_BODY).not.toMatch(/Spend Upload|Total ROAS|optional/i);
    expect(OVERVIEW_PENDING_ASOF).toMatch(/not \$0/);
  });

  it("Overview home is YoY cards, then Shopify peeks, then sales charts", () => {
    const overview = read("../routes/app._index.tsx");
    const yoyAt = overview.indexOf("<OverviewYoyCards");
    const viewportAt = overview.indexOf("<OverviewFirstViewport");
    const chartAt = overview.indexOf("<OverviewSalesChart");
    const weekdayAt = overview.indexOf("<WeekdaySalesChart");
    expect(yoyAt).toBeGreaterThan(-1);
    expect(viewportAt).toBeGreaterThan(yoyAt);
    expect(chartAt).toBeGreaterThan(viewportAt);
    expect(weekdayAt).toBeGreaterThan(chartAt);
    expect(overview).toContain("medianDailySales");
    expect(overview).toContain("peakWeekday");
    expect(overview).toContain("windowSales");
    expect(overview).toContain("buildOverviewYoyCards");
    expect(overview).toContain("overviewGreetingPending");
    expect(overview).toContain("greetingPending");
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
    expect(cards).not.toContain("Click for detail");
  });

  it("first viewport is YoY peeks + order KPIs, never a ROAS hero", () => {
    const firstView = read("../components/OverviewFirstViewport.tsx");
    expect(firstView).toContain(OVERVIEW_COVERAGE_LINE.slice(0, 8));
    expect(firstView).toContain("mcfly-scoreboard__kicker");
    expect(firstView).toContain("mcfly-kpi-grid");
    expect(firstView).toContain("mcfly-kpi-grid--peeks");
    expect(firstView).toContain("mcfly-kpi--peek");
    expect(firstView).toContain("orderCount > 0");
    expect(firstView).toContain("DeskIcon");
    expect(firstView).not.toContain("Click for detail");
    expect(firstView).not.toContain("mcfly-decision__takeaway");
    expect(firstView).toContain("weekendSalesShare");
    expect(firstView).toContain("Weekend vs weekday");
    expect(firstView).toContain("OVERVIEW_PENDING_LINE");
    expect(firstView).toContain("bookTypicalOrder");
    expect(firstView).toContain("bookTypicalDay");
    expect(firstView).toContain("bookBusiestWeekday");
    expect(firstView).toContain("mcfly-split");
    expect(firstView).toContain("Returning");
    expect(firstView).not.toContain("hideHero");
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
  });

  it("never paints spend, upload, or ROAS copy on Overview", () => {
    const firstView = read("../components/OverviewFirstViewport.tsx");
    const lib = read("./overview-first-viewport.ts");
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
    expect(firstView).toContain("bookTypicalOrder");
    expect(firstView).toContain("Weekend vs weekday");
    expect(chart).toContain("Sales");
    expect(chart).toContain("mcfly-chart__sales-line");
    expect(chart).not.toContain("mcfly-chart__spend-line");
    expect(yoy).toContain("OVERVIEW_YOY_LABELS");
    expect(yoy).toContain("overviewYoyZoneLabel");
    expect(firstView).toContain("bookTypicalDay");
    expect(firstView).toContain("bookBusiestWeekday");
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
