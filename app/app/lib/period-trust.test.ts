import { describe, expect, it } from "vitest";
import { resolvePeriodTrust } from "./period-trust";

describe("resolvePeriodTrust", () => {
  it("trusts a complete live MTD", () => {
    const trust = resolvePeriodTrust({
      preset: "mtd",
      hasSpend: true,
      spendIncomplete: false,
      salesFactsIncomplete: false,
      periodExceedsFactWindow: false,
    });
    expect(trust.kind).toBe("trusted");
    expect(trust.trusted).toBe(true);
    expect(trust.suggestPreset).toBeNull();
  });

  it("warns QTD spend gaps and prefers MTD", () => {
    const trust = resolvePeriodTrust({
      preset: "qtd",
      hasSpend: true,
      spendIncomplete: true,
      salesFactsIncomplete: false,
      periodExceedsFactWindow: false,
    });
    expect(trust.kind).toBe("spend_gaps");
    expect(trust.trusted).toBe(false);
    expect(trust.warning).toMatch(/inflated|better than cash/i);
    expect(trust.suggestPreset).toBe("mtd");
    expect(trust.suggestLabel).toMatch(/MTD/i);
  });

  it("does not switch period when MTD itself has spend holes", () => {
    const trust = resolvePeriodTrust({
      preset: "mtd",
      hasSpend: true,
      spendIncomplete: true,
      salesFactsIncomplete: false,
      periodExceedsFactWindow: false,
    });
    expect(trust.kind).toBe("spend_gaps");
    expect(trust.suggestPreset).toBeNull();
  });

  it("flags incomplete sales on a wide period", () => {
    const trust = resolvePeriodTrust({
      preset: "ytd",
      hasSpend: true,
      spendIncomplete: false,
      salesFactsIncomplete: true,
      periodExceedsFactWindow: false,
    });
    expect(trust.kind).toBe("sales_incomplete");
    expect(trust.suggestPreset).toBe("mtd");
    expect(trust.warning).toMatch(/not a trusted multiple/i);
  });

  it("never treats SAMPLE as an untrusted live period", () => {
    const trust = resolvePeriodTrust({
      preset: "l12m",
      hasSpend: false,
      spendIncomplete: true,
      salesFactsIncomplete: true,
      periodExceedsFactWindow: true,
      useSampleDesk: true,
    });
    expect(trust.kind).toBe("sample");
    expect(trust.trusted).toBe(true);
    expect(trust.warning).toBe("");
  });
});
