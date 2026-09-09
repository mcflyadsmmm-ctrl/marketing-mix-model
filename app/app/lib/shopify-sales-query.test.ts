import { describe, expect, it } from "vitest";
import {
  includeOrderInSalesSoT,
  orderCreatedInRange,
  shopifySearchHasWarnings,
} from "./shopify-sales-query";

describe("includeOrderInSalesSoT", () => {
  it("keeps open, closed, and test orders — only cancelled drop", () => {
    expect(includeOrderInSalesSoT({ cancelledAt: null })).toBe(true);
    expect(includeOrderInSalesSoT({ cancelledAt: undefined })).toBe(true);
    expect(includeOrderInSalesSoT({ cancelledAt: "" })).toBe(true);
    expect(includeOrderInSalesSoT({ cancelledAt: "2026-09-08T12:00:00Z" })).toBe(
      false,
    );
  });
});

describe("orderCreatedInRange", () => {
  const mtd = {
    start: new Date("2026-09-01T00:00:00.000Z"),
    end: new Date("2026-09-09T23:59:59.999Z"),
  };

  it("counts the 7-order MTD smoke window and drops out-of-range", () => {
    expect(orderCreatedInRange("2026-09-03T18:00:00.000Z", mtd)).toBe(true);
    expect(orderCreatedInRange("2026-08-31T23:59:59.000Z", mtd)).toBe(false);
    expect(orderCreatedInRange("2026-09-10T00:00:00.000Z", mtd)).toBe(false);
  });
});

describe("shopifySearchHasWarnings", () => {
  it("treats extensions.search warnings as an invalid query (not a trusted $0)", () => {
    expect(
      shopifySearchHasWarnings({
        search: [
          {
            path: ["orders"],
            warnings: [
              { field: "19", message: "Invalid search field for this query." },
            ],
          },
        ],
      }),
    ).toBe(true);
    expect(shopifySearchHasWarnings({ search: [{ path: ["orders"] }] })).toBe(
      false,
    );
    expect(shopifySearchHasWarnings(undefined)).toBe(false);
  });
});
