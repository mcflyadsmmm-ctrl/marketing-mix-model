import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MetaSpendClientLive,
  MockMetaSpendClient,
  createMetaSpendClient,
  normalizeMetaAdAccountId,
} from "../src/meta/client.js";

describe("normalizeMetaAdAccountId", () => {
  it("prefixes act_ when missing", () => {
    expect(normalizeMetaAdAccountId("123456")).toBe("act_123456");
  });

  it("keeps existing act_ prefix", () => {
    expect(normalizeMetaAdAccountId("act_999")).toBe("act_999");
  });
});

describe("MockMetaSpendClient", () => {
  it("returns deterministic meta source rows", async () => {
    const client = new MockMetaSpendClient("act_test");
    const rows = await client.fetchDailySpend({
      from: "2026-07-01",
      to: "2026-07-02",
    });
    expect(rows).toHaveLength(2);
    expect(rows[0]?.channel).toBe("Meta");
    expect(rows[0]?.source).toBe("meta");
    expect(rows[0]?.currency).toBe("USD");
  });
});

describe("MetaSpendClientLive (mocked fetch)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("maps Insights spend rows and follows paging.next", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              spend: "12.50",
              date_start: "2026-07-01",
              account_currency: "eur",
            },
          ],
          paging: {
            next: "https://graph.facebook.com/v21.0/act_1/insights?after=cursor",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ spend: "8", date_start: "2026-07-02" }],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const client = new MetaSpendClientLive({
      accessToken: "tok",
      adAccountId: "1",
    });
    const rows = await client.fetchDailySpend({
      from: "2026-07-01",
      to: "2026-07-02",
    });

    expect(rows).toEqual([
      {
        date: "2026-07-01",
        channel: "Meta",
        amount: 12.5,
        currency: "EUR",
        source: "meta",
      },
      {
        date: "2026-07-02",
        channel: "Meta",
        amount: 8,
        currency: "USD",
        source: "meta",
      },
    ]);

    const firstUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(firstUrl).toContain("/act_1/insights");
    expect(firstUrl).toContain("time_increment=1");
    expect(firstUrl).toContain("level=account");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws clear message on HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => '{"error":{"message":"bad token"}}',
      }),
    );

    const client = new MetaSpendClientLive({
      accessToken: "bad",
      adAccountId: "act_1",
    });
    await expect(
      client.fetchDailySpend({ from: "2026-07-01", to: "2026-07-01" }),
    ).rejects.toThrow(/Meta Insights HTTP 401/);
  });

  it("createMetaSpendClient uses live when useMock false", () => {
    const client = createMetaSpendClient({
      useMock: false,
      accessToken: "t",
      adAccountId: "act_1",
    });
    expect(client).toBeInstanceOf(MetaSpendClientLive);
  });
});
