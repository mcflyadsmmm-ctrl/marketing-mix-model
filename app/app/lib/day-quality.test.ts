import { describe, expect, it } from "vitest";
import {
  buildDayQuality,
  summarizeDayQuality,
  formatDayQualityCsv,
  formatDayQualityLabel,
  inclusiveDayCount,
  type DayQualityFact,
} from "./day-quality";

/** Three closed days plus today, with a full customer split. */
function septFacts(): Map<string, DayQualityFact> {
  return new Map<string, DayQualityFact>([
    [
      "2026-09-08",
      {
        sales: 800,
        orderCount: 8,
        newCustomerNetSales: 200,
        returningCustomerNetSales: 600,
      },
    ],
    [
      "2026-09-09",
      {
        sales: 1000,
        orderCount: 10,
        newCustomerNetSales: 400,
        returningCustomerNetSales: 600,
      },
    ],
    [
      "2026-09-10",
      {
        sales: 500,
        orderCount: 4,
        newCustomerNetSales: 500,
        returningCustomerNetSales: 0,
      },
    ],
  ]);
}

describe("inclusiveDayCount", () => {
  it("counts inclusive calendar days", () => {
    expect(inclusiveDayCount("2026-09-01", "2026-09-01")).toBe(1);
    expect(inclusiveDayCount("2026-09-01", "2026-09-10")).toBe(10);
  });

  it("spans month and DST boundaries without drifting", () => {
    // US DST ends 2026-11-01 — noon anchors keep the count honest.
    expect(inclusiveDayCount("2026-10-30", "2026-11-02")).toBe(4);
    expect(inclusiveDayCount("2026-02-27", "2026-03-01")).toBe(3);
  });

  it("returns 0 for inverted or unparseable bounds", () => {
    expect(inclusiveDayCount("2026-09-10", "2026-09-01")).toBe(0);
    expect(inclusiveDayCount("", "2026-09-01")).toBe(0);
    expect(inclusiveDayCount("not-a-day", "2026-09-01")).toBe(0);
  });
});

describe("formatDayQualityLabel", () => {
  it("formats a short month-day label", () => {
    expect(formatDayQualityLabel("2026-09-10")).toMatch(/Sep/);
    expect(formatDayQualityLabel("2026-09-10")).toMatch(/10/);
  });

  it("never drags the day across a timezone", () => {
    expect(formatDayQualityLabel("2026-01-01")).toMatch(/Jan/);
    expect(formatDayQualityLabel("2026-01-01")).toMatch(/\b1\b/);
    expect(formatDayQualityLabel("2026-12-31")).toMatch(/Dec/);
    expect(formatDayQualityLabel("2026-12-31")).toMatch(/31/);
  });

  it("passes through a key it cannot read", () => {
    expect(formatDayQualityLabel("2026-W37")).toBe("2026-W37");
  });
});

describe("buildDayQuality rows", () => {
  it("omits days without facts and marks today partial", () => {
    const table = buildDayQuality({
      factRows: septFacts(),
      spendByDay: { "2026-09-09": 200, "2026-09-10": 100 },
      periodStartKey: "2026-09-06",
      periodEndKey: "2026-09-10",
      todayKey: "2026-09-10",
      breakEvenMer: 3,
    });

    // 2026-09-06 / 07 have no fact row — never invented as $0 days.
    expect(table.rows.map((row) => row.dayKey)).toEqual([
      "2026-09-10",
      "2026-09-09",
      "2026-09-08",
    ]);
    expect(table.rows[0]!.partial).toBe(true);
    expect(table.rows[1]!.partial).toBe(false);
    expect(table.rows[2]!.partial).toBe(false);
  });

  it("keeps a covered zero-sales day (a fact of $0 is not a hole)", () => {
    const table = buildDayQuality({
      factRows: { "2026-09-01": { sales: 0, orderCount: 0 } },
      spendByDay: {},
      periodStartKey: "2026-09-01",
      periodEndKey: "2026-09-01",
      todayKey: "2026-09-02",
      breakEvenMer: 4,
    });
    expect(table.rows).toHaveLength(1);
    expect(table.rows[0]!.sales).toBe(0);
    expect(table.rows[0]!.orders).toBe(0);
  });

  it("drops fact days outside the selected period", () => {
    const table = buildDayQuality({
      factRows: septFacts(),
      spendByDay: {},
      periodStartKey: "2026-09-09",
      periodEndKey: "2026-09-09",
      todayKey: "2026-09-10",
      breakEvenMer: null,
    });
    expect(table.rows.map((row) => row.dayKey)).toEqual(["2026-09-09"]);
    expect(table.totals.sales).toBe(1000);
  });

  it("computes AOV per day and nulls it without orders", () => {
    const table = buildDayQuality({
      factRows: {
        "2026-09-09": { sales: 1000, orderCount: 8 },
        "2026-09-10": { sales: 0, orderCount: 0 },
      },
      spendByDay: {},
      periodStartKey: "2026-09-09",
      periodEndKey: "2026-09-10",
      todayKey: "2026-09-11",
      breakEvenMer: null,
    });
    expect(table.rows[0]!.aov).toBeNull();
    expect(table.rows[1]!.aov).toBeCloseTo(125);
  });

  it("computes ROAS only where spend was entered", () => {
    const table = buildDayQuality({
      factRows: septFacts(),
      spendByDay: new Map([["2026-09-09", 200]]),
      periodStartKey: "2026-09-08",
      periodEndKey: "2026-09-10",
      todayKey: "2026-09-11",
      breakEvenMer: null,
    });
    const byDay = new Map(table.rows.map((row) => [row.dayKey, row]));
    expect(byDay.get("2026-09-09")!.roas).toBeCloseTo(5);
    expect(byDay.get("2026-09-08")!.roas).toBeNull();
    expect(byDay.get("2026-09-08")!.spend).toBe(0);
  });

  it("accepts spend as a Map or a loader-serialized record", () => {
    const args = {
      factRows: { "2026-09-09": { sales: 1000, orderCount: 10 } },
      periodStartKey: "2026-09-09",
      periodEndKey: "2026-09-09",
      todayKey: "2026-09-10",
      breakEvenMer: null,
    };
    const fromMap = buildDayQuality({
      ...args,
      spendByDay: new Map([["2026-09-09", 250]]),
    });
    const fromRecord = buildDayQuality({
      ...args,
      spendByDay: { "2026-09-09": 250 },
    });
    expect(fromMap.rows[0]!.roas).toBeCloseTo(4);
    expect(fromRecord.rows[0]!.roas).toBeCloseTo(4);
  });

  it("clamps negative and non-finite figures instead of printing NaN", () => {
    const table = buildDayQuality({
      factRows: {
        "2026-09-09": {
          sales: Number.NaN,
          orderCount: -3,
          newCustomerNetSales: -50,
          returningCustomerNetSales: 100,
        },
      },
      spendByDay: { "2026-09-09": Number.POSITIVE_INFINITY },
      periodStartKey: "2026-09-09",
      periodEndKey: "2026-09-09",
      todayKey: "2026-09-10",
      breakEvenMer: 2,
    });
    const row = table.rows[0]!;
    expect(row.sales).toBe(0);
    expect(row.orders).toBe(0);
    expect(row.spend).toBe(0);
    expect(row.aov).toBeNull();
    expect(row.roas).toBeNull();
    expect(row.band).toBeNull();
    expect(row.newSales).toBe(0);
    expect(row.newShare).toBe(0);
  });
});

describe("buildDayQuality bands", () => {
  const bandFor = (sales: number, spend: number, breakEvenMer: number | null) =>
    buildDayQuality({
      factRows: { "2026-09-09": { sales, orderCount: 1 } },
      spendByDay: { "2026-09-09": spend },
      periodStartKey: "2026-09-09",
      periodEndKey: "2026-09-09",
      todayKey: "2026-09-10",
      breakEvenMer,
    }).rows[0]!.band;

  it("bands above / near / below the break-even rail", () => {
    // Rail 3 → above at ≥3.15, below under 2.85, near in the dead zone.
    expect(bandFor(320, 100, 3)).toBe("above");
    expect(bandFor(315, 100, 3)).toBe("above");
    expect(bandFor(314, 100, 3)).toBe("near");
    expect(bandFor(300, 100, 3)).toBe("near");
    expect(bandFor(285, 100, 3)).toBe("near");
    expect(bandFor(284, 100, 3)).toBe("below");
    expect(bandFor(100, 100, 3)).toBe("below");
  });

  it("has no opinion without a break-even rail or without spend", () => {
    expect(bandFor(1000, 100, null)).toBeNull();
    expect(bandFor(1000, 100, 0)).toBeNull();
    expect(bandFor(1000, 0, 3)).toBeNull();
  });
});

describe("buildDayQuality customer split", () => {
  it("reports new share from new + returning sales", () => {
    const table = buildDayQuality({
      factRows: septFacts(),
      spendByDay: {},
      periodStartKey: "2026-09-08",
      periodEndKey: "2026-09-10",
      todayKey: "2026-09-11",
      breakEvenMer: null,
    });
    const byDay = new Map(table.rows.map((row) => [row.dayKey, row]));
    expect(byDay.get("2026-09-08")!.newShare).toBeCloseTo(0.25);
    expect(byDay.get("2026-09-10")!.newShare).toBeCloseTo(1);
    expect(table.customerSplitAvailable).toBe(true);
  });

  it("leaves share null when the split has not landed", () => {
    const table = buildDayQuality({
      factRows: {
        "2026-09-09": { sales: 1000, orderCount: 10 },
        "2026-09-10": {
          sales: 500,
          orderCount: 5,
          newCustomerNetSales: 200,
          returningCustomerNetSales: null,
        },
      },
      spendByDay: {},
      periodStartKey: "2026-09-09",
      periodEndKey: "2026-09-10",
      todayKey: "2026-09-11",
      breakEvenMer: null,
    });
    expect(table.rows[0]!.newShare).toBeNull();
    expect(table.rows[1]!.newShare).toBeNull();
    expect(table.customerSplitAvailable).toBe(false);
    expect(table.totals.newSales).toBeNull();
    expect(table.totals.newShare).toBeNull();
  });

  it("leaves share null when attributed sales are zero", () => {
    const table = buildDayQuality({
      factRows: {
        "2026-09-09": {
          sales: 1000,
          orderCount: 10,
          newCustomerNetSales: 0,
          returningCustomerNetSales: 0,
        },
      },
      spendByDay: {},
      periodStartKey: "2026-09-09",
      periodEndKey: "2026-09-09",
      todayKey: "2026-09-10",
      breakEvenMer: null,
    });
    expect(table.rows[0]!.newShare).toBeNull();
    expect(table.customerSplitAvailable).toBe(false);
  });
});

describe("buildDayQuality totals", () => {
  it("foots the visible rows", () => {
    const table = buildDayQuality({
      factRows: septFacts(),
      spendByDay: { "2026-09-08": 100, "2026-09-09": 200, "2026-09-10": 100 },
      periodStartKey: "2026-09-06",
      periodEndKey: "2026-09-10",
      todayKey: "2026-09-10",
      breakEvenMer: 3,
    });
    expect(table.totals.orders).toBe(22);
    expect(table.totals.sales).toBe(2300);
    expect(table.totals.spend).toBe(400);
    expect(table.totals.aov).toBeCloseTo(2300 / 22);
    expect(table.totals.roas).toBeCloseTo(5.75);
    expect(table.totals.newSales).toBe(1100);
    expect(table.totals.newShare).toBeCloseTo(1100 / 2300);
  });

  it("returns empty totals when no fact day lands in the period", () => {
    const table = buildDayQuality({
      factRows: septFacts(),
      spendByDay: { "2026-08-04": 500 },
      periodStartKey: "2026-08-01",
      periodEndKey: "2026-08-05",
      todayKey: "2026-09-10",
      breakEvenMer: 3,
    });
    expect(table.rows).toEqual([]);
    expect(table.totals.orders).toBe(0);
    expect(table.totals.sales).toBe(0);
    expect(table.totals.aov).toBeNull();
    expect(table.totals.roas).toBeNull();
    expect(table.totals.newSales).toBeNull();
    expect(table.customerSplitAvailable).toBe(false);
  });
});

describe("buildDayQuality coverage", () => {
  it("expects closed days only — today is not owed a fact", () => {
    const table = buildDayQuality({
      factRows: septFacts(),
      spendByDay: { "2026-09-09": 200 },
      periodStartKey: "2026-09-06",
      periodEndKey: "2026-09-10",
      todayKey: "2026-09-10",
      breakEvenMer: null,
    });
    expect(table.coverage.daysInPeriod).toBe(5);
    // Sep 6 → Sep 9 are closed; Sep 10 is in progress.
    expect(table.coverage.expectedClosedDays).toBe(4);
    expect(table.coverage.factDays).toBe(3);
    expect(table.coverage.daysWithSpend).toBe(1);
  });

  it("expects every day of a period that already closed", () => {
    const table = buildDayQuality({
      factRows: septFacts(),
      spendByDay: {},
      periodStartKey: "2026-09-08",
      periodEndKey: "2026-09-10",
      todayKey: "2026-09-20",
      breakEvenMer: null,
    });
    expect(table.coverage.daysInPeriod).toBe(3);
    expect(table.coverage.expectedClosedDays).toBe(3);
    expect(table.coverage.factDays).toBe(3);
  });

  it("counts a spend day even when its sales fact is missing", () => {
    const table = buildDayQuality({
      factRows: { "2026-09-09": { sales: 1000, orderCount: 10 } },
      spendByDay: { "2026-09-08": 50, "2026-09-09": 200, "2026-09-30": 999 },
      periodStartKey: "2026-09-08",
      periodEndKey: "2026-09-10",
      todayKey: "2026-09-11",
      breakEvenMer: null,
    });
    expect(table.coverage.factDays).toBe(1);
    // Sep 8 has spend with no fact row; Sep 30 is outside the period.
    expect(table.coverage.daysWithSpend).toBe(2);
  });

  it("owes nothing when the period has not started closing", () => {
    const table = buildDayQuality({
      factRows: {},
      spendByDay: {},
      periodStartKey: "2026-09-10",
      periodEndKey: "2026-09-10",
      todayKey: "2026-09-10",
      breakEvenMer: null,
    });
    expect(table.coverage.daysInPeriod).toBe(1);
    expect(table.coverage.expectedClosedDays).toBe(0);
    expect(table.coverage.factDays).toBe(0);
  });
});

describe("buildDayQuality prior window", () => {
  it("computes prior totals when provided", () => {
    const table = buildDayQuality({
      factRows: { "2026-09-05": { sales: 200, orderCount: 2 } },
      spendByDay: { "2026-09-05": 50 },
      periodStartKey: "2026-09-01",
      periodEndKey: "2026-09-05",
      todayKey: "2026-09-05",
      breakEvenMer: 3,
      priorFactRows: {
        "2026-08-05": {
          sales: 400,
          orderCount: 4,
          newCustomerNetSales: 100,
          returningCustomerNetSales: 300,
        },
      },
      priorSpendByDay: { "2026-08-05": 100 },
      priorStartKey: "2026-08-01",
      priorEndKey: "2026-08-05",
    });
    expect(table.prior).not.toBeNull();
    expect(table.prior!.sales).toBe(400);
    expect(table.prior!.orders).toBe(4);
    expect(table.prior!.aov).toBeCloseTo(100);
    expect(table.prior!.roas).toBeCloseTo(4);
    expect(table.prior!.newShare).toBeCloseTo(0.25);
  });

  it("ignores prior days outside the prior window", () => {
    const table = buildDayQuality({
      factRows: { "2026-09-05": { sales: 200, orderCount: 2 } },
      spendByDay: {},
      periodStartKey: "2026-09-01",
      periodEndKey: "2026-09-05",
      todayKey: "2026-09-06",
      breakEvenMer: null,
      priorFactRows: {
        "2026-07-31": { sales: 9999, orderCount: 99 },
        "2026-08-05": { sales: 400, orderCount: 4 },
      },
      priorStartKey: "2026-08-01",
      priorEndKey: "2026-08-05",
    });
    expect(table.prior!.sales).toBe(400);
  });

  it("stays null without a prior window, and when the prior window is empty", () => {
    const base = {
      factRows: { "2026-09-05": { sales: 200, orderCount: 2 } },
      spendByDay: {},
      periodStartKey: "2026-09-01",
      periodEndKey: "2026-09-05",
      todayKey: "2026-09-06",
      breakEvenMer: null,
    };
    expect(buildDayQuality(base).prior).toBeNull();
    expect(
      buildDayQuality({
        ...base,
        priorFactRows: {},
        priorStartKey: "2026-08-01",
        priorEndKey: "2026-08-05",
      }).prior,
    ).toBeNull();
    expect(
      buildDayQuality({
        ...base,
        priorFactRows: { "2026-08-05": { sales: 400, orderCount: 4 } },
        priorStartKey: null,
        priorEndKey: null,
      }).prior,
    ).toBeNull();
  });
});

describe("buildDayQuality granularity", () => {
  function longFacts(days: number): Map<string, DayQualityFact> {
    const facts = new Map<string, DayQualityFact>();
    for (let i = 0; i < days; i++) {
      const key = new Date(Date.UTC(2026, 0, 1 + i, 12)).toISOString().slice(0, 10);
      facts.set(key, {
        sales: 100,
        orderCount: 2,
        newCustomerNetSales: 40,
        returningCustomerNetSales: 60,
      });
    }
    return facts;
  }

  it("rolls up to weeks for long periods", () => {
    const table = buildDayQuality({
      factRows: longFacts(70),
      spendByDay: {},
      periodStartKey: "2026-01-01",
      periodEndKey: "2026-03-11",
      todayKey: "2026-03-12",
      breakEvenMer: null,
    });
    expect(table.granularity).toBe("week");
    expect(table.rows.length).toBeGreaterThan(0);
    expect(table.rows.length).toBeLessThan(70);
    // Week rows still foot to the same period totals as the day board.
    expect(table.totals.sales).toBe(7000);
    expect(table.totals.orders).toBe(140);
    expect(
      table.rows.reduce((sum, row) => sum + row.sales, 0),
    ).toBeCloseTo(7000);
    expect(table.coverage.factDays).toBe(70);
  });

  it("keeps day rows for a month-sized period", () => {
    const table = buildDayQuality({
      factRows: longFacts(30),
      spendByDay: {},
      periodStartKey: "2026-01-01",
      periodEndKey: "2026-01-30",
      todayKey: "2026-01-31",
      breakEvenMer: null,
    });
    expect(table.granularity).toBe("day");
    expect(table.rows).toHaveLength(30);
  });

  it("honors a forced granularity and keeps weeks newest first", () => {
    const table = buildDayQuality({
      factRows: longFacts(14),
      spendByDay: { "2026-01-01": 100 },
      periodStartKey: "2026-01-01",
      periodEndKey: "2026-01-14",
      todayKey: "2026-01-14",
      breakEvenMer: 2,
      granularity: "week",
    });
    expect(table.granularity).toBe("week");
    expect(table.rows.length).toBeGreaterThan(1);
    const keys = table.rows.map((row) => row.dayKey);
    expect([...keys].sort().reverse()).toEqual(keys);
    expect(table.rows.some((row) => row.partial)).toBe(true);
    expect(table.rows.every((row) => row.label.includes("–"))).toBe(true);
    // Spend only landed in one week, so only that week can carry a band.
    expect(table.rows.filter((row) => row.band != null)).toHaveLength(1);
  });

  it("aggregates a forced week board's AOV and new share", () => {
    const table = buildDayQuality({
      factRows: {
        "2026-01-05": {
          sales: 300,
          orderCount: 2,
          newCustomerNetSales: 150,
          returningCustomerNetSales: 150,
        },
        "2026-01-06": {
          sales: 100,
          orderCount: 2,
          newCustomerNetSales: 50,
          returningCustomerNetSales: 50,
        },
      },
      spendByDay: { "2026-01-05": 50, "2026-01-06": 50 },
      periodStartKey: "2026-01-05",
      periodEndKey: "2026-01-06",
      todayKey: "2026-01-07",
      breakEvenMer: 3,
      granularity: "week",
    });
    expect(table.rows).toHaveLength(1);
    const week = table.rows[0]!;
    expect(week.orders).toBe(4);
    expect(week.sales).toBe(400);
    expect(week.aov).toBeCloseTo(100);
    expect(week.newShare).toBeCloseTo(0.5);
    expect(week.roas).toBeCloseTo(4);
    expect(week.band).toBe("above");
    expect(week.partial).toBe(false);
    expect(table.customerSplitAvailable).toBe(true);
  });
});

describe("formatDayQualityCsv", () => {
  function csvTable() {
    return buildDayQuality({
      factRows: septFacts(),
      spendByDay: { "2026-09-09": 200 },
      periodStartKey: "2026-09-08",
      periodEndKey: "2026-09-10",
      todayKey: "2026-09-10",
      breakEvenMer: 3,
    });
  }

  it("emits a header, a sortable day key, and a TOTAL line", () => {
    const csv = formatDayQualityCsv(csvTable());
    const lines = csv.trimEnd().split("\n");
    expect(lines[0]).toBe(
      "day,period,orders,sales,aov,new_sales,new_share,spend,roas,band,partial",
    );
    expect(lines).toHaveLength(5);
    expect(lines[1]!.startsWith("2026-09-10,Sep 10,")).toBe(true);
    expect(lines[4]!.startsWith("TOTAL,Total,")).toBe(true);
  });

  it("writes rows newest first with the same numbers as the table", () => {
    const table = csvTable();
    const lines = formatDayQualityCsv(table).trimEnd().split("\n");
    const cells = lines[2]!.split(",");
    expect(cells[0]).toBe("2026-09-09");
    expect(cells[2]).toBe("10");
    expect(cells[3]).toBe("1000.00");
    expect(cells[4]).toBe("100.00");
    expect(cells[5]).toBe("400.00");
    expect(cells[6]).toBe("40.0");
    expect(cells[7]).toBe("200.00");
    expect(cells[8]).toBe("5.00");
    expect(cells[9]).toBe("above");
    expect(cells[10]).toBe("0");
  });

  it("leaves unknown cells empty instead of writing 0 or NaN", () => {
    const csv = formatDayQualityCsv(
      buildDayQuality({
        factRows: { "2026-09-09": { sales: 0, orderCount: 0 } },
        spendByDay: {},
        periodStartKey: "2026-09-09",
        periodEndKey: "2026-09-09",
        todayKey: "2026-09-10",
        breakEvenMer: 3,
      }),
    );
    const cells = csv.trimEnd().split("\n")[1]!.split(",");
    // aov, new_sales, new_share, roas, band all unknown for this day.
    expect(cells[4]).toBe("");
    expect(cells[5]).toBe("");
    expect(cells[6]).toBe("");
    expect(cells[8]).toBe("");
    expect(cells[9]).toBe("");
    expect(csv).not.toMatch(/NaN/);
  });

  it("marks the partial day so a spreadsheet cannot read it as final", () => {
    const lines = formatDayQualityCsv(csvTable()).trimEnd().split("\n");
    expect(lines[1]!.endsWith(",1")).toBe(true);
    expect(lines[2]!.endsWith(",0")).toBe(true);
  });

  it("emits only a header and TOTAL when the period has no fact day", () => {
    const csv = formatDayQualityCsv(
      buildDayQuality({
        factRows: {},
        spendByDay: {},
        periodStartKey: "2026-09-01",
        periodEndKey: "2026-09-05",
        todayKey: "2026-09-10",
        breakEvenMer: 3,
      }),
    );
    const lines = csv.trimEnd().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]!.startsWith("TOTAL,Total,0,0.00,,,,0.00,,,")).toBe(true);
  });

  it("quotes a label that contains a comma", () => {
    const csv = formatDayQualityCsv({
      rows: [
        {
          dayKey: "2026-W37",
          label: "Sep 7, 2026–Sep 13, 2026",
          orders: 1,
          sales: 10,
          aov: 10,
          newSales: null,
          newShare: null,
          spend: 0,
          roas: null,
          band: null,
          partial: false,
        },
      ],
      totals: {
        orders: 1,
        sales: 10,
        aov: 10,
        newSales: null,
        newShare: null,
        spend: 0,
        roas: null,
      },
      prior: null,
      coverage: {
        factDays: 1,
        expectedClosedDays: 7,
        daysWithSpend: 0,
        daysInPeriod: 7,
      },
      customerSplitAvailable: false,
      granularity: "week",
    });
    expect(csv).toContain('"Sep 7, 2026–Sep 13, 2026"');
  });
});


describe("summarizeDayQuality", () => {
  it("picks best and softest closed days and AOV delta vs prior", () => {
    const table = buildDayQuality({
      factRows: {
        "2026-09-08": { sales: 800, orderCount: 8 },
        "2026-09-09": { sales: 1200, orderCount: 10 },
        "2026-09-10": { sales: 400, orderCount: 4 },
      },
      spendByDay: {},
      periodStartKey: "2026-09-08",
      periodEndKey: "2026-09-10",
      todayKey: "2026-09-10",
      breakEvenMer: null,
      priorFactRows: {
        "2026-08-09": { sales: 500, orderCount: 5 },
      },
      priorSpendByDay: {},
      priorStartKey: "2026-08-09",
      priorEndKey: "2026-08-09",
    });
    const insight = summarizeDayQuality(table);
    expect(insight.best?.label).toMatch(/9/);
    expect(insight.softest?.label).toMatch(/8/);
    // today (10) is partial — not in best/softest contest as winner of soft if filtered
    expect(insight.aovDeltaPct).not.toBeNull();
  });
});
