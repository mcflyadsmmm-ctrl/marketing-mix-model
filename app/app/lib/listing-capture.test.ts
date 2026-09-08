import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyListingCaptureParam,
  formatListingTillLabel,
  listingCaptureFromRequest,
  listingCaptureFromSearchParams,
  listingCaptureHref,
  LISTING_CAPTURE_BOOT_SCRIPT,
  LISTING_CAPTURE_HTML_CLASS,
} from "./listing-capture";

const here = dirname(fileURLToPath(import.meta.url));

describe("listingCaptureFromSearchParams", () => {
  it("treats listing=1 as capture mode", () => {
    expect(
      listingCaptureFromSearchParams(new URLSearchParams("listing=1")),
    ).toBe(true);
  });

  it("accepts shot=1 and capture=1 aliases", () => {
    expect(listingCaptureFromSearchParams(new URLSearchParams("shot=1"))).toBe(
      true,
    );
    expect(
      listingCaptureFromSearchParams(new URLSearchParams("capture=1")),
    ).toBe(true);
  });

  it("stays off without a capture flag", () => {
    expect(
      listingCaptureFromSearchParams(new URLSearchParams("period=mtd")),
    ).toBe(false);
  });

  it("lets listing=0 win over shot=1", () => {
    expect(
      listingCaptureFromSearchParams(
        new URLSearchParams("listing=0&shot=1"),
      ),
    ).toBe(false);
  });

  it("reads the same flags from a Request URL", () => {
    const req = new Request("https://example.test/app/spend?listing=1&period=mtd");
    expect(listingCaptureFromRequest(req)).toBe(true);
  });
});

describe("applyListingCaptureParam / listingCaptureHref", () => {
  it("writes canonical listing=1 plus shot=1", () => {
    const params = applyListingCaptureParam(new URLSearchParams("period=mtd"), true);
    expect(params.get("listing")).toBe("1");
    expect(params.get("shot")).toBe("1");
    expect(params.get("period")).toBe("mtd");
  });

  it("clears all capture keys when disabled", () => {
    const params = applyListingCaptureParam(
      new URLSearchParams("listing=1&shot=1&capture=1&period=mtd"),
      false,
    );
    expect(params.get("listing")).toBeNull();
    expect(params.get("shot")).toBeNull();
    expect(params.get("capture")).toBeNull();
    expect(params.get("period")).toBe("mtd");
  });

  it("preserves path, extra query, and hash on nav hrefs", () => {
    expect(listingCaptureHref("/app/goals?year=2026#board", true)).toBe(
      "/app/goals?year=2026&listing=1&shot=1#board",
    );
    expect(listingCaptureHref("/app/spend", false)).toBe("/app/spend");
  });
});

describe("formatListingTillLabel", () => {
  it("keeps SAMPLE honesty when capture is off", () => {
    expect(
      formatListingTillLabel({
        periodLabel: "MTD",
        useSampleDesk: true,
        listingCapture: false,
      }),
    ).toBe("MTD · SAMPLE");
  });

  it("drops SAMPLE / live / facts suffixes in listing-capture mode", () => {
    expect(
      formatListingTillLabel({
        periodLabel: "MTD",
        useSampleDesk: true,
        listingCapture: true,
      }),
    ).toBe("MTD");
    expect(
      formatListingTillLabel({
        periodLabel: "QTD",
        useSampleDesk: false,
        listingCapture: true,
        salesError: true,
      }),
    ).toBe("QTD");
  });

  it("keeps live-sales honesty when capture is off", () => {
    expect(
      formatListingTillLabel({
        periodLabel: "YTD",
        useSampleDesk: false,
        listingCapture: false,
      }),
    ).toBe("YTD · live sales");
  });

  it("labels a missing deep-history token as a recent window, not a dead desk", () => {
    expect(
      formatListingTillLabel({
        periodLabel: "L12M",
        useSampleDesk: false,
        listingCapture: false,
        factsIncomplete: true,
        recentWindowOnly: true,
      }),
    ).toBe("L12M · recent ~60 days");
  });
});

describe("listing-capture chrome (source + CSS)", () => {
  const appShell = readFileSync(join(here, "../routes/app.tsx"), "utf8");
  const deskCss = readFileSync(join(here, "../styles/mcfly-desk.css"), "utf8");
  const root = readFileSync(join(here, "../root.tsx"), "utf8");
  const deskRoutes = [
    "app._index.tsx",
    "app.spend.tsx",
    "app.goals.tsx",
    "app.ltv.tsx",
    "app.allocation.tsx",
  ].map((name) => ({
    name,
    source: readFileSync(join(here, "../routes", name), "utf8"),
  }));

  it("hides DataModeBar when listing-capture / shotMode is on", () => {
    expect(appShell).toContain("listingCaptureFromRequest");
    expect(appShell).toContain("DataModeBar");
    expect(appShell).toMatch(/!shotMode\s*\?\s*\(?\s*<DataModeBar/);
    expect(appShell).toContain("listingCaptureHref");
  });

  it("boots capture class before paint on /app routes", () => {
    expect(root).toContain("LISTING_CAPTURE_BOOT_SCRIPT");
    expect(LISTING_CAPTURE_BOOT_SCRIPT).toContain(LISTING_CAPTURE_HTML_CLASS);
    expect(LISTING_CAPTURE_BOOT_SCRIPT).toContain("listing");
  });

  it("CSS suppresses SAMPLE banner, data-mode bar, and shot corner badge", () => {
    expect(deskCss).toContain(`.${LISTING_CAPTURE_HTML_CLASS} .mcfly-data-mode`);
    expect(deskCss).toMatch(
      /\.mcfly-listing-capture[\s\S]{0,400}display:\s*none/i,
    );
    expect(deskCss).toContain(
      ".mcfly-desk--listing.mcfly-desk--sample::after",
    );
    expect(deskCss).toContain(
      ".mcfly-desk--shot.mcfly-desk--sample::after",
    );
    // Corner badge must not paint SAMPLE in listing/shot mode.
    const badgeBlock = deskCss.slice(
      deskCss.indexOf(".mcfly-desk--shot.mcfly-desk--sample::after"),
    );
    expect(badgeBlock.slice(0, 400)).toMatch(/display:\s*none/i);
    expect(badgeBlock.slice(0, 400)).not.toMatch(/content:\s*["']SAMPLE["']/);
  });

  it("desk shot routes use the shared listing-capture helper", () => {
    for (const route of deskRoutes) {
      expect(route.source, route.name).toContain("listingCaptureFromRequest");
      expect(route.source, route.name).not.toMatch(
        /searchParams\.get\(["']shot["']\)\s*===\s*["']1["']/,
      );
    }
  });
});

describe("listing-capture docs", () => {
  it("documents the five Partner shot URLs", () => {
    const docs = readFileSync(
      join(here, "../../../docs/LISTING_CAPTURE.md"),
      "utf8",
    );
    expect(docs).toContain("/app?period=mtd&listing=1");
    expect(docs).toContain("/app/spend?listing=1");
    expect(docs).toContain("/app/goals?listing=1");
    expect(docs).toContain("/app/ltv?period=mtd&listing=1");
    expect(docs).toContain("/app/allocation?period=mtd&listing=1");
    expect(docs).toContain("1600×900");
    expect(docs).toContain("listing=0");
  });
});
