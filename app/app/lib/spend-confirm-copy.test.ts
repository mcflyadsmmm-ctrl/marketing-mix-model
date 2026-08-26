import { describe, expect, it } from "vitest";
import { spendConfirmLine } from "./spend-confirm-copy";

describe("spendConfirmLine", () => {
  it("names the channel, amount, and day", () => {
    expect(
      spendConfirmLine({
        channels: ["meta"],
        totalAmount: 400,
        dateRange: { start: "2026-08-25", end: "2026-08-25" },
        formatAmount: (n) => `$${n.toFixed(0)}`,
      }),
    ).toBe("Meta $400 for 2026-08-25.");
  });
});
