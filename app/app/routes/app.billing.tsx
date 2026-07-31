/**
 * Pro upgrade — Shopify Billing confirmation (top-frame redirect).
 * POST here from Upgrade CTAs across the desk; do not deep-link Settings only.
 */

import type { ActionFunctionArgs, HeadersFunction } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { requestProSubscription } from "../lib/billing.server";

export type ProUpgradeActionData =
  | { ok: true; confirmationUrl: string }
  | { ok: false; error: string };

export const action = async ({
  request,
}: ActionFunctionArgs): Promise<ProUpgradeActionData> => {
  const { admin, session } = await authenticate.admin(request);
  const result = await requestProSubscription({
    admin,
    shopDomain: session.shop,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, confirmationUrl: result.confirmationUrl };
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
