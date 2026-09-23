/**
 * T1 SAMPLE L2 — Goals tab retired. Redirect to Settings.
 */
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const qs = url.searchParams.toString();
  throw redirect(`/app/settings${qs ? `?${qs}` : ""}`);
};

export default function GoalsRedirect() {
  return null;
}

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
