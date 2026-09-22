import { describe, expect, it } from "vitest";
import {
  buildBuyerLifetimeSpan,
  buildComebackNextWait,
  buildCustomerAnalytics,
  bucketMixDays,
  bucketMixWeeks,
  buildOrderSteps,
  buildQuietBackDollars,
  buildReturningMixPlays,
  buyerLifetimeSpanLine,
  emptyCustomerAnalytics,
  mixFirstTimePaint,
  mixReturningPaint,
  mixSummary,
  mixTotalPaint,
  ORDER_STEP_MIN_BUYERS,
  orderStepFormula,
  orderStepReachLabel,
  orderStepTicketLabel,
  orderStepWaitLabel,
  resolveMixGrain,
  RETENTION_GUEST_KEY,
  type OrderStepId,
  type OrderStepRow,
  type RetentionOrderRow,
} from "./customers-analytics";
import { formatCurrency } from "./mer-format";

/** Chart mixMoney: a leaked 0 paints a certified $0, a withheld figure paints —. */
function paintedMixMoney(amount: number | null): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return formatCurrency(amount, "USD");
}

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
    timeZone: "UTC",
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
    timeZone: "UTC",
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
      timeZone: "UTC",
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
      timeZone: "UTC",
    });
    expect(built.mixWeekly).toHaveLength(1);
    const week = built.mixWeekly[0]!;
    expect(week.newDollars).not.toBe(30);
    expect(week.unknownDollars).toBe(30);
    expect(week.returningDollars).toBe(0);
    expect(week.returningShare).toBeNull();
    expect(week.firstTimeBuyers).toBeNull();
    expect(mixFirstTimePaint(week)).toBeNull();
    expect(built.mixDaily[0]!.firstTimeBuyers).toBeNull();
    expect(mixFirstTimePaint(built.mixDaily[0]!)).toBeNull();
    const summary = mixSummary(bucketMixWeeks(built.mixWeekly, "week"));
    expect(summary.firstTimeBuyers).toBeNull();
    expect(summary.unknownDollars).toBe(30);
    expect(mixFirstTimePaint(summary)).toBeNull();
    // Remainder after dropping unknown $ is 0. Paint must not certify that zero.
    expect(week.returningDollars).toBe(0);
    expect(week.total).toBe(0);
    expect(paintedMixMoney(mixReturningPaint(week))).toBe("—");
    expect(paintedMixMoney(mixTotalPaint(week))).toBe("—");
    expect(paintedMixMoney(mixReturningPaint(summary))).toBe("—");
    expect(paintedMixMoney(mixTotalPaint(summary))).toBe("—");
    expect(paintedMixMoney(mixReturningPaint(week))).not.toBe("$0");
    expect(paintedMixMoney(mixTotalPaint(summary))).not.toBe("$0");
  });

  it("does not call a buyer new when stored lifetime orders exceed the book", () => {
    const rows: RetentionOrderRow[] = [
      { customerKey: "prior", orderedAt: at(4), amount: 70, lifetimeOrders: 5 },
    ];
    const built = buildCustomerAnalytics(rows, {
      windowEnd: WINDOW_END,
      historyWindowDays: 90,
      orderBook: rows,
      timeZone: "UTC",
    });
    const week = built.mixWeekly[0]!;
    expect(week.newDollars).not.toBe(70);
    expect(week.returningDollars).not.toBe(70);
    expect(week.truncatedDollars).toBe(70);
    expect(week.returningShare).toBeNull();
    expect(mixFirstTimePaint(week)).toBeNull();
    expect(built.truncatedLifetimeBuyers).toBe(1);
    // Off-till only: buyer count stays empty, and Returning/Total are not $0.
    expect(week.firstTimeBuyers).toBeNull();
    expect(built.mixDaily[0]!.firstTimeBuyers).toBeNull();
    expect(week.returningDollars).toBe(0);
    expect(week.total).toBe(0);
    expect(paintedMixMoney(mixReturningPaint(week))).toBe("—");
    expect(paintedMixMoney(mixTotalPaint(week))).toBe("—");
    expect(paintedMixMoney(mixReturningPaint(week))).not.toBe("$0");
    expect(paintedMixMoney(mixTotalPaint(week))).not.toBe("$0");
    const summary = mixSummary(bucketMixWeeks(built.mixWeekly, "week"));
    expect(summary.firstTimeBuyers).toBeNull();
    expect(summary.truncatedDollars).toBe(70);
    expect(paintedMixMoney(mixReturningPaint(summary))).toBe("—");
    expect(paintedMixMoney(mixTotalPaint(summary))).toBe("—");
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
      timeZone: "UTC",
    });
    expect(built.mixWeekly[0]!.newDollars).toBe(15);
    expect(built.mixWeekly[0]!.returningDollars).toBe(0);
    expect(built.mixWeekly[0]!.unknownDollars).toBe(0);
    expect(built.mixWeekly[0]!.firstTimeBuyers).toBe(0);
    expect(mixFirstTimePaint(built.mixWeekly[0]!)).toBe(15);
    // A classified zero returning figure may still paint $0. Guests are not withheld.
    expect(paintedMixMoney(mixReturningPaint(built.mixWeekly[0]!))).toBe("$0");
    expect(paintedMixMoney(mixTotalPaint(built.mixWeekly[0]!))).toBe("$15");
  });

  it("keeps known first-time dollars when unknown dollars share the column", () => {
    const rows: RetentionOrderRow[] = [
      { customerKey: "known", orderedAt: at(5), amount: 40, lifetimeOrders: 1 },
      { customerKey: "unsure", orderedAt: at(5), amount: 30, lifetimeOrders: null },
      { customerKey: "back", orderedAt: at(40), amount: 10, lifetimeOrders: 2 },
      { customerKey: "back", orderedAt: at(5), amount: 80, lifetimeOrders: 2 },
    ];
    const built = buildCustomerAnalytics(rows, {
      windowEnd: WINDOW_END,
      historyWindowDays: 90,
      orderBook: rows,
      timeZone: "UTC",
    });
    const week = built.mixWeekly.find((w) => w.unknownDollars === 30);
    expect(week).toBeTruthy();
    expect(week!.newDollars).toBe(40);
    expect(week!.returningDollars).toBe(80);
    expect(week!.unknownDollars).toBe(30);
    expect(week!.newDollars).not.toBe(70);
    // Known first-time $ stays. Unclassified $ stays out of it.
    expect(mixFirstTimePaint(week!)).toBe(40);
    expect(paintedMixMoney(mixFirstTimePaint(week!))).toBe("$40");
    expect(paintedMixMoney(mixFirstTimePaint(week!))).not.toBe("—");
    // Returning and Total are incomplete while unknown $ shares the column.
    expect(mixReturningPaint(week!)).toBeNull();
    expect(mixTotalPaint(week!)).toBeNull();
    expect(paintedMixMoney(mixReturningPaint(week!))).toBe("—");
    expect(paintedMixMoney(mixTotalPaint(week!))).toBe("—");
    expect(paintedMixMoney(mixReturningPaint(week!))).not.toBe("$80");
    expect(paintedMixMoney(mixTotalPaint(week!))).not.toBe("$120");
    const summary = mixSummary(bucketMixWeeks(built.mixWeekly, "week"));
    expect(summary.newDollars).toBeGreaterThanOrEqual(40);
    expect(mixFirstTimePaint(summary)).toBe(summary.newDollars);
    expect(paintedMixMoney(mixReturningPaint(summary))).toBe("—");
    expect(paintedMixMoney(mixTotalPaint(summary))).toBe("—");
  });

  it("buckets mix days on the shop-local calendar, not the UTC host date", () => {
    const eveningAfterUtcMidnight = new Date("2026-01-20T02:00:00.000Z");
    const rows: RetentionOrderRow[] = [
      {
        customerKey: "pos",
        orderedAt: eveningAfterUtcMidnight,
        amount: 40,
        lifetimeOrders: 1,
      },
    ];
    const denver = buildCustomerAnalytics(rows, {
      windowEnd: new Date("2026-01-21T12:00:00.000Z"),
      historyWindowDays: 90,
      timeZone: "America/Denver",
    });
    expect(denver.mixDaily.map((d) => d.key)).toEqual(["2026-01-19"]);
    expect(denver.mixWeekly.map((w) => w.key)).toEqual(["2026-01-19"]);
    const utc = buildCustomerAnalytics(rows, {
      windowEnd: new Date("2026-01-21T12:00:00.000Z"),
      historyWindowDays: 90,
      timeZone: "UTC",
    });
    expect(utc.mixDaily.map((d) => d.key)).toEqual(["2026-01-20"]);
  });

  it("uses shopLocalDate when present even if the host Date already rolled UTC", () => {
    const rows: RetentionOrderRow[] = [
      {
        customerKey: "pos",
        orderedAt: new Date("2026-01-20T02:00:00.000Z"),
        shopLocalDate: new Date("2026-01-19T00:00:00.000Z"),
        amount: 22,
        lifetimeOrders: 1,
      },
    ];
    const built = buildCustomerAnalytics(rows, {
      windowEnd: new Date("2026-01-21T12:00:00.000Z"),
      historyWindowDays: 90,
    });
    expect(built.mixDaily.map((d) => d.key)).toEqual(["2026-01-19"]);
  });

  it("withholds mix days when timezone and shopLocalDate are missing — never a host Date", () => {
    const built = buildCustomerAnalytics(
      [
        {
          customerKey: "pos",
          orderedAt: new Date("2026-01-20T02:00:00.000Z"),
          amount: 40,
          lifetimeOrders: 1,
        },
      ],
      {
        windowEnd: new Date("2026-01-21T12:00:00.000Z"),
        historyWindowDays: 90,
      },
    );
    expect(built.mixDaily).toEqual([]);
    expect(built.mixWeekly).toEqual([]);
    expect(built.mixReturningShareAvg).toBeNull();
  });
});

describe("bucketMixWeeks + mixSummary — marquee grain toggle", () => {
  const a = buildCustomerAnalytics(buildFixture(), {
    windowEnd: WINDOW_END,
    historyWindowDays: 90,
    timeZone: "UTC",
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
      timeZone: "UTC",
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
      timeZone: "UTC",
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
      timeZone: "UTC",
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
      timeZone: "UTC",
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

  it("does not paint a certified $0 returning card for an unknown-only column", () => {
    const rows: RetentionOrderRow[] = [
      { customerKey: "unsure", orderedAt: at(5), amount: 30, lifetimeOrders: null },
      { customerKey: "also", orderedAt: at(12), amount: 20, lifetimeOrders: null },
    ];
    const built = buildCustomerAnalytics(rows, {
      windowEnd: WINDOW_END,
      historyWindowDays: 90,
      orderBook: rows,
      timeZone: "UTC",
    });
    const plays = buildReturningMixPlays({
      buckets: bucketMixWeeks(built.mixWeekly, "week"),
      grain: "week",
      winBackDay: null,
      saveNowOneOrder: 0,
    });
    expect(plays[0]?.amount).toBeNull();
    expect(plays[0]?.delta).toBeNull();
    expect(paintedMixMoney(plays[0]?.amount ?? null)).toBe("—");
    expect(paintedMixMoney(plays[0]?.amount ?? null)).not.toBe("$0");
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
    expect(e.quietBack.sealed).toBe(false);
    expect(e.quietBack.sales).toBeNull();
    expect(e.comebackWait.sealed).toBe(false);
    expect(e.comebackWait.waitDays).toBeNull();
    expect(e.lifetimeSpan.sealed).toBe(false);
    expect(e.lifetimeSpan.firstToLastDays).toBeNull();
    expect(e.lifetimeSpan.interOrderGapDays).toBeNull();
    expect(e.orderSteps).toHaveLength(4);
    for (const row of e.orderSteps) {
      expect(row.sealed).toBe(false);
      expect(row.ticket).toBeNull();
      expect(row.reach).toBeNull();
      expect(row.waitDays).toBeNull();
    }
  });
});

function usd(n: number): string {
  return `$${Math.round(n)}`;
}

function stepOf(rows: OrderStepRow[], id: OrderStepId): OrderStepRow {
  const row = rows.find((s) => s.id === id);
  expect(row).toBeDefined();
  return row!;
}

function ordersFor(
  key: string,
  steps: Array<{ daysBeforeEnd: number; amount: number }>,
): RetentionOrderRow[] {
  return steps.map((s) => ({
    customerKey: key,
    orderedAt: at(s.daysBeforeEnd),
    amount: s.amount,
  }));
}

describe("order steps — ticket, reach, wait from the stored book", () => {
  it("keeps the same 8-buyer floor as TT2 / RFM", () => {
    expect(ORDER_STEP_MIN_BUYERS).toBe(8);
  });

  it("leaves the 3rd row — when only 7 buyers took a 3rd (not a 7-buyer average)", () => {
    const rows: RetentionOrderRow[] = [];
    for (let i = 0; i < 10; i += 1) {
      rows.push(
        ...ordersFor(`b-${i}`, [
          { daysBeforeEnd: 80, amount: 40 },
          { daysBeforeEnd: 50, amount: 60 },
        ]),
      );
      if (i < 7) {
        rows.push(...ordersFor(`b-${i}`, [{ daysBeforeEnd: 30, amount: 999 }]));
      }
    }
    const third = stepOf(buildOrderSteps(rows), "third");
    expect(third.buyers).toBe(7);
    expect(third.sealed).toBe(false);
    expect(third.ticket).toBeNull();
    expect(third.reach).toBeNull();
    expect(third.waitDays).toBeNull();
    expect(orderStepTicketLabel(third, usd)).toBe("—");
    expect(orderStepReachLabel(third)).toBe("—");
    expect(orderStepWaitLabel(third)).toBe("—");
  });

  it("seals the 3rd with ticket, reach from 2nd, and median wait 2nd→3rd at 8 buyers", () => {
    const rows: RetentionOrderRow[] = [];
    for (let i = 0; i < 10; i += 1) {
      rows.push(
        ...ordersFor(`b-${i}`, [
          { daysBeforeEnd: 80, amount: 40 },
          { daysBeforeEnd: 50, amount: 60 },
        ]),
      );
      if (i < 8) {
        rows.push(...ordersFor(`b-${i}`, [{ daysBeforeEnd: 30, amount: 80 }]));
      }
    }
    const built = buildCustomerAnalytics(rows, {
      windowEnd: WINDOW_END,
      historyWindowDays: 90,
    });
    const third = stepOf(built.orderSteps, "third");
    expect(third.sealed).toBe(true);
    expect(third.buyers).toBe(8);
    expect(third.ticket).toBe(80);
    expect(third.reach).toBeCloseTo(8 / 10, 8);
    expect(third.waitDays).toBe(20);
    expect(orderStepTicketLabel(third, usd)).toBe("$80");
    expect(orderStepReachLabel(third)).toBe("80%");
    expect(orderStepWaitLabel(third)).toBe("20d");
  });

  it("never counts guests toward a step", () => {
    const rows: RetentionOrderRow[] = [];
    for (let i = 0; i < 8; i += 1) {
      rows.push(
        { customerKey: RETENTION_GUEST_KEY, orderedAt: at(80 - i), amount: 500 },
        { customerKey: RETENTION_GUEST_KEY, orderedAt: at(50 - i), amount: 500 },
        { customerKey: RETENTION_GUEST_KEY, orderedAt: at(20 - i), amount: 500 },
      );
      rows.push(...ordersFor(`one-${i}`, [{ daysBeforeEnd: 12, amount: 40 }]));
    }
    const steps = buildOrderSteps(rows);
    const third = stepOf(steps, "third");
    expect(third.buyers).toBe(0);
    expect(third.sealed).toBe(false);
    expect(third.ticket).toBeNull();
    const first = stepOf(steps, "first");
    expect(first.buyers).toBe(8);
    expect(first.ticket).toBe(40);
    expect(first.ticket).not.toBe(500);
  });

  it("does not invent a 3rd wait of 0d for a 2-order buyer", () => {
    const rows: RetentionOrderRow[] = [];
    for (let i = 0; i < 8; i += 1) {
      rows.push(
        ...ordersFor(`rep-${i}`, [
          { daysBeforeEnd: 40, amount: 30 },
          { daysBeforeEnd: 10, amount: 45 },
        ]),
      );
    }
    const third = stepOf(buildOrderSteps(rows), "third");
    expect(third.buyers).toBe(0);
    expect(third.sealed).toBe(false);
    expect(third.waitDays).toBeNull();
    expect(orderStepWaitLabel(third)).toBe("—");
    expect(orderStepWaitLabel(third)).not.toBe("0d");
  });

  it("uses 3rd→4th wait on 4th and later, not 1st→2nd or later gaps", () => {
    const rows: RetentionOrderRow[] = [];
    for (let i = 0; i < 8; i += 1) {
      rows.push(
        ...ordersFor(`w-${i}`, [
          { daysBeforeEnd: 80, amount: 10 },
          { daysBeforeEnd: 70, amount: 20 },
          { daysBeforeEnd: 50, amount: 30 },
          { daysBeforeEnd: 43, amount: 100 },
          { daysBeforeEnd: 10, amount: 200 },
        ]),
      );
    }
    const fourth = stepOf(buildOrderSteps(rows), "fourthPlus");
    expect(fourth.sealed).toBe(true);
    expect(fourth.buyers).toBe(8);
    expect(fourth.waitDays).toBe(7);
    expect(fourth.waitDays).not.toBe(10);
    expect(fourth.ticket).toBe(150);
    expect(fourth.reach).toBe(1);
    expect(orderStepWaitLabel(fourth)).toBe("7d");
    expect(orderStepFormula("fourthPlus")).toMatch(/3rd/i);
    expect(orderStepFormula("fourthPlus")).toMatch(/4th/i);
    expect(orderStepFormula("fourthPlus")).toMatch(/later waits stay off/i);
  });

  it("paints an em dash for 1st wait, never 0d", () => {
    const rows: RetentionOrderRow[] = [];
    for (let i = 0; i < 8; i += 1) {
      rows.push(...ordersFor(`n-${i}`, [{ daysBeforeEnd: 5, amount: 25 }]));
    }
    const first = stepOf(buildOrderSteps(rows), "first");
    expect(first.sealed).toBe(true);
    expect(first.ticket).toBe(25);
    expect(first.reach).toBeNull();
    expect(first.waitDays).toBeNull();
    expect(orderStepWaitLabel(first)).toBe("—");
    expect(orderStepWaitLabel(first)).not.toBe("0d");
    expect(orderStepReachLabel(first)).toBe("8 buyers");
    expect(orderStepFormula("first")).toMatch(/not 0d/);
  });

  it("does not invent extra steps from a lifetime count the book has not lived", () => {
    const rows: RetentionOrderRow[] = [];
    for (let i = 0; i < 8; i += 1) {
      rows.push({
        customerKey: `short-${i}`,
        orderedAt: at(8),
        amount: 55,
        lifetimeOrders: 9,
      });
      rows.push({
        customerKey: `short-${i}`,
        orderedAt: at(3),
        amount: 70,
        lifetimeOrders: 9,
      });
    }
    const steps = buildOrderSteps(rows);
    expect(stepOf(steps, "second").sealed).toBe(true);
    expect(stepOf(steps, "third").buyers).toBe(0);
    expect(stepOf(steps, "third").waitDays).toBeNull();
    expect(stepOf(steps, "fourthPlus").buyers).toBe(0);
  });

  it("walks the stored order book, not the 90-day mix slice", () => {
    const windowRows: RetentionOrderRow[] = [];
    const book: RetentionOrderRow[] = [];
    for (let i = 0; i < 8; i += 1) {
      const full = ordersFor(`old-${i}`, [
        { daysBeforeEnd: 200, amount: 20 },
        { daysBeforeEnd: 120, amount: 30 },
        { daysBeforeEnd: 10, amount: 90 },
      ]);
      book.push(...full);
      windowRows.push(full[2]!);
    }
    const sliced = buildCustomerAnalytics(windowRows, {
      windowEnd: WINDOW_END,
      historyWindowDays: 90,
      orderBook: book,
      timeZone: "UTC",
    });
    const third = stepOf(sliced.orderSteps, "third");
    expect(third.sealed).toBe(true);
    expect(third.ticket).toBe(90);
    expect(third.waitDays).toBe(110);
    const windowOnly = buildOrderSteps(windowRows);
    expect(stepOf(windowOnly, "third").sealed).toBe(false);
  });
});

const PERIOD_START = at(15);
const PERIOD_END = WINDOW_END;

describe("quiet-then-back dollars — this period, not returning mix, not RFM", () => {
  it("seals this period’s dollars at 8 identified reactivated buyers", () => {
    const rows: RetentionOrderRow[] = [];
    for (let i = 0; i < 11; i += 1) {
      rows.push(
        ...ordersFor(`cadence-${i}`, [
          { daysBeforeEnd: 80, amount: 40 },
          { daysBeforeEnd: 70, amount: 40 },
        ]),
      );
    }
    for (let i = 0; i < 8; i += 1) {
      rows.push(
        ...ordersFor(`quiet-${i}`, [
          { daysBeforeEnd: 80, amount: 50 },
          { daysBeforeEnd: 5, amount: 100 },
        ]),
      );
    }
    const built = buildQuietBackDollars({
      rows,
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
    });
    expect(ORDER_STEP_MIN_BUYERS).toBe(8);
    expect(built.buyers).toBe(8);
    expect(built.sealed).toBe(true);
    expect(built.sales).toBe(800);
  });

  it("stays — under 8 reactivated buyers, never a 7-buyer total", () => {
    const rows: RetentionOrderRow[] = [];
    for (let i = 0; i < 11; i += 1) {
      rows.push(
        ...ordersFor(`cadence-${i}`, [
          { daysBeforeEnd: 80, amount: 40 },
          { daysBeforeEnd: 70, amount: 40 },
        ]),
      );
    }
    for (let i = 0; i < 7; i += 1) {
      rows.push(
        ...ordersFor(`quiet-${i}`, [
          { daysBeforeEnd: 80, amount: 50 },
          { daysBeforeEnd: 5, amount: 999 },
        ]),
      );
    }
    const built = buildQuietBackDollars({
      rows,
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
    });
    expect(built.buyers).toBe(7);
    expect(built.sealed).toBe(false);
    expect(built.sales).toBeNull();
  });

  it("never counts guests, first-time dollars, or a return still inside typical wait", () => {
    const rows: RetentionOrderRow[] = [];
    for (let i = 0; i < 11; i += 1) {
      rows.push(
        ...ordersFor(`cadence-${i}`, [
          { daysBeforeEnd: 80, amount: 40 },
          { daysBeforeEnd: 70, amount: 40 },
        ]),
      );
    }
    for (let i = 0; i < 8; i += 1) {
      rows.push(
        { customerKey: RETENTION_GUEST_KEY, orderedAt: at(80), amount: 500 },
        { customerKey: RETENTION_GUEST_KEY, orderedAt: at(5), amount: 500 },
      );
      rows.push(...ordersFor(`new-${i}`, [{ daysBeforeEnd: 4, amount: 200 }]));
      rows.push(
        ...ordersFor(`soon-${i}`, [
          { daysBeforeEnd: 20, amount: 60 },
          { daysBeforeEnd: 12, amount: 60 },
        ]),
      );
    }
    const built = buildQuietBackDollars({
      rows,
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
    });
    expect(built.buyers).toBe(0);
    expect(built.sealed).toBe(false);
    expect(built.sales).toBeNull();
  });

  it("uses own median wait at 3+ orders, not a 90-day hibernating snapshot", () => {
    const rows: RetentionOrderRow[] = [];
    for (let i = 0; i < 8; i += 1) {
      rows.push(
        ...ordersFor(`own-${i}`, [
          { daysBeforeEnd: 80, amount: 30 },
          { daysBeforeEnd: 70, amount: 30 },
          { daysBeforeEnd: 5, amount: 120 },
        ]),
      );
    }
    rows.push(
      ...ordersFor("still-quiet", [
        { daysBeforeEnd: 200, amount: 400 },
        { daysBeforeEnd: 120, amount: 400 },
      ]),
    );
    const built = buildQuietBackDollars({
      rows,
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
    });
    expect(built.buyers).toBe(8);
    expect(built.sealed).toBe(true);
    expect(built.sales).toBe(960);
    const tight: RetentionOrderRow[] = [];
    for (let i = 0; i < 8; i += 1) {
      tight.push(
        ...ordersFor(`tight-${i}`, [
          { daysBeforeEnd: 25, amount: 30 },
          { daysBeforeEnd: 15, amount: 30 },
          { daysBeforeEnd: 5, amount: 120 },
        ]),
      );
    }
    const notQuiet = buildQuietBackDollars({
      rows: tight,
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
    });
    expect(notQuiet.buyers).toBe(0);
    expect(notQuiet.sales).toBeNull();
  });

  it("does not classify 2-order buyers when typical wait has not sealed", () => {
    const rows: RetentionOrderRow[] = [];
    for (let i = 0; i < 4; i += 1) {
      rows.push(
        ...ordersFor(`thin-${i}`, [
          { daysBeforeEnd: 80, amount: 50 },
          { daysBeforeEnd: 5, amount: 90 },
        ]),
      );
    }
    const built = buildQuietBackDollars({
      rows,
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
    });
    expect(built.buyers).toBe(0);
    expect(built.sealed).toBe(false);
    expect(built.sales).toBeNull();
  });
});

describe("next wait after they already came back — not the ticket column", () => {
  it("seals median 2nd→3rd at 8 buyers and leaves 7 as —", () => {
    const eight: RetentionOrderRow[] = [];
    for (let i = 0; i < 8; i += 1) {
      eight.push(
        ...ordersFor(`n-${i}`, [
          { daysBeforeEnd: 80, amount: 40 },
          { daysBeforeEnd: 50, amount: 60 },
          { daysBeforeEnd: 30, amount: 80 },
        ]),
      );
    }
    const sealed = buildComebackNextWait(eight);
    expect(sealed.buyers).toBe(8);
    expect(sealed.sealed).toBe(true);
    expect(sealed.waitDays).toBe(20);
    expect(sealed.waitDays).not.toBe(30);

    const seven = eight.filter((row) => row.customerKey !== "n-7");
    const thin = buildComebackNextWait(seven);
    expect(thin.buyers).toBe(7);
    expect(thin.sealed).toBe(false);
    expect(thin.waitDays).toBeNull();
  });

  it("never counts guests toward the next-wait floor", () => {
    const rows: RetentionOrderRow[] = [];
    for (let i = 0; i < 8; i += 1) {
      rows.push(
        { customerKey: RETENTION_GUEST_KEY, orderedAt: at(80), amount: 500 },
        { customerKey: RETENTION_GUEST_KEY, orderedAt: at(50), amount: 500 },
        { customerKey: RETENTION_GUEST_KEY, orderedAt: at(20), amount: 500 },
      );
      rows.push(
        ...ordersFor(`two-${i}`, [
          { daysBeforeEnd: 40, amount: 30 },
          { daysBeforeEnd: 10, amount: 45 },
        ]),
      );
    }
    const built = buildComebackNextWait(rows);
    expect(built.buyers).toBe(0);
    expect(built.sealed).toBe(false);
    expect(built.waitDays).toBeNull();
  });
});

describe("first→last span and inter-order gap", () => {
  it("seals median first→last and gap at 8 buyers with 2+ orders", () => {
    const rows: RetentionOrderRow[] = [];
    for (let i = 0; i < 8; i += 1) {
      rows.push(
        ...ordersFor(`span-${i}`, [
          { daysBeforeEnd: 80, amount: 20 },
          { daysBeforeEnd: 10, amount: 40 },
        ]),
      );
    }
    const built = buildBuyerLifetimeSpan(rows, {
      windowEnd: WINDOW_END,
      historyLimited: true,
    });
    expect(built.buyers).toBe(8);
    expect(built.sealed).toBe(true);
    expect(built.firstToLastDays).toBe(70);
    expect(built.interOrderGapDays).toBe(70);
    expect(buyerLifetimeSpanLine(built)).toMatch(/not a fake short life/);
  });

  it("locks the 8-buyer floor and the 90-day unpaid book", async () => {
    expect(ORDER_STEP_MIN_BUYERS).toBe(8);
    const { LIVE_UNPAID_INGEST_DAYS } = await import("./live-unpark");
    expect(LIVE_UNPAID_INGEST_DAYS).toBe(90);
  });

  it("stays — under 8, keeps guests out, and does not invent a short life", () => {
    const rows: RetentionOrderRow[] = [];
    for (let i = 0; i < 7; i += 1) {
      rows.push(
        ...ordersFor(`short-${i}`, [
          { daysBeforeEnd: 40, amount: 20 },
          { daysBeforeEnd: 10, amount: 40 },
        ]),
      );
    }
    for (let i = 0; i < 8; i += 1) {
      rows.push(
        { customerKey: RETENTION_GUEST_KEY, orderedAt: at(90), amount: 9 },
        { customerKey: RETENTION_GUEST_KEY, orderedAt: at(1), amount: 9 },
      );
    }
    const built = buildBuyerLifetimeSpan(rows, {
      windowEnd: WINDOW_END,
      historyLimited: true,
    });
    expect(built.buyers).toBe(7);
    expect(built.sealed).toBe(false);
    expect(built.firstToLastDays).toBeNull();
    expect(built.interOrderGapDays).toBeNull();
    expect(buyerLifetimeSpanLine(built)).toBeNull();
  });
});
