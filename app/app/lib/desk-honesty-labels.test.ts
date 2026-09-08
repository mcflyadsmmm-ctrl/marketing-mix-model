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
  });

  it("Overview scoreboardReady refuses salesError zeros", () => {
    expect(overview).toMatch(
      /scoreboardReady\s*=\s*[\s\S]*!salesError/,
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
});

describe("Primary nav always visible (Real store)", () => {
  it("does not gate Goals/Allocation/LTV/Advanced on cashReady", () => {
    const appShell = readFileSync(join(here, "../routes/app.tsx"), "utf8");
    expect(appShell).toContain('listingCaptureHref("/app/goals"');
    expect(appShell).toContain('listingCaptureHref("/app/allocation"');
    expect(appShell).toContain('listingCaptureHref("/app/ltv"');
    expect(appShell).toContain('listingCaptureHref("/app/advanced"');
    expect(appShell).not.toContain("cashReady");
  });
});
