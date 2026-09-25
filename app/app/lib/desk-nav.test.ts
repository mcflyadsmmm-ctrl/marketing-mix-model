import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  DESK_OVERVIEW_TABS,
  DESK_PRIMARY_NAV,
  DESK_SECTION,
  DESK_IFRAME_NAV,
  DESK_TOP_NAV,
  compactDeskRedirect,
  deskNavHref,
  deskNavHrefFromSearch,
  deskStageFromHash,
  deskStageHeading,
  isDeskNavActive,
  isOverviewHomeStage,
  overviewSectionLocation,
} from "./desk-nav";
import {
  DESK_PANEL_RAIL_BY_ADMIN_PATH,
  deskPanelChipsForPath,
} from "./desk-panel-rail";
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
  it("locks three analysis tabs then Settings — Spend not Spend Upload", () => {
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).toEqual([
      "Orders",
      "Spend",
      "Goals",
      "Customers",
      "Settings",
    ]);
    expect(DESK_PRIMARY_NAV.map((item) => item.path)).toEqual([
      "/app",
      "/app/spend",
      "/app/goals",
      "/app/customers",
      "/app/settings",
    ]);
    expect(DESK_PRIMARY_NAV.every((item) => !item.hash)).toBe(true);
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).not.toContain("Buyers");
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).not.toContain("Timing");
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).not.toContain(
      "Marketing",
    );
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).not.toContain(
      "Spend Upload",
    );
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).not.toContain("Growth");
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).not.toContain("LTV");
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).not.toContain("CPA");
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).not.toContain("YoY");
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).not.toContain(
      "Channel Allocation",
    );
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).not.toContain(
      "Total ROAS",
    );
    expect(DESK_TOP_NAV.map((item) => item.label)).not.toContain("Settings");
    expect(DESK_TOP_NAV).toHaveLength(4);
    expect(DESK_IFRAME_NAV.map((item) => item.path)).toEqual(
      DESK_TOP_NAV.map((item) => item.path),
    );
    expect(DESK_IFRAME_NAV.map((item) => item.label)).toEqual([
      "Orders",
      "Spend",
      "Goals",
      "Customers",
    ]);
    expect(DESK_IFRAME_NAV[1]?.label).toBe("Spend");
    expect(isDeskNavActive("/app", "/app")).toBe(true);
    expect(isDeskNavActive("/app", "/app/customers")).toBe(false);
    expect(isDeskNavActive("/app/customers", "/app/customers")).toBe(true);
    expect(isDeskNavActive("/app", "/demo")).toBe(true);
    expect(isDeskNavActive("/app", "/demo/customers")).toBe(false);
    expect(isDeskNavActive("/app/customers", "/demo/customers")).toBe(true);
    const shell = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../routes/app.tsx"),
      "utf8",
    );
    expect(shell).toContain("<s-app-nav>");
    expect(shell).toContain("<DeskTopTabs");
    expect(shell).toContain("Orders, Spend, Goals, Customers, plus Settings");
    const tabs = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../components/DeskTopTabs.tsx"),
      "utf8",
    );
    expect(tabs).toContain("DESK_IFRAME_NAV");
    expect(tabs).not.toContain("<DeskPanelRail");
    expect(tabs).toContain('data-desk-tab={item.path}');
    expect(tabs).toContain('prefetch="intent"');
    expect(tabs).toContain("<Link");
    expect(tabs).toContain("mcfly-desk-tabs--pills");
    expect(tabs).not.toContain("scrollIntoView");
    expect(tabs).not.toContain("mcfly-desk-tabs__k");
    expect(tabs).not.toContain('label="Scoreboard"');
    expect(tabs).not.toContain('label="Retain"');
    expect(tabs).toContain('aria-current={active ? "page" : undefined}');
    const book = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../components/DeskBookPage.tsx"),
      "utf8",
    );
    expect(book).toContain("useSearchParams");
    expect(book).toContain("scrollIntoView({ block: \"start\" })");
    expect(book).toContain("mcfly-${panel}");
  });

  it("puts spend tools on their own pages, not an Overview hash sitemap", () => {
    expect(DESK_OVERVIEW_TABS).toEqual([]);
  });

  it("Overview live chrome is shop, trust chips, Mcfly peeks, then YoY + chart", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");
    expect(overview).toContain("mcfly-ctx__brand");
    expect(overview).not.toContain("<PeriodControl");
    expect(overview).toContain("<OverviewYoyCards");
    expect(overview).toContain("<OverviewFirstViewport");
    expect(overview).toContain("<OverviewSalesChart");
    expect(overview.indexOf("<OverviewFirstViewport")).toBeLessThan(
      overview.indexOf("<OverviewYoyCards"),
    );
    expect(overview).not.toContain("<DeskOverviewTabs");
    expect(overview).not.toContain("<DeskWindowRail");
    expect(overview).not.toContain("<SpendExplorer");
    expect(overview).toContain("const preset = requested");
    expect(overview).not.toContain("hideHero");
    expect(overview).not.toContain("<CashControlBoard");
    expect(overview).not.toContain("Same dates as Overview");
  });

  it("retired tool hashes open that tool, and Orders stays Orders", () => {
    expect(deskStageFromHash("")).toBe(DESK_SECTION.overview);
    expect(deskStageFromHash("#mcfly-ledger")).toBe(DESK_SECTION.ledger);
    expect(deskStageFromHash("#mcfly-compare")).toBe(DESK_SECTION.compare);
    expect(deskStageFromHash("#mcfly-mix")).toBe(DESK_SECTION.mix);
    expect(deskStageFromHash("#mcfly-plan")).toBe(DESK_SECTION.plan);
    expect(deskStageFromHash("mcfly-orders")).toBe(DESK_SECTION.overview);
    expect(deskStageFromHash("#nope")).toBe(DESK_SECTION.overview);
    expect(isOverviewHomeStage(DESK_SECTION.overview)).toBe(true);
    expect(isOverviewHomeStage(DESK_SECTION.chart)).toBe(true);
    expect(isOverviewHomeStage(DESK_SECTION.ledger)).toBe(false);
    expect(deskStageHeading(DESK_SECTION.compare)).toBe("Compare");
    expect(deskStageHeading(DESK_SECTION.ledger)).toBe("Ledger");
    expect(deskStageHeading(DESK_SECTION.mix)).toBe("Mix");
    expect(deskStageHeading(DESK_SECTION.plan)).toBe("Plan");
    expect(deskStageHeading(DESK_SECTION.overview)).toBe("Orders");
    expect(deskStageHeading(DESK_SECTION.orders)).toBe("Orders");
    expect(deskStageHeading(DESK_SECTION.ltv)).toBe("Orders");
    expect(deskStageHeading(DESK_SECTION.goals)).toBe("Orders");
  });

  it("keeps a helper for Overview section hashes", () => {
    const req = new Request("https://mcfly-analytics.fly.dev/app/orders?period=mtd");
    expect(overviewSectionLocation(req, DESK_SECTION.orders)).toBe(
      "/app?period=mtd#mcfly-orders",
    );
  });

  it("legacy Orders and Goals routes redirect off the top nav", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const orders = readFileSync(join(here, "../routes/app.orders.tsx"), "utf8");
    const goals = readFileSync(join(here, "../routes/app.goals.tsx"), "utf8");
    const demoOrders = readFileSync(
      join(here, "../routes/demo.orders.tsx"),
      "utf8",
    );
    const demoGoals = readFileSync(
      join(here, "../routes/demo.goals.tsx"),
      "utf8",
    );
    expect(orders).toMatch(/throw redirect\(`\$\{home\}/);
    expect(goals).toContain('name="targetMer"');
    expect(goals).not.toMatch(/throw redirect\(`\/app\/settings/);
    expect(demoOrders).toMatch(/throw redirect\(`\$\{home\}/);
    expect(demoGoals).toContain('name="targetMer"');
    expect(demoGoals).not.toMatch(/throw redirect/);
  });

  it("compactDeskRedirect keeps search params, sets panel, and maps /demo", () => {
    const admin = new Request(
      "https://mcfly-analytics.fly.dev/app/growth?period=mtd&shot=1",
    );
    expect(compactDeskRedirect(admin, "/app/customers", "growth")).toBe(
      "/app/customers?period=mtd&shot=1&panel=growth",
    );
    const demo = new Request(
      "https://mcfly-analytics.fly.dev/demo/roas?period=ytd",
    );
    expect(compactDeskRedirect(demo, "/app/spend", "roas")).toBe(
      "/demo/spend?period=ytd&panel=roas",
    );
    const overwrite = new Request(
      "https://mcfly-analytics.fly.dev/app/cpa?panel=old",
    );
    expect(compactDeskRedirect(overwrite, "/app/spend", "cpa")).toBe(
      "/app/spend?panel=cpa",
    );
  });
});

describe("DeskPanelRail map", () => {
  it("maps analysis paths to chips and omits Overview + Goals", () => {
    expect(DESK_PANEL_RAIL_BY_ADMIN_PATH["/app"]).toEqual([]);
    expect(deskPanelChipsForPath("/app")).toEqual([]);
    expect(deskPanelChipsForPath("/demo")).toEqual([]);
    expect(
      deskPanelChipsForPath("/app/orders").map((c) => c.panel),
    ).toEqual(["typical", "clock", "timing"]);
    expect(
      deskPanelChipsForPath("/demo/customers").map((c) => c.panel),
    ).toEqual(["returning", "ltv", "growth", "depth"]);
    expect(
      deskPanelChipsForPath("/app/spend").map((c) => c.panel),
    ).toEqual(["roas", "explorer", "mix", "cpa", "spend-add"]);
    expect(deskPanelChipsForPath("/app/goals")).toEqual([]);
    expect(deskPanelChipsForPath("/demo/settings")).toEqual([]);
  });
});
