import type { HeadersFunction } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import Dashboard, { action, loader } from "./app._index";

export { action, loader };

export default Dashboard;

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/yoy" />;
}

export const headers: HeadersFunction = (headersArgs) =>
  boundary.headers(headersArgs);
