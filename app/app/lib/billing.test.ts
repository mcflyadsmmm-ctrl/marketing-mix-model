import { afterEach, describe, expect, it } from "vitest";
import {
  buildBillingReturnUrl,
  buildManagedPricingPlansUrl,
  getShopBillingSnapshot,
  pickActiveProSubscription,
  shouldUseTestCharges,
} from "./billing.server";
import { PRO_PLAN, subscriptionMatchesProPlan } from "./billing-flag.server";

const ORIG = {
  MCFLY_BILLING: process.env.MCFLY_BILLING,
  MCFLY_BILLING_TEST: process.env.MCFLY_BILLING_TEST,
  SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL,
  SHOPIFY_APP_HANDLE: process.env.SHOPIFY_APP_HANDLE,
};

afterEach(() => {
  if (ORIG.MCFLY_BILLING === undefined) {
    delete process.env.MCFLY_BILLING;
  } else {
    process.env.MCFLY_BILLING = ORIG.MCFLY_BILLING;
  }
  if (ORIG.MCFLY_BILLING_TEST === undefined) {
    delete process.env.MCFLY_BILLING_TEST;
  } else {
    process.env.MCFLY_BILLING_TEST = ORIG.MCFLY_BILLING_TEST;
  }
  if (ORIG.SHOPIFY_APP_URL === undefined) {
    delete process.env.SHOPIFY_APP_URL;
  } else {
    process.env.SHOPIFY_APP_URL = ORIG.SHOPIFY_APP_URL;
  }
  if (ORIG.SHOPIFY_APP_HANDLE === undefined) {
    delete process.env.SHOPIFY_APP_HANDLE;
  } else {
    process.env.SHOPIFY_APP_HANDLE = ORIG.SHOPIFY_APP_HANDLE;
  }
});

describe("billing subscription helpers", () => {
  it("matches Pro plan name", () => {
    expect(subscriptionMatchesProPlan(PRO_PLAN.name)).toBe(true);
    expect(subscriptionMatchesProPlan("Mcfly Analytics Pro")).toBe(true);
    expect(subscriptionMatchesProPlan("Pro")).toBe(true);
    expect(subscriptionMatchesProPlan("Free")).toBe(false);
    expect(subscriptionMatchesProPlan("Other app")).toBe(false);
  });

  it("picks ACTIVE Pro subscription only", () => {
    expect(
      pickActiveProSubscription([
        { id: "gid://1", name: "Free", status: "ACTIVE" },
        { id: "gid://2", name: PRO_PLAN.name, status: "CANCELLED" },
        { id: "gid://3", name: "Pro", status: "ACTIVE" },
      ]),
    ).toEqual({ id: "gid://3", name: "Pro" });
  });

  it("shouldUseTestCharges only when MCFLY_BILLING_TEST=1", () => {
    delete process.env.MCFLY_BILLING_TEST;
    expect(shouldUseTestCharges()).toBe(false);
    process.env.MCFLY_BILLING_TEST = "0";
    expect(shouldUseTestCharges()).toBe(false);
    process.env.MCFLY_BILLING_TEST = "1";
    expect(shouldUseTestCharges()).toBe(true);
  });

  it("buildManagedPricingPlansUrl uses store + app handle", () => {
    delete process.env.SHOPIFY_APP_HANDLE;
    expect(buildManagedPricingPlansUrl("devmcflyads.myshopify.com")).toBe(
      "https://admin.shopify.com/store/devmcflyads/charges/mcfly-analytics-public/pricing_plans",
    );
  });

  it("buildBillingReturnUrl keeps shop/host on app origin", () => {
    process.env.SHOPIFY_APP_URL = "https://mcfly-analytics.fly.dev";
    const url = buildBillingReturnUrl({
      requestUrl:
        "https://mcfly-analytics.fly.dev/app/settings?shop=acme.myshopify.com&host=abc",
      shopDomain: "acme.myshopify.com",
    });
    expect(url).toContain("https://mcfly-analytics.fly.dev/app/settings");
    expect(url).toContain("shop=acme.myshopify.com");
    expect(url).toContain("host=abc");
  });

  it("snapshot includes Managed Pricing URL when billing is on", () => {
    process.env.MCFLY_BILLING = "1";
    const snap = getShopBillingSnapshot("devmcflyads.myshopify.com");
    expect(snap.confirmationUrl).toBe(
      "https://admin.shopify.com/store/devmcflyads/charges/mcfly-analytics-public/pricing_plans",
    );
    expect(snap.enabled).toBe(true);
  });

  it("snapshot omits plan URL when billing is off", () => {
    delete process.env.MCFLY_BILLING;
    const snap = getShopBillingSnapshot("devmcflyads.myshopify.com");
    expect(snap.confirmationUrl).toBeNull();
    expect(snap.enabled).toBe(false);
  });
});
