import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CustomerMixChart } from "../components/CustomerMixChart";
import { OverviewSalesChart } from "../components/OverviewSalesChart";
import { DeskCurrencyContext } from "./desk-currency";
import { formatCurrency } from "./mer-format";
import { spendCoverageQuote } from "./number-honesty";
import { loadPublicSamplePage } from "./public-sample-page.server";
import { buildYoyYearBoard } from "./yoy-workspace";

describe("one quoted figure", () => {
  it("names each window on the sample desk", async () => {
    const page = await loadPublicSamplePage(
      new Request("https://mcflyads.com/demo"),
    );
    const scores = page.cashControl.compareScores;
    const thisMonth = scores.find((row) => row.id === "thisMonth");
    const lastMonth = scores.find((row) => row.id === "lastMonth");
    const lastYear = scores.find((row) => row.id === "lastYear");
    const board = buildYoyYearBoard(page.cashControl.drillDays, 2026, {
      year: 2026,
      month: 9,
      day: 16,
    });
    const september = board.find((row) => row.key === "2026-09");
    const august = board.find((row) => row.key === "2026-08");

    expect(thisMonth?.sales).toBeCloseTo(page.sales.totalSales, 2);
    expect(thisMonth?.spend).toBeCloseTo(page.spend, 2);
    expect(thisMonth?.mer).toBeCloseTo(page.mer ?? 0, 4);
    expect(september?.actual).toBeCloseTo(thisMonth?.sales ?? 0, 2);
    expect(september?.spend).toBeCloseTo(thisMonth?.spend ?? 0, 2);
    expect(september?.mer).toBeCloseTo(thisMonth?.mer ?? 0, 4);
    expect(september?.prior).toBeCloseTo(lastYear?.sales ?? 0, 2);
    expect(page.orderHero.sales).toBeCloseTo(page.sales.totalSales, 2);
    expect(page.orderHero.priorSales).toBeCloseTo(lastYear?.sales ?? 0, 2);
    expect(thisMonth?.salesChangePct).not.toBeNull();
    expect(lastMonth?.salesChangePct).toBeNull();
    expect(lastYear?.salesChangePct).toBeNull();

    expect(august?.actual).toBeCloseTo(lastMonth?.sales ?? 0, 2);
    expect(august?.spend).toBeCloseTo(lastMonth?.spend ?? 0, 2);
    expect(lastMonth?.days).toBeGreaterThan(thisMonth?.days ?? 0);
    expect(lastMonth?.label.startsWith("Last month · Aug 1–")).toBe(true);

    const monthTypical = page.mixForecast.forecast?.typicalDay ?? null;
    expect(page.mixForecast.typicalDayWindow).toBe("This month");
    expect(monthTypical).toBeGreaterThan(0);
    const html = renderToStaticMarkup(
      createElement(
        DeskCurrencyContext.Provider,
        { value: "USD" },
        createElement(OverviewSalesChart, {
          days: page.explorerDays,
          typicalDay: monthTypical,
          typicalDayWindow: "This month",
        }),
      ),
    );
    expect(html).toContain("Typical day · This month");
    expect(html).toContain(formatCurrency(monthTypical ?? 0, "USD"));
    expect(html).not.toContain("Typical day · Last 30 days");

    const cpa = page.cpaWindows.find((row) => row.id === "this_month");
    expect(cpa?.toKey).toBe(page.periodToKey);
    expect(cpa?.spend).toBeCloseTo(page.spend, 2);
    expect(cpa?.cashCac).toBeGreaterThan(0);
    expect(cpa?.cashCpa).not.toBe(cpa?.cashCac);

    const returning = page.book.returningSales ?? 0;
    const fresh = page.book.newSales ?? 0;
    expect(page.orderHero.sales ?? 0).toBeGreaterThan(returning + fresh);
    expect(page.book.returningSalesShare).not.toBeCloseTo(
      page.customers.mixReturningShareAvg ?? 0,
      2,
    );
    const mixHtml = renderToStaticMarkup(
      createElement(
        DeskCurrencyContext.Provider,
        { value: "USD" },
        createElement(CustomerMixChart, {
          analytics: page.customers,
          quotedShare: page.book.returningSalesShare,
          quotedWindow: "This month",
        }),
      ),
    );
    const monthShare = `${Math.round((page.book.returningSalesShare ?? 0) * 100)}%`;
    expect(mixHtml).toContain(`Returning share · This month · ${monthShare}`);
    expect(mixHtml).not.toContain("Returning share · last ~");
    expect(mixHtml).toContain(
      `one-order buyers past day ${Math.round(page.customers.winBackDay ?? 0)} · last ~${page.customers.historyDays} days`,
    );

    expect(page.customers.within30Share).not.toBeCloseTo(
      page.tt2.within30Share ?? 0,
      2,
    );
    expect(page.customers.saveNowOneOrder).not.toBe(page.tt2.reachNow);
    expect(page.customers.eligible30).toBeGreaterThan(0);

    const equation = `${formatCurrency(page.sales.totalSales, "USD")} sales ÷ ${formatCurrency(page.spend, "USD")} spend`;
    const hint = spendCoverageQuote({
      caption: "730 sales days · 730 spend days",
      windowLabel: "This month",
      equation: `${equation} = 3.60×`,
    });
    expect(hint).toContain("This month:");
    expect(hint).toContain(equation);
    expect(hint).not.toMatch(/stays —/);

    const metaMonth = page.channelSpend.find((row) => row.channel === "meta");
    expect(metaMonth?.amount).toBeGreaterThan(0);
    expect(august?.spend).not.toBeCloseTo(metaMonth?.amount ?? 0, 0);
  });
});
