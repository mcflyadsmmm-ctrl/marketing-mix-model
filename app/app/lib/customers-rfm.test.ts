import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  RETENTION_GUEST_KEY,
  WHALE_MIN_ORDERS,
  type RetentionOrderRow,
} from "./customers-analytics";
import {
  buildCustomerRfm,
  emptyCustomerRfm,
  rfmEmptyState,
  whaleWatchRemainderLine,
  RFM_HIBERNATE_DAYS,
  RFM_MIN_BUYERS,
  RFM_MIN_FOLLOW_DAYS,
  RFM_RECENT_DAYS,
  WATCHLIST_MAX,
} from "./customers-rfm";

const DAY_MS = 86_400_000;
const WINDOW_END = new Date("2026-09-16T00:00:00Z");

type FixtureRow = {
  customerKey: string;
  daysBeforeEnd: number;
  amount: number;
};

type P1bFixture = {
  windowEnd: string;
  thin: FixtureRow[];
  zeroLtv: FixtureRow[];
  rich: FixtureRow[];
};

const fixture = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "fixtures/p1b-whale-rfm.json"),
    "utf8",
  ),
) as P1bFixture;

function rowsFrom(spec: FixtureRow[], windowEnd: Date): RetentionOrderRow[] {
  return spec.map((row) => ({
    customerKey: row.customerKey,
    orderedAt: new Date(windowEnd.getTime() - row.daysBeforeEnd * DAY_MS),
    amount: row.amount,
  }));
}

function at(daysBeforeEnd: number): Date {
  return new Date(WINDOW_END.getTime() - daysBeforeEnd * DAY_MS);
}

function book(
  spec: Array<{ key: string; orders: Array<{ d: number; amt: number }> }>,
): RetentionOrderRow[] {
  const rows: RetentionOrderRow[] = [];
  for (const buyer of spec) {
    for (const o of buyer.orders) {
      rows.push({ customerKey: buyer.key, orderedAt: at(o.d), amount: o.amt });
    }
  }
  return rows;
}

describe("rfmEmptyState — floor 8 buyers × 30 days", () => {
  it("is syncing with a verb when no buyers are on file", () => {
    const e = rfmEmptyState(0, 0);
    expect(e?.kind).toBe("syncing");
    expect(e?.need).toBe(RFM_MIN_BUYERS);
    expect(e?.verb).toBe("Refresh this page");
    expect(e?.copy).toMatch(/not \$0/);
    expect(e?.copy).toMatch(/No customers invented/);
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

describe("P1-B fixture — RFM-lite labels and whale watchlist", () => {
  const windowEnd = new Date(fixture.windowEnd);
  const rich = buildCustomerRfm(rowsFrom(fixture.rich, windowEnd), {
    windowEnd,
    historyLimited: false,
  });

  it("seals the rich Shopify-order book and ignores the guest row", () => {
    expect(fixture.rich.some((row) => row.customerKey === RETENTION_GUEST_KEY)).toBe(
      true,
    );
    expect(rich.available).toBe(true);
    expect(rich.empty).toBeNull();
    expect(rich.identifiedBuyers).toBe(11);
    expect(rich.medianOrderLtv).toBe(90);
  });

  it("labels Champions, At risk, New, and Hibernating from documented thresholds", () => {
    expect(rich.segments.map((s) => s.key)).toEqual([
      "champions",
      "at_risk",
      "new",
      "hibernating",
    ]);
    expect(rich.segments.find((s) => s.key === "champions")?.buyers).toBe(2);
    expect(rich.segments.find((s) => s.key === "at_risk")?.buyers).toBe(2);
    expect(rich.segments.find((s) => s.key === "new")?.buyers).toBe(2);
    expect(rich.segments.find((s) => s.key === "hibernating")?.buyers).toBe(2);
    expect(rich.outsideRules).toBe(3);
    const labeled = rich.segments.reduce((sum, row) => sum + row.buyers, 0);
    expect(labeled + rich.outsideRules).toBe(rich.identifiedBuyers);
    for (const row of rich.segments) {
      expect(row.rule.length).toBeGreaterThan(0);
      expect(row.verb.length).toBeGreaterThan(0);
    }
  });

  it("splits R·F·M threshold bands that cover every identified buyer", () => {
    expect(rich.bands.map((b) => b.key)).toEqual(["R", "F", "M"]);
    expect(rich.bands[0]?.high.label).toBe("≤30d");
    expect(rich.bands[0]?.low.label).toBe(">90d");
    for (const band of rich.bands) {
      const total = band.high.buyers + band.mid.buyers + band.low.buyers;
      expect(total).toBe(rich.identifiedBuyers);
    }
    expect(RFM_RECENT_DAYS).toBe(30);
    expect(RFM_HIBERNATE_DAYS).toBe(90);
  });

  it("ranks whales by order LTV and leaves repeat revenue blank for one order", () => {
    expect(rich.watchlist.length).toBeGreaterThanOrEqual(1);
    expect(rich.watchlist.length).toBeLessThanOrEqual(WATCHLIST_MAX);
    expect(rich.watchEmpty).toBeNull();
    expect(rich.watchlist[0]?.lifetime).toBe(900);
    expect(rich.watchlist[0]?.repeatRevenue).toBe(400);
    const oneOrder = rich.watchlist.find((row) => row.orders === 1);
    expect(oneOrder?.repeatRevenue).toBeNull();
    for (const row of rich.watchlist) {
      expect(row.label).toMatch(/^Whale \d+$/);
      expect(row.label).not.toMatch(/champ-|guest|gid:|Customer\//);
      expect(row.lifetime).toBeGreaterThan(0);
    }
    for (let i = 1; i < rich.watchlist.length; i += 1) {
      expect(rich.watchlist[i - 1]!.lifetime).toBeGreaterThanOrEqual(
        rich.watchlist[i]!.lifetime,
      );
    }
  });

  it("keeps the whale list empty when the book is thin — no invented customers", () => {
    const thin = buildCustomerRfm(rowsFrom(fixture.thin, windowEnd), {
      windowEnd,
      historyLimited: false,
    });
    expect(thin.available).toBe(false);
    expect(thin.empty?.kind).toBe("thin");
    expect(thin.watchlist).toEqual([]);
    expect(thin.watchEmpty?.copy).toMatch(/No customers invented/);
    expect(thin.segments.every((row) => row.buyers === 0)).toBe(true);
  });

  it("keeps the whale list empty when order LTV is all zero", () => {
    const zero = buildCustomerRfm(rowsFrom(fixture.zeroLtv, windowEnd), {
      windowEnd,
      historyLimited: false,
    });
    expect(zero.available).toBe(true);
    expect(zero.watchlist).toEqual([]);
    expect(zero.watchEmpty?.copy).toMatch(/No customers invented/);
    expect(zero.watchEmpty?.copy).toMatch(/not \$0/);
  });
});

describe("buildCustomerRfm — thin / young / limited honesty", () => {
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
    expect(view.watchlist).toEqual([]);
  });

  it("marks recency truncated when history is limited — not a fake year", () => {
    const view = buildCustomerRfm(rowsFrom(fixture.rich, new Date(fixture.windowEnd)), {
      windowEnd: new Date(fixture.windowEnd),
      historyLimited: true,
    });
    expect(view.available).toBe(true);
    expect(view.historyLimited).toBe(true);
    expect(view.recencyTruncatedAt).not.toBeNull();
    expect(view.recencyTruncatedAt).toBe(view.historyDays);
  });

  it("never paints guest dollars into segment totals", () => {
    const view = buildCustomerRfm(rowsFrom(fixture.rich, new Date(fixture.windowEnd)), {
      windowEnd: new Date(fixture.windowEnd),
      historyLimited: false,
    });
    const money = view.segments.reduce((sum, row) => sum + row.dollars, 0);
    expect(money).toBeLessThan(99999);
  });
});

describe("emptyCustomerRfm", () => {
  it("is an honest empty, not a fake RFM", () => {
    const e = emptyCustomerRfm();
    expect(e.available).toBe(false);
    expect(e.identifiedBuyers).toBe(0);
    expect(e.empty?.kind).toBe("syncing");
    expect(e.watchlist).toEqual([]);
    expect(e.medianOrderLtv).toBeNull();
    expect(e.watchlistTotal).toBe(0);
    expect(e.watchlistMoreMinOrders).toBe(0);
    expect(e.championFlow.sealed).toBe(false);
    expect(e.championFlow.cooledLifetime).toBeNull();
  });
});

describe("whale ticket — typical / first / later so Whale 1 is not one huge first order", () => {
  it("puts typical ticket (lifetime ÷ orders) on the row, blank when orders < 1", () => {
    expect(WHALE_MIN_ORDERS).toBe(5);
    expect(WATCHLIST_MAX).toBe(8);
    const vip = book([
      ...Array.from({ length: 7 }, (_, i) => ({
        key: `fill-${i}`,
        orders: [
          { d: 80, amt: 40 },
          { d: 10, amt: 40 },
        ],
      })),
      {
        key: "one-shot",
        orders: [{ d: 8, amt: 1000 }],
      },
      {
        key: "vip",
        orders: Array.from({ length: 10 }, (_, i) => ({
          d: 80 - i * 7,
          amt: 100,
        })),
      },
    ]);
    const view = buildCustomerRfm(vip, {
      windowEnd: WINDOW_END,
      historyLimited: false,
    });
    expect(view.available).toBe(true);
    const whale1 = view.watchlist[0];
    expect(whale1?.lifetime).toBe(1000);
    expect(whale1?.orders).toBe(10);
    expect(whale1?.typicalTicket).toBe(100);
    expect(whale1?.firstTicket).toBe(100);
    expect(whale1?.laterTicket).toBe(100);
    expect(whale1?.repeatRevenue).toBe(900);
    const oneShot = view.watchlist.find((row) => row.orders === 1);
    expect(oneShot?.lifetime).toBe(1000);
    expect(oneShot?.typicalTicket).toBe(1000);
    expect(oneShot?.firstTicket).toBe(1000);
    expect(oneShot?.laterTicket).toBeNull();
    expect(oneShot?.repeatRevenue).toBeNull();
    expect(whale1?.typicalTicket).not.toBe(oneShot?.typicalTicket);
    expect(JSON.stringify(view)).not.toContain("one-shot");
    expect(JSON.stringify(view)).not.toContain("vip");
  });

  it("does not invent a typical ticket when there is no order", () => {
    const row = buildCustomerRfm(rowsFrom(fixture.zeroLtv, WINDOW_END), {
      windowEnd: WINDOW_END,
      historyLimited: false,
    });
    expect(row.watchlist).toEqual([]);
    expect(row.watchlist.every((w) => w.typicalTicket == null || w.orders >= 1)).toBe(
      true,
    );
  });
});

describe("WATCHLIST_MAX remainder — Whale 8 of N, N more with 5+ orders", () => {
  it("does not silently hide the rest of the 5+ order book", () => {
    const rows = book([
      ...Array.from({ length: 12 }, (_, i) => ({
        key: `repeat-${i}`,
        orders: Array.from({ length: WHALE_MIN_ORDERS }, (__, n) => ({
          d: 80 - n * 10,
          amt: 20,
        })),
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        key: `shot-${i}`,
        orders: [{ d: 12, amt: 400 }],
      })),
    ]);
    const view = buildCustomerRfm(rows, {
      windowEnd: WINDOW_END,
      historyLimited: false,
    });
    expect(view.watchlist).toHaveLength(WATCHLIST_MAX);
    expect(view.watchlistTotal).toBe(15);
    expect(view.watchlistMoreMinOrders).toBe(7);
    const line = whaleWatchRemainderLine({
      shown: view.watchlist.length,
      total: view.watchlistTotal,
      moreMinOrders: view.watchlistMoreMinOrders,
      minOrders: WHALE_MIN_ORDERS,
    });
    expect(line).toBe("Whale 8 of 15. 7 more with 5+ orders.");
    expect(JSON.stringify(view)).not.toContain("repeat-0");
    expect(JSON.stringify(view)).not.toContain("shot-0");
  });

  it("stays — under the 8-buyer floor and keeps guests out", () => {
    const thin = buildCustomerRfm(rowsFrom(fixture.thin, WINDOW_END), {
      windowEnd: WINDOW_END,
      historyLimited: false,
    });
    expect(thin.watchlist).toEqual([]);
    expect(thin.watchlistTotal).toBe(0);
    expect(thin.watchlistMoreMinOrders).toBe(0);
    expect(
      whaleWatchRemainderLine({
        shown: 0,
        total: thin.watchlistTotal,
        moreMinOrders: thin.watchlistMoreMinOrders,
        minOrders: WHALE_MIN_ORDERS,
      }),
    ).toBeNull();

    const withGuest = book([
      ...Array.from({ length: 8 }, (_, i) => ({
        key: `gfill-${i}`,
        orders: [
          { d: 80, amt: 50 },
          { d: 10, amt: 50 },
        ],
      })),
    ]);
    withGuest.push({
      customerKey: RETENTION_GUEST_KEY,
      orderedAt: at(4),
      amount: 99_999,
    });
    const view = buildCustomerRfm(withGuest, {
      windowEnd: WINDOW_END,
      historyLimited: false,
    });
    expect(view.watchlistTotal).toBe(8);
    expect(view.watchlistMoreMinOrders).toBe(0);
    expect(view.identifiedBuyers).toBe(8);
    expect(JSON.stringify(view)).not.toContain("99999");
  });
});

describe("RFM champion flow — last month’s Champions who are At risk or Hibernating now", () => {
  it("counts headcount and lifetime dollars, without opaque keys", () => {
    const rows = book([
      ...Array.from({ length: 8 }, (_, i) => ({
        key: `stay-${i}`,
        orders: [
          { d: 80, amt: 80 },
          { d: 50, amt: 80 },
          { d: 5, amt: 80 },
        ],
      })),
      {
        key: "cooled-a",
        orders: [
          { d: 80, amt: 500 },
          { d: 40, amt: 500 },
        ],
      },
      {
        key: "cooled-b",
        orders: [
          { d: 80, amt: 500 },
          { d: 40, amt: 500 },
        ],
      },
    ]);
    rows.push({
      customerKey: RETENTION_GUEST_KEY,
      orderedAt: at(6),
      amount: 88_000,
    });
    const view = buildCustomerRfm(rows, {
      windowEnd: WINDOW_END,
      historyLimited: false,
    });
    expect(view.available).toBe(true);
    expect(view.championFlow.sealed).toBe(true);
    expect(view.championFlow.lastMonthChampions).toBe(10);
    expect(view.championFlow.cooledBuyers).toBe(2);
    expect(view.championFlow.cooledLifetime).toBe(2000);
    const packed = JSON.stringify(view);
    expect(packed).not.toContain("stay-0");
    expect(packed).not.toContain("cooled-a");
    expect(packed).not.toContain("gid://");
    expect(packed).not.toMatch(/@/);
  });

  it("stays — when last month has fewer than 8 identified buyers", () => {
    const rows = book(
      Array.from({ length: 8 }, (_, i) => ({
        key: `young-${i}`,
        orders: [
          { d: 20, amt: 90 },
          { d: 5, amt: 90 },
        ],
      })),
    );
    const view = buildCustomerRfm(rows, {
      windowEnd: WINDOW_END,
      historyLimited: false,
    });
    expect(view.championFlow.sealed).toBe(false);
    expect(view.championFlow.cooledLifetime).toBeNull();
    expect(view.championFlow.cooledBuyers).toBe(0);
  });
});
