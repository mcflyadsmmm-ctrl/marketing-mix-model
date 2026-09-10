import { describe, expect, it } from "vitest";
import {
  moneyEquals,
  roundMoney,
  shopCurrencyCode,
  toMoneyNumber,
} from "./spend-money";

describe("shopCurrencyCode", () => {
  it("keeps a valid ISO code", () => {
    expect(shopCurrencyCode("cad")).toBe("CAD");
    expect(shopCurrencyCode("GBP")).toBe("GBP");
  });

  it("falls back to USD", () => {
    expect(shopCurrencyCode(null)).toBe("USD");
    expect(shopCurrencyCode("")).toBe("USD");
    expect(shopCurrencyCode("US")).toBe("USD");
    expect(shopCurrencyCode("usd1")).toBe("USD");
  });
});

describe("roundMoney", () => {
  it("rounds to cents", () => {
    expect(roundMoney(40)).toBe(40);
    expect(roundMoney(40.1)).toBe(40.1);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(1.005)).toBe(1.01);
  });

  it("treats non-finite as 0", () => {
    expect(roundMoney(Number.NaN)).toBe(0);
    expect(roundMoney(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("toMoneyNumber / moneyEquals", () => {
  it("accepts Prisma-like decimal strings", () => {
    expect(toMoneyNumber("40.00")).toBe(40);
    expect(moneyEquals(40, "40.00")).toBe(true);
    expect(moneyEquals(40.1, 40.10)).toBe(true);
    expect(moneyEquals(40, 41)).toBe(false);
  });
});
