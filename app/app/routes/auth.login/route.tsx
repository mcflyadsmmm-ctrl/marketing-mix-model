import { AppProvider } from "@shopify/shopify-app-react-router/react";
import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";

import { login } from "../../shopify.server";
import { isShopifyEmbeddedSearch } from "../../../scripts/shopify-app-path.mjs";
import { loginErrorMessage } from "./error.server";

/**
 * App Store 2.3.1: do not collect shop domains for install.
 * When Shopify sends ?shop=, start OAuth via `login()` — do not bounce to
 * `/app`, which 410s without a session token and breaks turbo-stream.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop")?.trim();
  if (shop) {
    const errors = loginErrorMessage(await login(request));
    return { errors };
  }
  if (isShopifyEmbeddedSearch(url.searchParams)) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  return { errors: {} };
};

export default function AuthLoginRedirect() {
  const data = useLoaderData<typeof loader>();
  const message =
    data &&
    typeof data === "object" &&
    "errors" in data &&
    data.errors?.shop
      ? data.errors.shop
      : "Mcfly Analytics installs from the Shopify App Store.";

  return (
    <AppProvider embedded={false}>
      <s-page>
        <s-section heading="Install from Shopify">
          <s-paragraph>{message}</s-paragraph>
          <s-link href="/">Back to Mcfly Analytics</s-link>
        </s-section>
      </s-page>
    </AppProvider>
  );
}
