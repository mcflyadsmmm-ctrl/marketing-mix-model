import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueShop = vi.fn();
const countOrderFact = vi.fn();
const findManyOrderFact = vi.fn();
const deleteManyOrderFact = vi.fn();
const createComplianceDataExport = vi.fn();
const deleteManyComplianceDataExport = vi.fn();
const recomputeCohortFacts = vi.fn();

vi.mock("../db.server", () => ({
  default: {
    shop: {
      findUnique: (...args: unknown[]) => findUniqueShop(...args),
    },
    orderFact: {
      count: (...args: unknown[]) => countOrderFact(...args),
      findMany: (...args: unknown[]) => findManyOrderFact(...args),
      deleteMany: (...args: unknown[]) => deleteManyOrderFact(...args),
    },
    complianceDataExport: {
      create: (...args: unknown[]) => createComplianceDataExport(...args),
      deleteMany: (...args: unknown[]) => deleteManyComplianceDataExport(...args),
    },
  },
}));

vi.mock("./order-facts.server", () => ({
  recomputeCohortFacts: (...args: unknown[]) => recomputeCohortFacts(...args),
}));

vi.mock("./compliance-export-retrieve.server", () => ({
  purgeExpiredComplianceDataExports: vi.fn().mockResolvedValue(0),
}));

import {
  countCustomerOrderFacts,
  customerKeyVariants,
  extractCustomerIdFromPayload,
  extractOrdersToRedactFromPayload,
  fulfillCustomerDataRequest,
  normalizeCustomerNumericId,
  normalizeOrderNumericId,
  orderIdVariants,
  redactCustomerOrderFacts,
} from "./compliance-redact.server";

describe("customerKeyVariants", () => {
  it("builds numeric + GID variants from a REST id", () => {
    expect(customerKeyVariants(191167)).toEqual([
      "191167",
      "gid://shopify/Customer/191167",
    ]);
  });

  it("normalizes GID input to the same variants", () => {
    expect(customerKeyVariants("gid://shopify/Customer/42")).toEqual([
      "42",
      "gid://shopify/Customer/42",
    ]);
  });

  it("returns empty for missing / garbage ids", () => {
    expect(customerKeyVariants(null)).toEqual([]);
    expect(customerKeyVariants("")).toEqual([]);
    expect(customerKeyVariants("not-a-customer")).toEqual([]);
  });
});

describe("normalizeCustomerNumericId / normalizeOrderNumericId", () => {
  it("accepts numeric strings and GIDs", () => {
    expect(normalizeCustomerNumericId(99)).toBe("99");
    expect(normalizeCustomerNumericId("99")).toBe("99");
    expect(normalizeCustomerNumericId("gid://shopify/Customer/99")).toBe("99");
    expect(normalizeOrderNumericId(299938)).toBe("299938");
    expect(normalizeOrderNumericId("gid://shopify/Order/299938")).toBe("299938");
  });
});

describe("orderIdVariants / extractOrdersToRedactFromPayload", () => {
  it("builds numeric + Order GID variants", () => {
    expect(orderIdVariants(299938)).toEqual([
      "299938",
      "gid://shopify/Order/299938",
    ]);
  });

  it("extracts and expands orders_to_redact from payload", () => {
    expect(
      extractOrdersToRedactFromPayload({
        shop_id: 954889,
        customer: { id: 191167 },
        orders_to_redact: [299938, "gid://shopify/Order/100"],
      }),
    ).toEqual([
      "299938",
      "gid://shopify/Order/299938",
      "100",
      "gid://shopify/Order/100",
    ]);
  });

  it("returns empty when orders_to_redact absent", () => {
    expect(extractOrdersToRedactFromPayload({})).toEqual([]);
    expect(extractOrdersToRedactFromPayload(null)).toEqual([]);
  });
});

describe("extractCustomerIdFromPayload", () => {
  it("reads Shopify customers/redact shape", () => {
    expect(
      extractCustomerIdFromPayload({
        shop_id: 954889,
        shop_domain: "example.myshopify.com",
        customer: { id: 191167, email: "john@example.com", phone: "555" },
        orders_to_redact: [299938],
      }),
    ).toBe("191167");
  });

  it("accepts customer GID and top-level customer_id", () => {
    expect(
      extractCustomerIdFromPayload({
        customer: { id: "gid://shopify/Customer/7" },
      }),
    ).toBe("7");
    expect(extractCustomerIdFromPayload({ customer_id: 55 })).toBe("55");
  });

  it("returns null when customer id absent", () => {
    expect(extractCustomerIdFromPayload({})).toBeNull();
    expect(extractCustomerIdFromPayload(null)).toBeNull();
  });
});

describe("redactCustomerOrderFacts / fulfillCustomerDataRequest", () => {
  beforeEach(() => {
    findUniqueShop.mockReset();
    countOrderFact.mockReset();
    findManyOrderFact.mockReset();
    deleteManyOrderFact.mockReset();
    createComplianceDataExport.mockReset();
    deleteManyComplianceDataExport.mockReset();
    deleteManyComplianceDataExport.mockResolvedValue({ count: 0 });
    recomputeCohortFacts.mockReset();
    recomputeCohortFacts.mockResolvedValue([]);
  });

  it("deleteMany matches shop + customerKey OR shopifyOrderId variants", async () => {
    findUniqueShop.mockResolvedValue({ id: "shop_1" });
    deleteManyOrderFact.mockResolvedValue({ count: 3 });

    const result = await redactCustomerOrderFacts(
      "example.myshopify.com",
      191167,
      ["299938", "gid://shopify/Order/299938"],
    );

    expect(result).toEqual({
      shopId: "shop_1",
      keys: ["191167", "gid://shopify/Customer/191167"],
      orderIds: ["299938", "gid://shopify/Order/299938"],
      deleted: 3,
    });
    expect(deleteManyOrderFact).toHaveBeenCalledWith({
      where: {
        shopId: "shop_1",
        OR: [
          {
            customerKey: {
              in: ["191167", "gid://shopify/Customer/191167"],
            },
          },
          {
            shopifyOrderId: {
              in: ["299938", "gid://shopify/Order/299938"],
            },
          },
        ],
      },
    });
    expect(recomputeCohortFacts).toHaveBeenCalledWith("shop_1");
    expect(deleteManyComplianceDataExport).toHaveBeenCalledWith({
      where: {
        shopDomain: "example.myshopify.com",
        customerNumericId: "191167",
      },
    });
  });

  it("deletes guest orders via orders_to_redact when customer id missing", async () => {
    findUniqueShop.mockResolvedValue({ id: "shop_1" });
    deleteManyOrderFact.mockResolvedValue({ count: 1 });

    const orderIds = extractOrdersToRedactFromPayload({
      orders_to_redact: [555001],
    });
    const result = await redactCustomerOrderFacts(
      "example.myshopify.com",
      null,
      orderIds,
    );

    expect(result.deleted).toBe(1);
    expect(result.keys).toEqual([]);
    expect(result.orderIds).toEqual([
      "555001",
      "gid://shopify/Order/555001",
    ]);
    expect(deleteManyOrderFact).toHaveBeenCalledWith({
      where: {
        shopId: "shop_1",
        OR: [
          {
            shopifyOrderId: {
              in: ["555001", "gid://shopify/Order/555001"],
            },
          },
        ],
      },
    });
    expect(recomputeCohortFacts).toHaveBeenCalledWith("shop_1");
  });

  it("fulfills data_request with Level-1 package + ComplianceDataExport", async () => {
    findUniqueShop.mockResolvedValue({ id: "shop_1" });
    findManyOrderFact.mockResolvedValue([
      {
        shopifyOrderId: "gid://shopify/Order/9",
        amount: 42.5,
        orderedAt: new Date("2026-01-15T12:00:00.000Z"),
        shopLocalDate: new Date("2026-01-15T00:00:00.000Z"),
        currency: "USD",
        customerKey: "gid://shopify/Customer/191167",
      },
    ]);
    createComplianceDataExport.mockResolvedValue({ id: "export_1" });

    const result = await fulfillCustomerDataRequest(
      "example.myshopify.com",
      "gid://shopify/Customer/191167",
    );

    expect(result).toEqual({
      shopId: "shop_1",
      keys: ["191167", "gid://shopify/Customer/191167"],
      count: 1,
      exportId: "export_1",
    });
    expect(findManyOrderFact).toHaveBeenCalledWith({
      where: {
        shopId: "shop_1",
        customerKey: {
          in: ["191167", "gid://shopify/Customer/191167"],
        },
      },
      select: {
        shopifyOrderId: true,
        amount: true,
        orderedAt: true,
        shopLocalDate: true,
        currency: true,
        customerKey: true,
      },
      orderBy: { orderedAt: "asc" },
    });
    expect(createComplianceDataExport).toHaveBeenCalledWith({
      data: {
        shopDomain: "example.myshopify.com",
        shopId: "shop_1",
        customerNumericId: "191167",
        orderFactCount: 1,
        packageJson: JSON.stringify([
          {
            shopifyOrderId: "gid://shopify/Order/9",
            amount: 42.5,
            orderedAt: "2026-01-15T12:00:00.000Z",
            customerKey: "gid://shopify/Customer/191167",
            shopLocalDate: "2026-01-15",
            currency: "USD",
          },
        ]),
      },
      select: { id: true },
    });
  });

  it("counts opaque facts via thin helper", async () => {
    findUniqueShop.mockResolvedValue({ id: "shop_1" });
    countOrderFact.mockResolvedValue(2);

    const result = await countCustomerOrderFacts(
      "example.myshopify.com",
      "gid://shopify/Customer/191167",
    );

    expect(result.count).toBe(2);
    expect(countOrderFact).toHaveBeenCalledWith({
      where: {
        shopId: "shop_1",
        customerKey: {
          in: ["191167", "gid://shopify/Customer/191167"],
        },
      },
    });
  });

  it("returns deleted 0 when shop is missing", async () => {
    findUniqueShop.mockResolvedValue(null);
    const result = await redactCustomerOrderFacts("gone.myshopify.com", 1);
    expect(result.deleted).toBe(0);
    expect(deleteManyOrderFact).not.toHaveBeenCalled();
    expect(recomputeCohortFacts).not.toHaveBeenCalled();
  });

  it("skips cohort recompute when nothing deleted", async () => {
    findUniqueShop.mockResolvedValue({ id: "shop_1" });
    deleteManyOrderFact.mockResolvedValue({ count: 0 });

    await redactCustomerOrderFacts("example.myshopify.com", 191167);

    expect(recomputeCohortFacts).not.toHaveBeenCalled();
  });
});
