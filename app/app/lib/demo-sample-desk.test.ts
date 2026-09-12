import { describe, expect, it } from "vitest";
import {
  buildSampleOrderFactRows,
  buildThreeYearSampleDesk,
} from "./demo-sample-desk.server";
import { depthFeaturesForTab } from "./shopify-depth-catalog";

describe("buildSampleOrderFactRows", () => {
  it("expands day aggregates into orders with line fields", () => {
    const days = buildThreeYearSampleDesk({ years: 0.02, now: new Date("2026-09-12T12:00:00Z") }).slice(-3);
    // Fallback: synthesize 3 days if years clamp
    const slice = days.length >= 2 ? days : buildThreeYearSampleDesk({ years: 1, now: new Date("2026-09-12T12:00:00Z") }).slice(-3);
    const rows = buildSampleOrderFactRows(slice);
    expect(rows.length).toBeGreaterThan(20);
    const day0 = slice[0]!;
    const day0Orders = rows.filter((r) =>
      r.shopifyOrderId.includes(
        `${day0.day.getUTCFullYear()}-${String(day0.day.getUTCMonth() + 1).padStart(2, "0")}-${String(day0.day.getUTCDate()).padStart(2, "0")}`,
      ),
    );
    expect(day0Orders.length).toBe(day0.orderCount);
    const salesSum = Math.round(day0Orders.reduce((s, o) => s + o.amount, 0) * 100) / 100;
    expect(Math.abs(salesSum - day0.sales)).toBeLessThan(0.05);
    expect(day0Orders.every((o) => o.unitCount >= 1)).toBe(true);
    expect(day0Orders.every((o) => o.discountTotal != null)).toBe(true);
  });
});

describe("depthFeaturesForTab density", () => {
  it("core sales set is smaller than full catalog", () => {
    const all = depthFeaturesForTab("sales", "all");
    const core = depthFeaturesForTab("sales", "core");
    expect(core.length).toBeGreaterThan(5);
    expect(core.length).toBeLessThan(all.length);
    expect(core.every((f) => f.tier === "core")).toBe(true);
  });
});
