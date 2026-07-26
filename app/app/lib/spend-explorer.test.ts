import { describe, expect, it } from "vitest";
import {
  applyExplorerMode,
  bucketExplorerRows,
  closedDayEnd,
  parseExplorerGranularity,
  parseExplorerMode,
  parseExplorerRange,
  resolveExplorerWindow,
  summarizeExplorer,
  type ExplorerDailyRow,
} from "./spend-explorer";

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
  });

  it("accepts known values", () => {
    expect(parseExplorerRange("14d")).toBe("14d");
    expect(parseExplorerGranularity("Month")).toBe("Month");
    expect(parseExplorerMode("share")).toBe("share");
  });

  it("rejects unknown", () => {
    expect(parseExplorerRange("All")).toBe("90d");
    expect(parseExplorerGranularity("Quarter")).toBe("Week");
    expect(parseExplorerMode("pie")).toBe("stacked");
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
