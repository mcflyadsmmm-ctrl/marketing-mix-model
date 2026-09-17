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
const growth = read("../routes/app.growth.tsx");
const ltv = read("../routes/app.ltv.tsx");

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

  it("Orders mounts the scoreboard then the weekday/hour chart", () => {
    expect(orders).toContain("<OrdersScoreboard");
    expect(orders).toContain("<OrdersTimingChart");
    expect(orders).toContain("mcfly-scoreboard--orders");
    expect(orders).toMatch(/typical/i);
    expect(orders).toMatch(/median/i);
    expect(orders).toMatch(/Online vs POS/);
  });

  it("pending sales is a banner — the Orders board still mounts", () => {
    const pending = orders.indexOf("metrics.salesPending");
    const section = orders.indexOf("<OrdersScoreboard");
    const chart = orders.indexOf("<OrdersTimingChart");
    expect(pending).toBeGreaterThan(-1);
    expect(section).toBeGreaterThan(pending);
    expect(chart).toBeGreaterThan(section);
    expect(orders).not.toContain("if (metrics.salesPending) return");
    expect(orders).toContain("not $0");
  });

  it("Customers keeps returning dollars and an honest empty", () => {
    expect(customers).toContain('groups={["buyers"]}');
    expect(customers).toContain("!metrics.customerMetricsAvailable");
    expect(customers).toContain("Returning dollars need identified buyers");
    expect(customers).toContain("<ShopifyBookSection");
    expect(customers).not.toContain("0.00×");
  });

  it("Growth keeps days-to-second and 30-day come-back as cards", () => {
    const chart = read("../components/GrowthComebackChart.tsx");
    const board = read("../components/GrowthScoreboard.tsx");
    expect(growth).toContain("<GrowthComebackChart");
    expect(growth).toContain("<GrowthScoreboard");
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
