import { afterEach, describe, expect, it } from "vitest";
import {
  assertChannelsAllowed,
  canUseChannel,
  filterToAllowedChannels,
  FREE_CHANNELS,
  getShopEntitlements,
  isFreeChannel,
  isProShop,
  parseProShopOverrideList,
  proRequiredLtvSummary,
} from "./entitlements.server";

const ORIG_PRO = process.env.MCFLY_PRO_SHOPS;
const ORIG_BILLING = process.env.MCFLY_BILLING;

afterEach(() => {
  if (ORIG_PRO === undefined) delete process.env.MCFLY_PRO_SHOPS;
  else process.env.MCFLY_PRO_SHOPS = ORIG_PRO;
  if (ORIG_BILLING === undefined) delete process.env.MCFLY_BILLING;
  else process.env.MCFLY_BILLING = ORIG_BILLING;
});

describe("entitlements Free vs Pro", () => {
  it("treats every named platform as a Free channel", () => {
    expect(isFreeChannel("meta")).toBe(true);
    expect(isFreeChannel("google")).toBe(true);
    expect(isFreeChannel("other")).toBe(true);
    expect(isFreeChannel("tiktok")).toBe(true);
    expect(isFreeChannel("amazon")).toBe(true);
    expect(FREE_CHANNELS).toContain("tiktok");
  });

  it("defaults shops to Free without override but allows all spend channels", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    delete process.env.MCFLY_BILLING;
    expect(isProShop("acme.myshopify.com")).toBe(false);
    const e = getShopEntitlements("acme.myshopify.com");
    expect(e.tier).toBe("free");
    expect(e.canUseAllChannels).toBe(true);
    expect(e.canUseLiveLtv).toBe(false);
    expect(e.canUseLtv).toBe(false);
    expect(e.canUseAdvancedGoals).toBe(false);
    expect(e.canUseAdvancedClose).toBe(false);
    expect(e.showProTeaser).toBe(false);
    expect(e.canManagePlan).toBe(false);
    expect(canUseChannel(e, "meta")).toBe(true);
    expect(canUseChannel(e, "other")).toBe(true);
    expect(canUseChannel(e, "tiktok")).toBe(true);
  });

  it("shows Upgrade teaser only when Billing is on and shop is Free", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    process.env.MCFLY_BILLING = "1";
    const free = getShopEntitlements("acme.myshopify.com");
    expect(free.showProTeaser).toBe(true);
    expect(free.canManagePlan).toBe(false);
    const pro = getShopEntitlements("acme.myshopify.com", { paidPro: true });
    expect(pro.showProTeaser).toBe(false);
    expect(pro.canManagePlan).toBe(true);
  });

  it("SAMPLE desk previews LTV + advanced Goals without Pro", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    const e = getShopEntitlements("acme.myshopify.com", { sampleDesk: true });
    expect(e.isPro).toBe(false);
    expect(e.canUseLiveLtv).toBe(false);
    expect(e.canUseLtv).toBe(true);
    expect(e.canUseAdvancedGoals).toBe(true);
    expect(e.canUseAdvancedClose).toBe(false);
    expect(e.canUseAllChannels).toBe(true);
    expect(e.allowedChannels).toContain("tiktok");
    expect(canUseChannel(e, "tiktok")).toBe(true);
  });

  it("MCFLY_PRO_SHOPS grants Pro", () => {
    process.env.MCFLY_PRO_SHOPS =
      "devmcflyads.myshopify.com, Partner.Myshopify.Com ";
    expect(parseProShopOverrideList().has("devmcflyads.myshopify.com")).toBe(
      true,
    );
    expect(isProShop("partner.myshopify.com")).toBe(true);
    const e = getShopEntitlements("devmcflyads.myshopify.com");
    expect(e.isPro).toBe(true);
    expect(e.canUseLiveLtv).toBe(true);
    expect(e.canUseAllChannels).toBe(true);
    expect(e.canUseAdvancedClose).toBe(true);
    expect(canUseChannel(e, "amazon")).toBe(true);
  });

  it("assertChannelsAllowed allows named platforms on Free", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    const e = getShopEntitlements("acme.myshopify.com");
    expect(assertChannelsAllowed(e, ["meta", "google", "other"])).toBeNull();
    expect(assertChannelsAllowed(e, ["meta", "tiktok", "amazon"])).toBeNull();
    expect(assertChannelsAllowed(e, ["not_a_channel"])).toMatch(/Unknown spend channel/);
  });

  it("filterToAllowedChannels keeps tiktok on Free live reads", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    const e = getShopEntitlements("acme.myshopify.com");
    const filtered = filterToAllowedChannels(e, [
      { channel: "meta", amount: 100 },
      { channel: "tiktok", amount: 50 },
      { channel: "google", amount: 25 },
      { channel: "other", amount: 10 },
    ]);
    expect(filtered).toEqual([
      { channel: "meta", amount: 100 },
      { channel: "tiktok", amount: 50 },
      { channel: "google", amount: 25 },
      { channel: "other", amount: 10 },
    ]);
  });

  it("filterToAllowedChannels keeps full mix on SAMPLE without Pro", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    const e = getShopEntitlements("acme.myshopify.com", { sampleDesk: true });
    const rows = [
      { channel: "meta", amount: 100 },
      { channel: "tiktok", amount: 50 },
    ];
    expect(filterToAllowedChannels(e, rows)).toEqual(rows);
  });

  it("filterToAllowedChannels keeps full mix for Pro", () => {
    process.env.MCFLY_PRO_SHOPS = "pro.myshopify.com";
    const e = getShopEntitlements("pro.myshopify.com");
    const rows = [
      { channel: "meta", amount: 100 },
      { channel: "tiktok", amount: 50 },
    ];
    expect(filterToAllowedChannels(e, rows)).toEqual(rows);
  });

  it("proRequiredLtvSummary is fail-closed", () => {
    const s = proRequiredLtvSummary("MTD");
    expect(s.available).toBe(false);
    expect(s.emptyReason).toBe("pro_required");
    expect(s.cohorts).toEqual([]);
  });

  it("paidPro unlocks Pro without MCFLY_PRO_SHOPS", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    expect(isProShop("acme.myshopify.com")).toBe(false);
    expect(isProShop("acme.myshopify.com", { paidPro: true })).toBe(true);
    const e = getShopEntitlements("acme.myshopify.com", { paidPro: true });
    expect(e.isPro).toBe(true);
    expect(e.canUseLiveLtv).toBe(true);
  });
});
