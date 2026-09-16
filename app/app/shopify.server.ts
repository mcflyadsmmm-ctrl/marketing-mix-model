import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { data, redirect } from "react-router";

import {
  documentGoneRedirectLocation,
  isReactRouterDataRequest,
} from "../scripts/shopify-app-path.mjs";
import { SESSION_RECOVERY_DATA } from "./lib/merchant-error-recovery";
import prisma from "./db.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  // Production SoT = Public App Store client (bbaee078…).
  // Set MCFLY_APP_DISTRIBUTION=app_store on Fly. Custom client (88c56d21…) is
  // archived in shopify.app.custom.toml — Custom distribution cannot use Billing.
  distribution:
    process.env.MCFLY_APP_DISTRIBUTION === "app_store"
      ? AppDistribution.AppStore
      : AppDistribution.SingleMerchant,
  future: {
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;

function isGoneResponse(error: unknown): boolean {
  if (error instanceof Response) return error.status === 410;
  if (typeof error === "object" && error && "status" in error) {
    return Number((error as { status: unknown }).status) === 410;
  }
  return false;
}

const authenticateAdmin = shopify.authenticate.admin.bind(shopify.authenticate);

async function authenticateAdminWithoutDocumentGone(request: Request) {
  try {
    return await authenticateAdmin(request);
  } catch (error) {
    if (!isGoneResponse(error)) throw error;
    if (!isReactRouterDataRequest(request)) {
      const location = documentGoneRedirectLocation(request);
      if (location) throw redirect(location);
    }
    // Data-request 410s are not valid turbo-stream. Rewrite so ErrorBoundary
    // can paint Retry / Open Shopify Admin instead of "Handling response".
    throw data(SESSION_RECOVERY_DATA, { status: 403 });
  }
}

export const authenticate = {
  ...shopify.authenticate,
  admin: authenticateAdminWithoutDocumentGone,
};
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
