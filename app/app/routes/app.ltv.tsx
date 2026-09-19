import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { customersPanelRedirectPath } from "../lib/desk-customers-stack.server";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  throw redirect(customersPanelRedirectPath(request, "/app/customers", "ltv"));
};

export default function LtvRedirect() {
  return null;
}

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/customers" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
