import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const customers = readFileSync(join(here, "../routes/app.customers.tsx"), "utf8");

describe("Customers page", () => {
  it("contrasts Shopify Analytics returning rate with returning dollars", () => {
    expect(customers).toContain("Shopify Analytics");
    expect(customers).toMatch(/dollars/i);
    expect(customers).toMatch(/returning/i);
  });

  it("links Growth and LTV, keeps pending honesty, and paints the buyers book", () => {
    expect(customers).toContain('href="/app/growth"');
    expect(customers).toContain('href="/app/ltv"');
    expect(customers).toContain("not $0");
    expect(
      customers.includes('groups={["buyers"]}') ||
        customers.includes('groups={"buyers"}'),
    ).toBe(true);
  });

  it("empty customer mix is honest, and the buyers book still paints", () => {
    expect(customers).toContain("!metrics.customerMetricsAvailable");
    expect(customers).toContain("not $0");
    expect(customers).toContain("<ShopifyBookSection");
  });

  it("does not paint cash CAC, spend explorer, or CPA", () => {
    expect(customers).not.toContain("cashCac");
    expect(customers).not.toContain("SpendExplorer");
    expect(customers).not.toContain("CPA");
  });
});
