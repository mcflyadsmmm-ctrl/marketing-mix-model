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
  buildGrowthHabitDepth,
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
    expect(buildGrowthHabitDepth(emptyGrowthTt2())).toBeNull();
  });
});

describe("buildGrowthHabitDepth — days-to-second + weekends", () => {
  it("densifies the second-order shape and a Mon–Fri habit without a 0% weekend", () => {
    const depth = buildGrowthHabitDepth(sealedTt2());
    expect(depth).not.toBeNull();
    expect(depth!.days.map((bucket) => bucket.buyers)).toEqual([2, 1, 2, 0]);
    expect(depth!.days.filter((bucket) => bucket.holdsTypical).map((b) => b.label)).toEqual([
      "8–30d",
    ]);
    expect(depth!.daysLine).toMatch(/Typical wait sits in 8–30d/);
    expect(depth!.weekend?.mode).toBe("weekday");
    expect(depth!.weekend?.value).toBe("Weekday habit");
    expect(depth!.weekend?.value).not.toBe("0%");
    expect(depth!.weekend?.weekendFill).toBe(0);
    expect(depth!.weekend?.sub).toMatch(/not 0%/);
    expect(depth!.weekend?.detail).not.toMatch(/sales share|ROAS|spend|COGS|MRR/i);
  });

  it("paints Sat–Sun share from the shop calendar once five second orders exist", () => {
    function local(isoDay: string): Date {
      return new Date(`${isoDay}T00:00:00.000Z`);
    }
    const rows: GrowthTt2OrderRow[] = [];
    const pairs: Array<[string, string, string]> = [
      ["a", "2026-05-01", "2026-06-06"],
      ["b", "2026-05-02", "2026-06-07"],
      ["c", "2026-05-03", "2026-06-13"],
      ["d", "2026-05-04", "2026-06-15"],
      ["e", "2026-05-05", "2026-06-17"],
    ];
    for (const [key, first, second] of pairs) {
      rows.push({
        customerKey: key,
        orderedAt: local(first),
        shopLocalDate: local(first),
        amount: 70,
      });
      rows.push({
        customerKey: key,
        orderedAt: local(second),
        shopLocalDate: local(second),
        amount: 80,
      });
    }
    for (const day of ["2026-06-01", "2026-06-02", "2026-06-03"]) {
      rows.push({
        customerKey: `one-${day}`,
        orderedAt: local(day),
        shopLocalDate: local(day),
        amount: 30,
      });
    }
    const tt2 = buildGrowthTt2(rows, {
      windowEnd: WINDOW_END,
      historyLimited: false,
    });
    const depth = buildGrowthHabitDepth(tt2);
    expect(depth?.weekend?.mode).toBe("weekend");
    expect(depth?.weekend?.value).toBe("60%");
    expect(depth?.weekend?.sub).toMatch(/3 of 5 second orders on Sat–Sun/);
    expect(depth?.weekend?.sub).toMatch(/Saturday/);
    expect(depth?.weekend?.weekendFill).toBeCloseTo(0.6, 5);
    expect(growthTypicalWaitLabel(tt2)).toMatch(/^\d+d$/);
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
    const growth = read("../components/CustomersGrowthSection.tsx");
    const customers = read("../routes/app.customers.tsx");
    const firstView = read("../components/GrowthFirstViewport.tsx");
    const css = read("../styles/mcfly-desk.css");
    expect(css).toContain(".mcfly-growth-hero");
    expect(css).toContain(".mcfly-score--growth-hero");
    expect(customers).toContain("GROWTH_FIRST_LANE_LABEL");
    expect(customers).toContain("<CustomersGrowthSection");
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
    expect(firstView).not.toMatch(/\bMRR\b/);
    expect(firstView).not.toMatch(/pixel/i);
    expect(growth).not.toContain("/app/spend");
    expect(growth).not.toContain("Total ROAS");
    expect(customers).not.toContain("/app/spend");
    // Habit depth sits under the heroes. Orders weekend sales stay on Orders.
    expect(firstView).toContain("buildGrowthHabitDepth");
    expect(firstView).toContain("Days to a second order and weekends");
    expect(firstView).toContain("mcfly-growth-habit__bar--green");
    expect(firstView).toContain("mcfly-growth-habit__bar--grey");
    expect(firstView).toContain("mcfly-growth-habit__fill--green");
    expect(firstView).toContain("mcfly-growth-habit__fill--grey");
    expect(css).toContain(".mcfly-growth-habit");
    expect(css).toContain(".mcfly-growth-habit__bar--green");
    expect(css).toContain(".mcfly-growth-habit__bar--grey");
    expect(firstView).not.toContain("Weekend sales");
    expect(firstView).not.toContain("busiest weekday");
    expect(firstView).not.toContain("Online vs POS");
    // Shopify-already-free: first-time $ and returning rate stay off the hero.
    expect(firstView).not.toContain("first-time");
    expect(firstView).not.toContain("newCustomers");
  });
});
