import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  applyExplorerMode,
  bucketExplorerRows,
  clampExplorerRangeToAsOf,
  closedDayEnd,
  compareExplorerBuckets,
  explorerBucketDateRange,
  explorerWeekMonthCopyText,
  priorExplorerBucketKey,
  explorerMer,
  explorerMoneyCeil,
  explorerSalesCeil,
  formatExplorerSubtitle,
  isUnpairedSpendDay,
  orderBarsByLegend,
  parseExplorerDateParam,
  parseExplorerGranularity,
  parseExplorerMode,
  parseExplorerRange,
  parseExplorerShowSales,
  resolveExplorerWindow,
  explorerQueryMatchingScoreboard,
  clampExplorerRangeToBook,
  explorerRangeOptionsFor,
  explorerYearChipNote,
  EXPLORER_GRANULARITY_OPTIONS,
  summarizeExplorer,
  type ExplorerDailyRow,
} from "./spend-explorer";
import { LIVE_UNPAID_INGEST_DAYS } from "./live-unpark";
import {
  listRecentClosedShopLocalDays,
  shopLocalDayKey,
  shopLocalDayRange,
} from "./shop-local-day";
import { resolvePeriod } from "./periods";

function day(
  dateKey: string,
  sales: number,
  channels: Record<string, number>,
): ExplorerDailyRow {
  const list = Object.entries(channels).map(([channel, amount]) => ({
    channel,
    amount,
  }));
  const spend = list.reduce((s, c) => s + c.amount, 0);
  return { dateKey, sales, spend, channels: list };
}

describe("parseExplorer*", () => {
  it("defaults to 90d / Week / stacked", () => {
    expect(parseExplorerRange(null)).toBe("90d");
    expect(parseExplorerGranularity(null)).toBe("Week");
    expect(parseExplorerMode(null)).toBe("stacked");
    expect(parseExplorerShowSales(null)).toBe(false);
  });

  it("accepts known values", () => {
    expect(parseExplorerRange("14d")).toBe("14d");
    expect(parseExplorerRange("All")).toBe("All");
    expect(parseExplorerGranularity("Month")).toBe("Month");
    expect(parseExplorerGranularity("Quarter")).toBe("Quarter");
    expect(parseExplorerGranularity("Weekday")).toBe("Weekday");
    expect(EXPLORER_GRANULARITY_OPTIONS.map((opt) => opt.value)).toEqual([
      "Day",
      "Week",
      "Weekday",
      "Month",
      "Quarter",
    ]);
    expect(parseExplorerMode("share")).toBe("share");
    expect(parseExplorerShowSales("1")).toBe(true);
    expect(parseExplorerShowSales("true")).toBe(true);
    expect(parseExplorerDateParam("2026-07-01")).toBe("2026-07-01");
  });

  it("rejects unknown", () => {
    expect(parseExplorerRange("forever")).toBe("90d");
    expect(parseExplorerGranularity("Hour")).toBe("Week");
    expect(parseExplorerMode("pie")).toBe("stacked");
    expect(parseExplorerShowSales("0")).toBe(false);
    expect(parseExplorerDateParam("07/01/2026")).toBeNull();
    expect(parseExplorerDateParam("2026-13-40")).toBeNull();
  });
});

describe("explorerBucketDateRange", () => {
  it("maps day / week / month / quarter keys to calendar spans", () => {
    expect(explorerBucketDateRange("2026-09-10", "Day")).toEqual({
      fromKey: "2026-09-10",
      toKey: "2026-09-10",
    });
    expect(explorerBucketDateRange("w:2026-09-07", "Week")).toEqual({
      fromKey: "2026-09-07",
      toKey: "2026-09-13",
    });
    expect(explorerBucketDateRange("m:2026-09", "Month")).toEqual({
      fromKey: "2026-09-01",
      toKey: "2026-09-30",
    });
    expect(explorerBucketDateRange("q:2026-Q3", "Quarter")).toEqual({
      fromKey: "2026-07-01",
      toKey: "2026-09-30",
    });
  });

  it("clamps the end to as-of and drops ranges that start after as-of", () => {
    expect(
      clampExplorerRangeToAsOf(
        { fromKey: "2026-09-01", toKey: "2026-09-30" },
        "2026-09-15",
      ),
    ).toEqual({ fromKey: "2026-09-01", toKey: "2026-09-15" });
    expect(
      clampExplorerRangeToAsOf(
        { fromKey: "2026-09-16", toKey: "2026-09-30" },
        "2026-09-15",
      ),
    ).toBeNull();
  });
});

describe("explorerQueryMatchingScoreboard", () => {
  it("MTD scoreboard maps explorer to custom month keys in shop TZ", () => {
    const period = resolvePeriod(
      "mtd",
      new Date("2026-08-15T18:00:00.000Z"),
      "UTC",
    );
    const q = explorerQueryMatchingScoreboard("mtd", period, "UTC");
    expect(q.range).toBe("custom");
    expect(q.from).toBe("2026-08-01");
    expect(q.to).toBe("2026-08-15");
  });

  it("YTD maps to the YTD explorer preset", () => {
    const period = resolvePeriod(
      "ytd",
      new Date("2026-08-15T18:00:00.000Z"),
      "UTC",
    );
    expect(explorerQueryMatchingScoreboard("ytd", period, "UTC")).toEqual({
      range: "YTD",
      from: null,
      to: null,
    });
  });
});

describe("resolveExplorerWindow", () => {
  it("uses closed-day end (excludes today)", () => {
    const now = new Date(2026, 6, 23, 15, 0, 0); // Jul 23
    const win = resolveExplorerWindow("14d", now);
    expect(closedDayEnd(now).getDate()).toBe(22);
    expect(win.end.getDate()).toBe(22);
    expect(win.start.getDate()).toBe(9); // 14 days: Jul 9–22
  });

  it("resolves YTD from Jan 1", () => {
    const now = new Date(2026, 6, 23);
    const win = resolveExplorerWindow("YTD", now);
    expect(win.start.getFullYear()).toBe(2026);
    expect(win.start.getMonth()).toBe(0);
    expect(win.start.getDate()).toBe(1);
  });

  it("resolves 90d and 1y lengths", () => {
    const now = new Date(2026, 6, 23);
    const d90 = resolveExplorerWindow("90d", now);
    const d1y = resolveExplorerWindow("1y", now);
    // Count inclusive local calendar days (end is end-of-day, not start-of-day).
    const inclusiveDays = (start: Date, end: Date) => {
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      return (
        Math.round((endDay.getTime() - start.getTime()) / 86_400_000) + 1
      );
    };
    expect(inclusiveDays(d90.start, d90.end)).toBe(90);
    expect(inclusiveDays(d1y.start, d1y.end)).toBe(365);
  });

  it("resolves All to a multi-year closed-day span", () => {
    const now = new Date(2026, 6, 23);
    const win = resolveExplorerWindow("All", now);
    expect(win.range).toBe("All");
    expect(win.label).toBe("All closed days");
    const endDay = new Date(
      win.end.getFullYear(),
      win.end.getMonth(),
      win.end.getDate(),
    );
    const days =
      Math.round((endDay.getTime() - win.start.getTime()) / 86_400_000) + 1;
    expect(days).toBe(1095);
  });

  it("resolves custom FROM/TO when range is custom", () => {
    const now = new Date(2026, 6, 23);
    const win = resolveExplorerWindow("custom", now, {
      from: "2026-06-01",
      to: "2026-06-15",
    });
    expect(win.range).toBe("custom");
    expect(win.start.getMonth()).toBe(5);
    expect(win.start.getDate()).toBe(1);
    expect(win.end.getDate()).toBe(15);
    expect(win.label).toBe("2026-06-01 → 2026-06-15");
  });

  it("ignores FROM/TO when a preset range is selected", () => {
    const now = new Date(2026, 6, 23);
    const win = resolveExplorerWindow("14d", now, {
      from: "2026-01-01",
      to: "2026-01-31",
    });
    expect(win.range).toBe("14d");
    expect(win.start.getDate()).toBe(9);
  });

  it("America/Denver closed day differs from UTC near midnight", () => {
    // 2026-07-01 05:30 UTC = still 2026-06-30 evening in Denver (MDT = UTC-6).
    // Denver today = Jun 30 → last closed = Jun 29.
    // UTC today = Jul 1 → last closed = Jun 30.
    const now = new Date("2026-07-01T05:30:00.000Z");
    const denver = resolveExplorerWindow("14d", now, {
      timeZone: "America/Denver",
    });
    const utc = resolveExplorerWindow("14d", now, { timeZone: "UTC" });

    const denverClosed = listRecentClosedShopLocalDays(
      "America/Denver",
      14,
      now,
    );
    const utcClosed = listRecentClosedShopLocalDays("UTC", 14, now);
    expect(denverClosed[denverClosed.length - 1]).toBe("2026-06-29");
    expect(utcClosed[utcClosed.length - 1]).toBe("2026-06-30");
    expect(denverClosed[0]).toBe("2026-06-16");
    expect(utcClosed[0]).toBe("2026-06-17");

    expect(shopLocalDayKey(denver.start, "America/Denver")).toBe("2026-06-16");
    expect(shopLocalDayKey(denver.end, "America/Denver")).toBe("2026-06-29");
    expect(shopLocalDayKey(utc.start, "UTC")).toBe("2026-06-17");
    expect(shopLocalDayKey(utc.end, "UTC")).toBe("2026-06-30");

    expect(denver.start.toISOString()).toBe(
      shopLocalDayRange("2026-06-16", "America/Denver").start.toISOString(),
    );
    expect(denver.end.toISOString()).toBe(
      shopLocalDayRange("2026-06-29", "America/Denver").end.toISOString(),
    );
    expect(denver.end.getTime()).toBeLessThan(utc.end.getTime());
  });

  it("America/Denver YTD uses shop-local Jan 1 and closed-day end", () => {
    const now = new Date("2026-07-01T05:30:00.000Z");
    const denver = resolveExplorerWindow("YTD", now, {
      timeZone: "America/Denver",
    });
    const utc = resolveExplorerWindow("YTD", now, { timeZone: "UTC" });

    expect(denver.start.toISOString()).toBe(
      shopLocalDayRange("2026-01-01", "America/Denver").start.toISOString(),
    );
    expect(shopLocalDayKey(denver.end, "America/Denver")).toBe("2026-06-29");
    expect(utc.start.toISOString()).toBe(
      shopLocalDayRange("2026-01-01", "UTC").start.toISOString(),
    );
    expect(shopLocalDayKey(utc.end, "UTC")).toBe("2026-06-30");
    expect(denver.end.toISOString()).not.toBe(utc.end.toISOString());
  });

  it("custom FROM/TO with timeZone uses shop-local day ranges", () => {
    const now = new Date("2026-07-15T18:00:00.000Z");
    const win = resolveExplorerWindow("custom", now, {
      from: "2026-06-01",
      to: "2026-06-15",
      timeZone: "America/Denver",
    });
    expect(win.range).toBe("custom");
    expect(win.start.toISOString()).toBe(
      shopLocalDayRange("2026-06-01", "America/Denver").start.toISOString(),
    );
    expect(win.end.toISOString()).toBe(
      shopLocalDayRange("2026-06-15", "America/Denver").end.toISOString(),
    );
    expect(win.label).toBe("2026-06-01 → 2026-06-15");
  });
});

describe("bucketExplorerRows", () => {
  const rows: ExplorerDailyRow[] = [
    day("2026-07-06", 4000, { meta: 500, google: 300 }), // Mon
    day("2026-07-07", 4500, { meta: 600 }), // Tue
    day("2026-07-13", 5000, { google: 800 }), // next Mon
    day("2026-08-01", 6000, { meta: 1000 }),
  ];

  it("Day buckets keep per-day MER = sales ÷ spend", () => {
    const buckets = bucketExplorerRows(rows, "Day");
    expect(buckets).toHaveLength(4);
    expect(buckets[0].label).toBe("7/6");
    expect(buckets[0].mer).toBeCloseTo(4000 / 800, 5);
    expect(buckets[1].mer).toBeCloseTo(4500 / 600, 5);
  });

  it("Week buckets start Monday and sum cash MER", () => {
    const buckets = bucketExplorerRows(rows, "Week");
    // Jul 6–7 → Wk of 7/6; Jul 13 → Wk of 7/13; Aug 1 → Wk of 7/27
    expect(buckets[0].label).toBe("Wk of 7/6");
    expect(buckets[0].sales).toBe(8500);
    expect(buckets[0].spend).toBe(1400);
    expect(buckets[0].mer).toBeCloseTo(8500 / 1400, 5);
    expect(buckets[0].channels.find((c) => c.channel === "meta")?.amount).toBe(
      1100,
    );
  });

  it("Month buckets aggregate across days", () => {
    const buckets = bucketExplorerRows(rows, "Month");
    expect(buckets).toHaveLength(2);
    expect(buckets[0].label).toMatch(/^Jul/);
    expect(buckets[0].sales).toBe(13500);
    expect(buckets[1].label).toMatch(/^Aug/);
    expect(buckets[1].spend).toBe(1000);
  });

  it("Quarter buckets aggregate Q3 months", () => {
    const qRows: ExplorerDailyRow[] = [
      day("2026-07-06", 4000, { meta: 500 }),
      day("2026-08-01", 6000, { google: 1000 }),
      day("2026-10-01", 3000, { meta: 400 }), // Q4
    ];
    const buckets = bucketExplorerRows(qRows, "Quarter");
    expect(buckets).toHaveLength(2);
    expect(buckets[0].key).toBe("q:2026-Q3");
    expect(buckets[0].label).toBe("Q3 ’26");
    expect(buckets[0].sales).toBe(10000);
    expect(buckets[0].spend).toBe(1500);
    expect(buckets[0].mer).toBeCloseTo(10000 / 1500, 5);
    expect(buckets[1].key).toBe("q:2026-Q4");
    expect(buckets[1].label).toBe("Q4 ’26");
  });

  it("Weekday grain pairs shop-local weekday sales with typed spend and never paints 0×", () => {
    const rows: ExplorerDailyRow[] = [
      day("2026-09-14", 2100, { meta: 1000 }), // Mon 2.1×
      day("2026-09-21", 2100, { meta: 1000 }), // next Mon
      {
        dateKey: "2026-09-20",
        sales: 8000,
        spend: 0,
        channels: [],
        salesOnFile: true,
      }, // Sunday organic
      {
        dateKey: "2026-09-15",
        sales: 0,
        spend: 400,
        channels: [{ channel: "meta", amount: 400 }],
        salesOnFile: false,
      }, // Tuesday spend, sales not on file
    ];
    const buckets = bucketExplorerRows(rows, "Weekday");
    const mon = buckets.find((b) => b.key === "wd:1");
    const tue = buckets.find((b) => b.key === "wd:2");
    const sun = buckets.find((b) => b.key === "wd:7");
    expect(mon?.label).toBe("Mon");
    expect(mon?.sales).toBe(4200);
    expect(mon?.spend).toBe(2000);
    expect(mon?.mer).toBeCloseTo(2.1, 5);
    expect(sun?.sales).toBe(8000);
    expect(sun?.spend).toBe(0);
    expect(sun?.mer).toBeNull();
    expect(tue?.mer).toBeNull();
    expect(JSON.stringify(buckets)).not.toMatch(/0×/);
    expect(explorerBucketDateRange("wd:1", "Weekday")).toBeNull();
    expect(priorExplorerBucketKey("wd:1", "Weekday")).toBeNull();
  });

  it("includes new SpendChannels in bucket mix", () => {
    const mixed = bucketExplorerRows(
      [
        day("2026-07-06", 5000, {
          pinterest: 100,
          snapchat: 80,
          reddit: 60,
          x: 40,
          linkedin: 30,
          amazon: 20,
          apple_search: 10,
        }),
      ],
      "Day",
    );
    const channels = mixed[0].channels.map((c) => c.channel);
    expect(channels).toEqual([
      "pinterest",
      "snapchat",
      "reddit",
      "x",
      "linkedin",
      "amazon",
      "apple_search",
    ]);
    expect(mixed[0].mer).toBeCloseTo(5000 / 340, 5);
  });
});

describe("applyExplorerMode", () => {
  const buckets = bucketExplorerRows(
    [
      day("2026-07-06", 4000, { meta: 600, google: 400 }),
      day("2026-07-07", 0, { meta: 100 }),
    ],
    "Day",
  );

  it("stacked keeps dollar segments", () => {
    const plot = applyExplorerMode(buckets, "stacked");
    expect(plot[0].bars.map((b) => b.channel)).toEqual(["meta", "google"]);
    expect(plot[0].bars[0].amount).toBe(600);
    expect(plot[0].scaledToCash).toBe(false);
  });

  it("stacked scales when channels exceed cash spend", () => {
    const over = bucketExplorerRows(
      [
        {
          dateKey: "2026-07-06",
          sales: 1000,
          spend: 100, // cash spend lower than channel sum
          channels: [
            { channel: "meta", amount: 80 },
            { channel: "google", amount: 40 },
          ],
        },
      ],
      "Day",
    );
    const plot = applyExplorerMode(over, "stacked");
    expect(plot[0].scaledToCash).toBe(true);
    const sum = plot[0].bars.reduce((s, c) => s + c.amount, 0);
    expect(sum).toBeCloseTo(100, 1);
  });

  it("share is 100% of bucket channel mix", () => {
    const plot = applyExplorerMode(buckets, "share");
    const sum = plot[0].bars.reduce((s, c) => s + c.amount, 0);
    expect(sum).toBeCloseTo(100, 1);
    expect(plot[0].bars.find((b) => b.channel === "meta")?.amount).toBe(60);
  });

  it("total is a single bar", () => {
    const plot = applyExplorerMode(buckets, "total");
    expect(plot[0].bars).toEqual([{ channel: "total", amount: 1000 }]);
  });
});

describe("summarizeExplorer", () => {
  const rows = [
    day("2026-07-06", 10000, { meta: 2000 }),
    day("2026-07-07", 5000, { google: 1000 }),
  ];

  it("overall MER = Σsales ÷ Σspend", () => {
    const s = summarizeExplorer(rows);
    expect(s.totalSales).toBe(15000);
    expect(s.totalSpend).toBe(3000);
    expect(s.overallMer).toBe(5);
    expect(s.closedDays).toBe(2);
    expect(s.costPerNew).toBeNull();
    expect(s.costPerCustomer).toBeNull();
  });

  it("cost per new / customer when metrics available", () => {
    const s = summarizeExplorer(rows, {
      customerMetricsAvailable: true,
      newCustomers: 50,
      returningCustomers: 100,
    });
    expect(s.costPerNew).toBe(60); // 3000/50
    expect(s.costPerCustomer).toBe(20); // 3000/150
  });

  it("null CAC when customers missing even if flag true", () => {
    const s = summarizeExplorer(rows, {
      customerMetricsAvailable: true,
      newCustomers: 0,
      returningCustomers: 0,
    });
    expect(s.costPerNew).toBeNull();
    expect(s.costPerCustomer).toBeNull();
  });
});

describe("explorer unpaired MER", () => {
  it("is unpaired when spend exists and sales are not positive", () => {
    expect(isUnpairedSpendDay(0, 40)).toBe(true);
    expect(isUnpairedSpendDay(100, 40)).toBe(false);
    expect(isUnpairedSpendDay(100, 0)).toBe(false);
  });

  it("returns — not 0× when sales are missing or unpaired", () => {
    expect(explorerMer(0, 650)).toBeNull();
    expect(explorerMer(0, 650, true)).toBeNull();
    expect(explorerMer(0, 400, false)).toBeNull();
    expect(explorerMer(800, 400, false)).toBeNull();
    expect(explorerMer(800, 400, true)).toBe(2);
  });

  it("day grain dashes MER for spend before closed sales land", () => {
    const buckets = bucketExplorerRows(
      [
        {
          dateKey: "2026-09-21",
          sales: 0,
          spend: 400,
          channels: [{ channel: "meta", amount: 400 }],
          salesOnFile: false,
        },
      ],
      "Day",
    );
    expect(buckets[0]?.mer).toBeNull();
    expect(buckets[0]?.spend).toBe(400);
  });

  it("does not paint 0× from a certified closed-day $0 with spend", () => {
    const buckets = bucketExplorerRows(
      [
        {
          dateKey: "2026-09-20",
          sales: 0,
          spend: 120,
          channels: [{ channel: "meta", amount: 120 }],
          salesOnFile: true,
        },
      ],
      "Day",
    );
    expect(buckets[0]?.mer).toBeNull();
  });

  it("overall MER stays — when the window is spend-only", () => {
    const summary = summarizeExplorer([
      {
        dateKey: "2026-09-21",
        sales: 0,
        spend: 400,
        channels: [],
        salesOnFile: false,
      },
    ]);
    expect(summary.overallMer).toBeNull();
    expect(summary.totalSpend).toBe(400);
  });
});

describe("explorerSalesCeil + subtitle", () => {
  it("sales ceil lifts left axis above bars when sales are larger", () => {
    const plot = applyExplorerMode(
      bucketExplorerRows(
        [day("2026-07-06", 9000, { meta: 1000 })],
        "Day",
      ),
      "stacked",
    );
    expect(explorerSalesCeil(plot, 1000)).toBe(9000);
  });

  it("orderBarsByLegend keeps stable stack order with zero gaps", () => {
    const ordered = orderBarsByLegend(
      [
        { channel: "google", amount: 200 },
        { channel: "meta", amount: 100 },
      ],
      ["meta", "google", "tiktok"],
    );
    expect(ordered).toEqual([
      { channel: "meta", amount: 100 },
      { channel: "google", amount: 200 },
      { channel: "tiktok", amount: 0 },
    ]);
  });

  it("explorerMoneyCeil shares spend+sales when sales line on", () => {
    const plot = applyExplorerMode(
      bucketExplorerRows(
        [day("2026-07-06", 9000, { meta: 1000 })],
        "Day",
      ),
      "stacked",
    );
    expect(explorerMoneyCeil(plot, "stacked", false)).toBe(1000);
    expect(explorerMoneyCeil(plot, "stacked", true)).toBe(9000);
    expect(explorerMoneyCeil(plot, "share", true)).toBe(100);
  });

  it("formats Apps Script–style subtitle", () => {
    const sub = formatExplorerSubtitle({
      bucketCount: 12,
      granularity: "Week",
      totalSpend: 42000,
      overallMer: 3.5,
      asOfKey: "2026-07-22",
      formatCurrency: (n) => `$${n.toLocaleString("en-US")}`,
      formatMer: (n) => (n == null ? "—" : `${n.toFixed(1)}x`),
    });
    expect(sub).toContain("12 ISO weeks (Mon start)");
    expect(sub).toContain("spend $42,000");
    expect(sub).toContain("Total ROAS 3.5x (Σsales ÷ Σspend)");
    expect(sub).toContain("Total ROAS = sales ÷ spend");
    expect(sub).toContain("closed days only");
    expect(sub).toContain("as of 2026-07-22");
  });
});

describe("priorExplorerBucketKey", () => {
  it("day → previous day, across month and year boundaries", () => {
    expect(priorExplorerBucketKey("2026-07-15", "Day")).toBe("2026-07-14");
    expect(priorExplorerBucketKey("2026-03-01", "Day")).toBe("2026-02-28");
    expect(priorExplorerBucketKey("2026-01-01", "Day")).toBe("2025-12-31");
  });

  it("week → previous Monday-start week", () => {
    expect(priorExplorerBucketKey("w:2026-07-13", "Week")).toBe("w:2026-07-06");
    expect(priorExplorerBucketKey("w:2026-01-05", "Week")).toBe("w:2025-12-29");
  });

  it("month → previous month, Jan wraps to prior-year Dec", () => {
    expect(priorExplorerBucketKey("m:2026-08", "Month")).toBe("m:2026-07");
    expect(priorExplorerBucketKey("m:2026-01", "Month")).toBe("m:2025-12");
  });

  it("quarter → previous quarter, Q1 wraps to prior-year Q4", () => {
    expect(priorExplorerBucketKey("q:2026-Q3", "Quarter")).toBe("q:2026-Q2");
    expect(priorExplorerBucketKey("q:2026-Q1", "Quarter")).toBe("q:2025-Q4");
  });

  it("rejects malformed keys", () => {
    expect(priorExplorerBucketKey("not-a-day", "Day")).toBeNull();
    expect(priorExplorerBucketKey("2026-07-13", "Week")).toBeNull();
    expect(priorExplorerBucketKey("m:2026-13", "Month")).toBeNull();
    expect(priorExplorerBucketKey("q:2026-Q5", "Quarter")).toBeNull();
  });
});

describe("compareExplorerBuckets", () => {
  it("aligns week buckets to the previous ISO week and computes deltas", () => {
    const buckets = bucketExplorerRows(
      [
        day("2026-07-06", 4000, { meta: 1000 }), // Wk of 7/6 → 4.0×
        day("2026-07-13", 6000, { meta: 1200 }), // Wk of 7/13 → 5.0×
      ],
      "Week",
    );
    const cmp = compareExplorerBuckets(buckets, "Week");
    expect(cmp[0].hasPrior).toBe(false);
    expect(cmp[0].spendDelta).toBeNull();
    expect(cmp[0].merDelta).toBeNull();
    expect(cmp[1].priorKey).toBe("w:2026-07-06");
    expect(cmp[1].hasPrior).toBe(true);
    expect(cmp[1].priorLabel).toBe("Wk of 7/6");
    expect(cmp[1].priorSpend).toBe(1000);
    expect(cmp[1].priorSales).toBe(4000);
    expect(cmp[1].spendDelta).toBe(200);
    expect(cmp[1].salesDelta).toBe(2000);
    expect(cmp[1].merDelta).toBeCloseTo(6000 / 1200 - 4000 / 1000, 5);
  });

  it("a week two weeks back is not treated as the prior week", () => {
    const buckets = bucketExplorerRows(
      [
        day("2026-06-29", 3000, { meta: 500 }), // Wk of 6/29
        day("2026-07-13", 6000, { meta: 1200 }), // Wk of 7/13 — no 7/6 data
      ],
      "Week",
    );
    const cmp = compareExplorerBuckets(buckets, "Week");
    expect(cmp[1].priorKey).toBe("w:2026-07-06");
    expect(cmp[1].hasPrior).toBe(false);
    expect(cmp[1].spendDelta).toBeNull();
    expect(cmp[1].merDelta).toBeNull();
  });

  it("month comparison crosses the year boundary", () => {
    const buckets = bucketExplorerRows(
      [
        day("2025-12-10", 5000, { meta: 1000 }),
        day("2026-01-10", 8000, { meta: 1600 }),
      ],
      "Month",
    );
    const cmp = compareExplorerBuckets(buckets, "Month");
    expect(cmp[1].priorKey).toBe("m:2025-12");
    expect(cmp[1].hasPrior).toBe(true);
    expect(cmp[1].spendDelta).toBe(600);
    expect(cmp[1].salesDelta).toBe(3000);
  });

  it("quarter Q1 compares against prior-year Q4", () => {
    const buckets = bucketExplorerRows(
      [
        day("2025-11-05", 9000, { meta: 3000 }), // Q4 ’25 → 3.0×
        day("2026-02-05", 8000, { meta: 2000 }), // Q1 ’26 → 4.0×
      ],
      "Quarter",
    );
    const cmp = compareExplorerBuckets(buckets, "Quarter");
    expect(cmp[1].priorKey).toBe("q:2025-Q4");
    expect(cmp[1].hasPrior).toBe(true);
    expect(cmp[1].spendDelta).toBe(-1000);
    expect(cmp[1].merDelta).toBeCloseTo(1, 5);
  });

  it("Total ROAS delta is null when the prior period has zero spend", () => {
    const buckets = bucketExplorerRows(
      [
        { dateKey: "2026-07-06", sales: 900, spend: 0, channels: [] },
        day("2026-07-07", 1200, { meta: 300 }),
      ],
      "Day",
    );
    const cmp = compareExplorerBuckets(buckets, "Day");
    expect(cmp[1].hasPrior).toBe(true);
    expect(cmp[1].priorMer).toBeNull();
    expect(cmp[1].merDelta).toBeNull();
    // Spend / sales deltas still real — only the ratio is undefined.
    expect(cmp[1].spendDelta).toBe(300);
    expect(cmp[1].salesDelta).toBe(300);
  });

  it("Total ROAS delta is null when the current period has zero spend", () => {
    const buckets = bucketExplorerRows(
      [
        day("2026-07-06", 1000, { meta: 250 }),
        { dateKey: "2026-07-07", sales: 800, spend: 0, channels: [] },
      ],
      "Day",
    );
    const cmp = compareExplorerBuckets(buckets, "Day");
    expect(cmp[1].hasPrior).toBe(true);
    expect(cmp[1].mer).toBeNull();
    expect(cmp[1].merDelta).toBeNull();
    expect(cmp[1].spendDelta).toBe(-250);
  });

  it("delta sign follows sales ÷ spend — never the inverted ratio", () => {
    const buckets = bucketExplorerRows(
      [
        day("2026-07-06", 4000, { meta: 1000 }), // 4.0×
        day("2026-07-07", 3000, { meta: 1500 }), // 2.0× — worse
      ],
      "Day",
    );
    const cmp = compareExplorerBuckets(buckets, "Day");
    expect(cmp[1].merDelta).toBeCloseTo(-2, 5);
  });
});

describe("compareExplorerBuckets", () => {
  it("compares a month to the previous month by key, not index", () => {
    const rows = compareExplorerBuckets(
      [
        { key: "m:2026-07", label: "Jul", sales: 800, spend: 200, mer: 4 },
        { key: "m:2026-08", label: "Aug", sales: 1000, spend: 200, mer: 5 },
      ],
      "Month",
    );
    const aug = rows.find((r) => r.key === "m:2026-08");
    expect(aug?.hasPrior).toBe(true);
    expect(aug?.priorKey).toBe("m:2026-07");
    expect(aug?.spendDelta).toBe(0);
    expect(aug?.salesDelta).toBe(200);
    expect(aug?.merDelta).toBe(1);
  });

  it("leaves merDelta null when either period has no spend", () => {
    const rows = compareExplorerBuckets(
      [
        { key: "2026-08-20", label: "8/20", sales: 100, spend: 0, mer: null },
        { key: "2026-08-21", label: "8/21", sales: 100, spend: 50, mer: 2 },
      ],
      "Day",
    );
    const today = rows.find((r) => r.key === "2026-08-21");
    expect(today?.hasPrior).toBe(true);
    expect(today?.merDelta).toBeNull();
  });

  it("does not invent a prior quarter outside the window", () => {
    const rows = compareExplorerBuckets(
      [{ key: "q:2026-Q1", label: "Q1", sales: 10, spend: 5, mer: 2 }],
      "Quarter",
    );
    expect(rows[0]?.hasPrior).toBe(false);
    expect(rows[0]?.priorKey).toBe("q:2025-Q4");
    expect(rows[0]?.spendDelta).toBeNull();
  });
});

describe("unpaid explorer does not sell a finished year", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const lib = readFileSync(join(here, "./spend-explorer.ts"), "utf8");
  const ui = readFileSync(join(here, "../components/SpendExplorer.tsx"), "utf8");
  const spend = readFileSync(join(here, "../routes/app.spend.tsx"), "utf8");
  const demo = readFileSync(join(here, "../routes/demo.spend.tsx"), "utf8");
  const stack = readFileSync(join(here, "./desk-spend-stack.server.ts"), "utf8");

  it("keep parsing YTD / 1y / All so paid and SAMPLE URLs still resolve", () => {
    expect(parseExplorerRange("YTD")).toBe("YTD");
    expect(parseExplorerRange("1y")).toBe("1y");
    expect(parseExplorerRange("All")).toBe("All");
  });

  it("trial_slice hides This year / 1 year / All and clamps them to 90d", () => {
    expect(LIVE_UNPAID_INGEST_DAYS).toBe(90);
    const paid = explorerRangeOptionsFor("paid_full").map((opt) => opt.value);
    expect(paid).toEqual(["14d", "30d", "90d", "YTD", "1y", "All"]);
    const unpaid = explorerRangeOptionsFor("trial_slice").map((opt) => opt.value);
    expect(unpaid).toEqual(["14d", "30d", "90d"]);
    expect(clampExplorerRangeToBook("YTD", "trial_slice")).toBe("90d");
    expect(clampExplorerRangeToBook("1y", "trial_slice")).toBe("90d");
    expect(clampExplorerRangeToBook("All", "trial_slice")).toBe("90d");
    expect(clampExplorerRangeToBook("YTD", "paid_full")).toBe("YTD");
    expect(clampExplorerRangeToBook("90d", "trial_slice")).toBe("90d");
    expect(explorerYearChipNote("paid_full")).toBeNull();
    expect(explorerYearChipNote("trial_slice")).toMatch(
      new RegExp(`${LIVE_UNPAID_INGEST_DAYS} closed days`),
    );
    expect(explorerYearChipNote("trial_slice")).not.toMatch(/\$0/);
  });

  it("omit-path: chips and loader clamp year ranges on trial_slice", () => {
    expect(lib).toContain("explorerRangeOptionsFor");
    expect(lib).toContain("clampExplorerRangeToBook");
    expect(lib).toMatch(
      /export function explorerRangeOptionsFor\(\s*orderBookDepth: LiveIngestDepth/,
    );
    expect(lib).not.toMatch(/orderBookDepth:\s*LiveIngestDepth\s*=/);
    expect(lib).toContain('case "trial_slice"');
    expect(lib).toContain('case "paid_full"');
    expect(lib).toMatch(/const _never: never = orderBookDepth/);
    expect(ui).toContain("orderBookDepth: LiveIngestDepth");
    expect(ui).not.toMatch(/orderBookDepth\?:/);
    expect(ui).not.toMatch(/orderBookDepth\s*=\s*"paid_full"/);
    expect(ui).toContain("explorerRangeOptionsFor(orderBookDepth)");
    expect(ui).toContain("clampExplorerRangeToBook");
    expect(spend).toMatch(/<SpendExplorer[\s\S]*orderBookDepth=\{orderBookDepth\}/);
    expect(demo).toMatch(/<SpendExplorer[\s\S]*orderBookDepth="paid_full"/);
    expect(stack).toContain("clampExplorerRangeToBook");
    expect(spend).not.toContain("UnlockFullHistoryBanner");
  });
});

describe("explorerWeekMonthCopyText", () => {
  const money = (n: number) => `$${n.toLocaleString("en-US")}`;

  it("names this-week and this-month Shopify Total Sales plus last-year weekday-shifted $", () => {
    const salesByDay = new Map<string, number>([
      ["2026-09-14", 1000], // Mon this week
      ["2026-09-15", 1100],
      ["2026-09-16", 1200],
      ["2026-09-17", 1300],
      ["2026-09-18", 1400],
      ["2026-09-19", 1500],
      ["2026-09-20", 1600], // as-of Sunday
      ["2026-09-01", 400],
      ["2025-09-15", 900], // last year Monday (14th 2026 → 15th 2025)
      ["2025-09-16", 910],
      ["2025-09-17", 920],
      ["2025-09-18", 930],
      ["2025-09-19", 940],
      ["2025-09-20", 950],
      ["2025-09-21", 960],
      ["2025-09-02", 300],
      ["2025-09-03", 310],
    ]);
    const copy = explorerWeekMonthCopyText({
      salesByDay,
      asOfKey: "2026-09-20",
      money,
    });
    expect(copy).not.toBeNull();
    expect(copy?.week).toMatch(/this week is \$9,100/);
    expect(copy?.week).toMatch(/\$6,510/);
    expect(copy?.week).toMatch(/last year/i);
    expect(copy?.week).not.toMatch(/%/);
    expect(copy?.month).toMatch(/this month is \$9,500/);
    expect(copy?.combined).toContain(copy?.week ?? "");
    expect(copy?.combined).toContain(copy?.month ?? "");
    expect(copy?.combined).not.toMatch(/\$0/);
  });

  it("falls back to previous week $ when last year is not on file — never a fake $0", () => {
    const salesByDay = new Map<string, number>([
      ["2026-09-14", 1000],
      ["2026-09-15", 1100],
      ["2026-09-16", 1200],
      ["2026-09-17", 1300],
      ["2026-09-18", 1400],
      ["2026-09-19", 1500],
      ["2026-09-20", 1600],
      ["2026-09-07", 800],
      ["2026-09-08", 810],
      ["2026-09-09", 820],
      ["2026-09-10", 830],
      ["2026-09-11", 840],
      ["2026-09-12", 850],
      ["2026-09-13", 860],
      ["2026-09-01", 400],
    ]);
    const copy = explorerWeekMonthCopyText({
      salesByDay,
      asOfKey: "2026-09-20",
      money,
    });
    expect(copy?.week).toMatch(/this week is \$9,100/);
    expect(copy?.week).toMatch(/\$5,810/);
    expect(copy?.week).toMatch(/last week/i);
    expect(copy?.week).toMatch(/not on file/i);
    expect(copy?.week).not.toMatch(/is \$0/);
    expect(copy?.month).toMatch(/this month is \$15,310/);
    expect(copy?.month).toMatch(/last week/i);
    expect(copy?.combined).not.toMatch(/is \$0/);
  });

  it("returns null when this week and this month have no sales on file", () => {
    expect(
      explorerWeekMonthCopyText({
        salesByDay: new Map(),
        asOfKey: "2026-09-20",
        money,
      }),
    ).toBeNull();
  });
});

