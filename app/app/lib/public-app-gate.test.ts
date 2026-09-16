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
