import { describe, expect, it } from "vitest";
import {
  GRAPHQL_COST_BUCKET_DEFAULT,
  GRAPHQL_ORDERS_PAGE_COST_CEILING,
  ORDER_FACT_PAGES_COST_SAFE_CAP,
  graphqlOrderPagesFitCostBucket,
  isGraphqlThrottled,
  waitMsForThrottle,
} from "./shopify-graphql-cost.server";

describe("isGraphqlThrottled", () => {
  it("detects extensions.code THROTTLED", () => {
    expect(
      isGraphqlThrottled([
        { message: "x", extensions: { code: "THROTTLED" } },
      ]),
    ).toBe(true);
  });

  it("detects message containing throttled", () => {
    expect(isGraphqlThrottled([{ message: "Throttled, retry later" }])).toBe(
      true,
    );
  });

  it("returns false for other errors", () => {
    expect(isGraphqlThrottled([{ message: "ACCESS_DENIED" }])).toBe(false);
    expect(isGraphqlThrottled(undefined)).toBe(false);
  });
});

describe("waitMsForThrottle", () => {
  it("uses deficit / restoreRate + 100ms", () => {
    expect(
      waitMsForThrottle({
        requestedQueryCost: 500,
        throttleStatus: { currentlyAvailable: 100, restoreRate: 100 },
      }),
    ).toBe(Math.ceil((400 / 100) * 1000) + 100);
  });

  it("returns 100 when no deficit", () => {
    expect(
      waitMsForThrottle({
        requestedQueryCost: 50,
        throttleStatus: { currentlyAvailable: 200, restoreRate: 100 },
      }),
    ).toBe(100);
  });

  it("falls back to 1000 when metadata missing", () => {
    expect(waitMsForThrottle(undefined)).toBe(1000);
    expect(waitMsForThrottle({})).toBe(1000);
  });
});

describe("OrderFact page cap is cost-safe", () => {
  it("keeps a 40-page kick inside 2× the Admin cost bucket", () => {
    expect(ORDER_FACT_PAGES_COST_SAFE_CAP).toBe(80);
    expect(graphqlOrderPagesFitCostBucket(40)).toBe(true);
    expect(40 * GRAPHQL_ORDERS_PAGE_COST_CEILING).toBeLessThanOrEqual(
      GRAPHQL_COST_BUCKET_DEFAULT * 2,
    );
  });

  it("refuses an unbounded page count", () => {
    expect(graphqlOrderPagesFitCostBucket(10_000)).toBe(false);
    expect(graphqlOrderPagesFitCostBucket(0)).toBe(false);
    expect(graphqlOrderPagesFitCostBucket(-1)).toBe(false);
    expect(graphqlOrderPagesFitCostBucket(Number.POSITIVE_INFINITY)).toBe(
      false,
    );
  });
});
