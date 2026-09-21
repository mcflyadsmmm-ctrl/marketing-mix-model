import { describe, expect, it } from "vitest";
import {
  buildGrowthTt2,
  emptyGrowthTt2,
  growthTt2EmptyState,
  growthTt2HistoryLine,
  growthTt2Read,
  TT2_GUEST_KEY,
  TT2_MIN_BUYERS,
  TT2_MIN_FOLLOW_DAYS,
  TT2_MIN_GAPS,
  TT2_WINBACK_PAD_DAYS,
  type GrowthTt2OrderRow,
} from "./growth-tt2";

const DAY_MS = 86_400_000;
const WINDOW_END = new Date("2026-09-16T00:00:00Z");

function at(daysBeforeEnd: number): Date {
  return new Date(WINDOW_END.getTime() - daysBeforeEnd * DAY_MS);
}

function book(
  spec: Array<{ key: string; orders: Array<{ d: number; amt: number }> }>,
): GrowthTt2OrderRow[] {
  const rows: GrowthTt2OrderRow[] = [];
  for (const buyer of spec) {
    for (const o of buyer.orders) {
      rows.push({ customerKey: buyer.key, orderedAt: at(o.d), amount: o.amt });
    }
  }
  return rows;
}

/**
 * 10 matured buyers: 5 repeaters with 5 / 5 / 10 / 40 / 40 day gaps
 * (odd count so linear percentiles land on the values), plus 5 one-order
 * buyers whose first order was 70d ago.
 */
function richBook(): GrowthTt2OrderRow[] {
  const rows = book([
    {
      key: "r-fast-a",
      orders: [
        { d: 80, amt: 80 },
        { d: 75, amt: 90 },
      ],
    },
    {
      key: "r-fast-b",
      orders: [
        { d: 70, amt: 85 },
        { d: 65, amt: 95 },
      ],
    },
    {
      key: "r-mid",
      orders: [
        { d: 80, amt: 100 },
        { d: 70, amt: 110 },
      ],
    },
    {
      key: "r-slow-a",
      orders: [
        { d: 80, amt: 70 },
        { d: 40, amt: 80 },
      ],
    },
    {
      key: "r-slow-b",
      orders: [
        { d: 75, amt: 75 },
        { d: 35, amt: 85 },
      ],
    },
    { key: "one-a", orders: [{ d: 70, amt: 60 }] },
    { key: "one-b", orders: [{ d: 70, amt: 62 }] },
    { key: "one-c", orders: [{ d: 70, amt: 64 }] },
    { key: "one-d", orders: [{ d: 70, amt: 66 }] },
    { key: "one-e", orders: [{ d: 70, amt: 68 }] },
  ]);
  rows.push({ customerKey: TT2_GUEST_KEY, orderedAt: at(10), amount: 9999 });
  return rows;
}

describe("growthTt2EmptyState — floor 8 buyers × 30 days", () => {
  it("is syncing with a verb when no buyers are on file", () => {
    const e = growthTt2EmptyState(0, 0);
    expect(e?.kind).toBe("syncing");
    expect(e?.need).toBe(TT2_MIN_BUYERS);
    expect(e?.verb).toBe("Refresh this page");
    expect(e?.copy).toMatch(/not \$0/);
  });

  it("is thin below the buyer floor", () => {
    const e = growthTt2EmptyState(3, 3);
    expect(e?.kind).toBe("thin");
    expect(e?.buyers).toBe(3);
    expect(e?.copy).toContain("3 identified buyers");
    expect(e?.copy).toContain(String(TT2_MIN_FOLLOW_DAYS));
  });

  it("is young when 8+ buyers have not lived 30 days", () => {
    const e = growthTt2EmptyState(10, 4);
    expect(e?.kind).toBe("young");
    expect(e?.verb).toBe("Wait for day 30");
    expect(e?.copy).toMatch(/not \$0/);
  });

  it("is null once the floor has lived 30 days", () => {
    expect(growthTt2EmptyState(8, 8)).toBeNull();
  });
});

describe("buildGrowthTt2 — habit clock + win-back", () => {
  const view = buildGrowthTt2(richBook(), {
    windowEnd: WINDOW_END,
    historyLimited: false,
  });

  it("seals after 8 matured identified buyers and ignores guests", () => {
    expect(view.available).toBe(true);
    expect(view.empty).toBeNull();
    expect(view.identifiedBuyers).toBe(10);
    expect(view.maturedBuyers).toBe(10);
    expect(view.historyLimited).toBe(false);
    expect(view.gapCount).toBe(5);
  });

  it("computes fast / typical / slow wait and win-back = typical + 15", () => {
    expect(view.fastDays).toBe(5);
    expect(view.typicalDays).toBe(10);
    expect(view.slowDays).toBe(40);
    expect(view.habitSpanDays).toBe(35);
    expect(view.winBackDay).toBe(10 + TT2_WINBACK_PAD_DAYS);
    expect(view.clockEmpty).toBeNull();
  });

  it("counts one-order buyers already past the win-back day", () => {
    expect(view.oneOrderBuyers).toBe(5);
    expect(view.reachNow).toBe(5);
    expect(view.fallEmpty).toBeNull();
  });

  it("bins days-to-2nd and still-waiting fall-off, withholding year buckets on a 80-day book", () => {
    const b07 = view.daysToSecond.find((b) => b.label === "0–7d");
    const b830 = view.daysToSecond.find((b) => b.label === "8–30d");
    const b3160 = view.daysToSecond.find((b) => b.label === "31–60d");
    expect(b07?.buyers).toBe(2);
    expect(b830?.buyers).toBe(1);
    expect(b3160?.buyers).toBe(2);
    expect(view.daysToSecond.some((b) => b.label === "365d+")).toBe(false);
    expect(view.daysToSecondTruncatedAt).not.toBeNull();

    const waiting = view.fallOff.find((b) => b.label === "61–90d");
    expect(waiting?.buyers).toBe(5);
    expect(view.fallOff.some((b) => b.label === "365d+")).toBe(false);
  });

  it("reads 30-day come-back only among buyers who have lived 30 days", () => {
    // 3 of 10 came back inside 30d (5, 5, 10 — not the 40d pair).
    expect(view.eligible30).toBe(10);
    expect(view.within30Count).toBe(3);
    expect(view.within30Share).toBeCloseTo(0.3, 5);
  });

  it("withholds a 0% weekend share when every second order is Mon–Fri", () => {
    expect(view.weekend.weekendCount).toBe(0);
    expect(view.weekend.weekdayCount).toBe(5);
    expect(view.weekend.weekendShare).toBeNull();
    expect(view.weekend.peakDay).toBeNull();
  });
});

describe("buildGrowthTt2 — second-order weekends", () => {
  function local(isoDay: string): Date {
    return new Date(`${isoDay}T00:00:00.000Z`);
  }

  function weekendBook(): GrowthTt2OrderRow[] {
    const pairs: Array<[string, string, string, string]> = [
      // Second order's UTC instant is Friday; shop-local Saturday wins.
      ["w1", "2026-05-01", "2026-06-05T22:00:00.000Z", "2026-06-06"],
      ["w2", "2026-05-02", "2026-06-07T15:00:00.000Z", "2026-06-07"],
      ["w3", "2026-05-03", "2026-06-13T15:00:00.000Z", "2026-06-13"],
      ["w4", "2026-05-04", "2026-06-15T15:00:00.000Z", "2026-06-15"],
      ["w5", "2026-05-05", "2026-06-17T15:00:00.000Z", "2026-06-17"],
    ];
    const rows: GrowthTt2OrderRow[] = [];
    for (const [key, first, secondAt, secondLocal] of pairs) {
      rows.push({
        customerKey: key,
        orderedAt: local(first),
        shopLocalDate: local(first),
        amount: 80,
      });
      rows.push({
        customerKey: key,
        orderedAt: new Date(secondAt),
        shopLocalDate: local(secondLocal),
        amount: 90,
      });
    }
    for (const day of ["2026-06-01", "2026-06-02", "2026-06-03"]) {
      rows.push({
        customerKey: `one-${day}`,
        orderedAt: local(day),
        shopLocalDate: local(day),
        amount: 40,
      });
    }
    rows.push({
      customerKey: TT2_GUEST_KEY,
      orderedAt: local("2026-06-06"),
      shopLocalDate: local("2026-06-06"),
      amount: 9999,
    });
    return rows;
  }

  it("counts Sat–Sun second orders on the shop calendar and ignores guests", () => {
    const view = buildGrowthTt2(weekendBook(), {
      windowEnd: WINDOW_END,
      historyLimited: false,
    });
    expect(view.available).toBe(true);
    expect(view.gapCount).toBe(5);
    expect(view.weekend.weekendCount).toBe(3);
    expect(view.weekend.weekdayCount).toBe(2);
    expect(view.weekend.weekendShare).toBeCloseTo(0.6, 5);
    expect(view.weekend.peakDay).toBe("Saturday");
    expect(view.weekend.peakCount).toBe(2);
  });

  it("keeps weekend share null until five second orders", () => {
    const rows = book(
      Array.from({ length: 8 }, (_, i) => ({
        key: `o${i}`,
        orders: [{ d: 40, amt: 50 + i }],
      })),
    );
    rows.push({
      customerKey: "rep",
      orderedAt: at(50),
      amount: 80,
      shopLocalDate: new Date("2026-07-28T00:00:00.000Z"),
    });
    rows.push({
      customerKey: "rep",
      orderedAt: at(20),
      amount: 90,
      shopLocalDate: new Date("2026-08-27T00:00:00.000Z"),
    });
    const view = buildGrowthTt2(rows, {
      windowEnd: WINDOW_END,
      historyLimited: false,
    });
    expect(view.gapCount).toBe(1);
    expect(view.weekend.weekendShare).toBeNull();
    expect(view.weekend.weekendCount + view.weekend.weekdayCount).toBe(1);
  });
});

describe("growthTt2Read — one morning sentence", () => {
  it("leads with typical wait and who to reach", () => {
    const view = buildGrowthTt2(richBook(), {
      windowEnd: WINDOW_END,
      historyLimited: false,
    });
    const read = growthTt2Read(view);
    expect(read).not.toBeNull();
    expect(read!.typicalDays).toBe(10);
    expect(read!.reachNow).toBe(5);
    expect(read!.line).toMatch(/Typical wait is 10 days/);
    expect(read!.line).toMatch(/already past day 25/);
    expect(read!.line).not.toMatch(/spend|ROAS|p25|p75/i);
  });

  it("is null while the first-win empty is up", () => {
    expect(growthTt2Read(emptyGrowthTt2())).toBeNull();
  });
});

describe("buildGrowthTt2 — thin / young / limited honesty", () => {
  it("stays an ActionCard-shaped empty below the floor", () => {
    const rows = book([
      { key: "a", orders: [{ d: 40, amt: 80 }] },
      { key: "b", orders: [{ d: 20, amt: 70 }] },
    ]);
    const view = buildGrowthTt2(rows, {
      windowEnd: WINDOW_END,
      historyLimited: false,
    });
    expect(view.available).toBe(false);
    expect(view.empty?.kind).toBe("thin");
    expect(view.typicalDays).toBeNull();
    expect(view.reachNow).toBe(0);
    expect(view.clockEmpty?.verb).toBe("Watch first 30 days");
  });

  it("is young when eight buyers have not lived 30 days", () => {
    const rows = book(
      Array.from({ length: 8 }, (_, i) => ({
        key: `y${i}`,
        orders: [{ d: 10, amt: 50 + i }],
      })),
    );
    const view = buildGrowthTt2(rows, {
      windowEnd: WINDOW_END,
      historyLimited: false,
    });
    expect(view.available).toBe(false);
    expect(view.empty?.kind).toBe("young");
    expect(view.empty?.verb).toBe("Wait for day 30");
  });

  it("marks year-scale fall-off truncated when history is limited — not a fake year", () => {
    const view = buildGrowthTt2(richBook(), {
      windowEnd: WINDOW_END,
      historyLimited: true,
    });
    expect(view.available).toBe(true);
    expect(view.historyLimited).toBe(true);
    expect(view.daysToSecondTruncatedAt).toBe(view.historyDays);
    expect(view.fallOffTruncatedAt).toBe(view.historyDays);
    expect(growthTt2HistoryLine(view)).toMatch(/not a fake year/);
  });

  it("uses a designed clock empty when the floor is met but second orders are missing", () => {
    const rows = book(
      Array.from({ length: 8 }, (_, i) => ({
        key: `o${i}`,
        orders: [{ d: 40, amt: 50 + i }],
      })),
    );
    const view = buildGrowthTt2(rows, {
      windowEnd: WINDOW_END,
      historyLimited: false,
    });
    expect(view.available).toBe(true);
    expect(view.empty).toBeNull();
    expect(view.gapCount).toBeLessThan(TT2_MIN_GAPS);
    expect(view.typicalDays).toBeNull();
    expect(view.winBackDay).toBeNull();
    expect(view.clockEmpty?.verb).toBe("Wait for a second order");
    expect(view.clockEmpty?.copy).toMatch(/not \$0/);
    expect(view.oneOrderBuyers).toBe(8);
    const read = growthTt2Read(view);
    expect(read?.line).toMatch(/still waiting/);
  });

  it("uses a designed fall-off empty when every buyer already came back", () => {
    const rows = book(
      Array.from({ length: 8 }, (_, i) => ({
        key: `r${i}`,
        orders: [
          { d: 50, amt: 80 + i },
          { d: 40, amt: 90 + i },
        ],
      })),
    );
    const view = buildGrowthTt2(rows, {
      windowEnd: WINDOW_END,
      historyLimited: false,
    });
    expect(view.available).toBe(true);
    expect(view.oneOrderBuyers).toBe(0);
    expect(view.reachNow).toBe(0);
    expect(view.fallEmpty?.copy).toMatch(/not zero/i);
    expect(view.fallEmpty?.verb).toBe("Watch the next 30 days");
  });
});

describe("emptyGrowthTt2", () => {
  it("is honest zeros, not a fake clock", () => {
    const e = emptyGrowthTt2();
    expect(e.available).toBe(false);
    expect(e.identifiedBuyers).toBe(0);
    expect(e.empty?.kind).toBe("syncing");
    expect(e.typicalDays).toBeNull();
    expect(e.reachNow).toBe(0);
    expect(e.weekend.weekendShare).toBeNull();
    expect(e.weekend.weekendCount).toBe(0);
  });
});
