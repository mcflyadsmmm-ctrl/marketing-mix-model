import { describe, expect, it } from "vitest";
import {
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
