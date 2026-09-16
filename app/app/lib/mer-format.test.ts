import { describe, expect, it } from "vitest";
import {
  createMoneyFormatter,
  formatCurrency,
  formatMoneyOrDash,
} from "./mer-format";

describe("formatCurrency", () => {
  it("uses the shop currency — CAD is not a silent USD prefix", () => {
    expect(formatCurrency(1200, "CAD")).toMatch(/CA\$|CAD/);
    expect(formatCurrency(1200, "USD")).toBe("$1,200");
    expect(formatCurrency(1200, "CAD")).not.toBe(formatCurrency(1200, "USD"));
  });

  it("createMoneyFormatter binds the shop code so a missed call cannot go USD", () => {
    const cad = createMoneyFormatter("cad");
    expect(cad(40)).toBe(formatCurrency(40, "CAD"));
    expect(cad(40)).not.toBe(formatCurrency(40, "USD"));
  });

  it("formatMoneyOrDash keeps missing sales as —", () => {
    expect(formatMoneyOrDash(null, "USD")).toBe("—");
    expect(formatMoneyOrDash(undefined, "CAD")).toBe("—");
    expect(formatMoneyOrDash(Number.NaN, "USD")).toBe("—");
    expect(formatMoneyOrDash(80, "USD")).toBe("$80");
  });

  it("unknown shop currency is not a silent USD $", () => {
    expect(formatCurrency(1200, "")).toBe("—");
    expect(formatCurrency(1200, "US")).toBe("—");
    expect(formatCurrency(1200, "usd1")).toBe("—");
    expect(formatCurrency(1200, "")).not.toBe("$1,200");
    expect(createMoneyFormatter(null)(40)).toBe("—");
    expect(createMoneyFormatter("bogus")(40)).toBe("—");
  });
});
