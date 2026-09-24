import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LtvExpectedEstimate } from "../components/LtvExpectedEstimate";
import { rollUpCustomers, type DepthOrder } from "./ltv-depth";
import { generateSnowdevilDepthOrders } from "./ltv-depth-sample";
import { P1D_PREDICTIVE_LTV_FIXTURE } from "./fixtures/p1-d-predictive-ltv";
import {
  EXPECTED_LTV_FORMULA_LABEL,
  EXPECTED_LTV_MAX_MONTH_ROWS,
  EXPECTED_LTV_MIN_MATURE,
  expectedLtvFromRetention,
} from "./expected-ltv";
import {
  FLAGSHIP_MAX_MONTH_ROWS,
  FLAGSHIP_MIN_MATURE,
  buildLtvFlagship,
  windowRevenue,
} from "./ltv-flagship";

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(join(here, rel), "utf8");

function order(
  customerKey: string,
  iso: string,
  amount: number,
): DepthOrder {
  return {
    customerKey,
    orderedAt: new Date(iso),
    amount,
    units: 1,
    product: null,
  };
}

/**
 * Two first-order months, both lived 90 days.
 * Month A returners place a third order, so expected orders (1 + come-back)
 * is not the same as orders per buyer. The product must not silently copy
 * realized dollars per buyer.
 */
function divergingBook(): DepthOrder[] {
  const rows: DepthOrder[] = [];
  for (let i = 0; i < 10; i += 1) {
    rows.push(order(`a${i}`, "2024-01-01", 100));
    if (i < 5) rows.push(order(`a${i}`, "2024-02-01", 40));
    if (i < 2) rows.push(order(`a${i}`, "2024-02-15", 40));
  }
  for (let i = 0; i < 8; i += 1) {
    rows.push(order(`b${i}`, "2024-02-01", 80));
    if (i < 4) rows.push(order(`b${i}`, "2024-03-01", 20));
  }
  return rows;
}

describe("P1-D predictive LTV fixture", () => {
  it("locks the honesty label and the missing-input dash", () => {
    expect(EXPECTED_LTV_FORMULA_LABEL).toBe(P1D_PREDICTIVE_LTV_FIXTURE.label);
    expect(P1D_PREDICTIVE_LTV_FIXTURE.missingDisplay).toBe("—");
    expect(P1D_PREDICTIVE_LTV_FIXTURE.missingMustNot).toBe("$0");
    expect(EXPECTED_LTV_MIN_MATURE).toBe(FLAGSHIP_MIN_MATURE);
    expect(EXPECTED_LTV_MAX_MONTH_ROWS).toBe(FLAGSHIP_MAX_MONTH_ROWS);
  });
});

describe("expected LTV from come-back", () => {
  const asOf = new Date("2024-06-01");

  it("is average order value × expected orders, not a copy of realized LTV", () => {
    const rows = divergingBook();
    const estimate = expectedLtvFromRetention(rollUpCustomers(rows), asOf);
    const aov = 2000 / 29;
    const expectedOrders = 1.5;
    expect(estimate.horizonDays).toBe(90);
    expect(estimate.averageOrderValue).toBeCloseTo(aov, 5);
    expect(estimate.comeBack).toBeCloseTo(0.5, 5);
    expect(estimate.expectedOrders).toBeCloseTo(expectedOrders, 5);
    expect(estimate.expected).toBeCloseTo(aov * expectedOrders, 5);
    expect(Math.abs((estimate.expected ?? 0) - 2000 / 18)).toBeGreaterThan(1);
    expect(estimate.formula.startsWith(P1D_PREDICTIVE_LTV_FIXTURE.label)).toBe(
      true,
    );
    expect(estimate.formula).toContain(estimate.plug);
    expect(estimate.display).toBe(estimate.plug);
    expect(estimate.plug).toMatch(/^\d+\.\d{2} × \d+\.\d{2} = \d+\.\d{2}$/);
    const shown = estimate.plug!.match(
      /^(\d+\.\d{2}) × (\d+\.\d{2}) = (\d+\.\d{2})$/,
    )!;
    const productCents = Math.round(
      (Math.round(Number(shown[1]) * 100) * Math.round(Number(shown[2]) * 100)) /
        100,
    );
    expect(productCents).toBe(Math.round(Number(shown[3]) * 100));
    expect(Math.abs(Number(shown[3]) - (estimate.expected ?? 0))).toBeLessThan(
      0.02,
    );
    expect(estimate.inputs).toContain(P1D_PREDICTIVE_LTV_FIXTURE.aovWords);
    expect(estimate.inputs).toContain(P1D_PREDICTIVE_LTV_FIXTURE.ordersWords);
    expect(estimate.inputs).toContain("who came back");
    const realized = windowRevenue(rollUpCustomers(rows), asOf, 90);
    expect(realized.revenue).not.toBeNull();
    expect(
      Math.abs((estimate.expected ?? 0) - (realized.revenue ?? 0)),
    ).toBeGreaterThan(1);
  });

  it("paints a dash when come-back is not on file, never $0", () => {
    const asOfYoung = new Date("2024-01-20");
    const rows: DepthOrder[] = [];
    for (let i = 0; i < 10; i += 1) {
      rows.push(order(`a${i}`, "2024-01-10", 100));
    }
    for (let i = 0; i < 10; i += 1) {
      rows.push(order(`b${i}`, "2024-01-12", 80));
    }
    const estimate = expectedLtvFromRetention(
      rollUpCustomers(rows),
      asOfYoung,
    );
    expect(estimate.expected).toBeNull();
    expect(estimate.averageOrderValue).toBeNull();
    expect(estimate.expectedOrders).toBeNull();
    expect(estimate.plug).toBeNull();
    expect(estimate.formula).toBe(P1D_PREDICTIVE_LTV_FIXTURE.label);
    expect(estimate.display).toBe(P1D_PREDICTIVE_LTV_FIXTURE.missingDisplay);
    expect(estimate.display).not.toContain(P1D_PREDICTIVE_LTV_FIXTURE.missingMustNot);
    expect(estimate.inputs).toContain("Not $0");
    expect(estimate.inputs).toContain("—");
  });

  it("stays a dash with one first-order month, so the empty triangle stays the hero", () => {
    const rows = Array.from({ length: 12 }, (_, i) =>
      order(`c${i}`, "2024-01-01", 90),
    );
    const estimate = expectedLtvFromRetention(
      rollUpCustomers(rows),
      new Date("2024-06-01"),
    );
    expect(estimate.expected).toBeNull();
    expect(estimate.display).toBe("—");
  });
});

describe("SAMPLE predictive LTV is readable text", () => {
  const NOW = new Date("2026-09-17T00:00:00Z");

  it("shows the formula and the plugged product on the Snowdevil book", () => {
    const customers = rollUpCustomers(generateSnowdevilDepthOrders(NOW));
    const estimate = expectedLtvFromRetention(customers, NOW);
    expect(estimate.expected).not.toBeNull();
    expect(estimate.plug).not.toBeNull();
    expect(estimate.formula.startsWith(P1D_PREDICTIVE_LTV_FIXTURE.label)).toBe(
      true,
    );
    expect(estimate.formula).toContain("×");
    expect(estimate.formula).toContain("=");
    expect(estimate.expected).toBeCloseTo(
      (estimate.averageOrderValue ?? 0) * (estimate.expectedOrders ?? 0),
      5,
    );
    const shown = estimate.plug!.match(
      /^(\d+\.\d{2}) × (\d+\.\d{2}) = (\d+\.\d{2})$/,
    );
    expect(shown).not.toBeNull();
    const productCents = Math.round(
      (Math.round(Number(shown![1]) * 100) *
        Math.round(Number(shown![2]) * 100)) /
        100,
    );
    expect(productCents).toBe(Math.round(Number(shown![3]) * 100));
    const html = renderToStaticMarkup(
      createElement(LtvExpectedEstimate, {
        estimate,
        useSampleDesk: true,
      }),
    );
    expect(html).toContain(P1D_PREDICTIVE_LTV_FIXTURE.label);
    expect(html).toContain(estimate.plug);
    expect(html).toContain(estimate.inputs);
    expect(html).toContain("data-p1d=\"predictive-ltv\"");
    expect(html).toMatch(/\bopen\b/);
    expect(html).not.toContain(P1D_PREDICTIVE_LTV_FIXTURE.missingMustNot);
    const view = buildLtvFlagship(generateSnowdevilDepthOrders(NOW), NOW, {
      sample: true,
    });
    expect(view.expectedLtv.formula).toBe(estimate.formula);
    expect(view.expectedLtv.expected).toBeCloseTo(estimate.expected ?? 0, 5);
  });

  it("renders a dash, not $0, when the estimate has no inputs", () => {
    const estimate = expectedLtvFromRetention([], new Date("2026-09-17"));
    const html = renderToStaticMarkup(
      createElement(LtvExpectedEstimate, { estimate, useSampleDesk: true }),
    );
    expect(html).toContain(P1D_PREDICTIVE_LTV_FIXTURE.label);
    expect(html).toContain("— Not $0.");
    expect(html).not.toContain("$0.00");
    expect(html).not.toMatch(/>\$0</);
    expect(estimate.formula).not.toContain("→");
  });
});

describe("P1-D stays on the LTV chip and out of the niche locks", () => {
  it("does not add a tab, COGS, pixels, GMV, or a black-box model", () => {
    const model = read("./expected-ltv.ts");
    const card = read("../components/LtvExpectedEstimate.tsx");
    const section = read("../components/CustomersLtvSection.tsx");
    const nav = read("./desk-nav.ts");
    const rail = read("./desk-panel-rail.ts");
    const chrome = `${model}\n${card}`.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(chrome).not.toMatch(/\bCOGS\b/);
    expect(chrome).not.toMatch(/pixel/i);
    expect(chrome).not.toMatch(/\bGMV\b/);
    expect(chrome).not.toMatch(/\bCAC\b/);
    expect(chrome).not.toMatch(/\bcohort\b/i);
    expect(chrome).not.toMatch(/\bAI\b/);
    expect(nav).toContain('label: "Orders"');
    expect(nav).toContain('label: "Customers"');
    expect(nav).toContain('label: "Spend"');
    expect(nav).toContain('label: "Goals"');
    expect(rail).toContain('chip("mcfly-ltv", "LTV")');
    expect(rail).not.toContain("Predictive");
    const windowsFn = section.slice(
      section.indexOf("export function CustomersLtvWindows"),
      section.indexOf("export function CustomersLtvDepth"),
    );
    expect(windowsFn.indexOf("<LtvWindowTriangle")).toBeLessThan(
      windowsFn.indexOf("<LtvExpectedEstimate"),
    );
  });
});
