import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");
const ltvSnap = readFileSync(
  join(here, "../components/LtvSnapSection.tsx"),
  "utf8",
);
const ltv = readFileSync(join(here, "../routes/app.ltv.tsx"), "utf8");
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
    expect(overview).toContain("factsIncompleteSuffix");
  });

  it("Overview scoreboardReady refuses salesError zeros", () => {
    expect(overview).toMatch(
      /scoreboardReady\s*=\s*[\s\S]*!salesError/,
    );
  });

  it("LTV tillLabel refuses live when salesError", () => {
    expect(ltv).toContain("sales unavailable");
    expect(ltv).toMatch(/salesError[\s\S]*sales unavailable[\s\S]*live sales/);
  });

  it("CAC delta uses tillLtv.newBuyers not facts newCustomers", () => {
    const buyers = readFileSync(join(here, "../routes/app.buyers.tsx"), "utf8");
    expect(buyers).toMatch(/tillLtv=\{metrics\.tillLtv\}/);
    expect(ltvSnap).toContain("tillLtv.newBuyers");
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

describe("Primary nav always visible (Real store)", () => {
  it("does not gate Goals on cashReady — sales tabs always show", () => {
    const appShell = readFileSync(join(here, "../routes/app.tsx"), "utf8");
    expect(appShell).toContain("DESK_PRIMARY_NAV");
    expect(appShell).not.toContain("cashReady");
    expect(appShell).not.toContain('deskNavHrefFromSearch("/app/allocation"');
    expect(appShell).not.toContain('deskNavHrefFromSearch("/app/advanced"');
  });
});
