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

afterEach(() => {
  if (ORIG_PRO === undefined) delete process.env.MCFLY_PRO_SHOPS;
  else process.env.MCFLY_PRO_SHOPS = ORIG_PRO;
});

describe("entitlements Free vs Pro", () => {
  it("treats meta, google, and other as Free channels", () => {
    expect(isFreeChannel("meta")).toBe(true);
    expect(isFreeChannel("google")).toBe(true);
    expect(isFreeChannel("other")).toBe(true);
    expect(isFreeChannel("tiktok")).toBe(false);
    expect(FREE_CHANNELS).toEqual(["meta", "google", "other"]);
  });

  it("defaults shops to Free without override", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    expect(isProShop("acme.myshopify.com")).toBe(false);
    const e = getShopEntitlements("acme.myshopify.com");
    expect(e.tier).toBe("free");
    expect(e.canUseAllChannels).toBe(false);
    expect(e.canUseLiveLtv).toBe(false);
    expect(e.canUseLtv).toBe(false);
    expect(e.canUseAdvancedGoals).toBe(false);
    expect(e.canUseAdvancedClose).toBe(false);
    expect(canUseChannel(e, "meta")).toBe(true);
    expect(canUseChannel(e, "other")).toBe(true);
    expect(canUseChannel(e, "tiktok")).toBe(false);
  });

  it("SAMPLE desk previews LTV + advanced Goals without Pro", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    const e = getShopEntitlements("acme.myshopify.com", { sampleDesk: true });
    expect(e.isPro).toBe(false);
    expect(e.canUseLiveLtv).toBe(false);
    expect(e.canUseLtv).toBe(true);
    expect(e.canUseAdvancedGoals).toBe(true);
    expect(e.canUseAdvancedClose).toBe(false);
    expect(e.canUseAllChannels).toBe(false);
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

  it("assertChannelsAllowed blocks named Pro platforms on Free (other stays Free)", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    const e = getShopEntitlements("acme.myshopify.com");
    expect(assertChannelsAllowed(e, ["meta", "google", "other"])).toBeNull();
    const err = assertChannelsAllowed(e, ["meta", "tiktok", "amazon"]);
    expect(err).toMatch(/Pro required/);
    expect(err).toMatch(/tiktok/);
    expect(err).toMatch(/amazon/);
  });

  it("filterToAllowedChannels drops tiktok on Free live reads but keeps other", () => {
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
      { channel: "google", amount: 25 },
      { channel: "other", amount: 10 },
    ]);
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
});
