import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  OVERVIEW_COVERAGE_LINE,
  OVERVIEW_SPEND_EMPTY_LINE,
  overviewNoticeSentence,
  overviewReturningCompactDollars,
} from "./overview-first-viewport";

const here = dirname(fileURLToPath(import.meta.url));

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
    ).toBe("Sales for closed days are still loading — not $0.");
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
  });

  it("coverage line names the 60-day order window and returns", () => {
    expect(OVERVIEW_COVERAGE_LINE).toMatch(/60 days/);
    expect(OVERVIEW_COVERAGE_LINE).toMatch(/returns included/i);
    expect(OVERVIEW_SPEND_EMPTY_LINE).toMatch(/works without it/i);
    expect(OVERVIEW_SPEND_EMPTY_LINE).not.toMatch(/0×/);
    expect(OVERVIEW_SPEND_EMPTY_LINE).not.toMatch(/0x/i);
  });

  it("Overview home is YoY cards, then scoreboard, then sales chart", () => {
    const overview = readFileSync(
      join(here, "../routes/app._index.tsx"),
      "utf8",
    );
    const yoyAt = overview.indexOf("<OverviewYoyCards");
    const viewportAt = overview.indexOf("<OverviewFirstViewport");
    const chartAt = overview.indexOf("<OverviewSalesChart");
    expect(yoyAt).toBeGreaterThan(-1);
    expect(viewportAt).toBeGreaterThan(yoyAt);
    expect(chartAt).toBeGreaterThan(viewportAt);
    expect(overview).toContain("buildOverviewYoyCards");
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
  });

  it("Overview YoY cards say pending sales are not $0", () => {
    const cards = readFileSync(
      join(here, "../components/OverviewYoyCards.tsx"),
      "utf8",
    );
    expect(cards).toContain("Sales for closed days are still loading — not $0.");
    expect(cards).not.toMatch(/if \(salesPending\) return null/);
  });

  it("first viewport is notice, sales KPIs, compact row, click for detail", () => {
    const firstView = readFileSync(
      join(here, "../components/OverviewFirstViewport.tsx"),
      "utf8",
    );
    expect(firstView).toContain("OVERVIEW_SPEND_EMPTY_LINE");
    expect(firstView).toContain(OVERVIEW_COVERAGE_LINE.slice(0, 8));
    expect(firstView).toContain("mcfly-decision");
    expect(firstView).toContain("mcfly-kpi-grid");
    expect(firstView).toContain("mcfly-compact");
    expect(firstView).toContain("DeskIcon");
    expect(firstView).toContain("Click for detail");
    expect(firstView).toContain("weekendSalesShare");
    expect(firstView).toContain("spendHref");
    expect(firstView).not.toContain("hideHero");
    expect(firstView).not.toContain("setupAddSpend");
    expect(firstView).not.toContain("Upload Spend");
    expect(firstView).not.toContain("<s-link");
    expect(firstView).not.toContain("0.00×");
  });

  it("at $0 spend does not paint Ad spend or Total ROAS as a 2×2 wall", () => {
    const firstView = readFileSync(
      join(here, "../components/OverviewFirstViewport.tsx"),
      "utf8",
    );
    expect(firstView).not.toContain("Add spend to see Total ROAS");
    expect(firstView).not.toContain('label="Ad spend"');
    expect(firstView).not.toContain("Spend Upload →");
    expect(firstView).toContain("{hasSpend ? (");
    expect(firstView).toContain("OVERVIEW_SPEND_EMPTY_LINE");
    expect(firstView).not.toContain("returningCustomers.toLocaleString()");
  });

  it("returning compact is dollars or an em dash, never headcount", () => {
    expect(overviewReturningCompactDollars(4200)).toBe(4200);
    expect(overviewReturningCompactDollars(0)).toBeNull();
    expect(overviewReturningCompactDollars(null)).toBeNull();
    expect(overviewReturningCompactDollars(undefined)).toBeNull();
  });
});
