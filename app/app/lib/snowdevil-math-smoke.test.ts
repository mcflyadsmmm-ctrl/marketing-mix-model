import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildThreeYearSampleDesk } from "./demo-sample-desk.server";
import { formatMer } from "./mer-format";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

function spendOf(row: { spendByChannel: Record<string, number> }): number {
  return Object.values(row.spendByChannel).reduce((sum, amt) => sum + amt, 0);
}

describe("Snowdevil SAMPLE math smoke", () => {
  const now = new Date("2026-09-16T18:00:00Z");
  const rows = buildThreeYearSampleDesk({ now, targetMer: 3.5 });

  it("MTD sales, spend, MER, and board AOV are in range", () => {
    const mtd = rows.filter((r) => {
      const y = r.day.getUTCFullYear();
      const m = r.day.getUTCMonth();
      const d = r.day.getUTCDate();
      return y === 2026 && m === 8 && d >= 1 && d <= 16;
    });
    expect(mtd.length).toBe(16);

    let sales = 0;
    let spend = 0;
    let orders = 0;
    for (const r of mtd) {
      sales += r.sales;
      spend += spendOf(r);
      orders += r.orderCount;
    }
    expect(spend).toBeGreaterThan(0);
    expect(sales).toBeGreaterThan(0);
    const mer = sales / spend;
    expect(mer).toBeGreaterThan(3.1);
    expect(mer).toBeLessThan(4.0);
    expect(sales / orders).toBeGreaterThan(400);
    expect(formatMer(null)).toBe("—");
  });

  it("a SAMPLE day stays sales ÷ spend in 3.1–4.0, never 0.00× with spend", () => {
    const day = rows.find((r) => r.day.toISOString().slice(0, 10) === "2026-09-16");
    expect(day).toBeTruthy();
    const spend = spendOf(day!);
    expect(spend).toBeGreaterThan(0);
    expect(day!.sales).toBeGreaterThan(0);
    const mer = day!.sales / spend;
    expect(mer).toBeGreaterThan(3.1);
    expect(mer).toBeLessThan(4.0);
    expect(formatMer(mer)).toMatch(/^3\.\d{2}$/);
    expect(formatMer(null)).toBe("—");
  });

  it("walks every tab against Snowdevil / freeze copy", () => {
    const overview = read("../routes/app._index.tsx");
    expect(overview).toContain("OverviewYoyCards");
    expect(overview).toContain("OverviewSalesChart");
    expect(read("../lib/product-labels.ts")).toContain("Typical order");

    const orders = read("../routes/app.orders.tsx");
    expect(orders).toMatch(/median/i);
    expect(orders).toMatch(/average/i);
    expect(orders).toMatch(/weekend/i);
    expect(orders).toMatch(/Online vs POS/);

    const customers = read("../routes/app.customers.tsx");
    expect(customers).toMatch(/Returning dollars/i);

    const growth = read("../routes/app.growth.tsx");
    expect(growth).toMatch(/second/i);
    expect(growth + read("../lib/product-labels.ts")).toMatch(/30 days/);

    const ltv = read("../routes/app.ltv.tsx");
    expect(ltv).toMatch(/90/);

    const spend = read("../routes/app.spend.tsx");
    expect(spend).toMatch(/SAMPLE|sample/i);
    expect(spend).toContain("Total ROAS");

    const roas = read("../routes/app.roas.tsx");
    expect(roas).toMatch(/certified|Certified/i);

    const yoy = read("../routes/app.yoy.tsx");
    expect(yoy).toMatch(/This month/i);
    expect(yoy).toMatch(/Last month/i);
    expect(yoy).toMatch(/Last year/i);
    expect(yoy).toMatch(/Last 7/);

    const settings = read("../routes/app.settings.tsx");
    expect(settings).toContain("Live is parked until launch");
    expect(settings).toMatch(/7-day/);
    expect(settings).toMatch(/\$39/);
    expect(settings).toContain("Snowdevil");
  });
});
