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
import { PRO_UPSELL } from "./entitlements";

const ORIG_PRO = process.env.MCFLY_PRO_SHOPS;

afterEach(() => {
  if (ORIG_PRO === undefined) delete process.env.MCFLY_PRO_SHOPS;
  else process.env.MCFLY_PRO_SHOPS = ORIG_PRO;
});

describe("entitlements — one $39 desk", () => {
  it("keeps starter CSV columns as Meta, Google, and Other (not a Free plan)", () => {
    expect(isFreeChannel("meta")).toBe(true);
    expect(isFreeChannel("google")).toBe(true);
    expect(isFreeChannel("other")).toBe(true);
    expect(isFreeChannel("tiktok")).toBe(false);
    expect(FREE_CHANNELS).toEqual(["meta", "google", "other"]);
  });

  it("gives unpaid / first-session shops the full desk (TikTok, LTV, Goals)", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    expect(isProShop("acme.myshopify.com")).toBe(false);
    const e = getShopEntitlements("acme.myshopify.com");
    expect(e.tier).toBe("free");
    expect(e.isPro).toBe(false);
    expect(e.canUseAllChannels).toBe(true);
    expect(e.canUseLiveLtv).toBe(true);
    expect(e.canUseLtv).toBe(true);
    expect(e.canUseAdvancedGoals).toBe(true);
    expect(e.canUseAdvancedClose).toBe(true);
    expect(e.showProTeaser).toBe(false);
    expect(canUseChannel(e, "meta")).toBe(true);
    expect(canUseChannel(e, "other")).toBe(true);
    expect(canUseChannel(e, "tiktok")).toBe(true);
    expect(assertChannelsAllowed(e, ["meta", "tiktok", "amazon"])).toBeNull();
  });

  it("SAMPLE is preview data only — not a feature unlock", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    const e = getShopEntitlements("acme.myshopify.com", { sampleDesk: true });
    expect(e.isPro).toBe(false);
    expect(e.canUseLiveLtv).toBe(true);
    expect(e.canUseLtv).toBe(true);
    expect(e.canUseAdvancedGoals).toBe(true);
    expect(e.canUseAllChannels).toBe(true);
    expect(e.showProTeaser).toBe(false);
    expect(PRO_UPSELL.includes).toMatch(/SAMPLE is preview data only/i);
  });

  it("MCFLY_PRO_SHOPS marks billed without changing the desk", () => {
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
    expect(canUseChannel(e, "amazon")).toBe(true);
  });

  it("filterToAllowedChannels keeps tiktok on unpaid live reads", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    const e = getShopEntitlements("acme.myshopify.com");
    const rows = [
      { channel: "meta", amount: 100 },
      { channel: "tiktok", amount: 50 },
      { channel: "google", amount: 25 },
      { channel: "other", amount: 10 },
    ];
    expect(filterToAllowedChannels(e, rows)).toEqual(rows);
  });

  it("proRequiredLtvSummary stays fail-closed for leftover callers", () => {
    const s = proRequiredLtvSummary("MTD");
    expect(s.available).toBe(false);
    expect(s.emptyReason).toBe("pro_required");
    expect(s.cohorts).toEqual([]);
  });

  it("paidPro marks billed without gating features", () => {
    delete process.env.MCFLY_PRO_SHOPS;
    expect(isProShop("acme.myshopify.com")).toBe(false);
    expect(isProShop("acme.myshopify.com", { paidPro: true })).toBe(true);
    const e = getShopEntitlements("acme.myshopify.com", { paidPro: true });
    expect(e.isPro).toBe(true);
    expect(e.canUseLiveLtv).toBe(true);
    expect(e.showProTeaser).toBe(false);
  });

  it("copy is trial + $39 full desk — not a Free App Store plan", () => {
    expect(PRO_UPSELL.short).toMatch(/\$39/);
    expect(PRO_UPSELL.short).toMatch(/7-day trial/);
    expect(PRO_UPSELL.upgradeCta).toBe("Start $39 plan");
    expect(PRO_UPSELL.upgradeCta).not.toMatch(/\bPro\b/i);
    expect(PRO_UPSELL.channels).toMatch(/TikTok/);
    expect(PRO_UPSELL.channels).not.toMatch(/Free channels/i);
    expect(PRO_UPSELL.ltv).not.toMatch(/Pro unlocks/i);
    expect(PRO_UPSELL.goals).not.toMatch(/Pro unlocks/i);
  });
});
