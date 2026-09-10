import { redirect } from "react-router";

import {
  hasShopifySessionContext,
  isEmbeddedAdminRequest,
} from "../../scripts/shopify-app-path.mjs";
import { authenticate } from "../shopify.server";

export const PUBLIC_APP_STUB = { kind: "public" as const };

export function isGoneResponse(error: unknown): boolean {
  if (error instanceof Response) return error.status === 410;
  if (typeof error === "object" && error && "status" in error) {
    return Number((error as { status: unknown }).status) === 410;
  }
  return false;
}

export function isPublicAppRequest(request: Request): boolean {
  return !hasShopifySessionContext(request);
}

/**
 * Nested /app/* loaders: send public traffic to the 200 /app host page
 * instead of Shopify's 410 (which breaks turbo-stream).
 */
export async function requireAdmin(request: Request) {
  if (isPublicAppRequest(request)) {
    throw redirect("/app");
  }
  try {
    return await authenticate.admin(request);
  } catch (error) {
    if (isGoneResponse(error) && !isEmbeddedAdminRequest(request)) {
      throw redirect("/app");
    }
    throw error;
  }
}
