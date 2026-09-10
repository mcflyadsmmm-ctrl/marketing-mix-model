import { describe, expect, it } from "vitest";
import { shopifyNativePeriodStats, cashCostPerCustomer } from "./shopify-native-stats";

describe("shopifyNativePeriodStats", () => {
  it("derives AOV, guest share, buyer mix, and returns drag without spend", () => {
    const book = shopifyNativePeriodStats({
      sales: 8000,
      orderCount: 40,
      newCustomers: 12,
      returningCustomers: 18,
      guestOrders: 10,
      customerMetricsAvailable: true,
      newCustomerNetSales: 3000,
      returningCustomerNetSales: 5000,
      grossSales: 8800,
      grossSalesKnown: true,
    });
    expect(book.aov).toBe(200);
    expect(book.guestShare).toBeCloseTo(0.25);
    expect(book.newBuyerShare).toBeCloseTo(0.4);
    expect(book.newSalesShare).toBeCloseTo(0.375);
    expect(book.returningSalesShare).toBeCloseTo(0.625);
    expect(book.returnsDrag).toBe(800);
    expect(book.returnsDragPct).toBeCloseTo(800 / 8800);
    expect(book.newBuyerArpu).toBe(250);
    expect(book.returningBuyerArpu).toBeCloseTo(5000 / 18);
  });

  it("does not invent buyer mix when customer flags are unavailable", () => {
    const book = shopifyNativePeriodStats({
      sales: 1000,
      orderCount: 8,
      newCustomers: 99,
      returningCustomers: 99,
      guestOrders: 2,
      customerMetricsAvailable: false,
      newCustomerNetSales: 0,
      returningCustomerNetSales: 0,
      grossSales: 1000,
      grossSalesKnown: true,
    });
    expect(book.newCustomers).toBe(0);
    expect(book.newBuyerShare).toBeNull();
    expect(book.newBuyerArpu).toBeNull();
    expect(book.returningBuyerArpu).toBeNull();
    expect(book.guestShare).toBeCloseTo(0.25);
    expect(book.aov).toBe(125);
    expect(book.returnsDrag).toBeNull();
  });

  it("treats an all-guest period as no identified buyers, not missing flags", () => {
    const book = shopifyNativePeriodStats({
      sales: 400,
      orderCount: 4,
      newCustomers: 0,
      returningCustomers: 0,
      guestOrders: 4,
      customerMetricsAvailable: true,
      newCustomerNetSales: 0,
      returningCustomerNetSales: 0,
      grossSales: 400,
      grossSalesKnown: true,
    });
    expect(book.newBuyerShare).toBeNull();
    expect(book.guestShare).toBe(1);
    expect(book.aov).toBe(100);
  });

  it("returns null AOV when there are no orders", () => {
    const book = shopifyNativePeriodStats({
      sales: 0,
      orderCount: 0,
      newCustomers: 0,
      returningCustomers: 0,
      guestOrders: 0,
      customerMetricsAvailable: true,
      newCustomerNetSales: 0,
      returningCustomerNetSales: 0,
      grossSales: 0,
      grossSalesKnown: true,
    });
    expect(book.aov).toBeNull();
    expect(book.guestShare).toBeNull();
    expect(book.returnsDrag).toBeNull();
  });
});

describe("cashCostPerCustomer", () => {
  it("is spend ÷ identified buyers", () => {
    expect(cashCostPerCustomer(300, 10)).toBe(30);
  });

  it("stays empty without spend or buyers", () => {
    expect(cashCostPerCustomer(0, 10)).toBeNull();
    expect(cashCostPerCustomer(300, 0)).toBeNull();
  });
});
