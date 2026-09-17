import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  SAMPLE_RETURNS_OF_ORIGINAL,
  SAMPLE_SHIPPING_TAX_OF_TOTAL,
  sampleSalesClock,
} from "./sample-order-clock";

const here = dirname(fileURLToPath(import.meta.url));

describe("sampleSalesClock", () => {
  it("keeps Snowdevil Total Sales as the middle clock — original above, product below", () => {
    const total = 68_457;
    const clock = sampleSalesClock(total);
    expect(SAMPLE_RETURNS_OF_ORIGINAL).toBeGreaterThan(0);
    expect(SAMPLE_SHIPPING_TAX_OF_TOTAL).toBeGreaterThan(0);
    expect(clock.grossSales).toBeGreaterThan(total);
    expect(clock.netSales).toBeGreaterThan(0);
    expect(clock.netSales).toBeLessThan(total);
    expect(clock.grossSales - total).toBeCloseTo(
      clock.grossSales * SAMPLE_RETURNS_OF_ORIGINAL,
      1,
    );
    expect(total - clock.netSales).toBeCloseTo(
      total * SAMPLE_SHIPPING_TAX_OF_TOTAL,
      1,
    );
  });

  it("does not invent a clock when Total Sales is empty", () => {
    expect(sampleSalesClock(0)).toEqual({ grossSales: 0, netSales: 0 });
    expect(sampleSalesClock(Number.NaN)).toEqual({ grossSales: 0, netSales: 0 });
  });

  it("SAMPLE fetch derives the clock at read time — Total Sales stays the ROAS denominator", () => {
    const source = readFileSync(join(here, "./sample-desk.server.ts"), "utf8");
    expect(source).toContain("sampleSalesClock(totalSales)");
    expect(source).toContain("grossSales: clock.grossSales");
    expect(source).toContain("netSales: clock.netSales");
    expect(source).toContain("totalSales,");
  });
});
