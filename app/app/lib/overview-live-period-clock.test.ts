import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewLivePeriodClock } from "../components/OverviewLivePeriodClock";
import { OverviewFirstViewport } from "../components/OverviewFirstViewport";
import { DeskCurrencyContext } from "./desk-currency";
import { ADMIN_MONEY_ABS, ADMIN_MONEY_REL } from "./accuracy-one-shop";
import { OVERVIEW_FROM_ORDERS_LABEL } from "./overview-order-book";
import { OVERVIEW_PERIOD_TOTAL_LABEL } from "./overview-first-viewport";
import { deskAnalyticsDayTotalsLive } from "./shopify-analytics-totals";
import {
  buildOverviewShopifyPeriodClock,
  judgeOverviewClosedDayAgainstAdmin,
  OVERVIEW_SHOPIFY_CLOCK_PENDING,
  overviewShopifyFactsPending,
  periodRangeIncludesShopToday,
  type OverviewShopifyPeriodClock,
} from "./overview-live-period-clock";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

function clock(overrides: Partial<Parameters<typeof buildOverviewShopifyPeriodClock>[0]> = {}) {
  return buildOverviewShopifyPeriodClock({
    useSampleDesk: false,
    coverageComplete: true,
    periodExceedsFactWindow: false,
    shopifyPeriodTotal: 12_400,
    periodIncludesToday: false,
    todayShopifyTotalKnown: true,
    factsPending: false,
    priorDayKey: "2026-09-22",
    priorDayOnFile: true,
    priorDaySales: 1_800,
    ...overrides,
  });
}

function paint(model: OverviewShopifyPeriodClock) {
  return renderToStaticMarkup(
    createElement(
      DeskCurrencyContext.Provider,
      { value: "USD" },
      createElement(OverviewLivePeriodClock, {
        clock: model,
        periodLabel: "This month",
      }),
    ),
  );
}

describe("Live Overview Shopify period clock", () => {
  it("keeps SAMPLE off the QL clock even when fact dollars are passed", () => {
    expect(deskAnalyticsDayTotalsLive(true)).toBe(false);
    expect(deskAnalyticsDayTotalsLive(false)).toBe(true);
    expect(
      clock({
        useSampleDesk: true,
        shopifyPeriodTotal: 68_457,
        priorDaySales: 9_000,
      }),
    ).toBeNull();
  });

  it("paints Shopify Total Sales from the fact total and keeps From orders on the hero", () => {
    const model = clock();
    expect(model).not.toBeNull();
    expect(model!.label).toBe("Shopify Total Sales");
    expect(model!.label).toBe(OVERVIEW_PERIOD_TOTAL_LABEL);
    expect(model!.orderPeekLabel).toBe("From orders");
    expect(model!.orderPeekLabel).toBe(OVERVIEW_FROM_ORDERS_LABEL);
    expect(model!.periodSales).toBe(12_400);
    expect(model!.priorDaySales).toBe(1_800);

    const html = paint(model!);
    expect(html).toContain("Shopify Total Sales");
    expect(html).toContain("$12,400");
    expect(html).toContain("$1,800");
    expect(html).toContain("Closed Sep 22");
    expect(html).not.toContain("From orders");

    const hero = renderToStaticMarkup(
      createElement(
        DeskCurrencyContext.Provider,
        { value: "USD" },
        createElement(OverviewFirstViewport, {
          orderCount: 12,
          typicalOrder: 631,
          meanAov: 634,
          returningSalesShare: 0.66,
          returningSales: 45_409,
          salesPending: false,
          ordersHref: "/app/orders",
          orderBookDepth: "paid_full",
          orderHero: {
            sales: 68_457,
            priorSales: 69_891,
            yoyPct: -2,
            orderCount: 108,
            typicalOrder: 631,
            returningSales: 45_409,
            weekendShare: 0.23,
            empty: false,
            zone: "down",
          },
          periodLabel: "This month",
        }),
      ),
    );
    expect(hero).toContain("From orders");
    expect(hero).toContain("$68,457");
    expect(hero).not.toContain("Shopify Total Sales");
  });

  it("paints — while facts are pending and never a fake $0 period", () => {
    const model = clock({
      coverageComplete: false,
      factsPending: true,
      shopifyPeriodTotal: 0,
      priorDayOnFile: false,
      priorDaySales: null,
    });
    expect(model!.periodSales).toBeNull();
    expect(model!.priorDaySales).toBeNull();
    expect(model!.periodNote).toBe(OVERVIEW_SHOPIFY_CLOCK_PENDING);
    const html = paint(model!);
    expect(html).toContain("Shopify Total Sales");
    expect(html).toContain("—");
    expect(html).toContain("Still loading — not $0.");
    expect(html).not.toContain(">$0<");
  });

  it("paints — for a closed prior day that is not on file, and $0 only when the fact is zero", () => {
    const missing = clock({
      priorDayOnFile: false,
      priorDaySales: 0,
      factsPending: false,
    });
    expect(missing!.priorDaySales).toBeNull();
    expect(missing!.priorDayNote).toBe("not on file");
    const missingHtml = paint(missing!);
    expect(missingHtml).toContain("not on file");
    expect(missingHtml).not.toContain(">$0<");

    const certifiedZero = clock({
      shopifyPeriodTotal: 0,
      priorDayOnFile: true,
      priorDaySales: 0,
    });
    expect(certifiedZero!.periodSales).toBe(0);
    expect(certifiedZero!.priorDaySales).toBe(0);
    const zeroHtml = paint(certifiedZero!);
    expect(zeroHtml).toContain(">$0<");
    expect(zeroHtml).not.toContain("not on file");
  });

  it("withholds the period when today is inside it and the ShopifyQL top-up is unknown", () => {
    const model = clock({
      periodIncludesToday: true,
      todayShopifyTotalKnown: false,
      shopifyPeriodTotal: 12_400,
      priorDayOnFile: true,
      priorDaySales: 1_800,
    });
    expect(model!.periodSales).toBeNull();
    expect(model!.periodNote).toBe("not on file");
    expect(model!.priorDaySales).toBe(1_800);
  });

  it("judges the closed prior day on the existing $1 / 0.5% Admin bar", () => {
    expect(ADMIN_MONEY_ABS).toBe(1);
    expect(ADMIN_MONEY_REL).toBe(0.005);
    expect(judgeOverviewClosedDayAgainstAdmin(10_000, 10_001, false).verdict).toBe(
      "pass",
    );
    expect(judgeOverviewClosedDayAgainstAdmin(10_000, 10_051, false).verdict).toBe(
      "fail",
    );
    expect(judgeOverviewClosedDayAgainstAdmin(null, 500, true).verdict).toBe("hold");
    expect(judgeOverviewClosedDayAgainstAdmin(null, 500, false).verdict).toBe("fail");
  });

  it("treats a shop-local today inside the period as open", () => {
    const now = new Date("2026-09-23T18:00:00.000Z");
    const inside = periodRangeIncludesShopToday(
      {
        start: new Date("2026-09-01T06:00:00.000Z"),
        end: now,
      },
      "America/Denver",
      now,
    );
    const lastMonth = periodRangeIncludesShopToday(
      {
        start: new Date("2026-08-01T06:00:00.000Z"),
        end: new Date("2026-09-01T05:59:59.000Z"),
      },
      "America/Denver",
      now,
    );
    expect(inside).toBe(true);
    expect(lastMonth).toBe(false);
    expect(
      periodRangeIncludesShopToday(
        { start: now, end: now },
        null,
        now,
      ),
    ).toBe(false);
  });

  it("marks an incomplete closed-day window pending and a finished window not", () => {
    expect(
      overviewShopifyFactsPending({
        useSampleDesk: false,
        salesError: false,
        coverage: {
          complete: false,
          periodExceedsFactWindow: false,
          expectedClosedDays: 12,
        },
      }),
    ).toBe(true);
    expect(
      overviewShopifyFactsPending({
        useSampleDesk: true,
        salesError: false,
        coverage: null,
      }),
    ).toBe(false);
    expect(
      overviewShopifyFactsPending({
        useSampleDesk: false,
        salesError: false,
        coverage: {
          complete: true,
          periodExceedsFactWindow: false,
          expectedClosedDays: 22,
        },
      }),
    ).toBe(false);
  });

  it("wires Live Overview to SalesDayFact and leaves the order hero on From orders", () => {
    const overview = read("../routes/app._index.tsx");
    const first = read("../components/OverviewFirstViewport.tsx");
    const chart = read("../components/OverviewSalesChart.tsx");
    expect(overview).toContain("buildOverviewShopifyPeriodClock");
    expect(overview).toContain("OverviewLivePeriodClock");
    expect(overview).toContain("deskAnalyticsDayTotalsLive(useSampleDesk)");
    expect(overview).toContain(
      "useSampleDesk || salesError != null ? null : sales.totalSales",
    );
    expect(overview).toContain("getSalesFactsByDay");
    expect(overview).toContain("analyticsExplorerDays");
    expect(overview).toContain("orderBookDaySeries");
    const clockBlock = overview.slice(
      overview.indexOf("const shopifyPeriodClock"),
      overview.indexOf("return {"),
    );
    expect(clockBlock).toContain("shopifyPeriodTotal:");
    expect(clockBlock).not.toContain("orderHero");
    expect(clockBlock).not.toContain("orderBook");
    expect(chart).toContain("shopifyDayTotals");
    expect(chart).toContain("overviewCertifiedSpanSales");
    expect(first).toContain("OVERVIEW_FROM_ORDERS_LABEL");
    expect(first).not.toContain("Shopify Total Sales");
  });
});
