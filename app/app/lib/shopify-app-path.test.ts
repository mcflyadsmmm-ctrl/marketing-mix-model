import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  documentGoneRedirectLocation,
  embeddedAppRedirectLocation,
  hasShopifySessionContext,
  isReactRouterDataRequest,
  isShopifyAdminFrame,
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
    expect(
      shouldSkipMarketingSite({
        path: "/",
        query: {},
        originalUrl: "/",
        headers: { "sec-fetch-dest": "document" },
      }),
    ).toBe(false);
  });

  it("never paints marketing HTML inside a Shopify Admin iframe", () => {
    const iframeHome = {
      path: "/",
      query: {},
      originalUrl: "/",
      headers: { "sec-fetch-dest": "iframe" },
    };
    expect(isShopifyAdminFrame(iframeHome)).toBe(true);
    expect(shouldSkipMarketingSite(iframeHome)).toBe(true);
    expect(embeddedAppRedirectLocation(iframeHome)).toBe("/app");
  });

  it("does not load App Bridge on a public /app host hit", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const root = readFileSync(join(here, "../root.tsx"), "utf8");
    expect(root).toContain("hasShopifySessionContext(request)");
    expect(root).toContain("isAuth");
    expect(hasShopifySessionContext({
      url: "https://mcfly-analytics.fly.dev/app",
      headers: { get: () => null },
    })).toBe(false);
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

  it("Fly home HTML bounces Admin iframes to /app, not mcflyads.com", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const html = readFileSync(join(here, "../../../site/index.html"), "utf8");
    expect(html).toContain("mcfly-analytics.fly.dev");
    expect(html).toContain('location.replace("/app"');
    expect(html).toContain("window.top === window.self");
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

  it("does not treat the first Admin HTML paint as a data request", () => {
    expect(
      isReactRouterDataRequest({
        url: "https://mcfly-analytics.fly.dev/app?embedded=1&shop=devmcflyads.myshopify.com",
      }),
    ).toBe(false);
    expect(
      isReactRouterDataRequest({
        url: "https://mcfly-analytics.fly.dev/app.data?embedded=1&shop=devmcflyads.myshopify.com",
      }),
    ).toBe(true);
    expect(
      isReactRouterDataRequest({
        url: "https://mcfly-analytics.fly.dev/app/customers.data",
      }),
    ).toBe(true);
  });

  it("bounces a document 410 to /auth/opening so App Bridge can load", () => {
    const location = documentGoneRedirectLocation({
      url: "https://mcfly-analytics.fly.dev/app/customers?embedded=1&shop=devmcflyads.myshopify.com&host=abc",
    });
    expect(location).toMatch(/^\/auth\/opening\?/);
    expect(location).toContain("next=%2Fapp%2Fcustomers");
    expect(location).toContain("embedded=1");
    expect(location).toContain("shop=devmcflyads.myshopify.com");
    expect(
      documentGoneRedirectLocation({
        url: "https://mcfly-analytics.fly.dev/auth/opening?next=%2Fapp",
      }),
    ).toBeNull();
  });

  it("wraps authenticate.admin so a document 410 never paints Gone", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const shopifyServer = readFileSync(
      join(here, "../shopify.server.ts"),
      "utf8",
    );
    const opening = readFileSync(
      join(here, "../routes/auth.opening.tsx"),
      "utf8",
    );
    expect(shopifyServer).toContain("documentGoneRedirectLocation");
    expect(shopifyServer).toContain("isReactRouterDataRequest");
    expect(shopifyServer).not.toMatch(
      /export const authenticate = shopify\.authenticate;/,
    );
    expect(opening).toContain("useNavigate");
    expect(opening).toContain("/app");
    expect(opening).toContain("/support");
    expect(opening).toMatch(/reopen the app from Shopify Admin/i);
  });
});
