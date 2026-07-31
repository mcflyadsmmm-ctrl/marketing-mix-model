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

import {
  authenticateApiRequest,
  rejectOversizedBody,
  API_MAX_BODY_BYTES,
} from "./api-auth.server";

const GLOBAL_TOKEN = "mcfly_global_test_token_abc123";
const OPS_SECRET = "ops_secret_for_tests_only";

function apiRequest(init: {
  token?: string;
  shopHeader?: string;
  opsSecret?: string;
  contentLength?: string;
}): Request {
  const headers = new Headers();
  if (init.token !== undefined) {
    headers.set("Authorization", `Bearer ${init.token}`);
  }
  if (init.shopHeader !== undefined) {
    headers.set("X-Mcfly-Shop-Id", init.shopHeader);
  }
  if (init.opsSecret !== undefined) {
    headers.set("X-Mcfly-Ops-Secret", init.opsSecret);
  }
  if (init.contentLength !== undefined) {
    headers.set("Content-Length", init.contentLength);
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
    findFirstToken.mockResolvedValue(null);
    process.env.MCFLY_API_TOKEN = GLOBAL_TOKEN;
    delete process.env.MCFLY_ALLOW_GLOBAL_API_TOKEN;
    delete process.env.MCFLY_API_OPS_SECRET;
  });

  afterEach(() => {
    delete process.env.MCFLY_API_TOKEN;
    delete process.env.MCFLY_ALLOW_GLOBAL_API_TOKEN;
    delete process.env.MCFLY_API_OPS_SECRET;
  });

  it("rejects global token without allow flag or ops secret (default off)", async () => {
    const result = await authenticateApiRequest(
      apiRequest({
        token: GLOBAL_TOKEN,
        shopHeader: "partner.myshopify.com",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
      expect(result.message).toMatch(/Global API token disabled/i);
    }
    expect(findFirstShop).not.toHaveBeenCalled();
  });

  it("hard-fails global token without X-Mcfly-Shop-Id when flag is on", async () => {
    process.env.MCFLY_ALLOW_GLOBAL_API_TOKEN = "1";

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

  it("resolves global token when allow flag + shop hint are present", async () => {
    process.env.MCFLY_ALLOW_GLOBAL_API_TOKEN = "1";
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

  it("resolves global token with ops secret + shop id (no allow flag)", async () => {
    process.env.MCFLY_API_OPS_SECRET = OPS_SECRET;
    findFirstShop.mockResolvedValue({
      id: "shop_cuid_ops",
      domain: "ops.myshopify.com",
    });

    const result = await authenticateApiRequest(
      apiRequest({
        token: GLOBAL_TOKEN,
        shopHeader: "ops.myshopify.com",
        opsSecret: OPS_SECRET,
      }),
    );

    expect(result).toEqual({
      ok: true,
      shopId: "shop_cuid_ops",
      shopDomain: "ops.myshopify.com",
    });
  });

  it("rejects global token when ops secret mismatches", async () => {
    process.env.MCFLY_API_OPS_SECRET = OPS_SECRET;

    const result = await authenticateApiRequest(
      apiRequest({
        token: GLOBAL_TOKEN,
        shopHeader: "ops.myshopify.com",
        opsSecret: "wrong-secret",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
      expect(result.message).toMatch(/Global API token disabled/i);
    }
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

describe("rejectOversizedBody", () => {
  it("returns 400 body_too_large when Content-Length exceeds cap", async () => {
    const res = rejectOversizedBody(
      apiRequest({ contentLength: String(API_MAX_BODY_BYTES + 1) }),
    );
    expect(res).not.toBeNull();
    expect(res!.status).toBe(400);
    const json = await res!.json();
    expect(json.code).toBe("body_too_large");
  });

  it("allows missing or small Content-Length", () => {
    expect(rejectOversizedBody(apiRequest({}))).toBeNull();
    expect(
      rejectOversizedBody(apiRequest({ contentLength: "128" })),
    ).toBeNull();
  });
});
