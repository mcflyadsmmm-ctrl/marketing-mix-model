import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

function chrome(rel: string) {
  return read(rel)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

describe("Profit-margin / COGS setup is parked", () => {
  it("locks the existing NO COGS override — do not ask merchants", () => {
    const board = read("./mer-dashboard.server.ts");
    expect(board).toContain("export const MERCHANT_MARGIN_SETUP_ASK = false");
    expect(board).toContain("const settingsSaved = true");
  });

  it("hides the Settings profit-margin average field and COGS hint", () => {
    const settings = chrome("../routes/app.settings.tsx");
    expect(settings).not.toMatch(/Profit margin average/);
    expect(settings).not.toMatch(/average COGS/);
    expect(settings).not.toMatch(/Break-even preview/);
    expect(settings).not.toMatch(/Reconfirm profit margin/);
    expect(settings).not.toMatch(/name="marginPct"/);
    expect(settings).toContain("Order-history targets");
    expect(settings).toContain("Sample");
  });

  it("does not wall Allocation on a missing margin", () => {
    const allocation = chrome("../routes/app.allocation.tsx");
    expect(allocation).not.toMatch(/Set profit margin/);
    expect(allocation).not.toMatch(/set margin for break-even/i);
    expect(allocation).not.toMatch(/Set margin in Settings/);
    expect(allocation).toContain("throw redirect");
    expect(allocation).toContain('"mix"');
  });

  it("does not ask LTV merchants to confirm a default margin", () => {
    const ltv = chrome("../components/CustomersLtvSection.tsx");
    expect(ltv).not.toMatch(/until you confirm in Settings/);
    expect(ltv).toContain("showMarginKept");
    expect(read("../routes/app.customers.tsx")).toContain("UnlockFullHistoryBanner");
  });

  it("does not paint SAMPLE margin % as this shop on Overview or LTV first-lane", () => {
    const overview = chrome("../routes/app._index.tsx");
    const ltv = chrome("../components/CustomersLtvSection.tsx");
    expect(overview).not.toMatch(/Margin \{Math\.round\(metrics\.marginPct/);
    expect(overview).not.toContain("mcfly-trust__chip--ok");
    const orderStart = ltv.indexOf("const orderRows: LtvRow[] = []");
    const orderEnd = ltv.indexOf("const economicsRows: LtvRow[] = []");
    const orderBlock = ltv.slice(orderStart, orderEnd);
    expect(orderStart).toBeGreaterThan(-1);
    expect(orderEnd).toBeGreaterThan(orderStart);
    expect(orderBlock).toContain('k: "First year"');
    expect(orderBlock).not.toContain("contrib365");
    expect(orderBlock).not.toMatch(/kept\./);
    expect(orderBlock).not.toMatch(/after margin/i);
    expect(orderBlock).not.toContain("marginNote");
  });

  it("drops margin % from the Spend import scratch calculator", () => {
    const spendImport = chrome("../routes/app.spend.import.tsx");
    expect(spendImport).not.toMatch(/Calculator margin percent/);
    expect(spendImport).not.toMatch(/<span>Margin %<\/span>/);
    expect(spendImport).toContain("Calculators · sales ÷ spend");
    expect(spendImport).not.toContain("sales ÷ spend and break-even");
  });

  it("does not list optional profit margin as a plan bullet", () => {
    const entitlements = read("./entitlements.ts");
    const pricing = read("../routes/pricing.tsx");
    expect(entitlements).not.toMatch(/Break-even from optional profit margin/);
    expect(pricing).not.toMatch(/Break-even from optional profit margin/);
    expect(entitlements).toContain("Customer LTV");
  });
});
