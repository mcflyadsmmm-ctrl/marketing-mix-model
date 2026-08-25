import { describe, expect, it } from "vitest";
import {
  bucketDaysToWeeks,
  buildAllocationHistoryView,
  buildBestMixStrip,
  buildPeriodMixCompare,
  buildRollingWindowTiles,
  buildSpendBands,
  buildTopQuarterAllocations,
  buildTopWindowAllocations,
  calendarMonth,
  calendarQuarter,
  calendarYear,
  compareSpendShares,
  defaultWindowGrain,
  historyGroundingLine,
  mondayWeekKey,
  selectWindowsForGrain,
  shiftDateKey,
  windowScopeCaption,
  type HistoryDay,
} from "./allocation-history";

function day(
  dateKey: string,
  sales: number,
  channels: Array<{ channel: string; amount: number }>,
): HistoryDay {
  const spend = channels.reduce((s, c) => s + c.amount, 0);
  return { dateKey, sales, spend, channels };
}

/** Seven consecutive days starting Monday 2026-01-05 → one week. */
function weekDays(
  mondayKey: string,
  salesPerDay: number,
  channel: string,
  amountPerDay: number,
): HistoryDay[] {
  const [y, m, d] = mondayKey.split("-").map(Number);
  const out: HistoryDay[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    const key = dt.toISOString().slice(0, 10);
    out.push(day(key, salesPerDay, [{ channel, amount: amountPerDay }]));
  }
  return out;
}

describe("mondayWeekKey", () => {
  it("maps mid-week days back to Monday", () => {
    expect(mondayWeekKey("2026-01-07")).toBe("2026-01-05"); // Wed
    expect(mondayWeekKey("2026-01-05")).toBe("2026-01-05"); // Mon
    expect(mondayWeekKey("2026-01-11")).toBe("2026-01-05"); // Sun
  });
});

describe("shiftDateKey + calendarQuarter", () => {
  it("shifts calendar days across month boundaries", () => {
    expect(shiftDateKey("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDateKey("2026-01-05", 6)).toBe("2026-01-11");
  });

  it("labels calendar quarters", () => {
    expect(calendarQuarter("2025-07-15")).toEqual({
      year: 2025,
      quarter: 3,
      label: "2025 Q3",
    });
    expect(calendarQuarter("2026-01-01").quarter).toBe(1);
    expect(calendarQuarter("2026-12-31").quarter).toBe(4);
  });
});

describe("bucketDaysToWeeks", () => {
  it("aggregates sales, spend, MER, and channel shares by Monday week", () => {
    const days = [
      ...weekDays("2026-01-05", 1000, "meta", 200),
      ...weekDays("2026-01-12", 800, "google", 400),
    ];
    const weeks = bucketDaysToWeeks(days);
    expect(weeks).toHaveLength(2);
    expect(weeks[0].weekKey).toBe("2026-01-05");
    expect(weeks[0].sales).toBe(7000);
    expect(weeks[0].spend).toBe(1400);
    expect(weeks[0].mer).toBeCloseTo(5, 5);
    expect(weeks[0].channelShares[0]).toMatchObject({
      channel: "meta",
      share: 1,
    });
    expect(weeks[1].mer).toBeCloseTo(2, 5);
  });
});

describe("buildSpendBands", () => {
  it("bands weeks by weekly spend and counts above break-even", () => {
    const days = [
      ...weekDays("2026-01-05", 1000, "meta", 200), // spend 1400 → $0–2k, MER 5
      ...weekDays("2026-01-12", 400, "meta", 500), // spend 3500 → $2–5k, MER 0.8
      ...weekDays("2026-01-19", 9000, "google", 1000), // spend 7000 → $5–10k, MER ~1.29
      ...weekDays("2026-01-26", 20000, "meta", 2000), // spend 14000 → $10k+, MER ~1.43
    ];
    const weeks = bucketDaysToWeeks(days);
    const bands = buildSpendBands(weeks, 2.0);

    expect(bands.map((b) => b.label)).toEqual([
      "$0–2k",
      "$2–5k",
      "$5–10k",
      "$10k+",
    ]);
    expect(bands[0].weekCount).toBe(1);
    expect(bands[0].avgMer).toBeCloseTo(5, 5);
    expect(bands[0].daysOrWeeksAboveBe).toBe(1);
    expect(bands[0].aboveBePct).toBe(1);

    expect(bands[1].weekCount).toBe(1);
    expect(bands[1].avgMer).toBeCloseTo(0.8, 5);
    expect(bands[1].daysOrWeeksAboveBe).toBe(0);
    expect(bands[1].aboveBePct).toBe(0);

    expect(bands[2].weekCount).toBe(1);
    expect(bands[3].weekCount).toBe(1);
  });
});

describe("buildBestMixStrip", () => {
  it("averages channel shares in the top Total ROAS quartile", () => {
    // 4 weeks → top quartile = 1 week (the best MER).
    const days = [
      ...weekDays("2026-01-05", 5000, "meta", 250), // MER 20 / 100% meta
      ...weekDays("2026-01-12", 2000, "google", 250), // MER 8
      ...weekDays("2026-01-19", 1000, "meta", 250), // MER 4
      ...weekDays("2026-01-26", 500, "google", 250), // MER 2
    ];
    const weeks = bucketDaysToWeeks(days);
    const strip = buildBestMixStrip(weeks, [
      { channel: "meta", amount: 40 },
      { channel: "google", amount: 60 },
    ]);
    expect(strip).not.toBeNull();
    expect(strip!.topWeekCount).toBe(1);
    expect(strip!.topAvgMer).toBeCloseTo(20, 5);
    expect(strip!.topShares[0]).toMatchObject({ channel: "meta", share: 1 });
    expect(strip!.nowShares.find((s) => s.channel === "meta")?.share).toBe(0.4);
    const metaDiff = strip!.diffs.find((d) => d.channel === "meta");
    expect(metaDiff?.deltaPp).toBeCloseTo(-60, 5); // 40% − 100%
  });

  it("returns null when no spend weeks", () => {
    expect(buildBestMixStrip([], [{ channel: "meta", amount: 100 }])).toBeNull();
  });
});

describe("buildPeriodMixCompare", () => {
  it("compares LM vs MTD portfolio Total ROAS and shares", () => {
    const mtd = [
      day("2026-07-01", 1000, [{ channel: "meta", amount: 200 }]),
      day("2026-07-02", 1000, [{ channel: "google", amount: 300 }]),
    ];
    const lm = [
      day("2026-06-01", 2000, [{ channel: "meta", amount: 400 }]),
      day("2026-06-15", 2000, [{ channel: "meta", amount: 100 }]),
    ];
    const cmp = buildPeriodMixCompare(mtd, lm);
    expect(cmp.mtd.sales).toBe(2000);
    expect(cmp.mtd.spend).toBe(500);
    expect(cmp.mtd.mer).toBeCloseTo(4, 5);
    expect(cmp.mtd.shares[0].channel).toBe("google");
    expect(cmp.lm.mer).toBeCloseTo(8, 5);
    expect(cmp.lm.shares[0]).toMatchObject({ channel: "meta", share: 1 });
  });
});

describe("buildTopQuarterAllocations", () => {
  it("ranks calendar quarters by portfolio Total ROAS with budget share mix", () => {
    // Q1 2025 — high ROAS, meta-heavy
    const q1 = [
      day("2025-01-10", 5000, [
        { channel: "meta", amount: 400 },
        { channel: "google", amount: 100 },
      ]),
      day("2025-02-10", 5000, [
        { channel: "meta", amount: 400 },
        { channel: "google", amount: 100 },
      ]),
    ];
    // Q2 2025 — mid ROAS
    const q2 = [
      day("2025-04-10", 2000, [{ channel: "google", amount: 500 }]),
      day("2025-05-10", 2000, [{ channel: "google", amount: 500 }]),
    ];
    // Q3 2025 — low ROAS
    const q3 = [
      day("2025-07-10", 500, [{ channel: "tiktok", amount: 400 }]),
      day("2025-08-10", 500, [{ channel: "tiktok", amount: 400 }]),
    ];
    // Tiny quarter — below meaningful spend floor
    const q4Tiny = [day("2025-10-01", 100, [{ channel: "meta", amount: 50 }])];

    const top = buildTopQuarterAllocations(
      [...q1, ...q2, ...q3, ...q4Tiny],
      3,
    );
    expect(top).toHaveLength(3);
    expect(top[0].label).toBe("2025 Q1");
    expect(top[0].mer).toBeCloseTo(10, 5); // 10000 / 1000
    expect(top[0].shares[0]).toMatchObject({ channel: "meta", share: 0.8 });
    expect(top[1].label).toBe("2025 Q2");
    expect(top[2].label).toBe("2025 Q3");
  });

  it("returns fewer than 3 when history is short", () => {
    const days = [
      day("2025-01-15", 3000, [{ channel: "meta", amount: 300 }]),
      day("2025-04-15", 1000, [{ channel: "google", amount: 200 }]),
    ];
    const top = buildTopQuarterAllocations(days, 3);
    expect(top).toHaveLength(2);
    expect(top[0].label).toBe("2025 Q1");
  });
});

describe("window grains + period filter defaults", () => {
  it("labels months and years from date keys", () => {
    expect(calendarMonth("2026-08-15")).toEqual({
      year: 2026,
      month: 8,
      key: "2026-08",
      label: "Aug 2026",
    });
    expect(calendarYear("2025-12-31")).toEqual({
      year: 2025,
      key: "2025",
      label: "2025",
    });
  });

  it("picks a useful default grain for each desk period", () => {
    expect(defaultWindowGrain("mtd")).toBe("week");
    expect(defaultWindowGrain("lm")).toBe("week");
    expect(defaultWindowGrain("qtd")).toBe("month");
    expect(defaultWindowGrain("ytd")).toBe("month");
    expect(defaultWindowGrain("l12m")).toBe("quarter");
    expect(defaultWindowGrain("y3")).toBe("quarter");
  });

  it("ranks months by Total ROAS", () => {
    const days = [
      day("2026-01-10", 4000, [{ channel: "meta", amount: 400 }]),
      day("2026-02-10", 1000, [{ channel: "google", amount: 500 }]),
      day("2026-03-10", 2000, [{ channel: "meta", amount: 200 }]),
    ];
    const top = buildTopWindowAllocations(days, "month", 3);
    expect(top.map((row) => row.label)).toEqual([
      "Jan 2026",
      "Mar 2026",
      "Feb 2026",
    ]);
    expect(top[0].grain).toBe("month");
  });

  it("uses period windows when there are enough buckets, else lookback", () => {
    const period = buildTopWindowAllocations(
      [day("2026-01-10", 1000, [{ channel: "meta", amount: 200 }])],
      "month",
    );
    const lookback = buildTopWindowAllocations(
      [
        day("2026-01-10", 1000, [{ channel: "meta", amount: 200 }]),
        day("2026-02-10", 800, [{ channel: "google", amount: 200 }]),
      ],
      "month",
    );
    const picked = selectWindowsForGrain(period, lookback, "month");
    expect(picked.scope).toBe("lookback");
    expect(picked.items).toHaveLength(2);
  });

  it("keeps a single year inside the selected period", () => {
    const period = buildTopWindowAllocations(
      [day("2026-03-10", 4000, [{ channel: "meta", amount: 400 }])],
      "year",
    );
    const lookback = buildTopWindowAllocations(
      [
        day("2025-03-10", 1000, [{ channel: "google", amount: 400 }]),
        day("2026-03-10", 4000, [{ channel: "meta", amount: 400 }]),
      ],
      "year",
    );
    const picked = selectWindowsForGrain(period, lookback, "year");
    expect(picked.scope).toBe("period");
    expect(picked.items).toHaveLength(1);
    expect(picked.items[0].label).toBe("2026");
  });

  it("explains period vs last-12-month window ranking", () => {
    expect(windowScopeCaption("week", "period", "Month to date")).toMatch(
      /inside Month to date/i,
    );
    expect(windowScopeCaption("quarter", "lookback", "Month to date")).toMatch(
      /too short to rank quarters/i,
    );
  });

  it("diffs a winning window mix vs this period in percentage points", () => {
    const diffs = compareSpendShares(
      [
        { channel: "Meta", share: 0.5 },
        { channel: "Google", share: 0.5 },
      ],
      [
        { channel: "Meta", share: 0.7 },
        { channel: "Google", share: 0.3 },
      ],
    );
    expect(diffs.map((d) => d.channel)).toEqual(["Meta", "Google"]);
    expect(diffs[0]).toMatchObject({
      channel: "Meta",
      periodShare: 0.5,
      windowShare: 0.7,
      deltaPp: 20,
    });
    expect(diffs[1]?.deltaPp).toBeCloseTo(-20, 5);
  });
});

describe("buildRollingWindowTiles", () => {
  it("compares last N closed days vs prior equal-length window", () => {
    // asOf = 2026-01-28; last 7d = Jan 22–28; prior 7d = Jan 15–21
    const days: HistoryDay[] = [];
    for (let i = 1; i <= 28; i++) {
      const key = `2026-01-${String(i).padStart(2, "0")}`;
      // Current window (22–28): sales 700/day, spend 100 → MER 7
      // Prior window (15–21): sales 300/day, spend 100 → MER 3
      const inCurrent = i >= 22;
      const inPrior = i >= 15 && i <= 21;
      const sales = inCurrent ? 700 : inPrior ? 300 : 100;
      days.push(day(key, sales, [{ channel: "meta", amount: 100 }]));
    }

    const tiles = buildRollingWindowTiles(days, "2026-01-28", [7, 14, 28]);
    expect(tiles).toHaveLength(3);

    const d7 = tiles.find((t) => t.days === 7)!;
    expect(d7.label).toBe("Last 7d");
    expect(d7.current.mer).toBeCloseTo(7, 5);
    expect(d7.prior.mer).toBeCloseTo(3, 5);
    expect(d7.delta).toBeCloseTo(4, 5);

    const d14 = tiles.find((t) => t.days === 14)!;
    // Current 14d: Jan 15–28 = 7×300 + 7×700 = 7000 sales / 1400 spend → MER 5
    expect(d14.current.mer).toBeCloseTo(5, 5);
    // Prior 14d: Jan 1–14 = 14×100 = 1400 / 1400 → MER 1
    expect(d14.prior.mer).toBeCloseTo(1, 5);
    expect(d14.delta).toBeCloseTo(4, 5);
  });

  it("fills missing calendar days as zero so windows stay equal length", () => {
    const days = [
      day("2026-06-20", 1000, [{ channel: "meta", amount: 100 }]),
      day("2026-06-21", 1000, [{ channel: "meta", amount: 100 }]),
    ];
    const [tile] = buildRollingWindowTiles(days, "2026-06-21", [7]);
    expect(tile.current.spend).toBe(200); // only 2 of 7 days have spend
    expect(tile.prior.spend).toBe(0);
    expect(tile.delta).toBeNull(); // prior mer null (no spend)
  });
});

describe("historyGroundingLine + buildAllocationHistoryView", () => {
  it("grounds primary move and exposes top quarters + rolling windows", () => {
    const days = [
      ...weekDays("2026-01-05", 5000, "meta", 250),
      ...weekDays("2026-01-12", 500, "google", 250),
      ...weekDays("2026-01-19", 400, "google", 250),
      ...weekDays("2026-01-26", 300, "google", 250),
    ];
    const view = buildAllocationHistoryView({
      days,
      nowChannelSpend: [
        { channel: "meta", amount: 20 },
        { channel: "google", amount: 80 },
      ],
      breakEvenMer: 2,
      asOfDateKey: "2026-02-01",
      mtdDays: days.slice(0, 3),
      lmDays: days.slice(3),
      primaryAction: { channel: "meta", type: "shift" },
    });
    expect(view.spendWeekCount).toBe(4);
    expect(view.bestMix).not.toBeNull();
    expect(view.groundingLine).toMatch(/top Total ROAS weeks/i);
    expect(view.groundingLine).toMatch(/Meta/i);
    expect(view.groundingLine).toMatch(/co-occurrence/i);
    expect(view.periodCompare?.mtd.spend).toBeGreaterThan(0);
    expect(view.topQuarters.length).toBeGreaterThanOrEqual(1);
    expect(view.topQuarters[0].label).toMatch(/Q1/);
    expect(view.rollingWindows).toHaveLength(3);
    expect(view.rollingWindows.map((t) => t.days)).toEqual([7, 14, 28]);

    const line = historyGroundingLine(view.bestMix, view.bands, {
      channel: "meta",
    });
    expect(line).toContain("when the till looked best");
  });

  it("returns empty-history view without inventing bands", () => {
    const view = buildAllocationHistoryView({
      days: [],
      nowChannelSpend: [],
      breakEvenMer: 3,
      asOfDateKey: "2026-07-01",
      mtdDays: [],
      lmDays: [],
    });
    expect(view.spendWeekCount).toBe(0);
    expect(view.bestMix).toBeNull();
    expect(view.groundingLine).toBeNull();
    expect(view.bands.every((b) => b.weekCount === 0)).toBe(true);
    expect(view.topQuarters).toEqual([]);
    expect(view.rollingWindows).toHaveLength(3);
  });
});
