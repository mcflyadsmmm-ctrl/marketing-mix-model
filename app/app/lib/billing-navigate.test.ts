import { describe, expect, it, vi } from "vitest";
import {
  isShopifyAdminUrl,
  navigateToBillingConfirmation,
  type BillingNavigateHost,
} from "./billing-navigate";

function mockHost(
  overrides: Partial<BillingNavigateHost> = {},
): BillingNavigateHost {
  return {
    openTop: vi.fn(),
    clickTopAnchor: vi.fn(),
    assignSameFrame: vi.fn(),
    ...overrides,
  };
}

describe("isShopifyAdminUrl", () => {
  it("accepts Admin plan picker hosts", () => {
    expect(
      isShopifyAdminUrl(
        "https://admin.shopify.com/store/devmcflyads/charges/mcfly-analytics-public/pricing_plans",
      ),
    ).toBe(true);
  });

  it("rejects app and marketing origins", () => {
    expect(isShopifyAdminUrl("https://mcfly-analytics.fly.dev/app/billing")).toBe(
      false,
    );
    expect(isShopifyAdminUrl("https://mcflyads.com/pricing")).toBe(false);
    expect(isShopifyAdminUrl("not-a-url")).toBe(false);
  });
});

describe("navigateToBillingConfirmation", () => {
  const adminUrl =
    "https://admin.shopify.com/store/devmcflyads/charges/mcfly-analytics-public/pricing_plans";

  it("uses openTop and never same-frame assigns Admin", () => {
    const host = mockHost();
    expect(navigateToBillingConfirmation(adminUrl, host)).toBe(true);
    expect(host.openTop).toHaveBeenCalledWith(adminUrl);
    expect(host.clickTopAnchor).not.toHaveBeenCalled();
    expect(host.assignSameFrame).not.toHaveBeenCalled();
  });

  it("falls back to target=_top anchor when openTop throws", () => {
    const host = mockHost({
      openTop: vi.fn(() => {
        throw new Error("blocked");
      }),
    });
    expect(navigateToBillingConfirmation(adminUrl, host)).toBe(true);
    expect(host.clickTopAnchor).toHaveBeenCalledWith(adminUrl);
    expect(host.assignSameFrame).not.toHaveBeenCalled();
  });

  it("refuses same-frame Admin navigation when all top exits fail", () => {
    const host = mockHost({
      openTop: vi.fn(() => {
        throw new Error("blocked");
      }),
      clickTopAnchor: vi.fn(() => {
        throw new Error("no dom");
      }),
    });
    expect(navigateToBillingConfirmation(adminUrl, host)).toBe(false);
    expect(host.assignSameFrame).not.toHaveBeenCalled();
  });

  it("may same-frame assign non-Admin URLs as last resort", () => {
    const appUrl = "https://mcfly-analytics.fly.dev/app/settings";
    const host = mockHost({
      openTop: vi.fn(() => {
        throw new Error("blocked");
      }),
      clickTopAnchor: vi.fn(() => {
        throw new Error("no dom");
      }),
    });
    expect(navigateToBillingConfirmation(appUrl, host)).toBe(true);
    expect(host.assignSameFrame).toHaveBeenCalledWith(appUrl);
  });
});
