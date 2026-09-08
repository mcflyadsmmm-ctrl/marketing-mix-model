import { describe, expect, it } from "vitest";
import {
  embeddedAppRedirectLocation,
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

  it("lets /app fall through instead of redirecting", () => {
    const req = {
      path: "/app",
      query: { shop: "devmcflyads.myshopify.com" },
      originalUrl: "/app?shop=devmcflyads.myshopify.com",
    };
    expect(isShopifyAppPath(req.path)).toBe(true);
    expect(shouldSkipMarketingSite(req)).toBe(true);
  });
});
