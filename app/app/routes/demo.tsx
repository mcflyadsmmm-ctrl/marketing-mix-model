import type { HeadersFunction, LinksFunction, LoaderFunctionArgs, MetaFunction } from "react-router";
import { Link, Outlet, useLoaderData, useRouteError } from "react-router";

import { DataModeBar } from "../components/DataModeBar";
import { DeskDrillProvider } from "../components/DeskDrill";
import { DeskTopTabs } from "../components/DeskTopTabs";
import { MerchantErrorRecovery } from "../components/MerchantErrorRecovery";
import { DeskCurrencyContext } from "../lib/desk-currency";
import { PUBLIC_SAMPLE_CURRENCY } from "../lib/public-sample-constants";
import { publicDemoHeaders } from "../lib/public-demo-headers";
import deskStyles from "../styles/mcfly-desk.css?url";
import publicDemoStyles from "../styles/public-demo.css?url";

const LISTING = "https://apps.shopify.com/mcfly-analytics-public";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: deskStyles },
  { rel: "stylesheet", href: publicDemoStyles },
];

export const meta: MetaFunction = () => [
  { title: "Full Sample shop demo | Mcfly Analytics" },
  {
    name: "description",
    content:
      "Same Mcfly Analytics desk as the Shopify app, on Sample shop. No install. Typical order, returning dollars, YoY, Total ROAS. Not a live client.",
  },
];

export const headers: HeadersFunction = () => publicDemoHeaders();

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  return {
    shotMode: url.searchParams.get("shot") === "1",
    embed: url.searchParams.get("embed")?.trim() || null,
    hosted: url.searchParams.get("hosted") === "1",
  };
};

export default function PublicDemoLayout() {
  const { shotMode, embed, hosted } = useLoaderData<typeof loader>();
  const className = [
    "mcfly-public-desk",
    embed ? "mcfly-public-desk--embed" : null,
    hosted ? "mcfly-public-desk--hosted" : null,
    shotMode ? "mcfly-public-desk--shot" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <DeskCurrencyContext.Provider value={PUBLIC_SAMPLE_CURRENCY}>
      <div className={className}>
        {!shotMode && !embed ? (
          <div className="mcfly-public-install">
            <p className="mcfly-public-install__note">
              Sample shop · same desk as the Shopify app · not a live client
            </p>
            <a className="mcfly-public-install__cta" href={LISTING} rel="noopener noreferrer">
              Install
            </a>
          </div>
        ) : null}
        <DataModeBar
          useSampleDesk
          shotMode={shotMode}
          sampleOnlyFreeze
        />
        <DeskTopTabs shotMode={shotMode} includeSettings />
        <DeskDrillProvider>
          <Outlet />
        </DeskDrillProvider>
      </div>
    </DeskCurrencyContext.Provider>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <main style={{ padding: "2rem 1rem" }}>
      <MerchantErrorRecovery error={error} retryHref="/demo" />
      <p>
        <Link to="/demo">Back to the demo</Link>
      </p>
    </main>
  );
}
