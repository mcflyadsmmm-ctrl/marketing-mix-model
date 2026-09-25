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

  it("MTD MER stays 3.1–4.0 for every month-day checkpoint (regression lock)", () => {
    // The single fixed-date MTD check above cannot catch a seasonal drift a
    // generator tweak might introduce (e.g. a February MTD leaving the band).
    // Walk every month across three day-of-month checkpoints and assert the
    // MTD ratio never paints outside 3.1–4.0 — and never 0.00× / dead spend.
    const checkpoints: Array<{ month: number; day: number }> = [];
    for (let month = 0; month < 12; month += 1) {
      for (const day of [1, 15, 28]) checkpoints.push({ month, day });
    }
    for (const { month, day } of checkpoints) {
      const at = new Date(Date.UTC(2026, month, day, 18, 0, 0));
      const book = buildThreeYearSampleDesk({ now: at, targetMer: 3.5 });
      const mtd = book.filter(
        (r) =>
          r.day.getUTCFullYear() === 2026 &&
          r.day.getUTCMonth() === month &&
          r.day.getUTCDate() >= 1 &&
          r.day.getUTCDate() <= day,
      );
      expect(mtd.length).toBe(day);
      let sales = 0;
      let spend = 0;
      let orders = 0;
      for (const r of mtd) {
        sales += r.sales;
        spend += spendOf(r);
        orders += r.orderCount;
      }
      const label = `2026-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      expect(spend, `${label} spend`).toBeGreaterThan(0);
      expect(sales, `${label} sales`).toBeGreaterThan(0);
      const mer = sales / spend;
      expect(mer, `${label} MTD mer=${mer.toFixed(3)}`).toBeGreaterThan(3.1);
      expect(mer, `${label} MTD mer=${mer.toFixed(3)}`).toBeLessThan(4.0);
      // Snowdevil AOV territory — never a Harbor $88 candle or a $0 divide.
      const aov = sales / orders;
      expect(aov, `${label} AOV=${aov.toFixed(0)}`).toBeGreaterThan(400);
      expect(aov, `${label} AOV=${aov.toFixed(0)}`).toBeLessThan(900);
    }
  });

  it("no book day is zero-spend or extreme MER (contamination / clamp lock)", () => {
    // Every generated day must carry paid spend (else Total ROAS would paint
    // 0.00× on a day with real SAMPLE sales) and stay in a sane band so a
    // channel-remainder clamp can never silently zero a day's spend.
    let wholeSales = 0;
    let wholeSpend = 0;
    for (const r of rows) {
      const spend = spendOf(r);
      expect(spend, `${r.day.toISOString().slice(0, 10)} spend`).toBeGreaterThan(0);
      expect(r.sales).toBeGreaterThan(0);
      const mer = r.sales / spend;
      expect(mer, `${r.day.toISOString().slice(0, 10)} daily mer=${mer.toFixed(3)}`).toBeGreaterThan(3.1);
      expect(mer, `${r.day.toISOString().slice(0, 10)} daily mer=${mer.toFixed(3)}`).toBeLessThan(4.0);
      wholeSales += r.sales;
      wholeSpend += spend;
    }
    const wholeMer = wholeSales / wholeSpend;
    expect(wholeMer).toBeGreaterThan(3.3);
    expect(wholeMer).toBeLessThan(3.8);
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
    const ordersFirst = read("../components/OrdersFirstViewport.tsx");
    const ordersScore = read("../components/OrdersScoreboard.tsx");
    const timing = read("../components/OrdersTimingChart.tsx");
    expect(`${ordersFirst}\n${ordersScore}`).toMatch(/average/i);
    expect(timing).toMatch(/weekend/i);
    expect(ordersScore).toMatch(/Online vs POS/);
    expect(orders).not.toContain("mcfly-book__lede");

    const customers = read("../routes/app.customers.tsx");
    expect(customers).toMatch(/Returning dollars/i);

    const growth = read("../components/CustomersGrowthSection.tsx");
    expect(growth).toMatch(/second/i);
    expect(growth + read("../lib/product-labels.ts")).toMatch(/30 days/);

    const ltv = read("../components/CustomersLtvSection.tsx");
    expect(ltv).toMatch(/90/);

    const yoy = read("../components/OverviewYoyYearSection.tsx") + read("./yoy-workspace.ts");
    expect(yoy).toMatch(/This month/i);
    expect(yoy).toMatch(/Last month/i);
    expect(yoy).toMatch(/Last year/i);
    expect(yoy).toMatch(/Last 7/);

    const settings = read("../routes/app.settings.tsx");
    expect(settings).not.toContain("Live is parked until launch");
    expect(settings).toMatch(/7-day/);
    expect(settings).toMatch(/\$39/);
    expect(settings).toContain("Sample shop");
  });
});
