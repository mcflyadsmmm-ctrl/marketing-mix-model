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
    expect(deskHistoryCaption(now, "sales", "paid_full")).toBe(
      "Shopify sales · day totals when reports are on · up to 24 months of orders · returns included",
    );
    expect(deskHistoryCaption(now, "spend", "paid_full")).toBe(
      "Daily spend by channel · sales day totals when reports are on · up to 24 months of orders.",
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
      deskPeriodTillLabel({ ...liveTill, salesError: "timeout", orderBookDepth: "paid_full" }),
    ).toBe("This month · sales unavailable");
    expect(
      deskPeriodTillLabel({ ...liveTill, salesSource: "mock", orderBookDepth: "paid_full" }),
    ).toBe("This month · sales unavailable");
  });

  it("mentions up to 24 months on paid Shopify book pages", () => {
    expect(
      deskPeriodTillLabel({
        ...liveTill,
        includeShopifyOrderWindow: true,
        orderBookDepth: "paid_full",
      }),
    ).toBe("This month · live sales · up to 24 months of orders");
  });

  it("names up to 24 months on an unpaid till, not a 90-day trial", () => {
    expect(
      deskPeriodTillLabel({
        ...liveTill,
        includeShopifyOrderWindow: true,
        orderBookDepth: "trial_slice",
      }),
    ).toBe("This month · live sales · up to 24 months of orders");
    expect(
      deskHistoryCaption(new Date(Date.UTC(2026, 7, 26)), "sales", "trial_slice"),
    ).toMatch(/up to 24 months of orders/);
    expect(
      deskHistoryCaption(new Date(Date.UTC(2026, 7, 26)), "sales", "trial_slice"),
    ).not.toMatch(/90 closed days/);
  });

  it("keeps ~60 days only when Shopify history is actually limited", () => {
    expect(
      deskPeriodTillLabel({
        ...liveTill,
        periodLabel: "This year",
        shopifyOrderWindowLimited: true,
        includeShopifyOrderWindow: true,
        orderBookDepth: "paid_full",
      }),
    ).toBe("This year · last ~60 days");
    expect(
      deskPeriodTillLabel({
        ...liveTill,
        periodLabel: "This year",
        shopifyOrderWindowLimited: true,
        includeShopifyOrderWindow: true,
        orderBookDepth: "paid_full",
      }),
    ).not.toMatch(/live sales/);
  });

  it("does not label a capped or missing today as live sales", () => {
    expect(
      deskPeriodTillLabel({
        ...liveTill,
        todaySalesTruncated: true,
        includeShopifyOrderWindow: true,
        orderBookDepth: "paid_full",
      }),
    ).toBe("This month · today’s sales incomplete");
    expect(
      deskPeriodTillLabel({
        ...liveTill,
        todaySalesUnavailable: true,
        includeShopifyOrderWindow: true,
        orderBookDepth: "paid_full",
      }),
    ).toBe("This month · today’s sales still loading");
  });
});

describe("deskBookLede / honesty notices", () => {
  it("keeps native contrast and the shared coverage muted line", () => {
    const lede = deskBookLede("Returning dollars, not headcount.", "paid_full");
    expect(lede).toContain("Returning dollars, not headcount.");
    expect(lede).toContain(PRODUCT_NOUN.shopifyBookMuted);
    expect(lede).toMatch(/24 months/);
    expect(lede).not.toMatch(/~60 days/);
    const unpaid = deskBookLede(
      "Returning dollars, not headcount.",
      "trial_slice",
    );
    expect(unpaid).toMatch(/24 months/);
    expect(unpaid).not.toMatch(/90 closed days/);
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
    const customers = readFileSync(
      join(here, "../routes/app.customers.tsx"),
      "utf8",
    );
    expect(customers).toContain(
      "todaySalesTruncated={!useSampleDesk && todaySalesTruncated}",
    );
    expect(customers).toContain(
      "todaySalesUnavailable={!useSampleDesk && todaySalesUnavailable}",
    );
    expect(customers).toContain(
      "shopifyOrderWindowLimited={!useSampleDesk && shopifyOrderWindowLimited}",
    );
    expect(customers).toContain("includeShopifyOrderWindow: true");
    expect(customers).not.toContain("deskBookLede");

    const orders = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");
    expect(orders).toContain(
      "todaySalesTruncated={!useSampleDesk && todaySalesTruncated}",
    );
    expect(orders).toContain(
      "todaySalesUnavailable={!useSampleDesk && todaySalesUnavailable}",
    );
    expect(orders).toContain("includeShopifyOrderWindow: true");
    expect(readFileSync(join(here, "../routes/app.orders.tsx"), "utf8")).toMatch(
      /throw redirect/,
    );
  });

  it("wires OrderFact progress into DeskBookPage on the Shopify five", () => {
    for (const file of ["app.customers.tsx", "app._index.tsx"]) {
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
