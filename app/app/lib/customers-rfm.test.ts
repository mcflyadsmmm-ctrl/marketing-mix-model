import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { RETENTION_GUEST_KEY, type RetentionOrderRow } from "./customers-analytics";
import {
  buildCustomerRfm,
  emptyCustomerRfm,
  rfmEmptyState,
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
  });
});
