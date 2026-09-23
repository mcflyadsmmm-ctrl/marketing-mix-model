import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildThreeYearSampleDesk } from "./demo-sample-desk.server";
import { formatMer } from "./mer-format";
import {
  SAMPLE_GROWTH_DOOR,
  SAMPLE_LEDGER_HANDOFF,
  SAMPLE_OVERVIEW_DOOR,
  SAMPLE_SPEND_NOT_LIVE,
} from "./sample-live-handoff";
import { PRODUCT_NOUN } from "./product-labels";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../..");

function readApp(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

function readSite(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function chrome(rel: string) {
  return readApp(rel)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

function spendOf(row: { spendByChannel: Record<string, number> }): number {
  return Object.values(row.spendByChannel).reduce((sum, amt) => sum + amt, 0);
}

describe("Snowdevil founder leave-for-day bar", () => {
  const sampleChrome = [
    chrome("../components/DataModeBar.tsx"),
    chrome("../components/OverviewFirstViewport.tsx"),
    chrome("../components/GrowthFirstViewport.tsx"),
    chrome("./product-labels.ts"),
    chrome("./sample-live-handoff.ts"),
    chrome("./desk-phone-fixture.html"),
    readSite("site/demo.html"),
    readSite("site/assets/demo-desk.js"),
    readSite("site/index.html"),
  ].join("\n");

  it("1. SAMPLE chrome is Snowdevil, not Harbor $92 / Home Co", () => {
    expect(sampleChrome).not.toContain("Harbor Home Co");
    expect(sampleChrome).not.toMatch(/Harbor \$8[0-9]|Harbor \$1[0-1][0-9]/);
    expect(sampleChrome).not.toMatch(/typical order around \$92/i);
    expect(PRODUCT_NOUN.sampleHint).toMatch(/Snowdevil/);
    expect(PRODUCT_NOUN.sampleHint).not.toMatch(/Harbor/);
    expect(SAMPLE_OVERVIEW_DOOR).toMatch(/Snowdevil/);
    expect(SAMPLE_GROWTH_DOOR).toMatch(/Snowdevil/);
    expect(SAMPLE_SPEND_NOT_LIVE).toMatch(/Snowdevil/);
    expect(SAMPLE_LEDGER_HANDOFF).toMatch(/Snowdevil/);
    expect(
      SAMPLE_OVERVIEW_DOOR +
        SAMPLE_GROWTH_DOOR +
        SAMPLE_SPEND_NOT_LIVE +
        SAMPLE_LEDGER_HANDOFF,
    ).not.toMatch(/Harbor/);
  });

  it("2+3. Overview pending/empty never $0 hero, 0.00×, or Edit spend", () => {
    const firstView = chrome("../components/OverviewFirstViewport.tsx");
    const pending = chrome("./desk-phone-pending-fixture.html");
    expect(firstView).not.toContain("0.00×");
    expect(firstView).not.toContain("Edit spend");
    expect(firstView).toContain("OVERVIEW_ORDERS_EMPTY_LINE");
    expect(firstView).toContain("mcfly-overview-plane");
    expect(pending).not.toContain("0.00×");
    expect(pending).not.toContain("Edit spend");
    expect(formatMer(null)).toBe("—");
  });

  it("4+10. Board AOV and MTD sales÷spend stay in range", () => {
    const now = new Date("2026-09-16T18:00:00Z");
    const rows = buildThreeYearSampleDesk({ now, targetMer: 3.5 });
    const aovs = rows.map((r) => r.sales / r.orderCount).sort((a, b) => a - b);
    const median = aovs[Math.floor(aovs.length / 2)]!;
    expect(median).toBeGreaterThan(400);
    expect(median).toBeGreaterThanOrEqual(520);
    expect(median).toBeLessThanOrEqual(700);

    const mtd = rows.filter(
      (r) =>
        r.day.getUTCFullYear() === 2026 &&
        r.day.getUTCMonth() === 8 &&
        r.day.getUTCDate() <= 16,
    );
    let sales = 0;
    let spend = 0;
    for (const r of mtd) {
      sales += r.sales;
      spend += spendOf(r);
    }
    expect(sales).toBeGreaterThan(0);
    expect(spend).toBeGreaterThan(0);
    expect(sales / spend).toBeGreaterThan(3.1);
    expect(sales / spend).toBeLessThan(4.0);

    const day = rows.find((r) => spendOf(r) > 0)!;
    expect(day.sales / spendOf(day)).toBeGreaterThan(3.1);
    expect(day.sales / spendOf(day)).toBeLessThan(4.0);
  });

  it("5. Freeze parks Live; Admin has no merchant Sample | Live switch", () => {
    const settings = chrome("../routes/app.settings.tsx");
    const spend = chrome("../routes/app.spend.tsx");
    const bar = chrome("../components/DataModeBar.tsx");
    const firstView = chrome("../components/OverviewFirstViewport.tsx");
    expect(settings).toContain("Live is parked until launch");
    expect(settings).toContain("sampleOnlyFreeze");
    expect(settings).not.toContain("Switch to Sample data now");
    expect(settings).not.toContain("Sample | Live");
    expect(spend).toContain("isSampleOnlyFreeze()");
    expect(spend).not.toContain("Switch to Live in Settings");
    expect(bar).toContain("Live is parked until launch");
    expect(bar).not.toContain("Switch in Settings");
    expect(firstView).toContain("mcfly-overview-plane");
    expect(firstView).not.toContain("Live is parked until launch");
    expect(SAMPLE_OVERVIEW_DOOR).not.toContain("Live is parked");
    expect(SAMPLE_GROWTH_DOOR).not.toContain("Live is parked");
    const fixture = readApp("./desk-phone-fixture.html");
    expect(fixture).toContain("Live is parked until launch");
    expect(fixture).not.toContain("Switch in Settings");
    expect(fixture).not.toContain("Switch to Live");
    expect(readSite("site/assets/demo-desk.js")).not.toContain("0.00×");
    expect(SAMPLE_SPEND_NOT_LIVE).toContain("Live is parked until launch");
    expect(SAMPLE_LEDGER_HANDOFF).toContain("Live is parked until launch");
    expect(SAMPLE_LEDGER_HANDOFF).not.toMatch(/Saving a day switches you to Live/i);
  });

  it("product lock: SAMPLE spend is on file; Overview/Shopify tabs stay sales-first", () => {
    const now = new Date("2026-09-16T18:00:00Z");
    const rows = buildThreeYearSampleDesk({ now, targetMer: 3.5 });
    expect(rows.length).toBeGreaterThan(0);
    const used = new Set<string>();
    for (const r of rows) {
      expect(spendOf(r)).toBeGreaterThan(0);
      for (const [ch, amt] of Object.entries(r.spendByChannel)) {
        if (amt > 0) used.add(ch);
      }
    }
    expect([...used].sort()).toEqual(["email", "google", "meta", "other"]);

    const firstView = chrome("../components/OverviewFirstViewport.tsx");
    expect(firstView).toContain("useSampleDesk");
    expect(firstView).toContain("mcfly-overview-plane");
    expect(firstView).not.toContain("SAMPLE_SPEND_NOT_LIVE");
    expect(firstView).not.toContain("Example spend");
    expect(firstView).not.toContain("Edit spend");
    expect(firstView).not.toContain("setupAddSpend");
    expect(firstView).not.toContain("OVERVIEW_SPEND_DOOR_LINE");
    expect(firstView).not.toContain("OVERVIEW_SPEND_EMPTY_LINE");
    expect(firstView).not.toContain("QuietSpendDoor");
    expect(SAMPLE_OVERVIEW_DOOR).not.toMatch(/Total ROAS|upload|Edit spend/i);

    const shopifyTabs = [
      chrome("../routes/app.orders.tsx"),
      chrome("../routes/app.customers.tsx"),
    ].join("\n");
    expect(shopifyTabs).not.toContain("Edit spend");
    expect(shopifyTabs).not.toContain("Upload Spend");
  });

  it("SAMPLE Snowdevil is the Overview craft canvas — packed book, no spend", () => {
    const fixture = readApp("./desk-phone-fixture.html");
    const firstView = chrome("../components/OverviewFirstViewport.tsx");
    const overview = chrome("../routes/app._index.tsx");
    const freeze = chrome("./sample-desk.server.ts");
    expect(fixture).toContain("$68,457");
    expect(fixture).toContain("$210,622");
    expect(fixture).toContain("$918,649");
    expect(fixture).toContain("$631");
    expect(fixture).toContain("$45,409");
    expect(fixture).toContain("23%");
    expect(fixture).toContain("$4,279");
    expect(fixture).toContain("$13,264");
    expect(fixture).toContain("Typical order");
    expect(fixture).toContain("Returning");
    expect(fixture).toContain("Weekend");
    expect(fixture).toContain("mcfly-chart__sales-line");
    expect(fixture).toContain("mcfly-chart__typical");
    expect(fixture).toContain("mcfly-chart__sales-fill");
    expect(fixture).toContain("mcfly-chart__hero");
    expect(fixture).toContain("+$905 vs typical");
    expect(fixture).toContain("mcfly-yoy--glance");
    expect(fixture).not.toContain("0.00×");
    expect(fixture).not.toContain("QuietSpendDoor");
    expect(firstView).toContain("mcfly-overview-plane");
    expect(firstView).toContain("OverviewDepthPeeks");
    expect(firstView).not.toContain("orderCount <");
    expect(firstView).not.toContain("if (!useSampleDesk) return");
    expect(overview).not.toContain("QuietSpendDoor");
    expect(overview).toContain("<OverviewSalesChart");
    expect(freeze).toContain("MCFLY_SAMPLE_ONLY");
    expect(freeze).toContain("if (isSampleOnlyFreeze()) return true");
  });

  it("6+7. SAMPLE chip/watermark and dense Overview lanes stay", () => {
    const fixture = readApp("./desk-phone-fixture.html");
    const css = readApp("../styles/mcfly-desk.css");
    const overview = readApp("../routes/app._index.tsx");
    const firstView = readApp("../components/OverviewFirstViewport.tsx");
    expect(fixture).toContain("SAMPLE");
    expect(fixture).toContain("Snowdevil example sales");
    expect(fixture).not.toContain("Example spend");
    expect(fixture).toContain("mcfly-desk--sample");
    expect(css).toMatch(/content:\s*"SAMPLE DATA"/);
    expect(overview).toContain("<OverviewYoyCards");
    expect(overview).toContain("<OverviewFirstViewport");
    expect(overview).toContain("<OverviewSalesChart");
    expect(overview).toContain("<OverviewDepthPeeks");
    expect(firstView).toContain("mcfly-kpi-grid--peeks");
    expect(firstView).toContain("mcfly-kpi--peek");
    expect(fixture).toContain('aria-label="Sales by day"');
  });

  it("8+9. Public demo and SAMPLE tests are not Harbor / Northline truth", () => {
    const demo = readSite("site/demo.html") + readSite("site/assets/demo-desk.js");
    expect(demo).toContain("Snowdevil");
    expect(demo).toContain("$68,457");
    expect(demo).toContain("$631");
    expect(demo).not.toContain("Northline Supply");
    expect(demo).not.toMatch(/\$98,?500/);
    expect(demo).not.toMatch(/4\.19×/);
    expect(demo).not.toContain("$82,068");
    expect(demo).not.toContain("$23,414");
    expect(demo).not.toContain("Harbor Home Co");

    const sampleTests = [
      readApp("./desk-phone-layout.test.ts"),
      readApp("./site-demo-harbor.test.ts"),
      readApp("./site-demo-phone.test.ts"),
      readApp("./desk-paint-currency.test.ts"),
    ].join("\n");
    expect(sampleTests).not.toMatch(/(?<!\.not)toContain\("\$82,068"\)/);
    expect(sampleTests).not.toMatch(/(?<!\.not)toContain\("\$23,414"\)/);
    expect(sampleTests).not.toMatch(/(?<!\.not)toBe\("\$82,068"\)/);
    expect(sampleTests).not.toMatch(/Harbor SAMPLE dollars/);
  });
});
