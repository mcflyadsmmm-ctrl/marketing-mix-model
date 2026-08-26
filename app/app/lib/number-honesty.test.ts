import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  NUMBER_HONESTY,
  SPEND_ADD_HREF,
  SPEND_CSV_HREF,
  formatTotalRoasEquation,
} from "./number-honesty";
import { BILLING_HONESTY } from "./entitlements";

const here = dirname(fileURLToPath(import.meta.url));

function honestyCorpus(): string {
  return [
    JSON.stringify(NUMBER_HONESTY),
    JSON.stringify(BILLING_HONESTY),
    formatTotalRoasEquation({ sales: 12400, spend: 3100, mer: 4 }) ?? "",
  ].join("\n");
}

describe("formatTotalRoasEquation", () => {
  it("shows sales ÷ spend = Total ROAS when spend exists", () => {
    expect(
      formatTotalRoasEquation({ sales: 12_400, spend: 3_100, mer: 4 }),
    ).toBe("$12,400 sales ÷ $3,100 spend = 4.00×");
  });

  it("omits the ratio when mer is null", () => {
    expect(
      formatTotalRoasEquation({ sales: 100, spend: 25, mer: null }),
    ).toBe("$100 sales ÷ $25 spend");
  });

  it("returns null when spend is missing so empty is not 0×", () => {
    expect(
      formatTotalRoasEquation({ sales: 12_400, spend: 0, mer: 0 }),
    ).toBeNull();
    expect(
      formatTotalRoasEquation({ sales: 12_400, spend: -1, mer: 4 }),
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
      }),
    ).toBe("$0 sales ÷ $650 spend = 0.00×");
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
    expect(SPEND_CSV_HREF).toBe("/app/spend#mcfly-spend-uploads");
  });
});

describe("BILLING_HONESTY", () => {
  it("states flat fee and next-cycle cancel", () => {
    expect(BILLING_HONESTY.flat).toMatch(/\$39/);
    expect(BILLING_HONESTY.flat).toMatch(/not a percent of sales/i);
    expect(BILLING_HONESTY.flat).toMatch(/not a per-order/i);
    expect(BILLING_HONESTY.cancel).toMatch(/next 30-day cycle/i);
    expect(BILLING_HONESTY.cancel).toMatch(/current cycle may still charge/i);
  });
});

describe("Overview wires the formula panel and spend-add CTA", () => {
  it("imports NumberHonestyPanel and spend-add href", () => {
    const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");
    expect(overview).toContain("NumberHonestyPanel");
    expect(overview).toContain("spendAddHref");
    expect(overview).not.toContain("Logged via CSV");
    expect(overview).toContain("NUMBER_HONESTY.empty");
  });
});
