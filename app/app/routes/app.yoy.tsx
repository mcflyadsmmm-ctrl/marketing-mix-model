import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { requireAdmin } from "../lib/public-app-gate.server";
import { OVERVIEW_YOY_YEAR_PANEL } from "../lib/overview-first-viewport";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAdmin(request);
  const url = new URL(request.url);
  const next = new URLSearchParams(url.searchParams);
  next.set("panel", OVERVIEW_YOY_YEAR_PANEL);
  throw redirect(`/app?${next.toString()}`);
};

export default function YoyRedirect() {
  return null;
}

export function ErrorBoundary() {
  return (
    <DeskRouteErrorBoundary retryHref={`/app?panel=${OVERVIEW_YOY_YEAR_PANEL}`} />
  );
}

export const headers: HeadersFunction = (headersArgs) =>
  boundary.headers(headersArgs);
