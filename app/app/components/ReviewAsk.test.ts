import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  REVIEW_ASK_LISTING_HREF,
  REVIEW_ASK_MIN_INSTALL_DAYS,
  reviewAskEligible,
} from "./ReviewAsk";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string): string {
  return readFileSync(join(here, rel), "utf8");
}

const ASK_BODY =
  "A listing review is optional — only if Mcfly is useful.";

describe("reviewAskEligible", () => {
  const now = new Date("2026-09-10T18:00:00.000Z");

  it("waits seven days after install even when spend exists", () => {
    expect(REVIEW_ASK_MIN_INSTALL_DAYS).toBe(7);
    expect(
      reviewAskEligible({
        hasLiveSpend: true,
        useSampleDesk: false,
        shotMode: false,
        installedAt: "2026-09-09T18:00:00.000Z",
        now,
      }),
    ).toBe(false);
    expect(
      reviewAskEligible({
        hasLiveSpend: true,
        useSampleDesk: false,
        shotMode: false,
        installedAt: "2026-09-03T18:00:00.000Z",
        now,
      }),
    ).toBe(true);
  });

  it("stays off Sample, shot, and missing spend", () => {
    const installedAt = "2026-08-01T00:00:00.000Z";
    expect(
      reviewAskEligible({
        hasLiveSpend: false,
        useSampleDesk: false,
        installedAt,
        now,
      }),
    ).toBe(false);
    expect(
      reviewAskEligible({
        hasLiveSpend: true,
        useSampleDesk: true,
        installedAt,
        now,
      }),
    ).toBe(false);
    expect(
      reviewAskEligible({
        hasLiveSpend: true,
        useSampleDesk: false,
        shotMode: true,
        installedAt,
        now,
      }),
    ).toBe(false);
  });
});

describe("ReviewAsk", () => {
  it("is gated on live spend plus install age and stays off Overview chrome", () => {
    const ask = read("ReviewAsk.tsx");
    const shell = read("../routes/app.tsx");
    const ltv = read("../routes/app.ltv.tsx");

    expect(ask).toContain("hasLiveSpend");
    expect(ask).toContain("useSampleDesk");
    expect(ask).toContain("shotMode");
    expect(ask).toContain("installedAt");
    expect(ask).toContain("reviewAskEligible");
    expect(ask).toContain("REVIEW_ASK_MIN_INSTALL_DAYS");
    expect(ask).not.toContain("reviews?.request");
    expect(ask).not.toContain("requestAppStoreReview");
    expect(ask).toContain("mcfly.reviewAsk.dismissed");
    expect(ask).toContain("localStorage");
    expect(ask).not.toContain("sessionStorage");
    expect(ask).toContain(REVIEW_ASK_LISTING_HREF);
    expect(ask).toContain("mcfly-review-ask");
    expect(ask).not.toContain("s-banner");

    expect(shell).not.toContain("<ReviewAsk");
    expect(shell).toContain("<DataModeBar");
    const originChunk = shell.slice(
      shell.indexOf("<OriginShell>"),
      shell.indexOf("</OriginShell>") + "</OriginShell>".length,
    );
    expect(originChunk).toContain("OriginShell");
    expect(originChunk).not.toContain("ReviewAsk");

    expect(ltv).toContain("<ReviewAsk");
    expect(ltv).toContain("hasLiveSpend={hasLiveSpend}");
    expect(ltv).toContain("installedAt={installedAt}");
    expect(ltv.indexOf("<ReviewAsk")).toBeGreaterThan(
      ltv.indexOf("PRODUCT_NOUN.ltvTitle"),
    );
  });

  it("asks for an App Store review without forbidden incentive wording", () => {
    const ask = read("ReviewAsk.tsx");
    expect(ask).toContain(ASK_BODY);
    expect(ask).toContain('listing: "App Store listing"');
    expect(ask).not.toContain("Review Mcfly Analytics");
    expect(ask).not.toContain("Open listing");
    expect(ask).toContain(REVIEW_ASK_LISTING_HREF);
    expect(ask).not.toMatch(/\bpositive\b/i);
    expect(ask).not.toMatch(/5-star|five.?star/i);
    expect(ask).not.toMatch(/\bdiscount\b/i);
    expect(ask).not.toMatch(/\bunlock(?:ed|s|ing)?\b/i);
    expect(ask).not.toMatch(/leave a review/i);
  });
});
