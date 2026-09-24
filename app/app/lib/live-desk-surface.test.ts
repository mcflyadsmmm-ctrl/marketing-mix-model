import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  customersLivePageDecision,
  customersStageLockedPath,
  deskNavLabel,
  liveDeskNavState,
  liveDeskPanelChips,
  liveDeskSurfaceOpen,
} from "./live-desk-surface";
import { DESK_PRIMARY_NAV } from "./desk-nav";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

function readRepo(rel: string) {
  return readFileSync(join(repoRoot, rel), "utf8");
}

describe("live desk stage gate", () => {
  it("critic: overview_orders does not open Live customers, growth, or ltv", () => {
    const decision = customersLivePageDecision({
      sampleDesk: false,
      stage: "overview_orders",
    });
    expect(decision.serve).toBe("locked");
    if (decision.serve !== "locked") return;
    expect(decision.copy).toMatch(/locked/i);
    expect(decision.copy).toMatch(/not \$0/);
    expect(decision.copy).not.toMatch(/\$0 returning/);

    expect(
      liveDeskSurfaceOpen({
        sampleDesk: false,
        stage: "overview_orders",
        surface: "overview",
      }),
    ).toBe(true);
    expect(
      liveDeskSurfaceOpen({
        sampleDesk: false,
        stage: "overview_orders",
        surface: "orders",
      }),
    ).toBe(true);
    for (const surface of ["customers", "growth", "ltv"] as const) {
      expect(
        liveDeskSurfaceOpen({
          sampleDesk: false,
          stage: "overview_orders",
          surface,
        }),
      ).toBe(false);
    }

    const nav = liveDeskNavState({
      sampleDesk: false,
      stage: "overview_orders",
    });
    expect(nav.customersLocked).toBe(true);
    expect(nav.growthLocked).toBe(true);
    expect(nav.ltvLocked).toBe(true);
    expect(deskNavLabel({ path: "/app", label: "Home" }, nav)).toBe("Home");
    expect(
      deskNavLabel({ path: "/app/customers", label: "Customers" }, nav),
    ).toBe("Customers · locked");
    expect(deskNavLabel({ path: "/app/spend", label: "Spend" }, nav)).toBe(
      "Spend",
    );
    expect(liveDeskPanelChips("/app/customers", nav)).toEqual([]);
    expect(liveDeskPanelChips("/app", nav).map((chip) => chip.label)).not.toContain(
      "Returning",
    );
  });

  it("keeps SAMPLE chrome open when the freeze parks the stage", () => {
    const decision = customersLivePageDecision({
      sampleDesk: true,
      stage: "parked",
    });
    expect(decision).toMatchObject({
      serve: "open",
      sampleDesk: true,
      ltvOpen: true,
      growthOpen: true,
    });
    const nav = liveDeskNavState({ sampleDesk: true, stage: "parked" });
    expect(nav.customersLocked).toBe(false);
    expect(nav.ltvLocked).toBe(false);
    expect(
      deskNavLabel(
        DESK_PRIMARY_NAV.find((item) => item.path === "/app/customers")!,
        nav,
      ),
    ).toBe("Customers");
    expect(liveDeskPanelChips("/app/customers", nav).map((chip) => chip.label)).toEqual(
      ["Returning", "LTV", "Growth", "Depth"],
    );
  });

  it("opens customers and growth at the customers rung and keeps LTV locked", () => {
    const decision = customersLivePageDecision({
      sampleDesk: false,
      stage: "customers",
    });
    expect(decision).toMatchObject({
      serve: "open",
      sampleDesk: false,
      ltvOpen: false,
      growthOpen: true,
    });
    const nav = liveDeskNavState({ sampleDesk: false, stage: "customers" });
    expect(nav.customersLocked).toBe(false);
    expect(nav.growthLocked).toBe(false);
    expect(nav.ltvLocked).toBe(true);
    const chips = liveDeskPanelChips("/app/customers", nav);
    expect(chips.find((chip) => chip.panel === "ltv")).toMatchObject({
      label: "LTV · locked",
      locked: true,
    });
    expect(chips.find((chip) => chip.panel === "growth")?.locked).toBe(false);
    expect(chips.find((chip) => chip.panel === "returning")?.locked).toBe(false);
  });

  it("opens every customers rung at ltv without writing that stage into git", () => {
    const decision = customersLivePageDecision({
      sampleDesk: false,
      stage: "ltv",
    });
    expect(decision).toMatchObject({
      serve: "open",
      ltvOpen: true,
      growthOpen: true,
    });
    const fly = readRepo("fly.toml");
    expect(fly).toMatch(/MCFLY_LIVE_STAGE\s*=\s*"parked"/);
    expect(fly).not.toMatch(/MCFLY_LIVE_STAGE\s*=\s*"ltv"/);
    expect(fly).toMatch(/MCFLY_SAMPLE_ONLY\s*=\s*"true"/);
  });

  it("drops panel when Growth or LTV redirect onto a locked Customers page", () => {
    const request = new Request(
      "https://mcfly.test/app/growth?period=mtd&panel=growth&host=abc",
    );
    expect(customersStageLockedPath(request)).toBe(
      "/app/customers?period=mtd&host=abc",
    );
  });

  it("/app/customers loader: gate closed → locked page, no stack read", () => {
    const customers = read("../routes/app.customers.tsx");
    const loaderStart = customers.indexOf("export const loader");
    const loaderEnd = customers.indexOf("export default function");
    const loaderSrc = customers.slice(loaderStart, loaderEnd);
    expect(loaderSrc.indexOf("customersLivePageDecision")).toBeGreaterThan(-1);
    expect(loaderSrc.indexOf("customersLivePageDecision")).toBeLessThan(
      loaderSrc.indexOf("loadCustomersStackPage"),
    );
    expect(loaderSrc).toContain('serve === "locked"');
    expect(loaderSrc).not.toMatch(
      /serve === "locked"[\s\S]*loadCustomersStackPage[\s\S]*serve === "locked"/,
    );
    expect(customers.indexOf('data.kind === "locked"')).toBeLessThan(
      customers.indexOf("<CustomersFirstViewport"),
    );
    expect(customers.indexOf("<LiveDeskLockedPage")).toBeLessThan(
      customers.indexOf("<CustomersFirstViewport"),
    );
    expect(
      customersLivePageDecision({
        sampleDesk: false,
        stage: "overview_orders",
      }).serve,
    ).toBe("locked");
  });

  it("/app/growth loader: gate closed → locked customers redirect, no stack read", () => {
    const growth = read("../routes/app.growth.tsx");
    const growthLoader = growth.slice(growth.indexOf("export const loader"));
    expect(growthLoader.indexOf("customersLivePageDecision")).toBeLessThan(
      growthLoader.indexOf("customersStageLockedPath"),
    );
    expect(growthLoader.indexOf("customersStageLockedPath")).toBeLessThan(
      growthLoader.indexOf("customersPanelRedirectPath"),
    );
    expect(growthLoader).toContain("!decision.growthOpen");
    expect(growth).not.toContain("loadCustomersStackPage");
    expect(growth).not.toContain("loadCustomerAnalytics");
    expect(growth).not.toContain("loadGrowthComeback");
    expect(growth).not.toContain("loadLtvDepth");
  });

  it("/app/ltv loader: gate closed → locked customers redirect, no stack read", () => {
    const ltv = read("../routes/app.ltv.tsx");
    const ltvLoader = ltv.slice(ltv.indexOf("export const loader"));
    expect(ltvLoader.indexOf("customersLivePageDecision")).toBeLessThan(
      ltvLoader.indexOf("customersStageLockedPath"),
    );
    expect(ltvLoader.indexOf("customersStageLockedPath")).toBeLessThan(
      ltvLoader.indexOf("customersPanelRedirectPath"),
    );
    expect(ltvLoader).toContain("!decision.ltvOpen");
    expect(ltv).not.toContain("loadCustomersStackPage");
    expect(ltv).not.toContain("loadCustomerAnalytics");
    expect(ltv).not.toContain("loadGrowthComeback");
    expect(ltv).not.toContain("loadLtvDepth");
  });

  it("wires nav and route loaders so /app/customers cannot paint Live chrome while locked", () => {
    const customers = read("../routes/app.customers.tsx");
    const loaderStart = customers.indexOf("export const loader");
    const loaderEnd = customers.indexOf("export default function");
    const loaderSrc = customers.slice(loaderStart, loaderEnd);
    expect(loaderSrc.indexOf("customersLivePageDecision")).toBeGreaterThan(-1);
    expect(loaderSrc.indexOf("customersLivePageDecision")).toBeLessThan(
      loaderSrc.indexOf("loadCustomersStackPage"),
    );
    expect(loaderSrc).toContain('serve === "locked"');
    expect(loaderSrc).toContain("includeLtv: decision.ltvOpen");
    expect(customers.indexOf('data.kind === "locked"')).toBeLessThan(
      customers.indexOf("<CustomersFirstViewport"),
    );
    expect(customers.indexOf("<LiveDeskLockedPage")).toBeLessThan(
      customers.indexOf("<CustomersFirstViewport"),
    );
    expect(customers).toContain('surface="customers"');
    expect(customers).toContain('surface="ltv"');
    expect(customers).toContain('surface="growth"');
    expect(customers).toContain("liveDeskLockedCopy");

    const lockedPage = read("../components/LiveDeskLockedPage.tsx");
    expect(lockedPage).toContain("data-live-desk-lock");
    expect(lockedPage).not.toContain("CustomersFirstViewport");
    expect(lockedPage).not.toContain("CustomerWhale");
    expect(lockedPage).not.toContain("formatCurrency");
    expect(lockedPage).not.toContain("loadLtvDepth");

    const stack = read("./desk-customers-stack.server.ts");
    const ltvCall = stack.indexOf("includeLtv\n        ? loadLtvDepth");
    expect(ltvCall).toBeGreaterThan(-1);
    expect(stack.indexOf("loadLtvDepth({", ltvCall)).toBeGreaterThan(ltvCall);

    const shell = read("../routes/app.tsx");
    expect(shell).toContain("liveDeskNavState");
    expect(shell).toContain("deskNavLabel");
    expect(shell).toContain("<DataModeBar");
    expect(shell).toContain("liveDeskNav={liveDeskNav}");
    const tabs = read("../components/DeskTopTabs.tsx");
    expect(tabs).toContain("deskNavLabel");
    expect(read("./live-desk-surface.ts")).toContain("Customers · locked");
    expect(tabs).toContain('data-live-desk-lock={locked ? "customers" : undefined}');
    expect(tabs).toContain("<DeskPanelRail");
    const rail = read("../components/DeskPanelRail.tsx");
    expect(rail).toContain("liveDeskPanelChips");

    const growth = read("../routes/app.growth.tsx");
    const growthLoader = growth.slice(growth.indexOf("export const loader"));
    expect(growthLoader.indexOf("customersLivePageDecision")).toBeLessThan(
      growthLoader.indexOf("customersPanelRedirectPath"),
    );
    expect(growthLoader.indexOf("customersStageLockedPath")).toBeLessThan(
      growthLoader.indexOf("customersPanelRedirectPath"),
    );
    const ltv = read("../routes/app.ltv.tsx");
    const ltvLoader = ltv.slice(ltv.indexOf("export const loader"));
    expect(ltvLoader.indexOf("customersLivePageDecision")).toBeLessThan(
      ltvLoader.indexOf("customersPanelRedirectPath"),
    );
    expect(ltvLoader).toContain("!decision.ltvOpen");
    expect(ltvLoader.indexOf("customersStageLockedPath")).toBeLessThan(
      ltvLoader.indexOf("customersPanelRedirectPath"),
    );

    const orders = read("../routes/app.orders.tsx");
    const overview = read("../routes/app._index.tsx");
    expect(orders).toContain("throw redirect");
    expect(orders).not.toContain("LiveDeskLockedPage");
    expect(overview).not.toContain("LiveDeskLockedPage");
    expect(overview).toContain("<OverviewFirstViewport");

    const checklist = readRepo("docs/ops/LIVE_UNPARK_CHECKLIST.md");
    expect(checklist).toContain("liveDeskTabAllowed");
    expect(checklist).toContain("locked empty");
    expect(checklist).toContain("Do not set stage to `ltv` in git");
  });
});
