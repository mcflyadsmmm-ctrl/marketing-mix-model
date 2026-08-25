import { describe, expect, it } from "vitest";
import {
  addTypedCustomChannel,
  customChannelFromLabel,
  customNameCollidesWithNamedChannel,
  normalizeCustomChannelList,
  parseCustomChannelsParam,
  serializeCustomChannelsParam,
  slugCustomChannelName,
  toggleCustomPreset,
} from "./spend-custom-channel";

describe("slugCustomChannelName", () => {
  it("slugs billboards and generic other to empty", () => {
    expect(slugCustomChannelName("Billboards / OOH")).toBe("billboards-ooh");
    expect(slugCustomChannelName("  Radio  ")).toBe("radio");
    expect(slugCustomChannelName("Other")).toBe("");
    expect(slugCustomChannelName("other ads")).toBe("");
    expect(slugCustomChannelName("")).toBe("");
  });
});

describe("customChannelFromLabel", () => {
  it("accepts billboards and rejects named platforms", () => {
    expect(customChannelFromLabel("Billboards / OOH")).toEqual({
      customKey: "billboards-ooh",
      customLabel: "Billboards / OOH",
    });
    expect(customChannelFromLabel("Agency retainer")).toEqual({
      customKey: "agency-retainer",
      customLabel: "Agency retainer",
    });
    expect(customChannelFromLabel("Meta Ads")).toBeNull();
    expect(customChannelFromLabel("Google")).toBeNull();
    expect(customNameCollidesWithNamedChannel("TikTok Ads")).toBe(true);
  });
});

describe("normalizeCustomChannelList", () => {
  it("dedupes by slug and keeps several extras", () => {
    expect(
      normalizeCustomChannelList([
        "Billboards / OOH",
        "Radio",
        "billboards / ooh",
        "Podcast",
        "My agency",
      ]),
    ).toEqual(["Billboards / OOH", "Radio", "Podcast", "My agency"]);
  });

  it("parses pipe-separated template query", () => {
    const names = parseCustomChannelsParam("Billboards / OOH|Radio|Podcast");
    expect(names).toEqual(["Billboards / OOH", "Radio", "Podcast"]);
    expect(serializeCustomChannelsParam(names)).toBe(
      "Billboards / OOH|Radio|Podcast",
    );
  });
});

describe("toggleCustomPreset / addTypedCustomChannel", () => {
  it("toggles billboards on and off", () => {
    const on = toggleCustomPreset([], "Billboards / OOH");
    expect(on).toEqual(["Billboards / OOH"]);
    expect(toggleCustomPreset(on, "Billboards / OOH")).toEqual([]);
  });

  it("adds a typed extra and blocks a named platform", () => {
    const added = addTypedCustomChannel(["Radio"], "Local magazine");
    expect(added.error).toBeNull();
    expect(added.names).toEqual(["Radio", "Local magazine"]);
    const blocked = addTypedCustomChannel(["Radio"], "Google Ads");
    expect(blocked.error).toMatch(/named platform/i);
    expect(blocked.names).toEqual(["Radio"]);
  });
});
