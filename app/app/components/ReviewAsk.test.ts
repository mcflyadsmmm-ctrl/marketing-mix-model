import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const reviewAsk = readFileSync(join(here, "ReviewAsk.tsx"), "utf8");
const overview = readFileSync(join(here, "../routes/app._index.tsx"), "utf8");

describe("ReviewAsk wiring", () => {
  it("never auto-calls Reviews API — button only, after 60s dwell", () => {
    expect(reviewAsk).toContain("REVIEW_MIN_SESSION_MS");
    expect(reviewAsk).toContain("decideReviewAskReveal");
    expect(reviewAsk).toContain("REVIEW_ASK_COPY");
    expect(reviewAsk).toMatch(/onClick=\{\(\) => void requestReview\(\)\}/);
    const effect = reviewAsk.match(
      /useEffect\(\(\) => \{[\s\S]*?\}, \[eligible\]\);/,
    )?.[0];
    expect(effect).toBeTruthy();
    expect(effect).not.toMatch(/requestReview|reviews\?\.request\s*\(/);
  });

  it("Overview asks only after the live Total ROAS hero, never SAMPLE/empty/shot", () => {
    const heroAt = overview.indexOf("TotalRoasGauge");
    const askAt = overview.indexOf("<ReviewAsk");
    expect(heroAt).toBeGreaterThan(0);
    expect(askAt).toBeGreaterThan(heroAt);
    expect(overview).toMatch(
      /scoreboardReady && !useSampleDesk \? \(\s*<ReviewAsk eligible=\{reviewAskEligible\} \/>/,
    );
    expect(overview).toMatch(/scoreboardReady:/);
    expect(overview).toMatch(/!useSampleDesk/);
    expect(overview).toMatch(/salesError/);
  });
});
