import type { LoaderFunctionArgs } from "react-router";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
} from "react-router";
import { MerchantErrorRecovery } from "./components/MerchantErrorRecovery";

import { hasShopifySessionContext } from "../scripts/shopify-app-path.mjs";
import { isPublicOriginPath } from "./lib/public-origin";

/**
 * App Bridge + api-key meta only when Shopify already supplied a session
 * (Admin Open app / install / billing return) or on /auth for OAuth.
 * A public curl of the App URL `/app` must NOT load App Bridge — the script
 * 410s outside an Admin iframe and the listing host looks broken.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\.data$/, "");
  const isAuth = path === "/auth" || path.startsWith("/auth");
  const loadAppBridge =
    !isPublicOriginPath(path) &&
    (hasShopifySessionContext(request) || isAuth);

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    loadAppBridge,
  };
};

export default function App() {
  const { apiKey, loadAppBridge } = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {loadAppBridge && apiKey ? (
          <meta name="shopify-api-key" content={apiKey} />
        ) : null}
        {loadAppBridge ? (
          <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
        ) : null}
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500;600&family=Source+Sans+3:wght@400;500;600;700&display=swap"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Mcfly Analytics</title>
        <Meta />
        <Links />
      </head>
      <body>
        <MerchantErrorRecovery error={error} retryHref="/" />
        <Scripts />
      </body>
    </html>
  );
}
