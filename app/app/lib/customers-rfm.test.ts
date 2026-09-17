import { describe, expect, it } from "vitest";
import { RETENTION_GUEST_KEY, type RetentionOrderRow } from "./customers-analytics";
import {
  buildCustomerRfm,
  emptyCustomerRfm,
  rfmEmptyState,
  RFM_MIN_BUYERS,
  RFM_MIN_FOLLOW_DAYS,
  WATCHLIST_COLD_DAYS,
  WATCHLIST_MAX,
} from "./customers-rfm";

const DAY_MS = 86_400_000;
const WINDOW_END = new Date("2026-09-16T00:00:00Z");

function at(daysBeforeEnd: number): Date {
  return new Date(WINDOW_END.getTime() - daysBeforeEnd * DAY_MS);
}

function book(spec: Array<{ key: string; orders: Array<{ d: number; amt: number }> }>): RetentionOrderRow[] {
  const rows: RetentionOrderRow[] = [];
  for (const buyer of spec) {
    for (const o of buyer.orders) {
      rows.push({ customerKey: buyer.key, orderedAt: at(o.d), amount: o.amt });
    }
  }
  return rows;
}

/** 10 matured buyers: 2 high-LTV slipping, 2 champions, 3 rising, rest quiet. */
function richBook(): RetentionOrderRow[] {
  const rows = book([
    // Slipping whales — many orders, high $, last order 45–50d ago.
    {
      key: "whale-cold-a",
      orders: [
        { d: 80, amt: 900 },
        { d: 70, amt: 800 },
        { d: 60, amt: 700 },
        { d: 50, amt: 600 },
      ],
    },
    {
      key: "whale-cold-b",
      orders: [
        { d: 85, amt: 700 },
        { d: 75, amt: 650 },
        { d: 55, amt: 600 },
        { d: 45, amt: 550 },
      ],
    },
    // Warm whales — high $, last order recent.
    {
      key: "whale-warm",
      orders: [
        { d: 70, amt: 800 },
        { d: 40, amt: 700 },
        { d: 8, amt: 650 },
      ],
    },
    {
      key: "champ-b",
      orders: [
        { d: 60, amt: 400 },
        { d: 20, amt: 380 },
        { d: 5, amt: 360 },
      ],
    },
    // Rising — one recent modest order, first order old enough to mature.
    { key: "rise-a", orders: [{ d: 40, amt: 80 }] },
    { key: "rise-b", orders: [{ d: 35, amt: 70 }] },
    { key: "rise-c", orders: [{ d: 32, amt: 60 }] },
    // Quiet / mid.
    {
      key: "quiet-a",
      orders: [
        { d: 70, amt: 120 },
        { d: 25, amt: 110 },
      ],
    },
    { key: "quiet-b", orders: [{ d: 55, amt: 90 }] },
    { key: "quiet-c", orders: [{ d: 50, amt: 85 }] },
  ]);
  rows.push({ customerKey: RETENTION_GUEST_KEY, orderedAt: at(10), amount: 9999 });
  return rows;
}

describe("rfmEmptyState — floor 8 buyers × 30 days", () => {
  it("is syncing with a verb when no buyers are on file", () => {
    const e = rfmEmptyState(0, 0);
    expect(e?.kind).toBe("syncing");
    expect(e?.need).toBe(RFM_MIN_BUYERS);
    expect(e?.verb).toBe("Refresh this page");
    expect(e?.copy).toMatch(/not \$0/);
  });

  it("is thin below the buyer floor", () => {
    const e = rfmEmptyState(3, 3);
    expect(e?.kind).toBe("thin");
    expect(e?.buyers).toBe(3);
    expect(e?.copy).toContain("3 identified buyers");
    expect(e?.copy).toContain(String(RFM_MIN_FOLLOW_DAYS));
  });

  it("is young when 8+ buyers have not lived 30 days", () => {
    const e = rfmEmptyState(10, 4);
    expect(e?.kind).toBe("young");
    expect(e?.verb).toBe("Wait for day 30");
    expect(e?.copy).toMatch(/not \$0/);
  });

  it("is null once the floor has lived 30 days", () => {
    expect(rfmEmptyState(8, 8)).toBeNull();
  });
});

describe("buildCustomerRfm — RFM-lite bands + segments", () => {
  const view = buildCustomerRfm(richBook(), {
    windowEnd: WINDOW_END,
    historyLimited: false,
  });

  it("seals after 8 matured identified buyers and ignores guests", () => {
    expect(view.available).toBe(true);
    expect(view.empty).toBeNull();
    expect(view.identifiedBuyers).toBe(10);
    expect(view.maturedBuyers).toBe(10);
    expect(view.historyLimited).toBe(false);
  });

  it("splits every buyer into R/F/M tercile bands that sum to the shop", () => {
    expect(view.bands).toHaveLength(3);
    expect(view.bands.map((b) => b.key)).toEqual(["R", "F", "M"]);
    for (const band of view.bands) {
      const total = band.high.buyers + band.mid.buyers + band.low.buyers;
      expect(total).toBe(10);
    }
  });

  it("keeps four lite segments — not a 5×5 dump — covering every buyer", () => {
    expect(view.segments.map((s) => s.key)).toEqual([
      "champions",
      "rising",
      "at_risk",
      "quiet",
    ]);
    const buyers = view.segments.reduce((s, row) => s + row.buyers, 0);
    expect(buyers).toBe(10);
    expect(view.segments.find((s) => s.key === "at_risk")?.buyers).toBeGreaterThan(0);
    expect(view.segments.find((s) => s.key === "rising")?.buyers).toBeGreaterThan(0);
    for (const row of view.segments) {
      expect(row.verb.length).toBeGreaterThan(0);
    }
  });

  it("never paints guest dollars into monetary bands", () => {
    const money = view.segments.reduce((s, row) => s + row.dollars, 0);
    expect(money).toBeLessThan(9999);
  });
});

describe("buildCustomerRfm — whale watchlist", () => {
  const view = buildCustomerRfm(richBook(), {
    windowEnd: WINDOW_END,
    historyLimited: false,
  });

  it("lists high-LTV buyers past 30 days, labeled without Shopify keys", () => {
    expect(view.watchlist.length).toBeGreaterThanOrEqual(1);
    expect(view.watchlist.length).toBeLessThanOrEqual(WATCHLIST_MAX);
    expect(view.watchEmpty).toBeNull();
    for (const row of view.watchlist) {
      expect(row.daysSince).toBeGreaterThan(WATCHLIST_COLD_DAYS);
      expect(row.orders).toBeGreaterThanOrEqual(2);
      expect(row.lifetime).toBeGreaterThan(0);
      expect(row.verb).toBe("Reach now");
      expect(row.label).toMatch(/^Whale \d+$/);
      expect(row.label).not.toMatch(/whale-cold|gid:|Customer\//);
    }
    // Highest slipping lifetime leads.
    expect(view.watchlist[0]!.lifetime).toBeGreaterThanOrEqual(
      view.watchlist[view.watchlist.length - 1]!.lifetime,
    );
  });

  it("does not put a still-warm whale on the slipping list", () => {
    expect(view.watchlist.every((row) => row.daysSince > 8)).toBe(true);
  });
});

describe("buildCustomerRfm — thin / young / limited honesty", () => {
  it("stays an ActionCard-shaped empty below the floor", () => {
    const rows = book([
      { key: "a", orders: [{ d: 40, amt: 80 }] },
      { key: "b", orders: [{ d: 20, amt: 70 }] },
    ]);
    const view = buildCustomerRfm(rows, {
      windowEnd: WINDOW_END,
      historyLimited: false,
    });
    expect(view.available).toBe(false);
    expect(view.empty?.kind).toBe("thin");
    expect(view.watchlist).toEqual([]);
    expect(view.watchEmpty?.verb).toBe("Watch first 30 days");
  });

  it("is young when eight buyers have not lived 30 days", () => {
    const rows = book(
      Array.from({ length: 8 }, (_, i) => ({
        key: `y${i}`,
        orders: [{ d: 10, amt: 50 + i }],
      })),
    );
    const view = buildCustomerRfm(rows, {
      windowEnd: WINDOW_END,
      historyLimited: false,
    });
    expect(view.available).toBe(false);
    expect(view.empty?.kind).toBe("young");
    expect(view.empty?.verb).toBe("Wait for day 30");
  });

  it("marks recency truncated when history is limited — not a fake year", () => {
    const view = buildCustomerRfm(richBook(), {
      windowEnd: WINDOW_END,
      historyLimited: true,
    });
    expect(view.available).toBe(true);
    expect(view.historyLimited).toBe(true);
    expect(view.recencyTruncatedAt).not.toBeNull();
    expect(view.recencyTruncatedAt).toBe(view.historyDays);
  });

  it("uses a designed watch empty when whales are still warm", () => {
    const rows = book(
      Array.from({ length: 8 }, (_, i) => ({
        key: `w${i}`,
        orders: [
          { d: 50, amt: 200 + i * 10 },
          { d: 8, amt: 180 + i * 10 },
        ],
      })),
    );
    const view = buildCustomerRfm(rows, {
      windowEnd: WINDOW_END,
      historyLimited: false,
    });
    expect(view.available).toBe(true);
    expect(view.watchlist).toEqual([]);
    expect(view.watchEmpty?.copy).toMatch(/not zero/i);
    expect(view.watchEmpty?.verb).toBe("Watch the next 30 days");
  });
});

describe("emptyCustomerRfm", () => {
  it("is honest zeros, not a fake RFM", () => {
    const e = emptyCustomerRfm();
    expect(e.available).toBe(false);
    expect(e.identifiedBuyers).toBe(0);
    expect(e.empty?.kind).toBe("syncing");
    expect(e.watchlist).toEqual([]);
  });
});
