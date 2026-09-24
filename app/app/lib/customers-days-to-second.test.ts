import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CustomerRetentionBoard } from "../components/CustomerRetentionBoard";
import { GrowthComebackChart } from "../components/GrowthComebackChart";
import { GrowthFirstViewport } from "../components/GrowthFirstViewport";
import { GrowthScoreboard } from "../components/GrowthScoreboard";
import { GrowthTt2Board } from "../components/GrowthTt2Board";
import { DeskCurrencyContext } from "./desk-currency";
import {
  customersDaysToSecondCopy,
  customersOnScreenWindow,
  labelCustomersDaysToSecondCard,
  type CustomersWindowDays,
} from "./customers-days-to-second";
import { growthOrderDepthBars } from "./growth-comeback";
import { loadPublicSamplePage } from "./public-sample-page.server";
import { buildShareableInsights } from "./shareable-insights";

function money(n: number): string {
  return `$${n}`;
}

describe("Customers days to a second order", () => {
  it("keeps the on-screen month and drops the other waits", async () => {
    const page = await loadPublicSamplePage(
      new Request("https://mcflyads.com/demo/customers"),
    );
    const windowDays: CustomersWindowDays = {
      label: customersOnScreenWindow(page.rangeLabel),
      days: page.depth.medianDaysToSecond,
      cameBack: page.depth.repeatBuyers,
    };
    const copy = customersDaysToSecondCopy(windowDays);
    expect(windowDays.label).toBe("This month");
    expect(copy?.value).toBe("3 days");
    expect(copy?.line).toBe(
      "Typical wait to a second order is 3 days in This month.",
    );
    expect(copy?.line).not.toMatch(/33/);
    expect(copy?.line).not.toMatch(/162/);

    const insight = buildShareableInsights(
      {
        salesPending: false,
        orderCount: page.book.orderCount,
        returningSales: page.book.returningSales,
        returningShare: page.book.returningSalesShare,
        newSales: page.book.newSales,
        typicalOrder: page.depth.medianAov,
        daysToSecond: page.depth.medianDaysToSecond,
        ltvPeek: null,
        ltvPeekDays: null,
        historyLimited: false,
        shopLabel: page.shopLabel,
        sample: true,
        periodLabel: page.rangeLabel,
      },
      money,
    );
    const card = insight.cards
      .map((row) => labelCustomersDaysToSecondCard(row, windowDays))
      .find((row) => row.kind === "daysToSecond");
    expect(card?.value).toBe("3 days");
    expect(card?.label).toBe("Days to second · This month");
    expect(card?.line).toContain("This month");

    const hero = renderToStaticMarkup(
      createElement(GrowthFirstViewport, {
        tt2: page.tt2,
        salesPending: false,
        useSampleDesk: true,
        windowDays,
      }),
    );
    const clock = renderToStaticMarkup(
      createElement(GrowthTt2Board, { tt2: page.tt2, windowDays }),
    );
    const score = renderToStaticMarkup(
      createElement(
        DeskCurrencyContext.Provider,
        { value: "USD" },
        createElement(GrowthScoreboard, {
          book: page.book,
          depth: page.comebackDepth,
          repeatRate: page.ltv.repeatRate,
          avgOrdersD90: page.ltv.avgOrdersD90,
          salesPending: false,
          useSampleDesk: true,
          quietBack: page.customers.quietBack,
          comebackWait: page.customers.comebackWait,
          lifetimeSpan: page.customers.lifetimeSpan,
          reachNow: page.tt2.reachNow,
          clockAvailable: false,
          windowDays,
        }),
      ),
    );
    const chart = renderToStaticMarkup(
      createElement(
        DeskCurrencyContext.Provider,
        { value: "USD" },
        createElement(GrowthComebackChart, {
          depthBars: growthOrderDepthBars(page.comebackDepth),
          months: page.growthMonths,
          depth: page.comebackDepth,
          repeatRate: page.ltv.repeatRate,
          firstTimeDollars: page.book.newSales,
          salesPending: false,
          windowDays,
        }),
      ),
    );
    const retention = renderToStaticMarkup(
      createElement(CustomerRetentionBoard, {
        analytics: page.customers,
        windowDays,
      }),
    );
    const painted = [hero, clock, score, chart, retention, card?.line ?? ""].join(
      "\n",
    );
    expect(painted).toContain("3 days");
    expect(painted).toContain("This month");
    expect(painted).not.toMatch(/(?<!\d)33d/);
    expect(painted).not.toContain("162d");
    expect(painted).not.toContain("162 days");
    expect(painted).not.toContain("1,507");
    expect(painted).not.toContain("day 177");
    expect(painted).not.toContain("Day 33");
    expect(painted).not.toContain("Day 48");
    expect(painted).not.toContain("past day 48");
  });

  it("does not borrow another window when this one has no second order", () => {
    const copy = customersDaysToSecondCopy({
      label: "This month",
      days: null,
      cameBack: 0,
    });
    expect(copy).toBeNull();
  });
});
