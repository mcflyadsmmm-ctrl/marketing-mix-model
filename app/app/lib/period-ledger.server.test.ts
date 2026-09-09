import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SpendChannel } from "@mcfly/mer-engine";

const getSampleDeskEnabled = vi.fn();
const getSalesFactsCoverage = vi.fn();
const getSalesFactsByDay = vi.fn();
const getSpendPeriodCoverage = vi.fn();
const buildDailyRowsForWindow = vi.fn();

vi.mock("./sample-desk.server", () => ({
  getSampleDeskEnabled: (...args: unknown[]) => getSampleDeskEnabled(...args),
}));

vi.mock("./sales-facts.server", () => ({
  getSalesFactsCoverage: (...args: unknown[]) => getSalesFactsCoverage(...args),
  getSalesFactsByDay: (...args: unknown[]) => getSalesFactsByDay(...args),
}));

vi.mock("./mer-dashboard.server", () => ({
  getSpendPeriodCoverage: (...args: unknown[]) => getSpendPeriodCoverage(...args),
  buildDailyRowsForWindow: (...args: unknown[]) => buildDailyRowsForWindow(...args),
}));

import {
  closedLedgerDayKeys,
  loadPeriodLedger,
  periodLedgerResponse,
} from "./period-ledger.server";
import { PERIOD_LEDGER_BLOCK_COPY } from "./period-ledger";

const here = dirname(fileURLToPath(import.meta.url));
const serverSource = readFileSync(join(here, "period-ledger.server.ts"), "utf8");
const routeSource = readFileSync(
  join(here, "../routes/app.period-ledger[.]csv.tsx"),
  "utf8",
);
const overviewSource = readFileSync(
  join(here, "../routes/app._index.tsx"),
  "utf8",
);
const spendSource = readFileSync(join(here, "../routes/app.spend.tsx"), "utf8");
const explorerSource = readFileSync(
  join(here, "../components/SpendExplorer.tsx"),
  "utf8",
);

const SHOP_ID = "shop_1";
const TZ = "America/Denver";
/** Denver: 2026-09-08T15:00Z is local 09:00 on 2026-09-08, so 09-07 is the last closed day. */
const NOW = new Date("2026-09-08T15:00:00.000Z");

/** MTD on 2026-09-08 → closed days 09-01 … 09-07. */
const MTD_DAYS = [
  "2026-09-01",
  "2026-09-02",
  "2026-09-03",
  "2026-09-04",
  "2026-09-05",
  "2026-09-06",
  "2026-09-07",
];

function salesMap(perDay = 1000): Map<string, number> {
  return new Map(MTD_DAYS.map((day) => [day, perDay]));
}

function dailyRows(
  channels: Array<{ channel: SpendChannel; amount: number }> = [
    { channel: "meta", amount: 100 },
  ],
) {
  return MTD_DAYS.map((dateKey) => ({
    dateKey,
    // Deliberately hostile: explorer/spend-side sales must never reach the file.
    sales: 999_999,
    spend: channels.reduce((s, c) => s + c.amount, 0),
    channels,
  }));
}

function completeFacts() {
  return {
    expectedClosedDays: MTD_DAYS.length,
    factDays: MTD_DAYS.length,
    complete: true,
    periodExceedsFactWindow: false,
  };
}

function completeSpend() {
  return {
    daysWithSpend: MTD_DAYS.length,
    daysInPeriod: MTD_DAYS.length,
    coveragePct: 100,
    incomplete: false,
  };
}

function happyPath() {
  getSampleDeskEnabled.mockResolvedValue(false);
  getSalesFactsCoverage.mockResolvedValue(completeFacts());
  getSalesFactsByDay.mockResolvedValue(salesMap());
  getSpendPeriodCoverage.mockResolvedValue(completeSpend());
  buildDailyRowsForWindow.mockResolvedValue(dailyRows());
}

function load(preset: "mtd" | "lm" | "ytd" = "mtd") {
  return loadPeriodLedger({
    shopId: SHOP_ID,
    ianaTimezone: TZ,
    preset,
    now: NOW,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("closedLedgerDayKeys", () => {
  it("clamps the end to the last fully closed shop-local day", () => {
    const keys = closedLedgerDayKeys({
      rangeStart: new Date("2026-09-01T06:00:00.000Z"),
      rangeEnd: new Date("2026-09-09T05:59:59.999Z"),
      timeZone: TZ,
      now: NOW,
    });
    expect(keys).toEqual(MTD_DAYS);
    expect(keys).not.toContain("2026-09-08");
  });

  it("returns no day when the period has not closed one yet", () => {
    expect(
      closedLedgerDayKeys({
        rangeStart: new Date("2026-09-08T06:00:00.000Z"),
        rangeEnd: new Date("2026-09-09T05:59:59.999Z"),
        timeZone: TZ,
        now: NOW,
      }),
    ).toEqual([]);
  });
});

describe("sales provenance", () => {
  it("takes Shopify sales only from the SalesDayFact map", async () => {
    happyPath();
    getSalesFactsByDay.mockResolvedValue(
      new Map(MTD_DAYS.map((day, i) => [day, 100 + i])),
    );

    const result = await load();
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const rows = result.csv.split("\r\n").slice(1);
    expect(rows).toHaveLength(MTD_DAYS.length);
    rows.forEach((row, i) => {
      const cells = row.split(",");
      expect(cells[0]).toBe(MTD_DAYS[i]);
      expect(cells[1]).toBe((100 + i).toFixed(2));
    });
    // The spend/explorer row's own `sales` value never appears.
    expect(result.csv).not.toContain("999999");
    expect(getSalesFactsByDay).toHaveBeenCalledWith(
      SHOP_ID,
      expect.objectContaining({ start: expect.any(Date), end: expect.any(Date) }),
      TZ,
    );
  });

  it("cannot be overwritten by a spend row or CSV-shaped channel value", async () => {
    happyPath();
    getSalesFactsByDay.mockResolvedValue(new Map(MTD_DAYS.map((d) => [d, 10])));
    // A spend import that tried to smuggle a "sales" column in as a channel.
    buildDailyRowsForWindow.mockResolvedValue(
      MTD_DAYS.map((dateKey) => ({
        dateKey,
        sales: 5_000_000,
        spend: 50,
        channels: [
          { channel: "meta" as SpendChannel, amount: 30 },
          { channel: "other" as SpendChannel, amount: 20 },
        ],
      })),
    );

    const result = await load();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const row of result.csv.split("\r\n").slice(1)) {
      const cells = row.split(",");
      expect(cells[1]).toBe("10.00");
      expect(cells[2]).toBe("50.00");
    }
    expect(result.csv).not.toContain("5000000");
  });

  it("never calls a Shopify sales fetch and never accepts client sales", async () => {
    happyPath();
    await load();
    expect(serverSource).not.toMatch(/fetchShopifySales|fetchShopifySalesByDay/);
    expect(serverSource).not.toMatch(/SampleSalesDay|fetchSampleSales/);
    expect(serverSource).not.toMatch(/AdminApiContext|admin\.graphql|prisma\./);
    // Only shopId / timezone / preset / now cross the boundary.
    expect(serverSource).toMatch(/preset: PeriodPreset/);
    expect(serverSource).not.toMatch(/salesByDay: args\./);
  });
});

describe("non-SAMPLE spend only", () => {
  it("excludes source = sample from both the coverage and the row query", async () => {
    happyPath();
    await load();
    expect(getSpendPeriodCoverage).toHaveBeenCalledWith(
      SHOP_ID,
      expect.anything(),
      expect.objectContaining({ excludeSample: true, timeZone: TZ }),
    );
    expect(buildDailyRowsForWindow).toHaveBeenCalledWith(
      SHOP_ID,
      expect.objectContaining({ excludeSample: true, timeZone: TZ }),
    );
    expect(serverSource).not.toContain("sampleOnly");
  });

  it("splits spend across the named channel columns", async () => {
    happyPath();
    buildDailyRowsForWindow.mockResolvedValue(
      dailyRows([
        { channel: "meta", amount: 40 },
        { channel: "google", amount: 25 },
        { channel: "apple_search", amount: 10 },
      ]),
    );
    const result = await load();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const header = result.csv.split("\r\n")[0].split(",");
    const cells = result.csv.split("\r\n")[1].split(",");
    expect(cells[2]).toBe("75.00");
    expect(cells[header.indexOf("Meta spend")]).toBe("40.00");
    expect(cells[header.indexOf("Google spend")]).toBe("25.00");
    expect(cells[header.indexOf("Apple Search Ads spend")]).toBe("10.00");
    expect(cells[header.indexOf("TikTok spend")]).toBe("0.00");
    expect(cells[header.indexOf("Total ROAS")]).toBe(
      (1000 / 75).toFixed(4),
    );
  });
});

describe("fail-closed gates", () => {
  it("blocks SAMPLE before any export assembly", async () => {
    happyPath();
    getSampleDeskEnabled.mockResolvedValue(true);

    const result = await load();
    expect(result).toMatchObject({
      ok: false,
      status: 409,
      reason: "sample",
      message: PERIOD_LEDGER_BLOCK_COPY.sample,
    });
    expect(getSalesFactsCoverage).not.toHaveBeenCalled();
    expect(getSalesFactsByDay).not.toHaveBeenCalled();
    expect(buildDailyRowsForWindow).not.toHaveBeenCalled();
  });

  it("blocks a period with no fully closed day", async () => {
    happyPath();
    const result = await loadPeriodLedger({
      shopId: SHOP_ID,
      ianaTimezone: TZ,
      preset: "mtd",
      // Denver local 2026-09-01 09:00 — MTD has no closed day yet.
      now: new Date("2026-09-01T15:00:00.000Z"),
    });
    expect(result).toMatchObject({
      ok: false,
      status: 409,
      reason: "noClosedDay",
      message: PERIOD_LEDGER_BLOCK_COPY.noClosedDay,
    });
    expect(getSalesFactsCoverage).not.toHaveBeenCalled();
  });

  it("blocks incomplete sales facts", async () => {
    happyPath();
    getSalesFactsCoverage.mockResolvedValue({
      ...completeFacts(),
      factDays: 4,
      complete: false,
    });
    await expect(load()).resolves.toMatchObject({
      ok: false,
      status: 409,
      reason: "salesFacts",
      message: PERIOD_LEDGER_BLOCK_COPY.salesFacts,
    });
  });

  it("blocks when the period exceeds the fact window", async () => {
    happyPath();
    getSalesFactsCoverage.mockResolvedValue({
      expectedClosedDays: MTD_DAYS.length,
      factDays: MTD_DAYS.length,
      complete: true,
      periodExceedsFactWindow: true,
    });
    await expect(load()).resolves.toMatchObject({
      ok: false,
      reason: "salesFacts",
      message: PERIOD_LEDGER_BLOCK_COPY.salesFacts,
    });
  });

  it("blocks when sales facts are unreadable", async () => {
    happyPath();
    getSalesFactsCoverage.mockRejectedValue(new Error("db down"));
    await expect(load()).resolves.toMatchObject({
      ok: false,
      reason: "salesFacts",
    });
  });

  it("never replaces a missing closed day with 0.00", async () => {
    happyPath();
    // Coverage says complete but one day's fact row is absent from the map.
    const partial = salesMap();
    partial.delete("2026-09-04");
    getSalesFactsByDay.mockResolvedValue(partial);

    await expect(load()).resolves.toMatchObject({
      ok: false,
      reason: "salesFacts",
      message: PERIOD_LEDGER_BLOCK_COPY.salesFacts,
    });
  });

  it("blocks incomplete spend coverage for the closed-day range", async () => {
    happyPath();
    getSpendPeriodCoverage.mockResolvedValue({
      daysWithSpend: 6,
      daysInPeriod: MTD_DAYS.length,
      coveragePct: 86,
      // Soft `incomplete` is not the gate — every closed day must be filled.
      incomplete: false,
    });
    await expect(load()).resolves.toMatchObject({
      ok: false,
      status: 409,
      reason: "spend",
      message: PERIOD_LEDGER_BLOCK_COPY.spend,
    });
    expect(buildDailyRowsForWindow).not.toHaveBeenCalled();
  });

  it("blocks rather than guessing a closed day without the shop timezone", async () => {
    happyPath();
    await expect(
      loadPeriodLedger({
        shopId: SHOP_ID,
        ianaTimezone: null,
        preset: "mtd",
        now: NOW,
      }),
    ).resolves.toMatchObject({ ok: false, reason: "salesFacts" });
  });
});

describe("dense closed-day ledger", () => {
  it("returns one row per closed day with today excluded in the shop timezone", async () => {
    happyPath();
    const result = await load();
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.dayCount).toBe(MTD_DAYS.length);
    expect(result.startDayKey).toBe("2026-09-01");
    expect(result.endDayKey).toBe("2026-09-07");
    expect(result.filename).toBe(
      "mcfly-period-ledger-2026-09-01-to-2026-09-07.csv",
    );
    const lines = result.csv.split("\r\n");
    expect(lines).toHaveLength(MTD_DAYS.length + 1);
    expect(lines.slice(1).map((l) => l.split(",")[0])).toEqual(MTD_DAYS);
    expect(result.csv).not.toContain("2026-09-08");
  });

  it("keeps a covered zero-sales, zero-spend day as an explicit 0.00 row", async () => {
    happyPath();
    getSalesFactsByDay.mockResolvedValue(
      new Map(MTD_DAYS.map((d) => [d, d === "2026-09-03" ? 0 : 1000])),
    );
    buildDailyRowsForWindow.mockResolvedValue(
      dailyRows().filter((r) => r.dateKey !== "2026-09-03"),
    );

    const result = await load();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const row = result.csv
      .split("\r\n")
      .find((line) => line.startsWith("2026-09-03"));
    expect(row).toBeDefined();
    const cells = (row as string).split(",");
    expect(cells[1]).toBe("0.00");
    expect(cells[2]).toBe("0.00");
    // Zero spend leaves Total ROAS blank rather than 0 / Infinity.
    expect(cells[17]).toBe("");
  });
});

describe("HTTP response shape", () => {
  it("serves the CSV with the exact content type, filename, and cache policy", async () => {
    happyPath();
    const result = await load();
    const response = periodLedgerResponse(result);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="mcfly-period-ledger-2026-09-01-to-2026-09-07.csv"',
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("sends every blocked state as plain text with no attachment header", async () => {
    happyPath();
    getSampleDeskEnabled.mockResolvedValue(true);
    const response = periodLedgerResponse(await load());

    expect(response.status).toBe(409);
    expect(response.headers.get("Content-Disposition")).toBeNull();
    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    await expect(response.text()).resolves.toBe(
      PERIOD_LEDGER_BLOCK_COPY.sample,
    );
  });
});

describe("resource route", () => {
  it("authenticates, resolves the shop server-side, and stays read-only", () => {
    expect(routeSource).toContain("authenticate.admin(request)");
    expect(routeSource).toContain("ensureShop(session.shop)");
    expect(routeSource).toContain("parsePeriodPreset(");
    expect(routeSource).toContain("periodLedgerResponse(result)");
    // period is the only client input — no shopId / dates / sales from the URL.
    expect(routeSource).not.toMatch(/searchParams\.get\("(shop|shopId|start|end|sales|tz)/);
    expect(routeSource).not.toMatch(/enqueue|Backfill|prisma\.|\.create\(|\.update\(|\.upsert\(/);
    expect(routeSource).not.toMatch(/action\s*=/);
  });

  it("escapes the dot so flat routes serve /app/period-ledger.csv", () => {
    expect(routeSource).toContain("period-ledger.csv");
  });
});

describe("Overview and Spend entry points", () => {
  it("use the exact label and preserve the selected period preset", () => {
    for (const source of [overviewSource, spendSource]) {
      expect(source).toContain("resolvePeriodLedgerControl");
      expect(source).toContain("periodLedger.label");
      expect(source).toContain("href: periodLedger.href");
      expect(source).toContain("preset,");
    }
    // The label text itself lives in the shared pure module, not duplicated.
    expect(overviewSource).not.toContain("Export period ledger (.csv)");
    expect(spendSource).not.toContain("Export period ledger (.csv)");
  });

  it("disables the control and keeps the blocked reason readable", () => {
    for (const source of [overviewSource, spendSource]) {
      expect(source).toContain("periodLedger.ready");
      expect(source).toContain("disabled: true");
      expect(source).toContain('"aria-describedby": "mcfly-period-ledger-help"');
      expect(source).toContain('id="mcfly-period-ledger-help"');
      expect(source).toContain("periodLedger.blockedCopy");
      expect(source).toContain("aria-label={periodLedger.label}");
    }
  });

  it("mirrors the route's SAMPLE and closed-day gates in the loader", () => {
    for (const source of [overviewSource, spendSource]) {
      expect(source).toMatch(/useSampleDesk[,:]/);
      expect(source).toMatch(/salesFactsReady:/);
      expect(source).toMatch(/spendReady:/);
      expect(source).toMatch(/closedDays:/);
      expect(source).toMatch(/periodExceedsFactWindow/);
    }
  });

  it("puts the Spend control beside the period summary, not the import form", () => {
    const summaryAt = spendSource.indexOf(
      'aria-label="Selected period spend summary"',
    );
    expect(summaryAt).toBeGreaterThan(-1);
    expect(summaryAt).toBeGreaterThan(spendSource.indexOf('id="mcfly-spend-uploads"'));
    const importForm = spendSource.slice(
      spendSource.indexOf('id="mcfly-spend-uploads"'),
      summaryAt,
    );
    expect(importForm).not.toContain("periodLedger");
  });

  it("leaves the explorer chart CSV button untouched", () => {
    expect(explorerSource).not.toContain("period-ledger");
    expect(explorerSource).not.toContain("periodLedger");
    // The browser-side chart CSV is a separate, unchanged feature.
    expect(explorerSource).toContain("downloadExplorerCsv");
    expect(explorerSource).toContain("mcfly-spend-explorer-");
  });
});
