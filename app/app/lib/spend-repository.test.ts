import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const upsert = vi.fn();

vi.mock("../db.server", () => ({
  default: {
    spendEntry: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      upsert: (...args: unknown[]) => upsert(...args),
    },
  },
}));

import { createSpendRepository } from "./spend-repository.server";

describe("createSpendRepository().upsertSpendDays", () => {
  beforeEach(() => {
    findUnique.mockReset();
    upsert.mockReset();
  });

  it("upserts on the shopId_channel_periodStart unique key (latest write wins)", async () => {
    findUnique.mockResolvedValue(null);
    upsert.mockResolvedValue({});

    const repo = createSpendRepository();
    const result = await repo.upsertSpendDays("shop_1", [
      { date: "2026-07-01", channel: "meta", amount: 100, currency: "USD", source: "csv" },
    ]);

    expect(result).toEqual({ written: 1, skipped: 0 });
    expect(upsert).toHaveBeenCalledOnce();
    const call = upsert.mock.calls[0][0];
    expect(call.where.shopId_channel_periodStart).toEqual({
      shopId: "shop_1",
      channel: "meta",
      periodStart: new Date(2026, 6, 1),
    });
    expect(call.create.amount).toBe(100);
    expect(call.update.amount).toBe(100);
  });

  it("skips (no write) when a re-imported day/channel amount is unchanged", async () => {
    findUnique.mockResolvedValue({ amount: 250 });

    const repo = createSpendRepository();
    const result = await repo.upsertSpendDays("shop_1", [
      { date: "2026-07-02", channel: "google", amount: 250, currency: "USD", source: "csv" },
    ]);

    expect(result).toEqual({ written: 0, skipped: 1 });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("re-importing the same day/channel with a changed amount overwrites, never sums", async () => {
    findUnique.mockResolvedValue({ amount: 100 });
    upsert.mockResolvedValue({});

    const repo = createSpendRepository();
    const result = await repo.upsertSpendDays("shop_1", [
      { date: "2026-07-03", channel: "meta", amount: 175, currency: "USD", source: "csv" },
    ]);

    expect(result).toEqual({ written: 1, skipped: 0 });
    const call = upsert.mock.calls[0][0];
    // Update payload sets the new amount directly — no addition to the prior 100.
    expect(call.update.amount).toBe(175);
  });

  it("normalizes aliased channel names before upserting (facebook -> meta)", async () => {
    findUnique.mockResolvedValue(null);
    upsert.mockResolvedValue({});

    const repo = createSpendRepository();
    await repo.upsertSpendDays("shop_1", [
      { date: "2026-07-04", channel: "facebook", amount: 50, currency: "USD", source: "csv" },
    ]);

    const call = upsert.mock.calls[0][0];
    expect(call.where.shopId_channel_periodStart.channel).toBe("meta");
  });
});
