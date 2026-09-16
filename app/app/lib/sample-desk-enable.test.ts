import { beforeEach, describe, expect, it, vi } from "vitest";

type SettingsRow = {
  shopId: string;
  useSampleDesk: boolean;
  samplePreviewAllowed: boolean;
};

const state = {
  days: 0,
  spend: 0,
  settings: {
    shopId: "shop_1",
    useSampleDesk: false,
    samplePreviewAllowed: true,
  } satisfies SettingsRow,
  persistRows: true,
};

vi.mock("../db.server", () => ({
  default: {
    settings: {
      findUnique: vi.fn(async () => state.settings),
      update: vi.fn(async ({ data }: { data: Partial<SettingsRow> }) => {
        Object.assign(state.settings, data);
        return state.settings;
      }),
    },
    sampleSalesDay: {
      findFirst: vi.fn(async () =>
        state.days > 0 ? { day: new Date("2026-09-16T00:00:00.000Z") } : null,
      ),
      count: vi.fn(async () => state.days),
      deleteMany: vi.fn(async () => {
        state.days = 0;
      }),
      createMany: vi.fn(async ({ data }: { data: unknown[] }) => {
        if (state.persistRows) state.days += data.length;
        return { count: state.persistRows ? data.length : 0 };
      }),
    },
    spendEntry: {
      findFirst: vi.fn(async () =>
        state.spend > 0
          ? { periodStart: new Date("2026-09-16T12:00:00.000Z") }
          : null,
      ),
      count: vi.fn(async () => state.spend),
      deleteMany: vi.fn(async () => {
        state.spend = 0;
      }),
      createMany: vi.fn(async ({ data }: { data: unknown[] }) => {
        if (state.persistRows) state.spend += data.length;
        return { count: state.persistRows ? data.length : 0 };
      }),
    },
    orderFact: { count: vi.fn(async () => 0) },
    $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  },
}));

vi.mock("./order-facts.server", () => ({
  seedSampleCohortFacts: vi.fn(async () => undefined),
  clearSampleCohortFacts: vi.fn(async () => undefined),
  seedSampleOrderFacts: vi.fn(async () => undefined),
  clearSampleOrderFacts: vi.fn(async () => undefined),
}));

import { applySampleDeskIntent } from "./sample-desk.server";

describe("applySampleDeskIntent use-sample", () => {
  beforeEach(() => {
    state.days = 0;
    state.spend = 0;
    state.persistRows = true;
    state.settings.useSampleDesk = false;
    state.settings.samplePreviewAllowed = true;
  });

  it("seeds a complete Harbor book before useSampleDesk=true", async () => {
    await applySampleDeskIntent("shop_1", "use-sample");
    expect(state.days).toBeGreaterThan(0);
    expect(state.spend).toBeGreaterThan(0);
    expect(state.settings.useSampleDesk).toBe(true);
  });

  it("does not flip SAMPLE on when the seed writes an empty book", async () => {
    state.persistRows = false;
    await expect(applySampleDeskIntent("shop_1", "use-sample")).rejects.toThrow(
      /SAMPLE book/i,
    );
    expect(state.days).toBe(0);
    expect(state.spend).toBe(0);
    expect(state.settings.useSampleDesk).toBe(false);
  });
});
