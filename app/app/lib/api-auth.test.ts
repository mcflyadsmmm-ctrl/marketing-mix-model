import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const findFirstShop = vi.fn();
const findFirstToken = vi.fn();
const updateToken = vi.fn();

vi.mock("../db.server", () => ({
  default: {
    shop: {
      findFirst: (...args: unknown[]) => findFirstShop(...args),
    },
    apiToken: {
      findFirst: (...args: unknown[]) => findFirstToken(...args),
      update: (...args: unknown[]) => updateToken(...args),
    },
  },
}));

import { authenticateApiRequest } from "./api-auth.server";

const GLOBAL_TOKEN = "mcfly_global_test_token_abc123";

function apiRequest(init: {
  token?: string;
  shopHeader?: string;
}): Request {
  const headers = new Headers();
  if (init.token !== undefined) {
    headers.set("Authorization", `Bearer ${init.token}`);
  }
  if (init.shopHeader !== undefined) {
    headers.set("X-Mcfly-Shop-Id", init.shopHeader);
  }
  return new Request("https://app.mcflyads.com/v1/mer?from=2026-01-01&to=2026-01-31", {
    headers,
  });
}

describe("authenticateApiRequest", () => {
  beforeEach(() => {
    findFirstShop.mockReset();
    findFirstToken.mockReset();
    updateToken.mockReset();
    process.env.MCFLY_API_TOKEN = GLOBAL_TOKEN;
  });

  afterEach(() => {
    delete process.env.MCFLY_API_TOKEN;
  });

  it("hard-fails global token without X-Mcfly-Shop-Id (no first-shop fallback)", async () => {
    const result = await authenticateApiRequest(
      apiRequest({ token: GLOBAL_TOKEN }),
    );

    expect(result).toEqual({
      ok: false,
      status: 401,
      message: "X-Mcfly-Shop-Id header required for global API token",
    });
    expect(findFirstShop).not.toHaveBeenCalled();
  });

  it("resolves global token when shop hint is present", async () => {
    findFirstShop.mockResolvedValue({
      id: "shop_cuid_1",
      domain: "partner.myshopify.com",
    });

    const result = await authenticateApiRequest(
      apiRequest({
        token: GLOBAL_TOKEN,
        shopHeader: "partner.myshopify.com",
      }),
    );

    expect(result).toEqual({
      ok: true,
      shopId: "shop_cuid_1",
      shopDomain: "partner.myshopify.com",
    });
    expect(findFirstShop).toHaveBeenCalledOnce();
  });

  it("allows per-shop ApiToken without shop hint (bound to token's shop)", async () => {
    delete process.env.MCFLY_API_TOKEN;
    findFirstToken.mockResolvedValue({
      id: "tok_1",
      shopId: "shop_cuid_2",
      shop: { domain: "bound.myshopify.com" },
    });
    updateToken.mockResolvedValue({});

    const result = await authenticateApiRequest(
      apiRequest({ token: "mcfly_per_shop_token" }),
    );

    expect(result).toEqual({
      ok: true,
      shopId: "shop_cuid_2",
      shopDomain: "bound.myshopify.com",
    });
    expect(findFirstShop).not.toHaveBeenCalled();
  });
});
