import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

describe("CPA page", () => {
  const cpa = readFileSync(join(here, "../routes/app.cpa.tsx"), "utf8");

  it("does not paint empty spend as $0 CPA", () => {
    expect(cpa).toContain("cashCostPerCustomer");
    expect(cpa).toContain("tillLtv.cashCac");
    expect(cpa).toContain("Spend Upload");
    expect(cpa).not.toContain("0.00");
    expect(cpa).toContain("cashCpa != null ? formatCurrency(cashCpa) : \"—\"");
    expect(cpa).toContain("cashCac != null ? formatCurrency(cashCac) : \"—\"");
  });
});
