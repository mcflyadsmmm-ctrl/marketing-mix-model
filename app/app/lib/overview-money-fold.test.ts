import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewMoneyFold } from "../components/OverviewMoneyFold";
import { DeskCurrencyContext } from "./desk-currency";
import {
  OVERVIEW_MONEY_SENTENCE,
  buildOverviewMoneyFold,
  overviewCashTotalRoasText,
  resolveOverviewMoneyFold,
  type OverviewMoneySource,
} from "./overview-money-fold";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

function paint(props: {
  sales: number | null;
  salesPending?: boolean;
  spend: number | null;
  useSampleDesk?: boolean;
  periodLabel?: string;
  source?: OverviewMoneySource;
}) {
  return renderToStaticMarkup(
    createElement(
      DeskCurrencyContext.Provider,
      { value: "USD" },
      createElement(OverviewMoneyFold, {
        sales: props.sales,
        salesPending: props.salesPending ?? false,
        spend: props.spend,
        useSampleDesk: props.useSampleDesk ?? false,
        periodLabel: props.periodLabel ?? "This month",
        source: props.source ?? "shopify",
      }),
    ),
  );
}

describe("overview money fold — empty spend Total ROAS", () => {
  it("paints — for zero spend rows and never 0.00× or a failing tone", () => {
    for (const spend of [0, null, Number.NaN]) {
      const model = buildOverviewMoneyFold({
        sales: 68_457,
        salesPending: false,
        spend,
        useSampleDesk: false,
        source: "shopify",
      });
      expect(model.roasText).toBe("—");
      expect(model.roasFailing).toBe(false);
      expect(model.sales).toBe(68_457);
      expect(overviewCashTotalRoasText(68_457, spend, false)).toBe("—");
    }
    const zeroMonth = buildOverviewMoneyFold({
      sales: 0,
      salesPending: false,
      spend: 0,
      useSampleDesk: false,
      source: "shopify",
    });
    expect(zeroMonth.roasText).toBe("—");
    expect(zeroMonth.roasText).not.toContain("0.00");

    const html = paint({ sales: 68_457, spend: 0 });
    expect(html).toContain("Total ROAS —");
    expect(html).toContain("$68,457");
    expect(html).not.toContain("0.00×");
    expect(html).not.toMatch(/failing/i);
    expect(html).not.toContain("mcfly-bad");
    expect(html).toContain('data-empty="true"');
  });

  it("keeps a real ratio only after entered spend", () => {
    const model = buildOverviewMoneyFold({
      sales: 800,
      salesPending: false,
      spend: 200,
      useSampleDesk: false,
      source: "shopify",
    });
    expect(model.roasText).toBe("4.00×");
    expect(model.roasFailing).toBe(false);
    const html = paint({ sales: 800, spend: 200 });
    expect(html).toContain("Total ROAS 4.00×");
    expect(html).not.toContain('data-empty="true"');
    expect(html).not.toMatch(/failing/i);
  });
});

describe("overview money fold — sales are not spend-gated", () => {
  it("shows the same Shopify Total Sales with and without spend", () => {
    const bare = buildOverviewMoneyFold({
      sales: 18_400,
      salesPending: false,
      spend: 0,
      useSampleDesk: false,
      source: "shopify",
    });
    const funded = buildOverviewMoneyFold({
      sales: 18_400,
      salesPending: false,
      spend: 4_000,
      useSampleDesk: false,
      source: "shopify",
    });
    expect(bare.salesVisibleWithoutSpend).toBe(true);
    expect(bare.sales).toBe(18_400);
    expect(funded.sales).toBe(bare.sales);
    expect(bare.label).toBe("Shopify Total Sales");

    const html = paint({ sales: 18_400, spend: 0, periodLabel: "This month" });
    expect(html).toContain("Shopify Total Sales");
    expect(html).toContain("This month");
    expect(html).toContain("$18,400");
    expect(html).toContain('data-sales-ungated="true"');
    expect(html).toContain('aria-label="Shopify Total Sales"');
    expect(html).toContain('data-money-source="shopify"');
    expect(html).toContain(OVERVIEW_MONEY_SENTENCE);
  });

  it("keeps From orders dollars visible without spend and never names them Shopify Total Sales", () => {
    const bare = buildOverviewMoneyFold({
      sales: 68_457,
      salesPending: false,
      spend: 0,
      useSampleDesk: false,
      source: "orders",
    });
    const funded = buildOverviewMoneyFold({
      sales: 68_457,
      salesPending: false,
      spend: 4_000,
      useSampleDesk: false,
      source: "orders",
    });
    expect(bare.label).toBe("From orders");
    expect(bare.source).toBe("orders");
    expect(bare.sales).toBe(68_457);
    expect(funded.sales).toBe(bare.sales);
    expect(bare.roasText).toBe("—");
    expect(bare.salesVisibleWithoutSpend).toBe(true);

    const html = paint({ sales: 68_457, spend: 0, source: "orders" });
    expect(html).toContain("From orders");
    expect(html).toContain('aria-label="From orders"');
    expect(html).toContain('data-money-source="orders"');
    expect(html).toContain("$68,457");
    expect(html).toContain("Total ROAS —");
    expect(html).not.toContain("Shopify Total Sales");
    expect(html).not.toContain("0.00×");
    expect(html).toContain(OVERVIEW_MONEY_SENTENCE);
  });

  it("paints — for missing or pending history, never a fake $0", () => {
    const missing = buildOverviewMoneyFold({
      sales: null,
      salesPending: true,
      spend: 0,
      useSampleDesk: false,
      source: "shopify",
    });
    expect(missing.sales).toBeNull();
    expect(missing.roasText).toBe("—");
    const html = paint({ sales: null, salesPending: true, spend: 0 });
    expect(html).toContain(">—<");
    expect(html).not.toContain("$0");
    expect(html).not.toContain("0.00×");

    const pendingZero = buildOverviewMoneyFold({
      sales: 0,
      salesPending: true,
      spend: 650,
      useSampleDesk: false,
      source: "shopify",
    });
    expect(pendingZero.sales).toBeNull();
    expect(pendingZero.roasText).toBe("—");
  });
});

describe("overview money fold — Live Shopify total vs order book", () => {
  it("uses the SalesDayFact period total when the clock has it", () => {
    expect(
      resolveOverviewMoneyFold({
        useSampleDesk: false,
        orderSales: 68_457,
        orderSalesPending: true,
        shopifyPeriodSales: 12_400,
      }),
    ).toEqual({
      sales: 12_400,
      salesPending: false,
      source: "shopify",
    });

    const certifiedZero = resolveOverviewMoneyFold({
      useSampleDesk: false,
      orderSales: 68_457,
      orderSalesPending: true,
      shopifyPeriodSales: 0,
    });
    expect(certifiedZero).toEqual({
      sales: 0,
      salesPending: false,
      source: "shopify",
    });
    const zeroHtml = paint({
      sales: certifiedZero.sales,
      salesPending: certifiedZero.salesPending,
      spend: 0,
      source: certifiedZero.source,
    });
    expect(zeroHtml).toContain("Shopify Total Sales");
    expect(zeroHtml).toContain(">$0<");
    expect(zeroHtml).toContain("Total ROAS —");
    expect(zeroHtml).not.toContain("0.00×");
  });

  it("labels the order book From orders when the Shopify period total is not on file", () => {
    const pending = resolveOverviewMoneyFold({
      useSampleDesk: false,
      orderSales: 68_457,
      orderSalesPending: false,
      shopifyPeriodSales: null,
    });
    expect(pending).toEqual({
      sales: 68_457,
      salesPending: false,
      source: "orders",
    });
    const html = paint({
      sales: pending.sales,
      salesPending: pending.salesPending,
      spend: 0,
      source: pending.source,
    });
    expect(html).toContain("From orders");
    expect(html).toContain("$68,457");
    expect(html).not.toContain("Shopify Total Sales");

    const notANumber = resolveOverviewMoneyFold({
      useSampleDesk: false,
      orderSales: 18_400,
      orderSalesPending: false,
      shopifyPeriodSales: Number.NaN,
    });
    expect(notANumber.source).toBe("orders");
    expect(notANumber.sales).toBe(18_400);
  });

  it("keeps sample on the order book even if a Shopify total is passed", () => {
    const sample = resolveOverviewMoneyFold({
      useSampleDesk: true,
      orderSales: 68_457,
      orderSalesPending: false,
      shopifyPeriodSales: 12_400,
    });
    expect(sample).toEqual({
      sales: 68_457,
      salesPending: false,
      source: "orders",
    });
  });
});

describe("overview money fold — sample honesty and no platform CTA", () => {
  it("labels Sample and never calls sample dollars your store", () => {
    const model = buildOverviewMoneyFold({
      sales: 68_457,
      salesPending: false,
      spend: 0,
      useSampleDesk: true,
      source: "shopify",
    });
    expect(model.modeLabel).toBe("SAMPLE");
    expect(model.source).toBe("orders");
    expect(model.label).toBe("From orders");
    expect(model.sentence.startsWith("SAMPLE")).toBe(true);
    expect(model.sentence).toContain(OVERVIEW_MONEY_SENTENCE);
    expect(model.sentence).not.toMatch(/your store/i);

    const html = paint({
      sales: 68_457,
      spend: 0,
      useSampleDesk: true,
      source: "shopify",
    });
    expect(html).toContain("SAMPLE");
    expect(html).toContain("From orders");
    expect(html).toContain('aria-label="From orders"');
    expect(html).toContain('data-money-source="orders"');
    expect(html).not.toContain("Shopify Total Sales");
    expect(html).toContain('data-desk-mode="sample"');
    expect(html).toContain('data-sample="true"');
    expect(html).not.toMatch(/your store/i);
  });

  it("labels Live and keeps the trust sentence free of OAuth, pixel, and COGS", () => {
    const html = paint({ sales: 12_000, spend: 0, useSampleDesk: false });
    expect(html).toContain(">Live<");
    expect(html).toContain('data-desk-mode="live"');
    expect(html).not.toContain("SAMPLE");
    expect(html).toContain(OVERVIEW_MONEY_SENTENCE);

    const source = read("../components/OverviewMoneyFold.tsx");
    const lib = read("./overview-money-fold.ts");
    const corpus = `${source}\n${lib}`;
    expect(corpus).not.toMatch(/oauth/i);
    expect(corpus).not.toMatch(/pixel/i);
    expect(corpus).not.toMatch(/\bCOGS\b/);
    expect(corpus).not.toMatch(/Meta Ads|Google Ads|Ads Manager/i);
    expect(source).not.toContain("<s-link");
    expect(source).not.toContain("href=");
    expect(source).not.toContain("0.00×");
    expect(source).not.toMatch(/failing/i);
  });
});

describe("overview money fold — first on the phone stack", () => {
  it("mounts above the order hero on Admin and demo Overview", () => {
    const overview = read("../routes/app._index.tsx");
    const demo = read("../routes/demo._index.tsx");
    const moneyAt = overview.indexOf("<OverviewMoneyFold");
    const heroAt = overview.indexOf("<OverviewFirstViewport");
    expect(moneyAt).toBeGreaterThan(-1);
    expect(moneyAt).toBeLessThan(heroAt);
    const moneyJsx = overview.slice(moneyAt, overview.indexOf("/>", moneyAt));
    expect(moneyJsx).toContain("sales={moneyFold.sales}");
    expect(moneyJsx).toContain("source={moneyFold.source}");
    expect(moneyJsx).not.toContain("orderHero");
    expect(overview).toContain("resolveOverviewMoneyFold");
    expect(overview).toContain(
      "shopifyPeriodSales: shopifyPeriodClock?.periodSales ?? null",
    );
    expect(overview).toContain("orderSales: orderHero.sales");
    expect(overview).toContain("spend={metrics.totalSpend}");
    expect(overview).not.toMatch(
      /hasSpend[\s\S]{0,120}<OverviewMoneyFold/,
    );
    expect(overview).toContain("mcfly-trust__chip--sample");
    expect(overview).toContain("ORDER_FACT_SOURCE");

    const demoAt = demo.indexOf("<OverviewMoneyFold");
    expect(demoAt).toBeLessThan(demo.indexOf("<OverviewFirstViewport"));
    const demoJsx = demo.slice(demoAt, demo.indexOf("/>", demoAt));
    expect(demoJsx).toContain("sales={moneyFold.sales}");
    expect(demoJsx).toContain("source={moneyFold.source}");
    expect(demoJsx).not.toContain("orderHero");
    expect(demo).toContain("useSampleDesk: true");
    expect(demo).toContain("shopifyPeriodSales: null");
    expect(demo).toContain("spend={data.spend}");
  });

  it("keeps the sales block full-width on a phone-width first beat", () => {
    const css = read("../styles/mcfly-desk.css");
    expect(css).toContain(".mcfly-overview-first-beat > .mcfly-overview-money");
    expect(css).toMatch(
      /\.mcfly-overview-first-beat > \.mcfly-overview-money\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/,
    );
    const phone = css.slice(css.indexOf("@media (max-width: 52rem)"));
    expect(phone).toContain(".mcfly-overview-first-beat");
    expect(phone).toContain("grid-template-columns: minmax(0, 1fr)");
    const moneyCss = css.slice(
      css.indexOf(".mcfly-overview-money {"),
      css.indexOf(".mcfly-overview-chart-beat"),
    );
    expect(moneyCss).not.toMatch(/display:\s*none/);
    expect(moneyCss).toContain(".mcfly-overview-money__v");
    expect(moneyCss).not.toMatch(/#b91c1c|#dc2626|mcfly-bad/);
  });
});
