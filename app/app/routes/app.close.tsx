import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

/**
 * Memo / Export memo tab removed — Share lives on Overview.
 * Keep this route so old bookmarks and CTAs land on Home.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const url = new URL(request.url);
  const period = url.searchParams.get("period");
  const target = period ? `/app?period=${encodeURIComponent(period)}` : "/app";
  throw redirect(target);
};

export default function CloseRedirect() {
  return null;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
