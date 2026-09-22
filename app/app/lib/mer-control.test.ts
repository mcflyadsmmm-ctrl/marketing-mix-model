import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  explorerMer,
  isUnpairedSpendDay,
  type ExplorerDailyRow,
} from "./spend-explorer";
import {
  aggregateLedger,
  buildCashChips,
  buildCashControlBoard,
  buildDualClose,
  buildMonthClosePlan,
  buildMonthNeed,
  certifyDailyRows,
  channelDayRows,
  compareMix,
  computeTotals,
  cutChannelHoldSales,
  getPeriodRows,
  lastNCertifiedRows,
  ledgerExplorerWindow,
  ledgerForGrain,
  merOf,
  mixRowsFromDays,
  mixWindowDays,
  paidSpendExcludingEmail,
  projectCloseAfterCut,
  siblingWindowDays,
  splitLastN,
  dualCloseLineModel,
  alignedSiblingWindowDays,
  buildCompareScores,
  chipZone,
} from "./mer-control";

function day(
  dateKey: string,
  sales: number,
  spend: number,
  channels: ExplorerDailyRow["channels"],
): ExplorerDailyRow {
  return { dateKey, sales, spend, channels };
}

/** 15 closed September days: MTD 3.00×, last 7 at 2.00×. */
function septDeterioration(): ExplorerDailyRow[] {
  const rows: ExplorerDailyRow[] = [];
  for (let d = 1; d <= 8; d++) {
    const dd = String(d).padStart(2, "0");
    rows.push(
      day(`2026-09-${dd}`, 11_750, 2_750, [
        { channel: "meta", amount: 1_500 },
        { channel: "google", amount: 1_000 },
        { channel: "email", amount: 250 },
      ]),
    );
  }
  for (let d = 9; d <= 15; d++) {
    const dd = String(d).padStart(2, "0");
    rows.push(
      day(`2026-09-${dd}`, 8_000, 4_000, [
        { channel: "meta", amount: 2_200 },
        { channel: "google", amount: 1_500 },
        { channel: "email", amount: 300 },
      ]),
    );
  }
  return rows;
}

describe("mer-control certify + windows", () => {
  it("windows are Σsales/Σspend, never the mean of daily ratios", () => {
    const rows = [
      day("2026-09-01", 100, 10, [{ channel: "meta", amount: 10 }]),
      day("2026-09-02", 100, 50, [{ channel: "meta", amount: 50 }]),
    ];
    const { days } = certifyDailyRows(rows);
    const totals = computeTotals(days);
    expect(totals.sales).toBe(200);
    expect(totals.spend).toBe(60);
    expect(totals.mer).toBeCloseTo(200 / 60, 8);
    const meanOfDaily =
      ((100 / 10) + (100 / 50)) / 2;
    expect(totals.mer).not.toBeCloseTo(meanOfDaily, 2);
  });

  it("excludes unpaired spend days so they never paint 0.00×", () => {
    const rows = [
      day("2026-09-01", 100, 25, [{ channel: "meta", amount: 25 }]),
      day("2026-09-02", 0, 40, [{ channel: "meta", amount: 40 }]),
    ];
    const certified = certifyDailyRows(rows);
    expect(certified.unpairedDays).toEqual(["2026-09-02"]);
    const totals = computeTotals(certified.days.filter((d) => !d.unpaired));
    expect(totals.days).toBe(1);
    expect(totals.mer).toBe(4);
    expect(merOf(0, 40)).toBe(0);
    expect(isUnpairedSpendDay(0, 40)).toBe(true);
    expect(explorerMer(0, 40)).toBeNull();
  });

  it("adds Unmapped when residual is above 50 cents; MER still uses spend", () => {
    const rows = [
      day("2026-09-01", 100, 40, [{ channel: "meta", amount: 30 }]),
    ];
    const { days, residualDays } = certifyDailyRows(rows);
    expect(residualDays).toBe(1);
    expect(days[0].channels.some((c) => c.channel === "Unmapped")).toBe(true);
    expect(days[0].spend).toBe(40);
    expect(days[0].mer).toBe(2.5);
  });

  it("YTD / QTD / MTD cap at the latest feed day", () => {
    const rows = [
      day("2026-01-15", 10, 5, [{ channel: "meta", amount: 5 }]),
      day("2026-08-20", 20, 5, [{ channel: "meta", amount: 5 }]),
      day("2026-09-10", 30, 10, [{ channel: "meta", amount: 10 }]),
      day("2026-09-20", 99, 1, [{ channel: "meta", amount: 1 }]),
    ];
    const { days } = certifyDailyRows(rows.slice(0, 3));
    const bounds = {
      year: 2026,
      monthIndex: 8,
      quarter: 3,
      day: 10,
      dateKey: "2026-09-10",
    };
    expect(getPeriodRows(days, bounds, 2026, "mtd").map((d) => d.dateKey)).toEqual([
      "2026-09-10",
    ]);
    expect(getPeriodRows(days, bounds, 2026, "qtd").map((d) => d.dateKey)).toEqual([
      "2026-08-20",
      "2026-09-10",
    ]);
    expect(getPeriodRows(days, bounds, 2026, "ytd")).toHaveLength(3);
  });
});

describe("mer-control dual close + envelope", () => {
  it("MTD-flat proj MER equals current MER; L7 close diverges when recent MER is worse", () => {
    const { days } = certifyDailyRows(septDeterioration());
    const close = buildDualClose(days, 4);
    expect(close).not.toBeNull();
    if (!close) return;
    expect(close.daysElapsed).toBe(15);
    expect(close.daysInMonth).toBe(30);
    expect(close.remainingDays).toBe(15);
    expect(close.mtd.mer).toBeCloseTo(close.mtdFlat.projMer ?? 0, 8);
    expect(close.l7Close.projMer).not.toBeCloseTo(close.mtd.mer ?? 0, 2);
    expect(close.l7Close.projMer ?? 0).toBeLessThan(close.mtd.mer ?? 0);
    expect(close.railOk).toBe(false);
  });

  it("locks email and scales paid into the remaining envelope", () => {
    const { days } = certifyDailyRows(septDeterioration());
    const plan = buildMonthClosePlan(days, 4, "l7");
    expect(plan).not.toBeNull();
    if (!plan) return;
    const email = plan.daily.find((d) => d.channel === "email");
    const meta = plan.daily.find((d) => d.channel === "meta");
    expect(email?.locked).toBe(true);
    expect(meta?.locked).toBe(false);
    if (plan.cannotHit) {
      expect(meta?.planDaily).toBe(0);
      expect(email?.planDaily).toBe(email?.l7Daily);
    } else {
      expect(email?.planDaily).toBe(email?.l7Daily);
      expect(meta?.planDaily ?? 0).toBeLessThan(meta?.l7Daily ?? 0);
      expect(plan.scale).toBeGreaterThanOrEqual(0);
    }
  });

  it("hold-sales channel cut raises MER without moving sales", () => {
    const { days } = certifyDailyRows(septDeterioration());
    const base = computeTotals(days.filter((d) => !d.unpaired));
    const cut = cutChannelHoldSales(days.filter((d) => !d.unpaired), "meta", 0.2);
    expect(cut.sales).toBe(base.sales);
    expect(cut.spend).toBeLessThan(base.spend);
    expect(cut.mer ?? 0).toBeGreaterThan(base.mer ?? 0);
  });
});

describe("mer-control mix + ledger", () => {
  it("flags Unmapped and spend-heavy concentration", () => {
    const rows = [
      day("2026-09-01", 100, 80, [
        { channel: "meta", amount: 70 },
        { channel: "google", amount: 10 },
      ]),
      day("2026-09-02", 100, 20, [{ channel: "google", amount: 20 }]),
      day("2026-09-03", 100, 20, [{ channel: "google", amount: 20 }]),
    ];
    const { days } = certifyDailyRows(rows);
    const mix = mixRowsFromDays(days);
    const meta = mix.find((m) => m.channel === "meta");
    expect(meta?.note).toMatch(/Most of the dollars/);
    expect(paidSpendExcludingEmail(computeTotals(days))).toBe(
      computeTotals(days).spend,
    );
  });

  it("ledger Met/Missed uses Σ/Σ vs the merchant target", () => {
    const { days } = certifyDailyRows(septDeterioration());
    const ledger = aggregateLedger(lastNCertifiedRows(days, 2), "day", 3);
    expect(ledger).toHaveLength(2);
    expect(ledger.every((row) => row.hit === false)).toBe(true);
  });

  it("chipZone is empty without spend, ok at or above goal, below when short", () => {
    expect(chipZone({ mer: null, spend: 0, vsTarget: null })).toBe("empty");
    expect(chipZone({ mer: 4, spend: 100, vsTarget: 0 })).toBe("ok");
    expect(chipZone({ mer: 4.2, spend: 100, vsTarget: 0.2 })).toBe("ok");
    expect(chipZone({ mer: 2, spend: 100, vsTarget: -2 })).toBe("below");
    const { days } = certifyDailyRows(septDeterioration());
    const chips = buildCashChips(days, 4);
    const yesterday = chips.find((c) => c.id === "yesterday");
    expect(yesterday).toBeDefined();
    expect(chipZone(yesterday!)).toBe("below");
  });

  it("chips skip empty windows and never average daily MER", () => {
    const { days } = certifyDailyRows(septDeterioration());
    const chips = buildCashChips(days, 4);
    const ids = chips.map((c) => c.id);
    expect(ids).toEqual(["yesterday", "l7", "mtd", "qtd", "ytd"]);
    expect(chips.map((c) => c.label)).toEqual([
      "Yesterday",
      "Last 7 days",
      "This month",
      "This quarter",
      "This year",
    ]);
    const mtd = chips.find((c) => c.id === "mtd");
    expect(mtd?.mer).toBe(computeTotals(days.filter((d) => !d.unpaired)).mer);
    expect(mtd?.priorFromKey).toBeNull();
    expect(mtd?.priorSales).toBeNull();
  });

  it("YoY chips carry last-year sales dollars, not a fake $0", () => {
    const rows = [
      ...septDeterioration(),
      day("2025-09-01", 9_000, 3_000, [{ channel: "meta", amount: 3_000 }]),
      day("2025-09-15", 9_000, 3_000, [{ channel: "meta", amount: 3_000 }]),
    ];
    const { days } = certifyDailyRows(rows);
    const chips = buildCashChips(days, 4);
    const mtd = chips.find((c) => c.id === "mtd");
    expect(mtd?.priorSales).toBe(18_000);
    expect(mtd?.priorFromKey).toBe("2025-09-01");
  });

  it("board payload is JSON-safe for the Overview island", () => {
    const board = buildCashControlBoard(septDeterioration(), 4);
    expect(board.asOfKey).toBe("2026-09-15");
    expect(board.chips).toHaveLength(5);
    expect(board.dualClose?.remainingDays).toBe(15);
    expect(board.plan?.path).toBe("l7");
    expect(board.mtdDays.length).toBeGreaterThan(0);
    expect(board.drillDays.length).toBe(board.mtdDays.length);
    expect(board.ledger.length).toBeGreaterThan(0);
    expect(board.intel?.mode).toBe("efficiency_risk");
    expect(board.intel?.hitDays28).toBe(8);
    expect(board.intel?.eligibleDays28).toBe(15);
    expect(board.intel?.alerts.some((a) => a.code === "three_day_target_miss")).toBe(
      true,
    );
    expect(board.compareScores).toHaveLength(1);
    expect(board.compareScores[0]?.id).toBe("thisMonth");
    expect(() => JSON.stringify(board)).not.toThrow();
  });

  it("dual-close sentence stays hidden at $0 spend and after month-end", () => {
    const { days } = certifyDailyRows(septDeterioration());
    const close = buildDualClose(days, 4);
    const model = dualCloseLineModel(close, 4);
    expect(model).not.toBeNull();
    if (!model) return;
    expect(model.remainingDays).toBe(15);
    expect(model.paceDays).toBe(7);
    expect(model.monthRateSales).toBeCloseTo(300_000, 4);
    expect(model.monthRateMer).toBeCloseTo(3, 8);
    expect(model.last7RateSales).toBeCloseTo(270_000, 4);
    expect(model.last7RateMer).toBeCloseTo(270_000 / 110_000, 8);
    expect(model.monthRateHitsGoal).toBe(false);
    expect(model.last7RateHitsGoal).toBe(false);

    const salesOnly = certifyDailyRows([
      day("2026-09-01", 10_000, 0, []),
    ]).days;
    expect(dualCloseLineModel(buildDualClose(salesOnly, 4), 4)).toBeNull();

    const closedMonth: ExplorerDailyRow[] = [];
    for (let d = 1; d <= 30; d++) {
      const dd = String(d).padStart(2, "0");
      closedMonth.push(
        day(`2026-09-${dd}`, 10_000, 2_500, [
          { channel: "meta", amount: 2_500 },
        ]),
      );
    }
    const done = buildDualClose(certifyDailyRows(closedMonth).days, 4);
    expect(done?.remainingDays).toBe(0);
    expect(dualCloseLineModel(done, 4)).toBeNull();

    const thin: ExplorerDailyRow[] = [];
    for (let d = 1; d <= 3; d++) {
      const dd = String(d).padStart(2, "0");
      thin.push(
        day(`2026-09-${dd}`, 10_000, 2_500, [
          { channel: "meta", amount: 2_500 },
        ]),
      );
    }
    const thinModel = dualCloseLineModel(
      buildDualClose(certifyDailyRows(thin).days, 4),
      4,
    );
    expect(thinModel?.paceDays).toBe(3);
  });

  it("compare scores cut last month and last year to this month's day", () => {
    const rows = septDeterioration();
    for (let d = 1; d <= 20; d++) {
      const dd = String(d).padStart(2, "0");
      rows.push(
        day(`2026-08-${dd}`, 10_000, 2_000, [
          { channel: "meta", amount: 1_200 },
          { channel: "google", amount: 800 },
        ]),
      );
    }
    for (let d = 1; d <= 30; d++) {
      const dd = String(d).padStart(2, "0");
      rows.push(
        day(`2025-09-${dd}`, 9_000, 2_250, [
          { channel: "meta", amount: 1_250 },
          { channel: "google", amount: 1_000 },
        ]),
      );
    }
    const { days } = certifyDailyRows(rows);
    expect(siblingWindowDays(days, "lastMonth")).toHaveLength(20);
    expect(alignedSiblingWindowDays(days, "lastMonth")).toHaveLength(15);
    expect(siblingWindowDays(days, "sameMonthLastYear")).toHaveLength(30);
    expect(alignedSiblingWindowDays(days, "sameMonthLastYear")).toHaveLength(15);

    const scores = buildCompareScores(days);
    expect(scores.map((r) => r.id)).toEqual([
      "thisMonth",
      "lastMonth",
      "lastYear",
    ]);
    const thisMonth = scores[0];
    const lastMonth = scores[1];
    const lastYear = scores[2];
    expect(thisMonth?.sales).toBeCloseTo(150_000, 4);
    expect(thisMonth?.salesChangePct).toBeNull();
    expect(lastMonth?.days).toBe(15);
    expect(lastMonth?.sales).toBeCloseTo(150_000, 4);
    expect(lastMonth?.mer).toBeCloseTo(5, 8);
    expect(lastMonth?.salesChangePct).toBeCloseTo(0, 8);
    expect(lastYear?.days).toBe(15);
    expect(lastYear?.sales).toBeCloseTo(135_000, 4);
    expect(lastYear?.mer).toBeCloseTo(4, 8);
    expect(lastYear?.salesChangePct).toBeCloseTo(
      ((135_000 - 150_000) / 150_000) * 100,
      8,
    );

    const board = buildCashControlBoard(rows, 4);
    expect(board.compareScores).toHaveLength(3);
  });

  it("ledger windows and channel days drill to real date keys", () => {
    const { days } = certifyDailyRows(septDeterioration());
    const monthWin = ledgerExplorerWindow(days, "month", "2026-09");
    expect(monthWin).toEqual({ fromKey: "2026-09-01", toKey: "2026-09-15" });
    const dayWin = ledgerExplorerWindow(days, "day", "2026-09-10");
    expect(dayWin).toEqual({ fromKey: "2026-09-10", toKey: "2026-09-10" });
    const metaDays = channelDayRows(days, "meta");
    expect(metaDays).toHaveLength(15);
    const l7 = mixWindowDays(days, "l7");
    expect(l7).toHaveLength(7);
    const months = ledgerForGrain(days, "month", 4);
    expect(months).toHaveLength(1);
    expect(months[0]?.label).toBe("Sep 2026");
  });

  it("sales still needed uses projected spend × goal minus this month so far", () => {
    const { days } = certifyDailyRows(septDeterioration());
    const close = buildDualClose(days, 4);
    expect(close).not.toBeNull();
    if (!close) return;
    const need = buildMonthNeed(close, 4);
    expect(need).not.toBeNull();
    if (!need) return;
    expect(need.salesStillNeeded).toBeCloseTo(
      Math.max(0, close.l7Close.projSpend * 4 - close.mtd.sales),
      6,
    );
    expect(need.spendRoom).toBeLessThan(0);
    const board = buildCashControlBoard(septDeterioration(), 4);
    expect(board.need?.salesStillNeeded).toBe(need.salesStillNeeded);
  });

  it("operating intel matches last-N paired days vs the N before (not mean of daily ratios)", () => {
    const { days, unpairedDays } = certifyDailyRows(septDeterioration());
    const { current, prior } = splitLastN(days, 7);
    expect(current).toHaveLength(7);
    expect(prior).toHaveLength(7);
    const board = buildCashControlBoard(septDeterioration(), 4);
    const intel = board.intel;
    expect(intel).not.toBeNull();
    if (!intel) return;
    expect(intel.rolling7.mer).toBeCloseTo(8000 / 4000, 8);
    expect(intel.rolling7.priorMer).toBeCloseTo(11750 / 2750, 8);
    expect(intel.rolling7.spendChangePct).toBeGreaterThan(25);
    expect(intel.rolling7.salesChangePct).toBeLessThan(-20);
    expect(intel.mode).toBe("efficiency_risk");
    expect(intel.hitDays28).toBe(8);
    expect(intel.eligibleDays28).toBe(15);
    expect(intel.takeaway).toMatch(/Efficiency risk/);
    expect(intel.takeaway).not.toMatch(/\bL7\b/);
    expect(intel.takeaway).not.toMatch(/\bMTD\b/);
    const codes = intel.alerts.map((a) => a.code);
    expect(codes).toContain("rolling_mer_below_target");
    expect(codes).toContain("three_day_target_miss");
    expect(codes).toContain("seven_day_spend_jump");
    expect(codes).toContain("seven_day_sales_drop");
    expect(unpairedDays).toEqual([]);
  });

  it("compares this month vs last month mix without inventing channels", () => {
    const rows = [
      ...septDeterioration(),
      day("2026-08-01", 12_000, 2_000, [
        { channel: "meta", amount: 500 },
        { channel: "google", amount: 1_500 },
      ]),
      day("2026-08-02", 12_000, 2_000, [
        { channel: "meta", amount: 500 },
        { channel: "google", amount: 1_500 },
      ]),
    ];
    const { days } = certifyDailyRows(rows);
    const mtd = mixWindowDays(days, "mtd");
    const last = siblingWindowDays(days, "lastMonth");
    expect(last).toHaveLength(2);
    const cmp = compareMix(mtd, last);
    const google = cmp.find((r) => r.channel === "google");
    expect(google?.bShare).toBeCloseTo(0.75, 8);
    expect(google?.deltaPts).toBeLessThan(0);
  });

  it("month finish after a cut holds sales and drops remaining spend", () => {
    const { days } = certifyDailyRows(septDeterioration());
    const close = buildDualClose(days, 4);
    expect(close).not.toBeNull();
    if (!close) return;
    const mtd = mixWindowDays(days, "mtd");
    const l7 = lastNCertifiedRows(days, 7);
    const cut = projectCloseAfterCut(mtd, l7, close.remainingDays, "meta", 0.2);
    expect(cut).not.toBeNull();
    if (!cut) return;
    expect(cut.sales).toBe(computeTotals(mtd).sales);
    expect(cut.spend).toBeLessThan(computeTotals(mtd).spend);
    expect(cut.closeMer ?? 0).toBeGreaterThan(close.l7Close.projMer ?? 0);
  });
});

describe("mer-control chrome", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const source = readFileSync(
    join(here, "../components/MarketingSpendRoom.tsx"),
    "utf8",
  );
  const mixPlan = readFileSync(
    join(here, "../components/SpendMixPlan.tsx"),
    "utf8",
  );
  const dualClose = readFileSync(
    join(here, "../components/DualCloseLine.tsx"),
    "utf8",
  );
  const scoreboard = readFileSync(
    join(here, "../components/CertifiedScoreboard.tsx"),
    "utf8",
  );

  it("merchant copy stays shop-owner English", () => {
    expect(source).not.toMatch(/\baMER\b/);
    expect(source).not.toMatch(/\btill\b/i);
    expect(source).not.toMatch(/\bMonday\b/);
    expect(source).not.toMatch(/\bcohort\b/i);
    expect(source).not.toMatch(/\bARPU\b/);
    expect(source).not.toMatch(/\bL7\b/);
    expect(source).not.toMatch(/\bMTD\b/);
    expect(source).not.toMatch(/\bQTD\b/);
    expect(source).not.toMatch(/\bYTD\b/);
    expect(source).not.toMatch(/\bYoY\b/);
    expect(source).not.toMatch(/\bklaviyo\b/i);
    expect(source).not.toMatch(/\bpixel\b/i);
  });

  it("Channel Allocation owns the mix table and spend plan", () => {
    expect(source).not.toContain("MIX_WINDOWS");
    expect(mixPlan).toContain("mcfly-spend-room__mix");
    expect(mixPlan).toContain('className="mcfly-control__table"');
    expect(mixPlan).toContain("<th>Channel</th>");
    expect(mixPlan).toContain("vs last month");
    expect(mixPlan).toContain("Spend left at goal");
    expect(mixPlan).toContain("ChannelCutNote");
    expect(mixPlan).toContain("20% lighter this month");
    expect(source).toContain("<details");
    expect(source).toContain("mcfly-spend-room__ledger");
    expect(source).toContain(">Every day</summary>");
  });

  it("paints the Black Clover operating strip without homework tabs", () => {
    expect(source).toContain("mcfly-spend-room__intel");
    expect(source).toContain("Last 7 days");
    expect(source).toContain("Last 28 days");
    expect(source).toContain("vs prior window");
    expect(source).toContain("intel.takeaway");
    expect(source).toContain("hitDays28");
    expect(source).not.toContain("correlation");
    expect(source).not.toContain("Click Allocation");
  });

  it("paints Compare scores on Marketing without a Compare tab", () => {
    expect(source).toContain("mcfly-spend-room__compare");
    expect(source).toContain("board.compareScores");
    expect(source).toContain("Same calendar days so far");
    expect(source).toContain("Sales vs this month");
    expect(source).not.toContain("data-tab");
  });

  it("Overview dual-close copy stays shop-owner English", () => {
    expect(dualClose).toContain("dualCloseLineModel");
    expect(dualClose).toContain("lastNLabel");
    expect(dualClose).toContain("If last 1 day holds");
    expect(dualClose).not.toContain("If last 7 days hold");
    expect(dualClose).not.toMatch(/\bMTD\b/);
    expect(dualClose).not.toMatch(/\bL7\b/);
    expect(dualClose).not.toMatch(/\bYoY\b/);
    expect(dualClose).not.toContain("0.00×");
  });

  it("certified scoreboard paints shop-owner windows, never 0.00×", () => {
    expect(scoreboard).toContain("chip.label");
    expect(scoreboard).toContain("Click for detail");
    expect(scoreboard).toContain("Spend left at goal");
    expect(scoreboard).not.toMatch(/\bMTD\b/);
    expect(scoreboard).not.toMatch(/\bQTD\b/);
    expect(scoreboard).not.toMatch(/\bYTD\b/);
    expect(scoreboard).not.toMatch(/\bL7\b/);
    expect(scoreboard).not.toContain("0.00×");
    expect(scoreboard).not.toMatch(/\bklaviyo\b/i);
  });
});
