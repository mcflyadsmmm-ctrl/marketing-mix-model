import { describe, expect, it } from "vitest";
import { SHARE_MIN_ORDERS } from "./shareable-insights";
import { deskScale } from "./desk-scale";

describe("deskScale", () => {
  it("keeps a 12-order 0-repeat 0-spend shop on orders, not repeats or spend", () => {
    const scale = deskScale({
      orderCount: 12,
      identifiedBuyers: 12,
      returningBuyers: 0,
      returningSales: 0,
      hasPriorYear: false,
      historyLimited: true,
      hasSpend: false,
    });
    expect(scale).toEqual({
      universal: true,
      hasOrders: true,
      hasBuyers: true,
      hasRepeats: false,
      hasPriorYear: false,
      hasCohortDesk: 12 >= SHARE_MIN_ORDERS,
      hasLtvYear: false,
      hasSpend: false,
    });
    expect(SHARE_MIN_ORDERS).toBe(8);
  });

  it("opens the full SAMPLE-like desk when orders, repeats, year, and spend exist", () => {
    const scale = deskScale({
      orderCount: 480,
      identifiedBuyers: 86,
      returningBuyers: 22,
      returningSales: 18420,
      hasPriorYear: true,
      historyLimited: false,
      hasSpend: true,
    });
    expect(scale).toEqual({
      universal: true,
      hasOrders: true,
      hasBuyers: true,
      hasRepeats: true,
      hasPriorYear: true,
      hasCohortDesk: true,
      hasLtvYear: true,
      hasSpend: true,
    });
  });

  it("treats guest-only orders as buyers for the desk, not a cohort", () => {
    const scale = deskScale({
      orderCount: 12,
      identifiedBuyers: 0,
      returningBuyers: 0,
      returningSales: 0,
      hasPriorYear: false,
      historyLimited: false,
      hasSpend: false,
    });
    expect(scale.hasBuyers).toBe(true);
    expect(scale.hasCohortDesk).toBe(false);
    expect(scale.hasLtvYear).toBe(false);
  });
});
