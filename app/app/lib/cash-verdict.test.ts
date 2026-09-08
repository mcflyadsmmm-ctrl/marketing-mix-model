import { describe, expect, it } from "vitest";
import { SAMPLE_MONEY_MARK } from "./cash-desk-copy";
import { resolveCashVerdict } from "./cash-verdict";

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
});
