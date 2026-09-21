import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { formatCurrency } from "./mer-format";
import { generateSnowdevilDepthOrders } from "./ltv-depth-sample";
import { buildLtvFlagship } from "./ltv-flagship";
import type { DepthOrder } from "./ltv-depth";
import {
  FIRST_PRODUCT_LTV_DASH,
  FIRST_PRODUCT_NO_REPEAT_COPY,
  FIRST_PRODUCT_TITLES_COPY,
  buildFirstProductDrivers,
  firstProductLtvDisplay,
} from "./ltv-first-product";

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(join(here, rel), "utf8");

function order(
  customerKey: string,
  iso: string,
  amount: number,
  extra?: Partial<DepthOrder>,
): DepthOrder {
  return {
    customerKey,
    orderedAt: new Date(iso),
    amount,
    units: extra?.units ?? 1,
    product: extra?.product ?? null,
  };
}

/** Goggles come back. Wax is first-order only — the blank must not be $0. */
function repeatAndBlankFixture(): DepthOrder[] {
  const rows: DepthOrder[] = [];
  for (let i = 0; i < 4; i += 1) {
    rows.push(order(`g${i}`, "2024-01-01", 90, { product: "Snow Goggles" }));
    rows.push(order(`g${i}`, "2024-03-01", 300, { product: "Board" }));
  }
  for (let i = 0; i < 5; i += 1) {
    rows.push(
      order(`w${i}`, "2024-01-01", 20, { product: "Selling Plans Ski Wax" }),
    );
  }
  return rows;
}

describe("buildFirstProductDrivers", () => {
  it("lists product title, first-order count, and revenue from buyers who came back", () => {
    const view = buildFirstProductDrivers(repeatAndBlankFixture());
    expect(view.productsKnown).toBe(true);
    expect(view.empty).toBeNull();
    expect(view.rows.map((row) => row.product)).toEqual([
      "Snow Goggles",
      "Selling Plans Ski Wax",
    ]);

    const goggles = view.rows[0]!;
    expect(goggles.firstOrderCount).toBe(4);
    expect(goggles.repeatBuyers).toBe(4);
    expect(goggles.avgLtv).toBe(390);
    const painted = firstProductLtvDisplay(goggles.avgLtv, (n) =>
      formatCurrency(n, "USD"),
    );
    expect(painted).toBe("$390");
    expect(painted).not.toBe(FIRST_PRODUCT_LTV_DASH);
    expect(painted).not.toBe("$0");
    expect(painted).not.toBe("0%");
  });

  it("paints a dash for a product with no repeat history — blank is not 0% or $0", () => {
    const view = buildFirstProductDrivers(repeatAndBlankFixture());
    const wax = view.rows.find((row) => row.product === "Selling Plans Ski Wax")!;
    expect(wax.firstOrderCount).toBe(5);
    expect(wax.repeatBuyers).toBe(0);
    expect(wax.avgLtv).toBeNull();
    expect(wax.avgLtv).not.toBe(0);

    const cell = firstProductLtvDisplay(wax.avgLtv, (amount) =>
      amount === 0 ? "$0" : `$${amount}`,
    );
    expect(cell).toBe(FIRST_PRODUCT_LTV_DASH);
    expect(cell).not.toBe("$0");
    expect(cell).not.toBe("$0.00");
    expect(cell).not.toBe("0%");
    expect(FIRST_PRODUCT_NO_REPEAT_COPY).not.toContain("0%");
    expect(FIRST_PRODUCT_NO_REPEAT_COPY).toContain("not $0");
  });

  it("refuses a $0 average even when later orders exist but dollars are zero", () => {
    const rows = [
      order("c1", "2024-01-01", 0, { product: "Free Sticker" }),
      order("c1", "2024-02-01", 0, { product: "Free Sticker" }),
    ];
    const view = buildFirstProductDrivers(rows);
    expect(view.rows[0]?.repeatBuyers).toBe(1);
    expect(view.rows[0]?.avgLtv).toBeNull();
    expect(firstProductLtvDisplay(view.rows[0]?.avgLtv ?? null, () => "$0")).toBe(
      "—",
    );
    expect(
      firstProductLtvDisplay(0, (n) => (n === 0 ? "$0" : `$${n}`)),
    ).toBe("—");
    expect(firstProductLtvDisplay(0, () => "0%")).toBe("—");
    expect(formatCurrency(0.4, "USD")).toBe("$0");
    expect(
      firstProductLtvDisplay(0.4, (n) => formatCurrency(n, "USD")),
    ).toBe("—");
    expect(
      firstProductLtvDisplay(0.4, (n) => formatCurrency(n, "USD")),
    ).not.toBe("$0");
  });

  it("keeps one-time buyers in the average once the product has any repeat history", () => {
    const rows: DepthOrder[] = [
      order("a", "2024-01-01", 50, { product: "Trail Beanie" }),
      order("b", "2024-01-02", 50, { product: "Trail Beanie" }),
      order("c", "2024-01-03", 50, { product: "Trail Beanie" }),
      order("c", "2024-03-01", 100, { product: "Gloves" }),
      order("d", "2024-01-04", 50, { product: "Trail Beanie" }),
      order("d", "2024-03-02", 100, { product: "Gloves" }),
    ];
    const view = buildFirstProductDrivers(rows);
    expect(view.rows).toHaveLength(1);
    expect(view.rows[0]?.firstOrderCount).toBe(4);
    expect(view.rows[0]?.avgLtv).toBe(100);
    expect(view.rows[0]?.avgLtv).not.toBe(0);
  });

  it("does not invent a row from a titled later order when the first order has no title", () => {
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 4; i += 1) {
      rows.push(order(`c${i}`, "2024-01-01", 80));
      rows.push(order(`c${i}`, "2024-02-01", 40, { product: "Board" }));
    }
    const view = buildFirstProductDrivers(rows);
    expect(view.rows).toEqual([]);
    expect(view.empty?.kind).toBe("titles");
    expect(view.empty?.copy).toBe(FIRST_PRODUCT_TITLES_COPY);
    expect(view.empty?.copy).toContain("Not $0");
    expect(view.empty?.copy).not.toContain("0%");
  });

  it("uses the syncing empty when no buyers are on file", () => {
    const view = buildFirstProductDrivers([]);
    expect(view.rows).toEqual([]);
    expect(view.empty?.kind).toBe("syncing");
    expect(view.empty?.copy).toContain("not $0");
    expect(view.empty?.verb).toBe("Refresh this page");
  });
});

describe("SAMPLE Snowdevil proves first-product LTV", () => {
  const NOW = new Date("2026-09-17T00:00:00Z");
  const orders = generateSnowdevilDepthOrders(NOW);
  const view = buildFirstProductDrivers(orders);
  const flagship = buildLtvFlagship(orders, NOW, { sample: true });

  it("fills product title, first-order count, and a real average — never $0", () => {
    expect(view.productsKnown).toBe(true);
    expect(view.empty).toBeNull();
    expect(view.rows.length).toBeGreaterThanOrEqual(2);
    expect(flagship.firstProductDrivers).toEqual(view);
    const priced = view.rows.filter((row) => row.avgLtv != null);
    expect(priced.length).toBeGreaterThanOrEqual(2);
    for (const row of view.rows) {
      expect(row.product.trim().length).toBeGreaterThan(0);
      expect(row.firstOrderCount).toBeGreaterThan(0);
      expect(row.avgLtv).not.toBe(0);
      const cell = firstProductLtvDisplay(row.avgLtv, (n) =>
        formatCurrency(n, "USD"),
      );
      expect(cell).not.toBe("$0");
      expect(cell).not.toBe("0%");
      if (row.avgLtv == null) {
        expect(cell).toBe(FIRST_PRODUCT_LTV_DASH);
      } else {
        expect(row.avgLtv).toBeGreaterThan(0);
        expect(cell).not.toBe(FIRST_PRODUCT_LTV_DASH);
      }
    }
  });
});

describe("live orders stay on existing scopes", () => {
  it("leaves untitled OrderFacts as a titles empty, not a $0 catalog", () => {
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 6; i += 1) {
      rows.push(order(`c${i}`, "2024-01-01", 80));
      if (i < 3) rows.push(order(`c${i}`, "2024-02-01", 40));
    }
    const view = buildLtvFlagship(rows, new Date("2024-06-01"), {
      sample: false,
    });
    expect(view.firstProductDrivers.productsKnown).toBe(false);
    expect(view.firstProductDrivers.rows).toEqual([]);
    expect(view.firstProductDrivers.empty?.kind).toBe("titles");
    expect(view.firstProductDrivers.empty?.copy).toContain("Not $0");
    expect(view.firstProductDrivers.empty?.copy).not.toContain("0%");
  });

  it("does not crawl line-item titles or add a scope", () => {
    const depthPage = read("./ltv-depth-page.server.ts");
    const orderFacts = read("./order-facts.server.ts");
    expect(depthPage).toContain("product: null");
    expect(orderFacts).not.toMatch(/\blineItems\b/);
    expect(depthPage).not.toMatch(/\bread_all_orders\b/);
    expect(depthPage).not.toMatch(/\blineItems\b/);
  });
});

describe("P1-A sits on the Customers LTV chip, below the fold", () => {
  const section = read("../components/CustomersLtvSection.tsx");
  const board = read("../components/LtvFirstProductDrivers.tsx");
  const customers = read("../routes/app.customers.tsx");
  const nav = read("./desk-nav.ts");
  const windowsStart = section.indexOf("export function CustomersLtvWindows");
  const windowsEnd = section.indexOf("export function CustomersLtvDepth");
  const windows = section.slice(windowsStart, windowsEnd);

  it("keeps the hero, Target Line, and #125 triangle, then the product table", () => {
    expect(windows).toContain("<LtvValueBuild");
    expect(windows).toContain("targetLine={chartTargetLine}");
    expect(windows).toContain("<LtvWindowTriangle");
    expect(windows).toContain("<LtvFirstProductDrivers");
    expect(windows.indexOf("<LtvValueBuild")).toBeLessThan(
      windows.indexOf("<LtvWindowTriangle"),
    );
    expect(windows.indexOf("<LtvWindowTriangle")).toBeLessThan(
      windows.indexOf("<LtvFirstProductDrivers"),
    );
    expect(windows).toContain("mcfly-book__hero");
    expect(customers).toContain('id="mcfly-ltv"');
    expect(section.indexOf("<LtvFirstProductDrivers")).toBeLessThan(
      section.indexOf("<LtvFlagshipBoard"),
    );
    expect(section).toContain("<LtvProductBoard");
    expect(section).toContain("<LtvWindowTriangle");
  });

  it("prints a dash for no repeat history and never a 0% column", () => {
    expect(board).toContain('data-blank={blank ? "no-repeat" : undefined}');
    expect(board).toContain("firstProductLtvDisplay");
    expect(board).toContain("FIRST_PRODUCT_NO_REPEAT_COPY");
    expect(board).toContain(">First product<");
    expect(board).toContain(">First orders<");
    expect(board).toContain(">Avg LTV<");
    expect(board).not.toContain("0%");
    expect(board).not.toMatch(/>\$0</);
    expect(board).not.toMatch(/\bCOGS\b|\bmargin\b|\bpixel\b|\bMTA\b|\bGMV\b/i);
    const chrome = board
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    expect(chrome).not.toMatch(/\bcohort\b/i);
    expect(chrome).not.toMatch(/\bARPU\b/i);
    expect(chrome).not.toMatch(/\baMER\b/);
  });

  it("does not add a top-nav tab", () => {
    expect(nav).toContain('label: "Overview"');
    expect(nav).toContain('label: "Orders"');
    expect(nav).toContain('label: "Customers"');
    expect(nav).toContain('label: "Spend"');
    expect(nav).toContain('label: "Goals"');
    expect(customers).not.toContain('href="/app/product"');
    expect(customers).not.toContain('label: "Product"');
    const labels = [...nav.matchAll(/label: "([^"]+)"/g)].map((hit) => hit[1]);
    expect(labels).toEqual([
      "Overview",
      "Orders",
      "Customers",
      "Spend",
      "Goals",
      "Settings",
    ]);
  });
});
