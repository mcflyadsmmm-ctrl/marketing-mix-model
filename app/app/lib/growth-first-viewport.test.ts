import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  GROWTH_ANALYTICS_CONTRAST,
  GROWTH_FIRST_FOLD_HEROES,
  GROWTH_FIRST_LANE_LABEL,
  GROWTH_PENDING_LINE,
  GROWTH_THIN_EMPTY_LINE,
  buildGrowthLeadPeeks,
  growthHabitSub,
  growthHeroBeatsShopifyAnalytics,
  growthOperatorGreeting,
  growthTypicalWaitLabel,
} from "./growth-first-viewport";
import {
  buildGrowthTt2,
  emptyGrowthTt2,
  TT2_GUEST_KEY,
  TT2_WINBACK_PAD_DAYS,
  type GrowthTt2OrderRow,
} from "./growth-tt2";
import { buildThreeYearSampleDesk } from "./demo-sample-desk.server";
import {
  buildSampleOrderFactRows,
  SAMPLE_ORDER_FACT_WINDOW_DAYS,
} from "./order-facts.server";

const here = dirname(fileURLToPath(import.meta.url));
const DAY_MS = 86_400_000;
const WINDOW_END = new Date("2026-09-16T00:00:00Z");

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

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

/** Same 10-buyer clock as growth-tt2.test — 10d typical, win-back 25, 5 to reach. */
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

function sealedTt2() {
  return buildGrowthTt2(richBook(), {
    windowEnd: WINDOW_END,
    historyLimited: false,
  });
}

describe("growthOperatorGreeting", () => {
  it("leads with typical wait and win-back vs Shopify Analytics returning rate", () => {
    const greeting = growthOperatorGreeting({
      salesPending: false,
      tt2: sealedTt2(),
    });
    expect(greeting).toMatch(/Typical wait is 10 days/);
    expect(greeting).toMatch(/already past day 25/);
    expect(greeting).toContain(GROWTH_ANALYTICS_CONTRAST);
    expect(GROWTH_ANALYTICS_CONTRAST).not.toMatch(/sessions|ROAS|spend/i);
    expect(GROWTH_FIRST_LANE_LABEL).toMatch(/Days to a second order/);
    expect(GROWTH_THIN_EMPTY_LINE).toMatch(/not \$0/);
  });

  it("does not greet thin or pending shops as a $0 returning-rate board", () => {
    expect(
      growthOperatorGreeting({
        salesPending: true,
        tt2: emptyGrowthTt2(),
      }),
    ).toBe(GROWTH_PENDING_LINE);
    expect(
      growthOperatorGreeting({
        salesPending: false,
        tt2: emptyGrowthTt2(),
      }),
    ).toBe(GROWTH_THIN_EMPTY_LINE);
  });
});

describe("buildGrowthLeadPeeks", () => {
  it("elevates win-back, reach-now, and 30-day come-back next to typical wait", () => {
    const tt2 = sealedTt2();
    expect(growthTypicalWaitLabel(tt2)).toBe("10d");
    expect(growthHabitSub(tt2)).toBe("fast 5d · slow 40d");
    const peeks = buildGrowthLeadPeeks(tt2);
    expect(peeks.map((peek) => peek.k)).toEqual([
      "Win-back by",
      "Reach now",
      "Came back ≤30d",
    ]);
    expect(peeks[0]?.v).toBe(`${10 + TT2_WINBACK_PAD_DAYS}d`);
    expect(peeks[1]?.v).toBe("5");
    expect(peeks[2]?.v).toBe("30%");
  });

  it("drops missing clock truths — never a $0 / 0d peek graveyard", () => {
    expect(buildGrowthLeadPeeks(emptyGrowthTt2())).toEqual([]);
    expect(growthTypicalWaitLabel(emptyGrowthTt2())).toBeNull();
    expect(growthHabitSub(emptyGrowthTt2())).toBeNull();
  });
});

describe("SAMPLE Snowdevil first open paints the repurchase clock", () => {
  it("seals typical wait + win-back so /app/growth can greet in one glance", () => {
    const now = new Date("2026-09-17T18:00:00Z");
    const bookDays = buildThreeYearSampleDesk({ now, targetMer: 3.5 });
    const windowStart = now.getTime() - SAMPLE_ORDER_FACT_WINDOW_DAYS * DAY_MS;
    const orders = buildSampleOrderFactRows(
      bookDays.filter((row) => row.day.getTime() >= windowStart),
    );
    const tt2 = buildGrowthTt2(
      orders.map((order) => ({
        customerKey: order.customerKey,
        orderedAt: order.orderedAt,
        amount: order.amount,
      })),
      { windowEnd: now, historyLimited: false },
    );
    const greeting = growthOperatorGreeting({ salesPending: false, tt2 });
    const peeks = buildGrowthLeadPeeks(tt2);
    expect(tt2.available).toBe(true);
    expect(growthTypicalWaitLabel(tt2)).toMatch(/^\d+d$/);
    expect(greeting).toMatch(/Typical wait is \d+ days/);
    expect(greeting).toContain(GROWTH_ANALYTICS_CONTRAST);
    expect(peeks.some((peek) => peek.k === "Win-back by")).toBe(true);
    expect(peeks.some((peek) => peek.k === "Reach now")).toBe(true);
  });
});

describe("Growth first-fold SCORECARD vs free Shopify Analytics", () => {
  it("PASS only when every first-fold hero is Mcfly-differentiated", () => {
    expect([...GROWTH_FIRST_FOLD_HEROES]).toEqual([
      "typicalWait",
      "winBackClock",
      "reachNow",
      "habitMetrics",
      "comeBack30",
    ]);
    for (const hero of GROWTH_FIRST_FOLD_HEROES) {
      expect(growthHeroBeatsShopifyAnalytics(hero)).toBe(true);
    }
    const growth = read("../routes/app.growth.tsx");
    const firstView = read("../components/GrowthFirstViewport.tsx");
    const css = read("../styles/mcfly-desk.css");
    expect(css).toContain(".mcfly-growth-hero");
    expect(css).toContain(".mcfly-score--growth-hero");
    expect(growth).toContain("GROWTH_FIRST_LANE_LABEL");
    expect(growth).toContain("<GrowthFirstViewport");
    expect(growth.indexOf("<GrowthFirstViewport")).toBeLessThan(
      growth.indexOf("<GrowthComebackChart"),
    );
    expect(growth.indexOf("<GrowthComebackChart")).toBeLessThan(
      growth.indexOf("<GrowthScoreboard"),
    );
    expect(growth.indexOf("<GrowthScoreboard")).toBeLessThan(
      growth.indexOf("<GrowthTt2Board"),
    );
    expect(firstView).toContain("mcfly-kpi-grid--peeks-lead");
    expect(firstView).toContain("mcfly-growth-hero");
    expect(firstView).toContain("mcfly-score__greeting");
    expect(firstView).toContain("Days to a second order");
    expect(firstView).toContain("growthOperatorGreeting");
    expect(firstView).toContain("SAMPLE_GROWTH_DOOR");
    expect(firstView).toContain("GROWTH_THIN_EMPTY_LINE");
    expect(firstView).toContain("if (salesPending");
    expect(firstView).toContain("GROWTH_ANALYTICS_CONTRAST");
    expect(firstView).not.toContain("Sessions");
    expect(firstView).not.toContain('label="Returning rate"');
    expect(firstView).not.toContain("0.00×");
    expect(firstView).not.toContain("Total ROAS");
    expect(firstView).not.toContain("Upload spend");
    expect(firstView).not.toContain("Edit spend");
    expect(firstView).not.toContain("MER");
    expect(firstView).not.toContain("COGS");
    expect(growth).not.toContain("/app/spend");
    expect(growth).not.toContain("Total ROAS");
    // Weekend / weekday timing is Orders + Overview — not a Growth first-fold steal.
    expect(firstView).not.toContain("Weekend");
    expect(firstView).not.toContain("weekday");
    // Shopify-already-free: first-time $ and returning rate stay off the hero.
    expect(firstView).not.toContain("first-time");
    expect(firstView).not.toContain("newCustomers");
  });
});
