import type { HeadersFunction } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import Dashboard, { action, loader } from "./app._index";

/** Month close stays on this address. The old Monday Close lock UI is gone. */
export { action, loader };

export default Dashboard;

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/close" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
