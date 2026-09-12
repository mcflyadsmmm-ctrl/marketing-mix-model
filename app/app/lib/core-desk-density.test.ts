import { describe, expect, it } from "vitest";
import {
  SAMPLE_DESK_FEATURE_ENABLED,
  sampleDeskFeatureEnabled,
} from "./sample-desk-feature";
import { depthFeaturesForTab } from "./shopify-depth-catalog";

describe("sample desk feature gate", () => {
  it("exposes a single kill switch for SAMPLE", () => {
    // While SAMPLE is temporary, the switch must exist and be boolean.
    expect(typeof SAMPLE_DESK_FEATURE_ENABLED).toBe("boolean");
    expect(sampleDeskFeatureEnabled()).toBe(SAMPLE_DESK_FEATURE_ENABLED);
  });
});

describe("core desk is day-fact first on Sales", () => {
  it("sales core charts only need day_facts (works for young stores)", () => {
    const core = depthFeaturesForTab("sales", "core");
    expect(core.length).toBeGreaterThan(5);
    for (const f of core) {
      expect(f.needs).toBe("day_facts");
    }
  });

  it("customers core includes a day_facts chart for thin history", () => {
    const core = depthFeaturesForTab("customers", "core");
    expect(core.some((f) => f.needs === "day_facts")).toBe(true);
  });
});
