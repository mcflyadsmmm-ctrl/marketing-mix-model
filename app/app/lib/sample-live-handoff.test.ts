import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  isLiveHandoffGuide,
  LIVE_HANDOFF_BODY,
  LIVE_HANDOFF_GUIDE,
  LIVE_HANDOFF_HEADING,
  SAMPLE_LEDGER_HANDOFF,
  SAMPLE_SPEND_NOT_LIVE,
  TRIAL_VS_VIEW,
} from "./sample-live-handoff";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("SAMPLE → Live handoff", () => {
  it("recognizes the guide=real landing Settings already writes", () => {
    expect(isLiveHandoffGuide("real")).toBe(true);
    expect(isLiveHandoffGuide("REAL")).toBe(true);
    expect(isLiveHandoffGuide(LIVE_HANDOFF_GUIDE)).toBe(true);
    expect(isLiveHandoffGuide("sample")).toBe(false);
    expect(isLiveHandoffGuide(null)).toBe(false);
    expect(isLiveHandoffGuide("")).toBe(false);
  });

  it("never claims SAMPLE dollars become live spend or that trial is the switch", () => {
    const corpus = [
      LIVE_HANDOFF_HEADING,
      LIVE_HANDOFF_BODY,
      SAMPLE_SPEND_NOT_LIVE,
      SAMPLE_LEDGER_HANDOFF,
      TRIAL_VS_VIEW,
    ].join(" ");
    expect(corpus).toMatch(/SAMPLE spend did not transfer|do not become yours|stay SAMPLE/i);
    expect(corpus).toMatch(/Spend Upload/);
    expect(corpus).toMatch(/billing/i);
    expect(corpus).not.toMatch(/0×|0x/i);
    expect(corpus).not.toMatch(/copied|transferred your spend/i);
  });

  it("Overview paints guide=real and labels SAMPLE ROAS as example spend", () => {
    const overview = read("../routes/app._index.tsx");
    const firstView = read("../components/OverviewFirstViewport.tsx");
    expect(overview).toContain("isLiveHandoffGuide");
    expect(overview).toContain("LIVE_HANDOFF_HEADING");
    expect(overview).toContain("LIVE_HANDOFF_BODY");
    expect(overview).toContain('searchParams.get("guide")');
    expect(overview).toContain("useSampleDesk={useSampleDesk}");
    expect(firstView).toContain("SAMPLE_SPEND_NOT_LIVE");
    expect(firstView).toContain("Example spend · Live is parked");
    expect(firstView).toContain("OVERVIEW_SPEND_DOOR_LINE");
    expect(firstView).not.toContain("Edit spend →");
  });

  it("Settings and data-mode still stamp guide=real on the Live switch", () => {
    const settings = read("../routes/app.settings.tsx");
    const dataMode = read("../routes/app.data-mode.tsx");
    expect(settings).toContain('url.searchParams.set("guide", "real")');
    expect(dataMode).toContain('params.set("guide", guide)');
    expect(dataMode).toContain('"real"');
  });

  it("Spend SAMPLE ledger and Goals trial copy stay honest", () => {
    const spend = read("../routes/app.spend.tsx");
    const goals = read("../routes/app.goals.tsx");
    const settings = read("../routes/app.settings.tsx");
    expect(spend).toContain("SAMPLE_LEDGER_HANDOFF");
    expect(goals).toContain("TRIAL_VS_VIEW");
    expect(settings).toContain("TRIAL_VS_VIEW");
    expect(settings).toContain("SAMPLE dollars do not transfer");
  });
});
