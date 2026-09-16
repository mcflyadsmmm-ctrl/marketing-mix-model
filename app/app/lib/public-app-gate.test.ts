import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

describe("public app gate on Spend", () => {
  it("Spend loaders use requireAdmin so a bare /app/spend never 410s", () => {
    const spend = readFileSync(join(here, "../routes/app.spend.tsx"), "utf8");
    const spendImport = readFileSync(
      join(here, "../routes/app.spend.import.tsx"),
      "utf8",
    );
    expect(spend).toContain("requireAdmin");
    expect(spend).not.toContain("authenticate.admin");
    expect(spend).toContain("DeskRouteErrorBoundary");
    expect(spend).toContain('retryHref="/app/spend"');
    expect(spendImport).toContain("requireAdmin");
    expect(spendImport).not.toContain("authenticate.admin");
    expect(spendImport).toContain('retryHref="/app/spend/import"');
  });

  it("spend-handoff pages use requireAdmin and page-level Retry", () => {
    for (const [rel, retry] of [
      ["../routes/app.roas.tsx", "/app/roas"],
      ["../routes/app.allocation.tsx", "/app/allocation"],
      ["../routes/app.settings.tsx", "/app/settings"],
    ] as const) {
      const src = readFileSync(join(here, rel), "utf8");
      expect(src, rel).toContain("requireAdmin");
      expect(src, rel).not.toContain("authenticate.admin");
      expect(src, rel).toContain("DeskRouteErrorBoundary");
      expect(src, rel).toContain(`retryHref="${retry}"`);
    }
    const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");
    expect(overview).toContain("DeskRouteErrorBoundary");
    expect(overview).toContain('retryHref="/app"');
    expect(overview).toContain("PUBLIC_APP_STUB");
    expect(overview).toContain("isGoneResponse");
  });

  it("rewrites data-request 410s so turbo-stream never paints Handling response", () => {
    const shopifyServer = readFileSync(join(here, "../shopify.server.ts"), "utf8");
    expect(shopifyServer).toContain("SESSION_RECOVERY_DATA");
    expect(shopifyServer).toContain("isReactRouterDataRequest");
    expect(shopifyServer).toMatch(/throw data\(SESSION_RECOVERY_DATA/);
    expect(shopifyServer).not.toMatch(
      /if \(isGoneResponse\(error\) && !isReactRouterDataRequest\(request\)\)/,
    );
  });
});
