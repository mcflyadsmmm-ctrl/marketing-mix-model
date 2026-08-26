import { afterEach, describe, expect, it } from "vitest";
import { SPEND_CHANNELS } from "@mcfly/mer-engine";
import {
  assertChannelsAllowed,
  canUseChannel,
  filterToAllowedChannels,
  FREE_CHANNELS,
  getShopEntitlements,
  isFreeChannel,
  isProShop,
  parseProShopOverrideList,
} from "./entitlements.server";

const ORIG_PRO = process.env.MCFLY_PRO_SHOPS;
const ORIG_BILLING = process.env.MCFLY_BILLING;

afterEach(() => {
  if (ORIG_PRO === undefined) delete process.env.MCFLY_PRO_SHOPS;
  else process.env.MCFLY_PRO_SHOPS = ORIG_PRO;
  if (ORIG_BILLING === undefined) delete process.env.MCFLY_BILLING;
  else process.env.MCFLY_BILLING = ORIG_BILLING;
});

describe("entitlements whole-desk plan", () => {
  it("treats every named platform as an allowed channel", () => {
    expect(isFreeChannel("meta")).toBe(true);
    expect(isFreeChannel("google")).toBe(true);
    expect(isFreeChannel("other")).toBe(true);
    expect(isFreeChannel("tiktok")).toBe(true);
    expect(isFreeChannel("amazon")).toBe(true);
    expect(FREE_CHANNELS).toContain("tiktok");
  });

  it("keeps the whole desk on when billing is off", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    delete process.env.MCFLY_BILLING;
    expect(isProShop("acme.myshopify.com")).toBe(false);
    const e = getShopEntitlements("acme.myshopify.com");
    expect(e.tier).toBe("free");
    expect(e.canUseAllChannels).toBe(true);
    expect(e.allowedChannels).toEqual(SPEND_CHANNELS);
    expect(e.showStartTrial).toBe(false);
    expect(e.canManagePlan).toBe(false);
    expect(canUseChannel(e, "meta")).toBe(true);
    expect(canUseChannel(e, "other")).toBe(true);
    expect(canUseChannel(e, "tiktok")).toBe(true);
  });

  it("never feature-gates LTV; Start trial lives in Settings", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    process.env.MCFLY_BILLING = "1";
    const unpaid = getShopEntitlements("acme.myshopify.com");
    expect(unpaid.showStartTrial).toBe(true);
    expect(unpaid.canManagePlan).toBe(false);
    // Unpaid and paid resolve the same feature set — LTV included.
    expect(unpaid.allowedChannels).toEqual(SPEND_CHANNELS);
    const paid = getShopEntitlements("acme.myshopify.com", { paidPro: true });
    expect(paid.showStartTrial).toBe(false);
    expect(paid.canManagePlan).toBe(true);
  });

  it("Sample data is a view, not a plan — LTV stays on", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    const e = getShopEntitlements("acme.myshopify.com", { sampleDesk: true });
    expect(e.isPro).toBe(false);
    // Nothing is plan-scoped: there are no per-feature capability flags left
    // to gate on, and every engine channel is writable.
    expect(e.canUseAllChannels).toBe(true);
    expect(e.allowedChannels).toEqual(SPEND_CHANNELS);
    expect(e.allowedChannels).toContain("tiktok");
    expect(canUseChannel(e, "tiktok")).toBe(true);
  });

  it("MCFLY_PRO_SHOPS grants paid/trial", () => {
    process.env.MCFLY_PRO_SHOPS =
      "devmcflyads.myshopify.com, Partner.Myshopify.Com ";
    expect(parseProShopOverrideList().has("devmcflyads.myshopify.com")).toBe(
      true,
    );
    expect(isProShop("partner.myshopify.com")).toBe(true);
    const e = getShopEntitlements("devmcflyads.myshopify.com");
    expect(e.isPro).toBe(true);
    expect(e.canUseAllChannels).toBe(true);
    expect(canUseChannel(e, "amazon")).toBe(true);
  });

  it("assertChannelsAllowed allows named platforms", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    const e = getShopEntitlements("acme.myshopify.com");
    expect(assertChannelsAllowed(e, ["meta", "google", "other"])).toBeNull();
    expect(assertChannelsAllowed(e, ["meta", "tiktok", "amazon"])).toBeNull();
    expect(assertChannelsAllowed(e, ["not_a_channel"])).toMatch(/Unknown spend channel/);
  });

  it("filterToAllowedChannels keeps tiktok on unpaid live reads", () => {
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

  it("filterToAllowedChannels keeps full mix on Sample without paid", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    const e = getShopEntitlements("acme.myshopify.com", { sampleDesk: true });
    const rows = [
      { channel: "meta", amount: 100 },
      { channel: "tiktok", amount: 50 },
    ];
    expect(filterToAllowedChannels(e, rows)).toEqual(rows);
  });

  it("filterToAllowedChannels keeps full mix for paid", () => {
    process.env.MCFLY_PRO_SHOPS = "pro.myshopify.com";
    const e = getShopEntitlements("pro.myshopify.com");
    const rows = [
      { channel: "meta", amount: 100 },
      { channel: "tiktok", amount: 50 },
    ];
    expect(filterToAllowedChannels(e, rows)).toEqual(rows);
  });

  it("paidPro unlocks billing cache without MCFLY_PRO_SHOPS", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    expect(isProShop("acme.myshopify.com")).toBe(false);
    expect(isProShop("acme.myshopify.com", { paidPro: true })).toBe(true);
    const e = getShopEntitlements("acme.myshopify.com", { paidPro: true });
    expect(e.isPro).toBe(true);
    // Paid changes billing state only — never which features resolve.
    expect(e.canUseAllChannels).toBe(true);
  });
});
