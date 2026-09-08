/**
 * Adversarial guards against the App Store 2.1.1 rejection:
 * "admin.shopify.com refused to connect" when Managed Pricing loads
 * inside the embedded app iframe.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { billingExitHtmlResponse } from "./billing-exit.server";
import {
  isShopifyAdminUrl,
  navigateToBillingConfirmation,
  withEmbeddedBillingSearch,
} from "./billing-navigate";
import { buildManagedPricingPlansUrl } from "./billing.server";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "..");

function readAppSource(rel: string): string {
  return readFileSync(join(appRoot, rel), "utf8");
}

describe("App Store 2.1.1 billing iframe guards", () => {
  const adminPlanUrl = buildManagedPricingPlansUrl("devmcflyads.myshopify.com");

  it("builds Admin Managed Pricing URL for the Partner handle", () => {
    expect(adminPlanUrl).toBe(
      "https://admin.shopify.com/store/devmcflyads/charges/mcfly-analytics-public/pricing_plans",
    );
    expect(isShopifyAdminUrl(adminPlanUrl)).toBe(true);
  });

  it("GET exit HTML never uses meta refresh or Location-style Admin bounce", async () => {
    const res = billingExitHtmlResponse({
      confirmationUrl: adminPlanUrl,
      apiKey: "test-key",
      shopDomain: "devmcflyads.myshopify.com",
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
    const html = await res.text();
    expect(html).toContain('open(url, "_top")');
    expect(html).toContain('"_top"');
    expect(html).toContain("app-bridge.js");
    expect(html).toContain("data-mcfly-billing-continue");
    expect(html).not.toMatch(/http-equiv\s*=\s*["']?refresh/i);
    expect(html).not.toMatch(/location\.(href|assign|replace)\s*=/);
  });

  it("sets frame-ancestors so Admin can host the exit bounce", async () => {
    const res = billingExitHtmlResponse({
      confirmationUrl: adminPlanUrl,
      apiKey: "test-key",
      shopDomain: "devmcflyads.myshopify.com",
    });
    const csp = res.headers.get("content-security-policy") ?? "";
    expect(csp).toMatch(/frame-ancestors/);
    expect(csp).toContain("https://admin.shopify.com");
    expect(csp).toContain("devmcflyads.myshopify.com");
  });

  it("rejects phishing / non-Admin confirmation URLs", async () => {
    for (const bad of [
      "https://evil.example/plans",
      "https://mcflyads.com/pricing",
      "https://admin.shopify.com.evil.example/x",
      "/app/settings",
    ]) {
      const res = billingExitHtmlResponse({
        confirmationUrl: bad,
        apiKey: "test-key",
      });
      expect(res.status).toBe(400);
    }
  });

  it("ProUpgradeButton prefers user-gesture top-frame open and keeps HTML exit fallback", () => {
    const src = readAppSource("components/ProUpgradeButton.tsx");
    expect(src).toContain("useBillingExit");
    expect(src).toContain("data-mcfly-billing-user-gesture");
    expect(src).toContain("navigateToBillingConfirmation");
    expect(src).toContain("withEmbeddedBillingSearch");
    expect(src).toContain("Open plans in Admin");
    expect(src).toContain("data-mcfly-billing-exit-fallback");
    expect(src).toContain('method="post"');
    // Must not deep-link Admin from the button itself.
    expect(src).not.toMatch(/admin\.shopify\.com/);
  });

  it("app.billing loader throws HTML exit — never redirect(adminUrl)", () => {
    const src = readAppSource("routes/app.billing.tsx");
    expect(src).toContain("billingExitHtmlResponse");
    expect(src).toContain("throw billingExitHtmlResponse");
    expect(src).not.toMatch(/redirect\(\s*result\.confirmationUrl/);
    expect(src).not.toMatch(/redirect\(\s*[`'"].*admin\.shopify/);
    expect(src).not.toMatch(/target:\s*["']_top["']/);
  });

  it("billing-navigate never same-frame assigns Admin hosts", () => {
    const calls: string[] = [];
    const ok = navigateToBillingConfirmation(adminPlanUrl, {
      openTop: () => false,
      clickTopAnchor: () => {
        throw new Error("blocked");
      },
      assignSameFrame: (url) => {
        calls.push(url);
      },
    });
    expect(ok).toBe(false);
    expect(calls).toEqual([]);
  });

  it("forces embedded=1 on billing search so authenticate can App Bridge-exit", () => {
    expect(withEmbeddedBillingSearch("?shop=x.myshopify.com")).toContain(
      "embedded=1",
    );
    expect(withEmbeddedBillingSearch("")).toBe("?embedded=1");
  });

  it("source tree has no bare href to Admin pricing_plans", () => {
    const files = [
      "components/ProUpgradeButton.tsx",
      "routes/app.billing.tsx",
      "routes/app.settings.tsx",
      "routes/app.spend.tsx",
      "routes/app.ltv.tsx",
      "routes/app.goals.tsx",
      "routes/app.advanced.tsx",
      "routes/app._index.tsx",
      "routes/app.tsx",
    ];
    for (const rel of files) {
      const src = readAppSource(rel);
      expect(src).not.toMatch(/href=\{?[`'"]https:\/\/admin\.shopify\.com/);
      expect(src).not.toMatch(/pricing_plans[`'"]/);
    }
  });
});
