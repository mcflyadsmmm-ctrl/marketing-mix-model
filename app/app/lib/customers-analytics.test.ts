import { describe, expect, it } from "vitest";
import {
  buildCustomerAnalytics,
  bucketMixDays,
  bucketMixWeeks,
  buildReturningMixPlays,
  emptyCustomerAnalytics,
  mixSummary,
  resolveMixGrain,
  RETENTION_GUEST_KEY,
  type RetentionOrderRow,
} from "./customers-analytics";

const DAY_MS = 86_400_000;
const WINDOW_END = new Date("2026-09-16T00:00:00Z");

function at(daysBeforeEnd: number): Date {
  return new Date(WINDOW_END.getTime() - daysBeforeEnd * DAY_MS);
}

function buildFixture(): RetentionOrderRow[] {
  const rows: RetentionOrderRow[] = [];
  // 5 one-order buyers with distinct spend bands.
  const oneOrderSpend = [150, 300, 600, 900, 1500];
  oneOrderSpend.forEach((amount, i) => {
    rows.push({ customerKey: `one-${i}`, orderedAt: at(70), amount });
  });
  // 5 repeat buyers, each two orders with a known days-to-2nd gap.
  const gaps = [3, 10, 40, 70, 5];
  gaps.forEach((gap, i) => {
    rows.push({ customerKey: `rep-${i}`, orderedAt: at(80), amount: 400 });
    rows.push({ customerKey: `rep-${i}`, orderedAt: at(80 - gap), amount: 400 });
  });
  // A guest order — counted as an order, never a buyer.
  rows.push({ customerKey: RETENTION_GUEST_KEY, orderedAt: at(20), amount: 250 });
  return rows;
}

describe("buildCustomerAnalytics", () => {
  const a = buildCustomerAnalytics(buildFixture(), {
    windowEnd: WINDOW_END,
    historyWindowDays: 90,
  });

  it("counts identified buyers, guests, and orders from history only", () => {
    expect(a.available).toBe(true);
    expect(a.identifiedBuyers).toBe(10);
    expect(a.guestOrders).toBe(1);
    expect(a.windowOrders).toBe(16);
  });

  it("builds an order-frequency long tail", () => {
    const one = a.orderFrequency.find((b) => b.label === "1 order");
    const two = a.orderFrequency.find((b) => b.label === "2 orders");
    const three = a.orderFrequency.find((b) => b.label === "3 orders");
    expect(one?.customers).toBe(5);
    expect(two?.customers).toBe(5);
    expect(three?.customers).toBe(0);
  });

  it("buckets per-customer spend into bands that sum to all buyers", () => {
    const total = a.spendBands.reduce((s, b) => s + b.customers, 0);
    expect(total).toBe(10);
    const b0 = a.spendBands.find((b) => b.label === "$0–250");
    expect(b0?.customers).toBe(1);
    const b800 = a.spendBands.find((b) => b.label === "$500–1k");
    // two one-order ($600,$900) + five repeat ($800) = 7 buyers in $500–1k
    expect(b800?.customers).toBe(7);
  });

  it("computes the repurchase clock (p25 / median / p75) and win-back day", () => {
    expect(a.repurchaseFastDays).toBe(5);
    expect(a.repurchaseTypicalDays).toBe(10);
    expect(a.repurchaseSlowDays).toBe(40);
    expect(a.winBackDay).toBe(25);
    expect(a.repeaters).toBe(5);
    // 5 one-order buyers, last order 70d ago, all past the 25d win-back.
    expect(a.saveNowOneOrder).toBe(5);
  });

  it("bins days-to-2nd and withholds buckets past the observed window", () => {
    const b07 = a.daysToSecond.find((b) => b.label === "0–7d");
    const b830 = a.daysToSecond.find((b) => b.label === "8–30d");
    expect(b07?.customers).toBe(2);
    expect(b830?.customers).toBe(1);
    expect(a.daysToSecond.some((b) => b.label === "365d+")).toBe(false);
    expect(a.daysToSecondTruncatedAt).not.toBeNull();
  });

  it("reads retention cadence honestly by eligibility window", () => {
    expect(a.everRepeatShare).toBeCloseTo(0.5, 5);
    expect(a.everRepeatCount).toBe(5);
    expect(a.within30Share).toBeCloseTo(0.3, 5);
    expect(a.eligible30).toBe(10);
    expect(a.within60Share).toBeCloseTo(0.4, 5);
  });

  it("builds a fall-off funnel", () => {
    expect(a.repeatBuyers).toBe(5);
    expect(a.thirdPlusBuyers).toBe(0);
    expect(a.repeatShare).toBeCloseTo(0.5, 5);
  });
});

describe("new vs returning weekly mix", () => {
  const a = buildCustomerAnalytics(buildFixture(), {
    windowEnd: WINDOW_END,
    historyWindowDays: 90,
  });

  it("splits weekly dollars into first-time vs returning (guests are first-time)", () => {
    expect(a.mixWeekly.length).toBeGreaterThanOrEqual(2);
    const newSum = a.mixWeekly.reduce((s, w) => s + w.newDollars, 0);
    const retSum = a.mixWeekly.reduce((s, w) => s + w.returningDollars, 0);
    // 5 repeat buyers' second orders ($400 each) are the only returning dollars.
    expect(retSum).toBe(2000);
    expect(newSum).toBe(5700);
    for (const w of a.mixWeekly) {
      expect(w.total).toBe(w.newDollars + w.returningDollars);
    }
  });

  it("reports a dollar-weighted returning-share rail", () => {
    expect(a.mixReturningShareAvg).toBeCloseTo(2000 / 7700, 4);
  });

  it("splits the same dollars by day, guests staying first-time", () => {
    expect(a.mixDaily.length).toBeGreaterThanOrEqual(2);
    const newSum = a.mixDaily.reduce((s, d) => s + d.newDollars, 0);
    const retSum = a.mixDaily.reduce((s, d) => s + d.returningDollars, 0);
    expect(retSum).toBe(2000);
    expect(newSum).toBe(5700);
    for (const d of a.mixDaily) {
      expect(d.total).toBe(d.newDollars + d.returningDollars);
      expect(d.label).toMatch(/^\d{1,2}\/\d{1,2}$/);
    }
    const dayBuckets = bucketMixDays(a.mixDaily);
    expect(dayBuckets.map((b) => b.total)).toEqual(a.mixDaily.map((d) => d.total));
  });

  it("counts a buyer as returning when their previous order is stored outside the 90-day slice", () => {
    const recent = at(10);
    const spring = at(120);
    const windowRows: RetentionOrderRow[] = [
      { customerKey: "quiet", orderedAt: recent, amount: 80, lifetimeOrders: 2 },
      { customerKey: "fresh", orderedAt: at(12), amount: 40, lifetimeOrders: 1 },
      {
        customerKey: RETENTION_GUEST_KEY,
        orderedAt: at(11),
        amount: 25,
        lifetimeOrders: null,
      },
    ];
    const book: RetentionOrderRow[] = [
      { customerKey: "quiet", orderedAt: spring, amount: 55, lifetimeOrders: 2 },
      ...windowRows,
    ];
    const built = buildCustomerAnalytics(windowRows, {
      windowEnd: WINDOW_END,
      historyWindowDays: 90,
      orderBook: book,
    });
    const newSum = built.mixWeekly.reduce((s, w) => s + w.newDollars, 0);
    const retSum = built.mixWeekly.reduce((s, w) => s + w.returningDollars, 0);
    // Spring dollars stay outside the 90-day mix. The quiet buyer's later
    // order is returning. The guest stays first-time dollars, not returning.
    expect(retSum).toBe(80);
    expect(newSum).toBe(65);
    expect(built.mixWeekly.some((w) => w.newDollars === 55 || w.returningDollars === 55)).toBe(
      false,
    );
    const week = built.mixWeekly.find((w) => w.returningDollars === 80);
    expect(week?.firstTimeBuyers).toBe(1);
    expect(week?.returningDollars).toBe(80);
    const quietDay = built.mixDaily.find((d) => d.returningDollars === 80);
    expect(quietDay?.newDollars).toBe(0);
    const month = bucketMixWeeks(built.mixWeekly, "month");
    expect(month.reduce((s, b) => s + b.returningDollars, 0)).toBe(80);
    expect(month.reduce((s, b) => s + (b.firstTimeBuyers ?? 0), 0)).toBe(1);
    // Frequency still reads the 90-day slice, not the spring order.
    expect(built.identifiedBuyers).toBe(2);
    expect(built.guestOrders).toBe(1);
  });

  it("keeps a missing lifetime count unknown instead of a fake zero", () => {
    const rows: RetentionOrderRow[] = [
      { customerKey: "unsure", orderedAt: at(5), amount: 30, lifetimeOrders: null },
    ];
    const built = buildCustomerAnalytics(rows, {
      windowEnd: WINDOW_END,
      historyWindowDays: 90,
      orderBook: rows,
    });
    expect(built.mixWeekly).toHaveLength(1);
    expect(built.mixWeekly[0]!.newDollars).toBe(30);
    expect(built.mixWeekly[0]!.returningDollars).toBe(0);
    expect(built.mixWeekly[0]!.firstTimeBuyers).toBeNull();
    expect(built.mixDaily[0]!.firstTimeBuyers).toBeNull();
    const summary = mixSummary(bucketMixWeeks(built.mixWeekly, "week"));
    expect(summary.firstTimeBuyers).toBeNull();
    expect(summary.newDollars).toBe(30);
  });

  it("does not call a buyer new when stored lifetime orders exceed the book", () => {
    const rows: RetentionOrderRow[] = [
      { customerKey: "prior", orderedAt: at(4), amount: 70, lifetimeOrders: 5 },
    ];
    const built = buildCustomerAnalytics(rows, {
      windowEnd: WINDOW_END,
      historyWindowDays: 90,
      orderBook: rows,
    });
    expect(built.mixWeekly[0]!.newDollars).toBe(0);
    expect(built.mixWeekly[0]!.returningDollars).toBe(70);
    expect(built.mixWeekly[0]!.firstTimeBuyers).toBe(0);
  });

  it("keeps guests out of returning and out of the first-time buyer count", () => {
    const rows: RetentionOrderRow[] = [
      {
        customerKey: RETENTION_GUEST_KEY,
        orderedAt: at(3),
        amount: 15,
        lifetimeOrders: null,
      },
    ];
    const built = buildCustomerAnalytics(rows, {
      windowEnd: WINDOW_END,
      historyWindowDays: 90,
      orderBook: rows,
    });
    expect(built.mixWeekly[0]!.newDollars).toBe(15);
    expect(built.mixWeekly[0]!.returningDollars).toBe(0);
    expect(built.mixWeekly[0]!.firstTimeBuyers).toBe(0);
  });
});

describe("bucketMixWeeks + mixSummary — marquee grain toggle", () => {
  const a = buildCustomerAnalytics(buildFixture(), {
    windowEnd: WINDOW_END,
    historyWindowDays: 90,
  });

  it("passes weekly buckets through 1:1 at week grain", () => {
    const weekly = bucketMixWeeks(a.mixWeekly, "week");
    expect(weekly.length).toBe(a.mixWeekly.length);
    expect(weekly.map((b) => b.total)).toEqual(a.mixWeekly.map((w) => w.total));
    // Dollars are conserved across the grain.
    const ret = weekly.reduce((s, b) => s + b.returningDollars, 0);
    expect(ret).toBe(2000);
  });

  it("rolls weeks up to calendar months, conserving dollars", () => {
    const monthly = bucketMixWeeks(a.mixWeekly, "month");
    const weeklyRet = a.mixWeekly.reduce((s, w) => s + w.returningDollars, 0);
    const weeklyNew = a.mixWeekly.reduce((s, w) => s + w.newDollars, 0);
    const monthlyRet = monthly.reduce((s, b) => s + b.returningDollars, 0);
    const monthlyNew = monthly.reduce((s, b) => s + b.newDollars, 0);
    expect(monthlyRet).toBe(weeklyRet);
    expect(monthlyNew).toBe(weeklyNew);
    // Fewer (or equal) columns than weeks, and a month label like "Jul".
    expect(monthly.length).toBeLessThanOrEqual(a.mixWeekly.length);
    expect(monthly.every((b) => /^[A-Z][a-z]{2}$/.test(b.label))).toBe(true);
    for (const b of monthly) {
      expect(b.total).toBe(b.newDollars + b.returningDollars);
    }
  });

  it("summarizes window totals, average share, and the best returning week", () => {
    const weekly = bucketMixWeeks(a.mixWeekly, "week");
    const s = mixSummary(weekly);
    expect(s.returningDollars).toBe(2000);
    expect(s.newDollars).toBe(5700);
    expect(s.total).toBe(7700);
    expect(s.returningShareAvg).toBeCloseTo(2000 / 7700, 4);
    expect(s.bestReturning).not.toBeNull();
    expect(s.bestReturning!.returningDollars).toBeGreaterThan(0);
  });

  it("is honest on empty — no buckets, null summary share", () => {
    const empty = mixSummary(bucketMixWeeks([], "month"));
    expect(empty.total).toBe(0);
    expect(empty.returningShareAvg).toBeNull();
    expect(empty.bestReturning).toBeNull();
  });

  it("conserves rounded cents so first-time + returning = week total", () => {
    // 10.40 + 10.40 would independently round to $10 + $10 vs $21.
    const rows: RetentionOrderRow[] = [
      { customerKey: "a", orderedAt: at(8), amount: 10.4 },
      { customerKey: "a", orderedAt: at(7), amount: 10.4 },
    ];
    const a = buildCustomerAnalytics(rows, {
      windowEnd: WINDOW_END,
      historyWindowDays: 90,
    });
    expect(a.mixWeekly.length).toBeGreaterThan(0);
    for (const w of a.mixWeekly) {
      expect(w.total).toBe(w.newDollars + w.returningDollars);
    }
    const s = mixSummary(bucketMixWeeks(a.mixWeekly, "week"));
    expect(s.total).toBe(s.newDollars + s.returningDollars);
    expect(s.returningShareAvg).toBeCloseTo(s.returningDollars / s.total, 8);
  });
});

describe("returning $ mix plays — daily/weekly habit, not a days-to-second dump", () => {
  it("compares the latest week with the prior week in green-or-grey tones", () => {
    const rows: RetentionOrderRow[] = [
      { customerKey: "a", orderedAt: new Date("2026-09-01T12:00:00Z"), amount: 100 },
      { customerKey: "a", orderedAt: new Date("2026-09-08T12:00:00Z"), amount: 40 },
      { customerKey: "b", orderedAt: new Date("2026-09-08T12:00:00Z"), amount: 60 },
      { customerKey: "b", orderedAt: new Date("2026-09-15T12:00:00Z"), amount: 80 },
    ];
    const built = buildCustomerAnalytics(rows, {
      windowEnd: new Date("2026-09-16T00:00:00Z"),
      historyWindowDays: 90,
    });
    const weekly = bucketMixWeeks(built.mixWeekly, "week");
    const plays = buildReturningMixPlays({
      buckets: weekly,
      grain: "week",
      winBackDay: built.winBackDay,
      saveNowOneOrder: built.saveNowOneOrder,
    });
    expect(plays.map((p) => p.id)).toEqual(["latest", "share", "winback"]);
    const latest = plays[0]!;
    expect(latest.label).toBe("Latest week");
    expect(latest.amount).toBe(80);
    expect(latest.delta?.tone).toBe("up");
    expect(latest.delta?.unit).toBe("dollars");
    expect(latest.delta?.amount).toBe(40);
    expect(latest.delta?.versus).toBe("vs prior week");
    const share = plays[1]!;
    expect(share.delta?.unit).toBe("points");
    expect(share.delta?.tone).toBe("up");
    expect(share.delta?.versus).toBe("vs usual");
    const winback = plays[2]!;
    expect(winback.verb).toBe("Win-back");
    expect(winback.amount).toBeNull();
    expect(winback.sub).toContain("not $0");
    expect(winback.delta).toBeNull();
  });

  it("names a down week in the grey tone and counts save-now buyers", () => {
    const rows: RetentionOrderRow[] = [];
    const gaps = [4, 8, 12, 16, 20];
    gaps.forEach((gap, i) => {
      rows.push({
        customerKey: `rep-${i}`,
        orderedAt: new Date("2026-07-01T12:00:00Z"),
        amount: 100,
      });
      rows.push({
        customerKey: `rep-${i}`,
        orderedAt: new Date(Date.UTC(2026, 6, 1 + gap, 12)),
        amount: 50,
      });
    });
    rows.push({
      customerKey: "late",
      orderedAt: new Date("2026-08-01T12:00:00Z"),
      amount: 200,
    });
    rows.push({
      customerKey: "one",
      orderedAt: new Date("2026-07-02T12:00:00Z"),
      amount: 90,
    });
    const built = buildCustomerAnalytics(rows, {
      windowEnd: new Date("2026-09-16T00:00:00Z"),
      historyWindowDays: 120,
    });
    const weekly = bucketMixWeeks(built.mixWeekly, "week");
    const plays = buildReturningMixPlays({
      buckets: weekly,
      grain: "week",
      winBackDay: built.winBackDay,
      saveNowOneOrder: built.saveNowOneOrder,
    });
    expect(built.winBackDay).not.toBeNull();
    expect(built.saveNowOneOrder).toBeGreaterThan(0);
    const latest = plays[0]!;
    expect(latest.delta?.tone === "down" || latest.delta?.tone === "flat").toBe(true);
    const winback = plays[2]!;
    expect(winback.amount).toBe(built.saveNowOneOrder);
    expect(winback.sub).toContain(`day ${built.winBackDay}`);
    expect(winback.detail).toContain("Order-history");
    expect(winback.detail).not.toMatch(/Klaviyo|pixel|ROAS|COGS/i);
  });

  it("switches the latest label with daily grain", () => {
    const rows: RetentionOrderRow[] = [
      { customerKey: "a", orderedAt: new Date("2026-09-13T12:00:00Z"), amount: 20 },
      { customerKey: "a", orderedAt: new Date("2026-09-14T12:00:00Z"), amount: 40 },
      { customerKey: "b", orderedAt: new Date("2026-09-15T12:00:00Z"), amount: 15 },
    ];
    const built = buildCustomerAnalytics(rows, {
      windowEnd: new Date("2026-09-16T00:00:00Z"),
      historyWindowDays: 90,
    });
    const plays = buildReturningMixPlays({
      buckets: bucketMixDays(built.mixDaily),
      grain: "day",
      winBackDay: null,
      saveNowOneOrder: 0,
    });
    expect(plays[0]?.label).toBe("Latest day");
    expect(plays[0]?.amount).toBe(0);
    expect(plays[0]?.delta?.versus).toBe("vs prior day");
    expect(plays[0]?.delta?.amount).toBe(-40);
    expect(plays[0]?.delta?.tone).toBe("down");
  });

  it("falls back from a grain that cannot paint", () => {
    expect(resolveMixGrain("day", { day: false, week: true, month: false })).toBe("week");
    expect(resolveMixGrain("month", { day: true, week: true, month: false })).toBe("week");
    expect(resolveMixGrain("week", { day: true, week: false, month: false })).toBe("day");
    expect(resolveMixGrain("week", { day: false, week: false, month: false })).toBe("week");
  });
});

describe("whale recency", () => {
  it("buckets 5+ order buyers by days since last order", () => {
    const rows: RetentionOrderRow[] = [];
    // A whale: 6 orders, last one 10 days ago → 0–30d bucket.
    for (let i = 0; i < 6; i += 1) {
      rows.push({ customerKey: "whale-a", orderedAt: at(85 - i * 15), amount: 700 });
    }
    // A whale idle 45 days → 31–60d bucket.
    for (let i = 0; i < 5; i += 1) {
      rows.push({ customerKey: "whale-b", orderedAt: at(88 - i * 8), amount: 500 });
    }
    // A non-whale (3 orders) is never counted.
    for (let i = 0; i < 3; i += 1) {
      rows.push({ customerKey: "minnow", orderedAt: at(80 - i * 5), amount: 300 });
    }
    const a = buildCustomerAnalytics(rows, {
      windowEnd: WINDOW_END,
      historyWindowDays: 90,
    });
    expect(a.whaleCount).toBe(2);
    const b030 = a.whaleRecency.find((b) => b.label === "0–30d");
    const b3160 = a.whaleRecency.find((b) => b.label === "31–60d");
    expect(b030?.buyers).toBe(1);
    expect(b3160?.buyers).toBe(1);
    expect(a.whaleRecency.some((b) => b.label === "2y+")).toBe(false);
    expect(a.whaleRecencyTruncatedAt).not.toBeNull();
  });
});

describe("emptyCustomerAnalytics", () => {
  it("is honest zeros, not fakes", () => {
    const e = emptyCustomerAnalytics();
    expect(e.available).toBe(false);
    expect(e.identifiedBuyers).toBe(0);
    expect(e.everRepeatShare).toBeNull();
    expect(e.repurchaseTypicalDays).toBeNull();
    expect(e.winBackDay).toBeNull();
  });
});
