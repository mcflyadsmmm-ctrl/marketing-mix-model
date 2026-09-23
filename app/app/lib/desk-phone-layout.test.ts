import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DESK_IFRAME_NAV, DESK_PRIMARY_NAV } from "./desk-nav";

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

  it("keeps 3 analysis tabs + Settings and does not invent a 4th analysis tab", () => {
    const nav = read("./desk-nav.ts");
    const tabs = read("../components/DeskTopTabs.tsx");
    expect(DESK_IFRAME_NAV.map((item) => item.label)).toEqual([
      "Home",
      "Customers",
      "Spend",
    ]);
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).toEqual([
      "Home",
      "Customers",
      "Spend",
      "Settings",
    ]);
    expect(DESK_IFRAME_NAV).toHaveLength(3);
    expect(nav).toContain("DESK_PRIMARY_NAV");
    expect(tabs).toContain("DESK_IFRAME_NAV");
    expect(tabs).toContain("mcfly-desk-tabs--pills");
    expect(tabs).not.toContain("mcfly-desk-tabs__k");
    expect(tabs).not.toContain('label="Scoreboard"');
    expect(tabs).not.toContain('label="Retain"');
    expect(tabs).not.toContain("label: \"Reviews\"");
    expect(tabs).not.toContain("label=\"Ads\"");
  });

  it("keeps a swipe rail in the phone block; Overview glance stacks with last year visible", () => {
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
    expect(css).not.toContain("max-width: calc(33.333% - 0.24rem)");
    const glanceAt = css.indexOf(
      "@media (max-width: 36rem) {\n  .mcfly-yoy--glance .mcfly-yoy__grid,",
    );
    expect(glanceAt).toBeGreaterThan(-1);
    const glanceBlock = css.slice(glanceAt, css.indexOf("@media", glanceAt + 10));
    expect(glanceBlock).toContain("grid-template-columns: minmax(0, 1fr)");
    expect(glanceBlock).toMatch(
      /\.mcfly-yoy--glance \.mcfly-yoy__prior\s*\{[^}]*display:\s*flex/,
    );
    expect(glanceBlock).not.toMatch(/\.mcfly-yoy__prior[\s\S]*display:\s*none/);
    expect(glanceBlock).not.toContain("33.333%");
    expect(glanceBlock).toContain("white-space: normal");
    const narrowAt = css.indexOf(
      "@media (max-width: 430px) {\n  .mcfly-yoy--glance .mcfly-yoy__grid,",
    );
    expect(narrowAt).toBeGreaterThan(glanceAt);
    const narrowBlock = css.slice(narrowAt, css.indexOf("@media", narrowAt + 10));
    expect(narrowBlock).toContain("grid-template-columns: minmax(0, 1fr)");
    expect(narrowBlock).not.toContain("33.333%");
    expect(narrowBlock).toMatch(
      /\.mcfly-yoy--glance \.mcfly-yoy__prior\s*\{[^}]*display:\s*flex/,
    );
    expect(glanceBlock).toContain(".mcfly-cpa__windows .mcfly-yoy__range");
    expect(glanceBlock).toMatch(
      /\.mcfly-cpa__windows \.mcfly-yoy__range[\s\S]*?display:\s*inline/,
    );
    expect(glanceBlock).toMatch(
      /\.mcfly-yoy--glance \.mcfly-yoy__range[\s\S]*?display:\s*none/,
    );
  });

  it("at 36rem, this month vs the plan, peek text, and CPA dates stay on screen", () => {
    const goals = read("../routes/app.goals.tsx");
    const cards = read("../components/CpaWindowCards.tsx");
    expect(goals).toContain("mcfly-goals-month-stack");
    expect(goals).toContain("formatSalesOrDash(row.actual, currency)");
    expect(goals).toContain("formatSalesOrDash(prior, currency)");
    expect(goals).toContain("ThisMonthPlanStack");
    expect(cards).toContain("mcfly-yoy--cpa");
    expect(cards).toContain("window.rangeLabel");
    expect(cards).toContain("mcfly-yoy__range");
    expect(cards).not.toContain("mcfly-yoy--glance");

    const phoneGoals = lastBlock(css, "Phone Goals board + chips + CPA dates");
    const mediaStart = phoneGoals.indexOf("@media (max-width: 36rem)");
    expect(mediaStart).toBeGreaterThan(-1);
    const morningAt = phoneGoals.indexOf("Morning habit");
    const phone36 = phoneGoals.slice(
      mediaStart,
      morningAt === -1 ? undefined : morningAt,
    );

    expect(phone36).toContain(".mcfly-goals-table");
    expect(phone36).toContain("min-width: 0");
    expect(phone36).toContain("white-space: normal");
    expect(phone36).toContain("overflow-wrap: anywhere");
    expect(phone36).not.toContain("min-width: 720px");
    expect(phone36).toContain(".mcfly-goals-month-stack__grid");
    expect(phone36).toContain("grid-template-columns: minmax(0, 1fr)");
    expect(phone36).toContain("max-width: none !important");
    expect(phone36).not.toContain("33.333%");
    expect(phone36).toContain("flex-wrap: wrap");
    expect(phone36).toContain(".mcfly-desk-panel-rail__chip");
    expect(phone36).toContain("font-size: 0.88rem");
    expect(phone36).toMatch(
      /\.mcfly-cpa__windows \.mcfly-yoy__range[\s\S]*?display:\s*inline/,
    );
    expect(phone36).not.toMatch(
      /\.mcfly-cpa__windows[\s\S]*\.mcfly-yoy__range[\s\S]*display:\s*none/,
    );
    expect(phone36).toContain(".mcfly-score--orders-hero");
    expect(phone36).toContain(".mcfly-score--customers-hero");
    expect(css).toContain("overflow-x: hidden");
  });

  it("wraps 3 analysis tabs as small spaced pills — never a smooshed nowrap strip", () => {
    expect(phone).toMatch(/@media \(max-width: 640px\)/);
    const tabsStart = phone.indexOf(".mcfly-desk-tabs,");
    expect(tabsStart).toBeGreaterThan(-1);
    const tabsRule = phone.slice(tabsStart, phone.indexOf("}", tabsStart) + 1);
    expect(tabsRule).toContain("flex-wrap: wrap");
    expect(tabsRule).toContain("overflow-x: visible");
    expect(tabsRule).not.toContain("nowrap");
    expect(tabsRule).not.toContain("overflow-x: auto");
    expect(phone).toContain(".mcfly-desk-tabs");
    expect(phone).toContain("flex-direction: row");
    expect(phone).toContain("white-space: nowrap");
    expect(phone).toContain("border-radius: 999px");
    expect(phone).toContain(".mcfly-desk-tabs__k");
    expect(phone).toMatch(/\.mcfly-desk-tabs__k[\s\S]{0,80}display:\s*none/);
    expect(css).toContain(".mcfly-desk-tabs--pills");
    expect(css).toContain(".mcfly-desk-tabs a.mcfly-desk-tabs__pill");
    expect(css).toContain(".mcfly-desk-tabs__pill--on");
    expect(css).toMatch(
      /\.mcfly-desk-tabs__pill--on[\s\S]{0,220}background:\s*var\(--mcfly-ink\)/,
    );
    expect(css).not.toContain("border-bottom-color: var(--mcfly-ink)");
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
    expect(fixture).toContain("0 of 23 days");
    expect(fixture).toContain("mcfly-overview-plane__value");
    expect(fixture).not.toContain("mcfly-chart--empty");
    expect(fixture).not.toContain("Spend Upload");
    expect(fixture).not.toContain("Channel Allocation");
    expect(fixture).not.toContain("Total ROAS");
    expect(fixture).not.toContain(">Growth<");
    expect(fixture).not.toContain(">LTV<");
    expect(fixture).not.toContain(">CPA<");
    expect(fixture).not.toContain(">YoY<");
    expect(fixture).not.toContain("mcfly-desk-tabs__k");
    expect(fixture).not.toContain("0.00×");
    expect(fixture).not.toContain("Edit spend");
    expect(fixture).not.toContain("Total Sales");
    expect(fixture).not.toContain("EOM projected");
    expect(fixture).not.toMatch(/>\$0</);
    expect(fixture).not.toContain("Click for detail");
  });

  it("ships a 390px fixture with Snowdevil SAMPLE dollars and the 3-tab rail", () => {
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
    expect(fixture).toContain(">Home<");
    expect(fixture).toContain(">Customers<");
    expect(fixture).toContain(">Spend<");
    expect(fixture).not.toContain('href="#orders"');
    expect(fixture).not.toContain('href="#goals"');
    expect(fixture).not.toContain('href="#overview"');
    expect(fixture).not.toContain("Channel Allocation");
    expect(fixture).not.toContain("Spend Upload");
    expect(fixture).not.toContain(">Growth<");
    expect(fixture).not.toContain(">CPA<");
    expect(fixture).toContain("mcfly-desk-tabs--pills");
    expect(fixture).not.toContain("mcfly-desk-tabs__k");
    expect(fixture).not.toContain("SCOREBOARD");
    expect(fixture).not.toContain(">Retain<");
    expect(fixture).toContain("Retry");
    expect(fixture).toContain("Sample mode is locked");
    expect(fixture).toContain("mcfly-desk--sample");
    expect(fixture).not.toContain("Switch in Settings");
    expect(fixture).not.toContain("Switch to Live data now");
    expect(fixture).not.toContain("$98,500");
    expect(fixture).not.toMatch(/>—</);
    expect(fixture).toContain("mcfly-scoreboard--orders");
    expect(fixture).toContain("mcfly-orders-hero");
    expect(fixture).toContain("Typical order around $631. Average is $634.");
    expect(fixture).toContain("Shopify Analytics Orders is the average order.");
    expect(fixture).toContain("mcfly-kpi-grid--peeks-lead");
    expect(fixture.indexOf("Typical order around $631")).toBeLessThan(
      fixture.indexOf("Order intelligence"),
    );
    expect(fixture.indexOf("mcfly-orders-hero")).toBeLessThan(
      fixture.indexOf("Order intelligence"),
    );
    const ordersStart = fixture.indexOf('id="orders"');
    const ordersFirst = fixture.indexOf("mcfly-lane--first", ordersStart);
    const ordersNext = fixture.indexOf("mcfly-lane--next", ordersFirst);
    expect(ordersFirst).toBeGreaterThan(-1);
    expect(ordersNext).toBeGreaterThan(ordersFirst);
    const firstLane = fixture.slice(ordersFirst, ordersNext);
    expect(firstLane).toContain("mcfly-orders-hero");
    expect(firstLane).toContain("Typical order vs Shopify");
    expect(firstLane).not.toContain("mcfly-orders-intel");
    expect(firstLane).not.toContain("mcfly-book__clock");
    expect(firstLane).not.toContain("Order intelligence");
    expect(fixture.slice(ordersNext)).toContain("Sales clock and intelligence");
    expect(fixture.slice(ordersNext)).toContain("mcfly-orders-intel");
    expect(fixture.slice(ordersNext)).toContain("mcfly-book__clock");
    expect(fixture).toContain("mcfly-scoreboard--customers");
    expect(fixture).toContain("mcfly-customers-hero");
    expect(fixture).toContain("RFM-lite, whales, repurchase clock");
    expect(fixture).toContain("Shopify Analytics Customers is a customer list.");
    expect(fixture).toContain("Snowdevil example buyers");
    expect(fixture).toContain("Whale watch");
    expect(fixture).toContain("Typical repurchase");
    expect(fixture).toContain("Win-back by");
    expect(fixture).toContain("Save now");
    expect(fixture).toContain("Typical repurchase day 24. 8 whales to reach. At risk: 32.");
    expect(fixture).toContain("RFM-lite · At risk");
    expect(fixture).toContain("8 to reach");
    expect(fixture).toContain("Day 24");
    expect(fixture).toContain("Day 39");
    expect(fixture.indexOf("mcfly-customers-hero")).toBeLessThan(
      fixture.indexOf("mcfly-orders-hero"),
    );
    expect(css).toContain(".mcfly-customers-hero");
    expect(css).toContain(".mcfly-customers-rfmband");
    expect(fixture).toContain("Average order $634");
    expect(fixture).toContain("$72,827");
    expect(fixture).toContain("$60,242");
    expect(fixture).toContain("$548–$694");
    expect(fixture).toContain("Orders with 2+ items");
    expect(fixture).toContain("Shipping + tax");
    expect(fixture).toContain("$8,215");
    expect(fixture).toContain("Typical Online order");
    expect(fixture).toContain("Typical POS order");
    expect(fixture).toContain("Weekday");
    expect(fixture).toContain("Hour");
    expect(css).toContain(".mcfly-scoreboard--orders");
    expect(css).toContain(".mcfly-kpi-grid--orders-depth");
    expect(css).toContain(".mcfly-chart__hours");
    expect(css).toContain(
      ".mcfly-score .mcfly-kpi-grid--orders-depth > .mcfly-kpi:nth-child(4)",
    );
    expect(css).toContain(
      ".mcfly-scoreboard--orders .mcfly-book__clock-v",
    );
    expect(css).toContain(
      ".mcfly-scoreboard--orders .mcfly-kpi--peek .mcfly-kpi__value",
    );
    expect(fixture).toContain("mcfly-orders-band");
    expect(fixture).toContain("mcfly-orders-band__median");
    expect(fixture).toContain("mcfly-orders-band__mean");
    expect(fixture).toContain("mcfly-orders-clockbar");
    expect(fixture).toContain("mcfly-orders-clockbar__seg--returns");
    expect(fixture).toContain("mcfly-orders-sourcebar");
    expect(fixture).toContain("Online 72% · $640");
    expect(css).toContain(".mcfly-orders-band__box");
    expect(css).toContain(".mcfly-orders-clockbar__seg--product");
    expect(css).toContain(".mcfly-orders-sourcebar__seg--online");
    // Order intelligence — KPI strip, dual-axis explorer, audit ledger, frequency.
    expect(fixture).toContain("mcfly-orders-intel");
    expect(fixture).toContain("Order intelligence");
    expect(fixture).toContain("+9% vs prior");
    expect(fixture).toContain("Orders × AOV explorer");
    expect(fixture).toContain("mcfly-chart__aovline");
    expect(fixture).toContain("mcfly-orders-ledger__table");
    expect(fixture).toContain("Wk of Sep 7");
    expect(fixture).toContain("mcfly-orders-tiers");
    expect(fixture).toContain("AOV tiers");
    expect(fixture).toContain("$550–$600");
    expect(css).toContain(".mcfly-orders-tiers__fill");
    expect(fixture).toContain("mcfly-chart--frequency");
    expect(fixture).toContain("1 order");
    expect(css).toContain(".mcfly-orders-intel__kpis");
    expect(css).toContain(".mcfly-orders-ledger__table");
    expect(css).toContain(".mcfly-chart__aovline");
    expect(css).toContain(".mcfly-chart__freq");
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

  it("ships a 390 CSS pass: no page overflow, wrap toolbars, sticky table stub", () => {
    const pass = lastBlock(css, "390 CSS Admin-iframe compatibility");
    expect(pass).toMatch(/@media \(max-width: 430px\)/);
    expect(pass).toContain("overflow-x: hidden");
    expect(pass).toContain(".mcfly-explorer__controls");
    expect(pass).toContain(".mcfly-chart__controls");
    expect(pass).toContain("flex-wrap: wrap");
    expect(pass).toContain(".mcfly-chart--dual");
    expect(phone).toContain(".mcfly-chart--dual .mcfly-chart__svg");
    expect(phone).toMatch(
      /\.mcfly-chart--dual \.mcfly-chart__svg[\s\S]{0,400}max-width:\s*100%/,
    );
    expect(pass).toContain(".mcfly-orders-ledger__lh");
    expect(pass).toContain(".mcfly-yoy-board__table tbody th");
    expect(pass).toContain("position: sticky");
    expect(pass).toContain("left: 0");
    expect(pass).toContain(".mcfly-yoy--glance .mcfly-yoy__k");
    expect(pass).toContain("font-size: 0.62rem");
    expect(pass).toContain(".mcfly-desk-tabs a.mcfly-desk-tabs__pill");
    expect(pass).toContain("min-height: 2.75rem");
    expect(pass).toContain("overflow-x: auto");
    expect(css).toMatch(
      /prefers-reduced-motion: reduce[\s\S]*mcfly-desk-tabs__pill[\s\S]*transition:\s*none/,
    );
    expect(pass).not.toContain("SCOREBOARD");
    expect(pass).not.toContain("read_all_orders");
    expect(pass).not.toContain("0.00×");
  });
});
