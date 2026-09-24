/**
 * Old /app/orders bookmarks land on the Orders tab (this month’s sales).
 */
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { deskBaseFromPathname, withDeskBase } from "../lib/desk-base-path";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const home = withDeskBase("/app", deskBaseFromPathname(url.pathname));
  const qs = url.searchParams.toString();
  throw redirect(`${home}${qs ? `?${qs}` : ""}`);
};

export default function OrdersRedirect() {
  return null;
}

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
