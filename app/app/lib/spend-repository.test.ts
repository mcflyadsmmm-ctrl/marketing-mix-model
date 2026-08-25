import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
const createMany = vi.fn();
const update = vi.fn();
const shopFindUnique = vi.fn();
const transaction = vi.fn(
  async (
    fn: (tx: unknown) => Promise<unknown>,
    _opts?: { timeout?: number; maxWait?: number },
  ) => {
    const tx = {
      spendEntry: {
        findMany: (args: unknown) => findMany(args),
        createMany: (args: unknown) => createMany(args),
        update: (args: unknown) => update(args),
      },
    };
    return fn(tx);
  },
);

vi.mock("../db.server", () => ({
  default: {
    $transaction: (
      fn: (tx: unknown) => Promise<unknown>,
      opts?: { timeout?: number; maxWait?: number },
    ) => transaction(fn, opts),
    shop: {
      findUnique: (args: unknown) => shopFindUnique(args),
    },
    spendEntry: {
      findMany: (args: unknown) => findMany(args),
      createMany: (args: unknown) => createMany(args),
      update: (args: unknown) => update(args),
    },
  },
}));

import {
  assertSpendWriteAllowed,
  createSpendRepository,
  normalizeSpendEntrySource,
  SPEND_UPSERT_BATCH_SIZE,
} from "./spend-repository.server";
import { utcMidnightFromDayKey } from "./shop-local-day";

const ORIG_PRO = process.env.MCFLY_PRO_SHOPS;

afterEach(() => {
  if (ORIG_PRO === undefined) delete process.env.MCFLY_PRO_SHOPS;
  else process.env.MCFLY_PRO_SHOPS = ORIG_PRO;
});

describe("normalizeSpendEntrySource", () => {
  it("maps connector + csv sources to non-sample desk sources", () => {
    expect(normalizeSpendEntrySource("csv")).toBe("csv");
    expect(normalizeSpendEntrySource("manual")).toBe("manual");
    expect(normalizeSpendEntrySource("meta")).toBe("meta");
    expect(normalizeSpendEntrySource("google")).toBe("google");
    expect(normalizeSpendEntrySource("sample")).toBe("sample");
  });
});

describe("assertSpendWriteAllowed", () => {
  beforeEach(() => {
    shopFindUnique.mockReset();
    delete process.env.MCFLY_PRO_SHOPS;
  });

  it("allows tiktok on Free live writes", async () => {
    shopFindUnique.mockResolvedValue({
      domain: "acme.myshopify.com",
      proBillingActive: false,
    });
    await expect(
      assertSpendWriteAllowed("shop_1", [
        {
          date: "2026-07-01",
          channel: "tiktok",
          amount: 50,
          currency: "USD",
          source: "csv",
        },
      ]),
    ).resolves.toBeUndefined();
  });

  it("allows sample-only writes even with Pro channels", async () => {
    await expect(
      assertSpendWriteAllowed("shop_1", [
        {
          date: "2026-07-01",
          channel: "tiktok",
          amount: 50,
          currency: "USD",
          // Sample desk seed path — not in SpendSource union, but repository accepts it.
          source: "sample" as "csv",
        },
      ]),
    ).resolves.toBeUndefined();
    expect(shopFindUnique).not.toHaveBeenCalled();
  });

  it("allows tiktok when shop is Pro via MCFLY_PRO_SHOPS", async () => {
    process.env.MCFLY_PRO_SHOPS = "acme.myshopify.com";
    shopFindUnique.mockResolvedValue({
      domain: "acme.myshopify.com",
      proBillingActive: false,
    });
    await expect(
      assertSpendWriteAllowed("shop_1", [
        {
          date: "2026-07-01",
          channel: "tiktok",
          amount: 50,
          currency: "USD",
          source: "csv",
        },
      ]),
    ).resolves.toBeUndefined();
  });
});

describe("createSpendRepository().upsertSpendDays", () => {
  beforeEach(() => {
    findMany.mockReset();
    createMany.mockReset();
    update.mockReset();
    shopFindUnique.mockReset();
    transaction.mockClear();
    delete process.env.MCFLY_PRO_SHOPS;
    shopFindUnique.mockResolvedValue({
      domain: "acme.myshopify.com",
      proBillingActive: false,
    });
    createMany.mockImplementation(async (args: { data: unknown[] }) => ({
      count: args.data.length,
    }));
    update.mockResolvedValue({});
  });

  it("creates on the shopId_channel_customKey_periodStart unique key (latest write wins)", async () => {
    findMany.mockResolvedValue([]);

    const repo = createSpendRepository();
    const result = await repo.upsertSpendDays("shop_1", [
      { date: "2026-07-01", channel: "meta", amount: 100, currency: "USD", source: "csv" },
    ]);

    expect(result).toEqual({ written: 1, skipped: 0, created: 1, updated: 0 });
    expect(shopFindUnique).toHaveBeenCalledWith({
      where: { id: "shop_1" },
      select: { domain: true, proBillingActive: true },
    });
    expect(findMany).toHaveBeenCalledOnce();
    expect(createMany).toHaveBeenCalledOnce();
    expect(update).not.toHaveBeenCalled();
    const call = createMany.mock.calls[0][0];
    expect(call.data).toHaveLength(1);
    expect(call.data[0]).toMatchObject({
      shopId: "shop_1",
      channel: "meta",
      amount: 100,
      periodStart: utcMidnightFromDayKey("2026-07-01"),
      source: "csv",
      customKey: "",
    });
    expect(transaction.mock.calls[0][1]).toEqual({
      timeout: 60_000,
      maxWait: 10_000,
    });
  });

  it("creates two other extras on the same day without collapsing", async () => {
    findMany.mockResolvedValue([]);

    const repo = createSpendRepository();
    const result = await repo.upsertSpendDays("shop_1", [
      {
        date: "2026-07-01",
        channel: "other",
        amount: 80,
        currency: "USD",
        source: "csv",
        customKey: "billboards-ooh",
        note: "Billboards / OOH",
      },
      {
        date: "2026-07-01",
        channel: "other",
        amount: 40,
        currency: "USD",
        source: "csv",
        customKey: "radio",
        note: "Radio",
      },
    ]);

    expect(result.created).toBe(2);
    const rows = createMany.mock.calls[0][0].data;
    expect(rows).toHaveLength(2);
    expect(rows.map((r: { customKey: string }) => r.customKey).sort()).toEqual([
      "billboards-ooh",
      "radio",
    ]);
  });

  it("stores periodStart as UTC midnight for day key (host TZ independent)", async () => {
    findMany.mockResolvedValue([]);

    const repo = createSpendRepository();
    await repo.upsertSpendDays("shop_1", [
      {
        date: "2026-07-15",
        channel: "meta",
        amount: 42,
        currency: "USD",
        source: "csv",
      },
    ]);

    const row = createMany.mock.calls[0][0].data[0];
    expect(row.periodStart).toEqual(utcMidnightFromDayKey("2026-07-15"));
    expect(row.periodStart.getTime()).toBe(Date.UTC(2026, 6, 15));
    expect(row.periodEnd.getTime()).toBe(
      utcMidnightFromDayKey("2026-07-15").getTime() + 24 * 60 * 60 * 1000 - 1,
    );
  });

  it("skips (no write) when a re-imported day/channel amount and source are unchanged", async () => {
    findMany.mockResolvedValue([
      {
        amount: 250,
        source: "csv",
        channel: "google",
        customKey: "",
        periodStart: utcMidnightFromDayKey("2026-07-02"),
      },
    ]);

    const repo = createSpendRepository();
    const result = await repo.upsertSpendDays("shop_1", [
      { date: "2026-07-02", channel: "google", amount: 250, currency: "USD", source: "csv" },
    ]);

    expect(result).toEqual({ written: 0, skipped: 1, created: 0, updated: 0 });
    expect(createMany).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("forces source off sample when CSV overwrites the same amount", async () => {
    findMany.mockResolvedValue([
      {
        amount: 250,
        source: "sample",
        channel: "google",
        customKey: "",
        periodStart: utcMidnightFromDayKey("2026-07-02"),
      },
    ]);

    const repo = createSpendRepository();
    const result = await repo.upsertSpendDays("shop_1", [
      { date: "2026-07-02", channel: "google", amount: 250, currency: "USD", source: "csv" },
    ]);

    expect(result).toEqual({ written: 1, skipped: 0, created: 0, updated: 1 });
    expect(createMany).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledOnce();
    const call = update.mock.calls[0][0];
    expect(call.data.source).toBe("csv");
    expect(call.data.amount).toBe(250);

    // Sample OFF (MER/spend where source !== sample): amount stays in aggregate.
    const after = { amount: call.data.amount as number, source: call.data.source as string };
    const sampleOff = [after].filter((row) => row.source !== "sample");
    expect(sampleOff).toHaveLength(1);
    expect(sampleOff[0].amount).toBe(250);
  });

  it("persists connector meta/google source on create and update (never leaves sample)", async () => {
    findMany.mockResolvedValue([
      {
        amount: 80,
        source: "sample",
        channel: "meta",
        customKey: "",
        periodStart: utcMidnightFromDayKey("2026-07-05"),
      },
    ]);

    const repo = createSpendRepository();
    const result = await repo.upsertSpendDays("shop_1", [
      { date: "2026-07-05", channel: "meta", amount: 80, currency: "USD", source: "meta" },
    ]);

    expect(result).toEqual({ written: 1, skipped: 0, created: 0, updated: 1 });
    const call = update.mock.calls[0][0];
    expect(call.data.source).toBe("meta");
    expect(call.data.amount).toBe(80);
  });

  it("re-importing the same day/channel with a changed amount overwrites, never sums", async () => {
    findMany.mockResolvedValue([
      {
        amount: 100,
        source: "csv",
        channel: "meta",
        customKey: "",
        periodStart: utcMidnightFromDayKey("2026-07-03"),
      },
    ]);

    const repo = createSpendRepository();
    const result = await repo.upsertSpendDays("shop_1", [
      { date: "2026-07-03", channel: "meta", amount: 175, currency: "USD", source: "csv" },
    ]);

    expect(result).toEqual({ written: 1, skipped: 0, created: 0, updated: 1 });
    const call = update.mock.calls[0][0];
    expect(call.data.amount).toBe(175);
    expect(call.data.source).toBe("csv");
    expect(call.where.shopId_channel_customKey_periodStart).toEqual({
      shopId: "shop_1",
      channel: "meta",
      customKey: "",
      periodStart: utcMidnightFromDayKey("2026-07-03"),
    });
  });

  it("normalizes aliased channel names before upserting (facebook -> meta)", async () => {
    findMany.mockResolvedValue([]);

    const repo = createSpendRepository();
    await repo.upsertSpendDays("shop_1", [
      { date: "2026-07-04", channel: "facebook", amount: 50, currency: "USD", source: "csv" },
    ]);

    const call = createMany.mock.calls[0][0];
    expect(call.data[0].channel).toBe("meta");
  });

  it("batches with one findMany + createMany per chunk (no N+1)", async () => {
    findMany.mockResolvedValue([]);

    const total = SPEND_UPSERT_BATCH_SIZE + 50;
    const rows = Array.from({ length: total }, (_, i) => {
      const day = 1 + (i % 28);
      const month = 1 + Math.floor(i / 28);
      return {
        date: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        channel: "meta" as const,
        amount: 10 + i,
        currency: "USD",
        source: "csv" as const,
      };
    });

    const repo = createSpendRepository();
    const result = await repo.upsertSpendDays("shop_1", rows);

    expect(result).toEqual({ written: total, skipped: 0, created: total, updated: 0 });
    // Two chunks → two transactions → two findMany (not one per row).
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(findMany).toHaveBeenCalledTimes(2);
    expect(createMany).toHaveBeenCalledTimes(2);
    expect(update).not.toHaveBeenCalled();
    const created =
      createMany.mock.calls[0][0].data.length + createMany.mock.calls[1][0].data.length;
    expect(created).toBe(total);
    // findMany uses channel/periodStart IN filters — never findUnique.
    for (const call of findMany.mock.calls) {
      const where = call[0].where;
      expect(where.shopId).toBe("shop_1");
      expect(where.channel).toEqual({ in: ["meta"] });
      expect(where.periodStart.in).toBeInstanceOf(Array);
      expect(where.periodStart.in.length).toBeGreaterThan(0);
    }
  });

  it("one findMany covers a mixed-channel batch before selective create/update", async () => {
    findMany.mockResolvedValue([
      {
        amount: 100,
        source: "csv",
        channel: "meta",
        customKey: "",
        periodStart: utcMidnightFromDayKey("2026-07-01"),
      },
    ]);

    const repo = createSpendRepository();
    const result = await repo.upsertSpendDays("shop_1", [
      { date: "2026-07-01", channel: "meta", amount: 100, currency: "USD", source: "csv" },
      { date: "2026-07-01", channel: "google", amount: 200, currency: "USD", source: "csv" },
    ]);

    expect(result).toEqual({ written: 1, skipped: 1, created: 1, updated: 0 });
    expect(findMany).toHaveBeenCalledOnce();
    expect(createMany).toHaveBeenCalledOnce();
    expect(update).not.toHaveBeenCalled();
    expect(createMany.mock.calls[0][0].data[0].channel).toBe("google");
  });

  it("allows tiktok live writes on Free", async () => {
    shopFindUnique.mockResolvedValue({
      domain: "acme.myshopify.com",
      proBillingActive: false,
    });
    findMany.mockResolvedValue([]);
    const repo = createSpendRepository();
    await expect(
      repo.upsertSpendDays("shop_1", [
        {
          date: "2026-07-01",
          channel: "tiktok",
          amount: 40,
          currency: "USD",
          source: "csv",
        },
      ]),
    ).resolves.toEqual({ written: 1, skipped: 0, created: 1, updated: 0 });
    expect(transaction).toHaveBeenCalled();
    expect(createMany).toHaveBeenCalled();
  });

  it("soaks ~3000 Meta+Google daily rows under 5s (createMany batches)", async () => {
    findMany.mockResolvedValue([]);

    const days = 1500;
    const start = new Date(2022, 0, 1);
    const rows: Array<{
      date: string;
      channel: "meta" | "google";
      amount: number;
      currency: string;
      source: "csv";
    }> = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      rows.push({
        date,
        channel: "meta",
        amount: 10 + (i % 7),
        currency: "USD",
        source: "csv",
      });
      rows.push({
        date,
        channel: "google",
        amount: 20 + (i % 5),
        currency: "USD",
        source: "csv",
      });
    }

    const repo = createSpendRepository();
    const t0 = Date.now();
    const result = await repo.upsertSpendDays("shop_1", rows);
    const elapsed = Date.now() - t0;

    expect(result).toEqual({ written: 3000, skipped: 0, created: 3000, updated: 0 });
    expect(elapsed).toBeLessThan(5000);
    const expectedBatches = Math.ceil(3000 / SPEND_UPSERT_BATCH_SIZE);
    expect(transaction).toHaveBeenCalledTimes(expectedBatches);
    expect(findMany).toHaveBeenCalledTimes(expectedBatches);
    expect(createMany).toHaveBeenCalledTimes(expectedBatches);
    expect(update).not.toHaveBeenCalled();
    for (const call of transaction.mock.calls) {
      expect(call[1]).toEqual({ timeout: 60_000, maxWait: 10_000 });
    }
  });
});
