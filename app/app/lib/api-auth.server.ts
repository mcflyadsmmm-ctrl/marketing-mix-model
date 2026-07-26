import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import prisma from "../db.server";

export type ApiAuthResult =
  | { ok: true; shopId: string; shopDomain: string }
  | { ok: false; status: number; message: string };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Resolve shop from Bearer token + shop hint.
 * Global MCFLY_API_TOKEN requires X-Mcfly-Shop-Id (domain or cuid) — never
 * falls back to “first shop”. Per-shop ApiToken rows bind to their shop.
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

  const envToken = process.env.MCFLY_API_TOKEN;
  if (envToken && safeEqual(token, envToken)) {
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

  const tokenHash = hashToken(token);
  const record = await prisma.apiToken.findFirst({
    where: { tokenHash, revokedAt: null },
    include: { shop: true },
  });

  if (!record) {
    return { ok: false, status: 401, message: "Invalid API token" };
  }

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
