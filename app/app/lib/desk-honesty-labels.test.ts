import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");
const customers = readFileSync(join(here, "../routes/app.customers.tsx"), "utf8");
const ltvSection = readFileSync(
  join(here, "../components/CustomersLtvSection.tsx"),
  "utf8",
);
const history = readFileSync(join(here, "./desk-history.ts"), "utf8");
const connections = readFileSync(
  join(here, "../routes/app.connections.tsx"),
  "utf8",
);

describe("Overview / LTV tillLabel honesty", () => {
  it("Overview tillLabel is sales unavailable when salesError", () => {
    expect(overview).toContain("sales unavailable");
    expect(overview).toMatch(
      /salesError[\s\S]*sales unavailable[\s\S]*live sales/,
    );
    expect(overview).toContain("OVERVIEW_PENDING_ASOF");
    expect(overview).toContain("salesPending: greetingPending");
    expect(overview).not.toContain("factsIncompleteSuffix");
  });

  it("Overview scoreboardReady refuses salesError zeros", () => {
    expect(overview).toMatch(
      /scoreboardReady\s*=\s*[\s\S]*!salesError/,
    );
  });

  it("LTV tillLabel refuses live when salesError", () => {
    expect(customers).toContain("deskPeriodTillLabel");
    expect(customers).toContain("salesError");
    expect(history).toContain("sales unavailable");
    expect(history).toMatch(/salesError[\s\S]*sales unavailable[\s\S]*live sales/);
  });

  it("LTV route uses tillLtv.newBuyers rather than facts newCustomers", () => {
    expect(ltvSection).toContain("const ltv = metrics.tillLtv");
    expect(ltvSection).toContain("metrics.tillLtv.newBuyers");
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

describe("Primary nav always visible (Real store)", () => {
  it("does not gate Goals on cashReady — sales tabs always show", () => {
    const appShell = readFileSync(join(here, "../routes/app.tsx"), "utf8");
    expect(appShell).toContain("DESK_PRIMARY_NAV");
    expect(appShell).not.toContain("cashReady");
    expect(appShell).not.toContain('deskNavHrefFromSearch("/app/allocation"');
    expect(appShell).not.toContain('deskNavHrefFromSearch("/app/advanced"');
  });
});
