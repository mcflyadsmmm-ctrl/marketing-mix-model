import { describe, expect, it } from "vitest";
import {
  buildLtvBySource,
  emptySourceLtvView,
  SOURCE_LTV_MIN_BUYERS,
  sourceLtvLabel,
} from "./ltv-by-source";
import type { DepthOrder } from "./ltv-depth";
import { classifyOrderSource } from "./shopify-depth-stats";

function order(
  customerKey: string,
  day: string,
  amount: number,
  sourceName: string | null,
  extra?: Partial<DepthOrder>,
): DepthOrder {
  return {
    customerKey,
    orderedAt: new Date(`${day}T12:00:00Z`),
    amount,
    units: 1,
    product: null,
    sourceName,
    ...extra,
  };
}

describe("sourceLtvLabel", () => {
  it("names Online / POS / Shop / Other — never an ad platform", () => {
    expect(sourceLtvLabel("online")).toBe("Online");
    expect(sourceLtvLabel("pos")).toBe("POS");
    expect(sourceLtvLabel("shop")).toBe("Shop");
    expect(sourceLtvLabel("other")).toBe("Other");
  });
});

describe("buildLtvBySource", () => {
  it("cohorts on the first order source via classifyOrderSource", () => {
    expect(classifyOrderSource("web")).toBe("online");
    const orders: DepthOrder[] = [];
    // 8 online-first buyers, each $100 lifetime
    for (let i = 0; i < 8; i += 1) {
      orders.push(order(`c${i}`, "2026-01-01", 100, "web"));
    }
    // First POS then later web — stays POS cohort
    for (let i = 0; i < 8; i += 1) {
      orders.push(order(`p${i}`, "2026-01-01", 50, "pos"));
      orders.push(order(`p${i}`, "2026-02-01", 150, "web"));
    }
    const view = buildLtvBySource(orders);
    expect(view.online.buyers).toBe(8);
    expect(view.online.ltv).toBe(100);
    expect(view.pos.buyers).toBe(8);
    expect(view.pos.ltv).toBe(200); // 50 + 150
    expect(view.shop.ltv).toBeNull();
    expect(view.other.ltv).toBeNull();
  });

  it("keeps thin groups as null LTV — never $0", () => {
    const orders: DepthOrder[] = [];
    for (let i = 0; i < SOURCE_LTV_MIN_BUYERS - 1; i += 1) {
      orders.push(order(`c${i}`, "2026-01-01", 80, "shop"));
    }
    const view = buildLtvBySource(orders);
    expect(view.shop.buyers).toBe(SOURCE_LTV_MIN_BUYERS - 1);
    expect(view.shop.ltv).toBeNull();
    expect(view.rows).toHaveLength(4);
    expect(view.rows.map((r) => r.kind)).toEqual([
      "online",
      "pos",
      "shop",
      "other",
    ]);
  });

  it("lands missing sourceName in Other, not Online", () => {
    const orders: DepthOrder[] = [];
    for (let i = 0; i < 8; i += 1) {
      orders.push(order(`c${i}`, "2026-01-01", 40, null));
    }
    for (let i = 0; i < 8; i += 1) {
      orders.push(order(`d${i}`, "2026-01-01", 60, "shopify_draft_order"));
    }
    const view = buildLtvBySource(orders);
    expect(view.other.buyers).toBe(16);
    expect(view.other.ltv).toBe(50);
    expect(view.online.buyers).toBe(0);
    expect(view.online.ltv).toBeNull();
  });

  it("returns four slots from emptySourceLtvView", () => {
    const empty = emptySourceLtvView();
    expect(empty.rows.every((r) => r.ltv === null && r.buyers === 0)).toBe(
      true,
    );
  });
});
