import { describe, expect, it } from "vitest";
import {
  buildBuyerLedgerRows,
  buildDayLedgerRows,
  buildOrderLedgerRows,
  shortOpaqueId,
  shortOrderId,
  strongestSoftestDayKeys,
} from "./desk-ledgers";
import {
  CUSTOMERS_DESK_SECTIONS,
  SALES_DESK_SECTIONS,
  SALES_LEDGER_FEATURE_IDS,
  deskSectionsForTab,
} from "./desk-sections";
import { SHOPIFY_DEPTH_CATALOG } from "./shopify-depth-catalog";

describe("desk ledgers", () => {
  it("formats day rows and flags missing / open days", () => {
    const rows = buildDayLedgerRows(
      [
        {
          dayKey: "2026-09-10",
          sales: 1200,
          netSales: 1000,
          grossSales: 1300,
          orderCount: 10,
          newCustomers: 4,
          returningCustomers: 6,
          newCustomerSales: 400,
          returningCustomerSales: 600,
          guestOrders: 1,
          customerMetricsAvailable: true,
          asOf: "2026-09-11T12:00:00.000Z",
          source: "shopify",
        },
        {
          dayKey: "2026-09-11",
          sales: 0,
          netSales: null,
          grossSales: null,
          orderCount: 0,
          newCustomers: 0,
          returningCustomers: 0,
          newCustomerSales: 0,
          returningCustomerSales: 0,
          guestOrders: 0,
          customerMetricsAvailable: true,
          asOf: null,
          source: "",
          missing: true,
        },
        {
          dayKey: "2026-09-12",
          sales: 80,
          netSales: null,
          grossSales: null,
          orderCount: 2,
          newCustomers: 1,
          returningCustomers: 1,
          newCustomerSales: 40,
          returningCustomerSales: 40,
          guestOrders: 0,
          customerMetricsAvailable: false,
          asOf: null,
          source: "shopify",
          open: true,
        },
      ],
      "USD",
    );
    expect(rows[0]?.orders).toBe("10");
    expect(rows[0]?.aov).toContain("120");
    expect(rows[1]?.sales).toBe("—");
    expect(rows[1]?.flag).toBe("Missing");
    expect(rows[2]?.flag).toBe("Open");
  });

  it("picks strongest / softest closed days with orders", () => {
    const pick = strongestSoftestDayKeys([
      {
        dayKey: "2026-09-01",
        sales: 100,
        netSales: null,
        grossSales: null,
        orderCount: 2,
        newCustomers: 0,
        returningCustomers: 0,
        newCustomerSales: 0,
        returningCustomerSales: 0,
        guestOrders: 0,
        customerMetricsAvailable: true,
        asOf: null,
        source: "shopify",
      },
      {
        dayKey: "2026-09-02",
        sales: 500,
        netSales: null,
        grossSales: null,
        orderCount: 5,
        newCustomers: 0,
        returningCustomers: 0,
        newCustomerSales: 0,
        returningCustomerSales: 0,
        guestOrders: 0,
        customerMetricsAvailable: true,
        asOf: null,
        source: "shopify",
      },
      {
        dayKey: "2026-09-03",
        sales: 9999,
        netSales: null,
        grossSales: null,
        orderCount: 1,
        newCustomers: 0,
        returningCustomers: 0,
        newCustomerSales: 0,
        returningCustomerSales: 0,
        guestOrders: 0,
        customerMetricsAvailable: true,
        asOf: null,
        source: "shopify",
        open: true,
      },
    ]);
    expect(pick.strongest).toBe("2026-09-02");
    expect(pick.softest).toBe("2026-09-01");
  });

  it("shortens opaque ids without leaking full GIDs", () => {
    expect(shortOpaqueId("guest")).toBe("Guest");
    expect(shortOpaqueId("gid://shopify/Customer/1234567890")).toBe("…567890");
    expect(shortOrderId("gid://shopify/Order/99887766")).toBe("99887766");
    expect(shortOrderId("gid://shopify/Order/123456789012")).toBe("…56789012");
  });

  it("labels order segments and buyer whales", () => {
    const orders = buildOrderLedgerRows(
      [
        {
          shopifyOrderId: "gid://shopify/Order/1",
          dayKey: "2026-09-10",
          orderedAtIso: "2026-09-10T15:00:00.000Z",
          amount: 100,
          discountTotal: 10,
          shippingTotal: 5,
          taxTotal: 8,
          unitCount: 2,
          customerKey: "guest",
          currency: "USD",
          isGuest: true,
          lifetimeOrderRank: null,
        },
        {
          shopifyOrderId: "gid://shopify/Order/2",
          dayKey: "2026-09-10",
          orderedAtIso: "2026-09-10T16:00:00.000Z",
          amount: 200,
          discountTotal: null,
          shippingTotal: null,
          taxTotal: null,
          unitCount: null,
          customerKey: "gid://shopify/Customer/55",
          currency: "USD",
          isGuest: false,
          lifetimeOrderRank: 1,
        },
      ],
      "USD",
    );
    expect(orders[0]?.segment).toBe("Guest");
    expect(orders[1]?.segment).toBe("New");

    const buyers = buildBuyerLedgerRows(
      [
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
      "USD",
    );
    expect(buyers[0]?.segment).toBe("Whale");
    expect(buyers[1]?.segment).toBe("One-and-done");
  });
});

describe("desk sections", () => {
  it("only references real catalog feature ids", () => {
    const catalogIds = new Set(SHOPIFY_DEPTH_CATALOG.map((f) => f.id));
    for (const section of [
      ...SALES_DESK_SECTIONS,
      ...CUSTOMERS_DESK_SECTIONS,
    ]) {
      for (const id of section.featureIds) {
        expect(catalogIds.has(id)).toBe(true);
      }
      if (section.heroFeatureId) {
        expect(section.featureIds).toContain(section.heroFeatureId);
      }
    }
    expect(SALES_LEDGER_FEATURE_IDS.has("day_board")).toBe(true);
    expect(deskSectionsForTab("sales")[0]?.id).toBe("rhythm");
    expect(deskSectionsForTab("customers")[0]?.id).toBe("repeat");
  });
});
