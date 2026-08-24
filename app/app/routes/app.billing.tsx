/**
 * Pro upgrade — Shopify Managed Pricing plan picker (top-frame redirect).
 * POST from Upgrade CTAs returns confirmationUrl for App Bridge _top open.
 * GET uses authenticate.admin redirect({ target: "_top" }) (Shopify docs).
 */

import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { requestProSubscription } from "../lib/billing.server";

export type ProUpgradeActionData =
  | { ok: true; confirmationUrl: string }
  | { ok: false; error: string };

function copyEmbeddedParams(from: URL, to: URL) {
  for (const key of ["shop", "host", "embedded", "id_token"] as const) {
    const value = from.searchParams.get(key);
    if (value) to.searchParams.set(key, value);
  }
}

/** Official Managed Pricing exit: leave the embed via App Bridge _top redirect. */
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

  return redirect(result.confirmationUrl, {
    target: "_top",
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
