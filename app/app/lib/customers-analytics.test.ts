import { describe, expect, it } from "vitest";
import {
  buildCustomerAnalytics,
  emptyCustomerAnalytics,
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
