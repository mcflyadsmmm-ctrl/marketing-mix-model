import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  decorateShopifyBoundaryError,
  merchantRouteErrorCopy,
  routeErrorStatus,
  shopifyAdminHref,
  shopifyErrorResponseLooksEmpty,
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
    expect(copy.retryLabel).toBe("Retry");
    expect(copy.adminLabel).toBe("Open Shopify Admin");
    expect(copy.supportHref).toBe("/support");
  });

  it("keeps generic failures calm and secret-free", () => {
    const copy = merchantRouteErrorCopy(new Error("ENOENT /var/task/.env"));
    expect(copy.kind).toBe("generic");
    expect(copy.body).not.toContain("ENOENT");
    expect(copy.body).not.toContain(".env");
    expect(copy.retryLabel).toBe("Retry");
    expect(copy.adminLabel).toBe("Open Shopify Admin");
  });

  it("delegates only Shopify reauth, not 410 even with reauth headers", () => {
    expect(shouldDelegateShopifyBoundary({ status: 401 })).toBe(true);
    expect(shouldDelegateShopifyBoundary({ status: 410 })).toBe(false);
    expect(
      shouldDelegateShopifyBoundary({
        status: 410,
        headers: new Headers({
          "X-Shopify-Retry-Invalid-Session-Request": "1",
        }),
      }),
    ).toBe(false);
    expect(shouldDelegateShopifyBoundary(new Error("boom"))).toBe(false);
    expect(routeErrorStatus({ status: 410 })).toBe(410);
  });

  it("builds a top-frame Admin URL from a shop domain", () => {
    expect(shopifyAdminHref("devmcflyads.myshopify.com")).toBe(
      "https://admin.shopify.com/store/devmcflyads",
    );
    expect(shopifyAdminHref(null)).toBe("https://admin.shopify.com");
    expect(shopifyAdminHref("https://evil.example")).toBe(
      "https://admin.shopify.com",
    );
  });

  it("treats empty ErrorResponse data as Handling response leakage", () => {
    expect(shopifyErrorResponseLooksEmpty({ status: 401 })).toBe(true);
    expect(shopifyErrorResponseLooksEmpty({ status: 401, data: "" })).toBe(true);
    expect(
      shopifyErrorResponseLooksEmpty({ status: 401, data: "Handling response" }),
    ).toBe(true);
    expect(shopifyErrorResponseLooksEmpty({ status: 401, data: {} })).toBe(true);
    expect(
      shopifyErrorResponseLooksEmpty({
        status: 401,
        data: "Open Mcfly Analytics from Shopify Admin",
      }),
    ).toBe(false);
    const decorated = decorateShopifyBoundaryError({
      status: 401,
      data: "Handling response",
    }) as { data: string };
    expect(decorated.data).not.toMatch(/Handling response/i);
    expect(decorated.data).toMatch(/Shopify Admin/i);
  });
});

describe("desk ErrorBoundary craft", () => {
  it("app shell paints merchant recovery instead of raw boundary.error", () => {
    const shell = readFileSync(join(here, "../routes/app.tsx"), "utf8");
    expect(shell).toContain("MerchantErrorRecovery");
    expect(shell).toContain("shouldDelegateShopifyBoundary");
    expect(shell).toContain("decorateShopifyBoundaryError");
    expect(shell).not.toMatch(
      /export function ErrorBoundary\(\) \{\s*return boundary\.error\(useRouteError\(\)\);/,
    );
  });

  it("book pages keep chrome with a page-level recovery", () => {
    const book = readFileSync(
      join(here, "../components/DeskRouteErrorBoundary.tsx"),
      "utf8",
    );
    expect(book).toContain("decorateShopifyBoundaryError");
    expect(book).toContain("MerchantErrorRecovery");
    for (const rel of [
      "../routes/app.customers.tsx",
      "../routes/app.growth.tsx",
      "../routes/app.orders.tsx",
      "../routes/app.ltv.tsx",
      "../routes/app.yoy.tsx",
      "../routes/app.cpa.tsx",
      "../routes/app.goals.tsx",
      "../routes/app.spend.tsx",
    ]) {
      const src = readFileSync(join(here, rel), "utf8");
      expect(src, rel).toContain("DeskRouteErrorBoundary");
      expect(src, rel).toContain("export function ErrorBoundary");
    }
  });

  it("root recovery never leaks Handling response", () => {
    const root = readFileSync(join(here, "../root.tsx"), "utf8");
    expect(root).toContain("MerchantErrorRecovery");
    expect(root).toContain("export function ErrorBoundary");
    expect(root).not.toContain("Handling response");
  });

  it("recovery actions are Retry and Open Shopify Admin, never Handling response", () => {
    const recovery = readFileSync(
      join(here, "../components/MerchantErrorRecovery.tsx"),
      "utf8",
    );
    expect(recovery).toContain("copy.retryLabel");
    expect(recovery).toContain("copy.adminLabel");
    expect(recovery).toContain('target="_top"');
    expect(recovery).toContain("shopifyAdminHref");
    expect(recovery).not.toContain("Handling response");
    const shell = readFileSync(join(here, "../routes/app.tsx"), "utf8");
    expect(shell).toContain("MerchantErrorRecovery");
    expect(shell).toContain("data.kind === \"public\"");
    expect(shell).not.toContain("This is the app host");
  });
});
