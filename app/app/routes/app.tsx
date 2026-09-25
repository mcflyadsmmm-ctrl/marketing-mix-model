import type { HeadersFunction, LinksFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { MerchantErrorRecovery } from "../components/MerchantErrorRecovery";
import {
  decorateShopifyBoundaryError,
  shouldDelegateShopifyBoundary,
} from "../lib/merchant-error-recovery";

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
  hydrateSampleOnlyFreeze,
  isSampleOnlyFreeze,
} from "../lib/sample-desk.server";
import { DeskCurrencyContext } from "../lib/desk-currency";
import { deskPaintCurrency } from "../lib/spend-money";
import { DeskDrillProvider } from "../components/DeskDrill";
import { DeskTopTabs } from "../components/DeskTopTabs";
import { DataModeBar } from "../components/DataModeBar";
import { BillingExitProvider } from "../lib/billing-exit-context";
import { isBillingEnabled } from "../lib/billing-flag.server";
import {
  buildManagedPricingPlansUrl,
  syncShopProFromShopify,
} from "../lib/billing.server";
import { deskNavHrefFromSearch, DESK_PRIMARY_NAV } from "../lib/desk-nav";
import { deskShellShouldRevalidate } from "../lib/desk-tab-flow";
import { deskNavLabel, liveDeskNavState } from "../lib/live-desk-surface";
import { resolveLiveUnparkStage } from "../lib/live-unpark";
import { shopLiveIngestDepth } from "../lib/live-ingest-depth.server";
import { DeskPeriodChrome } from "../components/DeskPeriodChrome";
import { OriginShell } from "./_index/OriginShell";
import originStyles from "./_index/styles.module.css";
import deskStyles from "../styles/mcfly-desk.css?url";
import scoreboardStyles from "../styles/enterprise-scoreboard.css?url";

const PUBLIC_APP = {
  kind: "public" as const,
  apiKey: "",
  useSampleDesk: false,
  sampleOnlyFreeze: false,
  shotMode: false,
  plansUrl: null as string | null,
  shop: null as string | null,
  currencyCode: "USD",
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
  { rel: "stylesheet", href: scoreboardStyles },
];

export const shouldRevalidate = deskShellShouldRevalidate;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Public tab / curl: never 410. 410 hydrates React Router, fetches /app.data,
  // and throws "Unable to decode turbo-stream response".
  const url = new URL(request.url);
  if (!hasShopifySessionContext(request)) {
    return { ...PUBLIC_APP, shop: url.searchParams.get("shop") };
  }
  let session;
  let admin;
  try {
    ({ session, admin } = await authenticate.admin(request));
  } catch (error) {
    if (isGoneResponse(error) && !isEmbeddedAdminRequest(request)) {
      return { ...PUBLIC_APP, shop: url.searchParams.get("shop") };
    }
    throw error;
  }
  const shop = await ensureShop(session.shop);
  if (isBillingEnabled()) {
    try {
      await syncShopProFromShopify(admin, shop.id);
    } catch {
      // Cached subscription stands when Partner or Admin billing is down.
    }
  }
  await getOrCreateSettings(shop.id);
  await hydrateSampleOnlyFreeze(shop.id);
  const shotMode = url.searchParams.get("shot") === "1";
  const useSampleDesk = await getSampleDeskEnabled(shop.id);
  const sampleOnlyFreeze = isSampleOnlyFreeze();
  const liveDeskNav = liveDeskNavState({
    sampleDesk: useSampleDesk,
    stage: resolveLiveUnparkStage(),
  });
  const orderBookDepth = useSampleDesk
    ? ("paid_full" as const)
    : await shopLiveIngestDepth(shop.id);

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
    sampleOnlyFreeze,
    liveDeskNav,
    orderBookDepth,
    shotMode,
    plansUrl,
    currencyCode: deskPaintCurrency(shop.currencyCode, {
      sampleOn: useSampleDesk,
    }),
  };
};

export default function App() {
  const data = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  if (data.kind === "public") {
    return (
      <OriginShell>
        <main id="main" className={originStyles.article}>
          <MerchantErrorRecovery
            error={{ status: 410 }}
            retryHref="/app"
            shop={data.shop}
          />
        </main>
      </OriginShell>
    );
  }

  const {
    apiKey,
    useSampleDesk,
    sampleOnlyFreeze,
    liveDeskNav,
    orderBookDepth,
    shotMode,
    plansUrl,
    currencyCode,
  } = data;

  return (
    <AppProvider embedded apiKey={apiKey}>
      <DeskCurrencyContext.Provider value={currencyCode}>
      <BillingExitProvider plansUrl={plansUrl}>
        {/* Admin nav: Orders, Spend, Goals, Customers, plus Settings. period + shot stay on every href. */}
        <s-app-nav>
          {DESK_PRIMARY_NAV.map((item) => (
            <s-link
              key={`${item.path}#${item.hash ?? ""}`}
              href={deskNavHrefFromSearch(item.path, searchParams, item.hash)}
            >
              {deskNavLabel(item, liveDeskNav)}
            </s-link>
          ))}
        </s-app-nav>
        <DataModeBar
          useSampleDesk={useSampleDesk}
          shotMode={shotMode}
          sampleOnlyFreeze={sampleOnlyFreeze}
        />
        <DeskTopTabs shotMode={shotMode} liveDeskNav={liveDeskNav} />
        <DeskPeriodChrome
          orderBookDepth={orderBookDepth}
          useSampleDesk={useSampleDesk}
          shotMode={shotMode}
        />
        <DeskDrillProvider>
          <Outlet />
        </DeskDrillProvider>
      </BillingExitProvider>
      </DeskCurrencyContext.Provider>
    </AppProvider>
  );
}

// Shopify headers still go out via `headers`. 401 / reauth stay on Shopify's
// iframe-exit path. 410 and other failures get a merchant recovery, not
// "Handling response".
export function ErrorBoundary() {
  const error = useRouteError();
  if (shouldDelegateShopifyBoundary(error)) {
    return boundary.error(decorateShopifyBoundaryError(error));
  }
  return <MerchantErrorRecovery error={error} retryHref="/app" />;
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
