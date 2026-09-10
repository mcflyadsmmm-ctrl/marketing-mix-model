import type { HeadersFunction, LinksFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";
import {
  hasShopifySessionContext,
  isEmbeddedAdminRequest,
} from "../../scripts/shopify-app-path.mjs";
import {
  ensureShop,
  getOrCreateSettings,
} from "../lib/mer-dashboard.server";
import {
  getSampleDeskEnabled,
  getSamplePreviewAllowed,
} from "../lib/sample-desk.server";
import { DataModeBar } from "../components/DataModeBar";
import { BillingExitProvider } from "../lib/billing-exit-context";
import { isBillingEnabled } from "../lib/billing-flag.server";
import { buildManagedPricingPlansUrl } from "../lib/billing.server";
import { deskNavHrefFromSearch, DESK_PRIMARY_NAV } from "../lib/desk-nav";
import { OriginShell } from "./_index/OriginShell";
import originStyles from "./_index/styles.module.css";
import deskStyles from "../styles/mcfly-desk.css?url";

const PUBLIC_APP = {
  kind: "public" as const,
  apiKey: "",
  useSampleDesk: false,
  samplePreviewAllowed: false,
  shotMode: false,
  plansUrl: null as string | null,
};

function isGoneResponse(error: unknown): boolean {
  if (error instanceof Response) return error.status === 410;
  if (typeof error === "object" && error && "status" in error) {
    return Number((error as { status: unknown }).status) === 410;
  }
  return false;
}

/** Desk craft CSS only inside the embedded app — not on the bare Fly landing. */
export const links: LinksFunction = () => [
  { rel: "stylesheet", href: deskStyles },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Public tab / curl: never 410. 410 hydrates React Router, fetches /app.data,
  // and throws "Unable to decode turbo-stream response".
  if (!hasShopifySessionContext(request)) {
    return PUBLIC_APP;
  }
  let session;
  try {
    ({ session } = await authenticate.admin(request));
  } catch (error) {
    if (isGoneResponse(error) && !isEmbeddedAdminRequest(request)) {
      return PUBLIC_APP;
    }
    throw error;
  }
  const shop = await ensureShop(session.shop);
  await getOrCreateSettings(shop.id);
  const url = new URL(request.url);
  const shotMode = url.searchParams.get("shot") === "1";
  const [useSampleDesk, samplePreviewAllowed] = await Promise.all([
    getSampleDeskEnabled(shop.id),
    getSamplePreviewAllowed(shop.id),
  ]);

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
    kind: "desk" as const,
    apiKey: process.env.SHOPIFY_API_KEY || "",
    useSampleDesk,
    samplePreviewAllowed,
    shotMode,
    plansUrl,
  };
};

export default function App() {
  const data = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  if (data.kind === "public") {
    return (
      <OriginShell>
        <main id="main" className={originStyles.article}>
          <h1>Mcfly Analytics</h1>
          <p className={originStyles.lede}>
            This is the app host. Open Mcfly Analytics from Shopify Admin after
            install. We never ask you to type a store domain here.
          </p>
          <p>
            7-day trial, then $39/store/mo via Shopify App Pricing. Trust pages:{" "}
            <a href="/privacy">Privacy</a>
            {" · "}
            <a href="/support">Support</a>
            {" · "}
            <a href="/terms">Terms</a>
            {" · "}
            <a href="/pricing">Pricing</a>
          </p>
        </main>
      </OriginShell>
    );
  }

  const {
    apiKey,
    useSampleDesk,
    samplePreviewAllowed,
    shotMode,
    plansUrl,
  } = data;

  return (
    <AppProvider embedded apiKey={apiKey}>
      <BillingExitProvider plansUrl={plansUrl}>
        {/* Always show desk nav — empty states live on pages.
            Do not hide tabs when Your store (Sample off); that felt broken.
            period + shot stay on every tab so the date slicer matches. */}
        <s-app-nav>
          {DESK_PRIMARY_NAV.map((item) => (
            <s-link
              key={item.path}
              href={deskNavHrefFromSearch(item.path, searchParams)}
            >
              {item.label}
            </s-link>
          ))}
        </s-app-nav>
        <DataModeBar
          useSampleDesk={useSampleDesk}
          samplePreviewAllowed={samplePreviewAllowed}
          shotMode={shotMode}
        />
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
