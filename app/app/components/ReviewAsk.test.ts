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

  it("re-polls for App Bridge instead of sampling shopify.reviews once", () => {
    const effect = reviewAsk.match(
      /useEffect\(\(\) => \{[\s\S]*?\}, \[eligible\]\);/,
    )?.[0];
    expect(effect).toMatch(/window\.setInterval\(/);
    // The late attach must be able to turn the ask back on.
    expect(effect).toMatch(/reviewsApiReady\(\)[\s\S]*?setApiAvailable\(true\)/);
    // Bounded: polling stops at the deadline and on unmount.
    expect(effect).toMatch(/Date\.now\(\) >= deadline/);
    expect(effect).toMatch(/window\.clearInterval\(pollTimer\)/);
    expect(reviewAsk).toContain("API_POLL_MAX_MS = 2 * REVIEW_MIN_SESSION_MS");
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
    expect(overview).toMatch(/historyLimited:/);
    expect(overview).toMatch(/factsIncomplete:/);
  });

  it("Overview does not ask over a period the fact window cannot cover", () => {
    const askCall = overview.match(/decideReviewAsk\(\{[\s\S]*?\}\)\.ask/)?.[0];
    expect(askCall).toBeTruthy();
    expect(askCall).toContain("periodExceedsFactWindow");
  });
});
