import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

const book = read("../components/ShopifyBookSection.tsx");
const orders = read("../routes/app.orders.tsx");
const customers = read("../routes/app.customers.tsx");
const growth = read("../components/CustomersGrowthSection.tsx");
const ltv = read("../components/CustomersLtvSection.tsx");

describe("Shopify five books are visible cards", () => {
  it("ShopifyBookSection paints a KPI grid, not a collapsed FAQ", () => {
    expect(book).toContain("mcfly-book__kpi");
    expect(book).toContain("mcfly-book__glance--kpis");
    expect(book).toContain("function groupHero");
    expect(book).toContain("function groupRows");
    expect(book).not.toContain("<details");
    expect(book).not.toContain("Click a card below for detail");
  });

  it("each book group has a hero plus catalog KPI cards", () => {
    expect(book).toContain("function periodHero");
    expect(book).toContain("function buyersHero");
    expect(book).toContain("function timingHero");
    expect(book).toContain("function growthHero");
    expect(book).toContain("Average order");
    expect(book).toContain("Orders with 2+ items");
    expect(book).toContain("Typical · full price vs discounted");
    expect(book).toContain("Typical Online order");
    expect(book).toContain("Typical POS order");
    expect(book).toContain("Days to a second order");
    expect(book).toContain("Top 10% of customers");
    expect(book).toContain("PRODUCT_NOUN.bookSecondWithin30");
    expect(book).toContain("Sales from returning customers");
  });

  it("Orders tab is retired — route redirects; kit keeps typical-order craft", () => {
    expect(orders).toContain("OrdersRedirect");
    expect(orders).toContain("throw redirect");
    const firstView = read("../components/OrdersFirstViewport.tsx");
    const scoreboard = read("../components/OrdersScoreboard.tsx");
    const chart = read("../components/OrdersTimingChart.tsx");
    expect(firstView).toContain("OrdersTicketBand");
    expect(scoreboard).toContain("buildOrdersClock");
    expect(chart).toContain("function OrdersTimingChart");
    expect(`${firstView}\n${scoreboard}`).toMatch(/typical/i);
    expect(scoreboard).toMatch(/Online vs POS/);
  });

  it("pending sales is a banner on the Orders kit — not a silent $0", () => {
    expect(orders).toContain("throw redirect");
    expect(read("../components/OrdersFirstViewport.tsx")).toContain("ORDERS_PENDING_LINE");
    expect(read("../components/OrdersScoreboard.tsx")).toContain("not $0");
  });

  it("Customers keeps returning dollars and an honest empty — no buyers book dump", () => {
    expect(customers).toContain("<CustomersFirstViewport");
    expect(customers).toContain("<CustomerMixChart");
    expect(customers).toContain("<CustomerRetentionBoard");
    expect(customers).toContain("<CustomerWhaleWatch");
    expect(customers).toContain("<CustomerRfmBoard");
    expect(customers).toContain("!metrics.customerMetricsAvailable");
    expect(customers).toContain("Returning dollars need identified buyers");
    expect(customers).not.toContain("<ShopifyBookSection");
    expect(customers).not.toContain('groups={["buyers"]}');
    expect(customers).not.toContain("0.00×");
  });

  it("Growth keeps days-to-second and 30-day come-back as cards", () => {
    const chart = read("../components/GrowthComebackChart.tsx");
    const board = read("../components/GrowthScoreboard.tsx");
    expect(growth).toContain("<GrowthFirstViewport");
    expect(growth).toContain("<GrowthComebackChart");
    expect(growth).toContain("<GrowthScoreboard");
    expect(growth).toContain("<GrowthTt2Board");
    expect(growth).not.toContain('groups={["growth"]}');
    expect(board).toContain("medianDaysToSecond");
    expect(chart).toContain("secondOrderWithin30Share");
    expect(chart).toContain("not on file");
    expect(book).toContain("PRODUCT_NOUN.bookSecondWithin30Empty");
  });

  it("LTV keeps 60-day First year honesty and readable month cards", () => {
    expect(ltv).toContain('v: "—"');
    expect(ltv).toContain("keepDash: true");
    expect(ltv).toContain("not $0 LTV");
    expect(ltv).toContain("First on file · ");
    expect(ltv).toContain('row.v !== "—"');
    expect(ltv).not.toContain("read_all_orders");
  });

  it("never paints 0.00× on these Shopify book files", () => {
    for (const source of [book, orders, customers, growth, ltv]) {
      expect(source).not.toContain("0.00×");
    }
  });
});
