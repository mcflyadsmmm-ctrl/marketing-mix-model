import { describe, expect, it } from "vitest";
import { actionSalesForBasis, parseSalesBasis } from "./sales-basis";

describe("parseSalesBasis", () => {
  it("defaults to total", () => {
    expect(parseSalesBasis(undefined)).toBe("total");
    expect(parseSalesBasis("bogus")).toBe("total");
  });

  it("accepts total and net", () => {
    expect(parseSalesBasis("total")).toBe("total");
    expect(parseSalesBasis("net")).toBe("net");
  });
});

describe("actionSalesForBasis", () => {
  it("uses Total Sales by default", () => {
    const r = actionSalesForBasis(
      { totalSales: 1100, netSales: 900, netSalesKnown: true },
      "total",
    );
    expect(r.sales).toBe(1100);
    expect(r.basisUsed).toBe("total");
    expect(r.netUnavailable).toBe(false);
  });

  it("uses Net Sales when known", () => {
    const r = actionSalesForBasis(
      { totalSales: 1100, netSales: 900, netSalesKnown: true },
      "net",
    );
    expect(r.sales).toBe(900);
    expect(r.basisUsed).toBe("net");
  });

  it("falls back to Total when Net unknown", () => {
    const r = actionSalesForBasis(
      { totalSales: 1100, netSales: null, netSalesKnown: false },
      "net",
    );
    expect(r.sales).toBe(1100);
    expect(r.basisUsed).toBe("total");
    expect(r.netUnavailable).toBe(true);
  });
});
