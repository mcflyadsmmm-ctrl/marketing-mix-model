import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { calculateMer } from "@mcfly/mer-core";
import { SAMPLE_MONEY_MARK } from "./cash-desk-copy";
import { cashVerdictSalesUntrusted, resolveCashVerdict } from "./cash-verdict";

describe("resolveCashVerdict", () => {
  it("says yes when Total ROAS clears break-even", () => {
    const v = resolveCashVerdict({
      mer: 2.4,
      sales: 12000,
      spend: 5000,
      breakEvenMer: 1.8,
      spendIncomplete: false,
      salesFactsIncomplete: false,
    });
    expect(v.tone).toBe("ok");
    expect(v.headline).toMatch(/Yes/i);
    expect(v.headline).toMatch(/2\.40×/);
    expect(v.headline).toMatch(/1\.80×/);
    expect(v.body).toMatch(/\$12,000/);
    expect(v.body).toMatch(/\$5,000/);
  });

  it("says no when below break-even", () => {
    const v = resolveCashVerdict({
      mer: 1.1,
      sales: 1100,
      spend: 1000,
      breakEvenMer: 1.8,
      spendIncomplete: false,
      salesFactsIncomplete: false,
    });
    expect(v.tone).toBe("bad");
    expect(v.headline).toMatch(/No/i);
    expect(v.body).toMatch(/Cut or shift/i);
  });

  it("asks for margin when the multiple is live but break-even is unknown", () => {
    const v = resolveCashVerdict({
      mer: 3.2,
      sales: 3200,
      spend: 1000,
      breakEvenMer: null,
      spendIncomplete: false,
      salesFactsIncomplete: false,
    });
    expect(v.tone).toBe("warn");
    expect(v.headline).toMatch(/confirm margin/i);
  });

  it("never says below break-even on a fake 0.00 while sales facts are untrusted", () => {
    const v = resolveCashVerdict({
      mer: 0,
      sales: 0,
      spend: 1000,
      breakEvenMer: 1.8,
      spendIncomplete: false,
      salesFactsIncomplete: true,
    });
    expect(v.tone).toBe("blocked");
    expect(v.headline).not.toMatch(/below break-even/i);
    expect(v.headline).toMatch(/not a trusted multiple/i);
  });

  it("demvcflyads smoke: spend>0 sales===0 incomplete OR untrustedZero never says below break-even", () => {
    const smoke = {
      mer: 0,
      sales: 0,
      spend: 1000,
      breakEvenMer: 1.8,
      spendIncomplete: false,
    };
    const incomplete = resolveCashVerdict({
      ...smoke,
      salesFactsIncomplete: true,
      salesUntrustedZero: false,
    });
    const untrustedWire = resolveCashVerdict({
      ...smoke,
      salesFactsIncomplete: false,
      salesUntrustedZero: true,
    });
    const both = resolveCashVerdict({
      ...smoke,
      salesFactsIncomplete: true,
      salesUntrustedZero: true,
    });
    for (const v of [incomplete, untrustedWire, both]) {
      expect(v.headline).not.toMatch(/below break-even/i);
      expect(v.tone).toBe("blocked");
    }
  });

  it("refuses to treat missing sales facts + $0 sales as ads failing", () => {
    const v = resolveCashVerdict({
      mer: 0,
      sales: 0,
      spend: 650,
      breakEvenMer: 1.8,
      spendIncomplete: false,
      salesFactsIncomplete: true,
    });
    expect(v.tone).toBe("blocked");
    expect(v.headline).toMatch(/not a trusted multiple/i);
    expect(v.body).not.toMatch(/ads failing|don.?t work/i);
  });

  it("warns that spend gaps inflate the multiple", () => {
    const v = resolveCashVerdict({
      mer: 8,
      sales: 8000,
      spend: 1000,
      breakEvenMer: 1.8,
      spendIncomplete: true,
      salesFactsIncomplete: false,
    });
    expect(v.tone).toBe("warn");
    expect(v.headline).toMatch(/missing/i);
    expect(v.body).toMatch(/inflated/i);
  });

  it("stamps SAMPLE so practice cannot be mistaken for live money", () => {
    const v = resolveCashVerdict({
      mer: 4.2,
      sales: 42000,
      spend: 10000,
      breakEvenMer: 1.8,
      spendIncomplete: false,
      salesFactsIncomplete: false,
      useSampleDesk: true,
    });
    expect(v.tone).toBe("sample");
    expect(v.headline).toContain(SAMPLE_MONEY_MARK);
    expect(v.body).toMatch(/Real store/i);
    expect(v.headline).not.toMatch(/^Yes/);
  });

  it("empty spend asks for spend instead of heroing 0.00× or below break-even", () => {
    // No spend means no denominator — the multiple must not exist at all.
    expect(calculateMer(0, 0)).toBeNull();
    expect(calculateMer(12000, 0)).toBeNull();

    const v = resolveCashVerdict({
      mer: calculateMer(0, 0),
      sales: 0,
      spend: 0,
      breakEvenMer: 1.8,
      spendIncomplete: false,
      salesFactsIncomplete: false,
    });
    expect(v.tone).toBe("blocked");
    expect(v.headline).not.toMatch(/below break-even/i);
    expect(v.headline).not.toMatch(/0\.00/);
    expect(v.headline).toMatch(/needs spend/i);
  });
});

describe("CashVerdict tiles while sales facts load", () => {
  const untrustedTiles = (facts: {
    sales: number;
    salesFactsIncomplete: boolean;
    salesUntrustedZero?: boolean;
  }) => cashVerdictSalesUntrusted(facts) && !(facts.sales > 0);

  it("marks loading sales as unknown, never as a real $0", () => {
    expect(
      untrustedTiles({ sales: 0, salesFactsIncomplete: true }),
    ).toBe(true);
    expect(
      untrustedTiles({
        sales: 0,
        salesFactsIncomplete: false,
        salesUntrustedZero: true,
      }),
    ).toBe(true);
    // Trusted quiet period keeps its real $0.
    expect(
      untrustedTiles({ sales: 0, salesFactsIncomplete: false }),
    ).toBe(false);
  });

  it("renders an em dash rather than $0.00 for untrusted sales", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const component = readFileSync(
      join(here, "../components/CashVerdict.tsx"),
      "utf8",
    );
    expect(component).toContain(
      "cashVerdictSalesUntrusted(facts) && !(facts.sales > 0)",
    );
    expect(component).toMatch(
      /salesTilesUntrusted\(facts\)\s*\?\s*"—"\s*:\s*formatCurrency\(facts\.sales\)/,
    );
  });
});
