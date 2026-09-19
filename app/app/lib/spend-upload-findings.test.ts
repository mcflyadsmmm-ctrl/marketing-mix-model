import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CERTIFIED_WINDOWS_KICKER,
  HONEST_MER_LINE,
  spendUploadEmptyFinding,
  totalRoasEmptySpendFinding,
} from "./spend-upload-findings";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("spend upload findings", () => {
  it("frames empty Spend Upload as Signal / Evidence / Next, never 0× theater", () => {
    const finding = spendUploadEmptyFinding();
    expect(finding.signal).toMatch(/no spend/i);
    expect(finding.evidence).toMatch(/not a certified \$0/i);
    expect(finding.evidence).toMatch(/never paints 0×/i);
    expect(finding.next).toMatch(/yesterday|CSV/i);
    expect(finding.next).toMatch(/no Ads Manager login/i);
    expect(JSON.stringify(finding)).not.toContain("0.00×");
    expect(JSON.stringify(finding)).not.toMatch(/Profit Agent|pixel|OAuth/i);
  });

  it("frames empty Total ROAS as honest MER = sales ÷ entered spend", () => {
    const finding = totalRoasEmptySpendFinding();
    expect(finding.signal).toMatch(/entered spend/i);
    expect(finding.evidence).toBe(HONEST_MER_LINE);
    expect(HONEST_MER_LINE).toMatch(/entered spend/i);
    expect(HONEST_MER_LINE).toMatch(/not attributed campaign ROAS/i);
    expect(finding.next).toMatch(/Upload Spend/i);
    expect(finding.next).toMatch(/Settings/i);
    expect(JSON.stringify(finding)).not.toContain("0.00×");
  });

  it("keeps certified-window kicker At goal vs Settings", () => {
    expect(CERTIFIED_WINDOWS_KICKER).toMatch(/Certified windows/i);
    expect(CERTIFIED_WINDOWS_KICKER).toMatch(/honest MER/i);
    expect(CERTIFIED_WINDOWS_KICKER).toMatch(/At goal vs Settings/i);
  });

  it("mounts the finding strip on Spend Upload empty and Total ROAS empty", () => {
    const spend = read("../routes/app.spend.tsx");
    const roas = read("../routes/app.roas.tsx");
    const strip = read("../components/SpendFindingStrip.tsx");
    const scoreboard = read("../components/CertifiedScoreboard.tsx");

    expect(strip).toContain("Signal");
    expect(strip).toContain("Evidence");
    expect(strip).toContain("Next move");
    expect(strip).toContain("mcfly-book__clock");

    expect(spend).toContain("SpendFindingStrip");
    expect(spend).toContain("spendUploadEmptyFinding");
    expect(spend).toContain("strangerEmpty");

    expect(roas).toContain("SpendFindingStrip");
    expect(roas).toContain("totalRoasEmptySpendFinding");
    expect(roas).toContain("HONEST_MER_LINE");
    expect(roas).not.toContain("0.00×");

    expect(scoreboard).toContain("CERTIFIED_WINDOWS_KICKER");
    expect(scoreboard).toContain("At goal");
    expect(scoreboard).toContain("mcfly-well");
    expect(scoreboard).toContain("mcfly-scoreboard--certified");
    expect(scoreboard).not.toContain("0.00×");
  });

  it("does not put spend doors on Overview", () => {
    const overview = read("../routes/app._index.tsx");
    expect(overview).not.toContain("spendUploadEmptyFinding");
    expect(overview).not.toContain("SpendFindingStrip");
    expect(overview).not.toContain("HONEST_MER_LINE");
  });
});
