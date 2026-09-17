import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const orders = readFileSync(join(here, "../routes/app.orders.tsx"), "utf8");

describe("Orders page", () => {
  it("contrast lede names average vs typical/median and Shopify Analytics", () => {
    expect(orders).toMatch(/Shopify Analytics/);
    expect(orders).toMatch(/average/i);
    expect(orders).toMatch(/typical/i);
    expect(orders).toMatch(/median/i);
  });

  it("mounts the Orders scoreboard then the weekday/hour chart", () => {
    expect(orders).toContain("<OrdersScoreboard");
    expect(orders).toContain("<OrdersTimingChart");
    expect(orders.indexOf("<OrdersTimingChart")).toBeGreaterThan(
      orders.indexOf("<OrdersScoreboard"),
    );
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
});
