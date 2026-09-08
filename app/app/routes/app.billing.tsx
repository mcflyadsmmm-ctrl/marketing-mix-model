/**
 * Pro upgrade / manage plan — Shopify Managed Pricing.
 *
 * NEVER return a bare HTTP 302 to admin.shopify.com from a document GET —
 * that loads Admin inside the app iframe → "refused to connect" (2.1.1).
 * Always return App Bridge HTML that calls window.open(_, "_top").
 *
 * POST returns JSON confirmationUrl for client-side _top open (user gesture).
 */

import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { requestProSubscription } from "../lib/billing.server";
import { billingExitHtmlResponse } from "../lib/billing-exit.server";

export type ProUpgradeActionData =
  | { ok: true; confirmationUrl: string }
  | { ok: false; error: string };

function copyEmbeddedParams(from: URL, to: URL) {
  for (const key of ["shop", "host", "embedded", "id_token"] as const) {
    const value = from.searchParams.get(key);
    if (value) to.searchParams.set(key, value);
  }
  if (!to.searchParams.get("embedded")) {
    to.searchParams.set("embedded", "1");
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session, redirect } = await authenticate.admin(request);
  const result = await requestProSubscription({
    admin,
    shopDomain: session.shop,
  });
  const reqUrl = new URL(request.url);

  if (!result.ok) {
    const back = new URL("/app/settings", reqUrl.origin);
    copyEmbeddedParams(reqUrl, back);
    back.searchParams.set("billingError", result.error);
    return redirect(back.pathname + back.search);
  }

  // Bulletproof: HTML + window.open(_top). Do NOT use redirect(adminUrl).
  throw billingExitHtmlResponse({
    confirmationUrl: result.confirmationUrl,
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shopDomain: session.shop,
  });
};

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

export default function BillingStart() {
  return (
    <p className="mcfly-panel__muted" role="status">
      Opening Shopify plans…
    </p>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
