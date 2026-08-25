import type { HeadersFunction, LinksFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";
import {
  ensureShop,
  getOrCreateSettings,
  marginIsConfirmed,
} from "../lib/mer-dashboard.server";
import {
  getSampleDeskEnabled,
  getSamplePreviewAllowed,
} from "../lib/sample-desk.server";
import { DataModeBar } from "../components/DataModeBar";
import { BillingExitProvider } from "../lib/billing-exit-context";
import { isBillingEnabled } from "../lib/billing-flag.server";
import { buildManagedPricingPlansUrl } from "../lib/billing.server";
import { PRODUCT_NOUN } from "../lib/product-labels";
import prisma from "../db.server";
import deskStyles from "../styles/mcfly-desk.css?url";

/** Desk craft CSS only inside the embedded app — not on the bare Fly landing. */
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: deskStyles },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const settings = await getOrCreateSettings(shop.id);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const [useSampleDesk, samplePreviewAllowed, liveSpendCount] =
    await Promise.all([
      getSampleDeskEnabled(shop.id),
      getSamplePreviewAllowed(shop.id),
      prisma.spendEntry.count({
        where: { shopId: shop.id, NOT: { source: "sample" } },
      }),
    ]);

  const marginConfirmed = marginIsConfirmed(settings);
  const hasLiveSpend = liveSpendCount > 0;

  let plansUrl: string | null = null;
  if (isBillingEnabled()) {
    try {
      plansUrl = buildManagedPricingPlansUrl(session.shop);
    } catch {
      plansUrl = null;
    }
  }

  // eslint-disable-next-line no-undef
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    useSampleDesk,
    samplePreviewAllowed,
    marginConfirmed,
    hasLiveSpend,
    shotMode,
    plansUrl,
  };
};

export default function App() {
  const {
    apiKey,
    useSampleDesk,
    samplePreviewAllowed,
    marginConfirmed,
    hasLiveSpend,
    shotMode,
    plansUrl,
  } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <BillingExitProvider plansUrl={plansUrl}>
        {/* Always show desk nav — empty states / Pro gates live on pages.
            Do not hide tabs when Your store (Sample off); that felt broken. */}
        <s-app-nav>
          <s-link href="/app">Overview</s-link>
          <s-link href="/app/spend">Spend</s-link>
          <s-link href="/app/goals">Goals</s-link>
          <s-link href="/app/allocation">{PRODUCT_NOUN.spendAllocation}</s-link>
          <s-link href="/app/ltv">LTV / Acquisition</s-link>
          <s-link href="/app/advanced">Advanced</s-link>
          <s-link href="/app/settings">Settings</s-link>
        </s-app-nav>
        {!shotMode ? (
          <DataModeBar
            useSampleDesk={useSampleDesk}
            samplePreviewAllowed={samplePreviewAllowed}
            marginConfirmed={marginConfirmed}
            hasLiveSpend={hasLiveSpend}
          />
        ) : null}
        <Outlet />
      </BillingExitProvider>
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
