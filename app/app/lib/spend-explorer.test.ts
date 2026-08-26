import { describe, expect, it } from "vitest";
import {
  applyExplorerMode,
  bucketExplorerRows,
  closedDayEnd,
  compareExplorerBuckets,
  priorExplorerBucketKey,
  explorerMoneyCeil,
  explorerSalesCeil,
  formatExplorerSubtitle,
  orderBarsByLegend,
  parseExplorerDateParam,
  parseExplorerGranularity,
  parseExplorerMode,
  parseExplorerRange,
  parseExplorerShowSales,
  resolveExplorerWindow,
  explorerQueryMatchingScoreboard,
  summarizeExplorer,
  type ExplorerDailyRow,
} from "./spend-explorer";
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
