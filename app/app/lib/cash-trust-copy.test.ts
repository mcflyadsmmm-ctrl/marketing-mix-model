import { describe, expect, it } from "vitest";
import {
  homePendingBannerMessage,
  orderHistoryProgressMessage,
  salesFactsIncompleteMessage,
  spendFirstFoldSalesHint,
  truncatedOrderFactsMessage,
} from "./cash-trust-copy";

describe("salesFactsIncompleteMessage", () => {
  it("reassures on 0-of-N coverage instead of reading like a broken desk", () => {
    const copy = salesFactsIncompleteMessage({
      factDays: 0,
      expectedClosedDays: 23,
      periodLabel: "month to date",
    });
    expect(copy.heading.toLowerCase()).toContain("sales are still loading");
    expect(copy.heading.toLowerCase()).not.toContain("spend is saved");
    expect(copy.body).toContain("0 of 23");
    expect(copy.body.toLowerCase()).toContain("nothing is wrong");
    expect(copy.body.toLowerCase()).toContain("not $0");
    expect(copy.body.toLowerCase()).not.toMatch(/refused to connect|404|500/);
  });

  it("keeps spend / 0× language only when spend is on file", () => {
    const salesOnly = salesFactsIncompleteMessage({
      factDays: 0,
      expectedClosedDays: 25,
      periodLabel: "month to date",
    });
    expect(salesOnly.body.toLowerCase()).not.toContain("0×");
    expect(salesOnly.body.toLowerCase()).not.toContain("your spend is already");

    const withSpend = salesFactsIncompleteMessage({
      factDays: 0,
      expectedClosedDays: 25,
      periodLabel: "month to date",
      hasSpend: true,
    });
    expect(withSpend.body.toLowerCase()).toContain("0×");
    expect(withSpend.body.toLowerCase()).toContain("your spend is already");
  });

  it("keeps partial coverage honest without a spend lecture", () => {
    const copy = salesFactsIncompleteMessage({
      factDays: 9,
      expectedClosedDays: 23,
      periodLabel: "month to date",
    });
    expect(copy.heading).toContain("9 of 23");
    expect(copy.body.toLowerCase()).toContain("not $0");
    expect(copy.body.toLowerCase()).toContain("still filling in");
    expect(copy.body.toLowerCase()).not.toContain("your spend is already");
  });
});

describe("orderHistoryProgressMessage", () => {
  const now = new Date(Date.UTC(2026, 8, 24, 15, 0, 0));

  it("is quiet once the window has no days left", () => {
    expect(
      orderHistoryProgressMessage({
        completeDays: 90,
        windowDays: 90,
        remainingDays: 0,
        now,
      }),
    ).toBeNull();
  });

  it("says this month is still loading and counts months, not a percent", () => {
    const copy = orderHistoryProgressMessage({
      completeDays: 0,
      windowDays: 90,
      remainingDays: 90,
      now,
    });
    expect(copy?.heading).toBe("This month is still loading");
    expect(copy?.body).toContain("0 months finished");
    expect(copy?.body).toMatch(/newest first/);
    expect(copy?.body).toMatch(/\$0/);
    expect(`${copy?.heading} ${copy?.body}`).not.toMatch(/%|\d+ of \d+/);
  });

  it("keeps this month ready while older months load", () => {
    const copy = orderHistoryProgressMessage({
      completeDays: 12,
      windowDays: 90,
      remainingDays: 78,
      now,
    });
    expect(copy?.heading).toBe("This month is ready");
    expect(copy?.body).toMatch(/newest first/);
    expect(copy?.body).toContain("0 months finished");
    expect(copy?.body).toMatch(/\$0/);
    expect(`${copy?.heading} ${copy?.body}`).not.toMatch(/%|\d+ of \d+/);
  });
});

describe("truncatedOrderFactsMessage", () => {
  it("is still loading, not $0, and does not say about 60 days", () => {
    const copy = truncatedOrderFactsMessage();
    expect(copy.heading.toLowerCase()).toContain("order history still loading");
    expect(copy.body.toLowerCase()).toContain("not $0");
    expect(copy.body.toLowerCase()).not.toContain("about 60 days");
  });
});

describe("homePendingBannerMessage", () => {
  it("returns one sales-facts banner instead of stacking order + today", () => {
    const copy = homePendingBannerMessage({
      periodLabel: "Month to date",
      salesFactsIncomplete: { factDays: 0, expectedClosedDays: 23 },
      orderBackfillProgress: {
        completeDays: 0,
        windowDays: 90,
        remainingDays: 90,
      },
      todaySalesTruncated: true,
    });
    expect(copy?.heading.toLowerCase()).toContain("sales are still loading");
    expect(copy?.body).toContain("0 of 23");
    expect(copy?.body.toLowerCase()).not.toMatch(/reports scope|sales totals ingest/i);
  });

  it("falls through to order progress when sales facts are complete", () => {
    const copy = homePendingBannerMessage({
      periodLabel: "This month",
      orderBackfillProgress: {
        completeDays: 3,
        windowDays: 90,
        remainingDays: 87,
      },
    });
    expect(copy?.heading).toBe("This month is ready");
    expect(copy?.body).toMatch(/months finished/);
    expect(copy?.body).not.toMatch(/%/);
  });
});

describe("spendFirstFoldSalesHint", () => {
  it("names the live today cap on the Sales KPI", () => {
    expect(
      spendFirstFoldSalesHint({
        salesPending: false,
        periodLabel: "This month",
        todaySalesTruncated: true,
      }),
    ).toMatch(/Live today is capped at ~100 orders for a fast desk load/);
  });
});
