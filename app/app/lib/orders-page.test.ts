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
  it("SAMPLE L2 retires Orders routes — app + demo redirect Home", () => {
    expect(orders).toContain("OrdersRedirect");
    expect(orders).toContain("throw redirect");
    expect(demoOrders).toContain("DemoOrdersRedirect");
    expect(demoOrders).toContain("throw redirect");
    expect(orders).not.toContain("<OrdersFirstViewport");
    expect(demoOrders).not.toContain("<OrdersIntelligence");
  });

  it("names average vs typical in the craft plane — no essay lede", () => {
    expect(firstView).not.toContain("mcfly-book__lede");
    expect(firstView).toContain("ORDERS_ANALYTICS_AVERAGE_LINE");
    expect(readFileSync(join(here, "orders-first-viewport.ts"), "utf8")).toMatch(
      /Shopify Analytics/,
    );
    expect(firstView).toMatch(/average/i);
    expect(firstView).toMatch(/Typical order|typical/i);
    expect(firstView).toContain("OVERVIEW_FROM_ORDERS_LABEL");
  });

  it("pending sales are not $0", () => {
    expect(firstView).toContain("ORDERS_PENDING_LINE");
    expect(firstView).toContain("ORDERS_THIN_EMPTY_LINE");
  });

  it("does not put SpendExplorer, Total ROAS, or Spend Upload as the hero", () => {
    expect(firstView).not.toContain("SpendExplorer");
    expect(firstView).not.toContain("Total ROAS");
    expect(firstView).not.toContain("/app/spend");
    expect(orders).not.toContain("SpendExplorer");
    expect(orders).not.toContain("Total ROAS");
  });
});
