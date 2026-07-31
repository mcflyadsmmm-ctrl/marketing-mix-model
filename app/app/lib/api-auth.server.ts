import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import prisma from "../db.server";

export type ApiAuthResult =
  | { ok: true; shopId: string; shopDomain: string }
  | { ok: false; status: number; message: string };

/** GET /v1/mer and /v1/allocation should not carry large bodies. */
export const API_MAX_BODY_BYTES = 64 * 1024;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function globalApiTokenAllowed(request: Request): boolean {
  if (process.env.MCFLY_ALLOW_GLOBAL_API_TOKEN === "1") {
    return true;
  }

  const opsSecret = process.env.MCFLY_API_OPS_SECRET?.trim();
  if (!opsSecret) return false;

  const presented =
    request.headers.get("X-Mcfly-Ops-Secret")?.trim() ||
    request.headers.get("x-mcfly-ops-secret")?.trim() ||
    null;
  if (!presented) return false;
  return safeEqual(presented, opsSecret);
}

/**
 * Prefer per-shop ApiToken rows (bound to shop).
 * Global MCFLY_API_TOKEN is off by default. Ops may enable it with
 * MCFLY_ALLOW_GLOBAL_API_TOKEN=1, or present MCFLY_API_OPS_SECRET via
 * X-Mcfly-Ops-Secret. Global path always requires X-Mcfly-Shop-Id.
 */
export async function authenticateApiRequest(
  request: Request,
): Promise<ApiAuthResult> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return { ok: false, status: 401, message: "Missing Bearer token" };
  }

  const token = auth.slice("Bearer ".length).trim();
  if (!token) {
    return { ok: false, status: 401, message: "Empty Bearer token" };
  }

  const shopHint =
    request.headers.get("X-Mcfly-Shop-Id")?.trim() ||
    request.headers.get("x-mcfly-shop-id")?.trim() ||
    null;

  // Prefer per-shop ApiToken — never treat a DB token as the global env token.
  const tokenHash = hashToken(token);
  const record = await prisma.apiToken.findFirst({
    where: { tokenHash, revokedAt: null },
    include: { shop: true },
  });

  if (record) {
    if (shopHint) {
      const shop = await resolveShop(shopHint);
      if (!shop || shop.id !== record.shopId) {
        return { ok: false, status: 403, message: "Token not valid for requested shop" };
      }
    }

    await prisma.apiToken.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      ok: true,
      shopId: record.shopId,
      shopDomain: record.shop.domain,
    };
  }

  const envToken = process.env.MCFLY_API_TOKEN;
  if (envToken && safeEqual(token, envToken)) {
    if (!globalApiTokenAllowed(request)) {
      return {
        ok: false,
        status: 401,
        message:
          "Global API token disabled. Use a per-shop ApiToken, or set MCFLY_ALLOW_GLOBAL_API_TOKEN=1, or send X-Mcfly-Ops-Secret with MCFLY_API_OPS_SECRET configured.",
      };
    }
    if (!shopHint) {
      return {
        ok: false,
        status: 401,
        message: "X-Mcfly-Shop-Id header required for global API token",
      };
    }
    const shop = await resolveShop(shopHint);
    if (!shop) {
      return { ok: false, status: 404, message: "Shop not found" };
    }
    return { ok: true, shopId: shop.id, shopDomain: shop.domain };
  }

  return { ok: false, status: 401, message: "Invalid API token" };
}

async function resolveShop(hint: string) {
  return prisma.shop.findFirst({
    where: {
      OR: [{ id: hint }, { domain: hint }, { domain: hint.endsWith(".myshopify.com") ? hint : `${hint}.myshopify.com` }],
    },
  });
}

export function mintApiToken(): string {
  return `mcfly_${randomBytes(32).toString("base64url")}`;
}

export function hashApiToken(token: string): string {
  return hashToken(token);
}

export function jsonError(message: string, status = 400, code?: string) {
  return Response.json({ error: message, code }, { status });
}

/** Reject oversized Content-Length (clear 400). Safe for GET loaders. */
export function rejectOversizedBody(request: Request): Response | null {
  const raw = request.headers.get("content-length");
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return jsonError("Invalid Content-Length", 400, "invalid_content_length");
  }
  if (n > API_MAX_BODY_BYTES) {
    return jsonError(
      `Request body too large (max ${API_MAX_BODY_BYTES} bytes)`,
      400,
      "body_too_large",
    );
  }
  return null;
}
