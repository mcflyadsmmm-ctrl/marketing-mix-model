import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  DESK_DRILL_MORE,
  DESK_LANE_HINT,
  DESK_LANE_RANKS,
  deskLaneFoldLabel,
  deskLaneHint,
} from "./desk-lane";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

const overview = read("../routes/app._index.tsx");
const customers = read("../routes/app.customers.tsx");
const growth = read("../routes/app.growth.tsx");
const orders = read("../routes/app.orders.tsx");
const ltv = read("../routes/app.ltv.tsx");
const scoreboard = read("../components/OrdersScoreboard.tsx");
const lane = read("../components/DeskLane.tsx");
const drill = read("../components/DeskDrill.tsx");
const css = read("../styles/mcfly-desk.css");
const pills = read("../components/DeskTopTabs.tsx");
const sample = read("../components/SampleDeskBanner.tsx");

describe("deskLaneHint", () => {
  it("uses the rank eyebrow and honors a custom hint", () => {
    expect(DESK_LANE_RANKS).toEqual(["first", "next", "more"]);
    expect(deskLaneHint("first")).toBe(DESK_LANE_HINT.first);
    expect(deskLaneHint("next")).toBe(DESK_LANE_HINT.next);
    expect(deskLaneHint("more")).toBe(DESK_LANE_HINT.more);
    expect(deskLaneHint("first", "  Glance  ")).toBe("Glance");
    expect(deskLaneFoldLabel("More order detail", false)).toBe(
      "Show More order detail",
    );
    expect(deskLaneFoldLabel("More order detail", true)).toBe(
      "Hide More order detail",
    );
  });
});

describe("DeskLane — progressive ranks, not a pamphlet", () => {
  it("wraps with rank chrome and folds on a button, never details", () => {
    expect(lane).toContain('rank: DeskLaneRank');
    expect(lane).toContain("mcfly-lane--${rank}");
    expect(lane).toContain("mcfly-lane__toggle");
    expect(lane).toContain("aria-expanded={open}");
    expect(lane).toContain("hidden={!open}");
    expect(lane).not.toContain("<details");
    expect(lane).not.toContain("Click for detail");
    expect(lane).not.toContain("Click a card below for detail");
    expect(css).toContain(".mcfly-lane--first");
    expect(css).toContain(".mcfly-lane--next");
    expect(css).toContain(".mcfly-lane--more");
    expect(css).toContain(".mcfly-lane__toggle");
  });
});

describe("Overview lanes — look first, then mix, then days, then more", () => {
  it("keeps the sales-five paint order and ranks the stacks", () => {
    const order = [
      'rank="first"',
      "<OverviewFirstViewport",
      "<OverviewYoyCards",
      "<OverviewSalesChart",
      'rank="next" label="Mix and month close"',
      "<OverviewMixForecast",
      "<ShareableInsightCards",
      'rank="more"',
      "<OverviewDepthPeeks",
      "<WeekdaySalesChart",
    ].map((tag) => overview.indexOf(tag));
    expect(order.every((i) => i > -1)).toBe(true);
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i]!).toBeGreaterThan(order[i - 1]!);
    }
    expect(overview).toContain("<DeskLane");
    expect(overview).toContain("OVERVIEW_FIRST_LANE_LABEL");
    expect(overview).toContain('label="More order detail"');
    expect(overview).toContain("defaultOpen={shotMode}");
    expect(overview).not.toContain("<details");
    expect(overview).not.toContain("Click for detail");
    expect(overview).not.toContain("<SpendExplorer");
    expect(overview).not.toContain("<PeriodControl");
  });
});

describe("key-tab lanes — same ritual, heroes stay", () => {
  it("ranks Customers without dropping ActionCards or niche boards", () => {
    const order = [
      'id="mcfly-returning"',
      'rank="first"',
      "<CustomersFirstViewport",
      "<CustomerMixChart",
      "<CustomersScoreboard",
      'id="mcfly-ltv"',
      "<UnlockFullHistoryBanner",
      "<CustomersLtvWindows",
      'id="mcfly-growth"',
      "<CustomersGrowthSection",
      'id="mcfly-depth"',
      'rank="more"',
      "<CustomerRetentionBoard",
      "<CustomerWhaleWatch",
      "<CustomerRfmBoard",
      "<CustomerValueBands",
      "<CustomerWhaleTable",
      "<CustomerConcentrationChart",
      "<ShareableInsightCards",
    ].map((tag) => customers.indexOf(tag));
    expect(order.every((i) => i > -1)).toBe(true);
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i]!).toBeGreaterThan(order[i - 1]!);
    }
    expect(customers).toContain("mcfly-cust-action-row");
    expect(customers).toContain('label="Who the dollars sit with"');
    expect(customers).toContain("defaultOpen={shotMode");
  });

  it("ranks Growth days-to-second first fold ahead of come-back explorer and TT2", () => {
    const section = read("../components/CustomersGrowthSection.tsx");
    const order = [
      "<GrowthFirstViewport",
      "<GrowthComebackChart",
      "<GrowthScoreboard",
      "<GrowthTt2Board",
    ].map((tag) => section.indexOf(tag));
    expect(order.every((i) => i > -1)).toBe(true);
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i]!).toBeGreaterThan(order[i - 1]!);
    }
    expect(customers).toContain("GROWTH_FIRST_LANE_LABEL");
    expect(customers).toContain("<CustomersGrowthSection");
    expect(growth).toContain("throw redirect");
    expect(growth).toContain("/app/customers");
  });

  it("ranks Orders typical-order first fold ahead of intelligence and weekday charts", () => {
    const order = [
      'rank="first"',
      "<OrdersFirstViewport",
      'rank="next" label={ORDERS_CLOCK_LANE_LABEL}',
      "<OrdersScoreboard",
      "<OrdersIntelligence",
      'rank="next" label="Weekday and hour"',
      "<OrdersTimingChart",
      "<OrdersFrequencyChart",
    ].map((tag) => orders.indexOf(tag));
    expect(order.every((i) => i > -1)).toBe(true);
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i]!).toBeGreaterThan(order[i - 1]!);
    }
    expect(scoreboard).toContain("<DeskLane");
    expect(scoreboard).toContain('rank="more"');
    expect(scoreboard).toContain("<OrdersClockBar");
    expect(scoreboard).not.toContain("<details");
    const firstStart = orders.indexOf('<DeskLane rank="first"');
    const firstEnd = orders.indexOf("<DeskLane", firstStart + 1);
    const firstLane = orders.slice(firstStart, firstEnd);
    expect(firstLane).toContain("<OrdersFirstViewport");
    expect(firstLane).not.toContain("<OrdersScoreboard");
    expect(firstLane).not.toContain("<OrdersIntelligence");
  });

  it("ranks LTV value first, explorers next, spend last — no details FAQ", () => {
    const section = read("../components/CustomersLtvSection.tsx");
    const order = [
      "<LtvValueBuild",
      "<LtvFlagshipBoard",
      "<LtvProductBoard",
      "<LtvPromoBoard",
      "<LtvBuildCurves",
      "<LtvWhaleRecency",
      "facts={economicsRows}",
    ].map((tag) => section.indexOf(tag));
    expect(order.every((i) => i > -1)).toBe(true);
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i]!).toBeGreaterThan(order[i - 1]!);
    }
    expect(customers.indexOf("<CustomersLtvWindows")).toBeLessThan(
      customers.indexOf("<CustomersLtvDepth"),
    );
    expect(customers.indexOf("<CustomersLtvWindows")).toBeLessThan(
      customers.indexOf("<CustomersLtvEconomics"),
    );
    expect(customers).toContain("<ShareableInsightCards");
    expect(customers).not.toContain("<details");
    expect(customers).toContain("<UnlockFullHistoryBanner");
    expect(ltv).toContain("throw redirect");
    expect(ltv).toContain("/app/customers");
  });
});

describe("DeskDrill — one fact, then more about this number", () => {
  it("leads with the first block and folds the rest", () => {
    expect(drill).toContain("DeskDrillBlocks");
    expect(drill).toContain("DESK_DRILL_MORE");
    expect(DESK_DRILL_MORE).toBe("More about this number");
    expect(drill).toContain("blocks.slice(1)");
    expect(drill).toContain("mcfly-drill__more-btn");
    expect(drill).toContain("hidden={!moreOpen}");
    expect(drill).toContain("setMoreOpen(false)");
    expect(css).toContain(".mcfly-drill__more-btn");
    expect(css).toContain(".mcfly-kpi--drill::after");
    expect(css).not.toContain(".mcfly-yoy__card--drill::after");
    expect(drill).not.toContain("Click for detail");
    expect(drill).not.toContain("Click a card below for detail");
  });
});

describe("preserved desk chrome", () => {
  it("keeps pill nav, SAMPLE, and Live park copy on the desk", () => {
    expect(pills).toContain("mcfly-desk-tabs--pills");
    expect(sample).toMatch(/SAMPLE|Sample/);
    expect(overview).toContain("<SampleDeskBanner");
    const freeze = read("./sample-desk.server.ts");
    expect(freeze).toContain("isSampleOnlyFreeze");
    const bar = read("../components/DataModeBar.tsx");
    expect(bar).toContain("Live is parked until launch");
  });
});
