import { describe, expect, it } from "vitest";
import { PRODUCT_NOUN } from "./product-labels";
import {
  decideReviewAsk,
  decideReviewAskReveal,
  firstOpenRedirect,
  FIRST_TRUSTED_MER_MINUTES,
  isTrustedMer,
  REVIEW_ASK_COPY,
  REVIEW_MIN_INSTALL_MS,
  REVIEW_MIN_SESSION_MS,
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
  it("asks only after trusted MER, 24h, live scoreboard, and not SAMPLE", () => {
    expect(
      decideReviewAsk({
        useSampleDesk: false,
        trustedMer: true,
        installedAt: INSTALLED_OK,
        now: NOW,
        scoreboardReady: true,
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
        scoreboardReady: true,
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
        scoreboardReady: true,
      }).reason,
    ).toBe("untrusted_mer");
  });

  it("refuses empty / sales-error scoreboards even if mer looks trusted", () => {
    expect(
      decideReviewAsk({
        useSampleDesk: false,
        trustedMer: true,
        installedAt: INSTALLED_OK,
        now: NOW,
        scoreboardReady: false,
      }).reason,
    ).toBe("empty");
  });

  it("refuses installs younger than 24h", () => {
    const installed = new Date(NOW.getTime() - REVIEW_MIN_INSTALL_MS + 60_000);
    expect(
      decideReviewAsk({
        useSampleDesk: false,
        trustedMer: true,
        installedAt: installed,
        now: NOW,
        scoreboardReady: true,
      }).reason,
    ).toBe("too_soon");
  });

  it("asks at exactly 24h", () => {
    const installed = new Date(NOW.getTime() - REVIEW_MIN_INSTALL_MS);
    expect(
      decideReviewAsk({
        useSampleDesk: false,
        trustedMer: true,
        installedAt: installed,
        now: NOW,
        scoreboardReady: true,
      }),
    ).toEqual({ ask: true, reason: "ok" });
  });

  it("refuses an unparseable install time", () => {
    expect(
      decideReviewAsk({
        useSampleDesk: false,
        trustedMer: true,
        installedAt: "not-a-date",
        now: NOW,
        scoreboardReady: true,
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
        scoreboardReady: true,
      }).reason,
    ).toBe("shot");
  });
});

describe("decideReviewAskReveal", () => {
  const sessionStart = NOW.getTime();

  it("reveals only after 60s dwell, with Reviews API, and not dismissed", () => {
    expect(
      decideReviewAskReveal({
        eligible: true,
        dismissed: false,
        reviewsApiAvailable: true,
        sessionStartedAt: sessionStart,
        now: sessionStart + REVIEW_MIN_SESSION_MS,
      }),
    ).toEqual({ show: true, reason: "ok" });
  });

  it("refuses the first 60 seconds of a trusted-desk session", () => {
    expect(
      decideReviewAskReveal({
        eligible: true,
        dismissed: false,
        reviewsApiAvailable: true,
        sessionStartedAt: sessionStart,
        now: sessionStart + REVIEW_MIN_SESSION_MS - 1,
      }).reason,
    ).toBe("session_too_soon");
  });

  it("refuses until session start is known", () => {
    expect(
      decideReviewAskReveal({
        eligible: true,
        dismissed: false,
        reviewsApiAvailable: true,
        sessionStartedAt: null,
        now: sessionStart + REVIEW_MIN_SESSION_MS,
      }).reason,
    ).toBe("session_too_soon");
  });

  it("stays off when the server gate said no", () => {
    expect(
      decideReviewAskReveal({
        eligible: false,
        dismissed: false,
        reviewsApiAvailable: true,
        sessionStartedAt: sessionStart,
        now: sessionStart + REVIEW_MIN_SESSION_MS,
      }).reason,
    ).toBe("off");
  });

  it("stays off after dismiss", () => {
    expect(
      decideReviewAskReveal({
        eligible: true,
        dismissed: true,
        reviewsApiAvailable: true,
        sessionStartedAt: sessionStart,
        now: sessionStart + REVIEW_MIN_SESSION_MS,
      }).reason,
    ).toBe("dismissed");
  });

  it("hides the button when Reviews API is missing", () => {
    expect(
      decideReviewAskReveal({
        eligible: true,
        dismissed: false,
        reviewsApiAvailable: false,
        sessionStartedAt: sessionStart,
        now: sessionStart + REVIEW_MIN_SESSION_MS,
      }).reason,
    ).toBe("no_api");
  });
});

describe("REVIEW_ASK_COPY", () => {
  it("is post-value Total ROAS copy — no theater, no SAMPLE, no auto-guilt", () => {
    const blob = [
      REVIEW_ASK_COPY.heading,
      REVIEW_ASK_COPY.body,
      REVIEW_ASK_COPY.acceptLabel,
      REVIEW_ASK_COPY.dismissLabel,
    ].join("\n");
    expect(REVIEW_ASK_COPY.heading).toMatch(/Total ROAS/i);
    expect(REVIEW_ASK_COPY.body).toMatch(/sales ÷ spend/i);
    expect(REVIEW_ASK_COPY.body).toMatch(/not required/i);
    expect(REVIEW_ASK_COPY.acceptLabel).toMatch(/review/i);
    expect(blob).not.toMatch(THEATER);
    expect(blob).not.toMatch(/sample/i);
    expect(blob).not.toMatch(/unlock|seamless|get excited/i);
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
