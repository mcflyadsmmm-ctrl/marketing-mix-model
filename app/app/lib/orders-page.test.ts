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

  it("redirects the old Orders URL onto the first tab", () => {
    expect(orders).toMatch(/throw redirect/);
    const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");
    expect(overview).toContain("<OverviewFirstViewport");
    expect(overview).not.toContain("<OrdersIntelligence");
  });

  it("pending sales are not $0", () => {
    const overview = readFileSync(
      join(here, "../components/OverviewFirstViewport.tsx"),
      "utf8",
    );
    expect(overview).toContain("not $0");
    expect(overview).toContain("not 0.");
    expect(firstView).toContain("ORDERS_PENDING_LINE");
    expect(firstView).toContain("ORDERS_THIN_EMPTY_LINE");
  });

  it("does not put SpendExplorer, Total ROAS, or Spend Upload as the hero", () => {
    expect(orders).not.toContain("SpendExplorer");
    expect(orders).not.toContain("Total ROAS");
    expect(orders).not.toContain("/app/spend");
  });

  it("redirects the public orders URL onto the sample overview", () => {
    expect(demoOrders).toMatch(/throw redirect/);
    expect(demoOrders).not.toContain("mcfly-book__lede");
    expect(demoOrders).not.toContain("<OrdersIntelligence");
  });
});

describe("Orders step mix call-site lock", () => {
  it("keeps the old Orders URLs as redirects onto the first tab", () => {
    expect(orders).toMatch(/throw redirect/);
    expect(demoOrders).toMatch(/throw redirect/);
    expect(orders).not.toContain("<OrdersFirstViewport");
    expect(demoOrders).not.toContain("<OrdersFirstViewport");
  });
});
