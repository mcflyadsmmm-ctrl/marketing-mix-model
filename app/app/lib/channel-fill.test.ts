import { describe, expect, it } from "vitest";
import {
  NAMED_EXTRA_FILL_COUNT,
  channelFillKey,
  displayFillKey,
  namedExtraFillKey,
  sliceFillKey,
} from "./channel-fill";

describe("named extra fills", () => {
  it("gives Billboard its own colour, never the grey Other band", () => {
    const billboard = sliceFillKey("other:billboard");
    expect(billboard).not.toBe("other");
    expect(billboard).toMatch(/^extra-[1-6]$/);
    expect(sliceFillKey("other")).toBe("other");
    expect(sliceFillKey("meta")).toBe("meta");
  });

  it("resolves the slug and the merchant's label to the same colour", () => {
    // The chart hashes `other:billboard`; Overview hashes "Billboard".
    expect(namedExtraFillKey("Billboard")).toBe(sliceFillKey("other:billboard"));
    expect(namedExtraFillKey("radio-spots")).toBe(
      namedExtraFillKey("Radio Spots"),
    );
    expect(namedExtraFillKey("  BILLBOARD  ")).toBe(
      namedExtraFillKey("billboard"),
    );
  });

  it("keeps distinct names on distinct slots where it can", () => {
    const names = ["Billboard", "Radio", "Podcast", "Direct mail"];
    const keys = names.map(namedExtraFillKey);
    for (const key of keys) expect(key).toMatch(/^extra-[1-6]$/);
    // Four names must not all collapse onto one swatch.
    expect(new Set(keys).size).toBeGreaterThan(1);
  });

  it("is stable across calls so a colour does not move between paints", () => {
    for (let i = 0; i < 5; i += 1) {
      expect(namedExtraFillKey("Billboard")).toBe(
        namedExtraFillKey("Billboard"),
      );
    }
    expect(NAMED_EXTRA_FILL_COUNT).toBe(6);
  });

  it("falls back to Other for an empty or symbol-only name", () => {
    expect(namedExtraFillKey("")).toBe("other");
    expect(namedExtraFillKey("---")).toBe("other");
    expect(sliceFillKey("")).toBe("other");
  });

  it("leaves the platform resolver alone", () => {
    expect(channelFillKey("Meta Ads")).toBe("meta");
    expect(channelFillKey("Something offline")).toBe("other");
  });
});

describe("displayFillKey — surfaces that only have the name", () => {
  it("keeps Billboard off the grey Other fill", () => {
    expect(displayFillKey("Billboard")).toBe(sliceFillKey("other:billboard"));
    expect(displayFillKey("Billboard")).not.toBe("other");
  });

  it("still greys an unlabeled Other row", () => {
    expect(displayFillKey("Other")).toBe("other");
    expect(displayFillKey("other")).toBe("other");
    expect(displayFillKey("  ")).toBe("other");
  });

  it("resolves known platforms unchanged", () => {
    expect(displayFillKey("Meta Ads")).toBe("meta");
    expect(displayFillKey("Google Ads")).toBe("google");
  });
});
