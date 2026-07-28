import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueShop = vi.fn();
const countOrderFact = vi.fn();
const deleteManyOrderFact = vi.fn();

vi.mock("../db.server", () => ({
  default: {
    shop: {
      findUnique: (...args: unknown[]) => findUniqueShop(...args),
    },
    orderFact: {
      count: (...args: unknown[]) => countOrderFact(...args),
      deleteMany: (...args: unknown[]) => deleteManyOrderFact(...args),
    },
  },
}));

import {
  countCustomerOrderFacts,
  customerKeyVariants,
  extractCustomerIdFromPayload,
  normalizeCustomerNumericId,
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

describe("normalizeCustomerNumericId", () => {
  it("accepts numeric strings and GIDs", () => {
    expect(normalizeCustomerNumericId(99)).toBe("99");
    expect(normalizeCustomerNumericId("99")).toBe("99");
    expect(normalizeCustomerNumericId("gid://shopify/Customer/99")).toBe("99");
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

describe("redactCustomerOrderFacts / countCustomerOrderFacts", () => {
  beforeEach(() => {
    findUniqueShop.mockReset();
    countOrderFact.mockReset();
    deleteManyOrderFact.mockReset();
  });

  it("deleteMany matches shop + both customerKey variants", async () => {
    findUniqueShop.mockResolvedValue({ id: "shop_1" });
    deleteManyOrderFact.mockResolvedValue({ count: 3 });

    const result = await redactCustomerOrderFacts(
      "example.myshopify.com",
      191167,
    );

    expect(result).toEqual({
      shopId: "shop_1",
      keys: ["191167", "gid://shopify/Customer/191167"],
      deleted: 3,
    });
    expect(deleteManyOrderFact).toHaveBeenCalledWith({
      where: {
        shopId: "shop_1",
        customerKey: {
          in: ["191167", "gid://shopify/Customer/191167"],
        },
      },
    });
  });

  it("counts opaque facts for data_request without claiming empty CRM erase", async () => {
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
  });
});
