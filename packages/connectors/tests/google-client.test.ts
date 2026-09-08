import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GoogleSpendClientLive,
  MockGoogleSpendClient,
  createGoogleSpendClient,
  normalizeGoogleCustomerId,
} from "../src/google/client.js";

describe("normalizeGoogleCustomerId", () => {
  it("strips dashes", () => {
    expect(normalizeGoogleCustomerId("123-456-7890")).toBe("1234567890");
  });
});

describe("MockGoogleSpendClient", () => {
  it("returns deterministic google source rows", async () => {
    const client = new MockGoogleSpendClient("cust");
    const rows = await client.fetchDailySpend({
      from: "2026-07-01",
      to: "2026-07-01",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.channel).toBe("Google");
    expect(rows[0]?.source).toBe("google");
  });
});

describe("GoogleSpendClientLive (mocked fetch)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("refreshes OAuth then maps cost_micros via GAQL search", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({ access_token: "access-xyz" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ customer: { currencyCode: "CAD" } }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              segments: { date: "2026-07-01" },
              metrics: { costMicros: "2500000" },
            },
            {
              segments: { date: "2026-07-02" },
              metrics: { costMicros: "1000000" },
            },
          ],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const client = new GoogleSpendClientLive({
      developerToken: "dev",
      customerId: "111-222-3333",
      refreshToken: "refresh",
      clientId: "cid",
      clientSecret: "csecret",
      loginCustomerId: "999-888-7777",
    });

    const rows = await client.fetchDailySpend({
      from: "2026-07-01",
      to: "2026-07-02",
    });

    expect(rows).toEqual([
      {
        date: "2026-07-01",
        channel: "Google",
        amount: 2.5,
        currency: "CAD",
        source: "google",
      },
      {
        date: "2026-07-02",
        channel: "Google",
        amount: 1,
        currency: "CAD",
        source: "google",
      },
    ]);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://oauth2.googleapis.com/token",
    );
    const currencyBody = JSON.parse(
      String((fetchMock.mock.calls[1]?.[1] as RequestInit).body),
    );
    expect(currencyBody.query).toContain("customer.currency_code");
    const searchUrl = String(fetchMock.mock.calls[2]?.[0]);
    expect(searchUrl).toContain(
      "/customers/1112223333/googleAds:search",
    );
    const searchInit = fetchMock.mock.calls[2]?.[1] as RequestInit;
    const headers = searchInit.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer access-xyz");
    expect(headers["developer-token"]).toBe("dev");
    expect(headers["login-customer-id"]).toBe("9998887777");
    const body = JSON.parse(String(searchInit.body));
    expect(body.query).toContain("metrics.cost_micros");
    expect(body.query).toContain("BETWEEN '2026-07-01' AND '2026-07-02'");
  });

  it("throws clear message on search HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify({ access_token: "a" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [{ customer: { currencyCode: "USD" } }],
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          text: async () => "forbidden",
        }),
    );

    const client = new GoogleSpendClientLive({
      developerToken: "dev",
      customerId: "1",
      refreshToken: "r",
      clientId: "c",
      clientSecret: "s",
    });

    await expect(
      client.fetchDailySpend({ from: "2026-07-01", to: "2026-07-01" }),
    ).rejects.toThrow(/Google Ads search HTTP 403/);
  });

  it("requires clientId and clientSecret for live", async () => {
    const client = new GoogleSpendClientLive({
      developerToken: "dev",
      customerId: "1",
      refreshToken: "r",
    });
    await expect(
      client.fetchDailySpend({ from: "2026-07-01", to: "2026-07-01" }),
    ).rejects.toThrow(/clientId/);
  });

  it("createGoogleSpendClient uses live when useMock false", () => {
    const client = createGoogleSpendClient({ useMock: false });
    expect(client).toBeInstanceOf(GoogleSpendClientLive);
  });
});
