import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildLivePasteBuyerIndex } from "./spend-paste-buyers.server";

const { findManyOrderFact } = vi.hoisted(() => ({
  findManyOrderFact: vi.fn(),
}));

vi.mock("../db.server", () => ({
  default: {
    orderFact: {
      findMany: (...args: unknown[]) => findManyOrderFact(...args),
    },
  },
}));

function day(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

describe("buildLivePasteBuyerIndex", () => {
  beforeEach(() => {
    findManyOrderFact.mockReset();
  });

  it("interns the same customer across two days so paste CPA can unique them", async () => {
    findManyOrderFact.mockResolvedValueOnce([
      {
        customerKey: "a",
        orderedAt: day("2026-09-18"),
        shopLocalDate: day("2026-09-18"),
        lifetimeOrders: 2,
      },
      {
        customerKey: "b",
        orderedAt: day("2026-09-18"),
        shopLocalDate: day("2026-09-18"),
        lifetimeOrders: 1,
      },
      {
        customerKey: "a",
        orderedAt: day("2026-09-19"),
        shopLocalDate: day("2026-09-19"),
        lifetimeOrders: 2,
      },
      {
        customerKey: "c",
        orderedAt: day("2026-09-19"),
        shopLocalDate: day("2026-09-19"),
        lifetimeOrders: 1,
      },
    ]);

    const index = await buildLivePasteBuyerIndex("shop_1", {
      start: day("2026-09-18"),
      end: new Date("2026-09-19T23:59:59.999Z"),
    });

    const day18 = new Set(index.identifiedByDay["2026-09-18"]);
    const day19 = new Set(index.identifiedByDay["2026-09-19"]);
    expect(day18.size).toBe(2);
    expect(day19.size).toBe(2);
    const overlap = [...day18].filter((id) => day19.has(id));
    expect(overlap).toHaveLength(1);

    const unique = new Set([...day18, ...day19]);
    expect(unique.size).toBe(3);
  });

  it("stamps quiet days in range as known-zero, not omitted", async () => {
    findManyOrderFact.mockResolvedValueOnce([]);
    const index = await buildLivePasteBuyerIndex("shop_1", {
      start: day("2026-09-18"),
      end: new Date("2026-09-19T23:59:59.999Z"),
    });
    expect(index.identifiedByDay["2026-09-18"]).toEqual([]);
    expect(index.identifiedByDay["2026-09-19"]).toEqual([]);
    expect(index.newByDay["2026-09-18"]).toEqual([]);
    expect(index.newByDay["2026-09-19"]).toEqual([]);
  });
});
