import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";
import {
  customersLivePageDecision,
  liveDeskLockedCopy,
} from "../lib/live-desk-surface";
import { resolveLiveUnparkStage } from "../lib/live-unpark";
import { getSampleDeskEnabled } from "../lib/sample-desk.server";
import { authenticate } from "../shopify.server";
import CustomersPage, { loader as customersLoader } from "./app.customers";

export const loader = async (args: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(args.request);
  const decision = customersLivePageDecision({
    sampleDesk: await getSampleDeskEnabled(session.shop),
    stage: resolveLiveUnparkStage(),
  });
  if (decision.serve !== "open" || !decision.growthOpen) {
    return {
      kind: "locked" as const,
      stage: decision.stage,
      copy: liveDeskLockedCopy(
        decision.serve === "locked" ? "customers" : "growth",
        decision.stage,
      ),
    };
  }
  return customersLoader(args);
};

export default CustomersPage;

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/growth" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
