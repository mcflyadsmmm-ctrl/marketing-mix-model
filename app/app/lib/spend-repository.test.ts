import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const upsert = vi.fn();
const transaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
  const tx = {
    spendEntry: {
      findUnique: (args: unknown) => findUnique(args),
      upsert: (args: unknown) => upsert(args),
    },
  };
  return fn(tx);
});

vi.mock("../db.server", () => ({
  default: {
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => transaction(fn),
    spendEntry: {
      findUnique: (args: unknown) => findUnique(args),
      upsert: (args: unknown) => upsert(args),
    },
  },
}));

import {
  createSpendRepository,
  normalizeSpendEntrySource,
} from "./spend-repository.server";

describe("normalizeSpendEntrySource", () => {
  it("maps connector + csv sources to non-sample desk sources", () => {
    expect(normalizeSpendEntrySource("csv")).toBe("csv");
    expect(normalizeSpendEntrySource("manual")).toBe("manual");
    expect(normalizeSpendEntrySource("meta")).toBe("csv");
    expect(normalizeSpendEntrySource("google")).toBe("csv");
    expect(normalizeSpendEntrySource("sample")).toBe("sample");
  });
});

describe("createSpendRepository().upsertSpendDays", () => {
  beforeEach(() => {
    findUnique.mockReset();
    upsert.mockReset();
    transaction.mockClear();
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
    expect(call.create.source).toBe("csv");
    expect(call.update.amount).toBe(100);
    expect(call.update.source).toBe("csv");
  });

  it("skips (no write) when a re-imported day/channel amount and source are unchanged", async () => {
    findUnique.mockResolvedValue({ amount: 250, source: "csv" });

    const repo = createSpendRepository();
    const result = await repo.upsertSpendDays("shop_1", [
      { date: "2026-07-02", channel: "google", amount: 250, currency: "USD", source: "csv" },
    ]);

    expect(result).toEqual({ written: 0, skipped: 1 });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("forces source off sample when CSV overwrites the same amount", async () => {
    findUnique.mockResolvedValue({ amount: 250, source: "sample" });
    upsert.mockResolvedValue({});

    const repo = createSpendRepository();
    const result = await repo.upsertSpendDays("shop_1", [
      { date: "2026-07-02", channel: "google", amount: 250, currency: "USD", source: "csv" },
    ]);

    expect(result).toEqual({ written: 1, skipped: 0 });
    const call = upsert.mock.calls[0][0];
    expect(call.update.source).toBe("csv");
    expect(call.create.source).toBe("csv");

    // Sample OFF (MER/spend where source !== sample): amount stays in aggregate.
    const after = { amount: call.update.amount as number, source: call.update.source as string };
    const sampleOff = [after].filter((row) => row.source !== "sample");
    expect(sampleOff).toHaveLength(1);
    expect(sampleOff[0].amount).toBe(250);
  });

  it("re-importing the same day/channel with a changed amount overwrites, never sums", async () => {
    findUnique.mockResolvedValue({ amount: 100, source: "csv" });
    upsert.mockResolvedValue({});

    const repo = createSpendRepository();
    const result = await repo.upsertSpendDays("shop_1", [
      { date: "2026-07-03", channel: "meta", amount: 175, currency: "USD", source: "csv" },
    ]);

    expect(result).toEqual({ written: 1, skipped: 0 });
    const call = upsert.mock.calls[0][0];
    expect(call.update.amount).toBe(175);
    expect(call.update.source).toBe("csv");
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
