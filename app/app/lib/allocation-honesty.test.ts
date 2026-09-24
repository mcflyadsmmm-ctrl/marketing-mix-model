import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(join(here, rel), "utf8");

const redirect = read("../routes/app.allocation.tsx");
const stack = read("./desk-spend-stack.server.ts");
const mix = read("../components/SpendMixSection.tsx");
const spend = read("../routes/app.spend.tsx");

describe("Allocation desk sales honesty", () => {
  it("keeps Allocation on /app/allocation", () => {
    expect(redirect).toContain("spendLoader");
    expect(redirect).toContain('retryHref="/app/allocation"');
    expect(redirect).not.toContain("throw redirect");
    expect(spend).toContain('requestScreen === "allocation"');
    expect(spend).toContain("<SpendMixSection");
    expect(mix).toContain('id="mcfly-mix"');
  });

  it("wires facts coverage into CashTrustBanners like Overview (server-side)", () => {
    expect(stack).toContain("factsIncomplete = salesFactsBlockLock(coverage)");
    expect(mix).toContain("salesFactsIncomplete={salesFactsIncomplete}");
    expect(mix).toContain(
      "shopifyOrderWindowLimited={shopifyOrderWindowLimited}",
    );
    expect(stack).toContain("periodExceedsFactWindow");
  });

  it("does not label error or incomplete facts as live sales", () => {
    expect(stack).toContain("salesError");
    expect(mix).toContain("salesError");
    expect(mix).toContain("CashTrustBanners");
    expect(mix).not.toMatch(/live sales · up to 24 months/);
  });

  it("suppresses allocation suggestion when salesError", () => {
    expect(mix).toContain("salesError ? null : metrics.allocation");
  });

  it("keeps the Sample data path distinct from live sales", () => {
    expect(stack).toContain("useSampleDesk");
    expect(spend).toContain("useSampleDesk");
    expect(spend).toContain("mcfly-desk--sample");
  });

  it("paints mix, best windows, and recent pace — not a pamphlet", () => {
    expect(mix).toContain("Where the money went");
    expect(mix).toContain("Best windows");
    expect(mix).toContain("Recent pace");
    expect(mix).toContain("selectWindowsForGrain");
    expect(mix).toContain("defaultWindowGrain");
    expect(mix).toContain("windowGrainLabel");
    expect(mix).toContain("spend share, not channel ROAS");
  });

  it("keeps mix focused — explorer stays on the Spend explorer fold", () => {
    expect(mix).not.toContain("SpendExplorer");
    expect(mix).toContain("<SpendMixPlan");
    expect(spend).toContain("<SpendExplorer");
  });

  it("contrasts entered spend mix with Shopify Analytics attribution", () => {
    expect(mix).toMatch(/Shopify Analytics/);
    expect(mix).toMatch(/attribution/i);
    expect(mix).toMatch(/entered spend mix/i);
    expect(mix).toMatch(/daily cap/i);
  });

  it("keeps lock copy on Spend, not Marketing", () => {
    const lockStart = mix.indexOf("const lockCopy");
    const lockEnd = mix.indexOf("const channelRows");
    expect(lockStart).toBeGreaterThan(-1);
    expect(lockEnd).toBeGreaterThan(lockStart);
    const lockCopy = mix.slice(lockStart, lockEnd);
    expect(lockCopy).toMatch(/\bSpend\b/);
    expect(lockCopy).not.toMatch(/\bMarketing\b/);
  });

  it("empty spend points below and never fakes a mix", () => {
    expect(mix).toContain("No channel spend");
    expect(mix).toMatch(/Add (it|spend) below/i);
    expect(mix).not.toMatch(/\bMarketing\b/);
    expect(mix).not.toMatch(/0×/);
  });

  it("moves the Marketing mix controls into the allocation plan", () => {
    const marketingSpendRoom = read("../components/MarketingSpendRoom.tsx");
    const spendMixPlan = read("../components/SpendMixPlan.tsx");

    expect(marketingSpendRoom).not.toContain("MIX_WINDOWS");
    expect(spendMixPlan).toContain("MIX_WINDOWS");
    expect(spendMixPlan).toContain("Daily spend cap for remaining days");
  });
});
