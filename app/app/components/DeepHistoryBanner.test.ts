import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "DeepHistoryBanner.tsx"), "utf8");
const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");
const ltv = readFileSync(join(here, "../routes/app.ltv.tsx"), "utf8");
const settings = readFileSync(join(here, "../routes/app.settings.tsx"), "utf8");
const auth = readFileSync(join(here, "../routes/auth.$.tsx"), "utf8");

describe("DeepHistoryBanner", () => {
  it("wires the existing /auth grant path with a top-level Shopify prompt", () => {
    expect(source).toContain("deepHistoryGrantHref");
    expect(source).toContain("DEEP_HISTORY_GRANT_COPY");
    expect(source).toContain('target="_top"');
    expect(source).toContain("DEEP_HISTORY_GRANT_COPY.cta");
    expect(source).not.toMatch(/oauth\/authorize|client_id=/);
  });
});

describe("Deep history grant surfaces", () => {
  it("shows the grant banner on Overview, LTV, and Settings", () => {
    expect(overview).toContain("DeepHistoryBanner");
    expect(ltv).toContain("DeepHistoryBanner");
    expect(settings).toContain("DeepHistoryBanner");
    expect(overview).toContain("hasReadAllOrders");
    expect(ltv).toContain("hasReadAllOrders");
  });

  it("re-kicks deep backfill on the existing /auth callback after grant", () => {
    expect(auth).toContain("applyReadAllOrdersGrant");
    expect(auth).toContain("session.scope");
    expect(auth).toContain("runSalesFactsBackfill");
    expect(auth).toContain("runOrderFactsBackfill");
  });
});
