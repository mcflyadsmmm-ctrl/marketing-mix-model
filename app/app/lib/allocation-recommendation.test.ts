/**
 * Trusted Allocation must state a concrete cut/keep call in dollars — the
 * percent mer-core sized, spent against period cash, floored so at least half
 * of period spend keeps running. Never zero, never marginal/causal claims.
 */
import { describe, expect, it } from "vitest";
import { SPEND_FLOOR_PCT, suggestAllocation } from "@mcfly/mer-core";
import {
  ALLOCATION_KEEP_PCT,
  allocationChannelLabel,
  resolveAllocationPlan,
} from "./allocation-recommendation";

describe("resolveAllocationPlan — trusted cut call", () => {
  it("dollarizes the portfolio cut and names what stays live", () => {
    // 2.00× vs 3.00× break-even → mer-core sizes ~35% off period spend.
    const allocation = suggestAllocation({
      channels: [
        { name: "Meta Ads", spend: 700 },
        { name: "Google Ads", spend: 300 },
      ],
      breakEvenMer: 3,
      totalSales: 2000,
      totalSpend: 1000,
    });
    const plan = resolveAllocationPlan(allocation);

    expect(plan?.kind).toBe("cut");
    expect(plan?.scopeLabel).toBe("Portfolio");
    expect(plan?.cutPct).toBe(35);
    expect(plan?.cutAmount).toBe(350);
    expect(plan?.keepAmount).toBe(650);
    expect(plan?.keepFloor).toBe(500);
    expect(plan?.headline).toContain("$350");
    expect(plan?.headline).toMatch(/^Cut Portfolio spend by \$350 \(~35%\)/);
    expect(plan?.headline).toContain(`${allocation.suggestedTestDays} days`);
    expect(plan?.keepLine).toContain("$650");
    expect(plan?.keepLine).toContain("$500");
    expect(plan?.keepLine).toContain(`${ALLOCATION_KEEP_PCT}% of period spend`);
    expect(plan?.keepLine).toMatch(/never zero/i);
  });

  it("never cuts past the keep floor, however far below break-even", () => {
    // 0.10× vs 4.00× would algebraically say "cut 97%".
    const allocation = suggestAllocation({
      channels: [{ name: "Meta Ads", spend: 2000 }],
      breakEvenMer: 4,
      totalSales: 200,
      totalSpend: 2000,
    });
    const plan = resolveAllocationPlan(allocation);

    expect(plan?.kind).toBe("cut");
    expect(plan?.cutPct).toBe(SPEND_FLOOR_PCT);
    expect(plan?.cutAmount).toBe(1000);
    expect(plan?.keepAmount).toBe(1000);
    expect(plan?.keepAmount).toBeGreaterThanOrEqual(plan!.keepFloor);
    expect(plan?.cutAmount).toBeLessThanOrEqual(2000 / 2);
  });

  it("scopes the cut to the weakest channel when operator cash splits exist", () => {
    const allocation = suggestAllocation({
      channels: [
        { name: "Meta Ads", spend: 600, salesContribution: 600 },
        { name: "Google Ads", spend: 400, salesContribution: 1400 },
      ],
      breakEvenMer: 3,
      totalSales: 2000,
      totalSpend: 1000,
    });
    const plan = resolveAllocationPlan(allocation);

    expect(plan?.kind).toBe("cut");
    expect(plan?.scopeLabel).toBe("Meta Ads");
    expect(plan?.scopeSpend).toBe(600);
    // 35% of the channel, not of the portfolio.
    expect(plan?.cutAmount).toBe(210);
    expect(plan?.keepAmount).toBe(790);
    expect(plan?.keepAmount).toBeGreaterThanOrEqual(plan!.keepFloor);
    expect(plan?.redeployLine).toContain("Google Ads");
    expect(plan?.redeployLine).toMatch(/not path credit/i);
  });

  it("keeps a channel cut inside the period floor when one channel is the portfolio", () => {
    const allocation = suggestAllocation({
      channels: [{ name: "Meta Ads", spend: 1000, salesContribution: 100 }],
      breakEvenMer: 4,
      totalSales: 100,
      totalSpend: 1000,
    });
    const plan = resolveAllocationPlan(allocation);

    expect(plan?.scopeLabel).toBe("Meta Ads");
    expect(plan?.cutAmount).toBe(500);
    expect(plan?.keepAmount).toBe(500);
    expect(plan?.keepAmount).toBeGreaterThanOrEqual(plan!.keepFloor);
  });
});

describe("resolveAllocationPlan — trusted keep call", () => {
  it("says keep all of it, with the averages it is reading", () => {
    const allocation = suggestAllocation({
      channels: [{ name: "Meta Ads", spend: 1000 }],
      breakEvenMer: 3,
      totalSales: 4000,
      totalSpend: 1000,
    });
    const plan = resolveAllocationPlan(allocation);

    expect(plan?.kind).toBe("keep");
    expect(plan?.cutAmount).toBeNull();
    expect(plan?.cutPct).toBeNull();
    expect(plan?.keepAmount).toBe(1000);
    expect(plan?.headline).toContain("Keep all $1,000");
    expect(plan?.keepLine).toContain("4.00");
    expect(plan?.keepLine).toContain("3.00");
    expect(plan?.keepLine).toMatch(/averages/i);
    expect(plan?.redeployLine).toBeNull();
  });
});

describe("resolveAllocationPlan — nothing to size", () => {
  it("returns null without an allocation (the page locks instead)", () => {
    expect(resolveAllocationPlan(null)).toBeNull();
  });

  it("refuses a call when the period has no spend", () => {
    const allocation = suggestAllocation({
      channels: [],
      breakEvenMer: 3,
      totalSales: 5000,
      totalSpend: 0,
    });
    const plan = resolveAllocationPlan(allocation);

    expect(plan?.kind).toBe("unavailable");
    expect(plan?.cutAmount).toBeNull();
    expect(plan?.keepAmount).toBe(0);
    expect(plan?.headline).toMatch(/no spend logged/i);
  });
});

describe("allocationChannelLabel", () => {
  it("maps stored channel codes and leaves display names alone", () => {
    expect(allocationChannelLabel("meta")).toBe("Meta Ads");
    expect(allocationChannelLabel("Meta Ads")).toBe("Meta Ads");
  });
});
