import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  DESK_DRILL_MORE,
  DESK_LANE_HINT,
  DESK_LANE_RANKS,
  deskLaneFoldLabel,
  deskLaneHashId,
  deskLaneHint,
  deskLaneOpenAfterDefaultOpen,
  deskLaneTargetOpensFold,
} from "./desk-lane";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

const overview = read("../routes/app._index.tsx");
const demoOverview = read("../routes/demo._index.tsx");
const customers = read("../routes/app.customers.tsx");
const demoCustomers = read("../routes/demo.customers.tsx");
const spend = read("../routes/app.spend.tsx");
const growth = read("../routes/app.growth.tsx");
const orders = read("../routes/app.orders.tsx");
const ltv = read("../routes/app.ltv.tsx");
const scoreboard = read("../components/OrdersScoreboard.tsx");
const lane = read("../components/DeskLane.tsx");
const drill = read("../components/DeskDrill.tsx");
const css = read("../styles/mcfly-desk.css");
const pills = read("../components/DeskTopTabs.tsx");
const sample = read("../components/SampleDeskBanner.tsx");

function mixCloseFoldBeforeWeekday(src: string): boolean {
  const mixLabelAt = src.indexOf('label="Mix and month close"');
  const weekdayAt = src.indexOf('label="More order detail"');
  const mixIdAt = src.indexOf("id={OVERVIEW_MIX_CLOSE_ID}");
  if (mixLabelAt < 0 || weekdayAt < 0 || mixIdAt < 0) return false;
  const mixLaneHead = src.slice(
    src.lastIndexOf("<DeskLane", mixLabelAt),
    src.indexOf(">", mixLabelAt) + 1,
  );
  return (
    mixLabelAt < weekdayAt &&
    mixIdAt > mixLabelAt &&
    mixIdAt < weekdayAt &&
    mixLaneHead.includes('rank="more"') &&
    mixLaneHead.includes("fold")
  );
}

function weekdayFoldDefaultOpen(src: string): string | null {
  const weekdayAt = src.indexOf('label="More order detail"');
  if (weekdayAt < 0) return null;
  const lane = src.slice(weekdayAt, src.indexOf(">", weekdayAt + 80) + 1);
  const match = lane.match(/defaultOpen=\{[^}]+\}/);
  return match?.[0] ?? null;
}

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
      'label="Mix and month close"',
      "<OverviewMixForecast",
      "<ShareableInsightCards",
      'label="More order detail"',
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
    expect(overview).toContain("defaultOpen={shotMode");
    expect(demoOverview).toContain('label="More order detail"');
    expect(demoOverview).toContain("defaultOpen={data.shotMode");
    expect(demoOverview).toContain('label="Mix and month close"');
    expect(demoOverview).toContain("fold");
    expect(mixCloseFoldBeforeWeekday(overview)).toBe(true);
    expect(mixCloseFoldBeforeWeekday(demoOverview)).toBe(true);
    expect(weekdayFoldDefaultOpen(overview)).toBe("defaultOpen={shotMode}");
    expect(weekdayFoldDefaultOpen(demoOverview)).toBe(
      "defaultOpen={data.shotMode}",
    );
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
      "<CustomersCompareGlance",
      "<CustomerMixChart",
      'label="Returning mix and facts"',
      "<ShareableInsightCards",
      "<CustomersScoreboard",
      'id="mcfly-ltv"',
      "<UnlockFullHistoryBanner",
      "<CustomersLtvWindows",
      'id="mcfly-growth"',
      "<CustomersGrowthSection",
      'id="mcfly-depth"',
      'label="Who the dollars sit with"',
      "<CustomerRetentionBoard",
      "<CustomerWhaleWatch",
      "<CustomerRfmBoard",
      "<CustomerValueBands",
      "<CustomerWhaleTable",
      "<CustomerConcentrationChart",
    ].map((tag) => customers.indexOf(tag));
    expect(order.every((i) => i > -1)).toBe(true);
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i]!).toBeGreaterThan(order[i - 1]!);
    }
    expect(customers).toMatch(
      /rank="more"[\s\S]*?label="Returning mix and facts"[\s\S]*?\bfold\b/,
    );
    expect(customers).toContain("mcfly-cust-action-row");
    expect(customers).toContain('label="Who the dollars sit with"');
    expect(customers).toContain("defaultOpen={shotMode");
    expect(customers).toContain('panel === "depth"');
    expect(demoCustomers).toContain('label="Who the dollars sit with"');
    expect(demoCustomers).toContain("defaultOpen={data.shotMode");
    expect(demoCustomers).toContain('data.panel === "depth"');
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

  it("SAMPLE L2 retires Orders route — DesktopLane craft stays on the kit", () => {
    expect(orders).toContain("OrdersRedirect");
    expect(orders).toContain("throw redirect");
    expect(scoreboard).toContain("<DeskLane");
    expect(scoreboard).toContain('rank="more"');
    expect(scoreboard).toContain("<OrdersClockBar");
    expect(scoreboard).not.toContain("<details");
  });

  it("ranks LTV value first, explorers next, spend last — no details FAQ", () => {
    const section = read("../components/CustomersLtvSection.tsx");
    const order = [
      "<LtvValueBuild",
      "<LtvFirstProductDrivers",
      "<LtvPromoBoard",
      "<LtvFlagshipBoard",
      "<LtvProductBoard",
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

  it("ranks Spend pair first, explorer in first lane, depth at more — empty live promotes add", () => {
    const order = [
      'rank="first"',
      "<SpendFirstViewport",
      "cashChips=",
      'id="mcfly-explorer"',
      'rank="more"',
      "<SpendMixSection",
      'id="mcfly-cpa"',
    ].map((tag) => spend.indexOf(tag));
    expect(order.every((i) => i > -1)).toBe(true);
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i]!).toBeGreaterThan(order[i - 1]!);
    }
    expect(spend).toContain("<DeskLane");
    expect(spend).toContain("SPEND_FIRST_LANE_LABEL");
    expect(spend).toContain("emptyLiveSpend");
    expect(spend).toMatch(
      /defaultOpen=\{\s*shotMode \|\| spendPanel === "mix" \|\| spendPanel === "cpa"\s*\}/,
    );
    expect(spend).toContain("<CertifiedScoreboard");
    expect(spend).toContain("<SpendExplorer");
    expect(spend).toContain("<CpaExplorer");
    expect(spend).not.toContain("0.00×");
    expect(spend).toContain('spendPanel === "spend-add"');
    expect(spend).toContain('href="#mcfly-spend-add"');
  });
});

describe("DeskLane follows a later defaultOpen — omit-path must fail", () => {
  it("opens when defaultOpen flips true and does not force-close", () => {
    expect(deskLaneOpenAfterDefaultOpen(false, false)).toBe(false);
    expect(deskLaneOpenAfterDefaultOpen(false, true)).toBe(true);
    expect(deskLaneOpenAfterDefaultOpen(true, true)).toBe(true);
    expect(deskLaneOpenAfterDefaultOpen(true, false)).toBe(true);
  });

  it("opens when the hash target is the fold, inside it, or wrapping it", () => {
    expect(deskLaneHashId("")).toBeNull();
    expect(deskLaneHashId("#")).toBeNull();
    expect(deskLaneHashId("#mcfly-spend-add")).toBe("mcfly-spend-add");
    expect(deskLaneHashId("mcfly-depth")).toBe("mcfly-depth");

    const child = { contains: () => false };
    const fold = {
      contains: (other: unknown) => other === child,
    };
    const wrap = {
      contains: (other: unknown) => other === fold,
    };
    const outside = { contains: () => false };

    expect(deskLaneTargetOpensFold(fold, fold)).toBe(true);
    expect(deskLaneTargetOpensFold(child, fold)).toBe(true);
    expect(deskLaneTargetOpensFold(wrap, fold)).toBe(true);
    expect(deskLaneTargetOpensFold(outside, fold)).toBe(false);
    expect(deskLaneTargetOpensFold(null, fold)).toBe(false);
    expect(deskLaneTargetOpensFold(fold, null)).toBe(false);

    const coverageDetails = {
      contains: () => false,
      tagName: "DETAILS",
    };
    const addSection = {
      contains: () => false,
      tagName: "SECTION",
    };
    const addFold = {
      contains: (other: unknown) =>
        other === coverageDetails || other === addSection || other === child,
    };
    expect(deskLaneTargetOpensFold(coverageDetails, addFold)).toBe(false);
    expect(deskLaneTargetOpensFold(addSection, addFold)).toBe(true);
    expect(
      deskLaneTargetOpensFold({ contains: () => false, localName: "details" }, addFold),
    ).toBe(false);
  });

  it("Add-a-day fold does not wrap coverage / ledger / rates / recurring hashes", () => {
    const addLaneOpen = spend.indexOf("label={SPEND_ADD_LANE_LABEL}");
    expect(addLaneOpen).toBeGreaterThan(-1);
    const addLaneClose = spend.indexOf("</DeskLane>", addLaneOpen);
    const addLane = spend.slice(addLaneOpen, addLaneClose);
    expect(addLane).toContain('id="mcfly-spend-add"');
    expect(addLane).not.toContain('id="mcfly-spend-coverage"');
    expect(addLane).not.toContain('id="mcfly-spend-ledger"');
    expect(addLane).not.toContain('id="mcfly-spend-rates"');
    expect(addLane).not.toContain('id="mcfly-spend-recurring"');

    const coverageAt = spend.indexOf('id="mcfly-spend-coverage"');
    const coverageLaneHead = spend.slice(
      spend.lastIndexOf("<DeskLane", coverageAt),
      coverageAt,
    );
    expect(coverageLaneHead).toContain('label="Coverage and import"');
    expect(coverageLaneHead).not.toContain("SPEND_ADD_LANE_LABEL");
    expect(coverageLaneHead).not.toMatch(/\bfold\b/);
  });

  it("DeskLane applies later defaultOpen and hash — grepping a prop is not enough", () => {
    expect(lane).toContain("deskLaneOpenAfterDefaultOpen");
    expect(lane).toContain("deskLaneTargetOpensFold");
    expect(lane).toContain("deskLaneHashId");
    expect(lane).toContain("useLayoutEffect");
    expect(lane).toContain("useDeskLaneLayoutEffect");
    expect(lane).toContain("hashchange");
    expect(lane).toContain("aria-expanded={open}");
    expect(lane).toContain("hidden={!open}");
    expect(lane).toContain("mcfly-lane__toggle");
    expect(lane).not.toContain("<details");
    expect(lane).toMatch(
      /useDeskLaneLayoutEffect\(\(\) => \{[\s\S]*deskLaneOpenAfterDefaultOpen/,
    );
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
    expect(bar).toContain("Sample mode is locked");
  });
});
