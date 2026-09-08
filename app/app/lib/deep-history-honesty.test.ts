import { describe, expect, it } from "vitest";
import { PRODUCT_NOUN } from "./product-labels";
import {
  CASH_NOT_ATTRIBUTION,
  DEEP_HISTORY_GRANT_COPY,
  DEEP_HISTORY_GRANT_PATH,
  deepHistoryGrantHref,
  deepHistoryHonestyCopy,
  resolveDeepHistoryHonesty,
} from "./deep-history-honesty";

const THEATER =
  /pixel|web pixel|multi-touch|mta|markov|shapley|meridian|robyn|true roas|view-through|path credit/i;

describe("deepHistoryGrantHref", () => {
  it("uses the existing /auth?shop= reauth path — not a homemade OAuth URL", () => {
    expect(deepHistoryGrantHref("acme.myshopify.com")).toBe(
      `${DEEP_HISTORY_GRANT_PATH}?shop=acme.myshopify.com`,
    );
    expect(deepHistoryGrantHref("  acme.myshopify.com  ")).toBe(
      `${DEEP_HISTORY_GRANT_PATH}?shop=acme.myshopify.com`,
    );
    expect(deepHistoryGrantHref("")).toBe(DEEP_HISTORY_GRANT_PATH);
    expect(deepHistoryGrantHref("acme.myshopify.com")).not.toMatch(
      /oauth\/authorize|myshopify\.com\/admin\/oauth/i,
    );
  });
});

describe("resolveDeepHistoryHonesty", () => {
  it("shows a grant CTA when the token lacks read_all_orders", () => {
    expect(
      resolveDeepHistoryHonesty({
        hasReadAllOrders: false,
        periodWiderThanRecentWindow: false,
      }),
    ).toEqual({
      kind: "missing_scope",
      showGrantCta: true,
      historyLimitedDesk: false,
    });
    expect(
      resolveDeepHistoryHonesty({
        hasReadAllOrders: false,
        periodWiderThanRecentWindow: true,
        factsIncomplete: true,
      }),
    ).toEqual({
      kind: "missing_scope_wide",
      showGrantCta: true,
      historyLimitedDesk: true,
    });
  });

  it("calls incomplete facts backfilling — not broken — after grant", () => {
    expect(
      resolveDeepHistoryHonesty({
        hasReadAllOrders: true,
        factsIncomplete: true,
        periodWiderThanRecentWindow: true,
      }),
    ).toEqual({
      kind: "backfilling",
      showGrantCta: false,
      historyLimitedDesk: false,
    });
  });

  it("hides on SAMPLE, shot, and a complete granted desk", () => {
    expect(
      resolveDeepHistoryHonesty({
        hasReadAllOrders: false,
        useSampleDesk: true,
      }).kind,
    ).toBe("hidden");
    expect(
      resolveDeepHistoryHonesty({
        hasReadAllOrders: false,
        shotMode: true,
      }).kind,
    ).toBe("hidden");
    expect(
      resolveDeepHistoryHonesty({
        hasReadAllOrders: true,
        factsIncomplete: false,
      }).kind,
    ).toBe("hidden");
  });
});

describe("deep-history copy", () => {
  it("is Partner-safe: Shopify prompt, recent window, not permanently dead", () => {
    const missing = deepHistoryHonestyCopy("missing_scope");
    const wide = deepHistoryHonestyCopy("missing_scope_wide");
    const backfill = deepHistoryHonestyCopy("backfilling");
    expect(missing?.heading).toBe(DEEP_HISTORY_GRANT_COPY.heading);
    expect(missing?.heading).toMatch(/optional/i);
    expect(missing?.body).toMatch(/Shopify will prompt/i);
    expect(missing?.body).toMatch(/~60 days/i);
    expect(missing?.body).toMatch(/Not required for a trusted MTD/i);
    expect(wide?.body).toMatch(/recent ~60-day/i);
    expect(wide?.body).toMatch(/open MTD/i);
    expect(wide?.body).toMatch(/not permanently empty/i);
    expect(wide?.body).not.toMatch(/permanently dead/i);
    expect(backfill?.heading).toMatch(/backfilling/i);
    expect(backfill?.body).toMatch(/not permanently limited/i);
    expect(DEEP_HISTORY_GRANT_COPY.cta).toMatch(/permissions/i);

    const blob = [
      DEEP_HISTORY_GRANT_COPY.heading,
      DEEP_HISTORY_GRANT_COPY.body,
      DEEP_HISTORY_GRANT_COPY.recentWindowBody,
      DEEP_HISTORY_GRANT_COPY.backfillHeading,
      DEEP_HISTORY_GRANT_COPY.backfillBody,
      DEEP_HISTORY_GRANT_COPY.cta,
      CASH_NOT_ATTRIBUTION,
    ].join("\n");
    expect(blob).not.toMatch(/when Shopify approves/i);
    expect(blob).not.toMatch(/oauth client|paste a token/i);
    expect(blob).toMatch(/not pixel attribution/i);
    expect(CASH_NOT_ATTRIBUTION).toMatch(/spend you added/i);
    expect(CASH_NOT_ATTRIBUTION).toMatch(/Shopify sales/i);
    expect(CASH_NOT_ATTRIBUTION).toContain(PRODUCT_NOUN.totalRoas);
    // "pixel attribution" is the anti-theater line — the theater regex
    // would false-positive on that phrase, so exclude it from the check.
    expect(blob.replace(/not pixel attribution/gi, "")).not.toMatch(THEATER);
  });

  it("returns null for hidden", () => {
    expect(deepHistoryHonestyCopy("hidden")).toBeNull();
  });
});
