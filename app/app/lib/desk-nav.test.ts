import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  DESK_OVERVIEW_TABS,
  DESK_PRIMARY_NAV,
  DESK_SECTION,
  deskNavHref,
  deskNavHrefFromSearch,
  deskStageFromHash,
  deskStageHeading,
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
  it("is Shopify five, then Spend Upload, then Settings", () => {
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).toEqual([
      "Overview",
      "Customers",
      "Growth",
      "Orders",
      "LTV",
      "Spend Upload",
      "Settings",
    ]);
    expect(DESK_PRIMARY_NAV.map((item) => item.path)).toEqual([
      "/app",
      "/app/customers",
      "/app/growth",
      "/app/orders",
      "/app/ltv",
      "/app/spend",
      "/app/settings",
    ]);
    expect(DESK_PRIMARY_NAV.every((item) => !item.hash)).toBe(true);
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).not.toContain("Buyers");
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).not.toContain("Timing");
    expect(DESK_PRIMARY_NAV.map((item) => item.label)).not.toContain(
      "Marketing",
    );
  });

  it("puts spend tools on Marketing, not an Overview hash sitemap", () => {
    expect(DESK_OVERVIEW_TABS).toEqual([]);
  });

  it("Overview live chrome is as-of + share above YoY sales cards", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");
    const tabs = readFileSync(
      join(here, "../components/DeskOverviewTabs.tsx"),
      "utf8",
    );
    expect(tabs).toContain("mcfly-desk-chrome");
    expect(overview).toContain("<DeskOverviewTabs");
    expect(overview).toContain("<OverviewYoyCards");
    expect(overview).not.toContain("<DeskWindowRail");
    expect(overview).not.toContain("<SpendExplorer");
    expect(overview).toContain('preset = shotMode ? requested : "mtd"');
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
