import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { requireAdmin } from "../lib/public-app-gate.server";
import { spendPanelRedirectPath } from "../lib/desk-spend-stack.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAdmin(request);
  throw redirect(spendPanelRedirectPath(request.url, "cpa", "/app/spend"));
};

export default function CpaRedirect() {
  return null;
}

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/cpa" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
