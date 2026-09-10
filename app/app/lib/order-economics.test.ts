import { describe, expect, it } from "vitest";
import {
  dayOfWeekFromKey,
  filterSalesByDayToPeriod,
  isWeekendDayKey,
  resolveOrderEconomics,
  salesByDayToRecord,
} from "./order-economics";

describe("dayOfWeekFromKey", () => {
  it("reads calendar keys as UTC noon weekdays", () => {
    // 2026-09-10 = Thursday
    expect(dayOfWeekFromKey("2026-09-10")).toBe(4);
    expect(isWeekendDayKey("2026-09-10")).toBe(false);
    // 2026-09-12 = Saturday
    expect(dayOfWeekFromKey("2026-09-12")).toBe(6);
    expect(isWeekendDayKey("2026-09-12")).toBe(true);
    // 2026-09-13 = Sunday
    expect(isWeekendDayKey("2026-09-13")).toBe(true);
  });
});

describe("resolveOrderEconomics", () => {
  it("computes AOV, weekend share, and returning share without spend", () => {
    const econ = resolveOrderEconomics({
      sales: 1000,
      orderCount: 10,
      salesByDay: new Map([
        ["2026-09-10", 400], // Thu
        ["2026-09-11", 200], // Fri
        ["2026-09-12", 300], // Sat
        ["2026-09-13", 100], // Sun
      ]),
      newCustomerSales: 600,
      returningCustomerSales: 400,
    });
    expect(econ.aov).toBe(100);
    expect(econ.weekdaySales).toBe(600);
    expect(econ.weekendSales).toBe(400);
    expect(econ.weekendShare).toBeCloseTo(0.4);
    expect(econ.returningShare).toBeCloseTo(0.4);
    expect(econ.hasSignal).toBe(true);
  });

  it("returns null shares and no signal when empty", () => {
    const econ = resolveOrderEconomics({
      sales: 0,
      orderCount: 0,
      salesByDay: {},
      newCustomerSales: 0,
      returningCustomerSales: 0,
    });
    expect(econ.aov).toBeNull();
    expect(econ.weekendShare).toBeNull();
    expect(econ.returningShare).toBeNull();
    expect(econ.hasSignal).toBe(false);
  });

  it("never invents sessions or conversion fields", () => {
    const econ = resolveOrderEconomics({
      sales: 50,
      orderCount: 2,
      salesByDay: { "2026-09-10": 50 },
      newCustomerSales: 50,
      returningCustomerSales: 0,
    });
    expect(econ).not.toHaveProperty("sessions");
    expect(econ).not.toHaveProperty("conversionRate");
    expect(Object.keys(econ).sort()).toEqual(
      [
        "aov",
        "hasSignal",
        "newCustomerSales",
        "orderCount",
        "returningCustomerSales",
        "returningShare",
        "sales",
        "spendPerOrder",
        "weekdaySales",
        "weekendSales",
        "weekendShare",
      ].sort(),
    );
    expect(econ.spendPerOrder).toBeNull();
  });

  it("joins entered spend into spend-per-order", () => {
    const econ = resolveOrderEconomics({
      sales: 1000,
      orderCount: 10,
      salesByDay: { "2026-09-10": 1000 },
      newCustomerSales: 1000,
      returningCustomerSales: 0,
      totalSpend: 250,
    });
    expect(econ.spendPerOrder).toBe(25);
    expect(econ.aov).toBe(100);
  });

  it("ignores explorer days outside the Overview period for weekend share", () => {
    const econ = resolveOrderEconomics({
      sales: 700,
      orderCount: 7,
      // Explorer window includes prior weekends that must not skew MTD share.
      salesByDay: {
        "2026-08-30": 5000, // Sun — outside Sep MTD
        "2026-09-10": 400, // Thu
        "2026-09-11": 200, // Fri
        "2026-09-12": 100, // Sat
      },
      periodStartKey: "2026-09-01",
      periodEndKey: "2026-09-12",
      newCustomerSales: 400,
      returningCustomerSales: 300,
    });
    expect(econ.weekdaySales).toBe(600);
    expect(econ.weekendSales).toBe(100);
    expect(econ.weekendShare).toBeCloseTo(100 / 700);
  });
});

describe("filterSalesByDayToPeriod", () => {
  it("drops days outside inclusive bounds", () => {
    expect(
      Object.fromEntries(
        filterSalesByDayToPeriod(
          {
            "2026-08-31": 10,
            "2026-09-01": 20,
            "2026-09-15": 30,
            "2026-09-16": 40,
          },
          "2026-09-01",
          "2026-09-15",
        ),
      ),
    ).toEqual({ "2026-09-01": 20, "2026-09-15": 30 });
  });
});

describe("salesByDayToRecord", () => {
  it("drops zero days for lean loader JSON", () => {
    expect(
      salesByDayToRecord(
        new Map([
          ["2026-09-10", 10],
          ["2026-09-11", 0],
        ]),
      ),
    ).toEqual({ "2026-09-10": 10 });
  });
});
