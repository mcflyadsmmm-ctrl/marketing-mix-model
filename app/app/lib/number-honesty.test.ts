import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  NUMBER_HONESTY,
  SPEND_ADD_HREF,
  SPEND_CSV_HREF,
  formatOnlineRoasLine,
  formatTotalRoasEquation,
  spendPairCopyText,
} from "./number-honesty";
import { BILLING_HONESTY } from "./entitlements";

const here = dirname(fileURLToPath(import.meta.url));

function honestyCorpus(): string {
  return [
    JSON.stringify(NUMBER_HONESTY),
    JSON.stringify(BILLING_HONESTY),
    formatTotalRoasEquation({
      sales: 12400,
      spend: 3100,
      mer: 4,
      currency: "USD",
    }) ?? "",
  ].join("\n");
}

describe("formatTotalRoasEquation", () => {
  it("shows sales ÷ spend = Total ROAS when spend exists", () => {
    expect(
      formatTotalRoasEquation({
        sales: 12_400,
        spend: 3_100,
        mer: 4,
        currency: "USD",
      }),
    ).toBe("$12,400 sales ÷ $3,100 spend = 4.00×");
  });

  it("omits the ratio when mer is null", () => {
    expect(
      formatTotalRoasEquation({
        sales: 100,
        spend: 25,
        mer: null,
        currency: "USD",
      }),
    ).toBe("$100 sales ÷ $25 spend");
  });

  it("returns null when spend is missing so empty is not 0×", () => {
    expect(
      formatTotalRoasEquation({
        sales: 12_400,
        spend: 0,
        mer: 0,
        currency: "USD",
      }),
    ).toBeNull();
    expect(
      formatTotalRoasEquation({
        sales: 12_400,
        spend: -1,
        mer: 4,
        currency: "USD",
      }),
    ).toBeNull();
  });

  /*
   * 2026-08-26 Admin smoke: Overview printed "$0 sales ÷ $650 spend = 0.00×"
   * while backfill had 0 of 25 closed days. Unknown sales are not $0 sales.
   */
  it("never prints a 0× ratio while closed sales days are still loading", () => {
    const line = formatTotalRoasEquation({
      sales: 0,
      spend: 650,
      mer: 0,
      salesPending: true,
      currency: "USD",
    });
    expect(line).toBe("$650 spend saved · sales still loading");
    expect(line).not.toMatch(/0\.00×/);
    expect(line).not.toMatch(/\$0 sales/);
  });

  it("still shows the merchant's own spend while sales are pending", () => {
    expect(
      formatTotalRoasEquation({
        sales: 0,
        spend: 1_250.5,
        mer: null,
        salesPending: true,
        currency: "USD",
      }),
    ).toContain("$1,251");
  });

  it("prints a real 0× only when sales are known to be zero", () => {
    expect(
      formatTotalRoasEquation({
        sales: 0,
        spend: 650,
        mer: 0,
        salesPending: false,
        currency: "USD",
      }),
    ).toBe("$0 sales ÷ $650 spend = 0.00×");
  });
});

describe("spendPairCopyText", () => {
  it("copies nothing when spend is empty", () => {
    expect(
      spendPairCopyText({
        sales: 12_400,
        spend: 0,
        mer: 0,
        currency: "USD",
      }),
    ).toBeNull();
  });

  it("copies the loading line while sales are pending — not $0 and not 0×", () => {
    const line = spendPairCopyText({
      sales: 0,
      spend: 650,
      mer: 0,
      salesPending: true,
      currency: "USD",
    });
    expect(line).toBe(NUMBER_HONESTY.salesPending);
    expect(line).not.toMatch(/\$0 sales/);
    expect(line).not.toMatch(/=\s*0\.00×/);
  });

  it("does not copy 0× when mer is zero or missing", () => {
    expect(
      spendPairCopyText({
        sales: 0,
        spend: 650,
        mer: 0,
        salesPending: false,
        currency: "USD",
      }),
    ).toBe("$0 sales ÷ $650 spend");
    expect(
      spendPairCopyText({
        sales: 12_400,
        spend: 3_100,
        mer: null,
        currency: "USD",
      }),
    ).toBe("$12,400 sales ÷ $3,100 spend");
  });

  it("copies the painted equation when Total ROAS is real", () => {
    expect(
      spendPairCopyText({
        sales: 12_400,
        spend: 3_100,
        mer: 4,
        currency: "USD",
      }),
    ).toBe("$12,400 sales ÷ $3,100 spend = 4.00×");
  });
});

describe("formatOnlineRoasLine", () => {
  it("labels Online Shopify Total Sales ÷ typed spend and names POS/Shop as excluded", () => {
    const line = formatOnlineRoasLine({
      totalSales: 10_000,
      spend: 2_000,
      mix: { online: 0.7, pos: 0.2, shop: 0.1, other: 0 },
      currency: "USD",
    });
    expect(line).toMatch(/^Online /);
    expect(line).toContain("$7,000");
    expect(line).toContain("$2,000");
    expect(line).toContain("3.50×");
    expect(line).toMatch(/POS/);
    expect(line).toMatch(/Shop/);
    expect(line).toMatch(/not from Total ROAS/);
    expect(line).not.toMatch(/attribution/i);
    expect(line).not.toMatch(/drawer tape/i);
  });

  it("stays — when mix is not on file instead of inventing sources", () => {
    const line = formatOnlineRoasLine({
      totalSales: 10_000,
      spend: 2_000,
      mix: null,
      currency: "USD",
    });
    expect(line).toMatch(/Online Shopify Total Sales/);
    expect(line).toContain("—");
    expect(line).not.toMatch(/0×/);
  });

  it("returns null when spend is empty", () => {
    expect(
      formatOnlineRoasLine({
        totalSales: 10_000,
        spend: 0,
        mix: { online: 0.7, pos: 0.2, shop: 0.1, other: 0 },
        currency: "USD",
      }),
    ).toBeNull();
  });
});

describe("NUMBER_HONESTY copy contracts", () => {
  it("names the invoice formula and what the number is not", () => {
    expect(NUMBER_HONESTY.formula).toMatch(/Shopify Total Sales/i);
    expect(NUMBER_HONESTY.formula).toMatch(/spend you added/i);
    expect(NUMBER_HONESTY.isNotLine).toMatch(/Not platform ROAS/i);
    expect(NUMBER_HONESTY.isNotLine).toMatch(/Not net profit/i);
    expect(NUMBER_HONESTY.empty).toMatch(/not 0×/i);
    expect(NUMBER_HONESTY.invoiceHint).toMatch(/invoice/i);
    expect(NUMBER_HONESTY.invoiceHint).toMatch(/retainer/i);
    expect(NUMBER_HONESTY.csvHint).toMatch(/type/i);
    expect(NUMBER_HONESTY.csvHint).toMatch(/CSV/i);
    expect(NUMBER_HONESTY.orderWindow).toMatch(/60 days/i);
    expect(NUMBER_HONESTY.orderWindow).toMatch(/not \$0/i);
    expect(NUMBER_HONESTY.orderWindow).not.toMatch(/five years/i);
    expect(NUMBER_HONESTY.salesPending).toMatch(/still loading/i);
    expect(NUMBER_HONESTY.salesPending).toMatch(/not \$0/i);
  });

  it("does not preach pixels, true ROAS, or competitor names", () => {
    const corpus = honestyCorpus();
    expect(corpus).not.toMatch(/true ROAS/i);
    expect(corpus).not.toMatch(/\bpixel\b/i);
    expect(corpus).not.toMatch(/triple whale/i);
    expect(corpus).not.toMatch(/trueprofit/i);
    expect(corpus).not.toMatch(/anti-pixel/i);
  });

  it("keeps spend-add as the primary deep link", () => {
    expect(SPEND_ADD_HREF).toBe("/app/spend#mcfly-spend-add");
    expect(SPEND_CSV_HREF).toBe("/app/spend/import#mcfly-spend-csv");
  });
});

describe("BILLING_HONESTY", () => {
  it("states flat fee and next-cycle cancel", () => {
    expect(BILLING_HONESTY.flat).toMatch(/\$39/);
    expect(BILLING_HONESTY.flat).toMatch(/not a percent of sales/i);
    expect(BILLING_HONESTY.flat).toMatch(/not a per-order/i);
    expect(BILLING_HONESTY.flat).toMatch(/does not rise with sales/i);
    expect(BILLING_HONESTY.cancel).toMatch(/next 30-day cycle/i);
    expect(BILLING_HONESTY.cancel).toMatch(/current cycle may still charge/i);
  });
});

describe("Overview wires the formula panel and spend-add CTA", () => {
  it("keeps the formula panel off Overview; spend-add is the Spend tab", () => {
    const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");
    const marketing = readFileSync(
      join(here, "../components/MarketingSnapSection.tsx"),
      "utf8",
    );
    const nav = readFileSync(join(here, "./desk-nav.ts"), "utf8");
    expect(marketing).toContain("NumberHonestyPanel");
    expect(overview).not.toContain("spendAddHref");
    expect(overview).not.toContain("<MarketingSnapSection");
    expect(nav).toContain('label: "Spend"');
    expect(nav).not.toContain('label: "Spend Upload"');
    expect(overview).not.toContain("Logged via CSV");
    expect(overview).not.toContain("NUMBER_HONESTY.empty");
    expect(marketing).toContain("NUMBER_HONESTY.empty");
    expect(marketing).toContain("NUMBER_HONESTY.csvHint");
    expect(overview).not.toContain("NUMBER_HONESTY.orderWindow");
    expect(marketing).toContain("NUMBER_HONESTY.orderWindow");
    expect(overview).toContain("periodMayExceedShopifyOrderWindow(metrics.period)");
    expect(overview).toMatch(
      /shopifyOrderWindowLimited=\{\s*!useSampleDesk &&/,
    );
    expect(overview).not.toMatch(
      /shopifyOrderWindowLimited=\{\s*!useSampleDesk &&\s*metrics\.onboarding\.hasSpend &&/,
    );
  });
});
