import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  embeddedAppRedirectLocation,
  hasShopifySessionContext,
  isShopifyAppPath,
  isShopifyEmbeddedSearch,
  shouldSkipMarketingSite,
} from "../../scripts/shopify-app-path.mjs";

describe("Shopify embedded entry vs marketing site", () => {
  it("does not treat public / as an app path", () => {
    expect(isShopifyAppPath("/")).toBe(false);
    expect(isShopifyAppPath("/support")).toBe(false);
    expect(isShopifyAppPath("/pricing")).toBe(false);
    expect(isShopifyAppPath("/app")).toBe(true);
    expect(isShopifyAppPath("/app/spend")).toBe(true);
    expect(isShopifyAppPath("/auth/login")).toBe(true);
    expect(isShopifyAppPath("/app.data")).toBe(true);
    expect(isShopifyAppPath("/app/spend.data")).toBe(true);
    expect(isShopifyAppPath("/app._index.data")).toBe(true);
  });

  it("detects Open app / install / billing-return query", () => {
    expect(
      isShopifyEmbeddedSearch("?shop=devmcflyads.myshopify.com&host=abc"),
    ).toBe(true);
    expect(isShopifyEmbeddedSearch({ shop: "devmcflyads.myshopify.com" })).toBe(
      true,
    );
    expect(isShopifyEmbeddedSearch({ host: "YWRtaW4", embedded: "1" })).toBe(
      true,
    );
    expect(isShopifyEmbeddedSearch({ embedded: "1" })).toBe(true);
    expect(isShopifyEmbeddedSearch({ hmac: "deadbeef" })).toBe(true);
    expect(isShopifyEmbeddedSearch("")).toBe(false);
    expect(isShopifyEmbeddedSearch("?utm_source=listing")).toBe(false);
    expect(isShopifyEmbeddedSearch({ utm_source: "listing" })).toBe(false);
  });

  it("skips marketing HTML and redirects to /app for embedded /", () => {
    const req = {
      path: "/",
      query: {
        shop: "devmcflyads.myshopify.com",
        host: "abc",
        embedded: "1",
      },
      originalUrl:
        "/?shop=devmcflyads.myshopify.com&host=abc&embedded=1",
    };
    expect(shouldSkipMarketingSite(req)).toBe(true);
    expect(embeddedAppRedirectLocation(req)).toBe(
      "/app?shop=devmcflyads.myshopify.com&host=abc&embedded=1",
    );
  });

  it("still serves marketing for a bare public GET /", () => {
    expect(
      shouldSkipMarketingSite({ path: "/", query: {}, originalUrl: "/" }),
    ).toBe(false);
    expect(
      shouldSkipMarketingSite({
        path: "/support",
        query: {},
        originalUrl: "/support",
      }),
    ).toBe(false);
  });

  it("treats session-token Authorization as Shopify context", () => {
    expect(
      hasShopifySessionContext({
        url: "https://mcfly-analytics.fly.dev/app",
        headers: { get: () => null },
      }),
    ).toBe(false);
    expect(
      hasShopifySessionContext({
        url: "https://mcfly-analytics.fly.dev/app?shop=devmcflyads.myshopify.com",
        headers: { get: () => null },
      }),
    ).toBe(true);
    expect(
      hasShopifySessionContext({
        url: "https://mcfly-analytics.fly.dev/app",
        headers: {
          get: (name: string) =>
            name.toLowerCase() === "authorization" ? "Bearer tok" : null,
        },
      }),
    ).toBe(true);
  });

  it("lets /app fall through instead of redirecting", () => {
    const req = {
      path: "/app",
      query: { shop: "devmcflyads.myshopify.com" },
      originalUrl: "/app?shop=devmcflyads.myshopify.com",
    };
    expect(isShopifyAppPath(req.path)).toBe(true);
    expect(shouldSkipMarketingSite(req)).toBe(true);
    expect(
      shouldSkipMarketingSite({
        path: "/app.data",
        query: {},
        originalUrl: "/app.data",
      }),
    ).toBe(true);
  });

  it("starts OAuth from /auth/login instead of bouncing a 410 /app", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const login = readFileSync(
      join(here, "../routes/auth.login/route.tsx"),
      "utf8",
    );
    const appShell = readFileSync(join(here, "../routes/app.tsx"), "utf8");
    expect(login).toContain("await login(request)");
    expect(login).not.toMatch(/<input\b/i);
    expect(appShell).toContain("hasShopifySessionContext");
    expect(appShell).toContain("PUBLIC_APP");
    expect(appShell).toContain('kind: "public"');
    expect(appShell).not.toContain('throw redirect("/")');
  });
});
