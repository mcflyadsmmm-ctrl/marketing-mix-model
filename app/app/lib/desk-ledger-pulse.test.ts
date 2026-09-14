import { describe, expect, it } from "vitest";
import {
  buildBuyerLedgerPulse,
  buildCohortLedgerPulse,
  buildDayLedgerPulse,
  buildOrderLedgerPulse,
  serializeLedgerCsv,
} from "./desk-ledger-pulse";

describe("desk ledger pulse", () => {
  it("builds a day decision strip with sales/orders KPIs", () => {
    const pulse = buildDayLedgerPulse({
      periodLabel: "This month",
      periodPreset: "mtd",
      currencyCode: "USD",
      rows: [
        {
          dayKey: "2026-09-01",
          sales: 1000,
          netSales: 900,
          grossSales: 1100,
          orderCount: 10,
          newCustomers: 4,
          returningCustomers: 6,
          newCustomerSales: 400,
          returningCustomerSales: 600,
          guestOrders: 1,
          customerMetricsAvailable: true,
          asOf: null,
          source: "shopify",
        },
        {
          dayKey: "2026-09-02",
          sales: 400,
          netSales: 380,
          grossSales: 420,
          orderCount: 4,
          newCustomers: 1,
          returningCustomers: 3,
          newCustomerSales: 100,
          returningCustomerSales: 300,
          guestOrders: 0,
          customerMetricsAvailable: true,
          asOf: null,
          source: "shopify",
        },
      ],
    });
    expect(pulse).not.toBeNull();
    expect(pulse!.kicker).toContain("Days");
    expect(pulse!.kpis.some((k) => k.id === "sales")).toBe(true);
  });

  it("flags discount dependency on the order desk", () => {
    const pulse = buildOrderLedgerPulse({
      periodLabel: "Last 7 days",
      periodPreset: "l7d",
      totalMatched: 2,
      currencyCode: "USD",
      rows: [
        {
          shopifyOrderId: "1",
          dayKey: "2026-09-01",
          orderedAtIso: "2026-09-01T12:00:00.000Z",
          amount: 100,
          discountTotal: 30,
          shippingTotal: 5,
          taxTotal: 8,
          unitCount: 2,
          customerKey: "a",
          currency: "USD",
          isGuest: false,
          lifetimeOrderRank: 2,
        },
        {
          shopifyOrderId: "2",
          dayKey: "2026-09-02",
          orderedAtIso: "2026-09-02T12:00:00.000Z",
          amount: 100,
          discountTotal: 25,
          shippingTotal: 0,
          taxTotal: 0,
          unitCount: 1,
          customerKey: "b",
          currency: "USD",
          isGuest: false,
          lifetimeOrderRank: 1,
        },
      ],
    });
    expect(pulse).not.toBeNull();
    expect(pulse!.tone).toBe("watch");
    expect(pulse!.takeaway.toLowerCase()).toMatch(/discount/);
  });

  it("surfaces repeat rate on the buyer desk", () => {
    const pulse = buildBuyerLedgerPulse({
      periodLabel: "This month",
      periodPreset: "mtd",
      totalBuyers: 2,
      currencyCode: "USD",
      rows: [
        {
          customerKey: "a",
          firstDayKey: "2026-01-01",
          lastDayKey: "2026-09-01",
          orderCount: 5,
          lifetimeSales: 1000,
          periodSales: 500,
          daysToSecond: 12,
        },
        {
          customerKey: "b",
          firstDayKey: "2026-08-01",
          lastDayKey: "2026-08-01",
          orderCount: 1,
          lifetimeSales: 40,
          periodSales: 40,
          daysToSecond: null,
        },
      ],
    });
    expect(pulse).not.toBeNull();
    expect(pulse!.kpis.some((k) => k.id === "repeat" || k.id === "buyers")).toBe(
      true,
    );
  });

  it("compares latest cohort LTV to prior", () => {
    const pulse = buildCohortLedgerPulse({
      currencyCode: "USD",
      rows: [
        {
          cohortMonth: "2026-08",
          customers: 100,
          revenueD30: 5000,
          revenueD90: 12000,
          revenueD365: 20000,
          ordersD30: 110,
          ordersD90: 150,
          ordersD365: 180,
        },
        {
          cohortMonth: "2026-07",
          customers: 100,
          revenueD30: 5000,
          revenueD90: 10000,
          revenueD365: 18000,
          ordersD30: 105,
          ordersD90: 140,
          ordersD365: 170,
        },
      ],
    });
    expect(pulse).not.toBeNull();
    expect(pulse!.takeaway).toContain("2026-08");
  });

  it("serializes ledger rows to csv", () => {
    const csv = serializeLedgerCsv(
      [
        { key: "a", label: "A" },
        { key: "b", label: "B" },
      ],
      [{ a: "1", b: "hello, world" }],
    );
    expect(csv).toContain("A,B");
    expect(csv).toContain('"hello, world"');
  });
});
