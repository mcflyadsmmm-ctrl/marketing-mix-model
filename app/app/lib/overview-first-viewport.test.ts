import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  OVERVIEW_COVERAGE_LINE,
  OVERVIEW_SPEND_EMPTY_LINE,
  overviewNoticeSentence,
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

  it("Overview home is three YoY sales cards", () => {
    const overview = readFileSync(
      join(here, "../routes/app._index.tsx"),
      "utf8",
    );
    expect(overview).toContain("<OverviewYoyCards");
    expect(overview).toContain("buildOverviewYoyCards");
    expect(overview).toContain("<DeskOverviewTabs");
    expect(overview).not.toContain("<OverviewFirstViewport");
    expect(overview).not.toContain("<DeskWindowRail");
    expect(overview).not.toContain("<SpendExplorer");
    expect(overview).not.toContain("<DualCloseLine");
    expect(overview).not.toContain("<MonthlyPacing");
    expect(overview).not.toContain("<ShopifyBookSection");
    expect(overview).not.toContain("<MarketingSnapSection");
    expect(overview).toContain("deskStageFromHash");
    expect(overview).toContain("stage={stage}");
    expect(overview).toContain("scoreboardReady && onHome ? (");
    expect(overview).not.toContain("hideHero");
    expect(overview).not.toContain("<GoalsSnapSection");
    expect(overview).not.toContain("mcfly-tab-snaps");
  });

  it("first viewport is one book section: hero, glance, one sentence", () => {
    const firstView = readFileSync(
      join(here, "../components/OverviewFirstViewport.tsx"),
      "utf8",
    );
    expect(firstView).toContain("OVERVIEW_SPEND_EMPTY_LINE");
    expect(firstView).toContain(OVERVIEW_COVERAGE_LINE.slice(0, 8));
    expect(firstView).toContain('className="mcfly-book__hero-v"');
    expect(firstView).toContain("mcfly-book__glance");
    expect(firstView).toContain("mcfly-book__kpi");
    expect(firstView).toContain("mcfly-book__pair");
    expect(firstView).toContain("weekendSalesShare");
    expect(firstView).toContain("Share of dollars, not headcount");
    // Pending sales never render a giant dash where the total belongs.
    expect(firstView).toContain("salesPending ? null : roasValue ? (");
    expect(firstView).not.toContain("hideHero");
    expect(firstView).not.toContain("setupAddSpend");
    expect(firstView).not.toContain("Upload Spend");
    expect(firstView).not.toContain("spendHref");
    expect(firstView).not.toContain("<s-link");
    expect(firstView).not.toContain("0.00×");
  });
});
