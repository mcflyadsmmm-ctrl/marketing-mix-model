import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import { requireAdmin } from "../lib/public-app-gate.server";
import SpendEntryPage, {
  action,
  loader as spendLoader,
} from "./app.spend";

export const loader = async (args: LoaderFunctionArgs) => {
  await requireAdmin(args.request);
  return spendLoader(args);
};

export { action };

export default SpendEntryPage;

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/allocation" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
