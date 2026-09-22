import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const orders = readFileSync(join(here, "../routes/app.orders.tsx"), "utf8");
const demoOrders = readFileSync(join(here, "../routes/demo.orders.tsx"), "utf8");

describe("Orders page", () => {
  it("contrast lede names average vs typical/median and Shopify Analytics", () => {
    expect(orders).toMatch(/Shopify Analytics/);
    expect(orders).toMatch(/average/i);
    expect(orders).toMatch(/typical/i);
    expect(orders).toMatch(/median/i);
  });

  it("mounts the typical-order first fold, then scoreboard, then weekday/hour chart", () => {
    expect(orders).toContain("<OrdersFirstViewport");
    expect(orders).toContain("<OrdersScoreboard");
    expect(orders).toContain("<OrdersTimingChart");
    expect(orders.indexOf("<OrdersFirstViewport")).toBeLessThan(
      orders.indexOf("<OrdersScoreboard"),
    );
    expect(orders.indexOf("<OrdersScoreboard")).toBeLessThan(
      orders.indexOf("<OrdersTimingChart"),
    );
    const firstStart = orders.indexOf('<DeskLane rank="first"');
    const firstEnd = orders.indexOf("<DeskLane", firstStart + 1);
    const firstLane = orders.slice(firstStart, firstEnd);
    expect(firstLane).toContain("<OrdersFirstViewport");
    expect(firstLane).not.toContain("<OrdersScoreboard");
    expect(firstLane).not.toContain("<OrdersIntelligence");
  });

  it("pending sales are not $0", () => {
    expect(orders).toContain("salesPending");
    expect(orders).toContain("not $0");
  });

  it("does not put SpendExplorer, Total ROAS, or Spend Upload as the hero", () => {
    expect(orders).not.toContain("SpendExplorer");
    expect(orders).not.toContain("Total ROAS");
    expect(orders).not.toContain("/app/spend");
  });

  it("mounts the same orders intelligence stack on the public orders page", () => {
    expect(demoOrders).toContain("<OrdersIntelligence");
    expect(demoOrders).toContain("<OrdersFrequencyChart");
    expect(demoOrders.indexOf("<OrdersScoreboard")).toBeLessThan(
      demoOrders.indexOf("<OrdersIntelligence"),
    );
    expect(demoOrders.indexOf("<OrdersIntelligence")).toBeLessThan(
      demoOrders.indexOf("<OrdersTimingChart"),
    );
  });
});
