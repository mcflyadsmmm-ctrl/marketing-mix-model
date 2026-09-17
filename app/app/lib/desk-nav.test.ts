import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  DESK_OVERVIEW_TABS,
  DESK_PRIMARY_NAV,
  DESK_SECTION,
  DESK_SCOREBOARD_NAV,
  DESK_RETAIN_NAV,
  DESK_SPEND_NAV,
  DESK_TOP_NAV,
  deskNavHref,
  deskNavHrefFromSearch,
  deskStageFromHash,
  deskStageHeading,
  isDeskNavActive,
  isOverviewHomeStage,
  overviewSectionLocation,
} from "./desk-nav";
import { spendAddHref, SPEND_ADD_HREF } from "./number-honesty";

describe("deskNavHref", () => {
  it("keeps period and shot, drops host/shop, and can hash to Add spend", () => {
    expect(deskNavHref("/app/spend")).toBe("/app/spend");
    expect(deskNavHref("/app/spend", { period: "lm" })).toBe(
      "/app/spend?period=lm",
    );
    expect(
      deskNavHref("/app", { period: "mtd", shot: true, hash: "mcfly-spend-add" }),
    ).toBe("/app?period=mtd&shot=1#mcfly-spend-add");
    expect(
      deskNavHrefFromSearch(
        "/app/goals",
        new URLSearchParams("period=ytd&host=abc&shop=x.myshopify.com"),
      ),
    ).toBe("/app/goals?period=ytd");
  });

  it("spend-add deep link stays the empty-opts default and can carry the clock", () => {
    expect(spendAddHref()).toBe(SPEND_ADD_HREF);
    expect(spendAddHref({ period: "lm" })).toBe(
      "/app/spend?period=lm#mcfly-spend-add",
    );
    expect(
      deskNavHref("/app/spend", {
        period: "mtd",
        extra: { date: "2026-09-01" },
        hash: "mcfly-spend-add",
      }),
    ).toBe("/app/spend?period=mtd&date=2026-09-01#mcfly-spend-add");
  });
});

describe("DESK_PRIMARY_NAV", () => {
  it("Shopify five, then spend tools, then Goals and Settings", () => {
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).toEqual([
      "Overview",
      "Customers",
      "Growth",
      "Orders",
      "LTV",
      "Spend Upload",
      "Total ROAS",
      "Channel Allocation",
      "YoY",
      "CPA",
      "Goals",
      "Settings",
    ]);
    expect(DESK_PRIMARY_NAV.map((item) => item.path)).toEqual([
      "/app",
      "/app/customers",
      "/app/growth",
      "/app/orders",
      "/app/ltv",
      "/app/spend",
      "/app/roas",
      "/app/allocation",
      "/app/yoy",
      "/app/cpa",
      "/app/goals",
      "/app/settings",
    ]);
    expect(DESK_PRIMARY_NAV.every((item) => !item.hash)).toBe(true);
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).not.toContain("Buyers");
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).not.toContain("Timing");
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).not.toContain(
      "Marketing",
    );
    expect(DESK_TOP_NAV.map((item) => item.label)).not.toContain("Settings");
    expect(DESK_SCOREBOARD_NAV.map((item) => item.label)).toEqual([
      "Overview",
      "CPA",
    ]);
    expect(DESK_RETAIN_NAV.map((item) => item.label)).toEqual([
      "Customers",
      "Growth",
      "Orders",
      "LTV",
    ]);
    expect(DESK_SPEND_NAV.map((item) => item.label)).toEqual([
      "Spend Upload",
      "Total ROAS",
      "Channel Allocation",
      "YoY",
      "Goals",
    ]);
    const grouped = [
      ...DESK_SCOREBOARD_NAV,
      ...DESK_RETAIN_NAV,
      ...DESK_SPEND_NAV,
    ].map((item) => item.path);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect(new Set(grouped)).toEqual(
      new Set(DESK_TOP_NAV.map((item) => item.path)),
    );
    expect(isDeskNavActive("/app", "/app")).toBe(true);
    expect(isDeskNavActive("/app", "/app/customers")).toBe(false);
    expect(isDeskNavActive("/app/customers", "/app/customers")).toBe(true);
    const shell = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../routes/app.tsx"),
      "utf8",
    );
    expect(shell).toContain("<s-app-nav>");
    expect(shell).toContain("<DeskTopTabs");
    const tabs = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../components/DeskTopTabs.tsx"),
      "utf8",
    );
    expect(tabs).toContain('label="Scoreboard"');
    expect(tabs).toContain('label="Retain"');
    expect(tabs).toContain('label="Spend plan"');
    expect(tabs).toContain("DESK_SCOREBOARD_NAV");
    expect(tabs).toContain("DESK_RETAIN_NAV");
  });

  it("puts spend tools on their own pages, not an Overview hash sitemap", () => {
    expect(DESK_OVERVIEW_TABS).toEqual([]);
  });

  it("Overview live chrome is shop, trust chips, YoY cards, then peeks + chart", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");
    expect(overview).toContain("mcfly-ctx__brand");
    expect(overview).not.toContain("<PeriodControl");
    expect(overview).toContain("<OverviewYoyCards");
    expect(overview).toContain("<OverviewFirstViewport");
    expect(overview).toContain("<OverviewSalesChart");
    expect(overview.indexOf("<OverviewYoyCards")).toBeLessThan(
      overview.indexOf("<OverviewFirstViewport"),
    );
    expect(overview).not.toContain("<DeskOverviewTabs");
    expect(overview).not.toContain("<DeskWindowRail");
    expect(overview).not.toContain("<SpendExplorer");
    expect(overview).toContain("const preset = requested");
    expect(overview).not.toContain("hideHero");
    expect(overview).not.toContain("<CashControlBoard");
    expect(overview).not.toContain("Same dates as Overview");
  });

  it("retired tool hashes land on Overview home", () => {
    expect(deskStageFromHash("")).toBe(DESK_SECTION.overview);
    expect(deskStageFromHash("#mcfly-ledger")).toBe(DESK_SECTION.overview);
    expect(deskStageFromHash("#mcfly-compare")).toBe(DESK_SECTION.overview);
    expect(deskStageFromHash("#mcfly-mix")).toBe(DESK_SECTION.overview);
    expect(deskStageFromHash("#mcfly-plan")).toBe(DESK_SECTION.overview);
    expect(deskStageFromHash("mcfly-orders")).toBe(DESK_SECTION.overview);
    expect(deskStageFromHash("#nope")).toBe(DESK_SECTION.overview);
    expect(isOverviewHomeStage(DESK_SECTION.overview)).toBe(true);
    expect(isOverviewHomeStage(DESK_SECTION.chart)).toBe(true);
    expect(isOverviewHomeStage(DESK_SECTION.ledger)).toBe(false);
    expect(deskStageHeading(DESK_SECTION.mix)).toBe("Overview");
    expect(deskStageHeading(DESK_SECTION.overview)).toBe("Overview");
  });

  it("keeps a helper for Overview section hashes", () => {
    const req = new Request("https://mcfly-analytics.fly.dev/app/orders?period=mtd");
    expect(overviewSectionLocation(req, DESK_SECTION.orders)).toBe(
      "/app?period=mtd#mcfly-orders",
    );
  });
});
