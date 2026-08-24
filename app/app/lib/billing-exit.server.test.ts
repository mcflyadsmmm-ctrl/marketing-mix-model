import { describe, expect, it } from "vitest";
import { billingExitHtmlResponse } from "./billing-exit.server";

describe("billingExitHtmlResponse", () => {
  const adminUrl =
    "https://admin.shopify.com/store/devmcflyads/charges/mcfly-analytics-public/pricing_plans";

  it("returns HTML that opens Admin with _top (never a 302)", async () => {
    const res = billingExitHtmlResponse({
      confirmationUrl: adminUrl,
      apiKey: "test-api-key",
      shopDomain: "devmcflyads.myshopify.com",
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    const html = await res.text();
    expect(html).toContain("cdn.shopify.com/shopifycloud/app-bridge.js");
    expect(html).toContain('window.open(');
    expect(html).toContain('"_top"');
    expect(html).toContain(adminUrl);
    expect(html).not.toMatch(/http-equiv=["']refresh/i);
  });

  it("rejects non-Admin destinations", async () => {
    const res = billingExitHtmlResponse({
      confirmationUrl: "https://evil.example/phish",
      apiKey: "test-api-key",
    });
    expect(res.status).toBe(400);
  });

  it("rejects empty destinations", async () => {
    const res = billingExitHtmlResponse({
      confirmationUrl: "   ",
      apiKey: "test-api-key",
    });
    expect(res.status).toBe(400);
  });
});
