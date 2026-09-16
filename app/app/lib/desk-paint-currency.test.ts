import { describe, expect, it } from "vitest";
import { formatCurrency } from "./mer-format";
import { deskPaintCurrency, SAMPLE_DESK_CURRENCY } from "./spend-money";

describe("deskPaintCurrency", () => {
  it("SAMPLE Harbor dollars paint when shop ISO is missing — not all —", () => {
    const paint = deskPaintCurrency(null, { sampleOn: true });
    expect(paint).toBe(SAMPLE_DESK_CURRENCY);
    expect(formatCurrency(82068, paint)).toBe("$82,068");
    expect(formatCurrency(23414, paint)).toBe("$23,414");
    expect(formatCurrency(82068, paint)).not.toBe("—");
  });

  it("Live missing/invalid ISO stays — (Wave 4 honesty — no silent USD)", () => {
    expect(deskPaintCurrency(null, { sampleOn: false })).toBe("");
    expect(deskPaintCurrency("", { sampleOn: false })).toBe("");
    expect(deskPaintCurrency("US", { sampleOn: false })).toBe("");
    expect(formatCurrency(82068, deskPaintCurrency(null, { sampleOn: false }))).toBe(
      "—",
    );
    expect(formatCurrency(82068, deskPaintCurrency(null, { sampleOn: false }))).not.toBe(
      "$82,068",
    );
  });

  it("valid shop ISO still wins on Live", () => {
    expect(deskPaintCurrency("cad", { sampleOn: false })).toBe("CAD");
    expect(formatCurrency(1200, deskPaintCurrency("cad", { sampleOn: false }))).not.toBe(
      "—",
    );
  });
});
