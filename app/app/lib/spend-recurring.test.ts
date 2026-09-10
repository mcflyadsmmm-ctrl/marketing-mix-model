import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

const findManyRules = vi.fn();
const findFirstRule = vi.fn();
const updateRule = vi.fn();
const createRule = vi.fn();
const findManyEntries = vi.fn();
const upsertSpendDays = vi.fn();

vi.mock("../db.server", () => ({
  default: {
    recurringSpend: {
      findMany: (...args: unknown[]) => findManyRules(...args),
      findFirst: (...args: unknown[]) => findFirstRule(...args),
      update: (...args: unknown[]) => updateRule(...args),
      create: (...args: unknown[]) => createRule(...args),
    },
    spendEntry: {
      findMany: (...args: unknown[]) => findManyEntries(...args),
    },
  },
}));

vi.mock("./spend-repository.server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./spend-repository.server")>();
  return {
    ...actual,
    createSpendRepository: () => ({
      upsertSpendDays: (...args: unknown[]) => upsertSpendDays(...args),
    }),
  };
});

vi.mock("./sales-facts.server", () => ({
  salesDayFactWindowStartUtc: () => new Date(Date.UTC(2021, 0, 1)),
}));

import {
  materializeRecurringSpend,
  materializeRecurringSpendForShop,
  previousSpendYmd,
  spendYmdRangeInclusive,
  startRecurringSpend,
  stopRecurringSpend,
} from "./spend-recurring.server";
import { utcMidnightFromDayKey } from "./shop-local-day";

const here = dirname(fileURLToPath(import.meta.url));

function readRoute(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

beforeEach(() => {
  findManyRules.mockReset();
  findFirstRule.mockReset();
  updateRule.mockReset();
  createRule.mockReset();
  findManyEntries.mockReset();
  upsertSpendDays.mockReset();
  upsertSpendDays.mockResolvedValue({
    written: 0,
    skipped: 0,
    created: 0,
    updated: 0,
  });
});

describe("previousSpendYmd / spendYmdRangeInclusive", () => {
  it("steps back across month and year edges", () => {
    expect(previousSpendYmd("2026-03-01")).toBe("2026-02-28");
    expect(previousSpendYmd("2024-03-01")).toBe("2024-02-29");
    expect(previousSpendYmd("2026-01-01")).toBe("2025-12-31");
  });

  it("lists inclusive days and returns empty when from is after to", () => {
    expect(spendYmdRangeInclusive("2026-01-30", "2026-02-01")).toEqual([
      "2026-01-30",
      "2026-01-31",
      "2026-02-01",
    ]);
    expect(spendYmdRangeInclusive("2026-02-02", "2026-02-01")).toEqual([]);
  });
});

describe("startRecurringSpend / stopRecurringSpend", () => {
  it("updates the open rule when the start day is the same", async () => {
    findManyRules.mockResolvedValue([
      {
        id: "rule_1",
        startDate: utcMidnightFromDayKey("2026-08-01"),
      },
    ]);
    updateRule.mockResolvedValue({});
    await startRecurringSpend({
      shopId: "shop_1",
      channel: "meta",
      customKey: "",
      amount: 40.1,
      currency: "cad",
      startDateKey: "2026-08-01",
      note: "Meta",
    });
    expect(updateRule).toHaveBeenCalledWith({
      where: { id: "rule_1" },
      data: { amount: 40.1, currency: "CAD", note: "Meta" },
    });
    expect(createRule).not.toHaveBeenCalled();
  });

  it("closes the prior rule on the day before the new start", async () => {
    findManyRules.mockResolvedValue([
      {
        id: "rule_1",
        startDate: utcMidnightFromDayKey("2026-08-01"),
      },
    ]);
    updateRule.mockResolvedValue({});
    createRule.mockResolvedValue({});
    await startRecurringSpend({
      shopId: "shop_1",
      channel: "meta",
      customKey: "",
      amount: 55,
      currency: "USD",
      startDateKey: "2026-08-10",
      note: null,
    });
    expect(updateRule).toHaveBeenCalledWith({
      where: { id: "rule_1" },
      data: { endDate: utcMidnightFromDayKey("2026-08-09") },
    });
    expect(createRule).toHaveBeenCalled();
  });

  it("stops a rule through the requested day", async () => {
    findFirstRule.mockResolvedValue({
      id: "rule_1",
      startDate: utcMidnightFromDayKey("2026-08-01"),
    });
    updateRule.mockResolvedValue({});
    await stopRecurringSpend({
      shopId: "shop_1",
      ruleId: "rule_1",
      throughDateKey: "2026-08-20",
    });
    expect(updateRule).toHaveBeenCalledWith({
      where: { id: "rule_1" },
      data: { endDate: utcMidnightFromDayKey("2026-08-20") },
    });
  });
});

describe("materializeRecurringSpend", () => {
  it("skips manual/csv corrections and writes the rest as recurring", async () => {
    findManyRules.mockResolvedValue([
      {
        id: "rule_1",
        channel: "meta",
        customKey: "",
        amount: 40,
        currency: "USD",
        startDate: utcMidnightFromDayKey("2026-01-01"),
        endDate: null,
        note: null,
      },
    ]);
    findManyEntries.mockResolvedValue([
      {
        periodStart: utcMidnightFromDayKey("2026-01-02"),
        source: "manual",
      },
      {
        periodStart: utcMidnightFromDayKey("2026-01-04"),
        source: "csv",
      },
    ]);
    upsertSpendDays.mockResolvedValue({
      written: 3,
      skipped: 0,
      created: 3,
      updated: 0,
    });

    const result = await materializeRecurringSpend({
      shopId: "shop_1",
      currency: "USD",
      throughYmd: "2026-01-05",
      floorYmd: "2026-01-01",
    });

    expect(result.written).toBe(3);
    expect(upsertSpendDays).toHaveBeenCalledTimes(1);
    const rows = upsertSpendDays.mock.calls[0][1] as Array<{
      date: string;
      source: string;
      amount: number;
    }>;
    expect(rows.map((row) => row.date)).toEqual([
      "2026-01-01",
      "2026-01-03",
      "2026-01-05",
    ]);
    expect(rows.every((row) => row.source === "recurring")).toBe(true);
    expect(rows.every((row) => row.amount === 40)).toBe(true);
  });

  it("does not overwrite an existing recurring row's channel when a $0 manual day is present", async () => {
    findManyRules.mockResolvedValue([
      {
        id: "rule_1",
        channel: "meta",
        customKey: "",
        amount: 40,
        currency: "USD",
        startDate: utcMidnightFromDayKey("2026-01-01"),
        endDate: null,
        note: null,
      },
    ]);
    findManyEntries.mockResolvedValue([
      {
        periodStart: utcMidnightFromDayKey("2026-01-01"),
        source: "manual",
      },
    ]);

    const result = await materializeRecurringSpend({
      shopId: "shop_1",
      currency: "USD",
      throughYmd: "2026-01-01",
      floorYmd: "2026-01-01",
    });

    expect(result.written).toBe(0);
    expect(upsertSpendDays).not.toHaveBeenCalled();
  });
});

describe("materializeRecurringSpendForShop", () => {
  it("skips SAMPLE desks so Harbor dollars stay the sample book", async () => {
    const result = await materializeRecurringSpendForShop({
      shopId: "shop_1",
      currencyCode: "USD",
      ianaTimezone: "America/Denver",
      sampleOn: true,
    });
    expect(result).toEqual({ written: 0 });
    expect(findManyRules).not.toHaveBeenCalled();
  });

  it("fills through yesterday on a live shop", async () => {
    findManyRules.mockResolvedValue([]);
    const result = await materializeRecurringSpendForShop({
      shopId: "shop_1",
      currencyCode: "CAD",
      ianaTimezone: "America/Denver",
      sampleOn: false,
      now: new Date("2026-09-10T18:00:00.000Z"),
    });
    expect(result).toEqual({ written: 0 });
    expect(findManyRules).toHaveBeenCalled();
    const args = findManyRules.mock.calls[0][0] as {
      where: { startDate: { lte: Date } };
    };
    expect(args.where.startDate.lte.toISOString().slice(0, 10)).toBe(
      previousSpendYmd("2026-09-10"),
    );
  });
});

describe("desk wiring", () => {
  it("fills recurring on Overview before scoreboard spend reads", () => {
    const index = readRoute("../routes/app._index.tsx");
    const callAt = index.indexOf("await materializeRecurringSpendForShop");
    const metricsAt = index.indexOf("await buildDashboardMetrics");
    expect(callAt).toBeGreaterThan(-1);
    expect(metricsAt).toBeGreaterThan(-1);
    expect(callAt).toBeLessThan(metricsAt);
  });

  it("Spend loader uses the same shop helper, not a duplicate yesterday floor", () => {
    const spend = readRoute("../routes/app.spend.tsx");
    expect(spend).toContain("materializeRecurringSpendForShop");
    expect(spend).not.toContain("yesterdayFromTodayKey");
  });
});
