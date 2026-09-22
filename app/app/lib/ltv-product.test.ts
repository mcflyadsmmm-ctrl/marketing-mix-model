import { describe, expect, it } from "vitest";
import { rollUpCustomers, type DepthOrder } from "./ltv-depth";
import { generateSnowdevilDepthOrders } from "./ltv-depth-sample";
import {
  FIRST_PRODUCT_TITLES_COPY,
  FIRST_PRODUCT_TITLES_VERB,
} from "./ltv-first-product";
import {
  buildProductLtv,
  productLtvEmptyState,
  PRODUCT_MIN_BUYERS,
} from "./ltv-product";

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
    grossAmount: extra?.grossAmount,
  };
}

function titledBook(): DepthOrder[] {
  const rows: DepthOrder[] = [];
  // Goggles starters — come back with a board. Highest 90-day value.
  for (let i = 0; i < 10; i += 1) {
    rows.push(order(`g${i}`, "2024-01-01", 90, { product: "Goggles" }));
    rows.push(order(`g${i}`, "2024-02-01", 300, { product: "Board" }));
  }
  // Wax starters — same product again. Lowest 90-day value.
  for (let i = 0; i < 10; i += 1) {
    rows.push(order(`w${i}`, "2024-01-01", 20, { product: "Wax" }));
    if (i < 4) rows.push(order(`w${i}`, "2024-02-01", 20, { product: "Wax" }));
  }
  return rows;
}

describe("buildProductLtv (first-product → LTV)", () => {
  const asOf = new Date("2024-06-01");

  it("ranks first products by matured 90-day value and writes the formula", () => {
    const view = buildProductLtv(titledBook(), asOf);
    expect(view.productsKnown).toBe(true);
    expect(view.namedBuyers).toBe(20);
    expect(view.empty).toBeNull();
    expect(view.rows).toHaveLength(2);
    expect(view.best?.product).toBe("Goggles");
    expect(view.best?.day90Ltv).toBe(390);
    expect(view.best?.comeBack90).toBe(1);
    expect(view.best?.nextProduct).toBe("Board");
    expect(view.best?.nextShare).toBe(1);
    expect(view.best?.sameShare).toBe(0);
    expect(view.best?.firstOrder90).toBe(90);
    expect(view.best?.extraOrders90).toBe(1);
    expect(view.best?.laterOrder90).toBe(300);
    expect(view.best?.predicted90).toBe(390);
    expect(view.best?.observed90).toBe(390);
    expect(view.best?.formula90).toContain("average first order");
    expect(view.best?.formula90).toContain("90.00 + 1.00 × 300.00 = 390.00");

    const wax = view.rows.find((row) => row.product === "Wax")!;
    expect(wax.day90Ltv).toBeCloseTo((4 * 40 + 6 * 20) / 10, 5);
    expect(wax.comeBack90).toBeCloseTo(0.4, 5);
    expect(wax.nextProduct).toBe("Wax");
    expect(wax.sameShare).toBe(1);
    expect(view.best!.lift90).toBeGreaterThan(1);
    expect(wax.lift90).toBeLessThan(1);
  });

  it("leaves un-elapsed product years null instead of a fake $0", () => {
    const youngAsOf = new Date("2024-02-15");
    const view = buildProductLtv(titledBook(), youngAsOf);
    expect(view.best?.day30Ltv).not.toBeNull();
    expect(view.best?.day90Ltv).toBeNull();
    expect(view.best?.day365Ltv).toBeNull();
    expect(view.best?.predicted90).toBeNull();
    expect(view.read?.worthDays).toBe(30);
    expect(view.read?.yearPending).toBe(true);
  });

  it("does not invent a year-scale product LTV without matured year buyers", () => {
    const asOf90 = new Date("2024-04-15");
    const view = buildProductLtv(titledBook(), asOf90);
    expect(view.best?.day90Ltv).toBe(390);
    expect(view.best?.day365Ltv).toBeNull();
    expect(view.read?.worthDays).toBe(90);
    expect(view.read?.yearPending).toBe(true);
  });

  it("seals year-scale product LTV from full history when buyers have lived it", () => {
    const yearAsOf = new Date("2025-02-01");
    const view = buildProductLtv(titledBook(), yearAsOf);
    expect(view.best?.day365Ltv).toBe(390);
    expect(view.best?.lift365).not.toBeNull();
    expect(view.read?.yearPending).toBe(false);
  });

  it("drops products below the buyer floor and untitled first orders", () => {
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 3; i += 1) {
      rows.push(order(`g${i}`, "2024-01-01", 90, { product: "Goggles" }));
    }
    for (let i = 0; i < 12; i += 1) {
      rows.push(order(`n${i}`, "2024-01-01", 80));
    }
    const view = buildProductLtv(rows, asOf);
    expect(view.rows).toEqual([]);
    expect(view.read).toBeNull();
    expect(view.empty?.kind).toBe("thin");
    expect(view.namedBuyers).toBe(3);
    expect(view.buyers).toBe(15);
  });

  it("uses the young empty when named starters have not lived 30 days", () => {
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 10; i += 1) {
      rows.push(order(`g${i}`, "2024-05-20", 90, { product: "Goggles" }));
    }
    const view = buildProductLtv(rows, new Date("2024-06-01"));
    expect(view.read).toBeNull();
    expect(view.empty?.kind).toBe("young");
    expect(view.empty?.verb).toBe("Wait for day 30");
  });

  it("ignores a titled second order when the first line item has no title", () => {
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 10; i += 1) {
      rows.push(order(`c${i}`, "2024-01-01", 80));
      rows.push(order(`c${i}`, "2024-02-01", 80, { product: "Board" }));
    }
    const view = buildProductLtv(rows, asOf);
    expect(view.rows).toEqual([]);
    expect(view.empty?.kind).toBe("titles");
  });
});

describe("productLtvEmptyState", () => {
  it("names syncing / titles / thin / young — never a blank $0", () => {
    expect(
      productLtvEmptyState({
        buyers: 0,
        namedBuyers: 0,
        productsKnown: false,
        sealed: false,
      })?.kind,
    ).toBe("syncing");
    const titles = productLtvEmptyState({
      buyers: 20,
      namedBuyers: 0,
      productsKnown: false,
      sealed: false,
    });
    expect(titles?.kind).toBe("titles");
    expect(titles?.copy).toBe(FIRST_PRODUCT_TITLES_COPY);
    expect(titles?.verb).toBe(FIRST_PRODUCT_TITLES_VERB);
    expect(titles?.copy).not.toMatch(/coming|titled line items|next sync/i);
    expect(
      productLtvEmptyState({
        buyers: 12,
        namedBuyers: 4,
        productsKnown: true,
        sealed: false,
      })?.kind,
    ).toBe("thin");
    expect(
      productLtvEmptyState({
        buyers: 12,
        namedBuyers: 12,
        productsKnown: true,
        sealed: false,
      })?.kind,
    ).toBe("young");
    expect(
      productLtvEmptyState({
        buyers: 12,
        namedBuyers: 12,
        productsKnown: true,
        sealed: true,
      }),
    ).toBeNull();
  });

  it("puts the buyer floor in the thin copy", () => {
    const empty = productLtvEmptyState({
      buyers: 6,
      namedBuyers: 6,
      productsKnown: true,
      sealed: false,
    });
    expect(empty?.need).toBe(PRODUCT_MIN_BUYERS);
    expect(empty?.copy).toContain(String(PRODUCT_MIN_BUYERS));
    expect(empty?.copy).toContain("not $0");
    expect(empty?.verb).toBe("Watch first 30 days");
  });
});

describe("SAMPLE Snowdevil does not invent a first-product catalog", () => {
  const NOW = new Date("2026-09-17T00:00:00Z");
  const orders = generateSnowdevilDepthOrders(NOW);
  const view = buildProductLtv(orders, NOW);

  it("keeps the sales book and leaves first product untitled", () => {
    expect(orders.length).toBeGreaterThan(3000);
    expect(orders.every((order) => order.product == null)).toBe(true);
    expect(view.productsKnown).toBe(false);
    expect(view.rows).toEqual([]);
    expect(view.best).toBeNull();
    expect(view.read).toBeNull();
    expect(view.empty?.kind).toBe("titles");
    const customers = rollUpCustomers(orders);
    expect(customers.every((customer) => !customer.firstProduct)).toBe(true);
    expect(JSON.stringify(view.rows)).not.toMatch(/goggle|wax|board/i);
  });
});
