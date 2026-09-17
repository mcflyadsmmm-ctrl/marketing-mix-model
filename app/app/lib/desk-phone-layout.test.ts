import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

const PHONE_MARK = "P0 phone / Admin-iframe narrow";

function lastBlock(css: string, mark: string): string {
  const start = css.lastIndexOf(mark);
  expect(start).toBeGreaterThan(-1);
  return css.slice(start);
}

describe("Admin desk phone / narrow iframe", () => {
  const css = read("../styles/mcfly-desk.css");
  const phone = lastBlock(css, PHONE_MARK);

  it("keeps 11 analysis tabs + Settings and does not invent a 12th tab", () => {
    const nav = read("./desk-nav.ts");
    const tabs = read("../components/DeskTopTabs.tsx");
    expect(nav).toContain("DESK_PRIMARY_NAV");
    expect(tabs).toContain("DESK_SHOPIFY_NAV");
    expect(tabs).toContain("DESK_SPEND_NAV");
    expect(tabs).toContain("DESK_COMPARE_NAV");
    expect(tabs).not.toContain("label: \"Reviews\"");
    expect(tabs).not.toContain("label=\"Ads\"");
  });

  it("keeps a swipe rail in the phone block; Overview glance is a 3-up spine", () => {
    expect(phone).toMatch(/@media \(max-width: 430px\)/);
    expect(phone).toContain(".mcfly-kpi-grid");
    expect(phone).toContain(".mcfly-score .mcfly-kpi-grid--with-roas");
    expect(phone).toContain(".mcfly-score .mcfly-kpi-grid--peeks-2");
    expect(phone).toContain(".mcfly-yoy__grid");
    expect(phone).toContain("scroll-snap-type: x mandatory");
    expect(phone).toContain("flex-wrap: nowrap");
    expect(phone).toMatch(
      /\.mcfly-kpi-grid[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    );
    expect(css).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(css).toContain(".mcfly-kpi-grid--peeks-lead");
    expect(css).toContain("flex-wrap: nowrap");
    expect(css).toContain(".mcfly-kpi-grid--peeks-lead > button.mcfly-kpi");
    expect(css).toContain("max-width: calc(33.333% - 0.32rem) !important");
    expect(css).toContain("@media (max-width: 430px)");
    expect(css).not.toMatch(
      /@media \(max-width: 420px\) \{\s*\n\s*\.mcfly-kpi-board/,
    );
    expect(css).toContain(".mcfly-yoy--glance");
    expect(css).toContain(".mcfly-chart__typical");
    expect(css).toContain(".mcfly-chart__hero");
    expect(css).toContain(".mcfly-chart__sales-fill");
    expect(css).toContain("max-width: calc(33.333% - 0.24rem) !important");
  });

  it("makes the 11-tab rail one sideways scroll, not page overflow", () => {
    expect(phone).toMatch(/@media \(max-width: 640px\)/);
    expect(phone).toContain(".mcfly-desk-tabs");
    expect(phone).toContain("flex-direction: row");
    expect(phone).toContain("overflow-x: auto");
    expect(phone).toContain("flex-wrap: nowrap");
    expect(phone).toContain("white-space: nowrap");
    expect(phone).toContain("min-height: 2.75rem");
  });

  it("sizes Spend day, Sample, Retry, and primary CTAs for a finger", () => {
    expect(phone).toContain(".mcfly-spend-row");
    expect(phone).toContain(".mcfly-data-mode__btn");
    expect(phone).toContain(".mcfly-state__cta");
    expect(phone).toContain(".mcfly-decision__verb");
    expect(phone).toContain(".mcfly-btn");
    const spend = phone.slice(phone.indexOf(".mcfly-spend-row"));
    expect(spend).toContain("min-height: 2.75rem");
  });

  it("pending Live fixture is dashes — not $0 / 0.00× / Edit spend", () => {
    const fixture = read("./desk-phone-pending-fixture.html");
    expect(fixture).toContain("still loading — not $0");
    expect(fixture).toContain("This month");
    expect(fixture).toContain("This quarter");
    expect(fixture).toContain("This year");
    expect(fixture).toContain("Spend Upload");
    expect(fixture).not.toContain("0.00×");
    expect(fixture).not.toContain("Edit spend");
    expect(fixture).not.toContain("Total Sales");
    expect(fixture).not.toContain("EOM projected");
    expect(fixture).not.toMatch(/>\$0</);
    expect(fixture).not.toContain("Click for detail");
  });

  it("ships a 390px fixture with Snowdevil SAMPLE dollars and the 11-tab rail", () => {
    const fixture = read("./desk-phone-fixture.html");
    expect(fixture).toContain("$68,457");
    expect(fixture).toContain("$631");
    expect(fixture).toContain("Snowdevil");
    expect(fixture).toContain("Typical order");
    expect(fixture).toContain("Weekend vs weekday");
    expect(fixture).toContain("Typical day");
    expect(fixture).toContain("Busiest weekday");
    expect(fixture).toContain("$4,279");
    expect(fixture).toContain("$13,264");
    expect(fixture).toContain("mcfly-chart__sales-line");
    expect(fixture).toContain("mcfly-chart__typical");
    expect(fixture).toContain("mcfly-yoy--glance");
    expect(fixture).toContain("mcfly-chart__hero");
    expect(fixture).toContain("$5,184");
    expect(fixture).toContain("+$905 vs typical");
    expect(fixture).toContain("mcfly-chart__sales-fill");
    expect(fixture).toContain("typical $4,279");
    expect(fixture).toContain("aria-label=\"Sales by day\"");
    expect(fixture).not.toContain("Harbor");
    expect(fixture).not.toContain("$92");
    expect(fixture).not.toContain("3.51×");
    expect(fixture).not.toContain("0.00×");
    expect(fixture).not.toContain("Edit spend");
    expect(fixture).toContain("Overview");
    expect(fixture).toContain("Channel Allocation");
    expect(fixture).toContain("Spend Upload");
    expect(fixture).toContain("Retry");
    expect(fixture).toContain("Live is parked until launch");
    expect(fixture).toContain("mcfly-desk--sample");
    expect(fixture).not.toContain("Switch in Settings");
    expect(fixture).not.toContain("Switch to Live data now");
    expect(fixture).not.toContain("$98,500");
    expect(fixture).not.toMatch(/>—</);
  });

  it("keeps chart/table horizontal scroll inside those regions", () => {
    expect(phone).toContain(".mcfly-chart");
    expect(phone).toContain(".mcfly-goals-table-wrap");
    expect(phone).toContain(".mcfly-ltv-dive__table-wrap");
    expect(phone).toContain("-webkit-overflow-scrolling: touch");
    const spineStart = css.indexOf(".mcfly-me-spine {");
    const spineEnd = css.indexOf("}", spineStart);
    expect(css.slice(spineStart, spineEnd + 1)).toContain("overflow: visible");
    expect(css.slice(spineStart, spineEnd + 1)).not.toContain("overflow-x:");
  });
});
