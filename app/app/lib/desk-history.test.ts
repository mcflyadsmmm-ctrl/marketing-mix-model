import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DESK_HISTORY_YEARS_BACK,
  deskBookHonestyNotices,
  deskBookLede,
  deskHistoryCaption,
  deskHistoryFloorKey,
  deskHistoryFloorYear,
  deskPeriodTillLabel,
  formatPeriodDaySpan,
} from "./desk-history";
import { PRODUCT_NOUN } from "./product-labels";

const here = dirname(fileURLToPath(import.meta.url));

const liveTill = {
  periodLabel: "This month",
  useSampleDesk: false,
  shotMode: false,
  salesError: null as string | null,
  blockedMockAsLive: false,
  salesSource: "shopify",
};

describe("desk history horizon", () => {
  it("is five calendar years back to January 1", () => {
    expect(DESK_HISTORY_YEARS_BACK).toBe(5);
    const now = new Date(Date.UTC(2026, 7, 26));
    expect(deskHistoryFloorYear(now)).toBe(2021);
    expect(deskHistoryFloorKey(now)).toBe("2021-01-01");
    expect(deskHistoryCaption(now)).toBe(
      "Shopify orders · last ~60 days available · returns included",
    );
    expect(deskHistoryCaption(now, "spend")).toBe(
      "Daily spend by channel · sales cover the last ~60 days.",
    );
  });

  it("prints the selected window as calendar days, not “this period”", () => {
    expect(formatPeriodDaySpan("2026-07-12", "2026-09-10")).toBe(
      "2026-07-12 – 2026-09-10",
    );
  });
});

describe("deskPeriodTillLabel", () => {
  it("does not seal an error or mock as live sales", () => {
    expect(
      deskPeriodTillLabel({ ...liveTill, salesError: "timeout" }),
    ).toBe("This month · sales unavailable");
    expect(
      deskPeriodTillLabel({ ...liveTill, salesSource: "mock" }),
    ).toBe("This month · sales unavailable");
  });

  it("mentions ~60 days on Shopify book pages", () => {
    expect(
      deskPeriodTillLabel({ ...liveTill, includeShopifyOrderWindow: true }),
    ).toBe("This month · live sales · last ~60 days");
  });

  it("does not label YTD / Last 12 months as live sales", () => {
    expect(
      deskPeriodTillLabel({
        ...liveTill,
        periodLabel: "This year",
        shopifyOrderWindowLimited: true,
        includeShopifyOrderWindow: true,
      }),
    ).toBe("This year · last ~60 days");
    expect(
      deskPeriodTillLabel({
        ...liveTill,
        periodLabel: "This year",
        shopifyOrderWindowLimited: true,
        includeShopifyOrderWindow: true,
      }),
    ).not.toMatch(/live sales/);
  });

  it("does not label a capped or missing today as live sales", () => {
    expect(
      deskPeriodTillLabel({
        ...liveTill,
        todaySalesTruncated: true,
        includeShopifyOrderWindow: true,
      }),
    ).toBe("This month · today’s sales incomplete");
    expect(
      deskPeriodTillLabel({
        ...liveTill,
        todaySalesUnavailable: true,
        includeShopifyOrderWindow: true,
      }),
    ).toBe("This month · today’s sales unavailable");
  });
});

describe("deskBookLede / honesty notices", () => {
  it("keeps native contrast and the shared ~60-day muted line", () => {
    const lede = deskBookLede("Returning dollars, not headcount.");
    expect(lede).toContain("Returning dollars, not headcount.");
    expect(lede).toContain(PRODUCT_NOUN.shopifyBookMuted);
    expect(lede).toMatch(/~60 days/);
  });

  it("discloses YTD overclaim and truncated today — not $0", () => {
    const ytd = deskBookHonestyNotices({
      periodLabel: "This year",
      shopifyOrderWindowLimited: true,
    });
    expect(ytd).toHaveLength(1);
    expect(ytd[0]?.heading).toBe("Sales history limited for this period");
    expect(ytd[0]?.body).toMatch(/~60-day Shopify order window/);
    expect(ytd[0]?.body).toMatch(/not \$0/);

    const truncated = deskBookHonestyNotices({
      periodLabel: "This month",
      todaySalesTruncated: true,
    });
    expect(truncated[0]?.heading).toBe("Today’s sales may be incomplete");
    expect(truncated[0]?.body).toMatch(/page cap/);
  });
});

describe("Customers / Growth / Orders honesty wiring", () => {
  it("passes truncated today and the Shopify order window into DeskBookPage", () => {
    for (const file of ["app.customers.tsx", "app.growth.tsx", "app.orders.tsx"]) {
      const src = readFileSync(join(here, `../routes/${file}`), "utf8");
      expect(src).toContain(
        "todaySalesTruncated={!useSampleDesk && todaySalesTruncated}",
      );
      expect(src).toContain(
        "todaySalesUnavailable={!useSampleDesk && todaySalesUnavailable}",
      );
      expect(src).toContain(
        "shopifyOrderWindowLimited={!useSampleDesk && shopifyOrderWindowLimited}",
      );
      expect(src).toContain("includeShopifyOrderWindow: true");
      if (file !== "app.growth.tsx") {
        expect(src).toContain("deskBookLede");
      }
    }
  });

  it("wires OrderFact progress into DeskBookPage on the Shopify five", () => {
    for (const file of [
      "app.customers.tsx",
      "app.growth.tsx",
      "app.orders.tsx",
      "app.ltv.tsx",
    ]) {
      const src = readFileSync(join(here, `../routes/${file}`), "utf8");
      expect(src, file).toContain("orderBackfillProgress={");
      expect(src, file).toContain("completeDays:");
      expect(src, file).toContain("remainingDays:");
    }
  });

  it("loadDeskSalesPage returns truncated-today and YTD window flags", () => {
    const src = readFileSync(join(here, "desk-sales-page.server.ts"), "utf8");
    expect(src).toContain("todaySalesTruncated = desk.todaySalesTruncated");
    expect(src).toContain("todaySalesUnavailable = desk.todaySalesUnavailable");
    expect(src).toContain("periodMayExceedShopifyOrderWindow(range)");
    expect(src).toContain("shopifyOrderWindowLimited");
  });
});
