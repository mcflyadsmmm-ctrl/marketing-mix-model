import { describe, expect, it } from "vitest";
import { PRODUCT_NOUN } from "./product-labels";
import {
  decideReviewAsk,
  firstOpenRedirect,
  FIRST_TRUSTED_MER_MINUTES,
  isTrustedMer,
  REVIEW_MIN_INSTALL_MS,
  resolveActivationStep,
  spendEmptyTeach,
  spendSkipHref,
} from "./install-stickiness";

const THEATER =
  /pixel|web pixel|multi-touch|mta|markov|shapley|meridian|robyn|true roas|view-through|path credit/i;

const INSTALLED_OK = new Date("2026-09-01T12:00:00.000Z");
const NOW = new Date("2026-09-08T12:00:00.000Z");

describe("resolveActivationStep", () => {
  it("starts cold live merchants on margin, then spend, then desk", () => {
    expect(
      resolveActivationStep({
        marginConfirmed: false,
        hasLiveSpend: false,
        useSampleDesk: false,
      }),
    ).toBe("margin");
    expect(
      resolveActivationStep({
        marginConfirmed: true,
        hasLiveSpend: false,
        useSampleDesk: false,
      }),
    ).toBe("spend");
    expect(
      resolveActivationStep({
        marginConfirmed: true,
        hasLiveSpend: true,
        useSampleDesk: false,
      }),
    ).toBe("desk");
  });

  it("treats SAMPLE as desk practice — never a live activation bounce", () => {
    expect(
      resolveActivationStep({
        marginConfirmed: false,
        hasLiveSpend: false,
        useSampleDesk: true,
      }),
    ).toBe("desk");
  });
});

describe("firstOpenRedirect", () => {
  it("bounces Overview to Settings, then Spend, then stays for trusted desk", () => {
    expect(
      firstOpenRedirect({
        pathname: "/app",
        marginConfirmed: false,
        hasLiveSpend: false,
        useSampleDesk: false,
      }),
    ).toBe("/app/settings?activate=1");
    expect(
      firstOpenRedirect({
        pathname: "/app",
        marginConfirmed: true,
        hasLiveSpend: false,
        useSampleDesk: false,
      }),
    ).toBe("/app/spend?activate=1");
    expect(
      firstOpenRedirect({
        pathname: "/app",
        marginConfirmed: true,
        hasLiveSpend: true,
        useSampleDesk: false,
      }),
    ).toBeNull();
  });

  it("never bounces SAMPLE, shot, stay=1, or non-Overview routes", () => {
    expect(
      firstOpenRedirect({
        pathname: "/app",
        marginConfirmed: false,
        hasLiveSpend: false,
        useSampleDesk: true,
      }),
    ).toBeNull();
    expect(
      firstOpenRedirect({
        pathname: "/app",
        marginConfirmed: false,
        hasLiveSpend: false,
        useSampleDesk: false,
        shotMode: true,
      }),
    ).toBeNull();
    expect(
      firstOpenRedirect({
        pathname: "/app",
        search: "?stay=1",
        marginConfirmed: false,
        hasLiveSpend: false,
        useSampleDesk: false,
      }),
    ).toBeNull();
    expect(
      firstOpenRedirect({
        pathname: "/app/spend",
        marginConfirmed: false,
        hasLiveSpend: false,
        useSampleDesk: false,
      }),
    ).toBeNull();
  });

  it("keeps period query when activating", () => {
    expect(
      firstOpenRedirect({
        pathname: "/app",
        search: "?period=mtd",
        marginConfirmed: false,
        hasLiveSpend: false,
        useSampleDesk: false,
      }),
    ).toBe("/app/settings?period=mtd&activate=1");
  });

  it("offers a Spend skip that does not return to Settings", () => {
    expect(spendSkipHref("?period=mtd")).toBe(
      "/app/spend?period=mtd&activate=1",
    );
  });
});

describe("spendEmptyTeach", () => {
  it("teaches template download first — never a Pro wall", () => {
    const teach = spendEmptyTeach({
      templateHref: "/app/spend/template?platforms=meta%2Cgoogle&blank=1",
    });
    expect(teach.primaryLabel).toMatch(/template/i);
    expect(teach.primaryHref).toContain("/app/spend/template");
    expect(teach.heading).toContain(String(FIRST_TRUSTED_MER_MINUTES));
    expect(teach.body).toContain(PRODUCT_NOUN.definition);
    expect(teach.steps[0]).toMatch(/Free/i);
    const blob = [teach.heading, teach.body, teach.primaryLabel, ...teach.steps].join(
      "\n",
    );
    expect(blob).not.toMatch(/upgrade|pro ·|\$39/i);
    expect(blob).not.toMatch(THEATER);
    expect(blob).not.toMatch(/syncwith|oauth/i);
  });
});

describe("decideReviewAsk", () => {
  it("asks only after trusted MER, 24h, and not SAMPLE", () => {
    expect(
      decideReviewAsk({
        useSampleDesk: false,
        trustedMer: true,
        installedAt: INSTALLED_OK,
        now: NOW,
      }),
    ).toEqual({ ask: true, reason: "ok" });
  });

  it("refuses SAMPLE even when numbers look trusted", () => {
    expect(
      decideReviewAsk({
        useSampleDesk: true,
        trustedMer: true,
        installedAt: INSTALLED_OK,
        now: NOW,
      }).reason,
    ).toBe("sample");
  });

  it("refuses before trusted MER", () => {
    expect(
      decideReviewAsk({
        useSampleDesk: false,
        trustedMer: false,
        installedAt: INSTALLED_OK,
        now: NOW,
      }).reason,
    ).toBe("untrusted_mer");
  });

  it("refuses installs younger than 24h", () => {
    const installed = new Date(NOW.getTime() - REVIEW_MIN_INSTALL_MS + 60_000);
    expect(
      decideReviewAsk({
        useSampleDesk: false,
        trustedMer: true,
        installedAt: installed,
        now: NOW,
      }).reason,
    ).toBe("too_soon");
  });

  it("refuses shot mode", () => {
    expect(
      decideReviewAsk({
        useSampleDesk: false,
        trustedMer: true,
        installedAt: INSTALLED_OK,
        now: NOW,
        shotMode: true,
      }).reason,
    ).toBe("shot");
  });
});

describe("isTrustedMer", () => {
  it("requires live spend and a finite sales ÷ spend multiple", () => {
    expect(
      isTrustedMer({
        useSampleDesk: false,
        hasLiveSpend: true,
        mer: 3.5,
      }),
    ).toBe(true);
    expect(
      isTrustedMer({
        useSampleDesk: false,
        hasLiveSpend: true,
        mer: null,
      }),
    ).toBe(false);
    expect(
      isTrustedMer({
        useSampleDesk: true,
        hasLiveSpend: true,
        mer: 3.5,
      }),
    ).toBe(false);
    expect(
      isTrustedMer({
        useSampleDesk: false,
        hasLiveSpend: true,
        mer: 3.5,
        blockedMockAsLive: true,
      }),
    ).toBe(false);
  });
});
