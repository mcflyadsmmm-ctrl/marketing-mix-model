import { describe, expect, it, vi } from "vitest";
import {
  parsePartnerSubscriptionPayload,
  partnerApiUrl,
  queryPartnerActiveSubscription,
  readPartnerBillingConfig,
  shopifyGid,
} from "./partner-subscription.server";

const NOW = new Date("2026-09-24T00:00:00.000Z");

describe("parsePartnerSubscriptionPayload", () => {
  it("reads a flat paid cycle and ignores a GMV tier", () => {
    const paid = parsePartnerSubscriptionPayload(
      {
        data: {
          activeSubscription: {
            billingPeriod: "EVERY_30_DAYS",
            cancelAtEndOfCycle: false,
            trialEndsAt: null,
            currentBillingCycle: { endTime: "2026-10-24T00:00:00.000Z" },
            items: [
              {
                handle: "mcfly-analytics",
                price: { __typename: "FlatRatePrice", amount: "39.00", currency: "USD" },
              },
            ],
            legacySubscriptionId: null,
          },
        },
      },
      NOW,
    );
    expect(paid).toMatchObject({
      status: "flat",
      inTrial: false,
      amount: 39,
      currency: "USD",
      paidCycleEndsAt: "2026-10-24T00:00:00.000Z",
    });

    const gmv = parsePartnerSubscriptionPayload(
      {
        data: {
          activeSubscription: {
            cancelAtEndOfCycle: false,
            trialEndsAt: null,
            currentBillingCycle: { endTime: "2026-10-24T00:00:00.000Z" },
            items: [
              {
                handle: "gmv",
                price: { __typename: "TieredPrice", tiersMode: "VOLUME" },
              },
            ],
          },
        },
      },
      NOW,
    );
    expect(gmv.status).toBe("tiered");
  });

  it("treats a future trial end as a trial and does not keep the cycle as paid", () => {
    const parsed = parsePartnerSubscriptionPayload(
      {
        data: {
          activeSubscription: {
            cancelAtEndOfCycle: false,
            trialEndsAt: "2026-10-01T00:00:00.000Z",
            currentBillingCycle: null,
            items: [
              {
                price: { __typename: "FlatRatePrice", amount: "39.0", currency: "USD" },
              },
            ],
          },
        },
      },
      NOW,
    );
    expect(parsed).toMatchObject({
      status: "flat",
      inTrial: true,
      paidCycleEndsAt: null,
      amount: 39,
    });
  });

  it("returns none when Shopify has no contract, and error on a GraphQL error", () => {
    expect(
      parsePartnerSubscriptionPayload({ data: { activeSubscription: null } }, NOW).status,
    ).toBe("none");
    expect(
      parsePartnerSubscriptionPayload({ errors: [{ message: "nope" }] }, NOW).status,
    ).toBe("error");
  });

  it("accepts a $0 flat dev-store test contract", () => {
    const parsed = parsePartnerSubscriptionPayload(
      {
        data: {
          activeSubscription: {
            cancelAtEndOfCycle: false,
            trialEndsAt: null,
            currentBillingCycle: { endTime: "2026-10-24T00:00:00.000Z" },
            items: [{ price: { __typename: "FlatRatePrice", amount: "0.00", currency: "USD" } }],
          },
        },
      },
      NOW,
    );
    expect(parsed).toMatchObject({ status: "flat", amount: 0, inTrial: false });
  });
});

describe("queryPartnerActiveSubscription", () => {
  it("posts the activeSubscription query with the token in the header only", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { activeSubscription: null } }),
    });
    const result = await queryPartnerActiveSubscription({
      config: {
        orgId: "227535001",
        accessToken: "secret-token",
        appGid: "gid://shopify/App/403721814017",
      },
      shopGid: "gid://shopify/Shop/55",
      fetchImpl,
      now: NOW,
    });
    expect(result.status).toBe("none");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as [string, { body: string; headers: Record<string, string> }];
    expect(url).toBe(partnerApiUrl("227535001"));
    expect(url).not.toContain("secret-token");
    expect(init.headers["X-Shopify-Access-Token"]).toBe("secret-token");
    const body = JSON.parse(init.body) as { query: string; variables: { appId: string; shopId: string } };
    expect(body.query).toContain("activeSubscription");
    expect(body.query).not.toContain("appSubscriptionCreate");
    expect(body.query).not.toContain("gid://shopify/Shop/55");
    expect(body.variables).toEqual({
      appId: "gid://shopify/App/403721814017",
      shopId: "gid://shopify/Shop/55",
    });
  });
});

describe("readPartnerBillingConfig", () => {
  it("stays unset without a token and builds gids from public ids", () => {
    expect(readPartnerBillingConfig({})).toBeNull();
    expect(
      readPartnerBillingConfig({ SHOPIFY_PARTNER_ACCESS_TOKEN: "tok" }),
    ).toEqual({
      orgId: "227535001",
      accessToken: "tok",
      appGid: "gid://shopify/App/403721814017",
    });
    expect(shopifyGid("Shop", "gid://shopify/Shop/9")).toBe("gid://shopify/Shop/9");
  });
});
