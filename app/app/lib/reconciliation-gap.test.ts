import { describe, expect, it } from "vitest";
import {
  buildReconciliationWindow,
  pastedSpendOverNewCustomers,
  reconciliationDayWindows,
  type ReconciliationOrder,
} from "./reconciliation-gap";

function order(partial: Partial<ReconciliationOrder> & Pick<ReconciliationOrder, "id" | "createdDay">): ReconciliationOrder {
  return {
    name: partial.id,
    processedDay: partial.createdDay,
    netSales: 0,
    grossSales: 0,
    discount: 0,
    refund: 0,
    tax: 0,
    restock: null,
    channel: "Online Store",
    b2b: false,
    draft: false,
    buyer: "new",
    lines: [],
    ...partial,
  };
}

const windowBase = {
  id: "l7" as const,
  label: "Last 7 days",
  since: "2026-09-01",
  until: "2026-09-07",
  status: "checked" as const,
  checkedAt: "2026-09-07T15:00:00.000Z",
  ordersComplete: true,
};

describe("reconciliation gap", () => {
  it("keeps our net sales and the Shopify sales-report total as two totals", () => {
    const view = buildReconciliationWindow({
      ...windowBase,
      reportTotal: 210,
      orders: [
        order({
          id: "1",
          createdDay: "2026-09-01",
          netSales: 100,
          grossSales: 110,
          discount: 10,
          tax: 8,
          buyer: "new",
        }),
        order({
          id: "2",
          createdDay: "2026-09-03",
          netSales: 50,
          grossSales: 50,
          tax: 4,
          buyer: "returning",
        }),
      ],
    });
    expect(view.ourNetSales).toBe(150);
    expect(view.shopifyReportTotal).toBe(210);
    expect(view.ourNetSales).not.toBe(view.shopifyReportTotal);
    expect(view.lines.find((line) => line.id === "tax")?.amount).toBe(12);
    expect(view.ourNetSales).toBe(150);
  });

  it("splits timing, unknown channels, and B2B or draft onto their own orders", () => {
    const view = buildReconciliationWindow({
      ...windowBase,
      reportTotal: 200,
      orders: [
        order({
          id: "late-in",
          createdDay: "2026-08-31",
          processedDay: "2026-09-02",
          netSales: 40,
        }),
        order({
          id: "early-out",
          createdDay: "2026-09-07",
          processedDay: "2026-09-08",
          netSales: 25,
          discount: 5,
        }),
        order({
          id: "unknown",
          createdDay: "2026-09-03",
          netSales: 15,
          channel: null,
          buyer: "unknown",
        }),
        order({
          id: "wholesale",
          createdDay: "2026-09-04",
          netSales: 30,
          b2b: true,
          buyer: "returning",
        }),
        order({
          id: "draft",
          createdDay: "2026-09-05",
          netSales: 12,
          draft: true,
        }),
      ],
    });
    expect(view.ourNetSales).toBe(25 + 15 + 30 + 12);
    const timing = view.lines.find((line) => line.id === "timing");
    expect(timing?.amount).toBe(40 - 25);
    expect(timing?.orders.map((row) => row.id).sort()).toEqual(["early-out", "late-in"]);
    expect(view.lines.find((line) => line.id === "channels")?.amount).toBe(15);
    expect(view.lines.find((line) => line.id === "channels")?.orders[0]?.detail).toBe("unknown");
    expect(view.lines.find((line) => line.id === "b2b_or_draft")?.amount).toBe(42);
    expect(view.lines.find((line) => line.id === "b2b_or_draft")?.orders.map((row) => row.id).sort()).toEqual([
      "draft",
      "wholesale",
    ]);
    expect(view.lines.find((line) => line.id === "discounts")?.orders.map((row) => row.id)).toEqual([
      "early-out",
    ]);
  });

  it("does not paint zero while the read is unfinished or failed", () => {
    const loading = buildReconciliationWindow({
      ...windowBase,
      status: "loading",
      ordersComplete: false,
      reportTotal: 0,
      orders: [order({ id: "1", createdDay: "2026-09-01", netSales: 0, tax: 0 })],
    });
    expect(loading.status).toBe("loading");
    expect(loading.ourNetSales).toBeNull();
    expect(loading.shopifyReportTotal).toBeNull();
    expect(loading.lines.every((line) => line.amount == null)).toBe(true);
    expect(loading.orderCount).toBeNull();

    const failed = buildReconciliationWindow({
      ...windowBase,
      status: "failed",
      ordersComplete: false,
      reportTotal: 0,
      orders: [],
    });
    expect(failed.ourNetSales).toBeNull();
    expect(failed.shopifyReportTotal).toBeNull();
    expect(failed.refundRate).toBeNull();
    expect(failed.orderCount).toBeNull();
  });

  it("leaves a figure blank when Shopify did not send it", () => {
    const view = buildReconciliationWindow({
      ...windowBase,
      reportTotal: null,
      orders: [
        order({
          id: "1",
          createdDay: "2026-09-01",
          netSales: 20,
          grossSales: null,
          tax: null,
          discount: 0,
          refund: 4,
        }),
      ],
    });
    expect(view.shopifyReportTotal).toBeNull();
    expect(view.lines.find((line) => line.id === "tax")?.amount).toBeNull();
    expect(view.refundRate).toBeNull();
    expect(view.restock).toBeNull();
  });

  it("shows restock only when Shopify sent it, and a checked empty shop can be zero", () => {
    const withRestock = buildReconciliationWindow({
      ...windowBase,
      reportTotal: 10,
      orders: [order({ id: "1", createdDay: "2026-09-01", netSales: 10, restock: 3 })],
    });
    expect(withRestock.restock).toBe(3);

    const empty = buildReconciliationWindow({
      ...windowBase,
      reportTotal: 0,
      orders: [],
    });
    expect(empty.status).toBe("checked");
    expect(empty.ourNetSales).toBe(0);
    expect(empty.shopifyReportTotal).toBe(0);
    expect(empty.orderCount).toBe(0);
  });

  it("cuts last 7 days and this month on the shop day", () => {
    expect(reconciliationDayWindows("2026-09-25")).toEqual({
      l7: { since: "2026-09-19", until: "2026-09-25" },
      mtd: { since: "2026-09-01", until: "2026-09-25" },
    });
  });

  it("divides pasted spend by new customers and leaves a missing denominator blank", () => {
    expect(pastedSpendOverNewCustomers(100, 4)).toBe(25);
    expect(pastedSpendOverNewCustomers(100, 0)).toBeNull();
    expect(pastedSpendOverNewCustomers(null, 4)).toBeNull();
    expect(pastedSpendOverNewCustomers(100, null)).toBeNull();
  });
});
