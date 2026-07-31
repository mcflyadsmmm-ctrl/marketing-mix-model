import { describe, expect, it, afterEach } from "vitest";
import {
  billingStatusCopy,
  freeSpendImportDailyCap,
  isBillingEnabled,
  PRO_PLAN,
} from "./billing-flag.server";

const keys = [
  "MCFLY_BILLING",
  "MCFLY_FREE_SPEND_IMPORT_CAP",
] as const;

afterEach(() => {
  for (const k of keys) delete process.env[k];
});

describe("billing flags", () => {
  it("defaults billing off", () => {
    expect(isBillingEnabled()).toBe(false);
    expect(billingStatusCopy(false).tier).toBe("free");
    expect(billingStatusCopy(false).detail).toMatch(/No charges/i);
  });

  it("enables only when MCFLY_BILLING=1", () => {
    process.env.MCFLY_BILLING = "1";
    expect(isBillingEnabled()).toBe(true);
    expect(billingStatusCopy(true).tier).toBe("pro");
  });

  it("parses free import cap", () => {
    expect(freeSpendImportDailyCap()).toBe(0);
    process.env.MCFLY_FREE_SPEND_IMPORT_CAP = "12";
    expect(freeSpendImportDailyCap()).toBe(12);
  });

  it("locks Pro at $39 flat (launch)", () => {
    expect(PRO_PLAN.amount).toBe(39);
    expect(PRO_PLAN.interval).toBe("EVERY_30_DAYS");
  });
});
