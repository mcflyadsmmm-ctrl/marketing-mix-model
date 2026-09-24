import { beforeEach, describe, expect, it, vi } from "vitest";

type SettingsRow = {
  shopId: string;
  useSampleDesk: boolean;
  samplePreviewAllowed: boolean;
};

const state = {
  days: 0,
  spend: 0,
  hasGuests: true,
  note: "sample:snowdevil-2",
  settings: {
    shopId: "shop_1",
    useSampleDesk: false,
    samplePreviewAllowed: true,
  } as SettingsRow,
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
      findFirst: vi.fn(async (args?: { where?: { guestOrders?: unknown } }) => {
        if (args?.where && "guestOrders" in args.where) {
          return state.hasGuests && state.days > 0
            ? { day: new Date("2026-09-16T00:00:00.000Z") }
            : null;
        }
        return state.days > 0
          ? { day: new Date("2026-09-16T00:00:00.000Z") }
          : null;
      }),
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
          ? {
              periodStart: new Date("2026-09-16T12:00:00.000Z"),
              note: state.note,
            }
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

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SAMPLE_BOOK_DAYS } from "./demo-sample-desk.server";
import {
  applySampleDeskIntent,
  getSampleDeskEnabled,
  hydrateSampleOnlyFreeze,
  isSampleOnlyFreeze,
  SAMPLE_BOOK_NOTE,
  SAMPLE_DESK_SHOP_NAME,
  sampleDeskNeedsSeed,
  setSampleDeskEnabled,
} from "./sample-desk.server";

const sampleDeskSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "sample-desk.server.ts"),
  "utf8",
);

describe("applySampleDeskIntent use-sample", () => {
  beforeEach(() => {
    state.days = 0;
    state.spend = 0;
    state.hasGuests = true;
    state.note = "sample:snowdevil-2";
    state.persistRows = true;
    state.settings.useSampleDesk = false;
    state.settings.samplePreviewAllowed = true;
    delete process.env.MCFLY_SAMPLE_ONLY;
  });

  it("brands SAMPLE as Snowdevil and stamps sample:snowdevil-2", () => {
    expect(SAMPLE_DESK_SHOP_NAME).toBe("Sample shop");
    expect(SAMPLE_BOOK_NOTE).toBe("sample:snowdevil-2");
    expect(sampleDeskSource).toContain("note: SAMPLE_BOOK_NOTE");
    expect(sampleDeskSource).toContain('SAMPLE_DESK_SHOP_NAME = "Sample shop"');
  });

  it("reseeds leftover snowdevil-1 books onto the growth-story stamp", async () => {
    state.days = SAMPLE_BOOK_DAYS;
    state.spend = 80;
    state.hasGuests = true;
    state.note = "sample:snowdevil-1";
    await expect(sampleDeskNeedsSeed("shop_1")).resolves.toBe(true);
  });

  it("reseeds leftover Harbor rows when the spend note is not Snowdevil", async () => {
    state.days = SAMPLE_BOOK_DAYS;
    state.spend = 80;
    state.hasGuests = true;
    state.note = "sample";
    await expect(sampleDeskNeedsSeed("shop_1")).resolves.toBe(true);
    state.note = SAMPLE_BOOK_NOTE;
    await expect(sampleDeskNeedsSeed("shop_1")).resolves.toBe(false);
  });

  it("reseeds when the book is shorter than 730 days", async () => {
    state.days = 400;
    state.spend = 80;
    state.hasGuests = true;
    state.note = SAMPLE_BOOK_NOTE;
    await expect(sampleDeskNeedsSeed("shop_1")).resolves.toBe(true);
  });

  it("reseeds when guest checkouts are missing from a full-length book", async () => {
    state.days = SAMPLE_BOOK_DAYS;
    state.spend = 80;
    state.hasGuests = false;
    state.note = SAMPLE_BOOK_NOTE;
    await expect(sampleDeskNeedsSeed("shop_1")).resolves.toBe(true);
  });

  it("no-ops merchant use-sample on Live hosts (no freeze)", async () => {
    await applySampleDeskIntent("shop_1", "use-sample");
    expect(state.days).toBe(0);
    expect(state.spend).toBe(0);
    expect(state.settings.useSampleDesk).toBe(false);
  });

  it("getSampleDeskEnabled is false on Live hosts even if settings say Sample", async () => {
    state.settings.useSampleDesk = true;
    state.settings.samplePreviewAllowed = true;
    await expect(getSampleDeskEnabled("shop_1")).resolves.toBe(false);
  });

  it("getSampleDeskEnabled is true under Sample-only freeze", async () => {
    process.env.MCFLY_SAMPLE_ONLY = "true";
    state.settings.useSampleDesk = false;
    await expect(getSampleDeskEnabled("shop_1")).resolves.toBe(true);
  });

  it("seeds Snowdevil under freeze when use-sample is posted", async () => {
    process.env.MCFLY_SAMPLE_ONLY = "true";
    await applySampleDeskIntent("shop_1", "use-sample");
    expect(state.days).toBeGreaterThan(0);
    expect(state.spend).toBeGreaterThan(0);
    expect(state.settings.useSampleDesk).toBe(true);
  });

  it("does not flip SAMPLE on when freeze seed writes an empty book", async () => {
    process.env.MCFLY_SAMPLE_ONLY = "true";
    state.persistRows = false;
    await expect(applySampleDeskIntent("shop_1", "use-sample")).rejects.toThrow(
      /SAMPLE book/i,
    );
    expect(state.days).toBe(0);
    expect(state.spend).toBe(0);
    expect(state.settings.useSampleDesk).toBe(false);
  });
});

describe("Sample-only freeze", () => {
  beforeEach(() => {
    state.days = 400;
    state.spend = 80;
    state.hasGuests = true;
    state.note = SAMPLE_BOOK_NOTE;
    state.persistRows = true;
    state.settings.useSampleDesk = true;
    state.settings.samplePreviewAllowed = true;
    delete process.env.MCFLY_SAMPLE_ONLY;
  });

  it("treats true and 1 as freeze-on", () => {
    expect(isSampleOnlyFreeze()).toBe(false);
    process.env.MCFLY_SAMPLE_ONLY = "true";
    expect(isSampleOnlyFreeze()).toBe(true);
    process.env.MCFLY_SAMPLE_ONLY = "1";
    expect(isSampleOnlyFreeze()).toBe(true);
    process.env.MCFLY_SAMPLE_ONLY = "false";
    expect(isSampleOnlyFreeze()).toBe(false);
  });

  it("use-real and hide-sample-preview no-op while freeze is on", async () => {
    process.env.MCFLY_SAMPLE_ONLY = "true";
    state.settings.useSampleDesk = true;
    await applySampleDeskIntent("shop_1", "use-real");
    expect(state.settings.useSampleDesk).toBe(true);
    await applySampleDeskIntent("shop_1", "hide-sample-preview");
    expect(state.settings.samplePreviewAllowed).toBe(true);
    expect(state.settings.useSampleDesk).toBe(true);
  });

  it("setSampleDeskEnabled(false) no-ops while freeze is on", async () => {
    process.env.MCFLY_SAMPLE_ONLY = "true";
    state.settings.useSampleDesk = true;
    await setSampleDeskEnabled("shop_1", false);
    expect(state.settings.useSampleDesk).toBe(true);
  });

  it("hydrateSampleOnlyFreeze turns Sample on when freeze is set", async () => {
    process.env.MCFLY_SAMPLE_ONLY = "true";
    state.settings.useSampleDesk = false;
    state.settings.samplePreviewAllowed = false;
    await hydrateSampleOnlyFreeze("shop_1");
    expect(state.settings.samplePreviewAllowed).toBe(true);
    expect(state.settings.useSampleDesk).toBe(true);
  });
});
