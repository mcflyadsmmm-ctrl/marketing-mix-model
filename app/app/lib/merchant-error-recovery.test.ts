import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  merchantRouteErrorCopy,
  routeErrorStatus,
  shouldDelegateShopifyBoundary,
} from "./merchant-error-recovery";

const here = dirname(fileURLToPath(import.meta.url));

describe("merchant route error copy", () => {
  it("treats 410 as a session reopen, not Handling response", () => {
    const copy = merchantRouteErrorCopy({ status: 410, data: "Handling response" });
    expect(copy.kind).toBe("session");
    expect(copy.title).toMatch(/Shopify Admin/i);
    expect(copy.body).not.toMatch(/Handling response/i);
    expect(copy.body).not.toMatch(/turbo-stream/i);
    expect(copy.body).not.toMatch(/Gone/i);
    expect(copy.supportHref).toBe("/support");
  });

  it("keeps generic failures calm and secret-free", () => {
    const copy = merchantRouteErrorCopy(new Error("ENOENT /var/task/.env"));
    expect(copy.kind).toBe("generic");
    expect(copy.body).not.toContain("ENOENT");
    expect(copy.body).not.toContain(".env");
    expect(copy.body).toMatch(/Refresh/i);
  });

  it("delegates only Shopify reauth, not 410", () => {
    expect(shouldDelegateShopifyBoundary({ status: 401 })).toBe(true);
    expect(shouldDelegateShopifyBoundary({ status: 410 })).toBe(false);
    expect(shouldDelegateShopifyBoundary(new Error("boom"))).toBe(false);
    expect(routeErrorStatus({ status: 410 })).toBe(410);
  });
});

describe("desk ErrorBoundary craft", () => {
  it("app shell paints merchant recovery instead of raw boundary.error", () => {
    const shell = readFileSync(join(here, "../routes/app.tsx"), "utf8");
    expect(shell).toContain("MerchantErrorRecovery");
    expect(shell).toContain("shouldDelegateShopifyBoundary");
    expect(shell).not.toMatch(
      /export function ErrorBoundary\(\) \{\s*return boundary\.error\(useRouteError\(\)\);/,
    );
  });

  it("root recovery never leaks Handling response", () => {
    const root = readFileSync(join(here, "../root.tsx"), "utf8");
    expect(root).toContain("MerchantErrorRecovery");
    expect(root).toContain("export function ErrorBoundary");
    expect(root).not.toContain("Handling response");
  });
});
