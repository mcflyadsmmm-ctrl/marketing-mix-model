import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");
const ltv = readFileSync(join(here, "../routes/app.ltv.tsx"), "utf8");
const connections = readFileSync(
  join(here, "../routes/app.connections.tsx"),
  "utf8",
);

describe("Overview / LTV tillLabel honesty", () => {
  it("Overview tillLabel is sales unavailable when salesError", () => {
    expect(overview).toContain("formatListingTillLabel");
    expect(overview).toMatch(/salesError:\s*Boolean\(salesError\)/);
    expect(overview).toContain("factsIncomplete");
    expect(overview).toContain("salesFactsIncompleteForDesk");
    expect(overview).toContain("salesFactsNeedSyncFill");
    expect(overview).toContain("sales-facts-honesty");
  });

  it("Overview scoreboardReady refuses salesError zeros", () => {
    expect(overview).toMatch(/salesDeskReady\s*=\s*!salesError/);
    expect(overview).toMatch(
      /scoreboardReady\s*=\s*!coldEmpty\s*&&\s*salesDeskReady/,
    );
  });

  it("LTV tillLabel refuses live when salesError", () => {
    expect(ltv).toContain("formatListingTillLabel");
    expect(ltv).toMatch(/salesError:\s*Boolean\(salesError\)/);
  });

  it("CAC delta uses tillLtv.newBuyers not facts newCustomers", () => {
    // Overview passes metrics.tillLtv into LtvSnapSection (local prop tillLtv).
    expect(overview).toMatch(/tillLtv=\{metrics\.tillLtv\}|metrics\.tillLtv\.newBuyers/);
    expect(overview).toContain("tillLtv.newBuyers");
    expect(ltv).toContain("metrics.tillLtv.newBuyers");
    expect(overview).not.toMatch(
      /cashCac[\s\S]{0,200}metrics\.newCustomers\s*>\s*0/,
    );
  });
});

describe("Connections CSV-first redirect", () => {
  it("connections route redirects to Spend (no OAuth UI)", () => {
    expect(connections).toContain('redirect("/app/spend")');
    expect(connections).toMatch(/RETIRED/);
    expect(connections).not.toContain("SAMPLE_DESK_CONNECT_BLOCK");
  });
});

describe("Close redirect (Monday Close UI retired)", () => {
  it("close route redirects to Home", () => {
    const close = readFileSync(join(here, "../routes/app.close.tsx"), "utf8");
    expect(close).toContain("RETIRED");
    expect(close).toMatch(/redirect\(target\)|redirect\("\/app"\)/);
    expect(close).toContain('"/app"');
  });
});

describe("Public Partner TOML requests read_all_orders", () => {
  it("declares the approved scope on the App Store configs", () => {
    const root = join(here, "../..");
    for (const name of ["shopify.app.toml", "shopify.app.public.toml"]) {
      const toml = readFileSync(join(root, name), "utf8");
      expect(toml).toMatch(
        /scopes\s*=\s*"read_orders,read_customers,read_all_orders"/,
      );
      expect(toml).not.toMatch(/omit until approved/);
    }
  });
});

describe("LTV copy after Partner-approved deep history", () => {
  it("does not tell merchants Shopify still needs to approve the scope", () => {
    expect(ltv).not.toMatch(/when Shopify approves broader order access/i);
    expect(overview).not.toMatch(/Order history is limited — open/);
  });

  it("offers a Partner-safe /auth grant CTA and gives LTV a sales-first teaching state", () => {
    expect(overview).toContain("DeepHistoryBanner");
    expect(ltv).toContain("DeepHistoryBanner");
    expect(overview).toContain("CASH_NOT_ATTRIBUTION");
    expect(ltv).toContain('aria-label="Lifetime value teaching state"');
    expect(ltv).toContain("ltvEmpty.heading");
    expect(ltv).toContain("ltvEmpty.body");
    expect(ltv).not.toContain("FirstTrustedRoasGate");
    expect(ltv).toContain("ltvCashCacTeaching");
    expect(ltv).not.toMatch(
      /!metrics\.onboarding\.hasSpend[\s\S]{0,120}"no_spend"/,
    );
  });

  it("does not render the leftover Overview brochure guide", () => {
    expect(overview).not.toContain("mcfly-guide__steps");
    expect(overview).not.toMatch(/Profit margin is optional for\s+break-even/);
  });

  it("hides untrusted 0.00 ROAS and kicks newest-first sales backfill on first open", () => {
    expect(overview).toContain("resolveTrustedRoasHero");
    expect(overview).toContain("FIRST_PAINT_SALES_BACKFILL_DAYS");
    expect(overview).toContain("enqueueSalesFactsBackfill");
    expect(overview).toContain("newestFirst: true");
    expect(overview).toContain("priorityRange: range");
    expect(overview).toContain("hideUntrustedZero");
    expect(overview).toContain("periodUncovered");
    expect(overview).toContain("pick_covered_period");
    expect(overview).toContain("salesFactsIncompleteForDesk");
    expect(overview).toContain("salesUntrustedZero");
    expect(overview).toContain("liveConfirmedZero");
    expect(overview).toContain("salesFactsNeedSyncFill");
    expect(overview).toContain("refreshExisting");
  });

  it("passes salesUntrustedZero into CashVerdict so a broken incomplete flag cannot hero Below BE", () => {
    const client = overview.split("export default function Dashboard")[1] ?? "";
    expect(client).toMatch(/<CashVerdict[\s\S]*salesUntrustedZero=\{salesUntrustedZero\}/);
    expect(client).toMatch(
      /salesFactsIncomplete=\{\s*factsIncompleteForTrust\s*\|\|\s*trustedHero\.hideUntrustedZero\s*\}/,
    );
  });

  it("never heros a numeric Total ROAS when live period spend is empty", () => {
    const client = overview.split("export default function Dashboard")[1] ?? "";
    expect(client).toContain("shouldHeroNumericRoas");
    expect(client).toContain("heroNumericRoas");
    expect(client).toMatch(/heroNumericRoas \? \(\s*<TotalRoasGauge/);
    expect(client).toMatch(/needs spend next to sales/);
    expect(client).toMatch(/not 0\.00×/);
  });

  it("passes spend and shopOrdersSeen into salesFactsIncompleteForDesk", () => {
    expect(overview).toMatch(/spend:\s*metrics\.totalSpend/);
    expect(overview).toMatch(/shopOrdersSeen/);
  });

  it("computes sales-fact honesty in the loader, not the Overview client", () => {
    // react-router build fails if the default export pulls sales-facts.server.
    const client = overview.split("export default function Dashboard")[1] ?? "";
    expect(overview).toContain("from \"../lib/sales-facts-honesty\"");
    expect(overview).toContain("factsIncompleteForHonesty");
    expect(client).toContain("factsIncomplete: factsIncompleteForHonesty");
    expect(client).not.toContain("salesFactsIncompleteForDesk(");
    expect(client).not.toContain("sales-facts.server");
  });

  it("enqueues sales backfill from Settings and Spend so first-session bounce still fills", () => {
    const settings = readFileSync(join(here, "../routes/app.settings.tsx"), "utf8");
    const spend = readFileSync(join(here, "../routes/app.spend.tsx"), "utf8");
    expect(settings).toContain("enqueueSalesFactsBackfill");
    expect(spend).toContain("enqueueSalesFactsBackfill");
    expect(settings).toMatch(/Optional — break-even/i);
    expect(spend).toContain("Step 1 of 2");
    expect(spend).toContain("/app?stay=1");
  });
});

describe("Primary nav always visible (Real store)", () => {
  it("lists later pages from deskNavItems — no cashReady maze", () => {
    const appShell = readFileSync(join(here, "../routes/app.tsx"), "utf8");
    expect(appShell).toContain("deskNavItems");
    expect(appShell).toContain("listingCaptureHref");
    expect(appShell).not.toContain("cashReady");
  });
});
