import { describe, expect, it } from "vitest";
import { formatCurrency } from "./mer-format";
import { deskPaintCurrency, SAMPLE_DESK_CURRENCY } from "./spend-money";

describe("deskPaintCurrency", () => {
  it("SAMPLE Snowdevil dollars paint when shop ISO is missing — not all —", () => {
    const paint = deskPaintCurrency(null, { sampleOn: true });
    expect(paint).toBe(SAMPLE_DESK_CURRENCY);
    expect(formatCurrency(68457, paint)).toBe("$68,457");
    expect(formatCurrency(19023, paint)).toBe("$19,023");
    expect(formatCurrency(68457, paint)).not.toBe("—");
  });

  it("Live missing/invalid ISO stays — (Wave 4 honesty — no silent USD)", () => {
    expect(deskPaintCurrency(null, { sampleOn: false })).toBe("");
    expect(deskPaintCurrency("", { sampleOn: false })).toBe("");
    expect(deskPaintCurrency("US", { sampleOn: false })).toBe("");
    expect(formatCurrency(68457, deskPaintCurrency(null, { sampleOn: false }))).toBe(
      "—",
    );
    expect(formatCurrency(68457, deskPaintCurrency(null, { sampleOn: false }))).not.toBe(
      "$68,457",
    );
  });

  it("valid shop ISO still wins on Live", () => {
    expect(deskPaintCurrency("cad", { sampleOn: false })).toBe("CAD");
    expect(formatCurrency(1200, deskPaintCurrency("cad", { sampleOn: false }))).not.toBe(
      "—",
    );
  });
});
