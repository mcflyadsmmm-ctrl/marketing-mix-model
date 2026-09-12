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

  it("Overview does not mount ReviewAsk — Shopify depth first (FRESH_START)", () => {
    // Fresh start removed review chrome from Overview so the first job stays
    // operator craft (orders / LTV), not App Store ask. Component stays ready.
    expect(overview).not.toContain("<ReviewAsk");
    expect(overview).not.toContain("decideReviewAsk");
    expect(overview).toContain("buildOpsDeskIsland");
  });

  it("ReviewAsk still fail-closes on incomplete / history-capped desks", () => {
    expect(reviewAsk).toContain("decideReviewAskReveal");
    const stickiness = readFileSync(
      join(here, "../lib/install-stickiness.ts"),
      "utf8",
    );
    expect(stickiness).toContain("export function decideReviewAsk");
    expect(stickiness).toContain("historyLimited");
    expect(stickiness).toContain("factsIncomplete");
  });
});
