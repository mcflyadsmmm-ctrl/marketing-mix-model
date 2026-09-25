import type { HeadersFunction } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import CustomersPage, { loader } from "./app.customers";

export { loader };

export default CustomersPage;

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/who-to-save" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
