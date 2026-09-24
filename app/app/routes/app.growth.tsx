import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { customersPanelRedirectPath } from "../lib/desk-customers-stack.server";
import {
  customersLivePageDecision,
  customersStageLockedPath,
} from "../lib/live-desk-surface";
import { resolveLiveUnparkStage } from "../lib/live-unpark";
import { getSampleDeskEnabled } from "../lib/sample-desk.server";
import { DeskRouteErrorBoundary } from "../components/DeskRouteErrorBoundary";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const decision = customersLivePageDecision({
    sampleDesk: await getSampleDeskEnabled(session.shop),
    stage: resolveLiveUnparkStage(),
  });
  if (decision.serve !== "open" || !decision.growthOpen) {
    throw redirect(customersStageLockedPath(request));
  }
  throw redirect(customersPanelRedirectPath(request, "/app/customers", "growth"));
};

export default function GrowthRedirect() {
  return null;
}

export function ErrorBoundary() {
  return <DeskRouteErrorBoundary retryHref="/app/customers" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
