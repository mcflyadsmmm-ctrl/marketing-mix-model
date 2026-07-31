/**
 * OrderFact ingest amount must match desk orderNetAmount semantics so till LTV
 * / cohorts do not undercount when currentTotal is empty string (NaN→0 bug).
 *
 * Day-complete seals: refunds/cancels must clear `__day_complete__` so backfill
 * re-crawls nets — otherwise LTV stays stale forever after the first seal.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { orderNetAmount } from "./shopify-sales.server";

const deleteManyOrderFact = vi.fn();

vi.mock("../db.server", () => ({
  default: {
    orderFact: {
      deleteMany: (...args: unknown[]) => deleteManyOrderFact(...args),
    },
  },
}));

import {
  ORDER_FACT_DAY_COMPLETE_PREFIX,
  ORDER_FACT_SOURCE,
  clearOrderFactDayCompleteSeal,
  orderFactDayCompleteMarkerId,
} from "./order-facts.server";

const here = dirname(fileURLToPath(import.meta.url));
const orderFactsSource = readFileSync(
  join(here, "order-facts.server.ts"),
  "utf8",
);

describe("OrderFact amount = orderNetAmount", () => {
  it("reuses orderNetAmount (no local parseFloat coalesce)", () => {
    expect(orderFactsSource).toContain("orderNetAmount");
    expect(orderFactsSource).toMatch(/amount\s*=\s*orderNetAmount\(/);
    expect(orderFactsSource).not.toMatch(
      /parseFloat\(\s*netRaw\s*\?\?\s*grossRaw/,
    );
  });

  it("falls back to gross when currentTotal amount is empty string", () => {
    // Regression: "" ?? gross → "" → parseFloat → NaN → 0 undercount.
    expect(
      orderNetAmount({
        totalPriceSet: { shopMoney: { amount: "120.00" } },
        currentTotalPriceSet: { shopMoney: { amount: "" } },
      }),
    ).toBe(120);
  });

  it("keeps fully refunded currentTotal=0 (never falls back to gross)", () => {
    expect(
      orderNetAmount({
        totalPriceSet: { shopMoney: { amount: "120.00" } },
        currentTotalPriceSet: { shopMoney: { amount: "0.00" } },
      }),
    ).toBe(0);
  });

  it("uses positive net when present", () => {
    expect(
      orderNetAmount({
        totalPriceSet: { shopMoney: { amount: "120.00" } },
        currentTotalPriceSet: { shopMoney: { amount: "95.50" } },
      }),
    ).toBe(95.5);
  });
});

describe("orderFactDayCompleteMarkerId", () => {
  it("builds the seal id backfill writes and skips", () => {
    expect(orderFactDayCompleteMarkerId("2026-07-20")).toBe(
      `${ORDER_FACT_DAY_COMPLETE_PREFIX}2026-07-20`,
    );
    expect(ORDER_FACT_DAY_COMPLETE_PREFIX).toBe("__day_complete__:");
  });
});

describe("clearOrderFactDayCompleteSeal", () => {
  beforeEach(() => {
    deleteManyOrderFact.mockReset();
    deleteManyOrderFact.mockResolvedValue({ count: 1 });
  });

  it("deletes only the live seal marker for shop + day", async () => {
    const n = await clearOrderFactDayCompleteSeal("shop_1", "2026-07-20");
    expect(n).toBe(1);
    expect(deleteManyOrderFact).toHaveBeenCalledWith({
      where: {
        shopId: "shop_1",
        source: ORDER_FACT_SOURCE,
        shopifyOrderId: "__day_complete__:2026-07-20",
      },
    });
  });

  it("returns 0 and skips DB when dayKey is not YYYY-MM-DD (fail closed)", async () => {
    expect(await clearOrderFactDayCompleteSeal("shop_1", "")).toBe(0);
    expect(await clearOrderFactDayCompleteSeal("shop_1", "2026/07/20")).toBe(0);
    expect(await clearOrderFactDayCompleteSeal("shop_1", "not-a-day")).toBe(0);
    expect(await clearOrderFactDayCompleteSeal("", "2026-07-20")).toBe(0);
    expect(deleteManyOrderFact).not.toHaveBeenCalled();
  });

  it("returns 0 when no seal row exists (idempotent dirty)", async () => {
    deleteManyOrderFact.mockResolvedValue({ count: 0 });
    expect(await clearOrderFactDayCompleteSeal("shop_1", "2026-07-20")).toBe(0);
    expect(deleteManyOrderFact).toHaveBeenCalledOnce();
  });
});
