import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const orders = readFileSync(join(here, "../routes/app.orders.tsx"), "utf8");
const demoOrders = readFileSync(join(here, "../routes/demo.orders.tsx"), "utf8");

const firstView = readFileSync(
  join(here, "../components/OrdersFirstViewport.tsx"),
  "utf8",
);

describe("Orders page", () => {
  it("names average vs typical in the craft plane — no essay lede", () => {
    expect(orders).not.toContain("mcfly-book__lede");
    expect(firstView).toContain("ORDERS_ANALYTICS_AVERAGE_LINE");
    expect(readFileSync(join(here, "orders-first-viewport.ts"), "utf8")).toMatch(
      /Shopify Analytics/,
    );
    expect(firstView).toMatch(/average/i);
    expect(firstView).toMatch(/Typical order|typical/i);
    expect(firstView).toContain("OVERVIEW_FROM_ORDERS_LABEL");
  });

  it("mounts hero + compare + chart in first lane; clock and intel fold below", () => {
    expect(orders).toContain("<OrdersFirstViewport");
    expect(orders).toContain("<OrdersCompareGlance");
    expect(orders).toContain("<OrdersScoreboard");
    expect(orders).toContain("<OrdersTimingChart");
    expect(orders.indexOf("<OrdersFirstViewport")).toBeLessThan(
      orders.indexOf("<OrdersTimingChart"),
    );
    expect(orders.indexOf("<OrdersTimingChart")).toBeLessThan(
      orders.indexOf("<OrdersScoreboard"),
    );
    const firstStart = orders.indexOf('<DeskLane rank="first"');
    const firstEnd = orders.indexOf('rank="more"', firstStart + 1);
    const firstLane = orders.slice(firstStart, firstEnd);
    expect(firstLane).toContain("<OrdersFirstViewport");
    expect(firstLane).toContain("<OrdersCompareGlance");
    expect(firstLane).toContain("<OrdersTimingChart");
    expect(firstLane).not.toContain("<OrdersScoreboard");
    expect(firstLane).not.toContain("<OrdersIntelligence");
  });

  it("pending sales are not $0", () => {
    expect(orders).toContain("salesPending");
    expect(firstView).toContain("ORDERS_PENDING_LINE");
    expect(firstView).toContain("ORDERS_THIN_EMPTY_LINE");
  });

  it("does not put SpendExplorer, Total ROAS, or Spend Upload as the hero", () => {
    expect(orders).not.toContain("SpendExplorer");
    expect(orders).not.toContain("Total ROAS");
    expect(orders).not.toContain("/app/spend");
  });

  it("mounts the same orders intelligence stack on the public orders page", () => {
    expect(demoOrders).not.toContain("mcfly-book__lede");
    expect(demoOrders).toContain("<OrdersIntelligence");
    expect(demoOrders).toContain("<OrdersFrequencyChart");
    expect(demoOrders.indexOf("<OrdersTimingChart")).toBeLessThan(
      demoOrders.indexOf("<OrdersScoreboard"),
    );
    expect(demoOrders.indexOf("<OrdersScoreboard")).toBeLessThan(
      demoOrders.indexOf("<OrdersIntelligence"),
    );
  });
});

/** Opening JSX tag — a till that drops a required prop must fail this, not a name-only grep. */
function jsxOpen(source: string, name: string): string {
  const start = source.indexOf(`<${name}`);
  expect(start).toBeGreaterThan(-1);
  const self = source.indexOf("/>", start);
  const open = source.indexOf(">", start);
  const end =
    self >= 0 && (open < 0 || self < open) ? self + 2 : open + 1;
  return source.slice(start, end);
}

describe("Orders step mix call-site lock", () => {
  it("omit-path: first viewport and timing chart require step mix props on both tills", () => {
    for (const source of [orders, demoOrders]) {
      const first = jsxOpen(source, "OrdersFirstViewport");
      expect(first).toMatch(/\bdepth=/);
      expect(first).toMatch(/\bstepMix=/);
      expect(first).toMatch(/\btickets=/);
      expect(first).toMatch(/\btodaySalesTruncated=/);
      expect(first).not.toMatch(/\bwaitDays=/);
      const timing = jsxOpen(source, "OrdersTimingChart");
      expect(timing).toMatch(/\bweekdayShares=/);
      expect(timing).toMatch(/\btimingSplit=/);
    }
    expect(jsxOpen(demoOrders, "OrdersFirstViewport")).toMatch(
      /todaySalesTruncated=\{false\}/,
    );
    const desk = readFileSync(
      join(here, "desk-sales-page.server.ts"),
      "utf8",
    );
    expect(demoOrders).toContain("lastYearRows");
    expect(desk).toContain("lastYearRows");
    expect(orders).toContain('from "../components/OrdersFirstViewport"');
    expect(demoOrders).toContain('from "../components/OrdersFirstViewport"');
    expect(orders).toContain('from "../components/OrdersTimingChart"');
    expect(demoOrders).toContain('from "../components/OrdersTimingChart"');
  });
});
