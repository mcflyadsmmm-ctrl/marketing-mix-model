import { useEffect } from "react";
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
import {
  LISTING_CAPTURE_HTML_CLASS,
  listingCaptureFromRequest,
  listingCaptureHref,
} from "../lib/listing-capture";
import { deskNavItems } from "../lib/desk-nav";
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
  const shotMode = listingCaptureFromRequest(request);
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

  // eslint-disable-next-line no-undef
  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    useSampleDesk,
    samplePreviewAllowed,
    marginConfirmed,
    hasLiveSpend,
    shotMode,
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
  } = useLoaderData<typeof loader>();

  useEffect(() => {
    document.documentElement.classList.toggle(
      LISTING_CAPTURE_HTML_CLASS,
      shotMode,
    );
    return () => {
      document.documentElement.classList.remove(LISTING_CAPTURE_HTML_CLASS);
    };
  }, [shotMode]);

  return (
    <AppProvider embedded apiKey={apiKey}>
      {/* Core tabs: Sales · Customers · Goals · Marketing Spend · Settings */}
      <s-app-nav>
        {deskNavItems().map((item) => (
          <s-link key={item.id} href={listingCaptureHref(item.href, shotMode)}>
            {item.label}
          </s-link>
        ))}
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
